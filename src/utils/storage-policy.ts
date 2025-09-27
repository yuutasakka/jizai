// ストレージ利用ポリシー - localStorage/sessionStorageの統一管理

export interface StorageConfig {
  key: string;
  type: 'localStorage' | 'sessionStorage';
  ttl?: number; // Time to live in milliseconds
  encrypted?: boolean;
  allowPersonalInfo?: boolean;
}

export interface StorageEntry<T = any> {
  value: T;
  timestamp: number;
  ttl?: number;
  version: string;
}

class StoragePolicyManager {
  private readonly APP_PREFIX = 'jizai-';
  private readonly VERSION = '1.0.0';
  private readonly PERSONAL_INFO_KEYS = [
    'email', 'phone', 'address', 'name', 'birthday', 'ssn', 'credit-card'
  ];

  // ストレージキー命名ガイド
  private readonly KEY_PATTERNS = {
    // User preferences and settings
    settings: 'settings',
    theme: 'theme-preference',
    language: 'language-preference',

    // Authentication and session
    deviceId: 'device-id',
    lastLogin: 'last-login-timestamp',

    // Application state
    tutorial: 'tutorial-completed',
    onboarding: 'onboarding-step',

    // Cache and temporary data
    imageCache: 'image-cache',
    promptCache: 'prompt-cache',
    templateCache: 'template-key',

    // Feature flags and experiments
    features: 'feature-flags',
    experiments: 'experiments',

    // Analytics (non-personal)
    usage: 'usage-analytics',
    performance: 'performance-metrics'
  };

  // デフォルトTTL設定（ミリ秒）
  private readonly DEFAULT_TTL = {
    session: 24 * 60 * 60 * 1000, // 24 hours
    temporary: 60 * 60 * 1000, // 1 hour
    cache: 7 * 24 * 60 * 60 * 1000, // 7 days
    persistent: undefined // No expiration
  };

  constructor() {
    // Initialize cleanup on page load
    this.cleanup();

    // Set up periodic cleanup
    setInterval(() => {
      this.cleanup();
    }, 60 * 60 * 1000); // Clean up every hour
  }

  /**
   * Validate key against naming conventions and security policies
   */
  private validateKey(key: string, config?: Partial<StorageConfig>): void {
    // Check for personal information
    const containsPersonalInfo = this.PERSONAL_INFO_KEYS.some(pattern =>
      key.toLowerCase().includes(pattern)
    );

    if (containsPersonalInfo && !config?.allowPersonalInfo) {
      throw new Error(`Storage policy violation: Personal information not allowed in key "${key}"`);
    }

    // Enforce key prefix
    if (!key.startsWith(this.APP_PREFIX)) {
      console.warn(`Key "${key}" should use app prefix "${this.APP_PREFIX}"`);
    }
  }

  /**
   * Create storage key with proper naming convention
   */
  createKey(category: keyof typeof this.KEY_PATTERNS, identifier?: string): string {
    const baseKey = this.KEY_PATTERNS[category];
    const key = identifier ? `${baseKey}-${identifier}` : baseKey;
    return `${this.APP_PREFIX}${key}`;
  }

  /**
   * Store data with TTL and validation
   */
  set<T>(
    key: string,
    value: T,
    config: StorageConfig = { key, type: 'localStorage' }
  ): void {
    this.validateKey(key, config);

    const storage = config.type === 'sessionStorage' ? sessionStorage : localStorage;
    const entry: StorageEntry<T> = {
      value,
      timestamp: Date.now(),
      ttl: config.ttl,
      version: this.VERSION
    };

    try {
      const serialized = JSON.stringify(entry);
      if (config.encrypted) {
        // TODO: Implement encryption for sensitive data
        console.warn('Encryption not yet implemented');
      }

      storage.setItem(key, serialized);
    } catch (error) {
      console.error(`Failed to store "${key}":`, error);
      throw new Error(`Storage failed: ${error}`);
    }
  }

  /**
   * Retrieve data with TTL validation
   */
  get<T>(key: string, type: 'localStorage' | 'sessionStorage' = 'localStorage'): T | null {
    const storage = type === 'sessionStorage' ? sessionStorage : localStorage;

    try {
      const serialized = storage.getItem(key);
      if (!serialized) return null;

      const entry: StorageEntry<T> = JSON.parse(serialized);

      // Check TTL
      if (entry.ttl && Date.now() > entry.timestamp + entry.ttl) {
        this.remove(key, type);
        return null;
      }

      // Version compatibility check
      if (entry.version !== this.VERSION) {
        console.warn(`Version mismatch for "${key}": ${entry.version} vs ${this.VERSION}`);
        // Could implement migration logic here
      }

      return entry.value;
    } catch (error) {
      console.error(`Failed to retrieve "${key}":`, error);
      this.remove(key, type); // Remove corrupted data
      return null;
    }
  }

