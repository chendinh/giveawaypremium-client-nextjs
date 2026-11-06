'use client';

import { useSyncExternalStore } from 'react';
import { useAppStore } from '@/store/useAppStore';

/**
 * true khi zustand đã đọc xong `userData`/`sessionToken` từ localStorage.
 *
 * Dùng useSyncExternalStore (thay vì state + useEffect) để tránh set-state
 * đồng bộ trong effect — đây là API React dành riêng cho việc đồng bộ với một
 * nguồn bên ngoài như zustand persist.
 */
export const useHasHydrated = (): boolean =>
  useSyncExternalStore(
    callback => useAppStore.persist.onFinishHydration(callback),
    () => useAppStore.persist.hasHydrated(),
    () => false
  );
