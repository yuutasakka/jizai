import { useState, useRef, DragEvent } from 'react';
import { SupabaseImageStorage, IMAGE_FOLDERS } from '../../lib/supabase-storage';
import apiClient from '../../api/client';

interface ImageUploaderProps {
  onUploadComplete: (imageUrl: string, imagePath: string) => void;
  onUploadError?: (error: string) => void;
  folder?: keyof typeof IMAGE_FOLDERS;
  className?: string;
  accept?: string;
  maxSize?: number; // in MB
  children?: React.ReactNode;
  // Use backend API (/v1/memories/upload) instead of direct Supabase
  useBackend?: boolean;
}

export function ImageUploader({
  onUploadComplete,
  onUploadError,
  folder = 'GENERAL',
  className = '',
  accept = 'image/*',
  maxSize = 10,
  children,
  useBackend = true,
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    // Validate file
    const validation = SupabaseImageStorage.validateImageFile(file);
    if (!validation.valid) {
      onUploadError?.(validation.error || '無効なファイルです');
      return;
    }

    // Check custom max size
    if (file.size > maxSize * 1024 * 1024) {
      onUploadError?.(` ファイルサイズが大きすぎます（最大${maxSize}MB）`);
      return;
    }

    setIsUploading(true);

    try {
      if (useBackend) {
        // Upload via secured backend (JPEG/PNG only)
        const memory = await apiClient.uploadMemory(file);
        if (memory?.url) {
          // Keep callback signature; pass memory.id as second arg
          onUploadComplete(memory.url, memory.id);
          // Notify other views to refresh gallery
          try {
            window.dispatchEvent(new CustomEvent('jizai:memories:updated'));
          } catch {}
        } else {
          onUploadError?.('アップロードに失敗しました');
        }
      } else {
        // Fallback: direct Supabase upload (legacy)
        const result = await SupabaseImageStorage.uploadImage(file, IMAGE_FOLDERS[folder]);
        if (result) {
          onUploadComplete(result.url, result.path);
        } else {
          onUploadError?.('アップロードに失敗しました');
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      onUploadError?.('アップロード中にエラーが発生しました');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />
      
      {children ? (
        <div onClick={openFileDialog} className="cursor-pointer">
          {children}
        </div>
      ) : (
        <div
          onClick={openFileDialog}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer
            transition-all duration-200
            ${isDragOver 
              ? 'border-white bg-gray-800 scale-105' 
              : 'border-gray-600 hover:border-gray-500 hover:bg-gray-900'
            }
            ${isUploading ? 'pointer-events-none opacity-50' : ''}
          `}
        >
          {isUploading ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <p className="text-white">アップロード中...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" />
              </svg>
              <div>
                <p className="text-white font-medium">画像をアップロード</p>
                <p className="text-gray-400 text-sm mt-1">
                  クリックまたはドラッグ＆ドロップ
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  JPEG, PNG, WebP, GIF（最大{maxSize}MB）
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
