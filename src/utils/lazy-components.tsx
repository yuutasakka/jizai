// コンポーネント遅延読み込みとSuspense対応ユーティリティ
import React, { Suspense, ComponentType, lazy } from 'react';

// Loading fallback component
export const LoadingFallback: React.FC<{
  message?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}> = ({ message = '読み込み中...', size = 'medium', className = '' }) => {
  const sizeMap = {
    small: { width: '20px', height: '20px', fontSize: '12px' },
    medium: { width: '40px', height: '40px', fontSize: '14px' },
    large: { width: '60px', height: '60px', fontSize: '16px' }
  };

  const { width, height, fontSize } = sizeMap[size];

  return (
    <div
      className={`flex flex-col items-center justify-center p-4 ${className}`}
      role="status"
      aria-live="polite"
    >
      <div
        style={{
          width,
          height,
          border: '3px solid #e0e0e0',
          borderTop: '3px solid #007bff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}
        aria-hidden="true"
      />
      <span style={{ fontSize, marginTop: '8px', color: '#6c757d' }}>
        {message}
      </span>
    </div>
  );
};

// Error boundary for lazy components
export class LazyComponentErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-4 text-center text-red-600">
            <p>コンポーネントの読み込みに失敗しました</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              再試行
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

// Enhanced lazy loading with retry mechanism
export function createLazyComponent<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  options: {
    fallback?: React.ReactNode;
    errorFallback?: React.ReactNode;
    retryCount?: number;
    preload?: boolean;
  } = {}
): React.FC<React.ComponentProps<T>> {
  const {
    fallback = <LoadingFallback />,
    errorFallback,
    retryCount = 3,
    preload = false
  } = options;

  // Create lazy component with retry logic
  const LazyComponent = lazy(() => {
    let attempts = 0;

    const loadWithRetry = async (): Promise<{ default: T }> => {
      try {
        attempts++;
        return await factory();
      } catch (error) {
        if (attempts < retryCount) {
          console.warn(`Lazy component load failed, retrying... (${attempts}/${retryCount})`);
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
          return loadWithRetry();
        }
        throw error;
      }
    };

    return loadWithRetry();
  });

  // Preload if requested
  if (preload && typeof window !== 'undefined') {
    // Preload after a short delay to not block initial render
    setTimeout(() => {
      factory().catch(console.warn);
    }, 100);
  }

  // Return wrapped component
  return (props: React.ComponentProps<T>) => (
    <LazyComponentErrorBoundary fallback={errorFallback}>
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    </LazyComponentErrorBoundary>
  );
}

// Preload utility for route-based code splitting
export const preloadComponent = (factory: () => Promise<any>) => {
  if (typeof window !== 'undefined') {
    // Use requestIdleCallback if available, otherwise setTimeout
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        factory().catch(console.warn);
      });
    } else {
      setTimeout(() => {
        factory().catch(console.warn);
      }, 1);
    }
  }
};

// Intersection Observer based preloading
export const useIntersectionPreload = (
  factory: () => Promise<any>,
  options: IntersectionObserverInit = {}
) => {
  const [ref, setRef] = React.useState<Element | null>(null);

  React.useEffect(() => {
    if (!ref || typeof window === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          factory().catch(console.warn);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '200px',
        ...options
      }
    );

    observer.observe(ref);

    return () => observer.disconnect();
  }, [ref, factory, options]);

  return setRef;
};

// Component for lazy loading screens/pages
export const LazyScreen: React.FC<{
  children: React.ReactNode;
  title?: string;
  description?: string;
}> = ({ children, title, description }) => (
  <div className="min-h-screen">
    {title && (
      <head>
        <title>{title}</title>
        {description && <meta name="description" content={description} />}
      </head>
    )}
    <LazyComponentErrorBoundary>
      <Suspense fallback={<LoadingFallback size="large" message="ページを読み込み中..." />}>
        {children}
      </Suspense>
    </LazyComponentErrorBoundary>
  </div>
);

// Higher-order component for bundle splitting
export function withLazyLoading<P extends object>(
  Component: ComponentType<P>,
  options: {
    fallback?: React.ReactNode;
    errorFallback?: React.ReactNode;
    preload?: boolean;
  } = {}
) {
  const LazyWrapper = createLazyComponent(
    () => Promise.resolve({ default: Component }),
    options
  );

  LazyWrapper.displayName = `LazyLoaded(${Component.displayName || Component.name})`;

  return LazyWrapper;
}

export default {
  LoadingFallback,
  LazyComponentErrorBoundary,
  createLazyComponent,
  preloadComponent,
  useIntersectionPreload,
  LazyScreen,
  withLazyLoading
};