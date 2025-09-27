// APIクライアント用インターセプタ実装
import { supabase } from '../lib/supabase';

export interface RequestInterceptor {
  onRequest?: (config: RequestConfig) => Promise<RequestConfig> | RequestConfig;
  onRequestError?: (error: Error) => Promise<never> | never;
}

export interface ResponseInterceptor {
  onResponse?: (response: Response) => Promise<Response> | Response;
  onResponseError?: (error: Error) => Promise<never> | never;
}

export interface RequestConfig {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
}

export interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryCondition: (error: Error, attempt: number) => boolean;
}

export interface BackoffConfig {
  initialDelay: number;
  maxDelay: number;
  multiplier: number;
  jitter: boolean;
}

class ApiInterceptor {
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private retryConfig: RetryConfig;
  private backoffConfig: BackoffConfig;

  constructor() {
    this.retryConfig = {
      maxRetries: 3,
      retryDelay: 1000,
      retryCondition: (error: any, _attempt: number) => {
        const status = error?.status as number | undefined;
        const isNetwork = !status; // fetch/network error has no status
        if (status === 429) return true;
        if (status && status >= 500) return true;
        return isNetwork;
      }
    };

    this.backoffConfig = {
      initialDelay: 1000,
      maxDelay: 10000,
      multiplier: 2,
      jitter: true
    };

    // デフォルトインターセプタを設定
    this.setupDefaultInterceptors();
  }

  private setupDefaultInterceptors(): void {
    // 認証ヘッダインターセプタ
    this.addRequestInterceptor({
      onRequest: async (config) => {
        try {
          if (!supabase) return config;
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.warn('Failed to add auth header:', error);
        }
        return config;
      }
    });

    // コンテンツタイプヘッダインターセプタ
    this.addRequestInterceptor({
      onRequest: (config) => {
        if (config.body && !(config.body instanceof FormData)) {
          config.headers['Content-Type'] = 'application/json';
        }
        return config;
      }
    });

    // 共通エラーハンドリングインターセプタ
    this.addResponseInterceptor({
      onResponseError: async (error) => {
        // セッション切れの場合は認証状態をクリア
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          try {
            if (supabase) {
              await supabase.auth.signOut();
            }
          } catch (signOutError) {
            console.warn('Failed to sign out on 401:', signOutError);
          }
        }
        throw error;
      }
    });

    // 429の待機はexecuteWithRetry側で一元管理（ヘッダRetry-After対応）
  }

  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  async request(config: RequestConfig): Promise<Response> {
    let processedConfig = { ...config };

    // Request interceptors
    for (const interceptor of this.requestInterceptors) {
      if (interceptor.onRequest) {
        try {
          processedConfig = await interceptor.onRequest(processedConfig);
        } catch (error) {
          if (interceptor.onRequestError) {
            await interceptor.onRequestError(error as Error);
          }
          throw error;
        }
      }
    }

    // Execute request with retry logic
    return this.executeWithRetry(processedConfig);
  }

  private async executeWithRetry(config: RequestConfig): Promise<Response> {
    let lastError: Error;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const response = await this.executeRequest(config);

        // Response interceptors
        let processedResponse = response;
        for (const interceptor of this.responseInterceptors) {
          if (interceptor.onResponse) {
            try {
              processedResponse = await interceptor.onResponse(processedResponse);
            } catch (error) {
              if (interceptor.onResponseError) {
                await interceptor.onResponseError(error as Error);
              }
              throw error;
            }
          }
        }

        return processedResponse;
      } catch (error) {
        lastError = error as Error;

        // Response error interceptors
        for (const interceptor of this.responseInterceptors) {
          if (interceptor.onResponseError) {
            try {
              await interceptor.onResponseError(lastError);
            } catch (interceptorError) {
              lastError = interceptorError as Error;
            }
          }
        }

        // Check if should retry
        if (attempt < this.retryConfig.maxRetries && this.retryConfig.retryCondition(lastError as any, attempt)) {
          let delay = this.calculateBackoffDelay(attempt + 1);
          const status = (lastError as any)?.status as number | undefined;
          const retryAfterSec = (lastError as any)?.retryAfterSec as number | undefined;
          if (status === 429 && typeof retryAfterSec === 'number' && retryAfterSec >= 0) {
            delay = Math.max(retryAfterSec * 1000, this.backoffConfig.initialDelay);
          }
          console.log(`Request failed (attempt ${attempt + 1}, status=${status ?? 'network'}), retrying in ${delay}ms:`, lastError.message);
          await this.sleep(delay);
          continue;
        }

        throw lastError;
      }
    }

    throw lastError!;
  }

  private async executeRequest(config: RequestConfig): Promise<Response> {
    const { url, method, headers, body } = config;

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (body !== undefined) {
      if (body instanceof FormData) {
        fetchOptions.body = body;
      } else {
        fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
      }
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let retryAfterSec: number | undefined;
      try {
        const retryAfterHeader = response.headers.get('Retry-After');
        if (retryAfterHeader) {
          const sec = parseInt(retryAfterHeader, 10);
          if (!Number.isNaN(sec)) retryAfterSec = sec;
        }
        const errorData = await response.clone().json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // ignore parse errors
      }
      const err: any = new Error(errorMessage);
      err.status = response.status;
      if (retryAfterSec !== undefined) err.retryAfterSec = retryAfterSec;
      throw err;
    }

    return response;
  }

  private calculateBackoffDelay(attempt: number): number {
    let delay = Math.min(
      this.backoffConfig.initialDelay * Math.pow(this.backoffConfig.multiplier, attempt - 1),
      this.backoffConfig.maxDelay
    );

    if (this.backoffConfig.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }

    return Math.floor(delay);
  }

  private extractRetryAfter(errorMessage: string): number | null {
    const match = errorMessage.match(/retry-after[:\s]+(\d+)/i);
    return match ? parseInt(match[1]) * 1000 : null; // Convert to milliseconds
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Configuration methods
  setRetryConfig(config: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...config };
  }

  setBackoffConfig(config: Partial<BackoffConfig>): void {
    this.backoffConfig = { ...this.backoffConfig, ...config };
  }
}

export const apiInterceptor = new ApiInterceptor();
export default apiInterceptor;
