// Enhanced Jizai Backend with Vault Subscription System
// Integrates existing image editing API with comprehensive subscription management
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import axios from 'axios';
import rateLimit from 'express-rate-limit';
import { readFile } from 'fs/promises';
import { secureLogger, sanitizeText } from './utils/secure-logger.mjs';
import { getCorsConfig, initializeCors } from './utils/cors-config.mjs';
import { initializeSecurityHeaders, initializeCSPReporting } from './utils/security-headers.mjs';
import { responseSanitizer } from './middleware/response-sanitizer.mjs';
import { cspReportHandler, cspStatsHandler } from './utils/csp-reporter.mjs';

// Import vault subscription system
import { initializeDatabase, checkDatabaseHealth } from './config/supabase.mjs';
import { rlsAuthMiddleware } from './middleware/rls-auth.mjs';
import subscriptionRoutes from './routes/subscriptions.mjs';
import familySharingRoutes from './routes/family-sharing.mjs';
import printExportRoutes from './routes/print-export.mjs';
import webhookRoutes from './routes/webhooks.mjs';

// Import legacy store for backward compatibility
import store from './store.mjs';

// 環境変数を読み込み
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize CORS configuration
initializeCors();

// ========================================
// INITIALIZATION
// ========================================

// Initialize database connection
let databaseInitialized = false;
try {
    await initializeDatabase();
    databaseInitialized = true;
    console.log('✅ Vault subscription system initialized');
} catch (error) {
    console.error('❌ Vault subscription system initialization failed:', error.message);
    // Do not fall back to local storage; require Supabase
}

// NGワード読み込み
let banned = ['csam','child','terror','hate','beheading'];
try {
    const raw = await readFile(new URL('./ng_words.json', import.meta.url), 'utf-8');
    const json = JSON.parse(raw);
    if (Array.isArray(json.banned) && json.banned.length) banned = json.banned;
} catch (error) {
    console.warn('⚠️  Could not load ng_words.json, using default banned words');
}

// ========================================
// MIDDLEWARE CONFIGURATION
// ========================================

// Enhanced Multer for vault memory uploads
const createMemoryUpload = (maxSize = 50 * 1024 * 1024) => multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: maxSize
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            // Images
            'image/jpeg', 'image/png', 'image/webp', 'image/bmp', 'image/tiff', 'image/gif', 'image/heic',
            // Videos  
            'video/mp4', 'video/mov', 'video/avi', 'video/quicktime',
            // Documents
            'application/pdf', 'text/plain',
            // Audio
            'audio/mpeg', 'audio/wav', 'audio/aac'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
        }
    }
});

const upload = createMemoryUpload(10 * 1024 * 1024); // 10MB for image editing
const vaultUpload = createMemoryUpload(100 * 1024 * 1024); // 100MB for vault memories

// JSON parsing
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

// ========================================
// RATE LIMITING
// ========================================

