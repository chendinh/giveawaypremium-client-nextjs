'use client';

/**
 * InitLoader — đặt ở root layout.
 *
 * Inline loader đã được inject vào HTML bởi script trong layout.tsx,
 * hiển thị ngay từ byte đầu tiên trước khi JS load.
 *
 * Component này chỉ làm 1 việc: khi React hydrate xong, gọi
 * window.__gapRemoveInitLoader() để xóa cái inline loader đó đi
 * (nếu đây là lần đầu trong session).
 */

import { useEffect } from 'react';

const SESSION_KEY = 'gap_loaded';

declare global {
  interface Window {
    __gapRemoveInitLoader?: () => void;
  }
}

export default function InitLoader() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
    } catch {
      return;
    }

    // Đợi progress bar chạy đủ rồi mới remove
    // Script inline đã tự chạy progress, ta chỉ cần đợi ~1.6s tổng
    const timer = setTimeout(() => {
      sessionStorage.setItem(SESSION_KEY, '1');
      window.__gapRemoveInitLoader?.();
    }, 1600);

    return () => clearTimeout(timer);
  }, []);

  return null;
}
