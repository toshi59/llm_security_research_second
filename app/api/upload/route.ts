import { NextRequest, NextResponse } from 'next/server';
import { parseDocument } from '@/utils/document';
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
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword' // .doc
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only PDF and Word files are allowed' },
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

    // Parse document to get page count
    const documentData = await parseDocument(buffer, file.type);

    // Validate page count (1000 pages limit)
    if (documentData.totalPages > 1000) {
      return NextResponse.json(
        { error: 'Document exceeds 1000 pages limit' },
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
      pages: documentData.totalPages,
    });

    return NextResponse.json({
      success: true,
      fileId,
      filename: file.name,
      size: file.size,
      pageCount: documentData.totalPages,
      pages: documentData.pages,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}