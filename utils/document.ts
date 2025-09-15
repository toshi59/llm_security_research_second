import pdf from 'pdf-parse';
import mammoth from 'mammoth';

export interface DocumentPage {
  pageNumber: number;
  text: string;
}

export interface DocumentData {
  pages: DocumentPage[];
  totalPages: number;
  info: any;
}

export async function parseDocument(buffer: Buffer, mimeType: string): Promise<DocumentData> {
  if (mimeType === 'application/pdf') {
    return parsePDF(buffer);
  } else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) {
    return parseWord(buffer);
  } else {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }
}

async function parsePDF(buffer: Buffer): Promise<DocumentData> {
  try {
    const data = await pdf(buffer);

    // Split text by potential page breaks (heuristic)
    const fullText = data.text || '';
    const pageTexts = fullText.split(/\n\s*\n\s*\n/); // Split by double line breaks

    const pages: DocumentPage[] = pageTexts.map((text, index) => ({
      pageNumber: index + 1,
      text: text.trim(),
    })).filter(page => page.text.length > 0);

    // If no meaningful splits, create a single page
    if (pages.length === 0) {
      pages.push({
        pageNumber: 1,
        text: fullText,
      });
    }

    return {
      pages,
      totalPages: data.numpages || pages.length,
      info: data.info || {},
    };
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error('PDFの解析に失敗しました');
  }
}

async function parseWord(buffer: Buffer): Promise<DocumentData> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    const fullText = result.value || '';

    // Split Word document text into logical sections
    // Word doesn't have explicit pages, so we split by headings or paragraphs
    const sections = fullText.split(/\n\n+/);

    // Group sections into pages (approximate 3000 characters per page)
    const pages: DocumentPage[] = [];
    let currentPage = '';
    let pageNumber = 1;

    for (const section of sections) {
      if (currentPage.length + section.length > 3000 && currentPage.length > 0) {
        pages.push({
          pageNumber: pageNumber++,
          text: currentPage.trim(),
        });
        currentPage = section;
      } else {
        currentPage += (currentPage ? '\n\n' : '') + section;
      }
    }

    // Add the last page
    if (currentPage.trim().length > 0) {
      pages.push({
        pageNumber: pageNumber,
        text: currentPage.trim(),
      });
    }

    // If no pages created, add all text as single page
    if (pages.length === 0) {
      pages.push({
        pageNumber: 1,
        text: fullText,
      });
    }

    return {
      pages,
      totalPages: pages.length,
      info: {
        type: 'Word Document',
        messages: result.messages || []
      },
    };
  } catch (error) {
    console.error('Word parsing error:', error);
    throw new Error('Word文書の解析に失敗しました');
  }
}

export function extractRelevantPages(
  pages: DocumentPage[],
  keywords: string[],
  maxPages: number = 10
): DocumentPage[] {
  const relevantPages: { page: DocumentPage; score: number }[] = [];

  for (const page of pages) {
    let score = 0;
    const lowerText = page.text.toLowerCase();

    for (const keyword of keywords) {
      const lowerKeyword = keyword.toLowerCase();
      const matches = (lowerText.match(new RegExp(lowerKeyword, 'g')) || []).length;
      score += matches;
    }

    if (score > 0) {
      relevantPages.push({ page, score });
    }
  }

  // Sort by relevance score and return top pages
  relevantPages.sort((a, b) => b.score - a.score);
  return relevantPages.slice(0, maxPages).map(r => r.page);
}

export function truncateText(text: string, maxLength: number = 300): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}