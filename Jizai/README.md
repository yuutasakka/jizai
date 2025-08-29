
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
