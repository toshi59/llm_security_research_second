import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { CriteriaItem, GeminiResponse, PDFPage, TargetType } from '@/types';
// Note: Utility functions available but not used in this file

if (!process.env.GOOGLE_API_KEY) {
  throw new Error('Missing GOOGLE_API_KEY environment variable');
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const GeminiResponseSchema = z.object({
  overall: z.object({
    summary: z.string(),
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    risks: z.array(z.string()),
    recommendations: z.array(z.string()),
  }),
  items: z.array(
    z.object({
      itemId: z.string(),
      itemName: z.string(),
      category: z.string(),
      score: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.null()]),
      triState: z.enum(['達成', '未達成', '部分', '不明']),
      reason: z.string(),
      evidence: z.object({
        pages: z.array(
          z.object({
            page: z.number(),
            quote: z.string(),
          })
        ),
        confidence: z.number().min(0).max(1),
      }),
    })
  ),
});

export async function evaluateWithGemini(
  criteria: CriteriaItem[],
  pdfPages: PDFPage[],
  targetInfo: {
    targetType: TargetType;
    name: string;
    version?: string;
    provider?: string;
  }
): Promise<GeminiResponse> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      temperature: 0.1,
      topK: 1,
      topP: 0.95,
      maxOutputTokens: 32768,
      responseMimeType: 'application/json'
    },
  });

  const systemPrompt = `あなたはコンプライアンス重視のアセッサーです。以下の厳格なルールに従って評価してください：

1. PDFの明示的記載のみに基づいて評価する
2. 推測や外部情報の参照は禁止
3. 根拠が不十分な場合は必ず「不明」と評価
4. 各評価には必ずページ番号と引用を含める（最大300文字）
5. 根拠が見つからない場合は理由を「記載なしのため不明」とする

評価スケール：
- 5 = 完全達成：要件を100%満たしている
- 4 = ほぼ達成：要件の80%以上を満たしている
- 3 = 一部達成：要件の40-60%を満たしている
- 2 = ほぼ未達：要件の20%程度しか満たしていない
- 1 = 未達成：要件をほとんど満たしていない
- null = 不明：PDFに記載がない、または判断材料が不足

3値マッピング：
- 5,4 → 達成
- 3 → 部分
- 2,1 → 未達成
- 0 → 不明（nullの代替値）

出力形式：以下のスキーマに完全に従った厳密なJSON（他の形式は禁止）

必須JSON構造:
{
  "overall": {
    "summary": "簡潔な総評（200字以内）",
    "strengths": ["強み1（50字以内）", "強み2（50字以内）"],
    "weaknesses": ["弱み1（50字以内）", "弱み2（50字以内）"],
    "risks": ["リスク1（50字以内）", "リスク2（50字以内）"],
    "recommendations": ["推奨1（50字以内）", "推奨2（50字以内）"]
  },
  "items": [
    {
      "itemId": "item_001",
      "itemName": "評価項目名",
      "category": "カテゴリ名",
      "score": 3,
      "triState": "部分",
      "reason": "簡潔な理由（100字以内）",
      "evidence": {
        "pages": [{"page": 1, "quote": "関連する引用（150字以内）"}],
        "confidence": 0.8
      }
    }
  ]
}

IMPORTANT:
1. この構造以外のJSONは絶対に返さないこと
2. JSONは必ず完全で構文的に正しくすること
3. コメントや説明は一切含めないこと
4. レスポンスはJSONのみとすること
5. 末尾の配列・オブジェクトに余計なカンマを入れないこと`;

  const pdfContent = pdfPages
    .map(page => `[ページ ${page.pageNumber}]\n${page.text}`)
    .join('\n\n---\n\n');

  const criteriaContext = criteria
    .map(item => `
ID: ${item.itemId}
名称: ${item.itemName}
カテゴリ: ${item.category}
評価要件: ${item.definition}`)
    .join('\n\n');

  const userPrompt = `
対象情報:
- 種別: ${targetInfo.targetType}
- 名称: ${targetInfo.name}
${targetInfo.version ? `- バージョン: ${targetInfo.version}` : ''}
${targetInfo.provider ? `- プロバイダー: ${targetInfo.provider}` : ''}

評価観点（${criteria.length}項目）:
${criteriaContext}

PDF内容:
${pdfContent}

上記の内容に基づいて、各観点を厳格に評価し、総評を含めたJSON形式で出力してください。`;

  try {
    const result = await model.generateContent([systemPrompt, userPrompt]);
    const response = await result.response;
    const text = response.text();

    console.log('Raw Gemini response:', text.substring(0, 500) + '...');

    let parsedResponse: unknown;
    try {
      parsedResponse = JSON.parse(text);
    } catch {
      console.log('JSON parse failed, attempting extraction...');
      try {
        // Try to extract JSON with multiple patterns
        let jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
        if (!jsonMatch) {
          // Look for complete JSON object
          const startIndex = text.indexOf('{');
          const lastIndex = text.lastIndexOf('}');
          if (startIndex !== -1 && lastIndex !== -1 && lastIndex > startIndex) {
            jsonMatch = [text.substring(startIndex, lastIndex + 1)];
          }
        }

        if (jsonMatch) {
          const cleanJson = jsonMatch[1] || jsonMatch[0];
          console.log('Extracted JSON length:', cleanJson.length);
          console.log('Extracted JSON preview:', cleanJson.substring(0, 300) + '...');

          // Try to fix common JSON issues
          let fixedJson = cleanJson;

          // Remove trailing commas before closing brackets
          fixedJson = fixedJson.replace(/,(\s*[}\]])/g, '$1');

          // Try to auto-complete truncated JSON
          const openBraces = (fixedJson.match(/\{/g) || []).length;
          const closeBraces = (fixedJson.match(/\}/g) || []).length;
          const openBrackets = (fixedJson.match(/\[/g) || []).length;
          const closeBrackets = (fixedJson.match(/\]/g) || []).length;

          // Add missing closing braces/brackets
          for (let i = 0; i < openBraces - closeBraces; i++) {
            fixedJson += '}';
          }
          for (let i = 0; i < openBrackets - closeBrackets; i++) {
            fixedJson += ']';
          }

          // Remove incomplete trailing entries (common with truncation)
          fixedJson = fixedJson.replace(/,\s*$/, '');

          parsedResponse = JSON.parse(fixedJson);
        } else {
          console.error('No JSON found in response:', text);
          throw new Error('Failed to extract JSON from response');
        }
      } catch (innerError) {
        console.error('JSON extraction also failed:', innerError);
        throw new Error(`JSON parsing failed: ${innerError}`);
      }
    }

    // Validate the structure before Zod parsing
    const responseData = parsedResponse as { overall?: unknown; items?: unknown[] };
    if (!responseData.overall || !responseData.items) {
      console.error('Missing required fields in response:', Object.keys(parsedResponse as object));
      throw new Error('Response missing overall or items fields');
    }

    // Clean up response data before Zod validation
    if (responseData.items) {
      responseData.items = responseData.items.map((item: unknown) => {
        // Convert score=0 to null
        const cleanedScore = (item as { score?: number }).score === 0 ? null : (item as { score?: number }).score;

        // Normalize triState values
        let cleanedTriState = (item as { triState?: string }).triState;
        if (typeof cleanedTriState === 'string') {
          // Remove any extra characters and normalize
          cleanedTriState = cleanedTriState.trim().replace(/[\"\']/g, '');

          // Map variations to standard values
          const triStateMap: { [key: string]: string } = {
            '達成': '達成',
            '未達成': '未達成',
            '部分': '部分',
            '不明': '不明',
            '達成済': '達成',
            '未達': '未達成',
            '部分達成': '部分',
            '不明確': '不明',
            'unknown': '不明',
            'achieved': '達成',
            'not_achieved': '未達成',
            'partial': '部分'
          };

          cleanedTriState = triStateMap[cleanedTriState] || '不明';
        } else {
          cleanedTriState = '不明';
        }

        return {
          ...(item as object),
          score: cleanedScore,
          triState: cleanedTriState
        };
      });
    }

    // Validate with Zod
    let validatedResponse;
    try {
      validatedResponse = GeminiResponseSchema.parse(responseData);
    } catch (zodError) {
      console.error('Zod validation error details:', zodError);
      if (responseData.items) {
        console.log('Items with potential issues:');
        responseData.items.forEach((item: unknown, index: number) => {
          const itemData = item as { itemId?: string; triState?: string; score?: number };
          console.log(`Item ${index} (${itemData.itemId}):`, {
            triState: itemData.triState,
            triStateType: typeof itemData.triState,
            score: itemData.score,
            scoreType: typeof itemData.score
          });
        });
      }
      throw zodError;
    }

    // Ensure all criteria are evaluated
    const evaluatedIds = new Set(validatedResponse.items.map(item => item.itemId));
    for (const criterion of criteria) {
      if (!evaluatedIds.has(criterion.itemId)) {
        validatedResponse.items.push({
          itemId: criterion.itemId,
          itemName: criterion.itemName,
          category: criterion.category,
          score: null,
          triState: '不明',
          reason: '記載なしのため不明',
          evidence: {
            pages: [],
            confidence: 0,
          },
        });
      }
    }

    return validatedResponse;
  } catch (error) {
    console.error('Gemini API error:', error);

    // Fallback response with all items marked as unknown
    return {
      overall: {
        summary: 'エラーのため評価を完了できませんでした',
        strengths: [],
        weaknesses: [],
        risks: ['評価プロセスでエラーが発生しました'],
        recommendations: ['再評価を実施してください'],
      },
      items: criteria.map(item => ({
        itemId: item.itemId,
        itemName: item.itemName,
        category: item.category,
        score: null,
        triState: '不明' as const,
        reason: 'エラーのため評価できませんでした',
        evidence: {
          pages: [],
          confidence: 0,
        },
      })),
    };
  }
}