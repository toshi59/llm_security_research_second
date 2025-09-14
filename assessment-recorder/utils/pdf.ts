import pdf from 'pdf-parse';

export interface PDFPage {
  pageNumber: number;
  text: string;
}

export interface PDFData {
  pages: PDFPage[];
  totalPages: number;
  info: any;
}

export async function parsePDF(buffer: Buffer): Promise<PDFData> {
  try {
    // Simple PDF text extraction without page-by-page parsing
    const data = await pdf(buffer);

    // Split text by potential page breaks (heuristic)
    const fullText = data.text || '';
    const pageTexts = fullText.split(/\n\s*\n\s*\n/); // Split by double line breaks

    const pages: PDFPage[] = pageTexts.map((text, index) => ({
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

export function extractRelevantPages(
  pages: PDFPage[],
  keywords: string[],
  maxPages: number = 10
): PDFPage[] {
  const relevantPages: { page: PDFPage; score: number }[] = [];

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