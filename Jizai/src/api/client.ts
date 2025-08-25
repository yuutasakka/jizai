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