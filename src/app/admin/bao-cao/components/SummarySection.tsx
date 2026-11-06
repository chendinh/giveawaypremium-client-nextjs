'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

import { formatVnd, numberWithCommas } from '../format';
import { ChannelTotals, MonthlyReport } from '../types';
import { ReportSection } from './ReportSection';

const percent = (part: number, whole: number): string =>
  whole > 0 ? `${((part / whole) * 100).toFixed(1)}%` : '—';

interface HeroCardProps {
  title: string;
  value: string;
  hint: string;
  className: string;
}

const HeroCard: React.FC<HeroCardProps> = ({
  title,
  value,
  hint,
  className,
}) => (
  <Card className={cn('break-inside-avoid', className)}>
    <CardContent className="p-4">
      <p className="text-sm font-medium opacity-80">{title}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs opacity-80">{hint}</p>
    </CardContent>
  </Card>
);

interface ChannelRow {
  label: string;
  value: (totals: ChannelTotals) => string;
  strong?: boolean;
}

const CHANNEL_ROWS: ChannelRow[] = [
  { label: 'Số đơn', value: t => numberWithCommas(t.orderCount) },
  { label: 'Số sản phẩm', value: t => numberWithCommas(t.productCount) },
  {
    label: 'Doanh thu (tiền hàng đã bán thực tế)',
    value: t => formatVnd(t.revenueVnd),
  },
  { label: 'Trả khách ký gửi', value: t => formatVnd(t.consignerShareVnd) },
  {
    label: 'Lợi nhuận (phí ký gửi)',
    value: t => formatVnd(t.feeVnd),
    strong: true,
  },
  {
    label: 'Tỷ lệ phí / doanh thu',
    value: t => percent(t.feeVnd, t.revenueVnd),
  },
  { label: 'Thu qua chuyển khoản', value: t => formatVnd(t.bankVnd) },
  { label: 'Thu tiền mặt', value: t => formatVnd(t.cashVnd) },
];

interface Props {
  report: MonthlyReport;
}

const SummarySection: React.FC<Props> = ({ report }) => {
  const { all, online, offline } = report.totals;

  return (
    <ReportSection
      id="tong-quan"
      title="1. Tổng quan doanh thu"
      description="Doanh thu tính theo ngày tạo đơn. Phần trả khách ký gửi là số phải trả theo doanh số của tháng này."
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <HeroCard
          title="Doanh thu (tiền hàng đã bán thực tế)"
          value={formatVnd(all.revenueVnd)}
          hint={`${numberWithCommas(all.orderCount)} đơn · ${numberWithCommas(all.productCount)} sản phẩm`}
          className="border-blue-200 bg-blue-50 text-blue-900"
        />
        <HeroCard
          title="Trả khách ký gửi"
          value={formatVnd(all.consignerShareVnd)}
          hint="Phải trả theo doanh số tháng này"
          className="border-amber-200 bg-amber-50 text-amber-900"
        />
        <HeroCard
          title="Lợi nhuận (phí ký gửi)"
          value={formatVnd(all.feeVnd)}
          hint={`Doanh thu − trả khách · chiếm ${percent(all.feeVnd, all.revenueVnd)} doanh thu`}
          className="border-green-200 bg-green-50 text-green-900"
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Chỉ tiêu</TableHead>
              <TableHead className="text-right">Online</TableHead>
              <TableHead className="text-right">Offline</TableHead>
              <TableHead className="text-right">Toàn shop</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {CHANNEL_ROWS.map(row => (
              <TableRow
                key={row.label}
                className={cn(row.strong && 'bg-green-50 font-semibold')}
              >
                <TableCell>{row.label}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.value(online)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.value(offline)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.value(all)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Online gồm đơn có vận đơn và đơn khách tự đến lấy tại shop. Số thu
        chuyển khoản / tiền mặt lấy theo cách thanh toán nhân viên chọn khi tạo
        đơn.
      </p>

      {report.quality.paymentGapOrders > 0 && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Có <strong>{report.quality.paymentGapOrders}</strong> đơn có tổng
            tiền thu (chuyển khoản + tiền mặt) không khớp doanh thu của đơn. Các
            đơn này được đánh dấu cảnh báo trong phần chi tiết đơn hàng.
          </span>
        </div>
      )}
    </ReportSection>
  );
};

export default SummarySection;
