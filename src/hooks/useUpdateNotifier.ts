'use client';

import { useEffect, useRef, useState } from 'react';

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 phút
const BUILD_INFO_URL = '/build-info.json';

interface BuildInfo {
  buildTime: string;
}

async function fetchBuildTime(): Promise<string | null> {
  try {
    // cache: 'no-store' để luôn lấy file mới nhất, không bị browser cache
    const res = await fetch(BUILD_INFO_URL, { cache: 'no-store' });
    if (!res.ok) return null;
    const data: BuildInfo = await res.json();
    return data.buildTime ?? null;
  } catch {
    return null;
  }
}

/**
 * Hook phát hiện khi có deploy mới.
 *
 * - Lưu buildTime lúc app load làm baseline.
 * - Poll mỗi POLL_INTERVAL_MS để so sánh.
 * - Trả về `hasUpdate = true` khi phát hiện version mới.
 * - `dismiss()` để ẩn noti (không reload), `reload()` để hard reload.
 */
export function useUpdateNotifier() {
  const [hasUpdate, setHasUpdate] = useState(false);
  const baselineRef = useRef<string | null>(null);

  useEffect(() => {
    // Lấy baseline ngay khi mount
    fetchBuildTime().then(time => {
      baselineRef.current = time;
    });

    const interval = setInterval(async () => {
      const latest = await fetchBuildTime();
      if (latest && baselineRef.current && latest !== baselineRef.current) {
        setHasUpdate(true);
        clearInterval(interval); // Chỉ cần thông báo 1 lần
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  const dismiss = () => setHasUpdate(false);
  const reload = () => window.location.reload();

  return { hasUpdate, dismiss, reload };
}
