import { NextRequest, NextResponse } from 'next/server';
import { parseCriteriaCSV } from '@/utils/csv';
import { CriteriaItem, CriteriaMeta } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { redis } = await import('@/lib/redis');
    const criteria = await redis.get('criteria:current') as CriteriaItem[];
    const meta = await redis.get('criteria:meta') as CriteriaMeta;

    return NextResponse.json({
      criteria: criteria || [],
      meta: meta || null,
    });
  } catch (error) {
    console.error('Failed to fetch criteria:', error);
    return NextResponse.json(
      { error: 'Failed to fetch criteria' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Read CSV content
    const text = await file.text();

    // Parse CSV
    let criteria: CriteriaItem[];
    try {
      criteria = parseCriteriaCSV(text);
    } catch (error: unknown) {
      return NextResponse.json(
        { error: `CSV parsing error: ${error instanceof Error ? error.message : 'Unknown error'}` },
        { status: 400 }
      );
    }

    // Save to Redis
    const { redis } = await import('@/lib/redis');
    await redis.set('criteria:current', criteria);

    const meta: CriteriaMeta = {
      version: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await redis.set('criteria:meta', meta);

    return NextResponse.json({
      success: true,
      count: criteria.length,
      criteria,
      meta,
    });
  } catch (error) {
    console.error('Failed to upload criteria:', error);
    return NextResponse.json(
      { error: 'Failed to upload criteria' },
      { status: 500 }
    );
  }
}