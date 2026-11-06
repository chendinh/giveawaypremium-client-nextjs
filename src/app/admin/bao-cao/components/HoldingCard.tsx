'use client';

import React from 'react';
import { AlertTriangle, Landmark } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';

import { formatDateTime, formatVnd, numberWithCommas } from '../format';
import { Holding } from '../types';

interface Props {
  holding: Holding;
}

/**
 * "Tiền shop đang giữ" — số dư ngân hàng hiện tại trừ đi số còn phải trả khách ký
 * gửi (chưa đánh dấu đã trả, không giới hạn theo tháng vì shop thường 1–2 tháng
 * mới thanh toán một lần). Phần dư ra mới là tiền thực sự thuộc về shop.
 */
const HoldingCard: React.FC<Props> = ({ holding }) => {
  const hasBalance = holding.bankBalanceVnd !== null;

  return (
    <Card className="break-inside-avoid">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <Landmark className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-semibold">Tiền shop đang giữ</p>
        </div>

        <dl className="space-y-1.5 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Số dư ngân hàng hiện tại</dt>
            <dd className="font-medium tabular-nums">
              {hasBalance ? formatVnd(holding.bankBalanceVnd as number) : '—'}
            </dd>
          </div>
          <div className="flex items-center justify-between text-red-600">
            <dt>Còn phải trả khách ký gửi</dt>
            <dd className="font-medium tabular-nums">
              −{formatVnd(holding.unpaidToConsignersVnd)}
            </dd>
          </div>
          <div className="flex items-center justify-between border-t pt-1.5 text-base font-semibold">
            <dt>Tiền thực sự của shop</dt>
            <dd className="tabular-nums">
              {holding.surplusVnd !== null
                ? formatVnd(holding.surplusVnd)
                : '—'}
            </dd>
          </div>
        </dl>

        <p className="text-xs text-muted-foreground">
          {numberWithCommas(holding.unpaidConsignmentCount)} ký gửi đã bán chưa
          trả tiền khách, tính từ tháng 10/2026 — số này tính đến hiện tại,
          không riêng tháng xem báo cáo. Ký gửi trước mốc này không tính nữa.
        </p>

        {holding.accounts.length > 1 && (
          <div className="rounded-md bg-gray-50 p-2 text-xs">
            {holding.accounts.map(acc => (
              <div key={acc.accountNumber} className="flex justify-between">
                <span>
                  {acc.bankName} ···{acc.accountNumber.slice(-4)}
                </span>
                <span className="tabular-nums">
                  {formatVnd(acc.balanceVnd)}
                </span>
              </div>
            ))}
          </div>
        )}

        {holding.warning && (
          <div className="flex items-start gap-1.5 text-xs text-amber-700">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{holding.warning}</span>
          </div>
        )}
        {hasBalance && holding.asOf && (
          <p className="text-xs text-muted-foreground">
            Số dư lúc {formatDateTime(holding.asOf)}.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default HoldingCard;
