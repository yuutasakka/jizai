import { useState } from 'react';
import { ImageUploader } from './ImageUploader';
import { SupabaseImage, SupabaseImageGallery } from './SupabaseImage';
import { IMAGE_FOLDERS } from '../../lib/supabase-storage';

// Example usage of Supabase image upload and display components
export function ImageUploadExample() {
  const [uploadedImages, setUploadedImages] = useState<Array<{
    path: string;
    url: string;
    alt: string;
    caption?: string;
  }>>([]);
  const [uploadError, setUploadError] = useState<string>('');

  const handleUploadComplete = (url: string, path: string) => {
    const newImage = {
      path,
      url,
      alt: `アップロード画像 ${uploadedImages.length + 1}`,
      caption: `アップロード日時: ${new Date().toLocaleString('ja-JP')}`
    };
    
    setUploadedImages(prev => [...prev, newImage]);
    setUploadError('');
    console.log('画像アップロード完了:', { url, path });
  };

  const handleUploadError = (error: string) => {
    setUploadError(error);
    console.error('画像アップロードエラー:', error);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-black text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-light mb-2">画像アップロード デモ</h1>
        <p className="text-gray-400">
          Supabase Storageを使用した画像アップロードと表示の例
        </p>
      </div>

      {/* Upload Section */}
      <div className="mb-8">
        <h2 className="text-xl font-medium mb-4">画像をアップロード</h2>
        
        <ImageUploader
          onUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
          folder="GALLERY"
          className="mb-4"
          maxSize={5} // 5MB制限
        />

        {uploadError && (
          <div className="bg-red-900 border border-red-600 text-red-100 px-4 py-3 rounded">
            ❌ {uploadError}
          </div>
        )}
      </div>

      {/* Single Image Display Example */}
      {uploadedImages.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-medium mb-4">最新アップロード画像</h2>
          <div className="bg-gray-900 rounded-lg p-4">
            <SupabaseImage
              path={uploadedImages[uploadedImages.length - 1].path}
              alt={uploadedImages[uploadedImages.length - 1].alt}
              className="w-full max-w-md h-64 object-cover rounded-lg"
              width={400}
              height={256}
              quality={90}
              format="webp"
            />
            <p className="text-gray-400 text-sm mt-2">
              {uploadedImages[uploadedImages.length - 1].caption}
            </p>
          </div>
        </div>
      )}

      {/* Gallery Display Example */}
      {uploadedImages.length > 1 && (
        <div className="mb-8">
          <h2 className="text-xl font-medium mb-4">
            アップロード済み画像ギャラリー ({uploadedImages.length}枚)
          </h2>
          <SupabaseImageGallery
            images={uploadedImages}
            className="rounded-lg overflow-hidden"
            imageClassName="hover:opacity-75 transition-opacity"
            columns={3}
            gap={4}
          />
        </div>
      )}

      {/* Usage Code Example */}
      <div className="mb-8">
        <h2 className="text-xl font-medium mb-4">コード例</h2>
        <div className="bg-gray-900 rounded-lg p-4 text-sm">
          <h3 className="text-green-400 mb-2">画像アップロード:</h3>
          <pre className="text-gray-300 mb-4 overflow-x-auto">
{`import { ImageUploader } from './components/image/ImageUploader';

<ImageUploader
  onUploadComplete={(url, path) => {
    console.log('アップロード完了:', { url, path });
  }}
  onUploadError={(error) => {
    console.error('エラー:', error);
  }}
  folder="GALLERY"
  maxSize={5}
/>`}
          </pre>

          <h3 className="text-green-400 mb-2">画像表示:</h3>
          <pre className="text-gray-300 mb-4 overflow-x-auto">
{`import { SupabaseImage } from './components/image/SupabaseImage';

<SupabaseImage
  path="gallery/123456_abc.jpg"
  alt="画像の説明"
  className="w-full h-64 object-cover"
  width={400}
  height={256}
  quality={90}
  format="webp"
/>`}
          </pre>

          <h3 className="text-green-400 mb-2">ギャラリー表示:</h3>
          <pre className="text-gray-300 overflow-x-auto">
{`import { SupabaseImageGallery } from './components/image/SupabaseImage';

<SupabaseImageGallery
  images={[
    { path: "gallery/img1.jpg", alt: "画像1" },
    { path: "gallery/img2.jpg", alt: "画像2" }
  ]}
  columns={3}
  gap={4}
/>`}
          </pre>
        </div>
      </div>

      {/* Feature List */}
      <div className="bg-gray-900 rounded-lg p-6">
        <h2 className="text-xl font-medium mb-4">実装済み機能</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-green-400 font-medium mb-2">アップロード機能:</h3>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>✅ ドラッグ&ドロップ対応</li>
              <li>✅ ファイル形式検証</li>
              <li>✅ ファイルサイズ制限</li>
              <li>✅ 自動ファイル名生成</li>
              <li>✅ フォルダ分類機能</li>
              <li>✅ エラーハンドリング</li>
            </ul>
          </div>
          <div>
            <h3 className="text-green-400 font-medium mb-2">表示機能:</h3>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>✅ 自動URLパス解決</li>
              <li>✅ 画像最適化（WebP対応）</li>
              <li>✅ レスポンシブ対応</li>
              <li>✅ フォールバック画像</li>
              <li>✅ ローディング表示</li>
              <li>✅ ギャラリー機能</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}