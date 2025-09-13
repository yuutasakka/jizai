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

  // 初期化: Supabase セッションから復元
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Allow skipping login for demo flows
        const loginSkipped = localStorage.getItem('jizai_login_skipped');

        if (!supabase) {
          // No Supabase configuration provided — keep previous demo behavior
          if (loginSkipped === 'true') setIsLoginRequired(false);
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
        }
      } catch (error) {
        console.error('認証状態の復元に失敗:', error);
        localStorage.removeItem('jizai_login_skipped');
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
      if (!supabase) throw new Error('Supabase is not configured');
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
      if (!supabase) throw new Error('Supabase is not configured');
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

  const isAuthenticated = user !== null;

  const value: AuthContextValue = {
    user,
    isAuthenticated,
    isLoading,
    loginWithGoogle,
    loginWithApple,
    logout,
    skipLogin,
    isLoginRequired
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
