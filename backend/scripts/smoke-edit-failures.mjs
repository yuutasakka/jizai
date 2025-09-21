#!/usr/bin/env node
// Smoke tests for error scenarios on edit endpoints

import axios from 'axios';
import FormData from 'form-data';

const API = process.env.API_BASE_URL || 'http://localhost:3000';
const AUTH_BEARER = process.env.AUTH_BEARER || '';
const DEVICE_ID = process.env.DEVICE_ID || 'smoke-fail-device';

function h(extra = {}) {
  const headers = { 'x-device-id': DEVICE_ID, ...extra };
  if (AUTH_BEARER) headers['Authorization'] = `Bearer ${AUTH_BEARER}`;
  return headers;
}

async function bannedPromptCheck() {
  const form = new FormData();
  // Small 1x1 PNG header to pass file validation (but we’ll keep it minimal)
  const tiny = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==',
    'base64'
  );
  form.append('image', tiny, { filename: 'tiny.png', contentType: 'image/png' });
  // Use a known banned word from ng_words (e.g., 'hate')
  form.append('prompt', 'Please add hate speech');

  const res = await axios.post(`${API}/v1/edit`, form, {
    headers: { ...h(form.getHeaders()) },
    timeout: 60000,
    validateStatus: () => true
  });
  if (res.status !== 400) {
    throw new Error(`/v1/edit banned prompt expected 400, got ${res.status}`);
  }
  console.log('✔ Banned prompt check returned 400 as expected');
}

async function invalidFileCheck() {
  const form = new FormData();
  form.append('image', Buffer.from('not an image'), { filename: 'note.txt', contentType: 'text/plain' });
  form.append('prompt', 'Enhance');
  const res = await axios.post(`${API}/v1/edit`, form, {
    headers: { ...h(form.getHeaders()) },
    timeout: 60000,
    validateStatus: () => true
  });
  if (res.status !== 400) {
    throw new Error(`/v1/edit invalid file expected 400, got ${res.status}`);
  }
  console.log('✔ Invalid file check returned 400 as expected');
}

async function main() {
  try {
    await bannedPromptCheck();
    await invalidFileCheck();
    console.log('✅ Failure smoke checks passed');
    process.exit(0);
  } catch (e) {
    console.error('❌ Failure smoke check failed:', e.message);
    process.exit(2);
  }
}

main();

