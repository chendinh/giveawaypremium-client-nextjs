'use client';

import React from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, Pencil } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import { formatVnd, monthLabel, numberWithCommas } from '../format';
import {
  ConsignerShareBreakdown,
  MonthlyReport,
  PayoutOriginBreakdown,
  ReconSideSummary,
} from '../types';

type RowCheck = 'verified' | 'mismatch' | 'unavailable';

/** Không phát sinh thiếu/lệch/giao dịch lạ nào ở một chiều đối chiếu. */
const isSideClean = (summary: ReconSideSummary): boolean =>
  summary.missingCount === 0 &&
  summary.mismatchCount === 0 &&
  summary.unmatchedTxCount === 0;

/**
 * Lưới 3 cột dùng chung cho header + mọi dòng (kể cả từng khoản chi phí liệt
 * kê bên trong) để cột "Số tiền" luôn thẳng hàng với nhau trong toàn bảng.
 */
const GRID_COLS =
  'grid grid-cols-[minmax(0,1fr)_minmax(150px,230px)_minmax(150px,180px)] gap-3';

/**
 * − trước số tiền cho khoản bị trừ (trả khách, chi phí) — quy ước báo cáo tài
 * chính. Dùng khoảng trắng không-ngắt-dòng (\u00A0) để dấu "−" luôn dính liền
 * và nằm ngang với số tiền, không bị tách xuống dòng riêng khi cột hẹp.
 */
const signed = (value: number, isDeduction?: boolean): string =>
  isDeduction ? `−\u00A0${formatVnd(value)}` : formatVnd(value);

const CHECK_CONFIG: Record<
  RowCheck,
  { Icon: typeof CheckCircle2; text: string; className: string }
> = {
  verified: {
    Icon: CheckCircle2,
    text: 'Đã kiểm chứng',
    className: 'border-green-300 bg-green-100 text-green-800',
  },
  mismatch: {
    Icon: AlertTriangle,
    text: 'Chưa khớp',
    className: 'border-amber-300 bg-amber-100 text-amber-800',
  },
  unavailable: {
    Icon: CheckCircle2,
    text: 'Chưa kiểm chứng',
    className: 'border-gray-300 bg-gray-100 text-gray-500',
  },
};

/** Luôn hiện hình dấu tick — chỉ đổi màu/chữ theo trạng thái, để cột dễ nhận ra. */
const CheckPill: React.FC<{ check: RowCheck }> = ({ check }) => {
  const { Icon, text, className } = CHECK_CONFIG[check];
  return (
    <Badge
      variant="outline"
      className={cn('w-fit gap-1.5 px-3 py-1.5 text-sm font-medium', className)}
    >
      <Icon className="h-4 w-4" /> {text}
    </Badge>
  );
};

interface ReportRow {
  label: string;
  caption: string;
  value: number;
  check: RowCheck;
  /** Khoản bị trừ (trả khách, chi phí) — hiện dấu "−" trước số tiền */
  isDeduction?: boolean;
  /** Dòng tổng trung gian (Lợi nhuận gộp) — viền đậm phía trên + nền nhạt */
  subtotal?: boolean;
  /** Dòng tổng cuối cùng (Lợi nhuận sau chi phí) — nhấn mạnh nhất */
  final?: boolean;
}

const ReportListRow: React.FC<{ row: ReportRow }> = ({ row }) => (
  <div
    className={cn(
      GRID_COLS,
      'items-center px-4 py-4',
      row.subtotal && 'border-t-2 border-gray-300 bg-blue-50/40',
      row.final && 'border-t-2 border-gray-300 bg-green-50/70'
    )}
  >
    <div>
      <p className="text-lg font-semibold text-gray-900">{row.label}</p>
      <p className="mt-0.5 text-sm text-muted-foreground">{row.caption}</p>
    </div>
    <p
      className={cn(
        'whitespace-nowrap text-right font-bold tabular-nums',
        row.final ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl',
        row.value < 0 ? 'text-red-600' : 'text-gray-900'
      )}
    >
      {signed(row.value, row.isDeduction)}
    </p>
    <div>
      <CheckPill check={row.check} />
    </div>
  </div>
);

interface ExpenseRowProps {
  caption: string;
  totalVnd: number;
  items: { id: string; label: string; amountVnd: number; note: string }[];
  onEdit: () => void;
}

/**
 * Hàng "Chi phí vận hành" — khác các hàng còn lại: liệt kê sẵn từng khoản chi
 * ngay trong báo cáo (không cần bấm "Sửa" mới thấy), số tiền từng khoản thẳng
 * hàng với tổng chi phí vì dùng cùng lưới GRID_COLS. Nút "Sửa" chỉ dùng để
 * thêm/sửa/xoá khoản chi, không đối chiếu ngân hàng nên cột cuối luôn xám.
 */
