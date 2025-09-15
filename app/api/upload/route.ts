import { NextRequest, NextResponse } from 'next/server';
import { parsePDF } from '@/utils/pdf';
import { generateId } from '@/utils/helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (100MB limit)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 100MB limit' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse PDF to get page count
    const pdfData = await parsePDF(buffer);

    // Validate page count (1000 pages limit)
    if (pdfData.totalPages > 1000) {
      return NextResponse.json(
        { error: 'PDF exceeds 1000 pages limit' },
        { status: 400 }
      );
    }

    // Generate unique file ID
    const fileId = generateId();

    // Lazy import Redis to avoid build-time initialization
    const { saveFileInChunks } = await import('@/lib/redis');
    
    // Save file in chunks to Redis
    await saveFileInChunks(fileId, buffer, {
      filename: file.name,
      type: file.type,
      pages: pdfData.totalPages,
    });

    return NextResponse.json({
      success: true,
      fileId,
      filename: file.name,
      size: file.size,
      pageCount: pdfData.totalPages,
      pages: pdfData.pages,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}