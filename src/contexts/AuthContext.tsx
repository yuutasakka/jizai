// 認証コンテキスト - Supabaseセッション管理と堅牢化
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { storagePolicy } from '../utils/storage-policy';

// 開発環境判定
const isDevelopment = () => {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('.local');
};

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  isAuthenticated: boolean;
  sessionExpiry: Date | null;
  reLoginPromptVisible?: boolean;
  reLoginRedirectPath?: string | null;
}

export interface AuthActions {
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ user: User | null; error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  refreshSession: () => Promise<{ session: Session | null; error: AuthError | null }>;
  checkSessionExpiry: () => boolean;
  promptReLogin: () => void;
  confirmReLogin: () => void;
  cancelReLogin: () => void;
  // 開発環境専用ログイン機能
  devLogin: () => Promise<{ user: User | null; error: AuthError | null }>;
  loginWithGoogle: () => Promise<{ user: User | null; error: AuthError | null }>;
  loginWithApple: () => Promise<{ user: User | null; error: AuthError | null }>;
  isDevLoginEnabled: boolean;
  isLoginRequired: boolean;
}

export interface AuthContextValue extends AuthState, AuthActions {}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export interface AuthProviderProps {
  children: React.ReactNode;
  onSessionExpired?: () => void;
  onSessionRefreshed?: (session: Session) => void;
  onAuthError?: (error: AuthError) => void;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  onSessionExpired,
  onSessionRefreshed,
  onAuthError
}) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    initialized: false,
    isAuthenticated: false,
    sessionExpiry: null,
    reLoginPromptVisible: false,
    reLoginRedirectPath: null
  });

  const [sessionCheckInterval, setSessionCheckInterval] = useState<NodeJS.Timeout | null>(null);

  // セッション状態を更新
  const updateAuthState = useCallback((session: Session | null, user: User | null) => {
    const sessionExpiry = session?.expires_at ? new Date(session.expires_at * 1000) : null;

    setState(prev => ({
      ...prev,
      user,
      session,
      isAuthenticated: !!session && !!user,
      sessionExpiry,
      loading: false,
      initialized: true
    }));

    // セッション情報をストレージに保存（非個人情報のみ）
    if (session) {
      storagePolicy.setByCategory('lastLogin', Date.now(), undefined, {
        ttl: 'persistent',
        type: 'localStorage'
      });
    }
  }, []);

  // セッション有効期限チェック
  const checkSessionExpiry = useCallback((): boolean => {
    if (!state.sessionExpiry) return true;

    const now = new Date();
    const timeUntilExpiry = state.sessionExpiry.getTime() - now.getTime();
    const fiveMinutes = 5 * 60 * 1000;

    return timeUntilExpiry > fiveMinutes;
  }, [state.sessionExpiry]);

  // セッション更新
  const refreshSession = useCallback(async (): Promise<{ session: Session | null; error: AuthError | null }> => {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error('Session refresh failed:', error);
        onAuthError?.(error);
        return { session: null, error };
      }

      if (data.session) {
        updateAuthState(data.session, data.user);
        onSessionRefreshed?.(data.session);
        console.log('Session refreshed successfully');
      }

      return { session: data.session, error: null };
    } catch (error) {
      console.error('Session refresh error:', error);
      const authError = { message: (error as Error).message } as AuthError;
      onAuthError?.(authError);
      return { session: null, error: authError };
    }
  }, [updateAuthState, onSessionRefreshed, onAuthError]);

  // 再ログイン誘導
  const promptReLogin = useCallback(() => {
    console.log('Session expired or invalid, prompting re-login');
    // セッション状態をクリア
    updateAuthState(null, null);
    // ストレージから認証関連データをクリア
    storagePolicy.clearAllData(false);
    // コールバック実行
    onSessionExpired?.();
    // モーダル表示 + リダイレクト先を保持
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname + window.location.search;
      setState(prev => ({ ...prev, reLoginPromptVisible: true, reLoginRedirectPath: currentPath }));
    } else {
      setState(prev => ({ ...prev, reLoginPromptVisible: true, reLoginRedirectPath: '/' }));
    }
  }, [updateAuthState, onSessionExpired]);

  const confirmReLogin = useCallback(() => {
    const redirect = state.reLoginRedirectPath || '/';
    if (typeof window !== 'undefined') {
      const loginUrl = `/login?redirect=${encodeURIComponent(redirect)}`;
      window.location.href = loginUrl;
    }
  }, [state.reLoginRedirectPath]);

  const cancelReLogin = useCallback(() => {
    setState(prev => ({ ...prev, reLoginPromptVisible: false }));
  }, []);

  // サインイン
  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      const error = { message: 'Supabase client not initialized' } as AuthError;
      return { user: null, error };
    }

    try {
      setState(prev => ({ ...prev, loading: true }));

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        onAuthError?.(error);
        return { user: null, error };
      }

      updateAuthState(data.session, data.user);
      return { user: data.user, error: null };
    } catch (error) {
      const authError = { message: (error as Error).message } as AuthError;
      onAuthError?.(authError);
      return { user: null, error: authError };
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [updateAuthState, onAuthError]);

  // サインアップ
  const signUp = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      const error = { message: 'Supabase client not initialized' } as AuthError;
      return { user: null, error };
    }

    try {
      setState(prev => ({ ...prev, loading: true }));

      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });

      if (error) {
        onAuthError?.(error);
        return { user: null, error };
      }

      updateAuthState(data.session, data.user);
      return { user: data.user, error: null };
    } catch (error) {
      const authError = { message: (error as Error).message } as AuthError;
      onAuthError?.(authError);
      return { user: null, error: authError };
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [updateAuthState, onAuthError]);

  // サインアウト
  const signOut = useCallback(async () => {
    if (!supabase) {
      const error = { message: 'Supabase client not initialized' } as AuthError;
      return { error };
    }

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        onAuthError?.(error);
        return { error };
      }

      updateAuthState(null, null);
      storagePolicy.clearAllData(false);

      return { error: null };
    } catch (error) {
      const authError = { message: (error as Error).message } as AuthError;
      onAuthError?.(authError);
      return { error: authError };
    }
  }, [updateAuthState, onAuthError]);

  // 開発環境専用ログイン機能
  const devLogin = useCallback(async () => {
    if (!isDevelopment()) {
      const error = { message: 'Development login is only available in development environment' } as AuthError;
      return { user: null, error };
    }

    try {
      setState(prev => ({ ...prev, loading: true }));

      // 開発環境用のダミーユーザーを作成
      const mockUser: User = {
        id: 'dev-user-12345',
        email: 'dev@jizai.local',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: { name: 'Development User' },
        aud: 'authenticated',
        role: 'authenticated'
      } as User;

      const mockSession: Session = {
        access_token: 'dev-access-token',
        refresh_token: 'dev-refresh-token',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user: mockUser
      } as Session;

      updateAuthState(mockSession, mockUser);
      console.log('Development login successful');

      return { user: mockUser, error: null };
    } catch (error) {
      const authError = { message: (error as Error).message } as AuthError;
      onAuthError?.(authError);
      return { user: null, error: authError };
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [updateAuthState, onAuthError]);

  // Google OAuth ログイン
  const loginWithGoogle = useCallback(async () => {
    if (!supabase) {
      const error = { message: 'Supabase client not initialized' } as AuthError;
      return { user: null, error };
    }

    try {
      setState(prev => ({ ...prev, loading: true }));

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        onAuthError?.(error);
        return { user: null, error };
      }

      // OAuthの場合、リダイレクトが発生するため即座にユーザー情報は返されない
      return { user: null, error: null };
    } catch (error) {
      const authError = { message: (error as Error).message } as AuthError;
      onAuthError?.(authError);
      return { user: null, error: authError };
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [onAuthError]);

  // Apple OAuth ログイン
  const loginWithApple = useCallback(async () => {
    if (!supabase) {
      const error = { message: 'Supabase client not initialized' } as AuthError;
      return { user: null, error };
    }

    try {
      setState(prev => ({ ...prev, loading: true }));

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        onAuthError?.(error);
        return { user: null, error };
      }

      return { user: null, error: null };
    } catch (error) {
      const authError = { message: (error as Error).message } as AuthError;
      onAuthError?.(authError);
      return { user: null, error: authError };
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [onAuthError]);

  // セッション監視と自動更新
  useEffect(() => {
    if (!supabase) return;

    // 初期セッション取得
    const getInitialSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Failed to get initial session:', error);
          onAuthError?.(error);
        }

        updateAuthState(data.session, data.session?.user || null);
      } catch (error) {
        console.error('Session initialization error:', error);
        setState(prev => ({ ...prev, loading: false, initialized: true }));
      }
    };

    getInitialSession();

    // 認証状態変更の監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        console.log('Auth state changed:', event, session?.user?.id);

        switch (event) {
          case 'SIGNED_IN':
            updateAuthState(session, session?.user || null);
            setState(prev => ({ ...prev, reLoginPromptVisible: false }));
            break;
          case 'SIGNED_OUT':
            // 401等でサインアウトされた場合もここに入る
            updateAuthState(null, null);
            storagePolicy.clearAllData(false);
            // 明示的に再ログインモーダルを促す
            setState(prev => ({ ...prev, reLoginPromptVisible: true, reLoginRedirectPath: window?.location?.pathname || '/' }));
            break;
          case 'TOKEN_REFRESHED':
            updateAuthState(session, session?.user || null);
            if (session) {
              onSessionRefreshed?.(session);
            }
            break;
          case 'USER_UPDATED':
            updateAuthState(session, session?.user || null);
            break;
          default:
            break;
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [updateAuthState, onAuthError, onSessionRefreshed]);

  // セッション有効期限の定期チェック
  useEffect(() => {
    if (!state.isAuthenticated || !state.sessionExpiry) {
      if (sessionCheckInterval) {
        clearInterval(sessionCheckInterval);
        setSessionCheckInterval(null);
      }
      return;
    }

    const interval = setInterval(() => {
      const isValid = checkSessionExpiry();

      if (!isValid) {
        console.log('Session expiring soon, attempting refresh...');
        refreshSession().catch(error => {
          console.error('Auto-refresh failed:', error);
          promptReLogin();
        });
      }
    }, 60000); // Check every minute

    setSessionCheckInterval(interval);

    return () => {
      clearInterval(interval);
    };
  }, [state.isAuthenticated, state.sessionExpiry, checkSessionExpiry, refreshSession, promptReLogin]);

  const contextValue: AuthContextValue = {
    // State
    ...state,

    // Actions
    signIn,
    signUp,
    signOut,
    refreshSession,
    checkSessionExpiry,
    promptReLogin,
    confirmReLogin,
    cancelReLogin,

    // 開発環境ログイン機能
    devLogin,
    loginWithGoogle,
    loginWithApple,
    isDevLoginEnabled: isDevelopment(),
    isLoginRequired: !state.isAuthenticated
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// カスタムフック
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// 認証ガード用フック
export const useAuthGuard = (redirectTo = '/login') => {
  const { isAuthenticated, loading, initialized } = useAuth();

  useEffect(() => {
    if (initialized && !loading && !isAuthenticated) {
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        const loginUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`;
        window.location.href = loginUrl;
      }
    }
  }, [isAuthenticated, loading, initialized, redirectTo]);

  return { isAuthenticated, loading, initialized };
};

export default AuthContext;
