import { format } from 'date-fns';

/**
 * Sửa Ngân hàng / ID ngân hàng (số tài khoản) của một đơn ký gửi.
 *
 * Dữ liệu nằm ở `Consignment.banks[0]` = { type: tên ngân hàng, accNumber: số
 * tài khoản } (xem GapService.setConsignment). Mọi hàm ở đây là hàm thuần, không
 * gọi mạng, để màn hình và luồng lưu dùng chung một cách so sánh / ghi log.
 */

/** Một phần tử của `Consignment.banks`; hệ thống chỉ đọc phần tử đầu tiên. */
export interface BankEntry {
  type?: string;
  accNumber?: string;
}

/** Ngân hàng + ID ngân hàng dạng phẳng, dùng cho ô nhập. */
export interface BankValue {
  name: string;
  account: string;
}

/** Phần thực sự bị đổi. Trường vắng mặt nghĩa là không đụng tới. */
export interface BankPatch {
  name?: string;
  account?: string;
}

/**
 * Ô nhập của một dòng đang mở. `base` là giá trị lúc mở dòng, `input` là giá trị
 * đang gõ. Phần người dùng sửa = so `input` với `base` (không so với dữ liệu
 * hiện tại của bảng, vì bảng có thể đã được làm mới trong lúc dòng còn mở).
 */
export interface BankDraft {
  base: BankValue;
  input: BankValue;
}

interface BankSource {
  banks?: BankEntry[];
  bankName?: string;
  bankId?: string;
}

const stripSpaces = (value: string): string => value.replace(/\s+/g, '');

/**
 * Ngân hàng + ID ngân hàng đang hiển thị của đơn ký gửi. Cùng thứ tự ưu tiên
 * với cột "Ngân hàng" / "ID NH" của bảng và với QR trả tiền: `banks[0]` trước,
 * chỉ dữ liệu cũ mới dùng `bankName` / `bankId`.
 *
 * Bọc `String()` vì dữ liệu cũ có thể lưu số thay vì chuỗi; `.trim()` trên số
 * sẽ ném lỗi và làm hỏng cả bảng khi render.
 */
export const readBank = (item: BankSource): BankValue => ({
  name: String(item.banks?.[0]?.type || item.bankName || '').trim(),
  account: String(item.banks?.[0]?.accNumber || item.bankId || '').trim(),
});

/**
 * So giá trị muốn đặt với giá trị hiện có, chỉ giữ phần thực sự khác.
 * - Tên ngân hàng: so sau khi cắt khoảng trắng hai đầu.
 * - ID ngân hàng: so sau khi bỏ mọi khoảng trắng (QR và báo cáo cũng đọc số
 *   tài khoản theo cách này), nên "0123 4567" và "01234567" là một.
 * Trả null nếu không có gì khác.
 */
export const getBankPatch = (
  current: BankValue,
  desired: BankPatch
): BankPatch | null => {
  const patch: BankPatch = {};

  if (desired.name !== undefined) {
    const name = desired.name.trim();
    if (name !== current.name.trim()) patch.name = name;
  }
  if (desired.account !== undefined) {
    const account = stripSpaces(desired.account);
    if (account !== stripSpaces(current.account)) patch.account = account;
  }

  return patch.name === undefined && patch.account === undefined ? null : patch;
};

/**
 * Áp phần đổi vào `banks[0]`. Giữ nguyên các phần tử khác của mảng và các key
 * khác trong phần tử đầu (nếu có), vì Parse thay cả mảng khi ghi.
 */
export const applyBankPatch = (
  banks: BankEntry[] | undefined,
  patch: BankPatch
): BankEntry[] => {
  const [first, ...rest] = banks ?? [];
  const next: BankEntry = { ...first };
  if (patch.name !== undefined) next.type = patch.name;
  if (patch.account !== undefined) next.accNumber = patch.account;
  return [next, ...rest];
};

const show = (value: string): string => value || '(trống)';

/**
 * Dòng lịch sử cho thay đổi ngân hàng. Cùng khuôn với `buildAuditNote` ở
 * index.tsx: bắt đầu bằng "[" nên bảng coi là audit log (ẩn khỏi ô Ghi chú,
 * hiện ở "Lịch sử thay đổi"; trang tra cứu của khách cũng lọc bỏ).
 *
 * `current` là giá trị đang lưu TRƯỚC khi đổi; `patch` chỉ gồm trường bị đổi.
 */
export const buildBankAuditNote = (
  staffName: string,
  consignmentId: string,
  current: BankValue,
  patch: BankPatch
): string => {
  const time = format(new Date(), 'dd/MM/yyyy HH:mm');
  const lines: string[] = [];
  if (patch.name !== undefined) {
    lines.push(`  • Ngân hàng: ${show(current.name)} → ${show(patch.name)}`);
  }
  if (patch.account !== undefined) {
    lines.push(
      `  • ID Ngân hàng: ${show(current.account)} → ${show(patch.account)}`
    );
  }
  return `[${time}] ${staffName} sửa ngân hàng đơn ${consignmentId}:\n${lines.join('\n')}`;
};
