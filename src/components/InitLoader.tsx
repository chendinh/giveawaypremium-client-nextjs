'use client';

/**
 * InitLoader — đặt ở root layout.
 * Kiểm tra sessionStorage ngay khi mount:
 *   - Lần đầu trong session → hiện HomeLoader
 *   - Đã từng load → không render gì (null)
 */

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';

// Lazy load để không block initial paint
const HomeLoader = dynamic(() => import('./HomeLoader'), { ssr: false });

const SESSION_KEY = 'gap_loaded';

export default function InitLoader() {
  // null = chưa biết (đang SSR hoặc chưa check storage)
  // true = cần hiện loader
  // false = đã từng load, skip
  const [show, setShow] = useState<boolean | null>(null);

  useEffect(() => {
    // Chỉ chạy client-side
    const already = sessionStorage.getItem(SESSION_KEY);
    setShow(!already);
  }, []);

  const handleDone = useCallback(() => {
    setShow(false);
  }, []);

  // null hoặc false → không render gì
  if (!show) return null;

  return <HomeLoader onDone={handleDone} />;
}
