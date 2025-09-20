import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider: 'google' | 'apple';
  createdAt: Date;
  lastLoginAt: Date;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  logout: () => Promise<void>;
  skipLogin: () => void;
  isLoginRequired: boolean;
  // Development-only helper to create a temporary user session
  devLogin?: () => void;
  // Whether dev login is available (only non-production or when explicitly enabled)
  isDevLoginEnabled?: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginRequired, setIsLoginRequired] = useState(true);
  // Enable dev login in non-production, or when flag is explicitly set
  const isDevLoginEnabled =
    ((import.meta as any)?.env?.MODE !== 'production') ||
    ((import.meta as any)?.env?.VITE_ENABLE_DEV_LOGIN === 'true');

  // 初期化: Supabase セッションから復元
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Allow skipping login for demo flows
        const loginSkipped = localStorage.getItem('jizai_login_skipped');
        const devLoginPersisted = localStorage.getItem('jizai_dev_login') === 'true';

        if (!supabase) {
          // No Supabase configuration provided — keep previous demo behavior
          if (loginSkipped === 'true') setIsLoginRequired(false);
          if (isDevLoginEnabled && devLoginPersisted) {
            // Restore dev user session if previously set
            setUser({
              id: 'dev-user',
              email: 'dev@example.com',
              name: '開発ユーザー',
              provider: 'google',
              createdAt: new Date(),
              lastLoginAt: new Date(),
            });
            setIsLoginRequired(false);
          }
          return;
        }

        const { data } = await supabase.auth.getSession();
        const session = data.session as Session | null;
        if (session?.user) {
          const mapped = mapSupabaseUser(session);
          setUser(mapped);
          setIsLoginRequired(false);
        } else if (loginSkipped === 'true') {
          setIsLoginRequired(false);
        } else if (isDevLoginEnabled && devLoginPersisted) {
          setUser({
            id: 'dev-user',
            email: 'dev@example.com',
            name: '開発ユーザー',
            provider: 'google',
            createdAt: new Date(),
            lastLoginAt: new Date(),
          });
          setIsLoginRequired(false);
        }
      } catch (error) {
        console.error('認証状態の復元に失敗:', error);
        localStorage.removeItem('jizai_login_skipped');
        localStorage.removeItem('jizai_dev_login');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    if (supabase) {
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const mapped = mapSupabaseUser(session as Session);
          setUser(mapped);
          setIsLoginRequired(false);
        } else {
          setUser(null);
          setIsLoginRequired(true);
        }
      });
      return () => {
        sub.subscription.unsubscribe();
      };
    }
  }, []);

  const loginWithGoogle = async (): Promise<void> => {
    setIsLoading(true);
    try {
      if (!supabase) {
        // Supabase未設定の場合はデモユーザーとしてログイン
        console.warn('Supabase未設定 - デモモードでログイン');
        setUser({
          id: 'demo-user-google',
          email: 'demo@example.com',
          name: 'デモユーザー (Google)',
          provider: 'google',
          createdAt: new Date(),
          lastLoginAt: new Date(),
        });
        setIsLoginRequired(false);
        return;
      }
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: { prompt: 'consent', access_type: 'offline' },
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Googleログインエラー:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithApple = async (): Promise<void> => {
    setIsLoading(true);
    try {
      if (!supabase) {
        // Supabase未設定の場合はデモユーザーとしてログイン
        console.warn('Supabase未設定 - デモモードでログイン');
        setUser({
          id: 'demo-user-apple',
          email: 'demo@example.com',
          name: 'デモユーザー (Apple)',
          provider: 'apple',
          createdAt: new Date(),
          lastLoginAt: new Date(),
        });
        setIsLoginRequired(false);
        return;
      }
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: { redirectTo },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Appleログインエラー:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
      setUser(null);
      setIsLoginRequired(true);
      localStorage.removeItem('jizai_login_skipped');
      localStorage.removeItem('jizai_dev_login');
    } catch (error) {
      console.error('ログアウトエラー:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const skipLogin = (): void => {
    setIsLoginRequired(false);
    localStorage.setItem('jizai_login_skipped', 'true');
  };

  // Development-only login: creates a temporary local user
  const devLogin = (): void => {
    if (!isDevLoginEnabled) return;
    setUser({
      id: 'dev-user',
      email: 'dev@example.com',
      name: '開発ユーザー',
      provider: 'google',
      createdAt: new Date(),
      lastLoginAt: new Date(),
    });
    setIsLoginRequired(false);
    localStorage.setItem('jizai_dev_login', 'true');
  };

  const isAuthenticated = user !== null;

  const value: AuthContextValue = {
    user,
    isAuthenticated,
    isLoading,
    loginWithGoogle,
    loginWithApple,
    logout,
    skipLogin,
    isLoginRequired,
    devLogin: isDevLoginEnabled ? devLogin : undefined,
    isDevLoginEnabled,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Map Supabase session user -> local User model
function mapSupabaseUser(session: Session) {
  const u = session.user;
  const meta = (u as any).user_metadata || {};
  const app = (u as any).app_metadata || {};
  return {
    id: u.id,
    email: u.email || meta.email || '',
    name: meta.name || meta.full_name || (u.email || 'User'),
    avatar: meta.avatar_url,
    provider: (app.provider as 'google' | 'apple') || 'google',
    createdAt: new Date(u.created_at),
    lastLoginAt: new Date(),
  };
}
