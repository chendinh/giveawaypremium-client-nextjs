'use client';

import React, { useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
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

import { formatDateTime, formatVnd, numberWithCommas } from '../format';
import { PayoutSummary, ReportPayoutRow } from '../types';
import { ReportSection } from './ReportSection';

const CELL = 'px-2 py-1.5 text-xs';
const NUM = `${CELL} text-right tabular-nums whitespace-nowrap`;

interface Props {
  rows: ReportPayoutRow[];
  summary: PayoutSummary;
}

const PayoutsSection: React.FC<Props> = ({ rows, summary }) => {
  const cashRows = useMemo(
    () => rows.filter(row => row.method === 'cash').length,
    [rows]
  );

  return (
    <ReportSection
      id="tra-khach"
      title="3. Chi tiết trả tiền khách ký gửi"
      description={`${numberWithCommas(rows.length)} ký gửi được nhân viên xác nhận “đã trả tiền” trong tháng. Số tiền là số phải trả của ký gửi tại thời điểm xem báo cáo.`}
    >
      <div className="max-h-[480px] overflow-y-auto rounded-lg border print:max-h-none print:overflow-visible">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 [&_th]:h-9 [&_th]:px-2 [&_th]:text-xs">
              <TableHead>Ngày xác nhận trả</TableHead>
              <TableHead>Mã ký gửi</TableHead>
              <TableHead>Khách ký gửi</TableHead>
              <TableHead>Hình thức</TableHead>
              <TableHead>Tài khoản nhận</TableHead>
              <TableHead className="text-right">Số tiền</TableHead>
              <TableHead>Nhân viên xác nhận</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  Tháng này chưa có ký gửi nào được xác nhận đã trả tiền.
                </TableCell>
              </TableRow>
            )}
            {rows.map(row => (
              <TableRow key={row.id} className="break-inside-avoid">
                <TableCell className={`${CELL} whitespace-nowrap`}>
                  {formatDateTime(row.paidAt)}
                </TableCell>
                <TableCell className={`${CELL} font-mono`}>
                  {row.consignmentId}
                </TableCell>
                <TableCell className={CELL}>
                  {row.consignerName || '—'}
                </TableCell>
                <TableCell className={CELL}>
                  <Badge
                    variant="outline"
                    className={cn(
                      'whitespace-nowrap font-normal',
                      row.method === 'bank'
                        ? 'border-sky-200 text-sky-700'
                        : 'border-amber-300 text-amber-800'
                    )}
                  >
                    {row.method === 'bank' ? 'Chuyển khoản' : 'Trực tiếp'}
                  </Badge>
                </TableCell>
                <TableCell className={CELL}>
                  {row.method === 'bank' ? (
                    <>
                      {row.bankName || '—'}
                      <span className="ml-1 text-muted-foreground">
                        {row.accountMasked}
                      </span>
                    </>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell className={`${NUM} font-medium`}>
                  {formatVnd(row.moneyBackVnd)}
                </TableCell>
                <TableCell className={CELL}>{row.markedBy || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          {rows.length > 0 && (
            <TableFooter>
              <TableRow className="[&_td]:px-2 [&_td]:py-2 [&_td]:text-xs [&_td]:font-semibold">
                <TableCell colSpan={5}>
                  Cộng — chuyển khoản {summary.bankCount} khoản (
                  {formatVnd(summary.bankVnd)}), trực tiếp {summary.cashCount}{' '}
                  khoản ({formatVnd(summary.cashVnd)})
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatVnd(summary.totalVnd)}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
      {cashRows > 0 && (
        <p className="mt-1 text-xs text-muted-foreground">
          {cashRows} khoản trả trực tiếp không có giao dịch ngân hàng để đối
          chiếu. Nên đính kèm biên nhận có chữ ký của khách ở phần Chứng từ.
        </p>
      )}
    </ReportSection>
  );
};

export default PayoutsSection;
