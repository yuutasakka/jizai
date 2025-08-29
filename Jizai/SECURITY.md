# Security Configuration Guide

## 🔐 Environment Variables Security

### ✅ Safe for Frontend (VITE_ prefix)
These variables are bundled with the client and are publicly visible:
- `VITE_API_BASE_URL` - Backend API endpoint
- `VITE_SUPABASE_URL` - Supabase project URL (public)
- `VITE_SALE_ENABLED` - Feature flags
- `VITE_STORAGE_*` - UI configuration

### ❌ NEVER expose in frontend
- API keys (Supabase service key, Qwen API key, etc.)
- JWT secrets
- Database credentials
- Encryption keys
- Service account credentials

## 🚀 Vercel Deployment Security

### Required Environment Variables (Server-side only)
Configure these in Vercel Dashboard → Project → Settings → Environment Variables:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJ...your-service-key

# API Keys (stored in Supabase api_keys table)
API_ENCRYPTION_KEY=32-character-hex-string

# Server Configuration
NODE_ENV=production
PORT=3001

# Security
JWT_SECRET=your-secure-jwt-secret

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS (production domains)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Frontend Environment Variables
Configure these in Vercel for the frontend build:

```bash
VITE_API_BASE_URL=https://your-api-domain.vercel.app
VITE_SUPABASE_URL=https://your-project.supabase.co
```

## 🛡️ Security Best Practices

### 1. API Key Management
- All sensitive API keys stored encrypted in Supabase `api_keys` table
- Frontend retrieves configuration through secure backend endpoints
- No hardcoded credentials in source code

### 2. Environment Separation
- Development: Use `.env` files (never commit to git)
- Production: Use Vercel environment variables
- Different encryption keys per environment

### 3. CORS Configuration
```javascript
// Development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

// Production
ALLOWED_ORIGINS=https://yourdomain.com,https://api.yourdomain.com
```

### 4. Rate Limiting
- API endpoints: 100 requests per 15 minutes
- Image editing: 5 requests per minute
- Device-ID based tracking

## 🔍 Security Validation Checklist

- [ ] No API keys in frontend code (`git grep -r "eyJ" src/`)
- [ ] No hardcoded secrets in repository
- [ ] Proper CORS configuration for production
- [ ] Rate limiting enabled
- [ ] HTTPS enforced in production
- [ ] Environment variables properly separated
- [ ] API key encryption working
- [ ] Database RLS policies enabled

## 🚨 If Security Breach Detected

1. Immediately rotate all API keys
2. Update `API_ENCRYPTION_KEY`
3. Check access logs for unauthorized usage
4. Update CORS origins if needed
5. Review and update this security guide

## 📱 iOS App Security

- Uses conditional compilation for different environments
- Production builds use Info.plist configuration
- No sensitive data in source code
- Proper App Transport Security settings