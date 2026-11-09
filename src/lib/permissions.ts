/**
 * Phân quyền nhân sự ở phía client (ẩn menu/nút theo vai trò).
 *
 * Vai trò lưu ở `_User.role` (khớp USER_ROLES phía server). Đây là lớp giao diện:
 * người rành kỹ thuật vẫn có thể gọi API trực tiếp. Riêng các hàm báo cáo
 * (/admin/bao-cao) server tự kiểm vai trò.
 *
 * Muốn đổi quyền của một vai trò chỉ cần sửa ROLE_PERMISSIONS ở đây.
 */
export const ROLES = {
  ADMIN: 'administrator',
  MANAGER: 'manager',
  OPERATOR: 'operator',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export type Permission =
  /** Xem màn Thống kê */
  | 'VIEW_STATS'
  /** Vào /admin/bao-cao và xem báo cáo */
  | 'VIEW_REPORT'
  /** Ghi trong báo cáo: nhập chi phí, đồng bộ/gán sao kê, tải/gỡ chứng từ */
  | 'EDIT_REPORT'
  /** Màn Cài đặt */
  | 'VIEW_SETTINGS'
  /** Sửa giá bán của sản phẩm ký gửi */
  | 'EDIT_PRICE'
  /** Xác nhận đã trả tiền cho khách ký gửi */
  | 'CONFIRM_PAYMENT'
  /** Sửa số lượng "Đã bán" (ảnh hưởng tiền trả khách) */
  | 'EDIT_SOLD'
  /** Sửa mọi dữ liệu khác trong màn Quản lý (tên, số lượng, ghi chú, khách, sản phẩm...) */
  | 'EDIT_RECORDS'
  /** Xoá/huỷ bất kỳ dữ liệu nào */
  | 'DELETE';

const ALL_PERMISSIONS: readonly Permission[] = [
  'VIEW_STATS',
  'VIEW_REPORT',
  'EDIT_REPORT',
  'VIEW_SETTINGS',
  'EDIT_PRICE',
  'CONFIRM_PAYMENT',
  'EDIT_SOLD',
  'EDIT_RECORDS',
  'DELETE',
];

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  [ROLES.ADMIN]: ALL_PERMISSIONS,
  // Quản lý: xem thống kê + báo cáo, sửa giá bán, xác nhận trả tiền. Không xoá,
  // không sửa "Đã bán" (muốn cho phép: thêm 'EDIT_SOLD' vào danh sách này).
  [ROLES.MANAGER]: [
    'VIEW_STATS',
    'VIEW_REPORT',
    'EDIT_PRICE',
    'CONFIRM_PAYMENT',
  ],
  // Nhân viên thường: bán hàng, tạo ký gửi, ghi chú, xem màn Quản lý.
  [ROLES.OPERATOR]: [],
};

export const isStaffRole = (role: unknown): role is Role =>
  typeof role === 'string' && role in ROLE_PERMISSIONS;

/** Vai trò lạ, rỗng hoặc đã bị khoá ('disabled', 'customer') không có quyền nào. */
export const hasPermission = (
  role: string | null | undefined,
  permission: Permission
): boolean => isStaffRole(role) && ROLE_PERMISSIONS[role].includes(permission);

export const ROLE_LABEL: Record<Role, string> = {
  [ROLES.ADMIN]: 'Admin',
  [ROLES.MANAGER]: 'Quản lý',
  [ROLES.OPERATOR]: 'Nhân viên',
};
