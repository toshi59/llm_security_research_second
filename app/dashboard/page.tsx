'use client';

import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, FileCheck, AlertCircle } from 'lucide-react';
import { Assessment } from '@/types';
import { formatDate } from '@/utils/helpers';
import { Card } from '@/components/ui/card';

interface AssessmentCategoryData {
  assessmentId: string;
  assessmentName: string;
  targetType: 'LLM' | 'SaaS';
  categories: Record<string, number>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalAssessments: 0,
    averageAchievedRate: 0,
    recentAssessments: [] as Assessment[],
    categoryStats: {} as Record<string, { achieved: number; failed: number; unknown: number }>,
  });
  const [assessmentCategoryMatrix, setAssessmentCategoryMatrix] = useState<AssessmentCategoryData[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/assessments?limit=100&sortBy=createdAt&sortOrder=desc');
      const data = await response.json();

      // Calculate category statistics and matrix data
      const categoryStats: Record<string, { achieved: number; failed: number; unknown: number }> = {};
      const categoriesSet = new Set<string>();
      const matrixData: AssessmentCategoryData[] = [];
      let totalAchievedRate = 0;

      for (const assessment of data.assessments) {
        totalAchievedRate += assessment.metrics.achievedRate;

        const categoryAchievements: Record<string, number> = {};
        const categoryTotals: Record<string, number> = {};

        for (const rating of assessment.ratings) {
          categoriesSet.add(rating.category);

          if (!categoryStats[rating.category]) {
            categoryStats[rating.category] = { achieved: 0, failed: 0, unknown: 0 };
          }

          if (!categoryTotals[rating.category]) {
            categoryTotals[rating.category] = 0;
            categoryAchievements[rating.category] = 0;
          }

          categoryTotals[rating.category]++;

          if (rating.triState === '達成') {
            categoryStats[rating.category].achieved++;
            categoryAchievements[rating.category]++;
          } else if (rating.triState === '未達成') {
            categoryStats[rating.category].failed++;
          } else if (rating.triState === '不明') {
            categoryStats[rating.category].unknown++;
          }
        }

        // Calculate achievement rate per category
        const categoryRates: Record<string, number> = {};
        for (const [category, total] of Object.entries(categoryTotals)) {
          categoryRates[category] = total > 0 ? (categoryAchievements[category] / total) * 100 : 0;
        }

        matrixData.push({
          assessmentId: assessment.id,
          assessmentName: assessment.name,
          targetType: assessment.targetType,
          categories: categoryRates,
        });
      }

      const sortedCategories = Array.from(categoriesSet).sort();

      setStats({
        totalAssessments: data.total,
        averageAchievedRate: data.total > 0 ? totalAchievedRate / data.assessments.length : 0,
        recentAssessments: data.assessments.slice(0, 5),
        categoryStats,
      });
      setAllCategories(sortedCategories);
      setAssessmentCategoryMatrix(matrixData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getColorForRate = (rate: number | undefined) => {
    if (rate === undefined) return 'bg-gray-100 text-gray-400';
    if (rate >= 80) return 'bg-green-100 text-green-800';
    if (rate >= 60) return 'bg-yellow-100 text-yellow-800';
    if (rate >= 40) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">データを読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">ダッシュボード</h1>
        <p className="mt-2 text-gray-600">アセスメント評価の概要</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600">総評価数</p>
              <p className="text-2xl font-bold mt-1">{stats.totalAssessments}</p>
            </div>
            <FileCheck className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600">平均達成率</p>
              <p className="text-2xl font-bold mt-1">
                {stats.averageAchievedRate.toFixed(1)}%
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600">カテゴリ数</p>
              <p className="text-2xl font-bold mt-1">
                {Object.keys(stats.categoryStats).length}
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-500" />
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600">不明項目</p>
              <p className="text-2xl font-bold mt-1">
                {Object.values(stats.categoryStats).reduce((sum, cat) => sum + cat.unknown, 0)}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>
      </div>

      {/* Assessment Category Matrix */}
      <Card>
        <h2 className="text-xl font-bold mb-4">評価対象別カテゴリ達成率</h2>
        {assessmentCategoryMatrix.length > 0 && allCategories.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-white z-10 text-left py-3 px-4 border-b border-r font-medium text-sm">
                    評価対象
                  </th>
                  <th className="text-center py-3 px-2 border-b border-r font-medium text-sm">
                    種別
                  </th>
                  {allCategories.map((category) => (
                    <th
                      key={category}
                      className="text-center py-3 px-2 border-b border-r font-medium text-xs"
                      style={{ minWidth: '100px' }}
                    >
                      {category}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {assessmentCategoryMatrix.map((assessment) => (
                  <tr key={assessment.assessmentId} className="hover:bg-gray-50">
                    <td className="sticky left-0 bg-white z-10 py-2 px-4 border-b border-r">
                      <a
                        href={`/assessments/${assessment.assessmentId}`}
                        className="text-blue-600 hover:underline text-sm font-medium"
                      >
                        {assessment.assessmentName}
                      </a>
                    </td>
                    <td className="text-center py-2 px-2 border-b border-r">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        assessment.targetType === 'LLM'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {assessment.targetType}
                      </span>
                    </td>
                    {allCategories.map((category) => {
                      const rate = assessment.categories[category];
                      return (
                        <td
                          key={category}
                          className={`text-center py-2 px-2 border-b border-r ${getColorForRate(rate)}`}
                        >
                          <span className="text-xs font-semibold">
                            {rate !== undefined ? `${rate.toFixed(0)}%` : '-'}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">評価データがありません</p>
        )}
      </Card>


      {/* Recent Assessments */}
      <Card>
        <h2 className="text-xl font-bold mb-4">最近の評価</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4">対象名</th>
                <th className="text-left py-2 px-4">種別</th>
                <th className="text-left py-2 px-4">達成率</th>
                <th className="text-left py-2 px-4">作成日時</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentAssessments.map((assessment) => (
                <tr key={assessment.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-4">
                    <a href={`/assessments/${assessment.id}`} className="text-blue-600 hover:underline">
                      {assessment.name}
                    </a>
                  </td>
                  <td className="py-2 px-4">
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                      assessment.targetType === 'LLM'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {assessment.targetType}
                    </span>
                  </td>
                  <td className="py-2 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${assessment.metrics.achievedRate}%` }}
                        />
                      </div>
                      <span className="text-sm">{assessment.metrics.achievedRate.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="py-2 px-4 text-sm text-gray-600">
                    {formatDate(assessment.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}