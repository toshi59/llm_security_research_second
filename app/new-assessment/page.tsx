'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import { Upload, FileText, X, Loader2, CheckCircle } from 'lucide-react';
import { formatFileSize } from '@/utils/helpers';

interface UploadedFile {
  fileId: string;
  filename: string;
  size: number;
  pageCount: number;
}

export default function NewAssessmentPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    targetType: 'LLM' as 'LLM' | 'SaaS',
    name: '',
    version: '',
    provider: '',
    notes: '',
  });
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const [error, setError] = useState<string>('');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    setError('');

    for (const file of acceptedFiles) {
      try {
        setProgress(`アップロード中: ${file.name}`);

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'アップロードに失敗しました');
        }

        const result = await response.json();
        setUploadedFiles(prev => [...prev, {
          fileId: result.fileId,
          filename: result.filename,
          size: result.size,
          pageCount: result.pageCount,
        }]);
      } catch (error: unknown) {
        setError(error instanceof Error ? error.message : 'アップロードエラーが発生しました');
        console.error('Upload error:', error);
      }
    }

    setUploading(false);
    setProgress('');
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
    },
    maxSize: 100 * 1024 * 1024, // 100MB
    disabled: uploading || processing,
  });

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.fileId !== fileId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || uploadedFiles.length === 0) {
      setError('対象名と文書ファイルは必須です');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      setProgress('評価処理を開始しています...');

      const response = await fetch('/api/assessments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          files: uploadedFiles,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '評価処理に失敗しました');
      }

      const assessment = await response.json();
      setProgress('評価が完了しました！');

      // Navigate to assessment detail page
      setTimeout(() => {
        router.push(`/assessments/${assessment.id}`);
      }, 1500);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : '評価処理エラーが発生しました');
      console.error('Assessment error:', error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">新規評価</h1>
        <p className="mt-2 text-gray-600">LLMまたはSaaSアプリケーションの評価を作成</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Target Information */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">対象情報</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                対象種別 <span className="text-red-500">*</span>
              </label>
              <select
                className="input"
                value={formData.targetType}
                onChange={(e) => setFormData({ ...formData, targetType: e.target.value as 'LLM' | 'SaaS' })}
                disabled={processing}
              >
                <option value="LLM">LLM</option>
                <option value="SaaS">SaaS</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="input"
                placeholder="例: GPT-4, Salesforce"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={processing}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                バージョン
              </label>
              <input
                type="text"
                className="input"
                placeholder="例: 2024.1"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                disabled={processing}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                プロバイダー
              </label>
              <input
                type="text"
                className="input"
                placeholder="例: OpenAI, Microsoft"
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                disabled={processing}
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              備考
            </label>
            <textarea
              className="input"
              rows={3}
              placeholder="評価に関する追加情報"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              disabled={processing}
            />
          </div>
        </div>

        {/* Document Upload */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">文書アップロード</h2>

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            } ${(uploading || processing) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            {isDragActive ? (
              <p className="text-gray-700">ドロップしてアップロード</p>
            ) : (
              <>
                <p className="text-gray-700">PDF・Word文書をドラッグ＆ドロップ</p>
                <p className="text-sm text-gray-500 mt-1">またはクリックして選択</p>
                <p className="text-xs text-gray-400 mt-2">PDF, DOC, DOCX対応 / 最大100MB / 1,000ページ</p>
              </>
            )}
          </div>

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              {uploadedFiles.map((file) => (
                <div key={file.fileId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">{file.filename}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)} / {file.pageCount}ページ
                      </p>
                    </div>
                  </div>
                  {!processing && (
                    <button
                      type="button"
                      onClick={() => removeFile(file.fileId)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <X className="h-4 w-4 text-gray-500" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Progress / Error */}
        {progress && (
          <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg">
            {processing ? (
              <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
            ) : (
              <CheckCircle className="h-5 w-5 text-green-600" />
            )}
            <span className="text-sm text-gray-700">{progress}</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => router.push('/dashboard')}
            disabled={processing}
          >
            キャンセル
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={!formData.name || uploadedFiles.length === 0 || processing}
          >
            {processing ? (
              <>
                <Loader2 className="inline-block h-4 w-4 mr-2 animate-spin" />
                評価中...
              </>
            ) : (
              '評価を開始'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}