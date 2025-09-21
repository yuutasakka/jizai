#!/usr/bin/env node
/*
 * Jizai Backend Preflight Checker
 * - Validates that required env vars are set with sane lengths
 * - Highlights risky CORS origins and admin/webhook hardening
 * - Confirms key dependency versions
 *
 * Usage: node scripts/preflight.mjs
 */

const required = [];
const warnings = [];
const infos = [];

function check(name, minLen = 1, critical = true) {
  const val = process.env[name] || '';
  if (!val || val.length < minLen) {
    const msg = `${name} ${!val ? 'not set' : `too short (${val.length} chars, need ${minLen}+)`}`;
    if (critical) required.push(`❌ ${msg}`); else warnings.push(`⚠️ ${msg}`);
    return false;
  }
  infos.push(`✅ ${name} configured (${val.length} chars)`);
  return true;
}

// Core secrets
check('SUPABASE_URL', 10);
check('SUPABASE_ANON_KEY', 30);
check('SUPABASE_SERVICE_KEY', 80); // service_role keys are typically long (>= 100)

// JWT secrets
check('SUPABASE_JWT_SECRET', 32);
check('JWT_SECRET', 64);
check('API_ENCRYPTION_KEY', 32);

// Providers / Admin
check('GEMINI_API_KEY', 20);
check('ADMIN_TOKEN', 32);

// CORS allowlist risk checks
const origins = (process.env.ORIGIN_ALLOWLIST || '').split(',').map(s => s.trim()).filter(Boolean);
if (process.env.NODE_ENV === 'production') {
  if (origins.length === 0) warnings.push('⚠️ ORIGIN_ALLOWLIST empty in production');
  const insecure = origins.filter(o => o.startsWith('http://') || /localhost|127\.0\.0\.1/.test(o));
  if (insecure.length) warnings.push(`⚠️ ORIGIN_ALLOWLIST contains insecure origins: ${insecure.join(', ')}`);
}

// Webhook/admin hardening (optional but recommended)
if (process.env.NODE_ENV === 'production') {
  ['WEBHOOK_RATE_LIMIT', 'WEBHOOK_REPLAY_TTL_MS', 'ADMIN_WEBHOOK_RATE_LIMIT', 'ADMIN_ANALYTICS_RATE_LIMIT']
    .forEach(k => { if (!process.env[k]) warnings.push(`⚠️ ${k} not set (using defaults)`); });
  if (!process.env.WEBHOOK_IP_ALLOWLIST) warnings.push('⚠️ WEBHOOK_IP_ALLOWLIST not set');
  if (!process.env.ADMIN_IP_ALLOWLIST) warnings.push('⚠️ ADMIN_IP_ALLOWLIST not set');
}

// Image limits (optional)
if (!process.env.MAX_IMAGE_SIDE) infos.push('ℹ️ MAX_IMAGE_SIDE not set (using default 12000)');
if (!process.env.MAX_IMAGE_PIXELS) infos.push('ℹ️ MAX_IMAGE_PIXELS not set (using default 100000000)');

// Trust proxy hint
if (process.env.NODE_ENV === 'production' && process.env.TRUST_PROXY === 'false') {
  warnings.push('⚠️ TRUST_PROXY=false in production; behind a reverse proxy this may break req.ip/req.secure');
}

// Dependency versions (axios/multer) summary
try {
  const axiosV = require('axios/package.json').version;
  const multerV = require('multer/package.json').version;
  infos.push(`📦 axios@${axiosV}`);
  infos.push(`📦 multer@${multerV}`);
} catch (_) {}

// Output
console.log('🔎 Preflight Check');
console.log('=================');
if (infos.length) console.log(infos.join('\n'));
if (warnings.length) console.log('\nWarnings:\n' + warnings.join('\n'));
if (required.length) console.log('\nRequired fixes:\n' + required.join('\n'));

if (required.length) process.exit(2);
if (warnings.length) process.exit(1);
process.exit(0);
