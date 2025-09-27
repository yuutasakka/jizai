// フォント最適化とアクセシビリティユーティリティ

export interface FontConfig {
  family: string;
  weight?: number | string;
  style?: 'normal' | 'italic';
  display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
  preload?: boolean;
  fallback?: string[];
}

export interface AccessibilityConfig {
  respectReducedMotion?: boolean;
  highContrastMode?: boolean;
  fontSize?: 'small' | 'medium' | 'large';
  lineHeight?: 'compact' | 'normal' | 'relaxed';
}

class FontOptimizer {
  private loadedFonts = new Set<string>();
  private fontObserver: any | null = null;

  constructor() {
    this.initializeFontObserver();
    this.setupAccessibilityListeners();
  }

  /**
   * フォントの動的読み込み
   */
  async loadFont(config: FontConfig): Promise<boolean> {
    const fontKey = this.getFontKey(config);

    if (this.loadedFonts.has(fontKey)) {
      return true;
    }

    try {
      // Preload linkがある場合は先に読み込み
      if (config.preload) {
        this.preloadFont(config);
      }

      // FontFace APIを使用して読み込み
      const font = new FontFace(
        config.family,
        `url('/fonts/${config.family.replace(/\s+/g, '-').toLowerCase()}.woff2') format('woff2')`,
        {
          weight: String(config.weight || 'normal'),
          style: config.style || 'normal',
          display: config.display || 'swap'
        }
      );

      await font.load();
      document.fonts.add(font);

      this.loadedFonts.add(fontKey);
      console.log(`Font loaded: ${fontKey}`);

      return true;
    } catch (error) {
      console.warn(`Failed to load font: ${fontKey}`, error);
      return false;
    }
  }

  /**
   * フォントプリロード
   */
  preloadFont(config: FontConfig): void {
    if (typeof document === 'undefined') return;

    const fontPath = `/fonts/${config.family.replace(/\s+/g, '-').toLowerCase()}.woff2`;
    const existing = document.querySelector(`link[href="${fontPath}"]`);

    if (!existing) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = fontPath;
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    }
  }

  /**
   * フォントフォールバックスタック生成
   */
  generateFontStack(config: FontConfig): string {
    const fallbacks = config.fallback || this.getSystemFallbacks();
    return [config.family, ...fallbacks].join(', ');
  }

  /**
   * システムフォントフォールバック
   */
  private getSystemFallbacks(): string[] {
    return [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      '"Noto Sans"',
      '"Liberation Sans"',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
      '"Noto Color Emoji"'
    ];
  }

  private getFontKey(config: FontConfig): string {
    return `${config.family}-${config.weight || 'normal'}-${config.style || 'normal'}`;
  }

  private initializeFontObserver(): void {
    if (typeof window === 'undefined') return;

    // フォント読み込み完了の監視
    if ('fonts' in document) {
      document.fonts.ready.then(() => {
        console.log('All fonts loaded');
        document.body.classList.add('fonts-loaded');
      });
    }
  }

  private setupAccessibilityListeners(): void {
    if (typeof window === 'undefined') return;

    // Reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = () => {
      document.body.classList.toggle('reduce-motion', mediaQuery.matches);
    };

    mediaQuery.addEventListener('change', handleMotionChange);
    handleMotionChange();
  }
}

class AccessibilityManager {
  private config: AccessibilityConfig = {};

  constructor(config: AccessibilityConfig = {}) {
    this.config = {
      respectReducedMotion: true,
      highContrastMode: false,
      fontSize: 'medium',
      lineHeight: 'normal',
      ...config
    };

    this.initialize();
  }

  initialize(): void {
    this.setupReducedMotion();
    this.setupHighContrast();
    this.setupFontSize();
    this.setupFocusManagement();
  }

