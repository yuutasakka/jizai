import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

  // 初期化時にローカルストレージから認証状態を復元
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const savedUser = localStorage.getItem('jizai_user');
        const loginSkipped = localStorage.getItem('jizai_login_skipped');
        
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          // 日付フィールドを復元
          userData.createdAt = new Date(userData.createdAt);
          userData.lastLoginAt = new Date(userData.lastLoginAt);
          setUser(userData);
          setIsLoginRequired(false);
        } else if (loginSkipped === 'true') {
          setIsLoginRequired(false);
        }
      } catch (error) {
        console.error('認証状態の復元に失敗:', error);
        localStorage.removeItem('jizai_user');
        localStorage.removeItem('jizai_login_skipped');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const loginWithGoogle = async (): Promise<void> => {
    setIsLoading(true);
    try {
      // TODO: 実際のGoogle OAuth実装
      // 今はモックデータで代用
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockUser: User = {
        id: 'google_' + Math.random().toString(36).substr(2, 9),
        email: 'user@gmail.com',
        name: '田中 太郎',
        avatar: 'https://via.placeholder.com/64x64?text=G',
        provider: 'google',
        createdAt: new Date(),
        lastLoginAt: new Date()
      };

      setUser(mockUser);
      setIsLoginRequired(false);
      localStorage.setItem('jizai_user', JSON.stringify(mockUser));
      localStorage.removeItem('jizai_login_skipped');
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
      // TODO: 実際のApple OAuth実装
      // 今はモックデータで代用
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockUser: User = {
        id: 'apple_' + Math.random().toString(36).substr(2, 9),
        email: 'user@icloud.com',
        name: '山田 花子',
        avatar: 'https://via.placeholder.com/64x64?text=A',
        provider: 'apple',
        createdAt: new Date(),
        lastLoginAt: new Date()
      };

      setUser(mockUser);
      setIsLoginRequired(false);
      localStorage.setItem('jizai_user', JSON.stringify(mockUser));
      localStorage.removeItem('jizai_login_skipped');
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
      // TODO: 実際のログアウト処理
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUser(null);
      setIsLoginRequired(true);
      localStorage.removeItem('jizai_user');
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