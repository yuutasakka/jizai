#!/usr/bin/env node
// Synthetic check for production-like environment
// - GET /v1/health
// - POST /v1/edit (small generated PNG) and validate response headers/body

import axios from 'axios';
import FormData from 'form-data';
import sharp from 'sharp';

const API = process.env.API_BASE_URL || 'http://localhost:3000';
const AUTH_BEARER = process.env.AUTH_BEARER || '';
const DEVICE_ID = process.env.DEVICE_ID || 'synthetic-device';
const PROFILE = process.env.ENGINE_PROFILE || 'standard';

function h(extra = {}) {
  const headers = { 'x-device-id': DEVICE_ID, ...extra };
  if (AUTH_BEARER) headers['Authorization'] = `Bearer ${AUTH_BEARER}`;
  return headers;
}

async function healthCheck() {
  const t0 = Date.now();
  const res = await axios.get(`${API}/v1/health`, { timeout: 15000, validateStatus: () => true });
  const ms = Date.now() - t0;
  if (res.status !== 200 || !res.data?.ok) {
    throw new Error(`Health check failed: ${res.status} body=${JSON.stringify(res.data)}`);
  }
  console.log(`✔ /v1/health ${res.status} in ${ms}ms`);
}

async function editCheck() {
  // Create a tiny PNG to avoid network reads
  const pngBuf = await sharp({ create: { width: 64, height: 64, channels: 3, background: { r: 180, g: 200, b: 220 } } })
    .png()
    .toBuffer();
  const form = new FormData();
  form.append('image', pngBuf, { filename: 'check.png', contentType: 'image/png' });
  form.append('prompt', 'Enhance the clarity slightly while keeping natural colors.');
  form.append('engine_profile', PROFILE);

  const t0 = Date.now();
  const res = await axios.post(`${API}/v1/edit`, form, {
    headers: { ...h(form.getHeaders()) },
    timeout: 120000,
    responseType: 'arraybuffer',
    validateStatus: () => true,
    maxContentLength: 50 * 1024 * 1024
  });
  const ms = Date.now() - t0;

  if (res.status !== 200) {
    let body;
    try { body = JSON.parse(Buffer.from(res.data).toString('utf-8')); } catch { body = '<binary or non-JSON>' }
    throw new Error(`Edit failed: status=${res.status} body=${JSON.stringify(body)}`);
  }
  const ctype = res.headers['content-type'] || '';
  if (!ctype.startsWith('image/png')) {
    throw new Error(`Unexpected content-type: ${ctype}`);
  }
  const xCredits = res.headers['x-credits-remaining'];
  if (typeof xCredits === 'undefined') {
    throw new Error('Missing X-Credits-Remaining header');
  }
  if (!/^[0-9]+$/.test(String(xCredits))) {
    throw new Error(`Invalid X-Credits-Remaining value: ${xCredits}`);
  }
  if (!res.data || res.data.length < 512) {
    throw new Error(`Edited image too small: ${res.data?.length || 0} bytes`);
  }
  console.log(`✔ /v1/edit 200 in ${ms}ms, X-Credits-Remaining=${xCredits}, size=${res.data.length}B`);
}

async function main() {
  try {
    await healthCheck();
    await editCheck();
    console.log('✅ Synthetic checks passed');
    process.exit(0);
  } catch (e) {
    console.error('❌ Synthetic check failed:', e.message);
    process.exit(2);
  }
}

main();

