'use client';

import { useEffect, useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, RefreshCw, Download, Search } from 'lucide-react';
import { CriteriaItem, CriteriaMeta } from '@/types';
import { formatDate } from '@/utils/helpers';

export default function CriteriaPage() {
  const [criteria, setCriteria] = useState<CriteriaItem[]>([]);
  const [meta, setMeta] = useState<CriteriaMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    fetchCriteria();
  }, []);

  const fetchCriteria = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/criteria');
      const data = await response.json();
      setCriteria(data.criteria);
      setMeta(data.meta);
    } catch (error) {
      console.error('Failed to fetch criteria:', error);
      setError('観点マスタの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/criteria', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'アップロードに失敗しました');
      }

      const result = await response.json();
      setCriteria(result.criteria);
      setMeta(result.meta);
      setSuccess(`観点マスタを更新しました（${result.count}項目）`);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'アップロードエラーが発生しました');
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
    disabled: uploading,
  });

  const downloadSampleCSV = () => {
    const link = document.createElement('a');
    link.href = '/data/LLM_evaluate_items.csv';
    link.download = 'LLM_evaluate_items.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter criteria based on search and category
  const filteredCriteria = criteria.filter(item => {
    const matchesSearch = !searchTerm ||
      item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.itemId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.definition.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = !selectedCategory || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = Array.from(new Set(criteria.map(item => item.category))).sort();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">観点マスタ管理</h1>
          <p className="mt-2 text-gray-600">評価に使用する観点の管理</p>
        </div>

        <div className="flex gap-2">
          <button onClick={downloadSampleCSV} className="btn-secondary flex items-center gap-2">
            <Download className="h-4 w-4" />
            サンプルCSVダウンロード
          </button>

          <button onClick={fetchCriteria} className="btn-secondary flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            再読み込み
          </button>
        </div>
      </div>

      {/* Current Status */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">現在のステータス</h2>

        {criteria.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">観点マスタが設定されていません</p>
            <p className="text-sm text-gray-400">CSVファイルをアップロードして設定してください</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700">総観点数</h3>
              <p className="text-2xl font-bold mt-1">{criteria.length}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700">カテゴリ数</h3>
              <p className="text-2xl font-bold mt-1">{categories.length}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700">最終更新</h3>
              <p className="text-sm mt-1">
                {meta?.updatedAt ? formatDate(meta.updatedAt) : '不明'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Upload Area */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">CSVアップロード</h2>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          {isDragActive ? (
            <p className="text-gray-700">ドロップしてアップロード</p>
          ) : (
            <>
              <p className="text-gray-700">CSVファイルをドラッグ＆ドロップ</p>
              <p className="text-sm text-gray-500 mt-1">またはクリックして選択</p>
              <p className="text-xs text-gray-400 mt-2">
                必須列: itemId, itemName, category, definition
              </p>
            </>
          )}
        </div>

        {/* Messages */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}
      </div>

      {/* Criteria List */}
      {criteria.length > 0 && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">観点一覧</h2>
            <div className="text-sm text-gray-600">
              {filteredCriteria.length} / {criteria.length} 項目を表示
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="観点名、ID、定義で検索..."
                  className="input pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div>
              <select
                className="input"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">全カテゴリ</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">ID</th>
                  <th className="text-left py-3 px-4">カテゴリ</th>
                  <th className="text-left py-3 px-4">観点名</th>
                  <th className="text-left py-3 px-4">定義</th>
                </tr>
              </thead>
              <tbody>
                {filteredCriteria.map((item) => (
                  <tr key={item.itemId} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {item.itemId}
                      </code>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium">{item.itemName}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 max-w-md">
                      <div className="truncate" title={item.definition}>
                        {item.definition}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredCriteria.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                検索条件に一致する観点がありません
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}