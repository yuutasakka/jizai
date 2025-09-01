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
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { 
  Download, 
  Printer, 
  Settings, 
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
}

export default function PrintExportScreen({ 
  imageUrl, 
  imageName = 'memory',
  onClose,
  subscriptionTier = 'free'
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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Printer className="w-6 h-6 text-gray-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">印刷出力設定</h2>
                <p className="text-sm text-gray-500">{imageName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={subscriptionTier === 'free' ? 'secondary' : 'default'}>
                {subscriptionTier.toUpperCase()}
              </Badge>
              <Button variant="ghost" size="sm" onClick={onClose}>
                ✕
              </Button>
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
                  <h3 className="text-sm font-medium text-gray-900 mb-3">印刷サイズ</h3>
                  <div className="space-y-2">
                    {Object.values(PRINT_SIZES).map((size) => (
                      <div
                        key={size.key}
                        className={`relative p-3 border rounded-lg cursor-pointer transition-all ${
                          selectedSize === size.key
                            ? 'border-blue-500 bg-blue-50'
                            : isSizeAvailable(size.key)
                            ? 'border-gray-200 hover:border-gray-300'
                            : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
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
                              <span className="font-medium text-gray-900">
                                {size.name}
                              </span>
                              <span className="text-sm text-gray-500">
                                ({size.nameEn})
                              </span>
                              {!isSizeAvailable(size.key) && (
                                <Crown className="w-4 h-4 text-yellow-500" />
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {size.dimensions.width}×{size.dimensions.height}mm
                            </p>
                            <p className="text-xs text-gray-400">
                              {size.description}
                            </p>
                          </div>
                          {selectedSize === size.key && (
                            <CheckCircle className="w-5 h-5 text-blue-500" />
                          )}
                        </div>
                        
                        {!isSizeAvailable(size.key) && (
                          <div className="absolute inset-0 bg-gray-50 bg-opacity-75 rounded-lg flex items-center justify-center">
                            <Badge variant="secondary" className="text-xs">
                              {subscriptionTier === 'free' ? 'Pro版で利用可能' : 'アップグレードが必要'}
                            </Badge>
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
                  <h3 className="text-sm font-medium text-gray-900 mb-3">印刷品質 (DPI)</h3>
                  <div className="space-y-2">
                    {Object.values(DPI_OPTIONS).map((dpi) => (
                      <div
                        key={dpi.value}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          selectedDpi === dpi.value
                            ? 'border-blue-500 bg-blue-50'
                            : isDpiAvailable(dpi.value)
                            ? 'border-gray-200 hover:border-gray-300'
                            : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
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
                              <span className="font-medium text-gray-900">
                                {dpi.name}
                              </span>
                              {!isDpiAvailable(dpi.value) && (
                                <Crown className="w-4 h-4 text-yellow-500" />
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {dpi.description}
                            </p>
                          </div>
                          {selectedDpi === dpi.value && (
                            <CheckCircle className="w-5 h-5 text-blue-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">出力形式</h3>
                  <div className="space-y-2">
                    {availableFeatures.formats.map((format) => (
                      <div
                        key={format}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          exportFormat === format
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setExportFormat(format as 'jpeg' | 'png')}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-gray-900">
                              {format.toUpperCase()}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">
                              {format === 'jpeg' ? '標準的な写真形式' : '高品質・透明対応'}
                            </p>
                          </div>
                          {exportFormat === format && (
                            <CheckCircle className="w-5 h-5 text-blue-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* 利用制限情報 */}
            <Alert className="mt-4">
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
              <h3 className="text-lg font-medium text-gray-900">プレビュー</h3>
              
              {/* 画像プレビュー */}
              <Card className="p-4">
                <div 
                  className="w-full bg-gray-100 rounded-lg overflow-hidden"
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
              <Card className="p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">出力情報</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">解像度:</span>
                    <span className="text-gray-900">{selectedDpi} DPI</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">形式:</span>
                    <span className="text-gray-900">{exportFormat.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">推定ファイルサイズ:</span>
                    <span className="text-gray-900">{getEstimatedFileSize()}</span>
                  </div>
                </div>
              </Card>

              {/* 進行状況 */}
              {isExporting && (
                <Card className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">出力中...</span>
                      <span className="text-sm text-gray-500">{exportProgress}%</span>
                    </div>
                    <Progress value={exportProgress} className="w-full" />
                  </div>
                </Card>
              )}

              {/* 結果表示 */}
              {exportResult && (
                <Card className="p-4">
                  {exportResult.success ? (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">出力完了</span>
                      </div>
                      <Button 
                        className="w-full"
                        onClick={() => {
                          if (exportResult.downloadUrl) {
                            window.open(exportResult.downloadUrl, '_blank');
                          }
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        ダウンロード
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-red-600">
                        <AlertCircle className="w-5 h-5" />
                        <span className="font-medium">出力失敗</span>
                      </div>
                      <p className="text-sm text-red-600">{exportResult.error}</p>
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={() => setExportResult(null)}
                      >
                        再試行
                      </Button>
                    </div>
                  )}
                </Card>
              )}

              {/* 出力ボタン */}
              {!exportResult && (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleExport}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <>
                      <Settings className="w-4 h-4 mr-2 animate-spin" />
                      出力中...
                    </>
                  ) : (
                    <>
                      <Printer className="w-4 h-4 mr-2" />
                      印刷用に出力
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}