const ExpenseRow: React.FC<ExpenseRowProps> = ({
  caption,
  totalVnd,
  items,
  onEdit,
}) => (
  <div className="px-4 py-4">
    <div className={cn(GRID_COLS, 'items-center')}>
      <div className="flex items-center gap-2">
        <div>
          <p className="text-lg font-semibold text-gray-900">
            Chi phí vận hành
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">{caption}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="h-7 shrink-0 px-2 text-xs print:hidden"
        >
          <Pencil className="h-3.5 w-3.5" /> Sửa
        </Button>
      </div>
      <p className="whitespace-nowrap text-right text-xl font-bold tabular-nums text-gray-900 sm:text-2xl">
        {signed(totalVnd, true)}
      </p>
      <div>
        <CheckPill check="unavailable" />
      </div>
    </div>

    {items.length > 0 ? (
      <ul className="mt-3 space-y-1.5 border-t pt-3">
        {items.map(item => (
          <li key={item.id} className={GRID_COLS}>
            <span className="pl-4 text-base text-gray-700">
              {item.label}
              {item.note && (
                <span className="ml-1 text-sm text-muted-foreground">
                  ({item.note})
                </span>
              )}
            </span>
            <span className="whitespace-nowrap text-right font-medium tabular-nums text-red-500/80">
              {formatVnd(item.amountVnd)}
            </span>
            <span />
          </li>
        ))}
      </ul>
    ) : (
      <p className="mt-3 border-t pt-3 text-sm text-muted-foreground">
        Chưa nhập chi phí nào cho tháng này. Bấm "Sửa" để thêm.
      </p>
    )}
  </div>
);

interface ConsignerShareRowProps {
  row: ReportRow;
  breakdown: ConsignerShareBreakdown;
  payoutOrigin: PayoutOriginBreakdown;
}

/**
 * Hàng "Tiền trả khách ký gửi" kèm 2 mục con TÁCH ĐÚNG TỪ CHÍNH SỐ NÀY (không
 * phải số lấy nguồn khác rồi trừ ước lượng) — paidVnd + unpaidVnd luôn bằng
 * đúng row.value, vì server tính theo tỷ lệ sản phẩm đã trả/chưa trả trong
 * từng đơn của THÁNG NÀY (xem payout-breakdown.ts), không lẫn qua tháng khác:
 *  - "Đã trả" = phần ký gửi của hàng bán tháng này đã được đánh dấu trả tiền
 *    (có thể trả cùng tháng hoặc trả muộn ở tháng sau — ghi rõ tỉ lệ trả đúng
 *    tháng này bên dưới).
 *  - "Chưa trả" = phần còn lại, khách THỰC TẾ CHƯA NHẬN, chỉ riêng cho hàng
 *    bán trong tháng này (khác hẳn công nợ lũy kế toàn bộ lịch sử).
 */
