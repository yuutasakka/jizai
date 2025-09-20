// Simple smoke test for purchase + balance + duplicate prevention
// Usage: API_BASE_URL=http://localhost:3000 DEVICE_ID=smoke-device AUTH_BEARER=... node scripts/smoke.mjs

import axios from 'axios';

const API = process.env.API_BASE_URL || 'http://localhost:3000';
const DEVICE_ID = process.env.DEVICE_ID || 'smoke-device';
const AUTH_BEARER = process.env.AUTH_BEARER || '';

function h() {
  const headers = { 'x-device-id': DEVICE_ID };
  if (AUTH_BEARER) headers['Authorization'] = `Bearer ${AUTH_BEARER}`;
  return headers;
}

async function getBalance() {
  const res = await axios.get(`${API}/v1/balance`, { headers: h(), validateStatus: () => true });
  return res;
}

async function purchase(receiptData, productId) {
  const res = await axios.post(`${API}/v1/purchase`, { receiptData, productId }, { headers: h(), validateStatus: () => true });
  return res;
}

async function listPopular() {
  const res = await axios.get(`${API}/v1/prompts/popular`, { headers: h(), validateStatus: () => true });
  return res;
}

function assert(cond, message) {
  if (!cond) {
    throw new Error(`ASSERT FAILED: ${message}`);
  }
}

(async () => {
  console.log(`🔎 Smoke @ ${API} (device=${DEVICE_ID})`);

  // Balance
  const b0 = await getBalance();
  assert(b0.status === 200, `balance status ${b0.status}`);
  const startCredits = typeof b0.data?.credits === 'number' ? b0.data.credits : 0;
  console.log(`💰 Start credits: ${startCredits}`);

  // Purchase success (sandbox: mock_…)
  const receipt1 = `mock_${Date.now()}`;
  const p1 = await purchase(receipt1, 'com.jizai.vault.standard');
  assert(p1.status === 200, `purchase status ${p1.status} body=${JSON.stringify(p1.data)}`);
  const added = p1.data?.creditsAdded || 0;
  const after1 = p1.data?.creditsRemaining;
  assert(added > 0, 'creditsAdded should be > 0');
  assert(typeof after1 === 'number' && after1 >= startCredits + added, 'creditsRemaining did not increase');
  console.log(`🧾 Purchase OK: +${added} => ${after1}`);

  // Duplicate prevention
  const pdup = await purchase(receipt1, 'com.jizai.vault.standard');
  assert(pdup.status === 409, `duplicate status ${pdup.status}`);
  console.log('🚫 Duplicate prevented');

  // Popular prompts (should not error)
  const pop = await listPopular();
  assert(pop.status === 200, `popular prompts status ${pop.status}`);
  console.log(`⭐ Popular prompts items: ${pop.data?.items?.length || 0}`);

  // Final balance
  const b1 = await getBalance();
  assert(b1.status === 200, `balance2 status ${b1.status}`);
  console.log(`✅ Smoke passed. Final credits: ${b1.data?.credits}`);
  process.exit(0);
})().catch((e) => {
  console.error('❌ Smoke failed:', e.message);
  process.exit(1);
});

