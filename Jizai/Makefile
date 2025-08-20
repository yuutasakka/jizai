.PHONY: help install start dev test clean build

# デフォルトターゲット
help:
	@echo "Available commands:"
	@echo "  make install    - Install dependencies for backend and iOS"
	@echo "  make start      - Start backend server"
	@echo "  make dev        - Start backend in development mode"
	@echo "  make test       - Run backend tests"
	@echo "  make health     - Check backend health"
	@echo "  make clean      - Clean build artifacts"
	@echo "  make build      - Build all projects"
	@echo "  make setup      - Initial project setup"

# 依存関係インストール
install:
	@echo "Installing backend dependencies..."
	cd backend && npm install
	@echo "iOS dependencies will be managed by Xcode/Swift Package Manager"

# バックエンド開発サーバー起動
dev:
	@echo "Starting backend development server..."
	cd backend && npm run dev

# バックエンド本番サーバー起動
start:
	@echo "Starting backend server..."
	cd backend && npm start

# ヘルスチェック
health:
	@echo "Checking backend health..."
	curl -s http://localhost:3000/v1/health | jq '.'

# テスト実行
test:
	@echo "Running backend tests..."
	cd backend && npm test

# クリーンアップ
clean:
	@echo "Cleaning build artifacts..."
	cd backend && rm -rf node_modules
	find . -name ".DS_Store" -delete
	find . -name "*.log" -delete

# ビルド
build:
	@echo "Building backend..."
	cd backend && npm run build || echo "No build script found"
	@echo "iOS build should be done through Xcode"

# 初期セットアップ
setup: install
	@echo "Setting up project..."
	@echo "1. Copy .env.example to .env and fill in your API keys"
	@echo "2. Run 'make dev' to start development server"
	@echo "3. Open iOS project in Xcode"

# 環境変数テンプレート作成
env-template:
	@echo "Creating environment template..."
	@cat > backend/.env.example << 'EOF'
DASHSCOPE_API_KEY=sk-xxxx
PORT=3000
RATE_LIMIT_RPS=2
ORIGIN_ALLOWLIST=http://localhost:3000
S3_BUCKET=
S3_REGION=ap-northeast-1
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
EOF
	@echo ".env.example created in backend/"