'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, FileDown, ChevronDown, ChevronUp } from 'lucide-react';
import { Assessment } from '@/types';
import { formatDate } from '@/utils/helpers';

export default function AssessmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (params.id) {
      fetchAssessment(params.id as string);
    }
  }, [params.id]);

  const fetchAssessment = async (id: string) => {
    try {
      const response = await fetch(`/api/assessments/${id}`);
      if (!response.ok) {
        throw new Error('評価が見つかりません');
      }
      const data = await response.json();
      setAssessment(data);

      // Initially expand all categories
      const categories = new Set(data.ratings.map((r: Assessment['ratings'][0]) => r.category)) as Set<string>;
      setExpandedCategories(categories);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : '評価の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const exportCSV = () => {
    if (!assessment) return;

    const link = document.createElement('a');
    link.href = `/api/assessments/${assessment.id}/export.csv`;
    link.download = `assessment_${assessment.name.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getScoreBadgeClass = (triState: string) => {
    switch (triState) {
      case '達成':
        return 'score-badge achieved';
      case '部分':
        return 'score-badge partial';
      case '未達成':
        return 'score-badge failed';
      default:
        return 'score-badge unknown';
    }
  };

  const getScoreDisplay = (score: number | null) => {
    if (score === null) return '?';
    return score.toString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error || '評価が見つかりません'}</p>
        <button onClick={() => router.push('/assessments')} className="btn-primary">
          評価一覧に戻る
        </button>
      </div>
    );
  }

  // Group ratings by category
  const ratingsByCategory = assessment.ratings.reduce((acc, rating) => {
    if (!acc[rating.category]) {
      acc[rating.category] = [];
    }
    acc[rating.category].push(rating);
    return acc;
  }, {} as Record<string, typeof assessment.ratings>);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/assessments')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{assessment.name}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <span className={`inline-flex px-2 py-1 rounded-full text-xs ${
                assessment.targetType === 'LLM'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {assessment.targetType}
              </span>
              {assessment.version && <span>バージョン: {assessment.version}</span>}
              {assessment.provider && <span>プロバイダー: {assessment.provider}</span>}
              <span>作成日時: {formatDate(assessment.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={exportCSV} className="btn-secondary flex items-center gap-2">
            <FileDown className="h-4 w-4" />
            CSVダウンロード
          </button>
        </div>
      </div>

      {/* Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <h3 className="font-medium text-gray-700">達成率</h3>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-2xl font-bold">{assessment.metrics.achievedRate.toFixed(1)}%</span>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${assessment.metrics.achievedRate}%` }}
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="font-medium text-gray-700">スコア平均</h3>
          <div className="mt-2">
            <span className="text-2xl font-bold">{assessment.metrics.scoreAvg.toFixed(1)}</span>
            <span className="text-gray-500 ml-1">/5.0</span>
          </div>
        </div>

        <div className="card">
          <h3 className="font-medium text-gray-700">不明項目数</h3>
          <div className="mt-2">
            <span className="text-2xl font-bold">{assessment.metrics.unknownCount}</span>
            <span className="text-gray-500 ml-1">項目</span>
          </div>
        </div>
      </div>

      {/* Overall Summary */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">総評</h2>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">概要</h3>
            <p className="text-gray-600 whitespace-pre-wrap">{assessment.overall.summary}</p>
          </div>

          {assessment.overall.strengths.length > 0 && (
            <div>
              <h3 className="font-semibold text-green-700 mb-2">強み</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                {assessment.overall.strengths.map((strength, index) => (
                  <li key={index}>{strength}</li>
                ))}
              </ul>
            </div>
          )}

          {assessment.overall.weaknesses.length > 0 && (
            <div>
              <h3 className="font-semibold text-red-700 mb-2">弱み</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                {assessment.overall.weaknesses.map((weakness, index) => (
                  <li key={index}>{weakness}</li>
                ))}
              </ul>
            </div>
          )}

          {assessment.overall.risks.length > 0 && (
            <div>
              <h3 className="font-semibold text-yellow-700 mb-2">リスク</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                {assessment.overall.risks.map((risk, index) => (
                  <li key={index}>{risk}</li>
                ))}
              </ul>
            </div>
          )}

          {assessment.overall.recommendations.length > 0 && (
            <div>
              <h3 className="font-semibold text-blue-700 mb-2">推奨事項</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                {assessment.overall.recommendations.map((recommendation, index) => (
                  <li key={index}>{recommendation}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Ratings by Category */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">観点別評価</h2>

        {Object.entries(ratingsByCategory).map(([category, ratings]) => {
          const isExpanded = expandedCategories.has(category);
          const categoryStats = {
            achieved: ratings.filter(r => r.triState === '達成').length,
            partial: ratings.filter(r => r.triState === '部分').length,
            failed: ratings.filter(r => r.triState === '未達成').length,
            unknown: ratings.filter(r => r.triState === '不明').length,
          };

          return (
            <div key={category} className="card">
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between p-2 -m-2 hover:bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-semibold">{category}</h3>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-green-600">達成: {categoryStats.achieved}</span>
                    <span className="text-yellow-600">部分: {categoryStats.partial}</span>
                    <span className="text-red-600">未達成: {categoryStats.failed}</span>
                    <span className="text-gray-600">不明: {categoryStats.unknown}</span>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </button>

              {isExpanded && (
                <div className="mt-4 space-y-4">
                  {ratings.map((rating) => (
                    <div key={rating.itemId} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium">{rating.itemName}</h4>
                          <p className="text-sm text-gray-600 mt-1">ID: {rating.itemId}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={getScoreBadgeClass(rating.triState)}>
                            {getScoreDisplay(rating.score)}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            rating.triState === '達成'
                              ? 'bg-green-100 text-green-800'
                              : rating.triState === '部分'
                              ? 'bg-yellow-100 text-yellow-800'
                              : rating.triState === '未達成'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {rating.triState}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <h5 className="text-sm font-medium text-gray-700">評価理由</h5>
                          <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                            {rating.reason}
                          </p>
                        </div>

                        {rating.evidence.pages.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700">根拠引用</h5>
                            <div className="space-y-2 mt-1">
                              {rating.evidence.pages.map((page, index) => (
                                <div key={index} className="bg-gray-50 rounded p-2">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-medium text-gray-700">
                                      ページ {page.page}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      信頼度: {(rating.evidence.confidence * 100).toFixed(0)}%
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-600">{page.quote}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Files Used */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">使用したファイル</h2>
        <div className="space-y-2">
          {assessment.files.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">{file.filename}</p>
                <p className="text-sm text-gray-600">{file.pageCount}ページ</p>
              </div>
              <p className="text-sm text-gray-500">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
            </div>
          ))}
        </div>
      </div>

      {assessment.notes && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4">備考</h2>
          <p className="text-gray-600 whitespace-pre-wrap">{assessment.notes}</p>
        </div>
      )}
    </div>
  );
}