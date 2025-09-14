'use client';

import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, FileCheck, AlertCircle } from 'lucide-react';
import { Assessment } from '@/types';
import { formatDate } from '@/utils/helpers';
import { Card } from '@/components/ui/card';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalAssessments: 0,
    averageAchievedRate: 0,
    recentAssessments: [] as Assessment[],
    categoryStats: {} as Record<string, { achieved: number; failed: number; unknown: number }>,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/assessments?limit=5&sortBy=createdAt&sortOrder=desc');
      const data = await response.json();

      // Calculate category statistics
      const categoryStats: Record<string, { achieved: number; failed: number; unknown: number }> = {};
      let totalAchievedRate = 0;

      for (const assessment of data.assessments) {
        totalAchievedRate += assessment.metrics.achievedRate;

        for (const rating of assessment.ratings) {
          if (!categoryStats[rating.category]) {
            categoryStats[rating.category] = { achieved: 0, failed: 0, unknown: 0 };
          }

          if (rating.triState === '達成') {
            categoryStats[rating.category].achieved++;
          } else if (rating.triState === '未達成') {
            categoryStats[rating.category].failed++;
          } else if (rating.triState === '不明') {
            categoryStats[rating.category].unknown++;
          }
        }
      }

      setStats({
        totalAssessments: data.total,
        averageAchievedRate: data.total > 0 ? totalAchievedRate / data.assessments.length : 0,
        recentAssessments: data.assessments,
        categoryStats,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
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

      {/* Category Stats */}
      <Card>
        <h2 className="text-xl font-bold mb-4">カテゴリ別達成状況</h2>
        <div className="space-y-4">
          {Object.entries(stats.categoryStats).map(([category, counts]) => {
            const total = counts.achieved + counts.failed + counts.unknown;
            const achievedPercent = total > 0 ? (counts.achieved / total) * 100 : 0;
            const failedPercent = total > 0 ? (counts.failed / total) * 100 : 0;
            const unknownPercent = total > 0 ? (counts.unknown / total) * 100 : 0;

            return (
              <div key={category}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">{category}</span>
                  <span className="text-sm text-gray-500">
                    達成: {counts.achieved} / 未達成: {counts.failed} / 不明: {counts.unknown}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden flex">
                  <div
                    className="bg-green-500 h-full transition-all duration-300"
                    style={{ width: `${achievedPercent}%` }}
                  />
                  <div
                    className="bg-red-500 h-full transition-all duration-300"
                    style={{ width: `${failedPercent}%` }}
                  />
                  <div
                    className="bg-gray-400 h-full transition-all duration-300"
                    style={{ width: `${unknownPercent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
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