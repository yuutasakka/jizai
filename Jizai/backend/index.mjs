import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import axios from 'axios';
import { readFile } from 'fs/promises';

// 環境変数を読み込み
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: process.env.ORIGIN_ALLOWLIST?.split(',') || ['http://localhost:3000'],
    credentials: true
}));

// ヘルスチェックエンドポイント
app.get('/v1/health', (req, res) => {
    res.json({ ok: true });
});

// 画像編集エンドポイント
app.post('/v1/edit', upload.single('image'), async (req, res) => {
    try {
        const { prompt } = req.body;
        const imageFile = req.file;

        // バリデーション
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

        console.log(`📝 Edit request: prompt="${prompt}" size=${imageFile.size} bytes`);

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

        // レスポンス確認
        if (!qwenResponse.data || !qwenResponse.data.output || !qwenResponse.data.output.results) {
            throw new Error('Invalid API response format');
        }

        const imageUrl = qwenResponse.data.output.results[0]?.url;
        if (!imageUrl) {
            throw new Error('No image URL in response');
        }

        console.log(`📸 Generated image URL: ${imageUrl}`);

        // 画像をダウンロード
        const imageDownload = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 30000 // 30秒タイムアウト
        });

        // PNG バイナリとして返却
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Length', imageDownload.data.length);
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