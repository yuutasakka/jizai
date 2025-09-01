import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import axios from 'axios';
import rateLimit from 'express-rate-limit';
import { readFile } from 'fs/promises';
import store from './store.mjs';
import { secureLogger } from './utils/secure-logger.mjs';
import { getCorsConfig, initializeCors } from './utils/cors-config.mjs';
import { initializeSecurityHeaders, initializeCSPReporting } from './utils/security-headers.mjs';
import { responseSanitizer } from './middleware/response-sanitizer.mjs';
import { cspReportHandler, cspStatsHandler } from './utils/csp-reporter.mjs';

// 環境変数を読み込み
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize CORS configuration
initializeCors();

// NGワード読み込み
let banned = ['csam','child','terror','hate','beheading'];
try {
  const raw = await readFile(new URL('./ng_words.json', import.meta.url), 'utf-8');
  const json = JSON.parse(raw);
  if (Array.isArray(json.banned) && json.banned.length) banned = json.banned;
} catch (error) {
  console.warn('⚠️  Could not load ng_words.json, using default banned words');
}

// Multer設定（10MB制限）
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp', 'image/tiff'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
    }
  }
});

// ミドルウェア設定
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
// Sanitize JSON responses (strip codes, mask 5xx messages)
app.use(responseSanitizer());

// Apply environment-aware CORS configuration
app.use(cors(getCorsConfig()));

// Apply security headers (including HSTS for production)
app.use(initializeSecurityHeaders());

// Apply CSP Report-Only mode for violation collection
app.use(initializeCSPReporting({ reportOnly: true }));

// CSP report collection endpoint
app.use(cspReportHandler());

