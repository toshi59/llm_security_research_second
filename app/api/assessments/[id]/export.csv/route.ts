import { NextRequest, NextResponse } from 'next/server';
import { generateAssessmentCSV } from '@/utils/csv';
import { Assessment } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Lazy import to avoid build-time initialization
const getRedis = async () => {
  const { redis } = await import('@/lib/redis');
  return redis;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const redis = await getRedis();
    const assessment = await redis.get(`assessment:${id}`) as Assessment;

    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    const csv = generateAssessmentCSV(assessment);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="assessment_${id}_${assessment.name.replace(/[^a-zA-Z0-9]/g, '_')}.csv"`,
      },
    });
  } catch (error) {
    console.error('Failed to export assessment:', error);
    return NextResponse.json(
      { error: 'Failed to export assessment' },
      { status: 500 }
    );
  }
}