  /**
   * Reduced Motion対応
   */
  private setupReducedMotion(): void {
    if (!this.config.respectReducedMotion || typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const applyReducedMotion = (reduce: boolean) => {
      document.body.classList.toggle('reduce-motion', reduce);

      if (reduce) {
        // Disable animations
        const style = document.createElement('style');
        style.id = 'reduced-motion-styles';
        style.textContent = `
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        `;
        document.head.appendChild(style);
      } else {
        const existingStyle = document.getElementById('reduced-motion-styles');
        if (existingStyle) {
          existingStyle.remove();
        }
      }
    };

    mediaQuery.addEventListener('change', (e) => applyReducedMotion(e.matches));
    applyReducedMotion(mediaQuery.matches);
  }

  /**
   * ハイコントラストモード対応
   */
  private setupHighContrast(): void {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    const applyHighContrast = (high: boolean) => {
      document.body.classList.toggle('high-contrast', high);
    };

    mediaQuery.addEventListener('change', (e) => applyHighContrast(e.matches));
    applyHighContrast(mediaQuery.matches);
  }

  /**
   * フォントサイズ設定
   */
  private setupFontSize(): void {
    const sizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px'
    };

    const fontSize = sizeMap[this.config.fontSize || 'medium'];
    document.documentElement.style.fontSize = fontSize;
  }

  /**
   * フォーカス管理
   */
  private setupFocusManagement(): void {
    if (typeof window === 'undefined') return;

    // キーボードナビゲーション検出
    let isUsingKeyboard = false;

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        isUsingKeyboard = true;
        document.body.classList.add('using-keyboard');
      }
    });

    document.addEventListener('mousedown', () => {
      isUsingKeyboard = false;
      document.body.classList.remove('using-keyboard');
    });

    // Skip link implementation
    this.addSkipLinks();
  }

  /**
   * スキップリンク追加
   */
  private addSkipLinks(): void {
    const skipLinks = document.createElement('div');
    skipLinks.className = 'skip-links';
    skipLinks.innerHTML = `
      <a href="#main-content" class="skip-link">メインコンテンツへスキップ</a>
      <a href="#navigation" class="skip-link">ナビゲーションへスキップ</a>
    `;

    // Styles for skip links
    const style = document.createElement('style');
    style.textContent = `
      .skip-links {
        position: absolute;
        top: -40px;
        left: 6px;
        z-index: 1000;
      }

      .skip-link {
        position: absolute;
        top: -40px;
        left: 6px;
        background: #000;
        color: #fff;
        padding: 8px;
        text-decoration: none;
        border-radius: 4px;
        z-index: 1001;
      }

      .skip-link:focus {
        top: 6px;
      }
    `;

    document.head.appendChild(style);
    document.body.prepend(skipLinks);
  }

  /**
   * ARIA属性管理
   */
  static setAriaAttributes(element: HTMLElement, attributes: Record<string, string>): void {
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(`aria-${key}`, value);
    });
  }

  /**
   * Live region での通知
   */
  static announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.style.position = 'absolute';
    announcer.style.left = '-10000px';
    announcer.style.width = '1px';
    announcer.style.height = '1px';
    announcer.style.overflow = 'hidden';

    document.body.appendChild(announcer);
    announcer.textContent = message;

    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  }
}

// グローバルインスタンス
export const fontOptimizer = new FontOptimizer();
export const accessibilityManager = new AccessibilityManager();

// ユーティリティ関数
export const loadFonts = async (configs: FontConfig[]): Promise<boolean[]> => {
  return Promise.all(configs.map(config => fontOptimizer.loadFont(config)));
};

export const createFontStack = (primary: string, fallbacks?: string[]): string => {
  return fontOptimizer.generateFontStack({ family: primary, fallback: fallbacks });
};

export const announceToScreenReader = (message: string, priority?: 'polite' | 'assertive') => {
  AccessibilityManager.announce(message, priority);
};

export default {
  fontOptimizer,
  accessibilityManager,
  loadFonts,
  createFontStack,
  announceToScreenReader
};