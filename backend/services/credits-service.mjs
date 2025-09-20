// Credits Service (Supabase-backed, user.id based)
// Falls back to legacy store when Supabase operations fail

import { supabaseService } from '../config/supabase.mjs';
import store from '../store.mjs';

const TABLE = 'user_credits';

export class CreditsService {
  async ensureRow(userId) {
    try {
      const { data, error } = await supabaseService
        .from(TABLE)
        .upsert({ user_id: userId, credits: 0 }, { onConflict: 'user_id' })
        .select('user_id, credits')
        .single();
      if (error) throw error;
      return data;
    } catch (e) {
      return null;
    }
  }

  async getCredits(userId, deviceIdForFallback) {
    try {
      const { data, error } = await supabaseService
        .from(TABLE)
        .select('credits')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        await this.ensureRow(userId);
        return 0;
      }
      return data.credits || 0;
    } catch (e) {
      // Fallback to legacy device-based store
      if (deviceIdForFallback) {
        const legacy = await store.getUser(deviceIdForFallback);
        return legacy.credits || 0;
      }
      return 0;
    }
  }

  async addCredits(userId, amount, deviceIdForFallback) {
    if (!Number.isFinite(amount) || amount === 0) return this.getCredits(userId, deviceIdForFallback);
    try {
      const current = await this.getCredits(userId);
      const next = Math.max(0, current + amount);
      const { error } = await supabaseService
        .from(TABLE)
        .upsert({ user_id: userId, credits: next }, { onConflict: 'user_id' });
      if (error) throw error;
      return next;
    } catch (e) {
      if (deviceIdForFallback) {
        await store.updateUserCredits(deviceIdForFallback, amount);
        const legacy = await store.getUser(deviceIdForFallback);
        return legacy.credits || 0;
      }
      return 0;
    }
  }

  async consumeOne(userId, deviceIdForFallback) {
    try {
      const current = await this.getCredits(userId);
      if (current <= 0) return { ok: false, remaining: 0 };
      const next = current - 1;
      const { error } = await supabaseService
        .from(TABLE)
        .upsert({ user_id: userId, credits: next }, { onConflict: 'user_id' });
      if (error) throw error;
      return { ok: true, remaining: next };
    } catch (e) {
      if (deviceIdForFallback) {
        const ok = await store.consumeCredit(deviceIdForFallback);
        const legacy = await store.getUser(deviceIdForFallback);
        return { ok, remaining: legacy.credits || 0 };
      }
      return { ok: false, remaining: 0 };
    }
  }
}

export const creditsService = new CreditsService();

