'use client';

import { useUpdateNotifier } from '@/hooks/useUpdateNotifier';
import { cn } from '@/lib/utils';
import { RefreshCw, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

/**
 * Banner xuất hiện ở góc dưới-phải khi phát hiện có bản deploy mới.
 * Mount một lần duy nhất trong layout.tsx.
 */
export function UpdateNotification() {
  const { hasUpdate, dismiss, reload } = useUpdateNotifier();
  const bannerRef = useRef<HTMLDivElement>(null);

  // Focus vào banner khi hiện ra (accessibility)
  useEffect(() => {
    if (hasUpdate) {
      bannerRef.current?.focus();
    }
  }, [hasUpdate]);

  if (!hasUpdate) return null;

  return (
    <div
      ref={bannerRef}
      tabIndex={-1}
      role="alert"
      aria-live="polite"
      className={cn(
        'fixed bottom-5 right-5 z-[9999]',
        'flex items-start gap-3 rounded-xl border border-border',
        'bg-background shadow-lg px-4 py-3 max-w-sm w-full',
        'animate-in slide-in-from-bottom-4 fade-in duration-300'
      )}
    >
      {/* Icon */}
      <div className="mt-0.5 shrink-0 rounded-full bg-primary/10 p-1.5">
        <RefreshCw className="h-4 w-4 text-primary" aria-hidden />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground leading-snug">
          Có phiên bản mới
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Tải lại trang để cập nhật nội dung mới nhất.
        </p>
        <button
          onClick={reload}
          className={cn(
            'mt-2 inline-flex items-center gap-1.5 rounded-md',
            'bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground',
            'transition-opacity hover:opacity-90 active:opacity-75 focus-visible:outline-none',
            'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1'
          )}
        >
          <RefreshCw className="h-3 w-3" aria-hidden />
          Tải lại ngay
        </button>
      </div>

      {/* Dismiss */}
      <button
        onClick={dismiss}
        aria-label="Đóng thông báo"
        className={cn(
          'shrink-0 rounded-sm p-1 text-muted-foreground',
          'transition-colors hover:text-foreground hover:bg-accent',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
        )}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
