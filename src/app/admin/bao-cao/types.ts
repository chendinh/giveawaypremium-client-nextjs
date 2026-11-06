/**
 * Kiểu dữ liệu của báo cáo kiểm kê tháng — khớp với DTO của server
 * (giveawaypremium-server-nestjs/src/cloud/function/report/types.ts).
 * Mọi số tiền là VND (server đã đổi từ đơn vị nghìn đồng), thời điểm là ISO 8601.
 */

export type OrderChannel = 'online' | 'offline';
export type TargetStatus = 'matched' | 'mismatch' | 'missing';
export type MatchSource = 'auto' | 'manual';
export type ReconTxStatus = 'matched' | 'mismatch' | 'unmatched' | 'explained';

export interface ChannelTotals {
  orderCount: number;
  productCount: number;
  revenueVnd: number;
  consignerShareVnd: number;
  /** Phí ký gửi = revenueVnd − consignerShareVnd. Đây là lợi nhuận chính của shop. */
  feeVnd: number;
  bankVnd: number;
  cashVnd: number;
}

export interface ReportOrderRow {
  id: string;
  createdAt: string;
  channel: OrderChannel;
  pickup: 'self' | 'shipper' | null;
  customerName: string;
  phone: string;
  staffName: string | null;
  productCount: number;
  revenueVnd: number;
  consignerShareVnd: number;
  feeVnd: number;
  bankVnd: number;
  cashVnd: number;
  paymentGapVnd: number;
}

export interface ReportPayoutRow {
  id: string;
  consignmentId: string;
  consignerName: string;
  method: 'bank' | 'cash';
  bankName: string;
  accountMasked: string;
  moneyBackVnd: number;
  paidAt: string;
  markedBy: string | null;
}

export interface PayoutSummary {
  bankCount: number;
  bankVnd: number;
  cashCount: number;
  cashVnd: number;
  totalVnd: number;
}

export interface ReconTxTarget {
  type: 'order' | 'consignment';
  id: string;
  label: string;
  amountVnd: number;
}

export interface ReconTx {
  id: string;
  type: 'in' | 'out';
  at: string;
  /** false = nằm ở phần đệm hai đầu tháng, chỉ dùng để ghép */
  inMonth: boolean;
  amountVnd: number;
  bankName: string;
  accountMasked: string;
  content: string;
  referenceCode: string;
  status: ReconTxStatus;
  source: MatchSource | null;
  targets: ReconTxTarget[];
  explanation: string | null;
  linkedByName: string | null;
  linkedAt: string | null;
}

interface ReconItemBase {
  id: string;
  expectedVnd: number;
  allocatedVnd: number;
  /** allocated − expected: âm = thiếu, dương = thừa */
  diffVnd: number;
  status: TargetStatus;
  source: MatchSource | null;
  txIds: string[];
}

export interface ReconOrderItem extends ReconItemBase {
  at: string;
  channel: OrderChannel;
  customerName: string;
  phone: string;
  staffName: string | null;
  /** Nhân viên đã bấm "đã nhận tiền" (đơn online) */
  moneyConfirmed: boolean | null;
}

export interface ReconPayoutItem extends ReconItemBase {
  consignmentId: string;
  consignerName: string;
  bankName: string;
  accountMasked: string;
  paidAt: string;
  markedBy: string | null;
}

export interface ReconSideSummary {
  expectedVnd: number;
  allocatedVnd: number;
  bankTotalVnd: number;
  bankCount: number;
  matchedCount: number;
  mismatchCount: number;
  missingCount: number;
  missingVnd: number;
  shortVnd: number;
  excessVnd: number;
  unmatchedTxCount: number;
  unmatchedTxVnd: number;
  explainedTxCount: number;
}

export interface ReconSide<TItem> {
  summary: ReconSideSummary;
  items: TItem[];
  transactions: ReconTx[];
}

export interface Reconciliation {
  configured: { webhook: boolean; api: boolean };
  hasData: boolean;
  lastTransactionAt: string | null;
  error?: string;
  inbound: ReconSide<ReconOrderItem> | null;
  outbound: ReconSide<ReconPayoutItem> | null;
}

// ─── Chi phí & lợi nhuận ──────────────────────────────────────────────────────

export interface ExpenseItem {
  id: string;
  label: string;
  amountVnd: number;
  note: string;
}

export interface MonthlyExpenses {
  month: string;
  items: ExpenseItem[];
  totalVnd: number;
  updatedByName: string | null;
  updatedAt: string | null;
}

export interface ProfitSummary {
  /** Tổng phí ký gửi (lợi nhuận gộp) của các đơn trong tháng */
  feeVnd: number;
  /** Tổng chi phí vận hành đã nhập cho tháng */
  expensesVnd: number;
  /** feeVnd − expensesVnd */
  netVnd: number;
}

