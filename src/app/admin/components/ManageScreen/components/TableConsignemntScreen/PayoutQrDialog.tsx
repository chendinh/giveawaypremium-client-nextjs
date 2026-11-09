'use client';

import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Copy, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BANK_OPTIONS,
  buildPayContent,
  buildVietQr,
  isAutoConfirmable,
  resolveBank,
} from '@/lib/vietqr';

export interface PayoutQrTarget {
  consignmentId: string;
  consignerName?: string;
  /** Nghìn đồng, theo quy ước lưu trong DB */
  moneyBack?: number;
  totalMoney?: number;
  banks?: Array<{ type?: string; accNumber?: string }>;
  bankName?: string;
  bankId?: string;
}

interface Props {
  target: PayoutQrTarget;
  onClose: () => void;
  /** Dự phòng khi hệ thống không tự xác nhận được (mã chỉ một cụm, sao kê chậm…) */
  onConfirmManually: () => void;
}

const numberWithCommas = (x: number): string =>
  x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/**
 * Cùng quy tắc với safeMoneyBack ở server: ký gửi cũ nhập moneyBack theo VND
 * nguyên (lệch 1000 lần) thì tự chia lại, để số tiền trong QR khớp số server
 * dùng khi tự đánh dấu "đã trả".
 */
const safeMoneyBackK = (moneyBack: number, totalMoney: number): number => {
  if (totalMoney > 0 && moneyBack > totalMoney * 1.05) {
    const corrected = moneyBack / 1000;
    if (corrected / totalMoney <= 1) return corrected;
  }
  return moneyBack;
};

const PayoutQrDialog: React.FC<Props> = ({
  target,
  onClose,
  onConfirmManually,
}) => {
  const [manualBin, setManualBin] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const bankText = target.banks?.[0]?.type || target.bankName || '';
  const accountNumber = (
    target.banks?.[0]?.accNumber ||
    target.bankId ||
    ''
  ).replace(/\s+/g, '');

  const resolved = useMemo(() => resolveBank(bankText), [bankText]);
  const bin = resolved?.bin ?? manualBin;
  const bankLabel =
    resolved?.name ?? BANK_OPTIONS.find(b => b.bin === manualBin)?.name ?? '';

  const amountVnd = Math.round(
    safeMoneyBackK(
      Number(target.moneyBack) || 0,
      Number(target.totalMoney) || 0
    ) * 1000
  );
  const content = buildPayContent(target.consignmentId);
  const autoConfirm = isAutoConfirmable(target.consignmentId);

  const qr = useMemo(
    () => buildVietQr({ bin, accountNumber, amountVnd, content }),
    [bin, accountNumber, amountVnd, content]
  );

  useEffect(() => {
    let cancelled = false;
    if (!qr.ok) {
      setQrUrl('');
      return;
    }
    QRCode.toDataURL(qr.payload, {
      margin: 1,
      width: 280,
      errorCorrectionLevel: 'M',
    })
      .then(url => {
        if (!cancelled) setQrUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrUrl('');
      });
    return () => {
      cancelled = true;
    };
  }, [qr]);

  const copyContent = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Trình duyệt chặn clipboard: nhân viên vẫn đọc được nội dung trên màn hình
    }
  };

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>QR trả tiền — {target.consignmentId}</DialogTitle>
          <DialogDescription>
            Quét bằng app ngân hàng của shop. Số tiền và nội dung đã điền sẵn,
            không sửa nội dung để hệ thống tự nhận ra khoản này.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="rounded-md border bg-muted/30 p-3 space-y-1">
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Người nhận</span>
              <span className="font-medium text-right">
                {target.consignerName || '---'}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Ngân hàng</span>
              <span className="font-medium text-right">
                {bankLabel || bankText || '---'}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Số tài khoản</span>
              <span className="font-mono font-medium">
                {accountNumber || '---'}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Số tiền</span>
              <span className="font-semibold text-green-700">
                {amountVnd > 0 ? `${numberWithCommas(amountVnd)}đ` : '---'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Nội dung</span>
              <span className="flex items-center gap-1 font-mono font-medium">
                {content}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={copyContent}
                  aria-label="Sao chép nội dung"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </span>
            </div>
          </div>

          {!resolved && (
            <div className="space-y-1">
              <Label className="text-xs">
                Không nhận ra ngân hàng “{bankText || 'trống'}” — chọn ngân hàng
                của khách
              </Label>
              <Select value={manualBin} onValueChange={setManualBin}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn ngân hàng..." />
                </SelectTrigger>
                <SelectContent>
                  {BANK_OPTIONS.map(option => (
                    <SelectItem key={option.bin} value={option.bin}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {qr.ok ? (
            <div className="flex flex-col items-center gap-2">
              {qrUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrUrl}
                  alt={`QR chuyển khoản ${target.consignmentId}`}
                  width={280}
                  height={280}
                  className="rounded-md border"
                />
              ) : (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              )}
              <p className="text-center text-xs text-muted-foreground">
                Hãy đối chiếu tên chủ tài khoản hiện trên app trước khi bấm
                chuyển.
              </p>
            </div>
          ) : (
            <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
              Chưa tạo được QR: {'reason' in qr ? qr.reason : ''}
            </p>
          )}

          <p className="text-xs text-muted-foreground">
            {autoConfirm
              ? 'Sau khi chuyển, hệ thống tự đánh dấu “đã trả” trong vài giây nếu số tiền khớp. Tải lại danh sách để thấy kết quả.'
              : 'Mã ký gửi này chỉ có một cụm nên hệ thống không tự nhận ra được. Sau khi chuyển, hãy bấm “Đã chuyển — xác nhận trả tiền”.'}
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onClose}>
            Đóng
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              onConfirmManually();
              onClose();
            }}
          >
            Đã chuyển — xác nhận trả tiền
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PayoutQrDialog;
