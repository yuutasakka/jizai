
  # JIZAI

  This is a code bundle for JIZAI. The original project is available at https://www.figma.com/design/JdAumYeYVs0VV2FtwtXwa8/JIZAI.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

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
    - バックエンドは Supabase と DashScope のキーが必要です。LPの見た目だけ確認する場合はフロントエンドのみ起動で十分です。

  ## Google Search Console 登録・サイトマップ送信手順（Next.js）

  - 確認対象ブランチ: `feat/next-app-router-partial-ssg`（App Router で /memorial/* をSSG）
  - Vercel Preview でドメイン（例: `https://{preview}.vercel.app`）を控える
  - GSC にプロパティ追加 → HTMLタグ or DNSで所有権確認
  - サイトマップURL: `https://{your-domain}/sitemap.xml` を送信
  - 収集後、カバレッジで `/memorial/human|pet|seizen|photo` が列挙されることを確認
  - 注意: 既存SPAの head と重複しないよう、用途別ページは Server Component 側でメタ/OG/JSON-LD を出力しています。

  ## GA4（計測）設定とイベント

  - 環境変数: `.env.local` に `NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX`
  - 反映箇所: `app/layout.tsx` で GA4 スニペットを条件付き挿入（同意モード簡易/匿名IP）
  - 主要イベント（Console で確認可能）:
    - `begin_edit`: 画像アップロード直後
    - `preset_complete`: 用途ページの「この設定で作成する」から遷移時（クエリをSPA側で検知）
    - `export_print`: 書き出し成功
    - `cta_emergency`: “今すぐ相談” クリック
  - ページビュー: Preview で `page_view` が送信されることを確認
