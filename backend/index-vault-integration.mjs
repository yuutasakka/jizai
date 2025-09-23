// Enhanced Jizai Backend with Vault Subscription System
// Integrates existing image editing API with comprehensive subscription management
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import os from 'os';
import path from 'path';
import axios from 'axios';
import rateLimit from 'express-rate-limit';
import { readFile } from 'fs/promises';
import { secureLogger, sanitizeText } from './utils/secure-logger.mjs';
import { getCorsConfig, initializeCors } from './utils/cors-config.mjs';
import { initializeSecurityHeaders, initializeCSPReporting } from './utils/security-headers.mjs';
import { responseSanitizer } from './middleware/response-sanitizer.mjs';
import { cspReportHandler, cspStatsHandler } from './utils/csp-reporter.mjs';
import { metrics } from './utils/metrics.mjs';

// Import vault subscription system
import { initializeDatabase, checkDatabaseHealth } from './config/supabase.mjs';
import { rlsAuthMiddleware } from './middleware/rls-auth.mjs';
import subscriptionRoutes from './routes/subscriptions.mjs';
import familySharingRoutes from './routes/family-sharing.mjs';
import printExportRoutes from './routes/print-export.mjs';
import webhookRoutes from './routes/webhooks.mjs';
import { authzTokenMiddleware, requireAuth } from './middleware/authz-token.mjs';
import { enforceAuthLink } from './middleware/enforce-auth-link.mjs';

// Import legacy store for backward compatibility
import store from './store.mjs';

// 環境変数を読み込み
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize CORS configuration
initializeCors();

// Hide implementation details
app.disable('x-powered-by');
// Trust first proxy (for accurate req.ip/req.secure behind reverse proxies)
if (process.env.TRUST_PROXY !== 'false') {
    app.set('trust proxy', 1);
}

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
const createUpload = ({ maxSize = 50 * 1024 * 1024, disk = false } = {}) => multer({
    storage: disk ? multer.diskStorage({
        destination: (_req, _file, cb) => cb(null, os.tmpdir()),
        filename: (_req, file, cb) => {
            const safe = (file.originalname || 'upload').replace(/[\r\n\0]/g, '_');
            cb(null, `${Date.now()}_${safe}`);
        }
    }) : multer.memoryStorage(),
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
        
        // basic filename sanity (no control chars, not too long)
        const name = file.originalname || '';
        if (name.length > 200 || /[\0\r\n]/.test(name)) {
            return cb(new Error('Invalid filename'), false);
        }

        if (allowedTypes.includes(file.mimetype)) {
            return cb(null, true);
        }
        return cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
    }
});

const upload = createUpload({ maxSize: 10 * 1024 * 1024, disk: false }); // 10MB for image editing (memory)
const vaultUpload = createUpload({ maxSize: 100 * 1024 * 1024, disk: true }); // 100MB for vault (disk)

async function getFileBuffer(file) {
    if (!file) return null;
    if (file.buffer) return file.buffer;
    if (file.path) {
        try { return await readFile(file.path); } catch { return null; }
    }
    return null;
}

// Ensure raw body is available for webhooks before JSON parser (for signature verification)
app.use('/v1/webhooks', express.raw({ type: 'application/json' }));

// JSON parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
// Sanitize JSON responses (strip codes, mask 5xx messages)
app.use(responseSanitizer());

// Tightened CORS for webhooks (no browser credentials required)
app.use('/v1/webhooks', cors({ origin: true, credentials: false }));

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
    const t0 = Date.now();
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
    metrics.inc('http_requests_total', { route: '/v1/health', method: 'GET', status: statusCode });
    metrics.observe('http_request_duration_ms', { route: '/v1/health', method: 'GET' }, Date.now() - t0);
});

