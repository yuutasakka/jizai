# Developer Onboarding

This guide helps new contributors set up, understand, and extend the Jizai project quickly and safely.

## Stack Overview
- Frontend: Vite + React (TypeScript). Entry at `src/`, app shell in `src/App.tsx`.
- Backend: Node.js (Express) at `backend/index-vault-integration.mjs`.
- Database/Auth/Storage: Supabase (RLS enforced; Storage bucket `vault-storage`).
- Image Editing: Gemini Images API（要 `GEMINI_API_KEY`）
- Security: CORS + CSP + Security headers; RLS auth middleware; sanitized logging.

## Prerequisites
- Node.js 20+
- Supabase project (or use project from SUPABASE_SETUP.md)
GEMINI_API_KEY=<gemini_api_key>

## Environment
Create these files as needed:

Frontend `.env.local` (root):
```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_key>
# Optional: points frontend to API (default same-origin or http://localhost:3000)
VITE_API_BASE_URL=http://localhost:3000
# Optional dev login without Supabase auth
VITE_ENABLE_DEV_LOGIN=true
```

Backend `backend/.env`:
```
NODE_ENV=development
PORT=3000
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_KEY=<service_role_key>
SUPABASE_JWT_SECRET=<supabase_jwt_secret>

# External providers

# Security & CORS
ADMIN_TOKEN=<strong_random>
ORIGIN_ALLOWLIST=http://localhost:5173
NEXT_PUBLIC_SITE_URL=http://localhost:5173
TRUST_PROXY=true

# Rate limits (optional overrides)
RATE_LIMIT_RPS=100
EDIT_RATE_LIMIT=5
PURCHASE_RATE_LIMIT=10
VAULT_UPLOAD_RATE_LIMIT=20

# Webhook/Admin hardening (optional)
WEBHOOK_RATE_LIMIT=30
ADMIN_WEBHOOK_RATE_LIMIT=30
ADMIN_ANALYTICS_RATE_LIMIT=20
WEBHOOK_REPLAY_TTL_MS=300000
WEBHOOK_IP_ALLOWLIST=
ADMIN_IP_ALLOWLIST=

# Image limits (optional)
MAX_IMAGE_SIDE=12000
MAX_IMAGE_PIXELS=100000000
```

See also: `SUPABASE_SETUP.md`, `DEPLOYMENT.md`, `SECURITY.md`.

## Install & Run
Frontend:
```
npm install
npm run dev
# Opens http://localhost:5173
```

Backend:
```
cd backend
npm install
npm run dev
# API at http://localhost:3000
```

## Key Endpoints (Backend)
- Health: `GET /v1/health`
- CSP stats: `GET /v1/security/csp-stats`
- Balance: `GET /v1/balance` → `{ deviceId, subscription, storage, credits }`
- Memories (Gallery):
  - `GET /v1/memories?limit&offset` → `{ items, pagination }`
  - `POST /v1/memories/upload` (multipart, field `image`, JPEG/PNG only)
  - `DELETE /v1/memories/:id` (soft delete)
- Editing:
  - `POST /v1/edit` (multipart: `image`, `prompt`, `engine_profile`)
  - `POST /v1/edit-by-option` (multipart: `image`, `option_id`, `engine_profile`)
  - Response headers include `X-Credits-Remaining` when successful
- Purchases (Legacy credit top-up):
  - `POST /v1/purchase` → adds credits for deviceId

All user-facing routes require Supabase auth token (`Authorization: Bearer <jwt>`) or a device id header (`x-device-id`) depending on the flow. RLS auth middleware enforces the user scope.

## Credit System
- Primary store is Supabase `public.user_credits` (per `user_id`), with RLS allowing user access. See `supabase/user_credits.sql`.
- Backend uses `backend/services/credits-service.mjs` to read/write credits; falls back to legacy `store.json` when needed.
- Editing endpoints check remaining credits before processing and consume 1 credit on success (returns `X-Credits-Remaining`).
- `GET /v1/balance` returns actual `credits` and is used by the profile screen.
- Purchases add credits via `POST /v1/purchase` (legacy flow supported; service can be extended to mirror DB credits).

## Frontend Integration Highlights
- API client: `src/api/client.ts`
  - New: `uploadMemory()`, `listMemoriesPaged()`, `deleteMemory()`, `getBalance()`, `getStorageDetails()`, `getSubscriptionStatus()`.
- Gallery: `src/components/screens/user-gallery-screen.tsx`
  - Pagination, infinite scroll, delete, URL copy, download.
- Profile: `src/components/screens/profile-screen.tsx`
  - Shows user identity from `useAuth()`, credits from `getBalance()`, storage from `getStorageDetails()`.
- Storage: `src/components/screens/storage-screen.tsx`
  - Shows storage details and subscription tier; auto-updates on gallery changes.
- Event Bus: `window.dispatchEvent(new CustomEvent('jizai:memories:updated'))` triggers cross-view refreshes.

## Security & Compliance
- CORS: see `backend/utils/cors-config.mjs` (allowlist/strict in production).
- CSP & Headers: `backend/utils/security-headers.mjs` + `vercel.json`.
- RLS Auth: `backend/middleware/rls-auth.mjs` (Supabase JWT building + scoping).
- Admin endpoints: `backend/routes/webhooks.mjs` guarded by `x-admin-token`、IP許可（任意）、レート制限を適用。
- Webhook: 署名検証（本番）、レート制限、リプレイ防止（UUID TTL）、任意のIP許可を適用。
- Proxy: 逆プロキシ配下では `TRUST_PROXY=true` を設定し、`req.ip`/`req.secure` を適正化。
- Upload: magic-bytes（`sharp`）、ファイル名サニタイズ、ピクセル上限（`MAX_IMAGE_*`）。
- Upload validation: magic-bytes via `sharp`, filename sanitation, pixel limits.

## Database Migration (Credits)
Run SQL in `supabase/user_credits.sql` on your Supabase project to create the user-based credits table with RLS policies.


## Common Tasks
- Add a new API route: implement under `backend/` (routes or main), add rate limits, RLS middleware, and update docs.
- Add new memory fields: update `GET /v1/memories` projection and the gallery card render.
- Adjust credits per-edit: change `store.consumeCredit()` call sites in `index-vault-integration.mjs`.
- Extend CSP or CORS: edit the utility files; keep Vercel header in sync.

## Testing & Dev Tips
- Use curl for quick checks:
```
curl -s http://localhost:3000/v1/health
curl -H 'x-device-id: web-dev' http://localhost:3000/v1/memories
curl -X POST -H 'x-device-id: web-dev' -F 'image=@/path/pic.jpg' http://localhost:3000/v1/memories/upload
```
- For web auth flows, set `VITE_ENABLE_DEV_LOGIN=true` while Supabase isn’t configured.
- Don’t commit secrets; `.env*` files are gitignored.

## Handover Status (2025-09)
- Security hardened (CSP/CORS/headers, SVG injection fix, filename/magic-bytes checks).
- Gallery CRUD (upload, list, delete) with pagination and infinite scroll.
- Editing consumes credits; balance API returns actual credits.
- Profile/Storage screens reflect user identity, credits, and storage in sync.
