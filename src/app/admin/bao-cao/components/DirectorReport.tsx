'use client';

import React from 'react';
import {
  Button,
  Card,
  Progress,
  Statistic,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Info,
  Pencil,
} from 'lucide-react';

import { cn } from '@/lib/utils';

import { formatVnd, monthLabel, numberWithCommas } from '../format';
import {
  ConsignerShareBreakdown,
  MonthlyReport,
  PayoutOriginBreakdown,
  ReconSideSummary,
} from '../types';

const { Title, Text } = Typography;

type RowCheck = 'verified' | 'mismatch' | 'unavailable';

/** Không phát sinh thiếu/lệch/giao dịch lạ nào ở một chiều đối chiếu. */
const isSideClean = (summary: ReconSideSummary): boolean =>
  summary.missingCount === 0 &&
  summary.mismatchCount === 0 &&
  summary.unmatchedTxCount === 0;

/**
 * − trước số tiền cho khoản bị trừ (trả khách, chi phí) — quy ước báo cáo tài
 * chính. Dùng khoảng trắng không-ngắt-dòng (\u00A0) để dấu "−" luôn dính liền
 * với số tiền, không bị tách xuống dòng riêng khi cột hẹp.
 */
const signed = (value: number, isDeduction?: boolean): string =>
  isDeduction ? `−\u00A0${formatVnd(value)}` : formatVnd(value);

const CHECK_CONFIG: Record<
  RowCheck,
  { icon: React.ReactNode; text: string; color: string }
> = {
  verified: {
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    text: 'Đã kiểm chứng',
    color: 'success',
  },
  mismatch: {
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    text: 'Chưa khớp',
    color: 'warning',
  },
  unavailable: {
    icon: <Info className="h-3.5 w-3.5" />,
    text: 'Chưa kiểm chứng',
    color: 'default',
  },
};

/** Trạng thái đối chiếu ngân hàng của một chỉ tiêu. */
const CheckTag: React.FC<{ check: RowCheck }> = ({ check }) => {
  const { icon, text, color } = CHECK_CONFIG[check];
  return (
    <Tag
      color={color}
      className="!m-0 inline-flex items-center gap-1 !px-2 !py-0.5"
    >
      {icon} {text}
    </Tag>
  );
};

interface KpiCardProps {
  title: string;
  caption: string;
  value: number;
  check: RowCheck;
  /** Khoản bị trừ — hiện dấu "−" trước số tiền */
  isDeduction?: boolean;
  /** Màu số tiền; mặc định theo dấu (âm = đỏ) */
  accent?: string;
  /** Thẻ nổi bật (lợi nhuận ròng) */
  emphasis?: boolean;
  extra?: React.ReactNode;
}

const KpiCard: React.FC<KpiCardProps> = ({
  title,
  caption,
  value,
  check,
  isDeduction,
  accent,
  emphasis,
  extra,
}) => (
  <Card
    size="small"
    className={cn('h-full', emphasis && 'border-green-300 bg-green-50/60')}
    styles={{ body: { height: '100%' } }}
  >
    <div className="flex h-full flex-col justify-between gap-3">
      <Statistic
        title={<span className="text-sm font-medium">{title}</span>}
        value={signed(value, isDeduction)}
        styles={{
          content: {
            fontSize: emphasis ? 28 : 22,
            fontWeight: 700,
            whiteSpace: 'nowrap',
            color: value < 0 ? '#dc2626' : (accent ?? '#111827'),
          },
        }}
      />
      <Text type="secondary" className="!text-xs">
        {caption}
      </Text>
      <div className="flex flex-wrap items-center gap-2">
        <CheckTag check={check} />
        {extra}
      </div>
    </div>
  </Card>
);

interface MiniStatProps {
  title: string;
  hint?: string;
  value: number;
  color: string;
  note: React.ReactNode;
}

