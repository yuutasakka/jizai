/**
 * エラートラッキング・ログ収集システム
 * Vercel環境での軽量なエラーハンドリングとモニタリング
 */

interface ErrorLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'critical';
  message: string;
  context?: Record<string, any>;
  stack?: string;
  userAgent?: string;
  url?: string;
  userId?: string;
}

interface PerformanceMetrics {
  timestamp: string;
  metric: string;
  value: number;
  context?: Record<string, any>;
}

class ErrorTracker {
  private isProduction = (import.meta as any).env?.PROD || false;
  private errorQueue: ErrorLog[] = [];
  private metricsQueue: PerformanceMetrics[] = [];
  private maxQueueSize = 100;

  /**
   * エラーログの記録
   */
  log(level: ErrorLog['level'], message: string, context?: Record<string, any>, error?: Error) {
    const errorLog: ErrorLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      stack: error?.stack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getUserId()
    };

    // コンソール出力
    this.logToConsole(errorLog);

    // キューに追加
    this.errorQueue.push(errorLog);
    this.maintainQueueSize();

    // 本番環境では外部サービスに送信（必要に応じて実装）
    if (this.isProduction && level === 'critical') {
      this.sendToAnalytics(errorLog);
    }
  }

  /**
   * パフォーマンスメトリクスの記録
   */
  recordMetric(metric: string, value: number, context?: Record<string, any>) {
    const performanceMetric: PerformanceMetrics = {
      timestamp: new Date().toISOString(),
      metric,
      value,
      context
    };

    this.metricsQueue.push(performanceMetric);
    this.maintainMetricsQueueSize();

    if (this.isProduction) {
      this.sendMetricToAnalytics(performanceMetric);
    }
  }

  /**
   * API呼び出しエラーの専用ハンドラー
   */
  logApiError(endpoint: string, status?: number, error?: any) {
    this.log('error', `API Error: ${endpoint}`, {
      endpoint,
      status,
      error: error?.message || error
    }, error);
  }

  /**
   * ユーザーアクションの記録
   */
  logUserAction(action: string, context?: Record<string, any>) {
    this.log('info', `User Action: ${action}`, context);
  }

  /**
   * 画像処理エラーの専用ハンドラー
   */
  logImageProcessingError(error: any, context?: Record<string, any>) {
    this.log('error', 'Image Processing Error', {
      ...context,
      error: error?.message || error
    }, error);
  }

  /**
   * コンソールへの出力
   */
  private logToConsole(errorLog: ErrorLog) {
    const { timestamp, level, message, context, stack } = errorLog;
    const logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;

    switch (level) {
      case 'info':
        console.log(logMessage, context);
        break;
      case 'warn':
        console.warn(logMessage, context);
        break;
      case 'error':
      case 'critical':
        console.error(logMessage, context, stack);
        break;
    }
  }

  /**
   * Vercel Analyticsへの送信
   */
  private sendToAnalytics(errorLog: ErrorLog) {
    try {
      // Vercel Analytics経由でカスタムイベントを送信
      if (typeof window !== 'undefined' && (window as any).va) {
        (window as any).va.track('error', {
          level: errorLog.level,
          message: errorLog.message,
          url: errorLog.url,
          timestamp: errorLog.timestamp
        });
      }
    } catch (error) {
      console.error('Failed to send error to analytics:', error);
    }
  }

  /**
   * メトリクスの送信
   */
  private sendMetricToAnalytics(metric: PerformanceMetrics) {
    try {
      if (typeof window !== 'undefined' && (window as any).va) {
        (window as any).va.track('performance', {
          metric: metric.metric,
          value: metric.value,
          timestamp: metric.timestamp
        });
      }
    } catch (error) {
      console.error('Failed to send metric to analytics:', error);
    }
  }

  /**
   * ユーザーIDの取得（匿名化）
   */
  private getUserId(): string | undefined {
    try {
      // デバイスIDやセッションIDなどの匿名識別子を使用
      return localStorage.getItem('deviceId') || undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * エラーキューのサイズ管理
   */
  private maintainQueueSize() {
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue = this.errorQueue.slice(-this.maxQueueSize);
    }
  }

  /**
   * メトリクスキューのサイズ管理
   */
  private maintainMetricsQueueSize() {
    if (this.metricsQueue.length > this.maxQueueSize) {
      this.metricsQueue = this.metricsQueue.slice(-this.maxQueueSize);
    }
  }

  /**
   * エラーログの取得（デバッグ用）
   */
  getErrorLogs(): ErrorLog[] {
    return [...this.errorQueue];
  }

  /**
   * メトリクスの取得（デバッグ用）
   */
  getMetrics(): PerformanceMetrics[] {
    return [...this.metricsQueue];
  }
}

// シングルトンインスタンス
export const errorTracker = new ErrorTracker();

/**
 * グローバルエラーハンドラーの設定
 */
export function setupGlobalErrorHandling() {
  // 未処理のエラー
  window.addEventListener('error', (event) => {
    errorTracker.log('error', 'Unhandled Error', {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    }, event.error);
  });

  // 未処理のPromise拒否
  window.addEventListener('unhandledrejection', (event) => {
    errorTracker.log('error', 'Unhandled Promise Rejection', {
      reason: event.reason?.message || event.reason
    });
  });
}

/**
 * パフォーマンス監視の設定
 */
export function setupPerformanceMonitoring() {
  // Core Web Vitals
  if ('web-vitals' in window) {
    // getCLS, getFID, getFCP, getLCP, getTTFBなどを使用
    // 実装は@vercel/analyticsが自動で行うため、追加の手動実装は不要
  }

  // カスタムパフォーマンス監視
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'navigation') {
        const navEntry = entry as PerformanceNavigationTiming;
        errorTracker.recordMetric('page_load_time', navEntry.loadEventEnd - navEntry.fetchStart);
      }
      
      if (entry.entryType === 'resource') {
        const resourceEntry = entry as PerformanceResourceTiming;
        if (resourceEntry.name.includes('api')) {
          errorTracker.recordMetric('api_response_time', resourceEntry.responseEnd - resourceEntry.requestStart, {
            url: resourceEntry.name
          });
        }
      }
    }
  });

  observer.observe({ entryTypes: ['navigation', 'resource'] });
}

// React Error Boundary用のヘルパー
export function logReactError(error: Error, errorInfo: { componentStack: string }) {
  errorTracker.log('error', 'React Error', {
    componentStack: errorInfo.componentStack
  }, error);
}
