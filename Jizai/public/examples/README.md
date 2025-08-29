# Examples 画像の配置について

このディレクトリには実例画像（Before/After）を配置します。差し替え前提のプレースホルダ運用です。

命名規則（例）
- `human_01_before.jpg` / `human_01_after.jpg`
- `pet_01_before.jpg` / `pet_01_after.jpg`
- `seizen_01_before.jpg` / `seizen_01_after.jpg`
- `photo_01_before.jpg` / `photo_01_after.jpg`

推奨仕様
- 解像度: 1200×800 以上
- カラープロファイル: sRGB
- シャープネス: 軽め（過度なシャープは避ける）

配置後は、`src/routes/memorial-pages.tsx` などの `PH_BEFORE` / `PH_AFTER` を `/examples/*` の実ファイルに差し替えてください。

