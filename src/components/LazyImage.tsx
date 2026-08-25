import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, RefreshCw, AlertCircle, WifiOff } from 'lucide-react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatioClass?: string;
  fallbackTitle?: string;
  fallbackSubject?: string;
  threshold?: number;
  rootMargin?: string;
  onClick?: () => void;
  priority?: boolean;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  aspectRatioClass = 'aspect-[4/3]',
  fallbackTitle,
  fallbackSubject,
  threshold = 0.01,
  rootMargin = '180px',
  onClick,
  priority = false
}) => {
  const [isInView, setIsInView] = useState(priority);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for viewport detection
  useEffect(() => {
    if (priority) {
      setIsInView(true);
      return;
    }

    if (!('IntersectionObserver' in window)) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            if (containerRef.current) {
              observer.unobserve(containerRef.current);
            }
          }
        });
      },
      {
        threshold,
        rootMargin
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, priority]);

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHasError(false);
    setIsLoaded(false);
    setRetryCount((prev) => prev + 1);
  };

  // Cache busting query on retry if needed
  const effectiveSrc = retryCount > 0 
    ? `${src}${src.includes('?') ? '&' : '?'}retry=${retryCount}` 
    : src;

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      className={`relative w-full ${aspectRatioClass} overflow-hidden bg-slate-100/90 select-none ${className}`}
    >
      {/* 1. Shimmer Skeleton Loading State */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 z-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-slate-200/70 to-slate-100 animate-pulse">
          {/* Animated subtle shimmer wave */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
          
          <div className="relative z-10 flex flex-col items-center justify-center p-3 text-center">
            <div className="w-10 h-10 rounded-2xl bg-white/80 border border-slate-200/80 shadow-xs flex items-center justify-center text-emerald-600/70 mb-1.5 backdrop-blur-xs">
              <BookOpen className="w-5 h-5 animate-pulse" />
            </div>
            {fallbackSubject && (
              <span className="text-[10px] font-bold text-slate-500 max-w-[120px] truncate">
                {fallbackSubject}
              </span>
            )}
          </div>
        </div>
      )}

      {/* 2. Image Element (Only rendered when in view) */}
      {isInView && !hasError && (
        <img
          key={effectiveSrc}
          src={effectiveSrc}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={() => {
            setIsLoaded(true);
            setHasError(false);
          }}
          onError={() => {
            setHasError(true);
            setIsLoaded(false);
          }}
          className={`w-full h-full object-cover transition-all duration-700 ease-out ${
            isLoaded
              ? 'opacity-100 scale-100 filter-none'
              : 'opacity-0 scale-105 blur-xs'
          }`}
        />
      )}

      {/* 3. Fallback Error State for Low/Unstable Network */}
      {hasError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gradient-to-br from-emerald-950/90 via-slate-900 to-teal-950 p-4 text-white text-center">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 mb-2">
            <BookOpen className="w-5 h-5" />
          </div>
          
          {fallbackTitle && (
            <p className="text-[11px] font-bold font-serif text-white line-clamp-1 mb-1 max-w-[140px]">
              {fallbackTitle}
            </p>
          )}

          <div className="flex items-center gap-1 text-[10px] text-emerald-300/80 mb-2">
            <WifiOff className="w-3 h-3" />
            <span>ضعف الاتصال</span>
          </div>

          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold shadow-md transition-transform active:scale-95 cursor-pointer"
            title="إعادة تحميل الصورة"
          >
            <RefreshCw className="w-3 h-3" />
            <span>إعادة التحميل</span>
          </button>
        </div>
      )}
    </div>
  );
};
