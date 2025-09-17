import { useState, useEffect } from 'react';
import { SupabaseImageStorage, getOptimizedImageUrl, FALLBACK_IMAGES } from '../../lib/supabase-storage';

interface SupabaseImageProps {
  path: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpg' | 'png';
  fallback?: string;
  onLoad?: () => void;
  onError?: () => void;
  loading?: 'lazy' | 'eager';
}

export function SupabaseImage({
  path,
  alt,
  className = '',
  style,
  width,
  height,
  quality = 80,
  format,
  fallback = FALLBACK_IMAGES.NO_IMAGE,
  onLoad,
  onError,
  loading = 'lazy',
  ...props
}: SupabaseImageProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!path) {
      setImageUrl(fallback);
      setIsLoading(false);
      return;
    }

    // Get optimized image URL
    const optimizedUrl = getOptimizedImageUrl(path, {
      width,
      height,
      quality,
      format
    });

    setImageUrl(optimizedUrl);
  }, [path, width, height, quality, format, fallback]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    setImageUrl(fallback);
    onError?.();
  };

  return (
    <div className={`relative ${className}`} style={style}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded">
          <div className="w-6 h-6 border-2 border-gray-600 border-t-white rounded-full animate-spin"></div>
        </div>
      )}
      
      <img
        src={imageUrl}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        style={style}
        onLoad={handleLoad}
        onError={handleError}
        loading={loading}
        {...props}
      />

      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded text-gray-400 text-sm">
          画像を読み込めません
        </div>
      )}
    </div>
  );
}

// Gallery component for multiple images
interface SupabaseImageGalleryProps {
  images: Array<{
    path: string;
    alt: string;
    caption?: string;
  }>;
  className?: string;
  imageClassName?: string;
  columns?: number;
  gap?: number;
}

export function SupabaseImageGallery({
  images,
  className = '',
  imageClassName = '',
  columns = 3,
  gap = 4
}: SupabaseImageGalleryProps) {
  return (
    <div 
      className={`grid gap-${gap} ${className}`}
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {images.map((image, index) => (
        <div key={index} className="group">
          <SupabaseImage
            path={image.path}
            alt={image.alt}
            className={`w-full h-auto rounded-lg transition-transform duration-200 group-hover:scale-105 ${imageClassName}`}
            quality={85}
            format="webp"
          />
          {image.caption && (
            <p className="text-sm text-gray-400 mt-2 text-center">
              {image.caption}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// Avatar component with Supabase Storage
interface SupabaseAvatarProps {
  path?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallbackInitials?: string;
}

export function SupabaseAvatar({
  path,
  name,
  size = 'md',
  className = '',
  fallbackInitials
}: SupabaseAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-xl'
  };

  const initials = fallbackInitials || name.charAt(0).toUpperCase();

  if (!path) {
    return (
      <div className={`${sizeClasses[size]} bg-gray-700 rounded-full flex items-center justify-center text-white font-medium ${className}`}>
        {initials}
      </div>
    );
  }

  return (
    <SupabaseImage
      path={path}
      alt={`${name}のアバター`}
      className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
      width={size === 'sm' ? 32 : size === 'md' ? 40 : size === 'lg' ? 64 : 96}
      height={size === 'sm' ? 32 : size === 'md' ? 40 : size === 'lg' ? 64 : 96}
      format="webp"
      quality={90}
      fallback={`data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23374151'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='0.35em' fill='white' font-family='sans-serif' font-size='40'%3E${initials}%3C/text%3E%3C/svg%3E`}
    />
  );
}