// CSP statistics endpoint (for security monitoring)
// Admin token/IP gate for CSP stats (avoid information exposure)
function requireAdminToken(req, res, next) {
    const expected = process.env.ADMIN_TOKEN;
    const provided = req.headers['x-admin-token'];
    if (process.env.NODE_ENV === 'production') {
        if (!expected || !provided || provided !== expected) {
            return res.status(401).json({ error: 'Unauthorized', message: 'Admin token required' });
        }
    }
    return next();
}
function optionalAdminIpAllowlist(req, res, next) {
    const list = (process.env.ADMIN_IP_ALLOWLIST || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
    if (list.length === 0) return next();
    const ip = req.ip || req.connection?.remoteAddress || '';
    if (list.includes(ip)) return next();
    return res.status(403).json({ error: 'Forbidden', message: 'IP not allowed' });
}

app.get('/v1/security/csp-stats', optionalAdminIpAllowlist, requireAdminToken, cspStatsHandler());

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
    // Require Supabase JWT and then apply RLS auth (deviceId-based) for user-facing routes
    app.use('/v1/subscription/*', requireAuth());
    app.use('/v1/family/*', requireAuth());
    app.use('/v1/print-export/*', requireAuth());

    app.use('/v1/subscription/*', rlsAuthMiddleware());
    app.use('/v1/family/*', rlsAuthMiddleware());
    app.use('/v1/print-export/*', rlsAuthMiddleware());

    // Supabase Auth ユーザーと deviceIdユーザーの紐付けを強制
    app.use('/v1/subscription/*', enforceAuthLink());
    app.use('/v1/family/*', enforceAuthLink());
    app.use('/v1/print-export/*', enforceAuthLink());
    
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

// In development, allow device-id fallback by skipping hard JWT requirement
const requireAuthMaybe = (process.env.NODE_ENV === 'production') ? requireAuth() : (req, _res, next) => next();

// ========================================
// USER PROMPTS ROUTES
// ========================================

// List saved prompts for current user (RLS-scoped)
app.get('/v1/prompts', requireAuthMaybe, rlsAuthMiddleware(), enforceAuthLink(), async (req, res) => {
    try {
        const { supabaseAuth } = req;
        const rawLimit = parseInt(req.query.limit, 10);
        const rawOffset = parseInt(req.query.offset, 10);
        const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 30;
        const offset = Number.isFinite(rawOffset) ? Math.max(rawOffset, 0) : 0;
        const source = req.query.source && ['user','template'].includes(req.query.source) ? req.query.source : null;

        let query = supabaseAuth
            .from('user_prompts')
            .select('id, source, example_key, used_in_memory, created_at', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (source) query = query.eq('source', source);

        const { data, error, count } = await query;
        if (error) {
            const msg = (error.message || '').toLowerCase();
            if (msg.includes('relation') && msg.includes('does not exist')) {
                return res.json({ items: [], pagination: { limit, offset, total: 0, hasMore: false }, migrationRequired: true });
            }
            return res.status(500).json({ error: 'Internal Server Error', message: error.message, code: 'PROMPT_LIST_FAILED' });
        }
        res.json({
            // Do not expose prompt_text to clients
            items: (data || []).map(r => ({ id: r.id, source: r.source, example_key: r.example_key, used_in_memory: r.used_in_memory, created_at: r.created_at })),
            pagination: {
                limit,
                offset,
                total: typeof count === 'number' ? count : (data?.length || 0),
                hasMore: typeof count === 'number' ? (offset + (data?.length || 0) < count) : false
            }
        });
    } catch (e) {
        res.status(500).json({ error: 'Internal Server Error', message: 'Failed to list prompts', code: 'PROMPT_LIST_EXCEPTION' });
    }
});

// Popular template prompts (global, based on usage count)
app.get('/v1/prompts/popular', requireAuthMaybe, rlsAuthMiddleware(), enforceAuthLink(), async (req, res) => {
    try {
        const { supabaseAuth } = req;
        const rawLimit = parseInt(req.query.limit, 10);
        const rawOffset = parseInt(req.query.offset, 10);
        const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 12;
        const offset = Number.isFinite(rawOffset) ? Math.max(rawOffset, 0) : 0;

        const { data, error, count } = await supabaseAuth
            .from('user_prompt_popularity')
            .select('key, example_key, uses, last_used', { count: 'exact' })
            .order('uses', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            const msg = (error.message || '').toLowerCase();
            if (msg.includes('relation') && msg.includes('does not exist')) {
                return res.json({ items: [], pagination: { limit, offset, total: 0, hasMore: false }, migrationRequired: true });
            }
            return res.status(500).json({ error: 'Internal Server Error', message: error.message, code: 'POPULAR_PROMPTS_FAILED' });
        }
        res.json({
            // Do not expose prompt_text to clients
            items: (data || []).map(r => ({ key: r.key, example_key: r.example_key, uses: r.uses, last_used: r.last_used })),
            pagination: {
                limit,
                offset,
                total: typeof count === 'number' ? count : (data?.length || 0),
                hasMore: typeof count === 'number' ? (offset + (data?.length || 0) < count) : false
            }
        });
    } catch (e) {
        res.status(500).json({ error: 'Internal Server Error', message: 'Failed to list popular prompts', code: 'POPULAR_PROMPTS_EXCEPTION' });
    }
});

// ========================================
// LEGACY IMAGE EDITING API (PRESERVED)
// ========================================

// 画像編集エンドポイント（既存機能を保持）
import { supabaseService, supabaseStorage } from './config/supabase.mjs';
import { SubscriptionService } from './services/subscription-service.mjs';
import { monitorServiceClientUsage } from './middleware/rls-auth.mjs';
import { randomUUID } from 'crypto';

const subscriptionService = new SubscriptionService();

// Prompt lookup helper (Supabase -> English prompt) with safe fallback
async function resolveEditingPrompt(optionId) {
    const table = process.env.EDITING_PROMPT_TABLE || 'editing_prompts';
    const keyCol = process.env.EDITING_PROMPT_KEY_COLUMN || 'key';
    const textCol = process.env.EDITING_PROMPT_TEXT_COLUMN || 'en_prompt';

    try {
        const { data, error } = await supabaseService
            .from(table)
            .select(`${keyCol}, ${textCol}`)
            .eq(keyCol, optionId)
            .limit(1)
            .maybeSingle();
        if (error) {
            console.warn('⚠️  Prompt lookup error:', error.message);
        }
        if (data && data[textCol]) return data[textCol];
    } catch (e) {
        console.warn('⚠️  Prompt lookup exception:', e.message);
    }

    // Fallback prompt mapping for immediate use
    const fallback = {
        'bg_remove': 'Remove background and any people or objects not the main subject. Clean studio-like plain background.',
        'skin_tone': 'Improve facial skin tone to look healthy and warm. Natural, soft, accurate color balance.',
        'attire_suit': 'Change clothing to a dark suit with a white shirt. Formal, realistic blending.',
        'attire_dress': 'Change clothing to a dark formal dress. Elegant, realistic blending.',
        'enhance_quality': 'Enhance overall image quality and sharpness. Increase resolution and clarity without artifacts.',
        'smile_adjust': 'Gently adjust facial expression to a warm, natural smile. Subtle and realistic.',
        'wrinkle_spot_reduce': 'Reduce deep wrinkles and diminish spots or uneven skin tone while keeping natural texture.',
        'hair_fix': 'Fill thinning hair naturally, reduce gray hair to black hair, and tidy the hairstyle.',
        'glasses_reflection': 'Remove reflections and glare from eyeglasses while preserving frame details.',
        // Tutorial examples mapping (opaque keys)
        'example_1': 'Transform into futuristic avatar style',
        'example_2': 'Add romantic vintage film effect',
        'example_3': 'Create food art collage style',
        'example_4': 'Add cosmic space background effect',
        'example_5': 'Create artistic double exposure',
        'example_6': 'Transform with dreamy aesthetic filter'
    };
    return fallback[optionId] || 'Enhance the image quality naturally.';
}

// Gemini Images API integration (edits). Falls back to dry-run when enabled.
async function runImageEditGemini({ base64Data, mimeType, prompt, profile = 'standard' }) {
    // Dry-run: return tiny transparent PNG
    if (process.env.EDIT_DRY_RUN === 'true') {
        return sharp({ create: { width: 16, height: 16, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).png().toBuffer();
    }

    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY not configured');
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/images:edit?key=${process.env.GEMINI_API_KEY}`;
    const body = {
        image: { inlineData: { mimeType, data: base64Data } },
        instructions: prompt || 'Enhance the image quality naturally.',
        config: { mimeType: 'image/png' },
        // vendor-specific hints (profile as a lightweight hint)
        options: { profile }
    };

    const maxAttempts = 3;
    let lastErr = null;
    let resp = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            resp = await axios.post(endpoint, body, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 90000,
                maxContentLength: 50 * 1024 * 1024,
                validateStatus: (s) => s === 200
            });
            break;
        } catch (e) {
            lastErr = e;
            const status = e?.response?.status;
            const retriable = status === 429 || (status >= 500 && status < 600) || e.code === 'ETIMEDOUT' || e.code === 'ECONNRESET';
            if (!retriable || attempt === maxAttempts) {
                throw e;
            }
            const backoff = 400 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 200);
            await new Promise(r => setTimeout(r, backoff));
        }
    }

    // Try multiple response shapes (defensive parsing across API variants)
    const candidates = [
        resp.data?.image?.inlineData?.data,
        resp.data?.images?.[0]?.inlineData?.data,
        resp.data?.candidates?.[0]?.content?.parts?.find(p => p.inline_data)?.inline_data?.data,
        resp.data?.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data
    ].filter(Boolean);

    if (!candidates.length) {
        throw new Error('No inline image data returned from Gemini');
    }
    const b64 = candidates[0];
    const buf = Buffer.from(b64, 'base64');
    if (!buf || buf.length < 1024) {
        throw new Error('Edited image invalid or too small');
    }
    return buf;
}

// New: Edit by optionId -> resolves prompt from Supabase then runs edit
app.post('/v1/edit-by-option', editLimiter, requireAuthMaybe, rlsAuthMiddleware(), enforceAuthLink(), upload.single('image'), async (req, res) => {
    const t0 = Date.now();
    let profile = 'standard';
    try {
        const imageFile = req.file;
        const deviceId = req.deviceId;
        const { option_id: optionId, engine_profile } = req.body || {};
        profile = (engine_profile || 'standard').toString();

        // deviceIdはミドルウェアで識別
        if (!imageFile) {
            return res.status(400).json({ error: 'Bad Request', message: 'Image file is required', code: 'MISSING_IMAGE' });
        }
        if (!optionId || typeof optionId !== 'string') {
            return res.status(400).json({ error: 'Bad Request', message: 'option_id is required', code: 'MISSING_OPTION_ID' });
        }

        if (!databaseInitialized) {
            return res.status(503).json({ error: 'Service Unavailable', message: 'Database not initialized', code: 'DB_UNAVAILABLE' });
        }

        // Magic byte check (prevent MIME spoofing)
        try {
            const imgBuf = await getFileBuffer(imageFile);
            const meta = await sharp(imgBuf).metadata();
            const format = meta.format;
            const mimeMap = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', tiff: 'image/tiff', gif: 'image/gif', heif: 'image/heic', avif: 'image/avif' };
            const detected = mimeMap[format] || null;
            if (!detected || detected !== imageFile.mimetype) {
                return res.status(400).json({ error: 'Bad Request', message: 'Invalid image data (mime mismatch)', code: 'INVALID_IMAGE_DATA' });
            }
            const w = meta.width || 0;
            const h = meta.height || 0;
            const maxSide = parseInt(process.env.MAX_IMAGE_SIDE || '12000', 10);
            const maxPixels = parseInt(process.env.MAX_IMAGE_PIXELS || String(100 * 1000 * 1000), 10);
            if (w <= 0 || h <= 0 || w > maxSide || h > maxSide || (w * h) > maxPixels) {
                return res.status(413).json({ error: 'Payload Too Large', message: 'Image dimensions exceed allowed limits', code: 'IMAGE_TOO_LARGE' });
            }
        } catch (e) {
            return res.status(400).json({ error: 'Bad Request', message: 'Invalid or corrupted image file', code: 'INVALID_IMAGE_FILE' });
        }

        const prompt = await resolveEditingPrompt(optionId);
        const lower = prompt.toLowerCase();
        if (banned.some(word => lower.includes(word))) {
            return res.status(400).json({ error: 'Bad Request', message: 'Prompt contains prohibited content', code: 'SAFETY_BLOCKED' });
        }

        // Credits check (user-based)
        {
            const remaining = await creditsService.getCredits(req.user.id, deviceId);
            if (remaining <= 0) {
                return res.status(402).json({ error: 'Payment Required', message: 'Insufficient credits', code: 'INSUFFICIENT_CREDITS', credits: remaining });
            }
        }

        // Convert image to DataURL
        const buf = await getFileBuffer(imageFile);
        if (!buf) {
            return res.status(400).json({ error: 'Bad Request', message: 'Failed to read image', code: 'READ_FAILED' });
        }
        const base64Data = buf.toString('base64');
        const mimeType = imageFile.mimetype;
        const dataURL = `data:${mimeType};base64,${base64Data}`;
        secureLogger.editRequest(deviceId, prompt, imageFile.size);

        // Gemini-based edit
        const editedBuffer = await runImageEditGemini({ base64Data, mimeType, prompt, profile });

        // Persist original and edited images to Supabase Storage and record as memories (same as /v1/edit)
        const user = req.user || await subscriptionService.getOrCreateUser(deviceId);
        // Ensure a default vault exists for this user (using authenticated client)
        let targetVaultId;
        const { data: existingVault } = await req.supabaseAuth
            .from('vaults')
            .select('id')
            .is('deleted_at', null)
            .order('created_at', { ascending: true })
            .limit(1)
            .single();
        if (existingVault?.id) targetVaultId = existingVault.id;

        // Upload original image
        const originalExt = mimeTypeToExt(imageFile.mimetype);
        const originalFilename = `original_${randomUUID()}.${originalExt}`;
        const originalPath = `memories/${user.id}/${originalFilename}`;
        const origBuf = await getFileBuffer(imageFile);
        await supabaseStorage.from('vault-storage').upload(originalPath, origBuf, { cacheControl: '3600', contentType: imageFile.mimetype });

        // Upload edited image (PNG)
        const editedFilename = `edited_${randomUUID()}.png`;
        const editedPath = `memories/${user.id}/${editedFilename}`;
        await supabaseStorage.from('vault-storage').upload(editedPath, editedBuffer, { cacheControl: '3600', contentType: 'image/png' });

        // Insert memory records (simplified)
        const { data: insertedMemories } = await req.supabaseAuth.from('memories').insert([
            { vault_id: targetVaultId, filename: originalFilename, original_filename: imageFile.originalname || originalFilename, file_size_bytes: imageFile.size, mime_type: imageFile.mimetype, file_url: originalPath, title: 'Original Image', uploaded_by: deviceId, uploaded_at: new Date().toISOString(), memory_type: 'image', is_archived: false },
            { vault_id: targetVaultId, filename: editedFilename, original_filename: editedFilename, file_size_bytes: editedBuffer.length, mime_type: 'image/png', file_url: editedPath, title: 'Edited Image', uploaded_by: deviceId, uploaded_at: new Date().toISOString(), memory_type: 'image', is_archived: false }
        ]).select('id');

        // Save prompt used (template) - do not persist actual prompt text
        try {
            const editedRow = Array.isArray(insertedMemories) ? insertedMemories[1] : null;
            const usedMemoryId = editedRow?.id || null;
            await req.supabaseAuth
                .from('user_prompts')
                .insert({ user_id: req.user.id, prompt_text: '[REDACTED]', source: 'template', example_key: optionId, used_in_memory: usedMemoryId });
        } catch {}

        // Return edited image binary inline for immediate preview
        // Consume 1 credit after success (user-based)
        const consume1 = await creditsService.consumeOne(req.user.id, deviceId);
        const remaining = consume1.remaining || 0;
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Length', editedBuffer.length);
        res.setHeader('X-Credits-Remaining', String(remaining));
        res.send(editedBuffer);
        metrics.inc('edit_success_total', { route: '/v1/edit-by-option' });
        metrics.observe('edit_duration_ms', { route: '/v1/edit-by-option', profile }, Date.now() - t0);

    } catch (error) {
        console.error('❌ Edit-by-option error:', error.message);
        metrics.inc('edit_failure_total', { route: '/v1/edit-by-option' });
        metrics.observe('edit_duration_ms', { route: '/v1/edit-by-option', profile }, Date.now() - t0);
        res.status(500).json({ error: 'Internal Server Error', message: 'Edit-by-option failed', code: 'EDIT_BY_OPTION_FAILED' });
    }
});
app.post('/v1/edit', editLimiter, requireAuthMaybe, rlsAuthMiddleware(), enforceAuthLink(), upload.single('image'), async (req, res) => {
    const t0 = Date.now();
    let profile = 'standard';
    try {
        const { prompt } = req.body;
        const imageFile = req.file;
        const deviceId = req.deviceId;
        const { vaultId: providedVaultId } = req.body || {};
        const profileInput = (req.body.engine_profile || 'standard').toString();
        profile = ['standard','high'].includes(profileInput) ? profileInput : 'standard';

        // バリデーション
        // deviceId はミドルウェアで識別済み

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

        // External provider (Gemini) configuration validated earlier

        // Magic byte check (prevent MIME spoofing)
        try {
            const imgBuf = await getFileBuffer(imageFile);
            const meta = await sharp(imgBuf).metadata();
            const format = meta.format;
            const mimeMap = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', tiff: 'image/tiff', gif: 'image/gif', heif: 'image/heic', avif: 'image/avif' };
            const detected = mimeMap[format] || null;
            if (!detected || detected !== imageFile.mimetype) {
                return res.status(400).json({ error: 'Bad Request', message: 'Invalid image data (mime mismatch)', code: 'INVALID_IMAGE_DATA' });
            }
            const w = meta.width || 0;
            const h = meta.height || 0;
            const maxSide = parseInt(process.env.MAX_IMAGE_SIDE || '12000', 10);
            const maxPixels = parseInt(process.env.MAX_IMAGE_PIXELS || String(100 * 1000 * 1000), 10);
            if (w <= 0 || h <= 0 || w > maxSide || h > maxSide || (w * h) > maxPixels) {
                return res.status(413).json({ error: 'Payload Too Large', message: 'Image dimensions exceed allowed limits', code: 'IMAGE_TOO_LARGE' });
            }
        } catch (e) {
            return res.status(400).json({ error: 'Bad Request', message: 'Invalid or corrupted image file', code: 'INVALID_IMAGE_FILE' });
        }

        // Credits check (unified via Supabase; legacy is fallback only)
        const currentCredits = await creditsService.getCredits(req.user.id, deviceId);
        if ((currentCredits || 0) <= 0) {
            return res.status(402).json({ error: 'Payment Required', message: 'Insufficient credits', code: 'INSUFFICIENT_CREDITS', credits: currentCredits || 0 });
        }

        // 画像をBase64 DataURL化
        const imgBuf2 = await getFileBuffer(imageFile);
        const base64Data = imgBuf2.toString('base64');
        const mimeType = imageFile.mimetype;
        const dataURL = `data:${mimeType};base64,${base64Data}`;

        // Use secure logger to sanitize PII from prompt logs
        secureLogger.editRequest(deviceId, prompt, imageFile.size);

        // 編集エンジン（プロファイル）に応じたパラメータ
        const ENGINE = {
            standard: { num_inference_steps: 35, true_cfg_scale: 4.0 },
            high: { num_inference_steps: 60, true_cfg_scale: 4.6 }
        }[profile] || { num_inference_steps: 35, true_cfg_scale: 4.0 };

        // Gemini-based edit
        const editedPng = await runImageEditGemini({ base64Data, mimeType, prompt, profile });

        // Persist original and edited images to Supabase Storage and record as memories
        const user = req.user || await subscriptionService.getOrCreateUser(deviceId);

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
            .upload(originalPath, buf, {
                cacheControl: '3600',
                contentType: imageFile.mimetype
            });

        // Upload edited image (PNG)
        const editedFilename = `edited_${randomUUID()}.png`;
        const editedPath = `memories/${user.id}/${editedFilename}`;
        await supabaseStorage
            .from('vault-storage')
            .upload(editedPath, editedPng, {
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
                processing_status: 'completed',
                memory_type: 'image',
                is_archived: false
            },
            {
                vault_id: targetVaultId,
                filename: editedFilename,
                original_filename: editedFilename,
                file_size_bytes: editedPng.length,
                mime_type: 'image/png',
                file_url: editedPath,
                title: `Edited: ${sanitizeText(prompt, { maxLength: 60 })}`,
                uploaded_by: deviceId,
                uploaded_at: new Date().toISOString(),
                processing_status: 'completed',
                memory_type: 'image',
                is_archived: false
            }
        ];

        const { data: inserted } = await req.supabaseAuth.from('memories').insert(memoryRecords).select('id');

        // Save prompt used (user-entered) - redact prompt text to avoid PII at rest
        try {
            const editedRow = Array.isArray(inserted) ? inserted[1] : null;
            const usedMemoryId = editedRow?.id || null;
            await req.supabaseAuth
                .from('user_prompts')
                .insert({ user_id: req.user.id, prompt_text: '[REDACTED]', source: 'user', example_key: null, used_in_memory: usedMemoryId });
        } catch {}

        // Return generated image as PNG to the client
        // Consume credit after success (user-based)
        const consume1 = await creditsService.consumeOne(req.user.id, deviceId);
        const remaining = consume1.remaining || 0;
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Length', editedPng.length);
        res.setHeader('X-Credits-Remaining', String(remaining));
        res.send(editedPng);

        metrics.inc('edit_success_total', { route: '/v1/edit' });
        metrics.observe('edit_duration_ms', { route: '/v1/edit', profile }, Date.now() - t0);

        console.log(`✅ Edit completed successfully, ${editedPng.length} bytes`);

    } catch (error) {
        console.error('❌ Edit error:', error.message);
        metrics.inc('edit_failure_total', { route: '/v1/edit' });
        metrics.observe('edit_duration_ms', { route: '/v1/edit', profile }, Date.now() - t0);

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

// 残高確認エンドポイント（RLS適用 + Vault統合）
// Require auth and enforce linkage between Supabase Auth user and device owner
app.get('/v1/balance', requireAuthMaybe, rlsAuthMiddleware(), enforceAuthLink(), async (req, res) => {
    try {
        const deviceId = req.deviceId;
        // サブスクリプション（system経由、監査ログあり）
        const subscription = await subscriptionService.getActiveSubscription(deviceId);
        // RLS経由のユーザー情報はミドルウェアで準備済み
        const user = req.user || (await subscriptionService.getOrCreateUser(deviceId));
        const credits = await creditsService.getCredits(user.id, deviceId);
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
            },
            credits
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

// List user's generated memories (edited images)
app.get('/v1/memories', requireAuthMaybe, rlsAuthMiddleware(), enforceAuthLink(), async (req, res) => {
    try {
        const { supabaseAuth } = req;
        const rawLimit = parseInt(req.query.limit, 10);
        const rawOffset = parseInt(req.query.offset, 10);
        const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 30;
        const offset = Number.isFinite(rawOffset) ? Math.max(rawOffset, 0) : 0;

        const { data, error, count } = await supabaseAuth
            .from('memories')
            .select('id, file_url, title, uploaded_at, mime_type, original_filename, file_size_bytes, filename, memory_type, is_archived', { count: 'exact' })
            .eq('memory_type', 'image')
            .is('is_archived', false)
            .order('uploaded_at', { ascending: false })
            .range(offset, offset + limit - 1);
        if (error) {
            return res.status(500).json({ error: 'Internal Server Error', message: error.message, code: 'MEMORY_LIST_FAILED' });
        }
        const safePath = (p) => typeof p === 'string' && /^[a-z0-9/_\.-]+$/i.test(p) && !p.includes('..');
        const ttl = parseInt(process.env.SIGNED_URL_TTL || '3600', 10); // 1時間既定
        const items = await Promise.all((data || []).map(async (m) => {
            const path = safePath(m.file_url) ? m.file_url : '';
            let signedUrl = '';
            if (path) {
                try {
                    const { data: sig, error: sigErr } = await supabaseAuth
                        .storage
                        .from('vault-storage')
                        .createSignedUrl(path, ttl);
                    if (!sigErr) signedUrl = sig?.signedUrl || '';
                } catch {}
            }
            return {
                id: m.id,
                url: signedUrl,
                title: m.title || 'Edited Image',
                uploadedAt: m.uploaded_at,
                mimeType: m.mime_type,
                size: m.file_size_bytes,
            };
        }));
        const total = typeof count === 'number' ? count : items.length;
        res.json({
            items,
            pagination: {
                limit,
                offset,
                total,
                hasMore: offset + items.length < total
            }
        });
    } catch (e) {
        res.status(500).json({ error: 'Internal Server Error', message: 'Failed to list memories', code: 'MEMORY_LIST_EXCEPTION' });
    }
});

// Soft-delete (archive) a memory owned by the user
app.delete('/v1/memories/:id', requireAuthMaybe, rlsAuthMiddleware(), enforceAuthLink(), async (req, res) => {
    try {
        const { id } = req.params;
        const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidV4.test(id)) {
            return res.status(400).json({ error: 'Bad Request', message: 'Invalid memory id', code: 'INVALID_MEMORY_ID' });
        }

        const { supabaseAuth } = req;
        const { data, error } = await supabaseAuth
            .from('memories')
            .update({ is_archived: true })
            .eq('id', id)
            .is('is_archived', false)
            .select('id')
            .single();

        if (error) {
            return res.status(500).json({ error: 'Internal Server Error', message: error.message, code: 'MEMORY_DELETE_FAILED' });
        }
        if (!data) {
            return res.status(404).json({ error: 'Not Found', message: 'Memory not found or already archived', code: 'MEMORY_NOT_FOUND' });
        }

        return res.json({ success: true, id });
    } catch (e) {
        return res.status(500).json({ error: 'Internal Server Error', message: 'Failed to delete memory', code: 'MEMORY_DELETE_EXCEPTION' });
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

// Direct upload endpoint (JPEG/PNG only)
app.post('/v1/memories/upload', vaultUploadLimiter, requireAuthMaybe, rlsAuthMiddleware(), enforceAuthLink(), vaultUpload.single('image'), async (req, res) => {
    try {
        const imageFile = req.file;
        const deviceId = req.deviceId;
        const { vaultId: providedVaultId, title } = req.body || {};

        if (!imageFile) {
            return res.status(400).json({ error: 'Bad Request', message: 'Image file is required', code: 'MISSING_IMAGE' });
        }

        // Magic byte check: allow only JPEG or PNG
        let detectedMime = null;
        try {
            const imgBuf = await getFileBuffer(imageFile);
            const meta = await sharp(imgBuf).metadata();
            const mimeMap = { jpeg: 'image/jpeg', png: 'image/png' };
            detectedMime = mimeMap[meta.format] || null;
            if (!detectedMime) {
                return res.status(400).json({ error: 'Bad Request', message: 'Only JPEG or PNG is allowed', code: 'UNSUPPORTED_IMAGE_TYPE' });
            }
            if (detectedMime !== imageFile.mimetype) {
                return res.status(400).json({ error: 'Bad Request', message: 'Invalid image data (mime mismatch)', code: 'INVALID_IMAGE_DATA' });
            }
            // Pixel dimension limits
            const w = meta.width || 0;
            const h = meta.height || 0;
            const maxSide = parseInt(process.env.MAX_IMAGE_SIDE || '12000', 10);
            const maxPixels = parseInt(process.env.MAX_IMAGE_PIXELS || String(100 * 1000 * 1000), 10);
            if (w <= 0 || h <= 0 || w > maxSide || h > maxSide || (w * h) > maxPixels) {
                return res.status(413).json({ error: 'Payload Too Large', message: 'Image dimensions exceed allowed limits', code: 'IMAGE_TOO_LARGE' });
            }
        } catch (e) {
            return res.status(400).json({ error: 'Bad Request', message: 'Invalid or corrupted image file', code: 'INVALID_IMAGE_FILE' });
        }

        // Resolve target vault
        let targetVaultId = providedVaultId;
        if (!targetVaultId) {
            const { data: existingVault } = await req.supabaseAuth
                .from('vaults')
                .select('id')
                .is('deleted_at', null)
                .order('created_at', { ascending: true })
                .limit(1)
                .single();
            if (existingVault?.id) targetVaultId = existingVault.id;
        }
        if (!targetVaultId) {
            // Auto-create default vault for upload
            const { data: newVault, error: vaultErr } = await req.supabaseAuth
                .from('vaults')
                .insert({ owner_id: req.user.id, name: 'My Vault', description: 'Default vault', created_at: new Date() })
                .select('id')
                .single();
            if (vaultErr) {
                return res.status(500).json({ error: 'Internal Server Error', message: 'Failed to create default vault', code: 'VAULT_CREATE_FAILED' });
            }
            targetVaultId = newVault.id;
        }

        // Store in Supabase Storage
        const ext = detectedMime === 'image/jpeg' ? 'jpg' : 'png';
        const filename = `upload_${randomUUID()}.${ext}`;
        const path = `memories/${req.user.id}/${filename}`;
        const upBuf = await getFileBuffer(imageFile);
        const uploadResp = await supabaseStorage.from('vault-storage').upload(path, upBuf, { cacheControl: '3600', contentType: detectedMime });
        if (uploadResp.error) {
            return res.status(500).json({ error: 'Internal Server Error', message: uploadResp.error.message, code: 'STORAGE_UPLOAD_FAILED' });
        }
        // Cleanup local temp file if used
        try { if (imageFile.path) { const { unlink } = await import('fs/promises'); await unlink(imageFile.path).catch(() => {}); } } catch {}

        // Insert memory record
        const memoryRow = {
            vault_id: targetVaultId,
            filename,
            original_filename: imageFile.originalname || filename,
            file_size_bytes: imageFile.size,
            mime_type: detectedMime,
            file_url: path,
            title: typeof title === 'string' && title.trim() ? title.trim().slice(0, 120) : 'Uploaded Image',
            uploaded_by: deviceId,
            uploaded_at: new Date().toISOString(),
            memory_type: 'image',
            is_archived: false
        };
        const { data: inserted, error: insertError } = await req.supabaseAuth
            .from('memories')
            .insert(memoryRow)
            .select('id, file_url, mime_type, file_size_bytes, title, uploaded_at')
            .single();
        if (insertError) {
            return res.status(500).json({ error: 'Internal Server Error', message: insertError.message, code: 'MEMORY_INSERT_FAILED' });
        }

        // Signed URL (非公開バケット前提の短期アクセス)
        const signedTtl = parseInt(process.env.SIGNED_URL_TTL || '3600', 10);
        let publicUrl = null;
        try {
            const { data: sig, error: sigErr } = await req.supabaseAuth
                .storage
                .from('vault-storage')
                .createSignedUrl(path, signedTtl);
            if (!sigErr) publicUrl = sig?.signedUrl || null;
        } catch {}

        // include current credits for client convenience
        let creditsRemaining = 0;
        try { creditsRemaining = await creditsService.getCredits(req.user.id, deviceId); } catch {}

        return res.json({
            success: true,
            memory: {
                id: inserted.id,
                url: publicUrl,
                title: inserted.title,
                uploadedAt: inserted.uploaded_at,
                mimeType: inserted.mime_type,
                size: inserted.file_size_bytes
            },
            creditsRemaining
        });

    } catch (error) {
        console.error('❌ Vault upload error:', error);
        res.status(500).json({ error: 'Internal Server Error', message: 'Upload failed', code: 'UPLOAD_FAILED' });
    }
});

// 課金処理エンドポイント（Legacy preserved）
app.post('/v1/purchase', purchaseLimiter, requireAuthMaybe, rlsAuthMiddleware(), enforceAuthLink(), async (req, res) => {
    try {
        const deviceId = req.deviceId;
        const userId = req.user?.id;
        const { receiptData, productId: bodyProductId } = req.body || {};

        if (!receiptData || typeof receiptData !== 'string') {
            return res.status(400).json({ error: 'Bad Request', message: 'receiptData is required', code: 'MISSING_RECEIPT' });
        }

        const { validateAppStoreReceipt } = await import('./services/appstore-validator.mjs');
        const validation = await validateAppStoreReceipt(receiptData);
        if (!validation?.valid) {
            return res.status(400).json({ error: 'Bad Request', message: validation?.error || 'Invalid receipt', code: 'INVALID_RECEIPT' });
        }

        const latest = validation.latestReceiptInfo || {};
        const provider = 'apple';
        const providerTransactionId = latest.original_transaction_id || `dev_${Date.now()}`;
        const productId = latest.product_id || bodyProductId;
        if (!productId) {
            return res.status(400).json({ error: 'Bad Request', message: 'productId not found in receipt', code: 'MISSING_PRODUCT_ID' });
        }

        // Lookup credits from DB mapping
        let creditsToAdd = 0;
        try {
            const { data: pc } = await req.supabaseAuth
                .from('product_credits')
                .select('credits')
                .eq('product_id', productId)
                .maybeSingle();
            creditsToAdd = pc?.credits || 0;
        } catch {}
        if (!creditsToAdd) {
            return res.status(400).json({ error: 'Bad Request', message: 'Unknown product', code: 'INVALID_PRODUCT' });
        }

        const { data: existing, error: dupErr } = await req.supabaseAuth
            .from('user_purchases')
            .select('id')
            .eq('provider', provider)
            .eq('provider_transaction_id', providerTransactionId)
            .maybeSingle();
        if (dupErr) {
            return res.status(500).json({ error: 'Internal Server Error', message: dupErr.message, code: 'PURCHASE_LOOKUP_FAILED' });
        }
        if (existing) {
            const remaining = await creditsService.getCredits(userId, deviceId);
            return res.status(409).json({ error: 'Conflict', message: 'Transaction already processed', code: 'DUPLICATE_TRANSACTION', creditsRemaining: remaining });
        }

        const { error: insErr } = await req.supabaseAuth
            .from('user_purchases')
            .insert({ user_id: userId, provider, provider_transaction_id: providerTransactionId, product_id: productId, credits_added: creditsToAdd });
        if (insErr) {
            return res.status(500).json({ error: 'Internal Server Error', message: insErr.message, code: 'PURCHASE_INSERT_FAILED' });
        }

        const remaining = await creditsService.addCredits(userId, creditsToAdd, deviceId);
        return res.json({ success: true, productId, creditsAdded: creditsToAdd, creditsRemaining: remaining });

    } catch (error) {
        console.error('❌ Purchase error:', error.message);
        return res.status(500).json({ error: 'Internal Server Error', message: 'Purchase processing failed', code: 'PURCHASE_FAILED' });
    }
});

// 通報エンドポイント（既存機能を保持）
app.post('/v1/report', requireAuthMaybe, rlsAuthMiddleware(), enforceAuthLink(), async (req, res) => {
    try {
        const { jobId, reasonId, note } = req.body;
        const deviceId = req.deviceId;

        // バリデーション
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

// Metrics endpoint (Prometheus exposition format) - admin token gated in production
app.get('/v1/metrics', optionalAdminIpAllowlist, requireAdminToken, (req, res) => {
    res.setHeader('Content-Type', 'text/plain; version=0.0.4');
    res.send(metrics.serialize());
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
        console.log('  ✅ Edit-by-Option API (Supabase prompt)');
    console.log('  ✅ Credit System (Legacy)');
    console.log(`  ${databaseInitialized ? '✅' : '❌'} Vault Subscription System`);
    console.log(`  ${databaseInitialized ? '✅' : '❌'} Family Sharing`);
    console.log(`  ${databaseInitialized ? '✅' : '❌'} Print Export`);
    console.log(`  ${databaseInitialized ? '✅' : '❌'} App Store Integration`);
    
    // 必須環境変数チェック（DashScopeは不使用）
    
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
