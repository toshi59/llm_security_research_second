import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
import { redis, getFileFromChunks } from '@/lib/redis';
import { evaluateWithGemini } from '@/lib/gemini';
import { parsePDF } from '@/utils/pdf';
import { generateId, calculateMetrics } from '@/utils/helpers';
import { Assessment, CriteriaItem, FileInfo } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { targetType, name, version, provider, notes, files } = body;

    // Get current criteria from Redis
    const criteria = await redis.get('criteria:current') as CriteriaItem[];
    if (!criteria || criteria.length === 0) {
      return NextResponse.json(
        { error: 'No criteria found. Please upload criteria CSV first.' },
        { status: 400 }
      );
    }

    // Process all PDF files
    const allPages: any[] = [];
    const fileInfos: FileInfo[] = [];

    for (const file of files) {
      const buffer = await getFileFromChunks(file.fileId);
      if (!buffer) {
        return NextResponse.json(
          { error: `File not found: ${file.fileId}` },
          { status: 404 }
        );
      }

      const pdfData = await parsePDF(buffer);
      allPages.push(...pdfData.pages);

      fileInfos.push({
        fileId: file.fileId,
        filename: file.filename,
        size: file.size,
        pageCount: file.pageCount,
      });
    }

    // Evaluate with Gemini
    const evaluation = await evaluateWithGemini(criteria, allPages, {
      targetType,
      name,
      version,
      provider,
    });

    // Calculate metrics
    const metrics = calculateMetrics(evaluation.items);

    // Create assessment
    const assessment: Assessment = {
      id: generateId(),
      createdAt: new Date().toISOString(),
      targetType,
      name,
      version,
      provider,
      notes,
      files: fileInfos,
      metrics,
      overall: evaluation.overall,
      ratings: evaluation.items,
    };

    // Save to Redis
    await redis.set(`assessment:${assessment.id}`, assessment, {
      ex: 86400 * 90, // 90 days TTL
    });

    return NextResponse.json(assessment);
  } catch (error) {
    console.error('Assessment creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create assessment' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Get all assessment keys
    const keys = await redis.keys('assessment:*');

    // Fetch all assessments
    const assessments: Assessment[] = [];
    for (const key of keys) {
      const assessment = await redis.get(key) as Assessment;
      if (assessment) {
        assessments.push(assessment);
      }
    }

    // Filter by search
    let filtered = assessments;
    if (search) {
      filtered = assessments.filter(
        a => a.name.toLowerCase().includes(search.toLowerCase()) ||
             a.targetType.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let compareValue = 0;
      switch (sortBy) {
        case 'createdAt':
          compareValue = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'name':
          compareValue = a.name.localeCompare(b.name);
          break;
        case 'achievedRate':
          compareValue = a.metrics.achievedRate - b.metrics.achievedRate;
          break;
        default:
          compareValue = 0;
      }
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    // Paginate
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginated = filtered.slice(start, end);

    return NextResponse.json({
      assessments: paginated,
      total: filtered.length,
      page,
      limit,
      totalPages: Math.ceil(filtered.length / limit),
    });
  } catch (error) {
    console.error('Failed to fetch assessments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessments' },
      { status: 500 }
    );
  }
}