'use client';

import React, { useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

import {
  formatDateTime,
  formatSignedVnd,
  formatVnd,
  numberWithCommas,
} from '../format';
import { OrderChannel, ReportOrderRow } from '../types';
import { ReportSection } from './ReportSection';

type ChannelFilter = 'all' | OrderChannel;

const CELL = 'px-2 py-1.5 text-xs';
const NUM = `${CELL} text-right tabular-nums whitespace-nowrap`;

const channelLabel = (row: ReportOrderRow): string => {
  if (row.channel === 'offline') return 'Offline';
  return row.pickup === 'self' ? 'Online · tự lấy' : 'Online';
};

interface Props {
  orders: ReportOrderRow[];
}

const OrdersSection: React.FC<Props> = ({ orders }) => {
  const [channel, setChannel] = useState<ChannelFilter>('all');
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter(order => {
      if (channel !== 'all' && order.channel !== channel) return false;
      if (!q) return true;
      return [order.id, order.customerName, order.phone, order.staffName]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(q));
    });
  }, [orders, channel, query]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (sum, row) => ({
          products: sum.products + row.productCount,
          revenue: sum.revenue + row.revenueVnd,
          share: sum.share + row.consignerShareVnd,
          fee: sum.fee + row.feeVnd,
          bank: sum.bank + row.bankVnd,
          cash: sum.cash + row.cashVnd,
        }),
        { products: 0, revenue: 0, share: 0, fee: 0, bank: 0, cash: 0 }
      ),
    [rows]
  );

  return (
    <ReportSection
      id="chi-tiet-don"
      title="2. Chi tiết đơn hàng"
      description={`${numberWithCommas(orders.length)} đơn trong tháng, sắp theo thời gian tạo đơn.`}
      actions={
        <>
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Tìm mã đơn, khách, SĐT, nhân viên..."
            className="h-8 w-64 text-xs"
          />
          <Select
            value={channel}
            onValueChange={value => setChannel(value as ChannelFilter)}
          >
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả kênh</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>
        </>
      }
    >
      <div className="max-h-[560px] overflow-y-auto rounded-lg border print:max-h-none print:overflow-visible">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 [&_th]:h-9 [&_th]:px-2 [&_th]:text-xs">
              <TableHead>Thời gian</TableHead>
              <TableHead>Mã đơn</TableHead>
              <TableHead>Kênh</TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Nhân viên</TableHead>
              <TableHead className="text-right">SP</TableHead>
              <TableHead className="text-right">Doanh thu</TableHead>
              <TableHead className="text-right">Trả khách</TableHead>
              <TableHead className="text-right">Lợi nhuận (phí)</TableHead>
              <TableHead className="text-right">Chuyển khoản</TableHead>
              <TableHead className="text-right">Tiền mặt</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={11}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  Không có đơn hàng nào.
                </TableCell>
              </TableRow>
            )}
            {rows.map(row => (
              <TableRow key={row.id} className="break-inside-avoid">
                <TableCell className={`${CELL} whitespace-nowrap`}>
                  {formatDateTime(row.createdAt)}
                </TableCell>
                <TableCell className={`${CELL} font-mono`}>{row.id}</TableCell>
                <TableCell className={CELL}>
                  <Badge
                    variant="outline"
                    className={cn(
                      'whitespace-nowrap font-normal',
                      row.channel === 'online'
                        ? 'border-blue-200 text-blue-700'
                        : 'border-orange-200 text-orange-700'
                    )}
                  >
                    {channelLabel(row)}
                  </Badge>
                </TableCell>
                <TableCell className={CELL}>
                  <div>{row.customerName || '—'}</div>
                  <div className="text-muted-foreground">{row.phone}</div>
                </TableCell>
                <TableCell className={CELL}>{row.staffName || '—'}</TableCell>
                <TableCell className={NUM}>{row.productCount}</TableCell>
                <TableCell className={NUM}>
                  {formatVnd(row.revenueVnd)}
                </TableCell>
                <TableCell className={NUM}>
                  {formatVnd(row.consignerShareVnd)}
                </TableCell>
                <TableCell
                  className={cn(
                    NUM,
                    'font-medium',
                    row.feeVnd < 0 && 'text-red-600'
                  )}
                >
                  {formatVnd(row.feeVnd)}
                </TableCell>
                <TableCell className={NUM}>
                  {row.bankVnd ? formatVnd(row.bankVnd) : '—'}
                </TableCell>
                <TableCell className={NUM}>
                  {row.cashVnd ? formatVnd(row.cashVnd) : '—'}
                  {row.paymentGapVnd !== 0 && (
                    <span
                      className="mt-0.5 flex items-center justify-end gap-1 text-amber-700"
                      title="Tổng chuyển khoản + tiền mặt không bằng doanh thu của đơn"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      lệch {formatSignedVnd(row.paymentGapVnd)}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          {rows.length > 0 && (
            <TableFooter>
              <TableRow className="[&_td]:px-2 [&_td]:py-2 [&_td]:text-xs [&_td]:font-semibold">
                <TableCell colSpan={5}>
                  Cộng ({numberWithCommas(rows.length)} đơn
                  {rows.length !== orders.length ? ' đang lọc' : ''})
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {numberWithCommas(totals.products)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatVnd(totals.revenue)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatVnd(totals.share)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatVnd(totals.fee)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatVnd(totals.bank)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatVnd(totals.cash)}
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </ReportSection>
  );
};

export default OrdersSection;
