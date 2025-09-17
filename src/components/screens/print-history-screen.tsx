/**
 * Print History Screen - 印刷出力履歴表示
 * 
 * Features:
 * - 印刷出力履歴一覧
 * - ダウンロードリンク
 * - 期限切れ表示
 * - サイズ・DPI・形式の表示
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Download, 
  FileImage, 
  Calendar, 
  Settings, 
  Clock,
  AlertCircle,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { apiClient, PrintExportHistory } from '../../api/client';

interface PrintHistoryScreenProps {
  onClose: () => void;
}

export default function PrintHistoryScreen({ onClose }: PrintHistoryScreenProps) {
  const [exports, setExports] = useState<PrintExportHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 印刷履歴を読み込み
  const loadPrintHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const history = await apiClient.getPrintExportHistory();
      setExports(history);
    } catch (error) {
      console.error('Failed to load print history:', error);
      setError(error instanceof Error ? error.message : 'Failed to load print history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrintHistory();
  }, []);

  // ダウンロード処理
  const handleDownload = async (exportItem: PrintExportHistory) => {
    try {
      // バックエンドから署名付きURLを取得してダウンロード
      const url = await apiClient.getPrintExportDownloadUrl(exportItem.id);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      console.error('Download failed:', e);
      setError(e instanceof Error ? e.message : 'ダウンロードURLの取得に失敗しました');
    }
  };

  // 期限切れチェック
  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  // ファイルサイズのフォーマット
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // 日付フォーマット
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 印刷サイズの日本語名
  const getPrintSizeName = (sizeKey: string) => {
    const sizeNames: Record<string, string> = {
      'yotsu-giri': '四つ切り',
      'a4': 'A4',
      'l-size': 'L判',
      'small-cabinet': '小キャビネ',
      '2l': '2L'
    };
    return sizeNames[sizeKey] || sizeKey;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileImage className="w-6 h-6 text-gray-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">印刷出力履歴</h2>
                <p className="text-sm text-gray-500">過去の印刷出力とダウンロード</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={loadPrintHistory}>
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                ✕
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-2 text-gray-500">
                <Settings className="w-5 h-5 animate-spin" />
                <span>読み込み中...</span>
              </div>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : exports.length === 0 ? (
            <div className="text-center py-12">
              <FileImage className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">印刷履歴がありません</h3>
              <p className="text-gray-500">画像を印刷出力すると、ここに履歴が表示されます。</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 統計情報 */}
              <Card className="p-4 bg-blue-50 border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-blue-900">
                      今月の印刷出力: {exports.length}回
                    </h3>
                    <p className="text-xs text-blue-700">
                      総ファイルサイズ: {formatFileSize(exports.reduce((sum, exp) => sum + exp.file_size, 0))}
                    </p>
                  </div>
                  <FileImage className="w-8 h-8 text-blue-600" />
                </div>
              </Card>

              {/* 履歴一覧 */}
              <div className="grid gap-4">
                {exports.map((exportItem) => (
                  <Card key={exportItem.id} className="p-4">
                    <div className="flex items-start space-x-4">
                      {/* サムネイル代替アイコン */}
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                        <FileImage className="w-8 h-8 text-gray-400" />
                      </div>

                      {/* 詳細情報 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {exportItem.memory.title || 'Untitled'}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                              <Calendar className="w-3 h-3 inline mr-1" />
                              {formatDate(exportItem.created_at)}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <Badge 
                              variant={exportItem.status === 'completed' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {exportItem.status === 'completed' ? '完了' : '処理中'}
                            </Badge>
                            {isExpired(exportItem.expires_at) && (
                              <Badge variant="destructive" className="text-xs">
                                <Clock className="w-3 h-3 mr-1" />
                                期限切れ
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* 印刷設定情報 */}
                        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                          <div>
                            <span className="text-gray-500">サイズ:</span>
                            <div className="font-medium text-gray-900">
                              {getPrintSizeName(exportItem.print_size)}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">解像度:</span>
                            <div className="font-medium text-gray-900">
                              {exportItem.dpi} DPI
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">形式:</span>
                            <div className="font-medium text-gray-900">
                              {exportItem.format.toUpperCase()}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">サイズ:</span>
                            <div className="font-medium text-gray-900">
                              {formatFileSize(exportItem.file_size)}
                            </div>
                          </div>
                        </div>

                        {/* 期限表示 */}
                        <div className="mt-2 text-xs">
                          <span className="text-gray-500">ダウンロード期限: </span>
                          <span className={isExpired(exportItem.expires_at) ? 'text-red-600' : 'text-gray-900'}>
                            {formatDate(exportItem.expires_at)}
                          </span>
                        </div>
                      </div>

                      {/* アクションボタン */}
                      <div className="flex flex-col space-y-2">
                        <Button
                          size="sm"
                          variant={isExpired(exportItem.expires_at) ? 'outline' : 'default'}
                          onClick={() => handleDownload(exportItem)}
                          disabled={isExpired(exportItem.expires_at)}
                          className="text-xs"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          {isExpired(exportItem.expires_at) ? '期限切れ' : 'ダウンロード'}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* 注意事項 */}
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  印刷出力ファイルは生成から7日間ダウンロード可能です。
                  期限を過ぎたファイルは自動的に削除されます。
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
