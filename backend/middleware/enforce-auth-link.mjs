/**
 * Enforce linkage between Supabase Auth user (req.authUser)
 * and application user identified by deviceId (req.user / req.deviceId).
 *
 * - Uses users.supabase_auth_user_id column if存在
 * - 初回は自動リンク（null → authUser.id に更新）
 * - 不一致は 409 で拒否（なりすまし防止）
 */
import { supabaseService } from '../config/supabase.mjs';
import { secureLogger } from '../utils/secure-logger.mjs';

export function enforceAuthLink() {
  return async (req, res, next) => {
    try {
      if (!req.authUser) return next(); // トークンなしルートでは何もしない
      const authUserId = req.authUser.id;
      const deviceId = req.deviceId || req.headers['x-device-id'];
      const appUser = req.user; // rls-auth が設定

      if (!deviceId || !appUser) {
        // RLS前提のため通常は来ないが、安全のため通過
        secureLogger.warn('Auth link skipped: missing deviceId or req.user');
        return next();
      }

      // usersテーブルに supabase_auth_user_id があるか確認
      const { data: columns, error: colErr } = await supabaseService
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'users')
        .eq('column_name', 'supabase_auth_user_id');

      if (colErr) {
        secureLogger.warn('Could not verify users.supabase_auth_user_id column', { error: colErr.message });
        return next();
      }
      const hasColumn = Array.isArray(columns) && columns.length > 0;
      if (!hasColumn) {
        secureLogger.warn('users.supabase_auth_user_id column not found; skipping strict auth link enforcement');
        return next();
      }

      // 取得（RLSなしのserviceクライアントで確実に取る）
      const { data: userRow, error: userErr } = await supabaseService
        .from('users')
        .select('id, device_id, supabase_auth_user_id')
        .eq('id', appUser.id)
        .single();

      if (userErr || !userRow) {
        secureLogger.warn('Auth link: user row not found for enforcement', { error: userErr?.message });
        return next();
      }

      const current = userRow.supabase_auth_user_id;
      if (!current) {
        // 初回リンク
        const { error: updErr } = await supabaseService
          .from('users')
          .update({ supabase_auth_user_id: authUserId })
          .eq('id', userRow.id);
        if (updErr) {
          secureLogger.warn('Auth link: failed to set supabase_auth_user_id', { error: updErr.message });
        } else {
          secureLogger.info('Auth link established', { userId: userRow.id, deviceId, authUserId });
        }
        return next();
      }

      if (current !== authUserId) {
        // 別のトークンでのアクセスを拒否
        return res.status(409).json({
          error: 'Conflict',
          message: 'Authenticated user does not match device owner',
          code: 'AUTH_DEVICE_MISMATCH'
        });
      }

      // 一致
      return next();
    } catch (e) {
      secureLogger.warn('Auth link enforcement error', { error: e.message });
      return next();
    }
  };
}

export default enforceAuthLink;

