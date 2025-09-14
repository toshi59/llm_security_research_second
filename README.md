# LLM・SaaS Assessment Recorder

LLM・SaaS評価記録・管理システム - PDFドキュメントを40項目の評価基準に基づいてAI評価し、コンプライアンス評価を記録・管理するWebアプリケーション

## 概要

このシステムは、LLM（Large Language Model）やSaaSサービスのセキュリティ・コンプライアンス評価を支援するツールです。PDFドキュメントをアップロードし、Google Gemini 2.0 Flash APIを使用して40項目の評価基準に基づく自動評価を実行します。

## 主な機能

### 📋 評価管理
- **PDF評価**: セキュリティドキュメント、プライバシーポリシー等のPDF分析
- **40項目評価**: 法規制・ライセンス・セキュリティ・ガバナンス等の包括的評価
- **証拠ベース評価**: PDFから根拠を抽出し、ページ番号と引用文を記録
- **5段階評価**: 1-5スコア + 3値判定（達成/未達成/部分/不明）

### 🎯 評価基準
- **法規制・プライバシー**: GDPR、DPIA、CCPA/CPRA、個人情報保護法等
- **ライセンス・IP**: OSS ライセンス適合性、著作権・特許権
- **データ管理・セキュリティ**: 暗号化、アクセス制御、監査ログ
- **安全性・ガバナンス**: レッドチーム評価、バイアス評価、透明性
- **モデル性能・品質**: ベンチマーク、多言語対応、幻覚制御
- **供給元・メンテナンス**: OSS開発体制、脆弱性管理
- **デプロイ・運用**: MLOps、監視、コスト管理
- **トラスト・コミュニケーション**: モデルカード、透明性、再現性

## 技術スタック

### フロントエンド
- **Next.js 15.5.3** (App Router)
- **React 19.1.0**
- **TypeScript 5**
- **Tailwind CSS 3.4.17**

### バックエンド
- **Google Generative AI** (Gemini 2.0 Flash API)
- **Upstash Redis** (データストレージ)
- **pdf-parse** (PDF解析)
- **Zod** (スキーマバリデーション)

## セットアップ

### 前提条件
- Node.js 18+
- npm または yarn
- Google AI API キー
- Upstash Redis データベース

### インストール

1. **リポジトリのクローン**
\`\`\`bash
git clone [repository-url]
cd assessment-recorder
\`\`\`

2. **依存関係のインストール**
\`\`\`bash
npm install
\`\`\`

3. **環境変数の設定**
\`.env.local\` ファイルを作成し、以下を設定：
\`\`\`bash
GOOGLE_API_KEY=your_google_api_key
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
\`\`\`

4. **開発サーバーの起動**
\`\`\`bash
npm run dev
\`\`\`

## 使用方法

### 1. 観点マスタの設定
1. 「観点マスタ管理」ページにアクセス
2. \`data/LLM_evaluate_items.csv\` をアップロード
3. 40項目の評価基準が設定されます

### 2. 評価の実行
1. 「新規評価」ページで評価対象情報を入力
2. 評価対象のPDFファイルをアップロード
3. 「評価実行」でGemini APIによる自動評価開始
4. 評価完了後、結果ページで詳細確認

## ライセンス

MIT License
