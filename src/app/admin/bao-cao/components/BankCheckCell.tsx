'use client';

import React from 'react';

import { formatDateTime, formatSignedVnd, formatVnd } from '../format';
import {
  ReconOrderItem,
  ReconPayoutItem,
  ReconSide,
  ReconTx,
} from '../types';
import { StatusBadge } from './ReportSection';

type ReconItem = ReconOrderItem | ReconPayoutItem;

/** Tra nhanh kết quả đối chiếu của một chiều (tiền vào / tiền ra) theo khoá dòng. */
export interface BankLookup {
  /** false = chưa có dữ liệu sao kê để đối chiếu (chưa cấu hình/đồng bộ) */
  available: boolean;
  find: (key: string) => ReconItem | undefined;
  tx: (id: string) => ReconTx | undefined;
}

export const buildBankLookup = <T extends ReconItem>(
  side: ReconSide<T> | null,
  hasData: boolean,
  keyOf: (item: T) => string
): BankLookup => {
  if (!hasData || !side) {
    return { available: false, find: () => undefined, tx: () => undefined };
  }
  const items = new Map<string, ReconItem>();
  side.items.forEach(item => items.set(keyOf(item), item));
  const txs = new Map<string, ReconTx>();
  side.transactions.forEach(tx => txs.set(tx.id, tx));
  return {
    available: true,
    find: key => items.get(key),
    tx: id => txs.get(id),
  };
};

interface Props {
  lookup: BankLookup;
  /** Khoá để tìm trong kết quả đối chiếu (mã đơn / mã ký gửi) */
  itemKey: string;
  /** Dòng này có giao dịch ngân hàng để đối chiếu không (đơn CK / trả CK) */
  viaBank: boolean;
  /** Chữ hiện khi dòng không đi qua ngân hàng */
  nonBankLabel: string;
}

const Muted: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="text-xs text-muted-foreground">{children}</span>
);

/**
 * Ô "Đối chiếu sao kê" của từng đơn / từng lần trả tiền khách. Dùng kết quả
 * matcher đã có sẵn (cùng nguồn với mục 4), không tính thêm gì. Muốn ghép tay
 * giao dịch chưa khớp thì làm ở mục "Đối chiếu ngân hàng" bên dưới.
 */
const BankCheckCell: React.FC<Props> = ({
  lookup,
  itemKey,
  viaBank,
  nonBankLabel,
}) => {
  if (!viaBank) return <Muted>{nonBankLabel}</Muted>;
  if (!lookup.available) return <Muted>Chưa có sao kê</Muted>;

  const item = lookup.find(itemKey);
  if (!item) return <Muted>Chưa đối chiếu</Muted>;

  const txs = item.txIds
    .map(id => lookup.tx(id))
    .filter((tx): tx is ReconTx => !!tx);

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-1">
        <StatusBadge status={item.status} />
        {item.source === 'manual' && (
          <span className="text-[10px] text-muted-foreground">(ghép tay)</span>
        )}
      </div>
      {item.status !== 'matched' && item.diffVnd !== 0 && (
        <div className="text-amber-700">
          {item.diffVnd < 0 ? 'Thiếu' : 'Thừa'}{' '}
          {formatVnd(Math.abs(item.diffVnd))}
          <span className="sr-only"> ({formatSignedVnd(item.diffVnd)})</span>
        </div>
      )}
      {txs.map(tx => (
        <div
          key={tx.id}
          className="max-w-[240px] text-[11px] leading-snug text-muted-foreground"
          title={tx.content}
        >
          <span className="tabular-nums">{formatDateTime(tx.at)}</span> ·{' '}
          {tx.bankName} · {formatVnd(tx.amountVnd)}
          <div className="truncate">{tx.content}</div>
        </div>
      ))}
    </div>
  );
};

export default BankCheckCell;
