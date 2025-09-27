// JizaiバックエンドAPIクライアント
import { apiInterceptor } from './interceptors';
// Use Vite env var when provided; otherwise derive sensible default for dev
const API_BASE_URL = (() => {
  const fromEnv = (import.meta as any)?.env?.VITE_API_BASE_URL;
  // If running under HTTPS and env points to HTTP (non-local), fallback to same-origin to avoid mixed content
  if (fromEnv && typeof fromEnv === 'string') {
    try {
      if (typeof window !== 'undefined') {
        const { protocol, hostname } = window.location;
        const isHttps = protocol === 'https:';
        const isLocal = /^(localhost|127\.0\.0\.1)$/.test(hostname);
        if (isHttps && fromEnv.startsWith('http://') && !isLocal) {
          console.warn('[API] VITE_API_BASE_URL is http on https page; using same-origin to avoid mixed content');
          return `${protocol}//${hostname}`;
        }
      }
    } catch {}
    return fromEnv;
  }
  // Dev fallback: if running on localhost:3001 (vite), target backend 3000
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3000';
    }
    // Same-origin fallback
    return `${protocol}//${hostname}`;
  }
  return 'http://localhost:3000';
})();

export interface UserBalance {
  deviceId: string;
  subscription?: {
    status: string;
    tier?: string;
    expiresAt?: string | null;
  };
  storage?: {
    quota: number;
    used: number;
  };
  // 互換性用（旧UIが参照）
  credits?: number;
  lastAccessAt?: string;
}

export interface EditResponse {
  // レスポンスはPNGバイナリデータ
  blob: Blob;
}

export interface PurchaseResponse {
  success: boolean;
  credits: number;
  added: number;
  deviceId: string;
  productId: string;
  transactionId: string;
}

export interface ReportResponse {
  success: boolean;
  reportId: string;
  message: string;
}

// Vault Subscription System interfaces
export interface SubscriptionTier {
  id: string;
  name: string;
  description: string;
  storageQuota: number;
  maxVaults: number;
  maxFamilyMembers: number;
  features: string[];
  pricing: {
    monthly: number;
    annual: number;
  };
}

export interface SubscriptionStatus {
  subscription: {
    status: 'free' | 'active' | 'trial' | 'cancelled' | 'expired';
    tier: string | null;
    expiresAt: string | null;
    isTrialPeriod: boolean;
    trialEndsAt: string | null;
    autoRenewStatus: boolean;
  };
  storage: {
    quota: number;
    used: number;
    available: number;
    percentage: number;
  };
  features: Record<string, any>;
}

export interface PrintSize {
  key: string;
  name: string;
  nameEn: string;
  dimensions: { width: number; height: number };
  description: string;
  category: string;
}

export interface PrintExportOptions {
  imageUrl: string;
  printSize: string;
  dpi: 300 | 350;
  format: 'jpeg' | 'png';
  quality?: number;
}

export interface PrintExportResponse {
  success: boolean;
  exportId?: string;
  downloadUrl?: string;
  filename?: string;
  fileSize?: number;
  printSize?: PrintSize;
  dpi?: number;
  format?: string;
  expiresAt?: string;
  error?: string;
}

export interface PrintExportHistory {
  id: string;
  memory: {
    id: string;
    title: string;
    memory_type: string;
    created_at: string;
  };
  export_path: string;
  print_size: string;
  dpi: number;
  format: string;
  file_size: number;
  status: string;
  created_at: string;
  expires_at: string;
}

export interface ApiError {
  error: string;
  message: string;
  code: string;
  credits?: number;
}

export interface MemoryItem {
  id: string;
  url: string;
  title: string;
  uploadedAt: string;
  mimeType: string;
  size?: number;
}

