// 遅延読み込み対応画像コンポーネント
import React, { useState, useRef, useEffect } from 'react';

export interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  fallbackSrc?: string;
  placeholder?: string;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
  width?: number;
  height?: number;
  aspectRatio?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  style,
  fallbackSrc,
  placeholder,
  loading = 'lazy',
  onLoad,
  onError,
  width,
  height,
  aspectRatio
}) => {
  const [currentSrc, setCurrentSrc] = useState<string>(placeholder || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (loading === 'eager' || !imgRef.current) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [loading]);

  // Load actual image when visible
  useEffect(() => {
    if (!isVisible || !src) return;

    const img = new Image();
    img.onload = () => {
      setCurrentSrc(src);
      setIsLoaded(true);
      onLoad?.();
    };
    img.onerror = () => {
      setHasError(true);
      if (fallbackSrc) {
        setCurrentSrc(fallbackSrc);
        setIsLoaded(true);
      }
      onError?.();
    };
    img.src = src;
  }, [isVisible, src, fallbackSrc, onLoad, onError]);

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-block',
    ...style
  };

  if (aspectRatio) {
    containerStyle.aspectRatio = aspectRatio;
  } else if (width && height) {
    containerStyle.width = width;
    containerStyle.height = height;
  }

  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'opacity 0.3s ease-in-out',
    opacity: isLoaded ? 1 : 0
  };

  const placeholderStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: isLoaded ? 0 : 1,
    transition: 'opacity 0.3s ease-in-out',
    zIndex: 1
  };

  return (
    <div style={containerStyle} className={className}>
      {/* Placeholder */}
      {!isLoaded && (
        <div style={placeholderStyle}>
          {placeholder ? (
            <img
              src={placeholder}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              aria-hidden="true"
            />
          ) : (
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '3px solid #e0e0e0',
                borderTop: '3px solid #007bff',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}
              aria-label="画像を読み込み中"
            />
          )}
        </div>
      )}

      {/* Actual image */}
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        style={imageStyle}
        loading={loading}
        width={width}
        height={height}
        onLoad={() => {
          setIsLoaded(true);
          onLoad?.();
        }}
        onError={() => {
          setHasError(true);
          if (fallbackSrc && currentSrc !== fallbackSrc) {
            setCurrentSrc(fallbackSrc);
          }
          onError?.();
        }}
      />

      {/* Error state */}
      {hasError && !fallbackSrc && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: '#f8f9fa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6c757d',
            fontSize: '14px',
            textAlign: 'center'
          }}
        >
          画像を読み込めませんでした
        </div>
      )}
    </div>
  );
};

// CSS keyframes for loading spinner (should be in global styles)
const spinKeyframes = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Inject styles if not already present
if (typeof document !== 'undefined' && !document.querySelector('#lazy-image-styles')) {
  const style = document.createElement('style');
  style.id = 'lazy-image-styles';
  style.textContent = spinKeyframes;
  document.head.appendChild(style);
}

export default LazyImage;