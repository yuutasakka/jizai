# JIZAI - 自在の写真アプリ

**このアプリ、なんか手放せないんだよ** - ユーザーが自然に愛用し続ける、心理学的に設計された記念写真アプリケーション

Original project design: https://www.figma.com/design/JdAumYeYVs0VV2FtwtXwa8/JIZAI

## ✨ 長期愛用システム - 新機能

JIZAIは単なる写真編集アプリを超え、**長期愛用システム**により、ユーザーが無意識レベルで継続利用したくなる体験を提供します。

### 🧠 Memorial Intelligence (記念日インテリジェンス)
- 📸 写真のメタデータから記念日を自動検出
- 🎌 日本の文化的イベント（お盆、七夕、節分等）との自動連携
- 💭 感情的コンテキストに基づく思い出のリマインダー
- 📅 季節に応じた記念写真の提案

### 🏆 Growth Achievement System (成長実感システム)
- 📊 見えない形でのスキル追跡（編集スピード、色彩調和、構図美等）
- 🎯 6段階の実績レアリティ（Common → Mythical）
- 🌟 段階的な達成感による継続動機の創出
- 📈 長期的なスキル向上の可視化

### 👨‍👩‍👧‍👦 Family Bonding Features (家族との絆機能)
- 🤝 多世代にわたる写真共有システム
- 💌 文化的役割を考慮した家族メンバー管理
- 🌸 日本の絵文字を使った感情豊かなリアクション
- 📚 世代間の知恵継承機能

### 🎨 Personalization Engine (個人化エンジン)
- 🧩 ユーザーの行動パターン学習
- 🎭 6つの性格特性分析（慎重性、創造性、効率性、社交性、伝統性、感情性）
- 🔧 個性に応じたインターフェース自動調整
- 💡 インテリジェントな機能提案

### 🎵 Seasonal Audio-Visual Enhancement
- 🌸 日本の四季に応じた環境音（春のそよ風、夏の蝉しぐれ、秋の紅葉、冬の静寂）
- ❄️ 季節的なビジュアルエフェクト（桜の花びら、雪の結晶等）
- 🏮 文化的コンテキストに基づく没入体験

## 🚀 クイックスタート

### 基本セットアップ
```bash
npm i          # 依存関係インストール
npm run dev    # 開発サーバー起動
```

アクセス: http://localhost:5173

### 長期愛用システムの確認
1. ホーム画面の「💖 愛用者システム」カードをクリック
2. 各タブで以下を確認：
   - **概要**: 現在のスキル状況と実績進捗
   - **成長**: 詳細なスキル分析と改善履歴
   - **家族**: 家族メンバー管理と共有機能
   - **設定**: 個人化とシステム設定

### 実際の体験
1. 写真をアップロード → **自動で記念度分析**
2. 編集操作を行う → **スキルが見えない形で向上**
3. 連続利用する → **段階的な実績解除**
4. 家族を招待する → **絆の深化機能体験**

## 📊 システムアーキテクチャ

### コア技術スタック
- **Frontend**: React 18 + TypeScript + Vite
- **State Management**: React Context API (5層階層構造)
- **Data Persistence**: IndexedDB + localStorage fallback
- **UI Framework**: Custom design system with seasonal theming
- **Testing**: Jest + React Testing Library

### 長期愛用システムの構成
```
PersonalizationProvider (最上位)
├── MemorialIntelligenceProvider
├── GrowthAchievementProvider
├── FamilyBondingProvider
└── ZenModeProvider (既存UI状態)
```

### データフロー
1. **写真アップロード** → 記念度分析 → スキル追跡 → 個性学習
2. **編集操作** → 行動パターン記録 → 実績チェック → UI適応
3. **家族共有** → 社会的証明 → 絆強化 → 継続動機

## 📚 詳細ドキュメント

- [アーキテクチャ設計](./docs/LONG_TERM_ENGAGEMENT_ARCHITECTURE.md) - システム全体の設計思想
- [API仕様書](./docs/LONG_TERM_ENGAGEMENT_API.md) - Context APIとヘルパー関数
- [実装ガイド](./docs/IMPLEMENTATION_GUIDE.md) - 開発者向け実装手順
- [型定義](./src/types/long-term-engagement.ts) - TypeScript型定義
- [定数・設定](./src/utils/long-term-engagement-constants.ts) - システム定数
- [ヘルパー関数](./src/utils/long-term-engagement-helpers.ts) - ユーティリティ関数

### 開発・運用（本リポジトリ新機能のオンボーディング）
- [Developer Onboarding](./docs/DEVELOPER_ONBOARDING.md)
- [Architecture Overview](./docs/ARCHITECTURE_OVERVIEW.md)
- [SUPABASE 初期設定](./SUPABASE_SETUP.md)
- [デプロイ](./DEPLOYMENT.md)
- [セキュリティ方針](./SECURITY.md)

### セキュリティ要点（バックエンド）
- 本番: `ADMIN_TOKEN` を強固に設定し、Webhook/管理API にレート制限・（任意）IP許可を適用。
- 画像上限は `MAX_IMAGE_SIDE` / `MAX_IMAGE_PIXELS` で制御可能。
- 逆プロキシ配下では `TRUST_PROXY=true` を設定。

## 🧪 心理学的設計原則

### 1. 漸進的コミット (Progressive Commitment)
小さな成功体験から徐々に深いエンゲージメントへ導く段階的設計