export interface MemoryPage {
  items: MemoryItem[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

export interface SavedPrompt {
  id: string;
  prompt_text: string;
  source: 'user' | 'template';
  example_key?: string | null;
  used_in_memory?: string | null;
  created_at: string;
}

export interface PromptPage {
  items: SavedPrompt[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

export interface PopularPrompt {
  key: string;
  example_key?: string | null;
  uses: number;
  last_used: string;
}

export interface PopularPromptPage {
  items: PopularPrompt[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

class JizaiApiClient {
  private deviceId: string;

  constructor() {
    // デバイスIDの生成または取得
    this.deviceId = this.getOrCreateDeviceId();
  }

  private getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem('jizai-device-id');
    if (!deviceId) {
      deviceId = this.generateDeviceId();
      localStorage.setItem('jizai-device-id', deviceId);
    }
    return deviceId;
  }

  private generateDeviceId(): string {
    // RFC4122 v4 UUID
    const bytes = new Uint8Array(16);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
      bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant
      const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0'));
      return `web-${hex.slice(0,4).join('')}-${hex.slice(4,6).join('')}-${hex.slice(6,8).join('')}-${hex.slice(8,10).join('')}-${hex.slice(10,16).join('')}`;
    }
    // Fallback
    return 'web-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json() as ApiError;
      throw new Error(`${error.code}: ${error.message}`);
    }

    // 画像編集APIの場合はバイナリレスポンス
    if (response.headers.get('content-type')?.startsWith('image/')) {
      const blob = await response.blob();
      return { blob } as T;
    }

    return response.json();
  }

  private async request(url: string, options: RequestInit = {}): Promise<Response> {
    // Use interceptor for all requests
    return apiInterceptor.request({
      url,
      method: options.method || 'GET',
      headers: { 'x-device-id': this.deviceId, ...(options.headers as Record<string, string> || {}) },
      body: options.body
    });
  }

  // ヘルスチェック
  async healthCheck(): Promise<{ ok: boolean }> {
    const response = await this.request(`${API_BASE_URL}/v1/health`);
    return this.handleResponse(response);
  }

  // 残高確認
  async getBalance(): Promise<UserBalance> {
    const response = await this.request(`${API_BASE_URL}/v1/balance`);
    const raw = await this.handleResponse<any>(response);
    // 旧UI互換: サブスクに応じたダミー残回数を付与
    const tier = raw.subscription?.tier || 'free';
    const creditsByTier: Record<string, number> = {
      pro: 999,
      standard: 200,
      lite: 50,
      free: 10,
    };
    return {
      deviceId: raw.deviceId || this.deviceId,
      subscription: raw.subscription,
      storage: raw.storage,
      credits: typeof raw.credits === 'number' ? raw.credits : (creditsByTier[tier] ?? 10),
    };
  }

  // 画像編集
  async editImage(
    imageFile: File,
    prompt: string,
    engineProfile?: 'standard' | 'high'
  ): Promise<EditResponse> {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('prompt', prompt);
    if (engineProfile) {
      formData.append('engine_profile', engineProfile);
    } else {
      formData.append('engine_profile', 'standard');
    }

    const response = await this.request(`${API_BASE_URL}/v1/edit`, {
      method: 'POST',
      body: formData,
    });

    return this.handleResponse(response);
  }

  // 画像編集（編集オプションIDからプロンプトを解決）
  async editImageByOption(
    imageFile: File,
    optionId: string,
    engineProfile?: 'standard' | 'high'
  ): Promise<EditResponse> {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('option_id', optionId);
    formData.append('engine_profile', engineProfile || 'standard');

    const response = await this.request(`${API_BASE_URL}/v1/edit-by-option`, {
      method: 'POST',
      body: formData,
    });

    return this.handleResponse(response);
  }

  // 課金処理
  async purchase(productId: string, transactionId: string): Promise<PurchaseResponse> {
    const response = await this.request(`${API_BASE_URL}/v1/purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId,
        transactionId,
      }),
    });

    return this.handleResponse(response);
  }

  // ユーザーの生成物一覧（編集済み画像）
  async listMemories(): Promise<MemoryItem[]> {
    const response = await this.request(`${API_BASE_URL}/v1/memories`);
    const data = await this.handleResponse<{ items: MemoryItem[] }>(response);
    return data.items || [];
  }

  // ページネーション対応の一覧
  async listMemoriesPaged(limit = 24, offset = 0): Promise<MemoryPage> {
    const url = new URL(`${API_BASE_URL}/v1/memories`);
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('offset', String(offset));
    const response = await this.request(url.toString());
    return this.handleResponse<MemoryPage>(response);
  }

  // 保存済みプロンプト一覧
  async listPromptsPaged(params?: { limit?: number; offset?: number; source?: 'user' | 'template' }): Promise<PromptPage> {
    const limit = params?.limit ?? 20;
    const offset = params?.offset ?? 0;
    const source = params?.source;
    const url = new URL(`${API_BASE_URL}/v1/prompts`);
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('offset', String(offset));
    if (source) url.searchParams.set('source', source);
    const res = await this.request(url.toString());
    return this.handleResponse<PromptPage>(res);
  }

  // 人気テンプレートプロンプト
  async listPopularPrompts(limit = 12, offset = 0): Promise<PopularPromptPage> {
    const url = new URL(`${API_BASE_URL}/v1/prompts/popular`);
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('offset', String(offset));
    const res = await this.request(url.toString());
    return this.handleResponse<PopularPromptPage>(res);
  }

  // 画像アップロード（Vaultに直接、JPEG/PNGのみ）
  async uploadMemory(imageFile: File, options?: { title?: string; vaultId?: string; category?: 'clothing' | 'expression' | 'background' | 'pose' | 'convenient' }): Promise<MemoryItem> {
    // Client-side validation for quicker feedback
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(imageFile.type)) {
      throw new Error('UNSUPPORTED_IMAGE_TYPE: Only JPEG or PNG is allowed');
    }

    const formData = new FormData();
    formData.append('image', imageFile);
    if (options?.title) formData.append('title', options.title);
    if (options?.vaultId) formData.append('vaultId', options.vaultId);
    if (options?.category) formData.append('category', options.category);

    const response = await this.request(`${API_BASE_URL}/v1/memories/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await this.handleResponse<{ success: boolean; memory: MemoryItem }>(response);
    if (!data || !(data as any).memory) {
      throw new Error('UPLOAD_FAILED: Missing memory in response');
    }
    return (data as any).memory;
  }

  // 通報
  async report(jobId: string, reasonId: string, note?: string): Promise<ReportResponse> {
    const response = await this.request(`${API_BASE_URL}/v1/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId,
        reasonId,
        note,
      }),
    });

    return this.handleResponse(response);
  }

  // デバイスIDを取得
  getDeviceId(): string {
    return this.deviceId;
  }

  // デバイスIDをリセット（テスト用）
  resetDeviceId(): void {
    localStorage.removeItem('jizai-device-id');
    this.deviceId = this.generateDeviceId();
    localStorage.setItem('jizai-device-id', this.deviceId);
  }

  // ========================================
  // VAULT SUBSCRIPTION SYSTEM APIs
  // ========================================

  // サブスクリプション状況取得
  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    const response = await this.request(`${API_BASE_URL}/v1/subscription/status?deviceId=${this.deviceId}`);
    return this.handleResponse(response);
  }

  // サブスクリプションティア一覧取得
  async getSubscriptionTiers(): Promise<{ tiers: SubscriptionTier[] }> {
    const response = await this.request(`${API_BASE_URL}/v1/subscription/tiers`);
    return this.handleResponse(response);
  }

  // App Storeレシート検証
  async validateReceipt(receiptData: string, originalTransactionId?: string): Promise<{
    success: boolean;
    subscription: any;
    message?: string;
  }> {
    const response = await this.request(`${API_BASE_URL}/v1/subscription/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: this.deviceId,
        receiptData,
        originalTransactionId,
      }),
    });
    return this.handleResponse(response);
  }

  // 試用期間開始
  async startTrial(productId: string): Promise<{
    success: boolean;
    trial: any;
    message?: string;
  }> {
    const response = await this.request(`${API_BASE_URL}/v1/subscription/start-trial`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: this.deviceId,
        productId,
      }),
    });
    return this.handleResponse(response);
  }

  // ストレージ使用量詳細取得
  async getStorageDetails(): Promise<{
    quota: number;
    used: number;
    available: number;
    percentage: number;
    breakdown: {
      byVault: Record<string, any>;
      byType: Record<string, number>;
    };
  }> {
    const response = await this.request(`${API_BASE_URL}/v1/subscription/storage?deviceId=${this.deviceId}`);
    return this.handleResponse(response);
  }

  // ストレージ使用量チェック
  async checkStorageQuota(fileSize: number, vaultId?: string): Promise<{
    canUpload: boolean;
    quotaInfo: {
      quota: number;
      used: number;
      available: number;
      wouldExceed: boolean;
      requiredSpace: number;
    };
  }> {
    const response = await this.request(`${API_BASE_URL}/v1/subscription/storage/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: this.deviceId,
        fileSize,
        vaultId,
      }),
    });
    return this.handleResponse(response);
  }

  // ========================================
  // PRINT EXPORT APIs
  // ========================================

  // 印刷出力生成
  async generatePrintExport(
    memoryId: string, 
    options: PrintExportOptions
  ): Promise<PrintExportResponse> {
    // Basic client-side validation
    const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidV4.test(memoryId)) {
      throw new Error('INVALID_MEMORY_ID: memoryId must be a UUID v4');
    }
    const allowedDpi = [300, 350];
    const allowedFormats = ['jpeg', 'png'];
    if (!allowedDpi.includes(options.dpi)) {
      throw new Error('INVALID_OPTION: Unsupported DPI');
    }
    if (!allowedFormats.includes(options.format)) {
      throw new Error('INVALID_OPTION: Unsupported format');
    }
    const response = await this.request(`${API_BASE_URL}/v1/print-export/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: this.deviceId,
        memoryId,
        exportOptions: options,
      }),
    });
    return this.handleResponse(response);
  }

  // 署名付きダウンロードURLの取得
  async getPrintExportDownloadUrl(exportId: string): Promise<string> {
    const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidV4.test(exportId)) {
      throw new Error('INVALID_EXPORT_ID: exportId must be a UUID v4');
    }
    const response = await this.request(`${API_BASE_URL}/v1/print-export/${exportId}/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId: this.deviceId })
    });
    const data = await this.handleResponse<{ success: boolean; download: { url: string } }>(response);
    if (!data || !(data as any).download?.url) {
      throw new Error('DOWNLOAD_URL_FAILED: Missing download URL');
    }
    return (data as any).download.url;
  }

  // 印刷出力履歴取得
  async getPrintExportHistory(): Promise<PrintExportHistory[]> {
    const response = await this.request(`${API_BASE_URL}/v1/print-export/history?deviceId=${this.deviceId}`);
    const data = await this.handleResponse<{ exports: PrintExportHistory[] }>(response);
    return data.exports;
  }

  // 利用可能な印刷オプション取得
  async getPrintOptions(): Promise<{
    sizes: string[];
    sizeDetails: Record<string, PrintSize>;
    dpiOptions: string[];
    formats: string[];
    maxExportsPerMonth: number;
    currentMonthUsage: number;
  }> {
    const response = await this.request(`${API_BASE_URL}/v1/print-export/options?deviceId=${this.deviceId}`);
    return this.handleResponse(response);
  }

  // メモリ削除（ソフトデリート）
  async deleteMemory(id: string): Promise<boolean> {
    const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidV4.test(id)) throw new Error('INVALID_MEMORY_ID: memory id must be a UUID v4');
    const response = await this.request(`${API_BASE_URL}/v1/memories/${id}`, {
      method: 'DELETE',
    });
    const data = await this.handleResponse<{ success: boolean }>(response);
    return !!data?.success;
  }

  // レシートを用いた購入（クレジット加算）
  async purchaseWithReceipt(receiptData: string, productId?: string): Promise<{ success: boolean; productId: string; creditsAdded: number; creditsRemaining: number }>{
    if (!receiptData || typeof receiptData !== 'string') {
      throw new Error('MISSING_RECEIPT: receiptData is required');
    }
    const res = await this.request(`${API_BASE_URL}/v1/purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiptData, productId }),
    });
    return this.handleResponse(res);
  }
}

// シングルトンインスタンス
export const apiClient = new JizaiApiClient();
export default apiClient;

// 利用可能な製品ID
// 旧UIのPRODUCTSは廃止しました

// 通報理由
export const REPORT_REASONS = {
  copyright: '著作権侵害',
  privacy: 'プライバシー侵害',
  sexual: '性的コンテンツ',
  violence: '暴力的コンテンツ',
  other: 'その他',
} as const;
