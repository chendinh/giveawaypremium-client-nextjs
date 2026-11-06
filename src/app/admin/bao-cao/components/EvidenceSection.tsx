'use client';

import React, { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import GapService from '@/app/actions/GapServices';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

import { ATTACHMENT_KIND_LABEL, formatDateTime, monthLabel } from '../format';
import { AttachmentKind, ReportAttachment } from '../types';
import ReasonDialog from './ReasonDialog';
import { ReportSection } from './ReportSection';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const UPLOAD_TIMEOUT_MS = 60_000;
const KIND_ORDER: AttachmentKind[] = ['payout_bill', 'bank_statement', 'other'];

/**
 * uploadSingleFileWithFormData không có nhánh reject khi mất mạng (promise treo mãi),
 * nên đặt giới hạn thời gian để giao diện không kẹt ở trạng thái "đang tải".
 */
const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      value => {
        clearTimeout(timer);
        resolve(value);
      },
      error => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });

interface Props {
  month: string;
  attachments: ReportAttachment[];
  loading: boolean;
  /** Tải lại danh sách chứng từ sau khi thêm / gỡ */
  onChanged: () => Promise<void> | void;
}

const EvidenceSection: React.FC<Props> = ({
  month,
  attachments,
  loading,
  onChanged,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<AttachmentKind>('payout_bill');
  const [note, setNote] = useState('');
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState<ReportAttachment | null>(null);

  const active = attachments.filter(item => !item.deleted);
  const removed = attachments.filter(item => item.deleted);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    let uploaded = 0;
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name}: chỉ nhận file ảnh`);
          continue;
        }
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`${file.name}: ảnh quá lớn (tối đa 10MB)`);
          continue;
        }
        try {
          const media = await withTimeout(
            GapService.uploadSingleFileWithFormData(file),
            UPLOAD_TIMEOUT_MS
          );
          if (!media?.objectId) {
            toast.error(`${file.name}: tải ảnh lên thất bại`);
            continue;
          }
          const res = await GapService.addReportAttachment({
            month,
            kind,
            mediaId: media.objectId,
            note: note.trim() || undefined,
          });
          if (res?.result) uploaded += 1;
          else toast.error(res?.error || `${file.name}: không đính kèm được`);
        } catch {
          toast.error(`${file.name}: tải ảnh lên thất bại, hãy thử lại`);
        }
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
    if (uploaded > 0) {
      toast.success(`Đã tải lên ${uploaded} ảnh`);
      setNote('');
      await onChanged();
    }
  };

  const handleRemove = async (reason: string) => {
    if (!removing) return;
    const res = await GapService.deleteReportAttachment(removing.id, reason);
    if (!res?.result?.ok) {
      toast.error(res?.error || 'Không gỡ được chứng từ');
      throw new Error('delete failed');
    }
    toast.success('Đã gỡ chứng từ');
    setRemoving(null);
    await onChanged();
  };

  return (
    <ReportSection
      id="chung-tu"
      title="5. Chứng từ đính kèm"
      description="Bill chuyển tiền trả khách, sao kê ngân hàng, biên nhận trả tiền mặt. Ảnh chỉ là chứng từ bổ sung; số liệu đối chiếu chính lấy từ SePay."
    >
      <div className="mb-4 flex flex-wrap items-end gap-2 rounded-lg border bg-gray-50 p-3 print:hidden">
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Loại chứng từ</span>
          <Select
            value={kind}
            onValueChange={value => setKind(value as AttachmentKind)}
          >
            <SelectTrigger className="h-9 w-56 bg-white text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KIND_ORDER.map(item => (
                <SelectItem key={item} value={item}>
                  {ATTACHMENT_KIND_LABEL[item]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[220px] flex-1 space-y-1">
          <span className="text-xs text-muted-foreground">
            Ghi chú (không bắt buộc)
          </span>
          <Input
            value={note}
            onChange={e => setNote(e.target.value)}
            maxLength={500}
            placeholder="VD: Bill CK ký gửi 51-926 ngày 05/10"
            className="h-9 bg-white text-xs"
          />
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
        <Button onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImagePlus className="h-4 w-4" />
          )}
          {uploading ? 'Đang tải lên...' : 'Chọn ảnh tải lên'}
        </Button>
      </div>

      {loading && attachments.length === 0 && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[0, 1, 2, 3].map(i => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      )}

      {!loading && active.length === 0 && (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Chưa có chứng từ nào cho {monthLabel(month).toLowerCase()}.
        </p>
      )}

      {KIND_ORDER.map(group => {
        const items = active.filter(item => item.kind === group);
        if (items.length === 0) return null;
        return (
          <div key={group} className="mb-4">
            <p className="mb-2 text-sm font-semibold">
              {ATTACHMENT_KIND_LABEL[group]} ({items.length})
            </p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {items.map(item => (
                <figure
                  key={item.id}
                  className="break-inside-avoid overflow-hidden rounded-lg border"
                >
                  <a href={item.url} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.thumbUrl}
                      alt={item.note || ATTACHMENT_KIND_LABEL[item.kind]}
                      loading="lazy"
                      className="h-44 w-full bg-gray-100 object-cover"
                    />
                  </a>
                  <figcaption className="space-y-0.5 p-2 text-xs">
                    {item.note && <p className="font-medium">{item.note}</p>}
                    <p className="text-muted-foreground">
                      {item.uploadedByName} · {formatDateTime(item.createdAt)}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1 text-xs text-red-600 print:hidden"
                      onClick={() => setRemoving(item)}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Gỡ
                    </Button>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        );
      })}

      {removed.length > 0 && (
        <div className="mt-2 rounded-lg border border-dashed p-3">
          <p className="mb-1 text-xs font-semibold text-muted-foreground">
            Chứng từ đã gỡ ({removed.length})
          </p>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {removed.map(item => (
              <li key={item.id}>
                {ATTACHMENT_KIND_LABEL[item.kind]}
                {item.note ? ` “${item.note}”` : ''} — tải lên bởi{' '}
                {item.uploadedByName}, gỡ bởi {item.deletedByName}
                {item.deletedAt ? ` lúc ${formatDateTime(item.deletedAt)}` : ''}
                . Lý do: {item.deleteReason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {removing && (
        <ReasonDialog
          key={removing.id}
          title="Gỡ chứng từ"
          description="Chứng từ sẽ ẩn khỏi báo cáo nhưng vẫn lưu vết người gỡ và lý do."
          placeholder="Lý do gỡ (VD: tải nhầm ảnh)..."
          confirmLabel="Gỡ chứng từ"
          onConfirm={handleRemove}
          onClose={() => setRemoving(null)}
        />
      )}
    </ReportSection>
  );
};

export default EvidenceSection;
