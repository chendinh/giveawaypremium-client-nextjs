'use client';

import React, { useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import GapService from '@/app/actions/GapServices';
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

import { formatDateTime, numberWithCommas } from '../format';
import { ExpenseItem, MonthlyExpenses } from '../types';

const MAX_ITEMS = 50;

let tempIdSeq = 0;
const createTempId = (): string => `tmp_${Date.now()}_${tempIdSeq++}`;

const emptyRow = (): ExpenseItem => ({
  id: createTempId(),
  label: '',
  amountVnd: 0,
  note: '',
});

/** Hiện số có dấu phẩy ngay khi gõ (134000000 -> 134,000,000), rỗng khi bằng 0. */
const displayAmount = (value: number): string =>
  value > 0 ? numberWithCommas(value) : '';

interface Props {
  month: string;
  expenses: MonthlyExpenses;
  onSaved: (updated: MonthlyExpenses) => void;
  onClose: () => void;
}

/**
 * Hộp thoại nhập/sửa chi phí vận hành của tháng (lương nhân viên, điện nước, chi
 * phí khác...) — quản lý có thể thêm dòng tuỳ ý. Chỉ nên render khi mở
 * (`{open && <ExpensesDialog key={month} .../>}`) để state luôn khởi tạo sạch
 * từ dữ liệu hiện tại của tháng đó.
 */
const ExpensesDialog: React.FC<Props> = ({
  month,
  expenses,
  onSaved,
  onClose,
}) => {
  const [rows, setRows] = useState<ExpenseItem[]>(() => expenses.items.slice());
  const [submitting, setSubmitting] = useState(false);

  const totalVnd = rows.reduce((sum, row) => sum + (row.amountVnd || 0), 0);

  const updateRow = (id: string, patch: Partial<ExpenseItem>) =>
    setRows(prev =>
      prev.map(row => (row.id === id ? { ...row, ...patch } : row))
    );

  const handleAmountChange = (id: string, raw: string) => {
    const digits = raw.replace(/[^\d]/g, '');
    updateRow(id, { amountVnd: Number(digits) || 0 });
  };

  const addRow = () => {
    if (rows.length >= MAX_ITEMS) {
      toast.error(`Chỉ nhập tối đa ${MAX_ITEMS} dòng chi phí`);
      return;
    }
    setRows(prev => [...prev, emptyRow()]);
  };

  const removeRow = (id: string) =>
    setRows(prev => prev.filter(row => row.id !== id));

  const invalidRow = rows.find(
    row =>
      row.label.trim() === '' && (row.amountVnd > 0 || row.note.trim() !== '')
  );
  const canSave = !submitting && !invalidRow;

  const handleSave = async () => {
    const payload = rows
      .filter(row => row.label.trim() !== '' || row.amountVnd > 0)
      .map(row => ({
        id: row.id.startsWith('tmp_') ? undefined : row.id,
        label: row.label.trim(),
        amountVnd: row.amountVnd,
        note: row.note.trim() || undefined,
      }));

    setSubmitting(true);
    try {
      const res = await GapService.saveMonthlyExpenses(month, payload);
      if (res?.result) {
        toast.success('Đã lưu chi phí tháng');
        onSaved(res.result as MonthlyExpenses);
      } else {
        toast.error(res?.error || 'Không lưu được chi phí');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={next => !next && !submitting && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Chi phí vận hành tháng</DialogTitle>
          <DialogDescription>
            Lương nhân viên, điện nước, chi phí khác... Dùng để tính lợi nhuận
            sau chi phí.
            {expenses.updatedByName && (
              <span className="mt-1 block text-xs">
                Cập nhật lần cuối bởi {expenses.updatedByName}
                {expenses.updatedAt
                  ? ` lúc ${formatDateTime(expenses.updatedAt)}`
                  : ''}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[360px] space-y-2 overflow-y-auto">
          {rows.length === 0 && (
            <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
              Chưa có dòng chi phí nào. Bấm “Thêm dòng” để nhập.
            </p>
          )}
          {rows.map(row => (
            <div
              key={row.id}
              className="grid grid-cols-[1fr_140px_auto] items-start gap-2 rounded-md border p-2"
            >
              <div className="space-y-1">
                <Label className="text-xs">Tên chi phí</Label>
                <Input
                  value={row.label}
                  onChange={e => updateRow(row.id, { label: e.target.value })}
                  placeholder="VD: Lương nhân viên"
                  maxLength={100}
                  className="h-8 text-xs"
                />
                <Input
                  value={row.note}
                  onChange={e => updateRow(row.id, { note: e.target.value })}
                  placeholder="Ghi chú (không bắt buộc)"
                  maxLength={300}
                  className="h-7 text-xs text-muted-foreground"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Số tiền (đ)</Label>
                <Input
                  value={displayAmount(row.amountVnd)}
                  onChange={e => handleAmountChange(row.id, e.target.value)}
                  inputMode="numeric"
                  placeholder="0"
                  className="h-8 text-right text-xs"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="mt-5 h-8 w-8 text-red-600"
                onClick={() => removeRow(row.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={addRow}
          disabled={rows.length >= MAX_ITEMS}
          className="w-fit"
        >
          <Plus className="h-4 w-4" /> Thêm dòng
        </Button>

        <div className="flex items-center justify-between rounded-md bg-gray-50 p-2 text-sm font-semibold">
          <span>Tổng chi phí</span>
          <span className="tabular-nums">{numberWithCommas(totalVnd)}đ</span>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Đóng
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Lưu chi phí
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExpensesDialog;
