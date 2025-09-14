import Papa from 'papaparse';
import { stringify } from 'csv-stringify/sync';
import { CriteriaItem, Assessment } from '@/types';

export function parseCriteriaCSV(csvContent: string): CriteriaItem[] {
  const result = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => {
      // Handle Japanese and English header variations
      const headerMap: Record<string, string> = {
        // English headers (legacy)
        'item_id': 'itemId',
        'itemid': 'itemId',
        'item_name': 'itemName',
        'itemname': 'itemName',
        'category': 'category',
        'definition': 'definition',
        'description': 'definition',
        // Japanese headers
        'カテゴリ': 'category',
        'チェック項目': 'itemName',
        '詳細基準/望ましい水準': 'definition',
        '参考規格・法令': 'referenceStandards',
        '証拠/確認ソース（例）': 'evidenceSources',
        '未達時の主なリスク': 'risks',
      };
      return headerMap[header] || headerMap[header.toLowerCase()] || header;
    },
  });

  if (result.errors.length > 0) {
    throw new Error(`CSV parsing error: ${result.errors[0].message}`);
  }

  const items: CriteriaItem[] = [];
  let itemIdCounter = 1;

  for (const row of result.data) {
    if (!row.itemName || !row.category || !row.definition) {
      throw new Error('Missing required fields in CSV row (itemName, category, definition)');
    }

    // Generate itemId if not provided (for Japanese CSV format)
    const itemId = row.itemId || `item_${itemIdCounter.toString().padStart(3, '0')}`;
    itemIdCounter++;

    items.push({
      itemId,
      itemName: row.itemName,
      category: row.category,
      definition: row.definition,
      referenceStandards: row.referenceStandards || undefined,
      evidenceSources: row.evidenceSources || undefined,
      risks: row.risks || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  return items;
}

export function generateAssessmentCSV(assessment: Assessment): string {
  const rows: any[] = [];

  for (const rating of assessment.ratings) {
    rows.push({
      assessmentId: assessment.id,
      createdAt: assessment.createdAt,
      targetType: assessment.targetType,
      name: assessment.name,
      version: assessment.version || '',
      provider: assessment.provider || '',
      category: rating.category,
      itemId: rating.itemId,
      itemName: rating.itemName,
      score: rating.score || '',
      triState: rating.triState,
      reason: rating.reason,
      pageRefs: rating.evidence.pages.map(p => `p.${p.page}`).join(';'),
    });
  }

  return stringify(rows, {
    header: true,
    columns: [
      'assessmentId',
      'createdAt',
      'targetType',
      'name',
      'version',
      'provider',
      'category',
      'itemId',
      'itemName',
      'score',
      'triState',
      'reason',
      'pageRefs',
    ],
  });
}