const ConsignerShareRow: React.FC<ConsignerShareRowProps> = ({
  row,
  breakdown,
  payoutOrigin,
}) => {
  const paidOtherMonthVnd = breakdown.paidVnd - breakdown.paidThisMonthVnd;

  return (
    <div className="px-4 py-4">
      <div className={cn(GRID_COLS, 'items-center')}>
        <div>
          <p className="text-lg font-semibold text-gray-900">{row.label}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{row.caption}</p>
        </div>
        <p className="whitespace-nowrap text-right text-xl font-bold tabular-nums text-gray-900 sm:text-2xl">
          {signed(row.value, row.isDeduction)}
        </p>
        <div>
          <CheckPill check={row.check} />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 border-t pt-3 sm:grid-cols-3">
        <div className="rounded-lg border border-green-200 bg-green-50/60 p-3">
          <p className="text-sm text-muted-foreground">
            Trong đó, đã trả cho khách
          </p>
          <p className="whitespace-nowrap text-xl font-bold tabular-nums text-green-700">
            {formatVnd(breakdown.paidVnd)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {breakdown.paidThisMonthVnd > 0 || paidOtherMonthVnd > 0 ? (
              <>
                {formatVnd(breakdown.paidThisMonthVnd)} trả đúng tháng này,{' '}
                {formatVnd(paidOtherMonthVnd)} trả ở tháng khác.
              </>
            ) : (
              'Chưa có khoản nào được trả.'
            )}
          </p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3">
          <p className="text-sm text-muted-foreground">
            Trong đó, khách chưa nhận (riêng tháng này)
          </p>
          <p className="whitespace-nowrap text-xl font-bold tabular-nums text-amber-700">
            {formatVnd(breakdown.unpaidVnd)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {breakdown.unresolvedOrderCount > 0
              ? `Gồm ${numberWithCommas(breakdown.unresolvedOrderCount)} đơn không lần được trạng thái trả, tạm tính là chưa trả.`
              : 'Chỉ tính cho hàng bán trong tháng này, không gồm nợ các tháng khác.'}
          </p>
        </div>
        <div className="rounded-lg border border-sky-200 bg-sky-50/60 p-3">
          <p className="text-sm text-muted-foreground">
            Trả khách tháng này, nhưng không phải do bán tháng này
          </p>
          <p className="whitespace-nowrap text-xl font-bold tabular-nums text-sky-700">
            {formatVnd(payoutOrigin.forOtherMonthSalesVnd)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Khác 2 ô trên — đây là tiền THỰC TẾ đã chuyển trong tháng này (tổng{' '}
            {formatVnd(payoutOrigin.totalVnd)}), nhưng để trả cho hàng đã bán ở
            tháng khác, không phải hàng bán tháng này.
            {payoutOrigin.unresolvedPayoutCount > 0 &&
              ` Gồm ${numberWithCommas(payoutOrigin.unresolvedPayoutCount)} khoản không lần được tháng bán, tạm tính là "tháng khác".`}
          </p>
        </div>
      </div>
    </div>
  );
};

interface Props {
  report: MonthlyReport;
  onEditExpenses: () => void;
  onViewDetail: () => void;
}

const DirectorReport: React.FC<Props> = ({
  report,
  onEditExpenses,
  onViewDetail,
}) => {
  const { all } = report.totals;
  const {
    profit,
    reconciliation,
    holding,
    consignerShareBreakdown,
    payoutOrigin,
  } = report;

  // "Tiền shop bán hàng" ↔ tiền chuyển khoản khách trả có về đúng tài khoản
  // không. "Tiền trả khách ký gửi" ↔ tiền đã chuyển cho khách có khớp số phải
  // trả không. Chỉ tính khớp khi CẢ hai chiều đều sạch (không thiếu/lệch/lạ).
  const inboundCheck: RowCheck =
    !reconciliation.hasData || !reconciliation.inbound
      ? 'unavailable'
      : isSideClean(reconciliation.inbound.summary)
        ? 'verified'
        : 'mismatch';

  const outboundCheck: RowCheck =
    !reconciliation.hasData || !reconciliation.outbound
      ? 'unavailable'
      : isSideClean(reconciliation.outbound.summary)
        ? 'verified'
        : 'mismatch';

  // Lợi nhuận gộp = tiền bán − tiền trả khách, nên chỉ "đã kiểm chứng" khi cả
  // hai dòng trên đều khớp, VÀ tiền còn lại trong tài khoản hộ kinh doanh (sau
  // khi trừ phần còn phải trả khách ký gửi) không bị âm.
  const profitCheck: RowCheck =
    inboundCheck === 'unavailable' ||
    outboundCheck === 'unavailable' ||
    holding.surplusVnd === null
      ? 'unavailable'
      : inboundCheck === 'verified' &&
          outboundCheck === 'verified' &&
          holding.surplusVnd >= 0
        ? 'verified'
        : 'mismatch';

  const revenueRow: ReportRow = {
    label: 'Tiền shop bán hàng',
    caption: 'Tổng doanh thu tháng này — online và offline',
    value: all.revenueVnd,
    check: inboundCheck,
  };

  const consignerShareRow: ReportRow = {
    label: 'Tiền trả khách ký gửi',
    caption: 'Tạm tính theo doanh số bán tháng này — chưa phải tiền đã trả',
    value: all.consignerShareVnd,
    check: outboundCheck,
    isDeduction: true,
  };

  const grossProfitRow: ReportRow = {
    label: 'Lợi nhuận gộp',
    caption: 'Tiền bán hàng − tiền trả khách ký gửi',
    value: profit.feeVnd,
    check: profitCheck,
    subtotal: true,
  };

  const netProfitRow: ReportRow = {
    label: 'Lợi nhuận sau chi phí',
    caption: 'Lợi nhuận gộp − chi phí vận hành',
    value: profit.netVnd,
    check: 'unavailable',
    final: true,
  };

  return (
    <div className="max-w-[920px] space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">
        Báo cáo {monthLabel(report.month).toLowerCase()}
      </h2>

      <Card className="overflow-hidden">
        <div
          className={cn(
            GRID_COLS,
            'items-center border-b bg-gray-50 px-4 py-2.5 text-sm font-medium text-muted-foreground'
          )}
        >
          <span>Chỉ tiêu</span>
          <span className="text-right">Số tiền</span>
          <span>Đối chiếu ngân hàng</span>
        </div>

        <div className="divide-y">
          <ReportListRow row={revenueRow} />
          <ConsignerShareRow
            row={consignerShareRow}
            breakdown={consignerShareBreakdown}
            payoutOrigin={payoutOrigin}
          />
          <ReportListRow row={grossProfitRow} />
          <ExpenseRow
            caption="Lương, điện nước, chi phí khác — quản lý tự nhập"
            totalVnd={profit.expensesVnd}
            items={report.expenses.items}
            onEdit={onEditExpenses}
          />
          <ReportListRow row={netProfitRow} />
        </div>
      </Card>

      <Button variant="outline" onClick={onViewDetail} className="print:hidden">
        Xem chi tiết & đối chiếu <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default DirectorReport;
