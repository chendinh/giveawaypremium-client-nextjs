import { useCallback } from 'react';

import { Permission, hasPermission, isStaffRole } from '@/lib/permissions';
import { useAppStore } from '@/store/useAppStore';

/**
 * Quyền của người đang đăng nhập, theo `userData.role` trong store.
 * `can('DELETE')` trả false khi chưa đăng nhập hoặc vai trò không hợp lệ.
 */
export const usePermission = () => {
  const role = useAppStore(state => state.userData?.role);
  const can = useCallback(
    (permission: Permission): boolean => hasPermission(role, permission),
    [role]
  );
  return { role, can, isStaff: isStaffRole(role) };
};
