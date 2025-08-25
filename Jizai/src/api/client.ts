// JizaiバックエンドAPIクライアント
const API_BASE_URL = 'http://localhost:3000';

export interface User {
  credits: number;
  deviceId: string;
  lastAccessAt: string;
}

export interface EditResponse {
  // レスポンスはPNGバイナリデータ
  blob: Blob;
  creditsRemaining: number;
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
      const creditsRemaining = parseInt(response.headers.get('X-Credits-Remaining') || '0');
      return { blob, creditsRemaining } as T;
    }

    return response.json();
  }

  // ヘルスチェック
  async healthCheck(): Promise<{ ok: boolean }> {
    const response = await fetch(`${API_BASE_URL}/v1/health`);
    return this.handleResponse(response);
  }

  // 残高確認
  async getBalance(): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/v1/balance?deviceId=${this.deviceId}`);
    return this.handleResponse(response);
  }

  // 画像編集
  async editImage(imageFile: File, prompt: string): Promise<EditResponse> {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('prompt', prompt);

    const response = await fetch(`${API_BASE_URL}/v1/edit`, {
      method: 'POST',
      headers: {
        'x-device-id': this.deviceId,
      },
      body: formData,
    });

    return this.handleResponse(response);
  }

  // 課金処理
  async purchase(productId: string, transactionId: string): Promise<PurchaseResponse> {
    const response = await fetch(`${API_BASE_URL}/v1/purchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deviceId: this.deviceId,
        productId,
        transactionId,
      }),
    });

    return this.handleResponse(response);
  }

  // 通報
  async report(jobId: string, reasonId: string, note?: string): Promise<ReportResponse> {
    const response = await fetch(`${API_BASE_URL}/v1/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deviceId: this.deviceId,
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
    const response = await fetch(`${API_BASE_URL}/v1/subscription/status?deviceId=${this.deviceId}`);
    return this.handleResponse(response);
  }

  // サブスクリプションティア一覧取得
  async getSubscriptionTiers(): Promise<{ tiers: SubscriptionTier[] }> {
    const response = await fetch(`${API_BASE_URL}/v1/subscription/tiers`);
    return this.handleResponse(response);
  }

  // App Storeレシート検証
  async validateReceipt(receiptData: string, originalTransactionId?: string): Promise<{
    success: boolean;
    subscription: any;
    message?: string;
  }> {
    const response = await fetch(`${API_BASE_URL}/v1/subscription/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
    const response = await fetch(`${API_BASE_URL}/v1/subscription/start-trial`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
    const response = await fetch(`${API_BASE_URL}/v1/subscription/storage?deviceId=${this.deviceId}`);
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
    const response = await fetch(`${API_BASE_URL}/v1/subscription/storage/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
    const response = await fetch(`${API_BASE_URL}/v1/print-export/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deviceId: this.deviceId,
        memoryId,
        exportOptions: options,
      }),
    });
    return this.handleResponse(response);
  }

  // 印刷出力履歴取得
  async getPrintExportHistory(): Promise<PrintExportHistory[]> {
    const response = await fetch(
      `${API_BASE_URL}/v1/print-export/history?deviceId=${this.deviceId}`
    );
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
    const response = await fetch(
      `${API_BASE_URL}/v1/print-export/options?deviceId=${this.deviceId}`
    );
    return this.handleResponse(response);
  }
}

// シングルトンインスタンス
export const apiClient = new JizaiApiClient();

// 利用可能な製品ID
export const PRODUCTS = {
  credits_10: { id: 'credits_10', credits: 10, price: '120円' },
  credits_50: { id: 'credits_50', credits: 50, price: '480円' },
  credits_100: { id: 'credits_100', credits: 100, price: '840円' },
  credits_500: { id: 'credits_500', credits: 500, price: '3600円' },
} as const;

// 通報理由
export const REPORT_REASONS = {
  copyright: '著作権侵害',
  privacy: 'プライバシー侵害',
  sexual: '性的コンテンツ',
  violence: '暴力的コンテンツ',
  other: 'その他',
} as const;