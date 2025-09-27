# CDN統合ガイド（BE-6）

## 目的
静的アセット/画像の配信最適化とグローバルなレイテンシ削減。

## 方針
- 静的ビルド（Viteの`build`成果物）をCDN配信
- 画像はSupabase Storageの公開/署名URLをCDNFrontするか、Supabase側のエッジ最適化を活用
- キャッシュヘッダの調整（長期キャッシュ + バージョニング）

## 手順（例）
1. 生成物にハッシュを付与（Vite既定）
2. CDNに配信（Vercel/CloudFront/Fastly等）
3. `Cache-Control: public, max-age=31536000, immutable` を静的に付与
4. 画像は更新頻度に応じて適切なTTL設定

## 注意点
- 署名URLは短TTLのため、CDNのキャッシュキーにクエリを含める
- 認可が必要なリソースはCDNを経由しつつ、認証ヘッダを通す設計が必要

