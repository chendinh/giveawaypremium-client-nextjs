'use client';

import React, { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

import { formatDateTime, formatSignedVnd, formatVnd } from '../format';
import { ReconTx } from '../types';

const MIN_NOTE_LENGTH = 3;

/** Một đơn / ký gửi có thể gán giao dịch vào. */
export interface LinkCandidate {
  id: string;
  type: 'order' | 'consignment';
  title: string;
  subtitle: string;
  expectedVnd: number;
  /** Mốc thời gian (ms) để xếp những mục gần giao dịch lên trên */
  atMs: number;
}

interface Props {
  tx: ReconTx;
  candidates: LinkCandidate[];
  onSubmit: (payload: {
    targets: Array<{ type: 'order' | 'consignment'; id: string }>;
    note: string;
  }) => Promise<void>;
  onClose: () => void;
}

/**
 * Chỉ nên render khi có giao dịch cần gán (`{linkTx && <LinkTransactionDialog
 * key={linkTx.id} .../>}`), kèm `key` theo giao dịch — mỗi giao dịch khác nhau
 * tạo một instance mới nên state luôn khởi tạo sạch, không cần effect reset.
 */
const LinkTransactionDialog: React.FC<Props> = ({
  tx,
  candidates,
  onSubmit,
  onClose,
}) => {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const sorted = useMemo(() => {
    const txMs = new Date(tx.at).getTime();
    const q = search.trim().toLowerCase();
    return candidates
      .filter(c => !q || `${c.title} ${c.subtitle}`.toLowerCase().includes(q))
      .sort(
        (a, b) =>
          Math.abs(a.expectedVnd - tx.amountVnd) -
            Math.abs(b.expectedVnd - tx.amountVnd) ||
          Math.abs(a.atMs - txMs) - Math.abs(b.atMs - txMs)
      );
  }, [tx, candidates, search]);

  const isIn = tx.type === 'in';
  const chosen = candidates.filter(c => selected.includes(c.id));
  const expectedTotal = chosen.reduce((sum, c) => sum + c.expectedVnd, 0);
  const diff = tx.amountVnd - expectedTotal;
  const trimmedNote = note.trim();
  const canSubmit =
    !submitting && (chosen.length > 0 || trimmedNote.length >= MIN_NOTE_LENGTH);

  const toggle = (id: string) =>
    setSelected(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit({
        // Giữ đúng thứ tự người dùng đã chọn
        targets: selected.map(id => ({
          type: isIn ? ('order' as const) : ('consignment' as const),
          id,
        })),
        note: trimmedNote,
      });
    } catch {
      // Người gọi đã báo lỗi; giữ hộp thoại mở để sửa
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={next => !next && !submitting && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isIn ? 'Gán tiền vào cho đơn hàng' : 'Gán tiền ra cho ký gửi'}
          </DialogTitle>
          <DialogDescription>
            Thao tác này được lưu vết (ai gán, lúc nào) và hiển thị trên báo cáo
            gửi giám đốc.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border bg-gray-50 p-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              {formatDateTime(tx.at)} · {tx.bankName} {tx.accountMasked}
            </span>
            <span className="text-base font-semibold tabular-nums">
              {isIn ? '+' : '−'}
              {formatVnd(tx.amountVnd)}
            </span>
          </div>
          <p className="mt-1 break-words text-xs">
            {tx.content || '(không có nội dung)'}
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">
            {isIn ? 'Gán vào đơn hàng' : 'Gán vào ký gửi'} (chọn một hoặc nhiều
            mục)
          </Label>
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo mã, tên khách, SĐT..."
            className="h-8 text-xs"
          />
          <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border p-1">
            {sorted.length === 0 && (
              <p className="p-3 text-center text-xs text-muted-foreground">
                Không có mục nào chưa khớp.
              </p>
            )}
            {sorted.map(c => (
              <label
                key={c.id}
                className={cn(
                  'flex cursor-pointer items-start gap-2 rounded px-2 py-1.5 text-xs hover:bg-gray-50',
                  selected.includes(c.id) && 'bg-blue-50'
                )}
              >
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={selected.includes(c.id)}
                  onChange={() => toggle(c.id)}
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{c.title}</span>
                  <span className="block text-muted-foreground">
                    {c.subtitle}
                  </span>
                </span>
                <span className="whitespace-nowrap font-medium tabular-nums">
                  {formatVnd(c.expectedVnd)}
                </span>
              </label>
            ))}
          </div>
          {chosen.length > 0 && (
            <p className="text-xs">
              Đã chọn {chosen.length} mục, cần có{' '}
              <strong>{formatVnd(expectedTotal)}</strong> · giao dịch{' '}
              <strong>{formatVnd(tx.amountVnd)}</strong>
              {Math.abs(diff) > 1000 && (
                <span className="ml-1 font-medium text-amber-700">
                  (lệch {formatSignedVnd(diff)})
                </span>
              )}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <Label className="text-xs">
            Giải trình / ghi chú
            {chosen.length === 0 && (
              <span className="text-red-600">
                {' '}
                (bắt buộc nếu không gán mục nào)
              </span>
            )}
          </Label>
          <Textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder={
              isIn
                ? 'VD: Khách đặt cọc, đã hoàn lại ngày 12/10'
                : 'VD: Hoàn tiền đơn huỷ, phí ngân hàng...'
            }
            maxLength={300}
            rows={2}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Đóng
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LinkTransactionDialog;