// General rate limiting
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分
    max: parseInt(process.env.RATE_LIMIT_RPS) || 100,
    message: {
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Image editing rate limiting (existing)
const editLimiter = rateLimit({
    windowMs: 60 * 1000, // 1分
    max: parseInt(process.env.EDIT_RATE_LIMIT) || 5,
    message: {
        error: 'Too Many Requests',
        message: 'Image editing rate limit exceeded. Please wait before trying again.',
        code: 'EDIT_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.headers['x-device-id'] || req.ip;
    }
});

// Purchase rate limiting (existing)
const purchaseLimiter = rateLimit({
    windowMs: 60 * 1000, // 1分
    max: parseInt(process.env.PURCHASE_RATE_LIMIT) || 10,
    message: {
        error: 'Too Many Requests',
        message: 'Purchase rate limit exceeded. Please wait before trying again.',
        code: 'PURCHASE_RATE_LIMIT_EXCEEDED'
    },
    keyGenerator: (req) => {
        return req.headers['x-device-id'] || req.ip;
    }
});

// Vault upload rate limiting
const vaultUploadLimiter = rateLimit({
    windowMs: 60 * 1000, // 1分
    max: parseInt(process.env.VAULT_UPLOAD_RATE_LIMIT) || 20, // 20 uploads per minute
    message: {
        error: 'Too Many Requests',
        message: 'Memory upload rate limit exceeded. Please wait before trying again.',
        code: 'VAULT_UPLOAD_RATE_LIMIT_EXCEEDED'
    },
    keyGenerator: (req) => {
        return req.headers['x-device-id'] || req.ip;
    }
});

// Apply general rate limiting
app.use(generalLimiter);

// ========================================
// HEALTH CHECK & STATUS
// ========================================

// Friendly root message for local checks
app.get('/', (req, res) => {
    res.status(200).json({
        ok: true,
        message: 'Jizai API server. Try GET /v1/health',
        docs: '/v1/health'
    });
});

app.get('/v1/health', async (req, res) => {
    const health = {
        ok: true,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        services: {
            imageEditing: true,
            legacyStorage: true,
            vaultSystem: databaseInitialized,
            database: databaseInitialized ? await checkDatabaseHealth() : false
        }
    };

    const statusCode = health.services.database ? 200 : 503;
    res.status(statusCode).json(health);
});

// CSP statistics endpoint (for security monitoring)
app.get('/v1/security/csp-stats', cspStatsHandler());

// API version check
app.get('/v1/version', (req, res) => {
    res.json({
        version: '2.0.0',
        features: {
            imageEditing: true,
            vaultSubscriptions: databaseInitialized,
            familySharing: databaseInitialized,
            printExport: databaseInitialized,
            appStoreIntegration: databaseInitialized
        },
        compatibility: {
            minIosVersion: '15.0',
            maxApiVersion: '2.0'
        }
    });
});

// ========================================
// VAULT SUBSCRIPTION ROUTES
// ========================================

if (databaseInitialized) {
    // Apply RLS authentication middleware to user-facing routes
    app.use('/v1/subscription/*', rlsAuthMiddleware());
    app.use('/v1/family/*', rlsAuthMiddleware());
    app.use('/v1/print-export/*', rlsAuthMiddleware());
    
    // Subscription management
    app.use('/v1/subscription', subscriptionRoutes);
    
    // Family sharing
    app.use('/v1/family', familySharingRoutes);
    
    // Print export
    app.use('/v1/print-export', printExportRoutes);
    
    // App Store webhooks (no auth needed - external service)
    app.use('/v1/webhooks', webhookRoutes);
    
    console.log('✅ Vault subscription routes registered with RLS authentication');
}

// ========================================
// LEGACY IMAGE EDITING API (PRESERVED)
// ========================================

// 画像編集エンドポイント（既存機能を保持）
import { supabaseService, supabaseStorage } from './config/supabase.mjs';
import { SubscriptionService } from './services/subscription-service.mjs';
import { monitorServiceClientUsage } from './middleware/rls-auth.mjs';
import { randomUUID } from 'crypto';

const subscriptionService = new SubscriptionService();

app.post('/v1/edit', editLimiter, rlsAuthMiddleware(), upload.single('image'), async (req, res) => {
    try {
        const { prompt } = req.body;
        const imageFile = req.file;
        const deviceId = req.headers['x-device-id'];
        const { vaultId: providedVaultId } = req.body || {};

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

        // Ensure user exists in Supabase (no local storage)
        if (!databaseInitialized) {
            return res.status(503).json({
                error: 'Service Unavailable',
                message: 'Database not initialized',
                code: 'DB_UNAVAILABLE'
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

        // Persist original and edited images to Supabase Storage and record as memories
        const user = await subscriptionService.getOrCreateUser(deviceId);

        // Ensure a default vault exists for this user (using authenticated client)
        let targetVaultId = providedVaultId;
        if (!targetVaultId) {
            const { data: existingVault } = await req.supabaseAuth
                .from('vaults')
                .select('id')
                .is('deleted_at', null)
                .order('created_at', { ascending: true })
                .limit(1)
                .single();
            if (existingVault?.id) {
                targetVaultId = existingVault.id;
            } else {
                const { data: newVault, error: vaultErr } = await req.supabaseAuth
                    .from('vaults')
                    .insert({
                        owner_id: req.user.id,
                        name: 'My Vault',
                        description: 'Default vault',
                        created_at: new Date()
                    })
                    .select('id')
                    .single();
                if (vaultErr) throw vaultErr;
                targetVaultId = newVault.id;
            }
        }

        // Upload original image
        const originalExt = mimeTypeToExt(imageFile.mimetype);
        const originalFilename = `original_${randomUUID()}.${originalExt}`;
        const originalPath = `memories/${user.id}/${originalFilename}`;
        await supabaseStorage
            .from('vault-storage')
            .upload(originalPath, imageFile.buffer, {
                cacheControl: '3600',
                contentType: imageFile.mimetype
            });

        // Upload edited image (PNG)
        const editedFilename = `edited_${randomUUID()}.png`;
        const editedPath = `memories/${user.id}/${editedFilename}`;
        await supabaseStorage
            .from('vault-storage')
            .upload(editedPath, Buffer.from(imageDownload.data), {
                cacheControl: '3600',
                contentType: 'image/png'
            });

        // Insert memory records
        const memoryRecords = [
            {
                vault_id: targetVaultId,
                filename: originalFilename,
                original_filename: imageFile.originalname || originalFilename,
                file_size_bytes: imageFile.size,
                mime_type: imageFile.mimetype,
                file_url: originalPath,
                title: 'Original Image',
                uploaded_by: deviceId,
                uploaded_at: new Date().toISOString(),
                processing_status: 'completed'
            },
            {
                vault_id: targetVaultId,
                filename: editedFilename,
                original_filename: editedFilename,
                file_size_bytes: imageDownload.data.length,
                mime_type: 'image/png',
                file_url: editedPath,
                title: `Edited: ${sanitizeText(prompt, { maxLength: 60 })}`,
                uploaded_by: deviceId,
                uploaded_at: new Date().toISOString(),
                processing_status: 'completed'
            }
        ];

        await req.supabaseAuth.from('memories').insert(memoryRecords);

        // Return generated image as PNG to the client
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Length', imageDownload.data.length);
        // 互換性のためにダミーの残回数ヘッダーを付与（実際の課金はサブスクで管理）
        res.setHeader('X-Credits-Remaining', '999');
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

// 残高確認エンドポイント（Legacy + Vault統合）
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

        // Supabase-only: return subscription/storage summary
        const subscription = await subscriptionService.getActiveSubscription(deviceId);
        // Fetch or create user to read storage fields
        const user = await subscriptionService.getOrCreateUser(deviceId);
        res.json({
            deviceId,
            subscription: subscription ? {
                status: subscription.status,
                tier: subscription.tier,
                expiresAt: subscription.expires_date
            } : { status: 'free', tier: 'free' },
            storage: {
                quota: user.storage_quota || 0,
                used: user.storage_used || 0
            }
        });

    } catch (error) {
        console.error('❌ Balance check error:', error.message);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to retrieve balance',
            code: 'BALANCE_FAILED'
        });
    }
});

function mimeTypeToExt(mime) {
    const map = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/bmp': 'bmp',
        'image/tiff': 'tiff',
        'image/gif': 'gif',
        'image/heic': 'heic'
    };
    return map[mime] || 'bin';
}

// 課金処理エンドポイント（Legacy preserved）
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

        // Legacy credit purchase (always available)
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
            transactionId: transactionId,
            system: 'legacy',
            note: databaseInitialized ? 'Use /v1/subscription/* for vault subscriptions' : null
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

// 通報エンドポイント（既存機能を保持）
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

// ========================================
// ERROR HANDLING
// ========================================

// 404ハンドラー
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Not Found',
        message: `Endpoint ${req.method} ${req.originalUrl} not found`,
        availableEndpoints: {
            legacy: ['/v1/edit', '/v1/balance', '/v1/purchase', '/v1/report'],
            vault: databaseInitialized ? [
                '/v1/subscription/*', 
                '/v1/family/*', 
                '/v1/print-export/*', 
                '/v1/webhooks/*'
            ] : ['(unavailable)']
        }
    });
});

