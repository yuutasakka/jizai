# Architecture Overview

## High-Level
- SPA (Vite + React) served by Vercel (or static host)
- Express API server (`backend/index-vault-integration.mjs`)
- Supabase for auth (JWT), RLS-protected DB, and public Storage
- External Image Editing provider: DashScope

## Backend Modules
- `backend/index-vault-integration.mjs` – main server with:
  - Middleware: CORS, security headers, CSP report-only, response sanitizer
  - Auth: `rls-auth.mjs` (build Supabase auth context, RLS scoping by user/device)
  - Routes: health/version, memories, upload/delete, editing, subscription, family, print-export, webhooks
- Security utils:
  - `utils/security-headers.mjs` – HSTS, headers, CSP (nonce optional), reporting
  - `utils/cors-config.mjs` – strict allowlist in production, standard `RateLimit-*` exposed
  - `utils/secure-logger.mjs` – PII sanitization, special `editRequest()` logger
- Credit store:
  - `store.mjs` – simple JSON ledger for legacy “credits” (`store.json`), used for per-edit billing flows
- Supabase config:
  - `config/supabase.mjs` – anon/service clients; DB health; exported storage helper

## Data Flows
- Auth RLS:
  1) Frontend obtains Supabase session (or uses dev login)
  2) Requests carry `Authorization: Bearer <supabase_jwt>` (or legacy `x-device-id`)
  3) `rls-auth.mjs` builds `req.supabaseAuth` (RLS scoped) and attaches `req.user`, `req.deviceId`

- Gallery (Memories):
  - Upload: `POST /v1/memories/upload` (JPEG/PNG only) → Supabase Storage + `memories` insert
  - List: `GET /v1/memories?limit&offset` with pagination and `hasMore`
  - Delete: `DELETE /v1/memories/:id` (soft delete via `is_archived`)

- Editing:
  - `POST /v1/edit` / `POST /v1/edit-by-option`
  - Validates image (magic-bytes), pixel limits, prompt moderation
  - Calls DashScope, downloads edited image, stores both original and edited
  - Consumes 1 credit on success (legacy credit ledger)

- Balance & Subscription:
  - `GET /v1/balance` returns `{ deviceId, subscription, storage, credits }`
  - Subscription & storage come from Supabase tables; credits come from `store.json`

## Frontend Components
- `src/api/client.ts` – typed client to all endpoints
- `src/components/screens/user-gallery-screen.tsx` – paged gallery, infinite scroll, delete, URL copy, download
- `src/components/screens/profile-screen.tsx` – shows user identity, credits, storage; auto-refresh on updates
- `src/components/screens/storage-screen.tsx` – storage details and tier; auto-refresh on updates

## Security Notes
- CSP enforced & duplicated in Vercel headers; connect-src restricted to DashScope + Supabase
- CORS allowlist and preflight cache; production disallows localhost
- Upload safety: filename sanitation, magic-bytes check with `sharp`, pixel dimension limits
- Webhook admin routes require `x-admin-token`

## Rate Limits
- General limiter (15m window), endpoint-specific for edit/purchase/upload
- `RateLimit-*` and `X-RateLimit-*` headers are exposed via CORS

## Extensibility
- New providers: implement an adapter in editing call, keep safety checks
- New memory types: extend `memories` schema and list projection; update gallery rendering
- Replace credits with subscription metering: swap out `store.mjs` consumer at edit endpoints