/**
 * Tách consignerShareVnd (tiền phải trả khách ký gửi, tạm tính theo doanh số
 * bán TRONG THÁNG) thành đã trả / chưa trả — paidVnd + unpaidVnd = totalVnd
 * luôn đúng, không phải 2 số lấy từ nguồn khác nhau.
 */
export interface ConsignerShareBreakdown {
  totalVnd: number;
  /** Trong totalVnd, phần ký gửi tương ứng đã được đánh dấu "đã trả" (tính đến hiện tại) */
  paidVnd: number;
  /** Trong paidVnd, phần được xác nhận trả CŨNG rơi vào đúng tháng báo cáo */
  paidThisMonthVnd: number;
  /** Phần còn lại — khách thực tế CHƯA NHẬN, chỉ riêng cho hàng bán tháng này */
  unpaidVnd: number;
  /** Số đơn không lần ra được trạng thái trả (thiếu dữ liệu), đã tính là chưa trả */
  unresolvedOrderCount: number;
}

/**
 * Nguồn gốc của tiền ĐÃ CHUYỂN thực tế trong tháng (payouts.summary.totalVnd)
 * — tách theo tháng BÁN của hàng được trả tiền. Khác ConsignerShareBreakdown:
 * cái này nhìn từ chiều tiền thực đã rời quỹ, cái trên nhìn từ chiều nghĩa vụ
 * phải trả theo hàng bán trong tháng.
 */
export interface PayoutOriginBreakdown {
  totalVnd: number;
  /** Trả cho hàng bán TRONG tháng này */
  forThisMonthSalesVnd: number;
  /** Trả cho hàng bán ở THÁNG KHÁC — "không phải do bán được tháng này" */
  forOtherMonthSalesVnd: number;
  /** Số payout không lần ra được lịch sử bán, tạm tính là "tháng khác" */
  unresolvedPayoutCount: number;
}

// ─── Tiền shop đang giữ ────────────────────────────────────────────────────────

export type BalanceSource = 'api' | 'last_transaction' | 'unavailable';

export interface HoldingAccount {
  accountNumber: string;
  bankName: string;
  balanceVnd: number;
}

export interface Holding {
  bankBalanceVnd: number | null;
  balanceSource: BalanceSource;
  asOf: string | null;
  accounts: HoldingAccount[];
  /** Chỉ tính ký gửi tạo từ tháng 10/2026 — dữ liệu trước đó không tính nữa */
  unpaidToConsignersVnd: number;
  unpaidConsignmentCount: number;
  surplusVnd: number | null;
  warning?: string;
}

export interface MonthlyReport {
  month: string;
  from: string;
  to: string;
  generatedAt: string;
  generatedBy: string;
  totals: {
    online: ChannelTotals;
    offline: ChannelTotals;
    all: ChannelTotals;
  };
  orders: ReportOrderRow[];
  payouts: { rows: ReportPayoutRow[]; summary: PayoutSummary };
  expenses: MonthlyExpenses;
  profit: ProfitSummary;
  consignerShareBreakdown: ConsignerShareBreakdown;
  payoutOrigin: PayoutOriginBreakdown;
  holding: Holding;
  quality: { paymentGapOrders: number };
  reconciliation: Reconciliation;
  /** 'snapshot' = đọc từ bản lưu sẵn của tháng đã qua; 'live' = vừa tính trực tiếp */
  cache?: { source: 'snapshot' | 'live'; savedAt: string | null };
}

// ─── Dự báo chi trả khách ký gửi ──────────────────────────────────────────────

export interface PayoutForecastMonth {
  /** 'YYYY-MM' tháng đến hạn (hoặc 'overdue' / 'later') */
  month: string;
  consignmentCount: number;
  /** Phần đã bán tới hiện tại — chắc chắn phải trả khi đến hạn */
  soldVnd: number;
  /** Phần chưa bán — chỉ phải trả nếu bán thêm trước hạn */
  unsoldPotentialVnd: number;
}

export interface ClosureLiability {
  since: string;
  consignmentCount: number;
  totalVnd: number;
  overdueCount: number;
  overdueVnd: number;
  byCreatedMonth: Array<{ month: string; count: number; vnd: number }>;
}

export interface PayoutForecast {
  closure: ClosureLiability;
  generatedAt: string;
  trackingStart: string;
  overdue: PayoutForecastMonth;
  months: PayoutForecastMonth[];
  later: PayoutForecastMonth;
}

export type AttachmentKind = 'payout_bill' | 'bank_statement' | 'other';

export interface ReportAttachment {
  id: string;
  month: string;
  kind: AttachmentKind;
  note: string;
  url: string;
  thumbUrl: string;
  uploadedByName: string;
  createdAt: string;
  deleted: boolean;
  deletedAt: string | null;
  deletedByName: string | null;
  deleteReason: string | null;
}

export interface SyncResult {
  fetched: number;
  kept: number;
  inserted: number;
  existing: number;
}