### 2. 見えない成長 (Invisible Progress)
意識的な努力なしに自然な使用でスキルが向上する設計

### 3. 文化的共鳴 (Cultural Resonance)
日本の文化的価値観と季節感に深く根ざしたユーザー体験

### 4. 社会的証明 (Social Proof)
家族からの反応によりユーザー行動を正当化・強化

## 🔬 テスト戦略

```bash
# 単体テスト実行
npm test

# コンテキスト統合テスト
npm test -- --testNamePattern="Context integration"

# エンゲージメントフロー統合テスト
npm test -- --testNamePattern="Engagement flow"
```

## 価格について（重要）

- 通常価格は「1枚あたり 100円」です。
- いまだけ「期間限定セール」を実施中です。プラン画面には、セール価格・通常価格・割引（◯%OFF）・1枚あたりの価格（通常¥100の注記つき）が表示されます。
- Web版では購入操作は行えません。購入・プラン変更は、アプリ内課金または iPhone の「設定 → Apple ID → サブスクリプション」から行ってください。
  
## Preview URL 確認手順（Vercel）

- プロジェクトリンク: リポジトリ直下に `.vercel/project.json` が存在すればリンク済みです。未リンクの場合は `vercel link` を実行し、既存プロジェクトに紐付けてください。
- Production ブランチ: `vercel.json` の `git.productionBranch` を `main` に設定済みです（Vercel ダッシュボード > Project Settings > Git でも `main` を選択してください）。
- Preview デプロイ: `main` 以外のブランチに push すると自動で Preview デプロイが作成され、PR ごとに URL が発行されます。
- 確認方法（推奨）:
  - GitHub の PR 画面で Vercel のチェック/コメントに表示される URL を開く。
  - または Vercel ダッシュボード > 該当プロジェクト > Deployments の最新 "Preview" を開く。
- 注意: Production 反映は `main` ブランチに merge されたときのみ行われます（Preview とは別 URL）。

## ローカルでの変更確認（LPプレビュー）

- フロントエンドのみで確認する場合（Hero文言・CTA等の見た目確認）
  - 依存関係インストール: `npm i`
  - 開発サーバ起動: `npm run dev`
  - ブラウザで `http://localhost:5173` を開く（Vite のデフォルト）
  - バックエンドも起動して動作を確認する場合（任意）
  - ルートに `.env.local`（任意）で `VITE_API_BASE_URL=http://localhost:3000` を設定
  - `backend/` に移動して `npm i`、`.env` を作成（`backend/.env.example` を参考に値をセット）
  - `cd backend && npm run dev`（ポート `3000`）
  - 別ターミナルでフロントエンドを `npm run dev` 起動
- 既知の注意点
  - バックエンドは Supabase のキーが必要です。LPの見た目だけ確認する場合はフロントエンドのみ起動で十分です。

## Google Search Console 登録・サイトマップ送信手順（Next.js）

- 確認対象ブランチ: `feat/next-app-router-partial-ssg`（App Router で /memorial/* をSSG）
- Vercel Preview でドメイン（例: `https://{preview}.vercel.app`）を控える
- GSC にプロパティ追加 → HTMLタグ or DNSで所有権確認
- サイトマップURL: `https://{your-domain}/sitemap.xml` を送信
- 収集後、カバレッジで `/memorial/human|pet|seizen|photo` が列挙されることを確認
- 注意: 既存SPAの head と重複しないよう、用途別ページは Server Component 側でメタ/OG/JSON-LD を出力しています。
- 環境変数: `.env.local` に `NEXT_PUBLIC_SITE_URL` と `NEXT_PUBLIC_GSC_VERIF` を設定すると、`app/layout.tsx` に検証メタが出力されます。`NEXT_PUBLIC_SITE_URL` は canonical/OG/Twitter の基準URLにも使用されます。
- Vercel 環境変数: Preview/Production で `NEXT_PUBLIC_SITE_URL` をそれぞれのドメインに設定してください。

## 本番リリース前の最終設定

- セキュリティヘッダ: `middleware.ts` で X-Frame-Options / X-Content-Type-Options / Referrer-Policy を付与
- キャッシュ: `next.config.js` の headers で `/og.png` と `/examples/*` に `immutable` キャッシュ
- リダイレクト: `/memorial` → `/memorial/human` を permanent で設定
- 404/500 UI: `app/not-found.tsx` / `app/error.tsx`
- GA4: 管理画面で `begin_edit` / `preset_complete` / `export_print` / `cta_emergency` をコンバージョン登録

## Lighthouse CI（PR自動チェック）

- 依存: `@lhci/cli`（devDependencies）
- 設定: `.lighthouserc.json` / `.github/workflows/lhci.yml`
- PRごとに `seo`/`best-practices` が 0.9 未満なら失敗として検知します。


## GA4（計測）設定とイベント

- 環境変数: `.env.local` に `NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX`
- 反映箇所: `app/layout.tsx` で GA4 スニペットを条件付き挿入（同意モード簡易/匿名IP）
- 主要イベント（Console で確認可能）:
  - `begin_edit`: 画像アップロード直後
  - `preset_complete`: 用途ページの「この設定で作成する」から遷移時（クエリをSPA側で検知）
  - `export_print`: 書き出し成功
  - `cta_emergency`: "今すぐ相談" クリック
- ページビュー: Preview で `page_view` が送信されることを確認