  /**
   * Remove specific key
   */
  remove(key: string, type: 'localStorage' | 'sessionStorage' = 'localStorage'): void {
    const storage = type === 'sessionStorage' ? sessionStorage : localStorage;
    storage.removeItem(key);
  }

  /**
   * Set with predefined category and TTL
   */
  setByCategory<T>(
    category: keyof typeof this.KEY_PATTERNS,
    value: T,
    identifier?: string,
    options?: {
      ttl?: 'session' | 'temporary' | 'cache' | 'persistent';
      type?: 'localStorage' | 'sessionStorage';
      encrypted?: boolean;
    }
  ): void {
    const key = this.createKey(category, identifier);
    const ttl = options?.ttl ? this.DEFAULT_TTL[options.ttl] : undefined;

    this.set(key, value, {
      key,
      type: options?.type || 'localStorage',
      ttl,
      encrypted: options?.encrypted || false
    });
  }

  /**
   * Get by predefined category
   */
  getByCategory<T>(
    category: keyof typeof this.KEY_PATTERNS,
    identifier?: string,
    type: 'localStorage' | 'sessionStorage' = 'localStorage'
  ): T | null {
    const key = this.createKey(category, identifier);
    return this.get<T>(key, type);
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): void {
    const now = Date.now();

    [localStorage, sessionStorage].forEach(storage => {
      const keysToRemove: string[] = [];

      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (!key?.startsWith(this.APP_PREFIX)) continue;

        try {
          const serialized = storage.getItem(key);
          if (!serialized) continue;

          const entry: StorageEntry = JSON.parse(serialized);

          // Remove if expired
          if (entry.ttl && now > entry.timestamp + entry.ttl) {
            keysToRemove.push(key);
          }
        } catch {
          // Remove corrupted entries
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => storage.removeItem(key));

      if (keysToRemove.length > 0) {
        console.log(`Cleaned up ${keysToRemove.length} expired/corrupted entries`);
      }
    });
  }

  /**
   * Clear all app data (except persistent settings)
   */
  clearAllData(includePersistent = false): void {
    [localStorage, sessionStorage].forEach(storage => {
      const keysToRemove: string[] = [];

      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (!key?.startsWith(this.APP_PREFIX)) continue;

        if (!includePersistent) {
          // Keep persistent settings
          const persistentKeys = [
            this.createKey('settings'),
            this.createKey('theme'),
            this.createKey('language')
          ];

          if (persistentKeys.includes(key)) continue;
        }

        keysToRemove.push(key);
      }

      keysToRemove.forEach(key => storage.removeItem(key));
    });
  }

  /**
   * Get storage usage statistics
   */
  getUsageStats(): {
    localStorage: { keys: number; size: number };
    sessionStorage: { keys: number; size: number };
    expiredEntries: number;
  } {
    const stats = {
      localStorage: { keys: 0, size: 0 },
      sessionStorage: { keys: 0, size: 0 },
      expiredEntries: 0
    };

    const now = Date.now();

    [
      { storage: localStorage, name: 'localStorage' as const },
      { storage: sessionStorage, name: 'sessionStorage' as const }
    ].forEach(({ storage, name }) => {
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (!key?.startsWith(this.APP_PREFIX)) continue;

        const value = storage.getItem(key);
        if (value) {
          stats[name].keys++;
          stats[name].size += key.length + value.length;

          try {
            const entry: StorageEntry = JSON.parse(value);
            if (entry.ttl && now > entry.timestamp + entry.ttl) {
              stats.expiredEntries++;
            }
          } catch {
            stats.expiredEntries++;
          }
        }
      }
    });

    return stats;
  }
}

// Singleton instance
export const storagePolicy = new StoragePolicyManager();
export default storagePolicy;

// Convenience functions for common patterns
export const userSettings = {
  get: <T>(key: string) => storagePolicy.getByCategory<T>('settings', key),
  set: <T>(key: string, value: T) => storagePolicy.setByCategory('settings', value, key, { ttl: 'persistent' })
};

export const sessionCache = {
  get: <T>(key: string) => storagePolicy.getByCategory<T>('imageCache', key, 'sessionStorage'),
  set: <T>(key: string, value: T) => storagePolicy.setByCategory('imageCache', value, key, {
    type: 'sessionStorage',
    ttl: 'session'
  })
};

export const promptCache = {
  get: <T>(key: string) => storagePolicy.getByCategory<T>('promptCache', key),
  set: <T>(key: string, value: T) => storagePolicy.setByCategory('promptCache', value, key, { ttl: 'cache' })
};