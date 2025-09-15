'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronLeft, ChevronRight, Eye, Trash2, FileDown } from 'lucide-react';
import { Assessment } from '@/types';
import { formatDate } from '@/utils/helpers';

export default function AssessmentsPage() {
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const limit = 10;

  const fetchAssessments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        search,
        sortBy,
        sortOrder,
      });

      const response = await fetch(`/api/assessments?${params}`);
      const data = await response.json();

      setAssessments(data.assessments);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to fetch assessments:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, sortBy, sortOrder]);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const deleteAssessment = async (id: string) => {
    if (!confirm('この評価を削除しますか？')) return;

    try {
      const response = await fetch(`/api/assessments/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('削除に失敗しました');
      }

      // Refresh the list
      fetchAssessments();
    } catch (error) {
      console.error('Delete error:', error);
      alert('削除に失敗しました');
    }
  };

  const exportCSV = (id: string, name: string) => {
    const link = document.createElement('a');
    link.href = `/api/assessments/${id}/export.csv`;
    link.download = `assessment_${name.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">評価一覧</h1>
          <p className="mt-2 text-gray-600">実行済みの評価結果を確認・管理</p>
        </div>

        <button
          onClick={() => router.push('/new-assessment')}
          className="btn-primary"
        >
          新規評価作成
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="対象名または種別で検索..."
                className="input pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <select
              className="input"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="createdAt">作成日時</option>
              <option value="name">名称</option>
              <option value="achievedRate">達成率</option>
            </select>

            <select
              className="input"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            >
              <option value="desc">降順</option>
              <option value="asc">昇順</option>
            </select>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          {total > 0 && (
            <>
              全{total}件中 {(currentPage - 1) * limit + 1}～{Math.min(currentPage * limit, total)}件を表示
            </>
          )}
        </div>
      </div>

      {/* Assessments Table */}
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">読み込み中...</div>
          </div>
        ) : assessments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">評価結果がありません</p>
            <button
              onClick={() => router.push('/new-assessment')}
              className="btn-primary mt-4"
            >
              最初の評価を作成
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th
                      className="text-left py-3 px-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('name')}
                    >
                      対象名
                      {sortBy === 'name' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th className="text-left py-3 px-4">種別</th>
                    <th
                      className="text-left py-3 px-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('achievedRate')}
                    >
                      達成率
                      {sortBy === 'achievedRate' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th className="text-left py-3 px-4">スコア平均</th>
                    <th
                      className="text-left py-3 px-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('createdAt')}
                    >
                      作成日時
                      {sortBy === 'createdAt' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th className="text-left py-3 px-4">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {assessments.map((assessment) => (
                    <tr key={assessment.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <button
                          onClick={() => router.push(`/assessments/${assessment.id}`)}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          {assessment.name}
                        </button>
                        {assessment.version && (
                          <div className="text-xs text-gray-500">v{assessment.version}</div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          assessment.targetType === 'LLM'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {assessment.targetType}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${assessment.metrics.achievedRate}%` }}
                            />
                          </div>
                          <span className="text-sm">{assessment.metrics.achievedRate.toFixed(1)}%</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-sm">
                          {assessment.metrics.scoreAvg.toFixed(1)}/5
                        </span>
                      </td>

                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatDate(assessment.createdAt)}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => router.push(`/assessments/${assessment.id}`)}
                            className="p-1 hover:bg-gray-200 rounded"
                            title="詳細を見る"
                          >
                            <Eye className="h-4 w-4 text-gray-600" />
                          </button>

                          <button
                            onClick={() => exportCSV(assessment.id, assessment.name)}
                            className="p-1 hover:bg-gray-200 rounded"
                            title="CSVエクスポート"
                          >
                            <FileDown className="h-4 w-4 text-gray-600" />
                          </button>

                          <button
                            onClick={() => deleteAssessment(assessment.id)}
                            className="p-1 hover:bg-gray-200 rounded"
                            title="削除"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-600">
                  ページ {currentPage} / {totalPages}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="btn-secondary disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    前へ
                  </button>

                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="btn-secondary disabled:opacity-50"
                  >
                    次へ
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}