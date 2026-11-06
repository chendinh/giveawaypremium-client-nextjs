import { AttachmentKind } from './types';

/**
 * Báo cáo tính theo giờ Việt Nam bất kể trình duyệt đang ở múi giờ nào, nên mọi
 * thời điểm hiển thị đều ép về Asia/Ho_Chi_Minh.
 */
const VN_TZ = 'Asia/Ho_Chi_Minh';

export const numberWithCommas = (value: number): string =>
  Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export const formatVnd = (value: number): string =>
  `${numberWithCommas(value)}đ`;

/** Số tiền có dấu: +1,000đ / −1,000đ (dùng cho chênh lệch). */
export const formatSignedVnd = (value: number): string =>
  `${value > 0 ? '+' : ''}${formatVnd(value)}`;

const partsOf = (iso: string): Record<string, string> => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: VN_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(iso));
  return Object.fromEntries(parts.map(p => [p.type, p.value]));
};

/** 05/10/2026 */
export const formatDate = (iso: string): string => {
  const p = partsOf(iso);
  return `${p.day}/${p.month}/${p.year}`;
};

/** 05/10/2026 14:30 */
export const formatDateTime = (iso: string): string => {
  const p = partsOf(iso);
  // en-GB có thể trả "24" cho 00:xx ở một số engine
  const hour = p.hour === '24' ? '00' : p.hour;
  return `${p.day}/${p.month}/${p.year} ${hour}:${p.minute}`;
};

/** '2026-10' → 'Tháng 10/2026' */
export const monthLabel = (month: string): string => {
  const [year, mon] = month.split('-');
  return `Tháng ${Number(mon)}/${year}`;
};

/** Tháng hiện tại theo giờ VN dạng 'YYYY-MM'. */
export const currentVnMonth = (): string => {
  const p = partsOf(new Date().toISOString());
  return `${p.year}-${p.month}`;
};

/** Lùi `back` tháng từ một tháng 'YYYY-MM'. */
export const shiftMonth = (month: string, back: number): string => {
  const [year, mon] = month.split('-').map(Number);
  const index = year * 12 + (mon - 1) - back;
  const y = Math.floor(index / 12);
  const m = (index % 12) + 1;
  return `${y}-${String(m).padStart(2, '0')}`;
};

/** Danh sách tháng để chọn: tháng hiện tại và `count - 1` tháng trước đó. */
export const buildMonthOptions = (count = 24): string[] => {
  const current = currentVnMonth();
  return Array.from({ length: count }, (_, i) => shiftMonth(current, i));
};

export const ATTACHMENT_KIND_LABEL: Record<AttachmentKind, string> = {
  payout_bill: 'Bill chuyển tiền cho khách',
  bank_statement: 'Sao kê ngân hàng',
  other: 'Chứng từ khác',
};