const MiniStat: React.FC<MiniStatProps> = ({
  title,
  hint,
  value,
  color,
  note,
}) => (
  <div className="rounded-lg border p-3" style={{ borderColor: `${color}55` }}>
    <div className="flex items-center gap-1">
      <Text type="secondary" className="!text-sm">
        {title}
      </Text>
      {hint && (
        <Tooltip title={hint}>
          <Info className="h-3.5 w-3.5 cursor-help text-gray-400 print:hidden" />
        </Tooltip>
      )}
    </div>
    <p
      className="whitespace-nowrap text-xl font-bold tabular-nums"
      style={{ color }}
    >
      {formatVnd(value)}
    </p>
    <Text type="secondary" className="!text-xs">
      {note}
    </Text>
  </div>
);

interface ConsignerSectionProps {
  breakdown: ConsignerShareBreakdown;
  payoutOrigin: PayoutOriginBreakdown;
}

/**
 * Chi tiết "Tiền trả khách ký gửi". Hai nhóm số khác chiều nhìn nên tách riêng:
 *  - Theo hàng BÁN trong tháng (nghĩa vụ): đã trả + chưa nhận = tổng phải trả.
 *    "Đã trả" gồm cả khoản trả muộn ở tháng sau.
 *  - Theo tiền THỰC CHUYỂN trong tháng (dòng tiền): trả cho hàng bán tháng này
 *    + trả cho hàng bán tháng khác = tổng đã trả trong tháng.
 * Hai nhóm không cộng với nhau.
 */
