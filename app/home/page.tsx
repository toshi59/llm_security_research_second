'use client';

import { useRouter } from 'next/navigation';
import { FileCheck, Upload, BarChart3, Shield, Zap, Users, ArrowRight, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-12">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-100 p-4 rounded-full">
            <Shield className="h-12 w-12 text-blue-600" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          LLM・SaaS セキュリティ評価システム
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          AI・クラウドサービスのセキュリティを効率的に評価・管理するためのプラットフォーム。
          PDFやWord文書から自動で評価を実施し、包括的なレポートを生成します。
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => router.push('/new-assessment')}
            className="btn-primary flex items-center gap-2"
          >
            評価を開始 <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="btn-secondary"
          >
            ダッシュボードを見る
          </button>
        </div>
      </div>

      {/* Features Section */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="text-center">
          <div className="bg-green-100 p-3 rounded-full w-fit mx-auto mb-4">
            <Zap className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">AI自動評価</h3>
          <p className="text-gray-600 text-sm">
            最新のGemini AIを活用して、セキュリティ要件を自動的に評価。人手による評価時間を大幅に短縮します。
          </p>
        </Card>

        <Card className="text-center">
          <div className="bg-blue-100 p-3 rounded-full w-fit mx-auto mb-4">
            <FileCheck className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">多様な文書対応</h3>
          <p className="text-gray-600 text-sm">
            PDF・Word文書に対応。技術仕様書、セキュリティポリシー、監査資料など様々な形式の文書を処理できます。
          </p>
        </Card>

        <Card className="text-center">
          <div className="bg-purple-100 p-3 rounded-full w-fit mx-auto mb-4">
            <BarChart3 className="h-8 w-8 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">可視化・レポート</h3>
          <p className="text-gray-600 text-sm">
            評価結果をカテゴリ別に分析し、達成率や改善点を分かりやすく可視化。CSV出力にも対応しています。
          </p>
        </Card>
      </div>

      {/* How to Use Section */}
      <Card>
        <h2 className="text-2xl font-bold mb-6">使い方</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <div className="text-2xl font-bold text-blue-600 mb-2">1</div>
              <Upload className="h-8 w-8 text-blue-600 mx-auto" />
            </div>
            <h3 className="font-semibold mb-2">評価基準の設定</h3>
            <p className="text-sm text-gray-600">
              まず評価基準CSVファイルをアップロードして、評価項目とカテゴリを設定します。
            </p>
          </div>

          <div className="text-center">
            <div className="bg-green-50 p-4 rounded-lg mb-4">
              <div className="text-2xl font-bold text-green-600 mb-2">2</div>
              <FileCheck className="h-8 w-8 text-green-600 mx-auto" />
            </div>
            <h3 className="font-semibold mb-2">評価対象の登録</h3>
            <p className="text-sm text-gray-600">
              評価したいLLMやSaaSの名称・バージョンを入力し、関連文書をアップロードします。
            </p>
          </div>

          <div className="text-center">
            <div className="bg-orange-50 p-4 rounded-lg mb-4">
              <div className="text-2xl font-bold text-orange-600 mb-2">3</div>
              <Zap className="h-8 w-8 text-orange-600 mx-auto" />
            </div>
            <h3 className="font-semibold mb-2">AI自動評価</h3>
            <p className="text-sm text-gray-600">
              AIが文書を解析し、各評価項目について自動的にスコアリングと判定を行います。
            </p>
          </div>

          <div className="text-center">
            <div className="bg-purple-50 p-4 rounded-lg mb-4">
              <div className="text-2xl font-bold text-purple-600 mb-2">4</div>
              <BarChart3 className="h-8 w-8 text-purple-600 mx-auto" />
            </div>
            <h3 className="font-semibold mb-2">結果の確認</h3>
            <p className="text-sm text-gray-600">
              ダッシュボードで評価結果を確認し、詳細レポートやCSVファイルを出力できます。
            </p>
          </div>
        </div>
      </Card>

      {/* Key Features */}
      <Card>
        <h2 className="text-2xl font-bold mb-6">主な機能</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              評価機能
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• 5段階スコア評価（完全達成〜未達成）</li>
              <li>• 3値判定（達成/部分/未達成/不明）</li>
              <li>• 根拠となるページと引用の自動抽出</li>
              <li>• カテゴリ別達成率の算出</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              管理機能
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• 評価履歴の一覧・検索・ソート</li>
              <li>• カテゴリ別達成率の可視化</li>
              <li>• 詳細レポートの表示</li>
              <li>• CSV形式でのデータエクスポート</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Getting Started */}
      <Card className="bg-blue-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">今すぐ始める</h2>
          <p className="text-gray-700 mb-6">
            セキュリティ評価を効率化し、品質の高い評価レポートを作成しましょう
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.push('/criteria')}
              className="btn-secondary"
            >
              評価基準を設定
            </button>
            <button
              onClick={() => router.push('/new-assessment')}
              className="btn-primary"
            >
              新規評価を開始
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}