# Node.js 20のAlpine Linuxベースイメージを使用
FROM node:20-alpine

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