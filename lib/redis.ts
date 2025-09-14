import { Redis } from '@upstash/redis';

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error('Missing Upstash Redis environment variables');
}

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const CHUNK_SIZE = 900000; // 900KB per chunk

export async function saveFileInChunks(
  fileId: string,
  buffer: Buffer,
  metadata: {
    filename: string;
    type: string;
    pages: number;
  }
) {
  const chunks = Math.ceil(buffer.length / CHUNK_SIZE);

  // Save chunks
  for (let i = 0; i < chunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, buffer.length);
    const chunk = buffer.slice(start, end);

    await redis.set(
      `filechunk:${fileId}:${i}`,
      chunk.toString('base64'),
      { ex: 86400 * 30 } // 30 days TTL
    );
  }

  // Save manifest
  await redis.set(
    `file:${fileId}`,
    {
      filename: metadata.filename,
      size: buffer.length,
      type: metadata.type,
      chunkSize: CHUNK_SIZE,
      chunks,
      sha256: '', // Can be added if needed
      pages: metadata.pages,
    },
    { ex: 86400 * 30 }
  );

  return { fileId, chunks };
}

export async function getFileFromChunks(fileId: string): Promise<Buffer | null> {
  const manifest = await redis.get(`file:${fileId}`);
  if (!manifest) return null;

  const { chunks } = manifest as { chunks: number };
  const buffers: Buffer[] = [];

  for (let i = 0; i < chunks; i++) {
    const chunkData = await redis.get(`filechunk:${fileId}:${i}`);
    if (!chunkData) return null;

    buffers.push(Buffer.from(chunkData as string, 'base64'));
  }

  return Buffer.concat(buffers);
}