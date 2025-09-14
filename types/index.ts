export type TargetType = "LLM" | "SaaS";

export type TriState = "達成" | "未達成" | "部分" | "不明";

export interface CriteriaItem {
  itemId: string;
  itemName: string;
  category: string;
  definition: string;
  referenceStandards?: string;
  evidenceSources?: string;
  risks?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PageEvidence {
  page: number;
  quote: string;
}

export interface Evidence {
  pages: PageEvidence[];
  confidence: number;
}

export interface AssessmentItemRating {
  itemId: string;
  itemName: string;
  category: string;
  score: 1 | 2 | 3 | 4 | 5 | null;
  triState: TriState;
  reason: string;
  evidence: Evidence;
}

export interface FileInfo {
  fileId: string;
  filename: string;
  size: number;
  pageCount: number;
}

export interface FileManifest {
  filename: string;
  size: number;
  type: string;
  chunkSize: number;
  chunks: number;
  sha256: string;
  pages: number;
}

export interface Overall {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  risks: string[];
  recommendations: string[];
}

export interface Metrics {
  achievedRate: number;
  unknownCount: number;
  scoreAvg: number;
}

export interface Assessment {
  id: string;
  createdAt: string;
  targetType: TargetType;
  name: string;
  version?: string;
  provider?: string;
  notes?: string;
  files: FileInfo[];
  metrics: Metrics;
  overall: Overall;
  ratings: AssessmentItemRating[];
}

export interface GeminiResponse {
  overall: Overall;
  items: AssessmentItemRating[];
}

export interface CriteriaMeta {
  version: string;
  updatedAt: string;
}