// Rate Limiting設定
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分
    max: parseInt(process.env.RATE_LIMIT_RPS) || 100, // 一般的なエンドポイント
    message: {
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// 画像編集用の厳しいRate Limiting
const editLimiter = rateLimit({
    windowMs: 60 * 1000, // 1分
    max: parseInt(process.env.EDIT_RATE_LIMIT) || 5, // 画像編集は1分に5回まで
    message: {
        error: 'Too Many Requests',
        message: 'Image editing rate limit exceeded. Please wait before trying again.',
        code: 'EDIT_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // デバイスIDベースの制限
        return req.headers['x-device-id'] || req.ip;
    }
});

// 課金用のRate Limiting
const purchaseLimiter = rateLimit({
    windowMs: 60 * 1000, // 1分
    max: parseInt(process.env.PURCHASE_RATE_LIMIT) || 10, // 課金は1分に10回まで
    message: {
        error: 'Too Many Requests',
        message: 'Purchase rate limit exceeded. Please wait before trying again.',
        code: 'PURCHASE_RATE_LIMIT_EXCEEDED'
    },
    keyGenerator: (req) => {
        return req.headers['x-device-id'] || req.ip;
    }
});

// 一般的なミドルウェア適用
app.use(generalLimiter);

// ヘルスチェックエンドポイント
app.get('/v1/health', (req, res) => {
    res.json({ ok: true });
});

// CSP statistics endpoint (for security monitoring)
app.get('/v1/security/csp-stats', cspStatsHandler());

// ルートパス: ローカル確認用の案内
app.get('/', (req, res) => {
    res.status(200).json({
        ok: true,
        message: 'Jizai API server (legacy). Try GET /v1/health',
        docs: '/v1/health'
    });
});

// 画像編集エンドポイント
app.post('/v1/edit', editLimiter, upload.single('image'), async (req, res) => {
    try {
        const { prompt } = req.body;
        const imageFile = req.file;
        const deviceId = req.headers['x-device-id'];

        // バリデーション
        if (!deviceId || typeof deviceId !== 'string' || deviceId.trim().length === 0) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'x-device-id header is required',
                code: 'MISSING_DEVICE_ID'
            });
        }

        if (!imageFile) {
            return res.status(400).json({ 
                error: 'Bad Request', 
                message: 'Image file is required',
                code: 'MISSING_IMAGE'
            });
        }

        if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
            return res.status(400).json({ 
                error: 'Bad Request', 
                message: 'Prompt is required',
                code: 'MISSING_PROMPT'
            });
        }

        // 残高チェック
        const user = await store.getUser(deviceId);
        if (user.credits <= 0) {
            return res.status(402).json({
                error: 'Payment Required',
                message: 'Insufficient credits',
                code: 'INSUFFICIENT_CREDITS',
                credits: user.credits
            });
        }

        // プロンプトのモデレーション
        const lower = prompt.toLowerCase();
        if (banned.some(word => lower.includes(word))) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Prompt contains prohibited content',
                code: 'SAFETY_BLOCKED'
            });
        }

        // API キーチェック
        if (!process.env.DASHSCOPE_API_KEY) {
            return res.status(500).json({
                error: 'Internal Server Error',
                message: 'API key not configured',
                code: 'API_KEY_MISSING'
            });
        }

        // 画像をBase64 DataURL化
        const base64Data = imageFile.buffer.toString('base64');
        const mimeType = imageFile.mimetype;
        const dataURL = `data:${mimeType};base64,${base64Data}`;

        // Use secure logger to sanitize PII from prompt logs
        secureLogger.editRequest(deviceId, prompt, imageFile.size);

        // Qwen-Image-Edit API呼び出し
        const qwenResponse = await axios.post(
            'https://dashscope.aliyuncs.com/api/v1/services/aigc/image-generation/generation',
            {
                model: 'qwen-image-editor',
                input: {
                    image: dataURL,
                    prompt: prompt
                },
                parameters: {
                    format: 'png'
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.DASHSCOPE_API_KEY}`,
                    'Content-Type': 'application/json',
                    'X-DashScope-Async': 'enable'
                },
                timeout: 90000 // 90秒タイムアウト
            }
        );

        // レスポンス詳細検証
        if (!qwenResponse.data) {
            throw new Error('Empty response from Qwen API');
        }

        // APIエラーレスポンスチェック
        if (qwenResponse.data.code && qwenResponse.data.code !== '200') {
            const errorMsg = qwenResponse.data.message || 'Unknown API error';
            throw new Error(`Qwen API Error: ${errorMsg} (Code: ${qwenResponse.data.code})`);
        }

        // 出力構造検証
        if (!qwenResponse.data.output) {
            throw new Error('No output in API response');
        }

        if (!qwenResponse.data.output.results || !Array.isArray(qwenResponse.data.output.results)) {
            throw new Error('Invalid results format in API response');
        }

        if (qwenResponse.data.output.results.length === 0) {
            throw new Error('No results returned from API');
        }

        const imageUrl = qwenResponse.data.output.results[0]?.url;
        if (!imageUrl || typeof imageUrl !== 'string') {
            throw new Error('No valid image URL in response');
        }

        // URL形式とホストの検証（SSRF対策）
        let parsedUrl;
        try {
            parsedUrl = new URL(imageUrl);
        } catch {
            throw new Error('Invalid image URL format');
        }

        if (parsedUrl.protocol !== 'https:') {
            throw new Error('Untrusted image URL protocol');
        }

        // DashScope の生成画像は aliyuncs.com 配下を想定。必要に応じて調整。
        if (!parsedUrl.hostname.endsWith('aliyuncs.com')) {
            throw new Error('Untrusted image host');
        }

        console.log(`📸 Generated image URL: ${imageUrl}`);

        // 画像をダウンロード
        let imageDownload;
        try {
            imageDownload = await axios.get(imageUrl, {
                responseType: 'arraybuffer',
                timeout: 30000, // 30秒タイムアウト
                maxContentLength: 50 * 1024 * 1024, // 50MB制限
                maxRedirects: 0, // リダイレクト無効化（SSRF対策）
                validateStatus: (status) => status === 200
            });
        } catch (downloadError) {
            console.error('❌ Image download failed:', downloadError.message);
            throw new Error('Failed to download generated image');
        }

        // ダウンロードした画像の検証
        if (!imageDownload.data || imageDownload.data.length === 0) {
            throw new Error('Downloaded image is empty');
        }

        // 最小サイズ検証（1KB以上）
        if (imageDownload.data.length < 1024) {
            throw new Error('Downloaded image is too small (likely corrupted)');
        }

        // 成功時のみクレジット消費
        const creditConsumed = await store.consumeCredit(deviceId);
        if (!creditConsumed) {
            return res.status(402).json({
                error: 'Payment Required',
                message: 'Credits exhausted during processing',
                code: 'CREDITS_EXHAUSTED'
            });
        }

        // PNG バイナリとして返却
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Length', imageDownload.data.length);
        res.setHeader('X-Credits-Remaining', (await store.getUser(deviceId)).credits);
        res.send(Buffer.from(imageDownload.data));

        console.log(`✅ Edit completed successfully, ${imageDownload.data.length} bytes`);

    } catch (error) {
        console.error('❌ Edit error:', error.message);

        // エラー分類
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
            return res.status(502).json({
                error: 'Bad Gateway',
                message: 'External API is temporarily unavailable',
                code: 'API_UNAVAILABLE'
            });
        }

        if (error.response?.status === 400) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid request to image generation API',
                code: 'INVALID_REQUEST'
            });
        }

        if (error.response?.status === 401) {
            return res.status(500).json({
                error: 'Internal Server Error',
                message: 'API authentication failed',
                code: 'AUTH_FAILED'
            });
        }

        // その他のエラー
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Image generation failed',
            code: 'GENERATION_FAILED'
        });
    }
});

// 残高確認エンドポイント
app.get('/v1/balance', async (req, res) => {
    try {
        const { deviceId } = req.query;

        if (!deviceId || typeof deviceId !== 'string' || deviceId.trim().length === 0) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'deviceId query parameter is required',
                code: 'MISSING_DEVICE_ID'
            });
        }

        const user = await store.getUser(deviceId);
        
        res.json({
            credits: user.credits,
            deviceId: deviceId,
            lastAccessAt: user.lastAccessAt
        });

        console.log(`💰 Balance check: ${deviceId} has ${user.credits} credits`);

    } catch (error) {
        console.error('❌ Balance check error:', error.message);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to retrieve balance',
            code: 'BALANCE_FAILED'
        });
    }
});

// 課金処理エンドポイント
app.post('/v1/purchase', purchaseLimiter, async (req, res) => {
    try {
        const { deviceId, productId, transactionId } = req.body;

        // バリデーション
        if (!deviceId || typeof deviceId !== 'string' || deviceId.trim().length === 0) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'deviceId is required',
                code: 'MISSING_DEVICE_ID'
            });
        }

        if (!productId || typeof productId !== 'string') {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'productId is required',
                code: 'MISSING_PRODUCT_ID'
            });
        }

        if (!transactionId || typeof transactionId !== 'string') {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'transactionId is required',
                code: 'MISSING_TRANSACTION_ID'
            });
        }

        const result = await store.addPurchase(deviceId, productId, transactionId);

        if (result.duplicate) {
            return res.status(409).json({
                error: 'Conflict',
                message: 'Transaction already processed',
                code: 'DUPLICATE_TRANSACTION',
                credits: result.credits
            });
        }

        res.json({
            success: true,
            credits: result.credits,
            added: result.added,
            deviceId: deviceId,
            productId: productId,
            transactionId: transactionId
        });

    } catch (error) {
        console.error('❌ Purchase error:', error.message);
        
        if (error.message.includes('Unknown product')) {
            return res.status(400).json({
                error: 'Bad Request',
                message: error.message,
                code: 'INVALID_PRODUCT'
            });
        }

        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Purchase processing failed',
            code: 'PURCHASE_FAILED'
        });
    }
});

// 通報エンドポイント
app.post('/v1/report', async (req, res) => {
    try {
        const { deviceId, jobId, reasonId, note } = req.body;

        // バリデーション
        if (!deviceId || typeof deviceId !== 'string' || deviceId.trim().length === 0) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'deviceId is required',
                code: 'MISSING_DEVICE_ID'
            });
        }

        if (!reasonId || typeof reasonId !== 'string') {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'reasonId is required',
                code: 'MISSING_REASON_ID'
            });
        }

        // 有効な理由IDチェック
        const validReasons = ['copyright', 'privacy', 'sexual', 'violence', 'other'];
        if (!validReasons.includes(reasonId)) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid reasonId',
                code: 'INVALID_REASON_ID',
                validReasons: validReasons
            });
        }

        const report = await store.addReport(deviceId, jobId, reasonId, note);

        res.json({
            success: true,
            reportId: report.id,
            message: 'Report submitted successfully'
        });

    } catch (error) {
        console.error('❌ Report error:', error.message);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Report submission failed',
            code: 'REPORT_FAILED'
        });
    }
});

// 404ハンドラー
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Not Found',
        message: `Endpoint ${req.method} ${req.originalUrl} not found`
    });
});

// エラーハンドラー
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// サーバー起動
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/v1/health`);
    
    // 必須環境変数チェック
    if (!process.env.DASHSCOPE_API_KEY) {
        console.warn('⚠️  DASHSCOPE_API_KEY not set in .env file');
    }
});

export default app;
