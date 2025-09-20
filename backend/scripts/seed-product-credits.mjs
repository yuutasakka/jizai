// Seed product_credits table with default mapping
// Usage: SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node scripts/seed-product-credits.mjs

import { supabaseService } from '../config/supabase.mjs';

const mapping = [
  { product_id: 'com.jizai.vault.standard', credits: 100 },
  { product_id: 'com.jizai.vault.pro', credits: 300 },
  { product_id: 'com.example.jizai.coins20', credits: 20 },
  { product_id: 'com.example.jizai.coins100', credits: 100 },
  { product_id: 'com.example.jizai.coins300', credits: 300 },
];

(async () => {
  try {
    for (const row of mapping) {
      const { error } = await supabaseService
        .from('product_credits')
        .upsert(row, { onConflict: 'product_id' });
      if (error) throw error;
      console.log(`✅ Upserted ${row.product_id} -> ${row.credits}`);
    }
    process.exit(0);
  } catch (e) {
    console.error('❌ Seed failed:', e.message);
    process.exit(1);
  }
})();