// エラーハンドラー
app.use((err, req, res, next) => {
    console.error('❌ Unhandled error:', err.stack);
    
    // Multer file size error
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
            error: 'Payload Too Large',
            message: 'File size exceeds limit',
            code: 'FILE_TOO_LARGE'
        });
    }

    // CORS error
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({
            error: 'Forbidden',
            message: 'CORS policy violation',
            code: 'CORS_VIOLATION'
        });
    }

    res.status(500).json({ 
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
        code: 'INTERNAL_ERROR'
    });
});

// ========================================
// SERVER STARTUP
// ========================================

// Graceful shutdown handling
process.on('SIGTERM', async () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('🛑 SIGINT received, shutting down gracefully');  
    process.exit(0);
});

// サーバー起動
const server = app.listen(PORT, () => {
    console.log(`🚀 Jizai Backend Server running on http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/v1/health`);
    console.log(`📊 Version info: http://localhost:${PORT}/v1/version`);
    
    // Feature availability
    console.log('\n🎯 Available Features:');
    console.log('  ✅ Image Editing API (Legacy)');
    console.log('  ✅ Credit System (Legacy)');
    console.log(`  ${databaseInitialized ? '✅' : '❌'} Vault Subscription System`);
    console.log(`  ${databaseInitialized ? '✅' : '❌'} Family Sharing`);
    console.log(`  ${databaseInitialized ? '✅' : '❌'} Print Export`);
    console.log(`  ${databaseInitialized ? '✅' : '❌'} App Store Integration`);
    
    // 必須環境変数チェック
    if (!process.env.DASHSCOPE_API_KEY) {
        console.warn('\n⚠️  DASHSCOPE_API_KEY not set in .env file');
    }
    
    if (databaseInitialized && !process.env.SUPABASE_URL) {
        console.warn('\n⚠️  SUPABASE_URL not set - vault features unavailable');
    }

    console.log('\n🌟 Server ready for requests!');
});

// Handle server errors
server.on('error', (error) => {
    console.error('❌ Server error:', error);
    process.exit(1);
});

export default app;