const ConsignerSection: React.FC<ConsignerSectionProps> = ({
  breakdown,
  payoutOrigin,
}) => {
  const paidOtherMonthVnd = breakdown.paidVnd - breakdown.paidThisMonthVnd;
  const paidPct =
    breakdown.totalVnd > 0
      ? Math.min(100, (breakdown.paidVnd / breakdown.totalVnd) * 100)
      : 0;

  return (
    <Card
      title={
        <span>
          Tiền trả khách ký gửi{' '}
          <Text type="secondary" className="!text-sm !font-normal">
            · chi tiết đã trả / chưa trả
          </Text>
        </span>
      }
      size="small"
    >
      <div className="space-y-5">
        <div>
          <Text strong>Theo hàng bán trong tháng này</Text>
          <Text type="secondary" className="ml-2 !text-xs">
            đã trả + chưa nhận = {formatVnd(breakdown.totalVnd)}
          </Text>
          <Progress
            percent={100}
            strokeColor="#f59e0b"
            railColor="#e5e7eb"
            success={{ percent: paidPct, strokeColor: '#16a34a' }}
            showInfo={false}
            className="!mb-1 !mt-2"
          />
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <MiniStat
              title="Đã trả cho khách"
              hint="Phần ký gửi của hàng bán tháng này đã được đánh dấu trả tiền, kể cả trả muộn ở tháng sau."
              value={breakdown.paidVnd}
              color="#15803d"
              note={
                breakdown.paidThisMonthVnd > 0 || paidOtherMonthVnd > 0
                  ? `${formatVnd(breakdown.paidThisMonthVnd)} trả đúng tháng này, ${formatVnd(paidOtherMonthVnd)} trả ở tháng khác.`
                  : 'Chưa có khoản nào được trả.'
              }
            />
            <MiniStat
              title="Khách chưa nhận"
              hint="Chỉ tính cho hàng bán trong tháng này, không gồm nợ các tháng khác."
              value={breakdown.unpaidVnd}
              color="#b45309"
              note={
                breakdown.unresolvedOrderCount > 0
                  ? `Gồm ${numberWithCommas(breakdown.unresolvedOrderCount)} đơn không lần được trạng thái trả, tạm tính là chưa trả.`
                  : 'Không gồm nợ các tháng khác.'
              }
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <Text strong>Tiền thực tế đã chuyển trong tháng này</Text>
          <Text type="secondary" className="ml-2 !text-xs">
            tính theo ngày chuyển, không theo ngày bán
          </Text>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <MiniStat
              title="Cho hàng bán tháng này"
              value={payoutOrigin.forThisMonthSalesVnd}
              color="#0f766e"
              note="Trả đúng kỳ."
            />
            <MiniStat
              title="Cho hàng bán tháng khác"
              hint="Tiền chuyển trong tháng này nhưng để trả cho hàng đã bán ở tháng khác. Không nằm trong số 'đã trả' ở trên."
              value={payoutOrigin.forOtherMonthSalesVnd}
              color="#0369a1"
              note={
                payoutOrigin.unresolvedPayoutCount > 0
                  ? `Gồm ${numberWithCommas(payoutOrigin.unresolvedPayoutCount)} khoản không lần được tháng bán, tạm tính là "tháng khác".`
                  : 'Trả nợ các tháng trước.'
              }
            />
            <MiniStat
              title="Tổng đã trả khách trong tháng"
              hint="Bằng tổng hai ô bên cạnh."
              value={payoutOrigin.totalVnd}
              color="#6d28d9"
              note="Tiền thực đã rời quỹ."
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

interface ExpenseSectionProps {
  totalVnd: number;
  items: { id: string; label: string; amountVnd: number; note: string }[];
  onEdit: () => void;
}

const ExpenseSection: React.FC<ExpenseSectionProps> = ({
  totalVnd,
  items,
  onEdit,
}) => (
  <Card
    size="small"
    title={
      <span>
        Chi phí vận hành{' '}
        <Text type="secondary" className="!text-sm !font-normal">
          · lương, điện nước, chi phí khác (quản lý tự nhập)
        </Text>
      </span>
    }
    extra={
      <Button
        size="small"
        icon={<Pencil className="h-3.5 w-3.5" />}
        onClick={onEdit}
        className="print:!hidden"
      >
        Sửa
      </Button>
    }
  >
    {items.length > 0 ? (
      <ul className="divide-y">
        {items.map(item => (
          <li
            key={item.id}
            className="flex items-baseline justify-between gap-4 py-2"
          >
            <span className="text-gray-700">
              {item.label}
              {item.note && (
                <Text type="secondary" className="ml-1 !text-sm">
                  ({item.note})
                </Text>
              )}
            </span>
            <span className="whitespace-nowrap font-medium tabular-nums text-red-600">
              {signed(item.amountVnd, true)}
            </span>
          </li>
        ))}
        <li className="flex items-baseline justify-between gap-4 pt-3">
          <Text strong>Tổng chi phí</Text>
          <span className="whitespace-nowrap text-lg font-bold tabular-nums text-red-600">
            {signed(totalVnd, true)}
          </span>
        </li>
      </ul>
    ) : (
      <Text type="secondary">
        Chưa nhập chi phí nào cho tháng này. Bấm "Sửa" để thêm.
      </Text>
    )}
  </Card>
);

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

  return (
    <div className="space-y-4">
      <Title level={3} className="!mb-0">
        Báo cáo {monthLabel(report.month).toLowerCase()}
      </Title>

      {/* Công thức đọc từ trái sang phải: bán − trả khách = gộp − chi phí = ròng */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          title="Tiền shop bán hàng"
          caption="Doanh thu online + offline"
          value={all.revenueVnd}
          check={inboundCheck}
        />
        <KpiCard
          title="Trả khách ký gửi"
          caption="Tạm tính theo doanh số bán tháng này, chưa phải tiền đã trả"
          value={all.consignerShareVnd}
          check={outboundCheck}
          isDeduction
        />
        <KpiCard
          title="Lợi nhuận gộp"
          caption="Bán hàng − trả khách"
          value={profit.feeVnd}
          check={profitCheck}
          accent="#1d4ed8"
        />
        <KpiCard
          title="Chi phí vận hành"
          caption="Quản lý tự nhập"
          value={profit.expensesVnd}
          check="unavailable"
          isDeduction
        />
        <KpiCard
          title="Lợi nhuận sau chi phí"
          caption="Gộp − chi phí vận hành"
          value={profit.netVnd}
          check="unavailable"
          accent="#15803d"
          emphasis
        />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ConsignerSection
            breakdown={consignerShareBreakdown}
            payoutOrigin={payoutOrigin}
          />
        </div>
        <div className="lg:col-span-2">
          <ExpenseSection
            totalVnd={profit.expensesVnd}
            items={report.expenses.items}
            onEdit={onEditExpenses}
          />
        </div>
      </div>

      <Button
        onClick={onViewDetail}
        className="print:!hidden"
        icon={<ArrowRight className="h-4 w-4" />}
        iconPlacement="end"
      >
        Xem chi tiết & đối chiếu
      </Button>
    </div>
  );
};

export default DirectorReport;
