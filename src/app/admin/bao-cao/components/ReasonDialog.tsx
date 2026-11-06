'use client';

import React, { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';

const MIN_REASON_LENGTH = 3;

interface Props {
  title: string;
  description?: string;
  placeholder?: string;
  confirmLabel: string;
  /** Trả về khi lưu xong; ném lỗi (hoặc reject) để giữ hộp thoại mở */
  onConfirm: (reason: string) => Promise<void>;
  onClose: () => void;
}

/**
 * Hộp thoại hỏi lý do — dùng cho thao tác cần để lại vết (huỷ gán, gỡ chứng từ).
 *
 * Chỉ nên render khi cần hỏi (`{target && <ReasonDialog key={target.id} .../>}`),
 * kèm `key` theo đối tượng đang tác động — component luôn mount với `reason`
 * rỗng, không cần effect để reset mỗi lần mở lại.
 */
const ReasonDialog: React.FC<Props> = ({
  title,
  description,
  placeholder = 'Nhập lý do...',
  confirmLabel,
  onConfirm,
  onClose,
}) => {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = reason.trim().length >= MIN_REASON_LENGTH && !submitting;

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm(reason.trim());
    } catch {
      // Người gọi đã báo lỗi; giữ hộp thoại mở để thử lại
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={next => !next && !submitting && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <Textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder={placeholder}
          maxLength={300}
          rows={3}
          autoFocus
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Đóng
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!canSubmit}
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReasonDialog;
