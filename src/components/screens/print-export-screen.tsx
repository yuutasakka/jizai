/**
 * Print Export Screen - 印刷出力サイズ選択機能
 * 
 * Features:
 * - 5つの印刷サイズ選択（四つ切り、A4、L判、小キャビネ、2L）
 * - 2つのDPI設定（300、350DPI）
 * - サブスクリプション連携
 * - リアルタイムプレビュー
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { JZButton } from '../design-system/jizai-button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { 
  Download, 
  Printer, 
  Info, 
  Crown,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

// 印刷サイズ定義
const PRINT_SIZES = {
  'yotsu-giri': {
    key: 'yotsu-giri',
    name: '四つ切り',
    nameEn: 'Yotsugiri',
    dimensions: { width: 254, height: 305 },
    description: '写真店で人気の標準サイズ',
    category: 'popular',
    tier: 'standard'
  },
  'a4': {
    key: 'a4',
    name: 'A4',
    nameEn: 'A4',
    dimensions: { width: 210, height: 297 },
    description: '一般的な書類サイズ',
    category: 'standard',
    tier: 'lite'
  },
  'l-size': {
    key: 'l-size',
    name: 'L判',
    nameEn: 'L Size',
    dimensions: { width: 89, height: 127 },
    description: 'デジカメプリント標準サイズ',
    category: 'popular',
    tier: 'free'
  },
  'small-cabinet': {
    key: 'small-cabinet',
    name: '小キャビネ',
    nameEn: 'Small Cabinet',
    dimensions: { width: 102, height: 146 },
    description: 'コンパクトなプリントサイズ',
    category: 'standard',
    tier: 'standard'
  },
  '2l': {
    key: '2l',
    name: '2L',
    nameEn: '2L Size',
    dimensions: { width: 127, height: 178 },
    description: 'L判の2倍サイズ',
    category: 'large',
    tier: 'lite'
  }
};

const DPI_OPTIONS = {
  300: { value: 300, name: '300 DPI', description: '標準品質', tier: 'free' },
  350: { value: 350, name: '350 DPI', description: '高品質', tier: 'standard' }
};

interface PrintExportScreenProps {
  imageUrl: string;
  imageName?: string;
  onClose: () => void;
  subscriptionTier?: 'free' | 'lite' | 'standard' | 'pro';
  onUpgrade?: () => void;
}

export default function PrintExportScreen({ 
  imageUrl, 
  imageName = 'memory',
  onClose,
  subscriptionTier = 'free',
  onUpgrade
}: PrintExportScreenProps) {
  const [selectedSize, setSelectedSize] = useState<string>('l-size');
  const [selectedDpi, setSelectedDpi] = useState<number>(300);
  const [exportFormat, setExportFormat] = useState<'jpeg' | 'png'>('jpeg');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportResult, setExportResult] = useState<{
    success: boolean;
    downloadUrl?: string;
    error?: string;
  } | null>(null);

  // サブスクリプションティアごとの利用可能機能
  const getAvailableFeatures = () => {
    const tiers = {
      'free': {
        sizes: ['l-size'],
        dpi: [300],
        formats: ['jpeg'],
        monthlyExports: 2
      },
      'lite': {
        sizes: ['l-size', '2l', 'a4'],
        dpi: [300],
        formats: ['jpeg'],
        monthlyExports: 5
      },
      'standard': {
        sizes: ['l-size', '2l', 'a4', 'small-cabinet', 'yotsu-giri'],
        dpi: [300, 350],
        formats: ['jpeg', 'png'],
        monthlyExports: 20
      },
      'pro': {
        sizes: Object.keys(PRINT_SIZES),
        dpi: [300, 350],
        formats: ['jpeg', 'png'],
        monthlyExports: 100
      }
    };
    return tiers[subscriptionTier] || tiers.free;
  };

  const availableFeatures = getAvailableFeatures();

  // サイズ選択が利用可能かチェック
  const isSizeAvailable = (sizeKey: string) => {
    return availableFeatures.sizes.includes(sizeKey);
  };

  // アップグレード導線
  const handleUpgrade = () => {
    if (typeof onUpgrade === 'function') {
      onUpgrade();
      return;
    }
    // 親が未実装でも、アプリ側で拾いやすいようにカスタムイベントを発火
    window.dispatchEvent(new CustomEvent('jizai:navigate', { detail: { screen: 'purchase' } }));
    // 併せて閉じる
    onClose();
  };

  // DPI選択が利用可能かチェック
  const isDpiAvailable = (dpi: number) => {
    return availableFeatures.dpi.includes(dpi);
  };

  // 印刷出力の実行
  const handleExport = async () => {
    if (isExporting) return;

    setIsExporting(true);
    setExportProgress(0);
    setExportResult(null);

    try {
      // プログレス更新のシミュレーション
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // バックエンドAPIに印刷出力リクエスト
      const response = await fetch('/api/print-export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl,
          printSize: selectedSize,
          dpi: selectedDpi,
          format: exportFormat,
          quality: 95
        }),
      });

      clearInterval(progressInterval);
      setExportProgress(100);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setExportResult({
          success: true,
          downloadUrl: result.downloadUrl
        });
      } else {
        throw new Error(result.message || 'Export failed');
      }

    } catch (error) {
      console.error('Export error:', error);
      setExportResult({
        success: false,
        error: error instanceof Error ? error.message : 'Export failed'
      });
    } finally {
      setIsExporting(false);
    }
  };

  // プレビュー用のアスペクト比計算
  const getPreviewAspectRatio = (sizeKey: string) => {
    const size = PRINT_SIZES[sizeKey as keyof typeof PRINT_SIZES];
    if (!size) return '4/3';
    return `${size.dimensions.width}/${size.dimensions.height}`;
  };

  // ファイルサイズ概算
  const getEstimatedFileSize = () => {
    const size = PRINT_SIZES[selectedSize as keyof typeof PRINT_SIZES];
    if (!size) return '0 MB';
    
    const pixels = Math.round((size.dimensions.width * selectedDpi / 25.4) * 
                             (size.dimensions.height * selectedDpi / 25.4));
    const bytesPerPixel = exportFormat === 'jpeg' ? 3 : 4;
    const estimatedBytes = pixels * bytesPerPixel;
    const mb = estimatedBytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-[color:var(--color-jz-card)] text-[color:var(--color-jz-text-primary)] border border-[color:var(--color-jz-border)] rounded-[var(--radius-jz-card)] max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="p-6 border-b border-[color:var(--color-jz-border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Printer className="w-6 h-6 text-[color:var(--color-jz-text-secondary)]" />
              <div>
                <h2 className="jz-font-display jz-text-display-small">印刷出力設定</h2>
                <p className="jz-text-caption text-[color:var(--color-jz-text-secondary)]">{imageName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-1 rounded-[8px] border border-[color:var(--color-jz-border)] text-[color:var(--color-jz-text-secondary)] jz-text-caption">
                {subscriptionTier.toUpperCase()}
              </span>
              <JZButton tone="tertiary" size="sm" onClick={onClose} className="text-[color:var(--color-jz-text-secondary)] hover:text-[color:var(--color-jz-text-primary)]">
                ✕
              </JZButton>
            </div>
          </div>
        </div>

        <div className="flex max-h-[calc(90vh-120px)]">
          {/* 設定パネル */}
          <div className="w-1/2 p-6 border-r border-gray-200 overflow-y-auto">
            <Tabs defaultValue="size" className="space-y-4">
              <TabsList>
                <TabsTrigger value="size">サイズ</TabsTrigger>
                <TabsTrigger value="quality">品質</TabsTrigger>
              </TabsList>

              {/* サイズ選択 */}
              <TabsContent value="size" className="space-y-4">
                <div>
              <h3 className="text-sm font-medium text-[color:var(--color-jz-text-primary)] mb-3">印刷サイズ</h3>
                  <div className="space-y-2">
                    {Object.values(PRINT_SIZES).map((size) => (
                      <div
                        key={size.key}
                        className={`relative p-3 border rounded-lg cursor-pointer transition-all ${
                          selectedSize === size.key
                            ? 'border-[color:var(--color-jz-accent)]/60 bg-[color:var(--color-jz-accent)]/10'
                            : isSizeAvailable(size.key)
                            ? 'border-[color:var(--color-jz-border)] hover:border-[color:var(--color-jz-accent)]/30'
                            : 'border-[color:var(--color-jz-border)]/60 bg-[color:var(--color-jz-border)]/20 cursor-not-allowed opacity-60'
                        }`}
                        onClick={() => {
                          if (isSizeAvailable(size.key)) {
                            setSelectedSize(size.key);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-[color:var(--color-jz-text-primary)]">
                                {size.name}
                              </span>
                              <span className="text-sm text-[color:var(--color-jz-text-secondary)]">
                                ({size.nameEn})
                              </span>
                              {!isSizeAvailable(size.key) && (
                                <Crown className="w-4 h-4 text-[color:var(--color-jz-warning)]" />
                              )}
                            </div>
                            <p className="text-xs text-[color:var(--color-jz-text-secondary)] mt-1">
                              {size.dimensions.width}×{size.dimensions.height}mm
                            </p>
                            <p className="text-xs text-[color:var(--color-jz-text-tertiary)]">
                              {size.description}
                            </p>
                          </div>
                          {selectedSize === size.key && (
                            <CheckCircle className="w-5 h-5 text-[color:var(--color-jz-accent)]" />
                          )}
                        </div>
                        
                        {!isSizeAvailable(size.key) && (
                          <div className="absolute inset-0 bg-black/40 rounded-lg flex flex-col items-center justify-center gap-2 p-3 text-center">
                            <span className="px-2 py-1 rounded-[8px] bg-[color:var(--color-jz-warning)] text-white jz-text-caption">
                              {subscriptionTier === 'free' ? 'Pro版で利用可能' : 'アップグレードが必要'}
                            </span>
                            <JZButton tone="primary" size="sm" onClick={handleUpgrade} aria-label="アップグレード">
                              アップグレード
                            </JZButton>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* 品質設定 */}
              <TabsContent value="quality" className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-[color:var(--color-jz-text-primary)] mb-3">印刷品質 (DPI)</h3>
                  <div className="space-y-2">
                    {Object.values(DPI_OPTIONS).map((dpi) => (
                      <div
                        key={dpi.value}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          selectedDpi === dpi.value
                            ? 'border-[color:var(--color-jz-accent)]/60 bg-[color:var(--color-jz-accent)]/10'
                            : isDpiAvailable(dpi.value)
                            ? 'border-[color:var(--color-jz-border)] hover:border-[color:var(--color-jz-accent)]/30'
                            : 'border-[color:var(--color-jz-border)]/60 bg-[color:var(--color-jz-border)]/20 cursor-not-allowed opacity-60'
                        }`}
                        onClick={() => {
                          if (isDpiAvailable(dpi.value)) {
                            setSelectedDpi(dpi.value);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-[color:var(--color-jz-text-primary)]">
                                {dpi.name}
                              </span>
                              {!isDpiAvailable(dpi.value) && (
                                <Crown className="w-4 h-4 text-[color:var(--color-jz-warning)]" />
                              )}
                            </div>
                            <p className="text-xs text-[color:var(--color-jz-text-secondary)] mt-1">
                              {dpi.description}
                            </p>
                          </div>
                          {selectedDpi === dpi.value && (
                            <CheckCircle className="w-5 h-5 text-[color:var(--color-jz-accent)]" />
                          )}
                        </div>
                        {!isDpiAvailable(dpi.value) && (
                          <div className="mt-2 text-center">
                            <JZButton tone="primary" size="sm" onClick={handleUpgrade} aria-label="アップグレード">
                              アップグレード
                            </JZButton>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-[color:var(--color-jz-text-primary)] mb-3">出力形式</h3>
                  <div className="space-y-2">
                    {availableFeatures.formats.map((format) => (
                      <div
                        key={format}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          exportFormat === format
                            ? 'border-[color:var(--color-jz-accent)]/60 bg-[color:var(--color-jz-accent)]/10'
                            : 'border-[color:var(--color-jz-border)] hover:border-[color:var(--color-jz-accent)]/30'
                        }`}
                        onClick={() => setExportFormat(format as 'jpeg' | 'png')}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-[color:var(--color-jz-text-primary)]">
                              {format.toUpperCase()}
                            </span>
                            <p className="text-xs text-[color:var(--color-jz-text-secondary)] mt-1">
                              {format === 'jpeg' ? '標準的な写真形式' : '高品質・透明対応'}
                            </p>
                          </div>
                          {exportFormat === format && (
                            <CheckCircle className="w-5 h-5 text-[color:var(--color-jz-accent)]" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* 利用制限情報 */}
            <Alert className="mt-4 bg-[color:var(--color-jz-border)]/20 border border-[color:var(--color-jz-border)] text-[color:var(--color-jz-text-secondary)]">
              <Info className="h-4 w-4" />
              <AlertDescription>
                {subscriptionTier === 'free' 
                  ? `無料版: 月${availableFeatures.monthlyExports}回まで出力可能`
                  : `${subscriptionTier.toUpperCase()}版: 月${availableFeatures.monthlyExports}回まで出力可能`
                }
              </AlertDescription>
            </Alert>
          </div>

          {/* プレビューパネル */}
          <div className="w-1/2 p-6 overflow-y-auto">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-[color:var(--color-jz-text-primary)]">プレビュー</h3>
              
              {/* 画像プレビュー */}
              <Card className="p-4 bg-[color:var(--color-jz-card)] border border-[color:var(--color-jz-border)]">
                <div 
                  className="w-full bg-[color:var(--color-jz-border)]/30 rounded-lg overflow-hidden"
                  style={{ aspectRatio: getPreviewAspectRatio(selectedSize) }}
                >
                  <img
                    src={imageUrl}
                    alt="印刷プレビュー"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="mt-3 text-center">
                  <p className="text-sm font-medium text-gray-900">
                    {PRINT_SIZES[selectedSize as keyof typeof PRINT_SIZES]?.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {PRINT_SIZES[selectedSize as keyof typeof PRINT_SIZES]?.dimensions.width} × {PRINT_SIZES[selectedSize as keyof typeof PRINT_SIZES]?.dimensions.height}mm
                  </p>
                </div>
              </Card>

              {/* 出力情報 */}
              <Card className="p-4 bg-[color:var(--color-jz-card)] border border-[color:var(--color-jz-border)]">
                <h4 className="text-sm font-medium text-[color:var(--color-jz-text-primary)] mb-3">出力情報</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[color:var(--color-jz-text-secondary)]">解像度:</span>
                    <span className="text-[color:var(--color-jz-text-primary)]">{selectedDpi} DPI</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[color:var(--color-jz-text-secondary)]">形式:</span>
                    <span className="text-[color:var(--color-jz-text-primary)]">{exportFormat.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[color:var(--color-jz-text-secondary)]">推定ファイルサイズ:</span>
                    <span className="text-[color:var(--color-jz-text-primary)]">{getEstimatedFileSize()}</span>
                  </div>
                </div>
              </Card>

              {/* 進行状況 */}
              {isExporting && (
                <Card className="p-4 bg-[color:var(--color-jz-card)] border border-[color:var(--color-jz-border)]">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[color:var(--color-jz-text-primary)]">出力中...</span>
                      <span className="text-sm text-[color:var(--color-jz-text-secondary)]">{exportProgress}%</span>
                    </div>
                    <Progress value={exportProgress} className="w-full" />
                    <div role="status" aria-live="polite" className="sr-only">
                      出力進行状況 {exportProgress}パーセント
                    </div>
                  </div>
                </Card>
              )}

              {/* 結果表示 */}
              {exportResult && (
                <Card className="p-4 bg-[color:var(--color-jz-card)] border border-[color:var(--color-jz-border)]">
                  {exportResult.success ? (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-[color:var(--color-jz-success)]">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">出力完了</span>
                      </div>
                      <JZButton 
                        tone="primary"
                        fullWidth
                        onClick={() => {
                          if (exportResult.downloadUrl) {
                            window.open(exportResult.downloadUrl, '_blank', 'noopener,noreferrer');
                          }
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        ダウンロード
                      </JZButton>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-[color:var(--color-jz-destructive)]">
                        <AlertCircle className="w-5 h-5" />
                        <span className="font-medium">出力失敗</span>
                      </div>
                      <p className="text-sm text-[color:var(--color-jz-text-secondary)]" role="alert">{exportResult.error}</p>
                      <JZButton 
                        tone="secondary" 
                        fullWidth 
                        onClick={() => setExportResult(null)}
                      >
                        再試行
                      </JZButton>
                    </div>
                  )}
                </Card>
              )}

              {/* 出力フッター（固定） */}
              {!exportResult && (
                <div className="sticky bottom-0 pt-4 bg-[color:var(--color-jz-card)]">
                  <div className="flex gap-3 justify-end">
                    <JZButton
                      tone="tertiary"
                      size="md"
                      onClick={onClose}
                      aria-label="閉じる"
                    >
                      閉じる
                    </JZButton>
                    <JZButton
                      tone="primary"
                      size="lg"
                      onClick={handleExport}
                      state={isExporting ? 'loading' : 'default'}
                      aria-label={isExporting ? '出力中' : '印刷用に出力'}
                    >
                      {isExporting ? '出力中...' : (
                        <span className="flex items-center gap-2">
                          <Printer className="w-4 h-4" />
                          印刷用に出力
                        </span>
                      )}
                    </JZButton>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
