# Node.js 20のAlpine Linuxベースイメージを使用
FROM node:20-alpine

# ビルド引数を受け取る（docker-compose.ymlから渡される）
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# ビルド時に環境変数として設定（Viteがビルド時に使用）
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# 作業ディレクトリを設定
WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm ci || npm install

# アプリケーションのソースコードをコピー
COPY . .

# ポート3001を公開
EXPOSE 3001

# 開発サーバーを起動
CMD ["npm", "run", "dev"]