import { ulid } from 'ulid';
import { TriState } from '@/types';

export function generateId(): string {
  return ulid();
}

export function scoreToTriState(score: number | null): TriState {
  if (score === null) return '不明';
  if (score >= 4) return '達成';
  if (score === 3) return '部分';
  return '未達成';
}

export function calculateMetrics(ratings: { score: number | null; triState: TriState }[]) {
  const validScores = ratings.filter(r => r.score !== null).map(r => r.score!);
  const achievedCount = ratings.filter(r => r.triState === '達成').length;
  const partialCount = ratings.filter(r => r.triState === '部分').length;
  const failedCount = ratings.filter(r => r.triState === '未達成').length;
  const unknownCount = ratings.filter(r => r.triState === '不明').length;

  const totalKnown = achievedCount + partialCount + failedCount;
  const achievedRate = totalKnown > 0 ? (achievedCount / totalKnown) * 100 : 0;
  const scoreAvg = validScores.length > 0
    ? validScores.reduce((a, b) => a + b, 0) / validScores.length
    : 0;

  return {
    achievedRate: Math.round(achievedRate * 10) / 10,
    unknownCount,
    scoreAvg: Math.round(scoreAvg * 10) / 10,
  };
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}