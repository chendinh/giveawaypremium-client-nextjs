'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import GapService from '@/app/actions/GapServices';

const POLL_INTERVAL_MS = 60 * 1000; // poll mỗi 1 phút

export interface AdminNotificationCounts {
  /** Lịch hẹn hôm nay chưa xử lý */
  pendingAppointments: number;
  /** Đơn hàng chưa có vận đơn */
  pendingOrders: number;
  /** Ký gửi chưa trả tiền */
  pendingPayouts: number;
  /** Tổng */
  total: number;
}

const EMPTY: AdminNotificationCounts = {
  pendingAppointments: 0,
  pendingOrders: 0,
  pendingPayouts: 0,
  total: 0,
};

async function fetchCounts(): Promise<AdminNotificationCounts> {
  try {
    const [appointmentRes, payoutRes] = await Promise.allSettled([
      // Lịch hẹn hôm nay
      GapService.getAppointmentToday?.(),
      // Ký gửi chưa trả tiền
      GapService.getConsignmentUnpaid?.(),
    ]);

    const pendingAppointments =
      appointmentRes.status === 'fulfilled'
        ? (appointmentRes.value?.count ??
          appointmentRes.value?.results?.length ??
          0)
        : 0;

    const pendingPayouts =
      payoutRes.status === 'fulfilled'
        ? (payoutRes.value?.count ?? payoutRes.value?.results?.length ?? 0)
        : 0;

    const total = pendingAppointments + pendingPayouts;
    return { pendingAppointments, pendingOrders: 0, pendingPayouts, total };
  } catch {
    return EMPTY;
  }
}

/**
 * Hook poll thông báo admin.
 * Trả về counts và hàm refresh thủ công.
 *
 * Chỉ hoạt động khi `enabled = true` (admin đã đăng nhập).
 */
export function useAdminNotifications(enabled: boolean) {
  const [counts, setCounts] = useState<AdminNotificationCounts>(EMPTY);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    const data = await fetchCounts();
    setCounts(data);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setCounts(EMPTY);
      return;
    }

    // Fetch ngay lần đầu
    refresh();

    intervalRef.current = setInterval(refresh, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, refresh]);

  return { counts, refresh };
}
