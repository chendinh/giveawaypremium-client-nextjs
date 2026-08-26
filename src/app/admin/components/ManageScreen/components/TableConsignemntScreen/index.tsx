'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  Loader2,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Mail,
  DollarSign,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Save,
  Copy,
  Check,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

import GapService from '@/app/actions/GapServices';
import { StoreServices, useAppStore } from '@/store/useAppStore';

import './style.scss';

// ─── Helpers ──────────────────────────────────────────
const numberWithCommas = (x: number | string): string =>
  x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** Format tiền VND — luôn làm tròn số nguyên trước khi format để tránh float artifact */
const formatVND = (valueInThousands: number): string => {
  const rounded = Math.round(valueInThousands * 1000);
  return `${numberWithCommas(rounded)}đ`;
};

/** Tính giá sau phí theo bracket — đơn vị nghìn đồng */
const calcPriceAfterFee = (price: number): number => {
  if (price <= 0) return 0;
  if (price < 1000) return Math.round((price * 74) / 100);
  if (price <= 10000) return Math.round((price * 77) / 100);
  return Math.round((price * 80) / 100);
};

// ─── Types ────────────────────────────────────────────
interface ProductItem {
  hashCode?: string;
  code?: string;
  name?: string;
  price: number | string;
  count: number;
  priceAfterFee?: number | string;
  totalPriceAfterFee?: number | string;
  soldNumberProduct?: number;
  remainNumberProduct?: number;
  note?: string;
  isNew?: string;
  rateNew?: number;
  isDeleted?: boolean;
  [key: string]: unknown;
}

interface ConsignmentItem {
  objectId: string;
  consignmentId: string;
  consignerName?: string;
  phoneNumber?: string;
  numberOfProducts?: number;
  numSoldConsignment?: number;
  moneyBack?: number;
  isGetMoney?: boolean;
  isTransferMoneyWithBank?: boolean;
  timeGetMoney?: string;
  timeConfirmGetMoney?: string;
  note?: string;
  productList?: ProductItem[];
  group?: { objectId: string; code?: string };
  banks?: Array<{ type?: string; accNumber?: string }>;
  bankName?: string;
  bankId?: string;
  consignerIdCard?: string;
}

interface TagItem {
  objectId: string;
  code: string;
  timeGetMoney: string;
}

interface SearchFilters {
  phoneNumber: string;
  consignerName: string;
  consignmentId: string;
  isGetMoney: string;
}

// ─── Sensitive fields — thay đổi sẽ tạo audit log ──────
const SENSITIVE_PRODUCT_FIELDS: (keyof ProductItem)[] = [
  'price',
  'count',
  'soldNumberProduct',
];

const isSensitiveField = (field: keyof ProductItem): boolean =>
  SENSITIVE_PRODUCT_FIELDS.includes(field);
/** Tạo audit note khi thay đổi field nhạy cảm */
const buildAuditNote = (
  staffName: string,
  consignmentId: string,
  changes: Array<{
    productCode: string;
    field: string;
    oldVal: unknown;
    newVal: unknown;
  }>
): string => {
  if (changes.length === 0) return '';
  const time = format(new Date(), 'dd/MM/yyyy HH:mm');
  const fieldLabel: Record<string, string> = {
    price: 'Giá',
    count: 'Số lượng',
    soldNumberProduct: 'Số lượng đã bán',
  };
  const lines = changes.map(
    c =>
      `  • SP [${c.productCode || '?'}]: ${fieldLabel[c.field] || c.field} ${c.oldVal} → ${c.newVal}`
  );
  return `[${time}] ${staffName} sửa đơn ${consignmentId}:\n${lines.join('\n')}`;
};

// ─── Copy cell — hiển thị text + icon copy, không trigger row expand ──────────
const CopyCell: React.FC<{
  value?: string | null;
  className?: string;
}> = ({ value, className }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation(); // không trigger toggleExpand trên TableRow
    if (!value) return;
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 group cursor-default',
        className
      )}
    >
      <span>{value || '---'}</span>
      {value && (
        <button
          type="button"
          onClick={handleCopy}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground ml-0.5"
          title="Sao chép"
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </button>
      )}
    </span>
  );
};

// ─── Inline editable product row ──────────────────────
interface EditableProductRowProps {
  product: ProductItem;
  originalProduct: ProductItem;
  index: number;
  onChange: (index: number, field: keyof ProductItem, value: string) => void;
}

const EditableProductRow: React.FC<EditableProductRowProps> = ({
  product,
  originalProduct,
  index,
  onChange,
}) => {
  const priceAfterFee = Number(product.priceAfterFee) || 0;
  const sold = Number(product.soldNumberProduct) || 0;
  const remain = Number(product.count) - sold;
  const totalAfterFee = Math.round(sold * priceAfterFee);

  return (
    <TableRow>
      <TableCell className="text-xs font-mono text-muted-foreground">
        {product.code || `#${index + 1}`}
      </TableCell>
      <TableCell>
        <Input
          className="h-7 text-xs w-full min-w-[120px]"
          value={product.name || ''}
          onChange={e => onChange(index, 'name', e.target.value)}
          placeholder="Tên SP"
        />
      </TableCell>
      {/* Giá — sensitive */}
      <TableCell>
        <div className="relative">
          <Input
            className={cn(
              'h-7 text-xs w-[90px] pr-4',
              String(product.price) !== String(originalProduct.price) &&
                'border-orange-400 bg-orange-50'
            )}
            type="number"
            value={product.price}
            onChange={e => onChange(index, 'price', e.target.value)}
            placeholder="Giá"
          />
          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">
            k
          </span>
        </div>
      </TableCell>
      {/* Giá sau phí — readonly, tính từ price */}
      <TableCell className="text-xs text-right whitespace-nowrap text-muted-foreground">
        {priceAfterFee > 0
          ? `${numberWithCommas(priceAfterFee * 1000)}đ`
          : '---'}
      </TableCell>
      {/* Số lượng — sensitive */}
      <TableCell>
        <Input
          className={cn(
            'h-7 text-xs w-16 text-center',
            String(product.count) !== String(originalProduct.count) &&
              'border-orange-400 bg-orange-50'
          )}
          type="number"
          min={0}
          value={product.count}
          onChange={e => onChange(index, 'count', e.target.value)}
        />
      </TableCell>
      {/* Đã bán — sensitive, editable */}
      <TableCell>
        <Input
          className={cn(
            'h-7 text-xs w-16 text-center',
            String(product.soldNumberProduct) !==
              String(originalProduct.soldNumberProduct) &&
              'border-orange-400 bg-orange-50'
          )}
          type="number"
          min={0}
          max={Number(product.count)}
          value={product.soldNumberProduct ?? 0}
          onChange={e => onChange(index, 'soldNumberProduct', e.target.value)}
        />
      </TableCell>
      {/* Còn lại — readonly */}
      <TableCell
        className={cn(
          'text-xs text-right font-medium',
          remain === 0 && 'text-red-500'
        )}
      >
        {remain}
      </TableCell>
      {/* Tổng tiền sau phí — readonly */}
      <TableCell className="text-xs text-right whitespace-nowrap font-medium text-green-700">
        {totalAfterFee > 0
          ? `${numberWithCommas(totalAfterFee * 1000)}đ`
          : '---'}
      </TableCell>
      <TableCell>
        <Input
          className="h-7 text-xs w-full min-w-[100px]"
          value={product.note || ''}
          onChange={e => onChange(index, 'note', e.target.value)}
          placeholder="Ghi chú"
        />
      </TableCell>
    </TableRow>
  );
};

// ─── Component ────────────────────────────────────────
const TableConsignmentScreen: React.FC = () => {
  const { userData } = useAppStore();
  const [dataSource, setDataSource] = useState<ConsignmentItem[]>([]);
  const [allInfoTag, setAllInfoTag] = useState<TagItem[]>([]);
  const [currentTagId, setCurrentTagId] = useState<string>('');
  const [currentTagCode, setCurrentTagCode] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingTags, setIsLoadingTags] = useState<boolean>(false);

  // draftFilters — state người dùng đang nhập (chưa submit)
  const [draftFilters, setDraftFilters] = useState<SearchFilters>({
    phoneNumber: '',
    consignerName: '',
    consignmentId: '',
    isGetMoney: '',
  });
  // committedFilters — filters đã bấm Tìm, dùng để fetch
  const [committedFilters, setCommittedFilters] = useState<SearchFilters>({
    phoneNumber: '',
    consignerName: '',
    consignmentId: '',
    isGetMoney: '',
  });

  // Expanded rows — key: objectId, value: draft edits
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [rowDrafts, setRowDrafts] = useState<Record<string, ConsignmentItem>>(
    {}
  );
  const [savingRows, setSavingRows] = useState<Set<string>>(new Set());

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string>('');

  const pageSize = 100;

  // ── Fetch tags — dùng store cache, không gọi lại nếu đã có ──
  const fetchAllTags = useCallback(async () => {
    setIsLoadingTags(true);
    try {
      const tags = await StoreServices.getConsignmentTags();
      setAllInfoTag(tags);
      if (tags.length > 0 && !currentTagId) {
        setCurrentTagId(tags[0].objectId);
        setCurrentTagCode(tags[0].code);
      }
    } catch {
      /* silent */
    }
    setIsLoadingTags(false);
  }, [currentTagId]);

  // ── Fetch consignments ──
  const fetchConsignments = useCallback(
    async (page: number = 1, tagId?: string) => {
      const groupId = tagId || currentTagId;
      if (!groupId) return;
      setIsLoading(true);
      try {
        const hasFilters =
          committedFilters.phoneNumber ||
          committedFilters.consignerName ||
          committedFilters.consignmentId ||
          committedFilters.isGetMoney !== '';

        let res: any;
        if (hasFilters) {
          res = await GapService.getConsignmentWithFilters(
            page,
            {
              phoneNumber: committedFilters.phoneNumber || undefined,
              consignerName: committedFilters.consignerName || undefined,
              consignmentId: committedFilters.consignmentId || undefined,
              isGetMoney:
                committedFilters.isGetMoney === 'true'
                  ? true
                  : committedFilters.isGetMoney === 'false'
                    ? false
                    : null,
              groupId,
            },
            pageSize
          );
        } else {
          res = await GapService.getConsignment(page, null, pageSize, groupId);
        }

        if (res?.results) {
          setDataSource(res.results);
          setTotalCount(res.count || res.results.length);
        } else {
          setDataSource([]);
          setTotalCount(0);
        }
      } catch {
        toast.error('Không thể tải dữ liệu');
      }
      setIsLoading(false);
    },
    [currentTagId, committedFilters]
  );

  useEffect(() => {
    fetchAllTags();
  }, [fetchAllTags]);
  useEffect(() => {
    if (currentTagId) {
      setCurrentPage(1);
      fetchConsignments(1, currentTagId);
    }
  }, [currentTagId, fetchConsignments]);

  const handleTagChange = (tagCode: string) => {
    const tag = allInfoTag.find(t => t.code === tagCode);
    if (tag) {
      setCurrentTagId(tag.objectId);
      setCurrentTagCode(tag.code);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    // Commit draftFilters → triggering useEffect → fetchConsignments
    setCommittedFilters({ ...draftFilters });
  };
  const handleResetSearch = () => {
    const empty: SearchFilters = {
      phoneNumber: '',
      consignerName: '',
      consignmentId: '',
      isGetMoney: '',
    };
    setDraftFilters(empty);
    setCommittedFilters(empty);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchConsignments(page);
  };
  const totalPages = Math.ceil(totalCount / pageSize);

  // ── Expand/collapse row ──
  const toggleExpand = (item: ConsignmentItem) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(item.objectId)) {
        next.delete(item.objectId);
      } else {
        next.add(item.objectId);
        // Init draft from current data
        setRowDrafts(d => ({
          ...d,
          [item.objectId]: {
            ...item,
            productList: item.productList ? [...item.productList] : [],
          },
        }));
      }
      return next;
    });
  };

  // ── Draft mutations ──
  const updateDraftField = (
    objectId: string,
    field: keyof ConsignmentItem,
    value: unknown
  ) => {
    setRowDrafts(d => ({
      ...d,
      [objectId]: { ...d[objectId], [field]: value },
    }));
  };

  const updateDraftProduct = (
    objectId: string,
    pIdx: number,
    field: keyof ProductItem,
    value: string
  ) => {
    setRowDrafts(d => {
      const draft = { ...d[objectId] };
      const list = [...(draft.productList || [])];
      const current = { ...list[pIdx] };

      // price và count cần là number để API không reject
      const parsed = isSensitiveField(field) ? Number(value) || 0 : value;
      current[field] = parsed;

      // Khi giá thay đổi → recalc priceAfterFee và totalPriceAfterFee
      if (field === 'price') {
        const newPrice = Number(value) || 0;
        const newPriceAfterFee = calcPriceAfterFee(newPrice);
        const sold = Number(current.soldNumberProduct) || 0;
        current.priceAfterFee = newPriceAfterFee;
        current.totalPriceAfterFee = Math.round(sold * newPriceAfterFee);
      }

      // Khi count thay đổi → recalc remainNumberProduct và totalPriceAfterFee
      if (field === 'count') {
        const newCount = Number(value) || 0;
        const sold = Number(current.soldNumberProduct) || 0;
        const priceAfterFee = Number(current.priceAfterFee) || 0;
        current.remainNumberProduct = newCount - sold;
        current.totalPriceAfterFee = Math.round(sold * priceAfterFee);
      }

      // Khi soldNumberProduct thay đổi → recalc remainNumberProduct và totalPriceAfterFee
      if (field === 'soldNumberProduct') {
        const sold = Number(value) || 0;
        const count = Number(current.count) || 0;
        const priceAfterFee = Number(current.priceAfterFee) || 0;
        current.remainNumberProduct = count - sold;
        current.totalPriceAfterFee = Math.round(sold * priceAfterFee);
      }

      // Khi đã bán thay đổi → recalc remainNumberProduct và totalPriceAfterFee
      if (field === 'soldNumberProduct') {
        const newSold = Number(value) || 0;
        const count = Number(current.count) || 0;
        const priceAfterFee = Number(current.priceAfterFee) || 0;
        current.remainNumberProduct = count - newSold;
        current.totalPriceAfterFee = Math.round(newSold * priceAfterFee);
      }

      list[pIdx] = current;
      return { ...d, [objectId]: { ...draft, productList: list } };
    });
  };

  // ── Save draft — detect sensitive changes & append audit note ──
  const handleSaveRow = async (objectId: string) => {
    const draft = rowDrafts[objectId];
    const original = dataSource.find(i => i.objectId === objectId);
    if (!draft || !original) return;

    setSavingRows(prev => new Set(prev).add(objectId));
    try {
      // Detect sensitive product field changes
      const sensitiveChanges: Array<{
        productCode: string;
        field: string;
        oldVal: unknown;
        newVal: unknown;
      }> = [];

      draft.productList?.forEach((draftP, idx) => {
        const origP = original.productList?.[idx];
        if (!origP) return;
        SENSITIVE_PRODUCT_FIELDS.forEach(field => {
          if (String(draftP[field]) !== String(origP[field])) {
            const fieldStr = String(field);
            sensitiveChanges.push({
              productCode: draftP.code || origP.code || `#${idx + 1}`,
              field: fieldStr,
              oldVal:
                fieldStr === 'price'
                  ? `${numberWithCommas(Number(origP[field]) * 1000)}đ`
                  : origP[field],
              newVal:
                fieldStr === 'price'
                  ? `${numberWithCommas(Number(draftP[field]) * 1000)}đ`
                  : (draftP[field] as unknown),
            });
          }
        });
      });

      // Build audit note và append (không cho sửa, nên append vào cuối)
      let finalNote = draft.note || '';
      if (sensitiveChanges.length > 0) {
        const staffName =
          userData?.fullName || userData?.username || 'Nhân viên';
        const auditNote = buildAuditNote(
          staffName,
          draft.consignmentId,
          sensitiveChanges
        );
        // Append audit note với separator
        finalNote = finalNote ? `${finalNote}\n---\n${auditNote}` : auditNote;
      }

      // Nếu isGetMoney thay đổi → sync timeConfirmGetMoney + append audit note
      let finalIsGetMoney = draft.isGetMoney;
      let finalTimeConfirm = draft.timeConfirmGetMoney;
      if (original.isGetMoney !== draft.isGetMoney) {
        const staffName =
          userData?.fullName || userData?.username || 'Nhân viên';
        const time = format(new Date(), 'dd/MM/yyyy HH:mm');
        const paymentNote = draft.isGetMoney
          ? `[${time}] ${staffName} xác nhận ĐÃ TRẢ TIỀN cho đơn ${draft.consignmentId}`
          : `[${time}] ${staffName} huỷ xác nhận trả tiền cho đơn ${draft.consignmentId}`;
        finalNote = finalNote
          ? `${finalNote}\n---\n${paymentNote}`
          : paymentNote;

        if (draft.isGetMoney) {
          finalTimeConfirm = format(new Date(), 'dd-MM-yyyy HH:mm');
        } else {
          finalTimeConfirm = undefined;
        }
        finalIsGetMoney = draft.isGetMoney;
      }

      const finalDraft = {
        ...draft,
        note: finalNote,
        isGetMoney: finalIsGetMoney,
        timeConfirmGetMoney: finalTimeConfirm,
      };

      // Detect payment status change: false → true
      const paymentJustConfirmed =
        original.isGetMoney === false && finalIsGetMoney === true;

      const res = await GapService.updateConsignment(finalDraft);
      if (res) {
        toast.success('Cập nhật thành công');

        // Tự động gửi email xác nhận thanh toán khi trạng thái chuyển → đã trả
        if (paymentJustConfirmed) {
          try {
            await GapService.sendPaymentConfirmationEmail(
              finalDraft as ConsignmentItem
            );
            toast.success('Đã gửi email xác nhận thanh toán');
          } catch {
            toast.error('Có lỗi khi gửi email xác nhận thanh toán');
          }
        }
        // Tính lại các giá trị tổng từ productList đã cập nhật
        const updatedProducts = finalDraft.productList || [];
        const recalcedNumberOfProducts = updatedProducts.reduce(
          (acc: number, p: ProductItem) => acc + (Number(p.count) || 0),
          0
        );
        const recalcedNumSold = updatedProducts.reduce(
          (acc: number, p: ProductItem) =>
            acc + (Number(p.soldNumberProduct) || 0),
          0
        );
        const recalcedMoneyBack = updatedProducts.reduce(
          (acc: number, p: ProductItem) =>
            acc +
            (Number(p.priceAfterFee) || calcPriceAfterFee(Number(p.price))) *
              (Number(p.soldNumberProduct) || 0),
          0
        );
        const mergedItem: ConsignmentItem = {
          ...finalDraft,
          numberOfProducts: recalcedNumberOfProducts,
          numSoldConsignment: recalcedNumSold,
          moneyBack: Math.round(recalcedMoneyBack * 100) / 100, // làm tròn 2 chữ số để tránh float lẻ
          isGetMoney: finalIsGetMoney,
          timeConfirmGetMoney: finalTimeConfirm,
        };
        setDataSource(prev =>
          prev.map(i => (i.objectId === objectId ? mergedItem : i))
        );
        setExpandedRows(prev => {
          const n = new Set(prev);
          n.delete(objectId);
          return n;
        });
      } else {
        toast.error('Cập nhật thất bại');
      }
    } catch {
      toast.error('Có lỗi xảy ra');
    }
    setSavingRows(prev => {
      const n = new Set(prev);
      n.delete(objectId);
      return n;
    });
  };

  // ── Toggle get money ──
  const handleToggleGetMoney = async (item: ConsignmentItem) => {
    const newIsGetMoney = !item.isGetMoney;
    const newTimeConfirm = newIsGetMoney
      ? format(new Date(), 'dd-MM-yyyy HH:mm')
      : undefined;

    // Append payment audit note
    const staffName = userData?.fullName || userData?.username || 'Nhân viên';
    const time = format(new Date(), 'dd/MM/yyyy HH:mm');
    const paymentNote = newIsGetMoney
      ? `[${time}] ${staffName} xác nhận ĐÃ TRẢ TIỀN cho đơn ${item.consignmentId}`
      : `[${time}] ${staffName} huỷ xác nhận trả tiền cho đơn ${item.consignmentId}`;
    const updatedNote = item.note
      ? `${item.note}\n---\n${paymentNote}`
      : paymentNote;

    try {
      const res = await GapService.updateConsignmentPayment(
        item.objectId,
        newIsGetMoney,
        newTimeConfirm,
        updatedNote
      );
      if (res) {
        toast.success(
          newIsGetMoney ? 'Đã xác nhận trả tiền' : 'Đã huỷ xác nhận'
        );
        // Tự động gửi email xác nhận chuyển khoản khi đánh dấu đã trả tiền
        if (newIsGetMoney) {
          GapService.sendPaymentConfirmationEmail(item.objectId).catch(() => {
            toast.warning(
              'Xác nhận thành công nhưng gửi email thất bại. Vui lòng gửi lại thủ công.'
            );
          });
        }
        // Cập nhật local state ngay, không cần fetch lại cả trang
        setDataSource(prev =>
          prev.map(i =>
            i.objectId === item.objectId
              ? {
                  ...i,
                  isGetMoney: newIsGetMoney,
                  timeConfirmGetMoney: newIsGetMoney
                    ? newTimeConfirm
                    : undefined,
                  note: updatedNote,
                }
              : i
          )
        );
      } else {
        toast.error('Cập nhật thất bại');
      }
    } catch {
      toast.error('Có lỗi xảy ra');
    }
  };

  // ── Delete ──
  const openDeleteDialog = (objectId: string) => {
    setDeletingId(objectId);
    setDeleteDialogOpen(true);
  };
  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      const res = await GapService.deleteConsignment(deletingId);
      if (res) {
        toast.success('Đã xoá');
        setDeleteDialogOpen(false);
        fetchConsignments(currentPage);
      } else toast.error('Xoá thất bại');
    } catch {
      toast.error('Có lỗi xảy ra');
    }
  };

  // ── Send email ──
  const handleSendEmail = async (item: ConsignmentItem) => {
    try {
      await GapService.sendEmailTongketWithObjectId(item.objectId);
      toast.success('Đã gửi email tổng kết');
    } catch {
      toast.error('Có lỗi xảy ra');
    }
  };

  // ── Send payment confirmation email ──
  const handleSendPaymentEmail = async (item: ConsignmentItem) => {
    try {
      await GapService.sendPaymentConfirmationEmail(item);
      toast.success('Đã gửi email xác nhận thanh toán');
    } catch {
      toast.error('Có lỗi khi gửi email');
    }
  };

  const handleSendEmailAll = async () => {
    if (!currentTagId) return;
    try {
      await GapService.sendEmailTongketALLWithObjectIdConsigment(currentTagId);
      toast.success('Đã gửi email tổng kết cho cả đợt');
    } catch {
      toast.error('Có lỗi xảy ra');
    }
  };

  // ── Render ──
  return (
    <div className="table-consignment-container space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={currentTagCode} onValueChange={handleTagChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Chọn đợt..." />
          </SelectTrigger>
          <SelectContent>
            {isLoadingTags ? (
              <SelectItem value="loading" disabled>
                Đang tải...
              </SelectItem>
            ) : (
              allInfoTag.map(tag => (
                <SelectItem key={tag.objectId} value={tag.code}>
                  {tag.code}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchConsignments(currentPage)}
        >
          <RefreshCw
            className={cn('h-4 w-4 mr-1', isLoading && 'animate-spin')}
          />
          Làm mới
        </Button>

        <Button variant="outline" size="sm" onClick={handleSendEmailAll}>
          <Mail className="h-4 w-4 mr-1" />
          Gửi email cả đợt
        </Button>

        <span className="text-sm text-muted-foreground ml-auto">
          Tổng: {totalCount} đơn
        </span>
      </div>

      {/* Search */}
      <div className="flex flex-wrap items-end gap-3 p-3 border rounded-lg bg-muted/30">
        <div className="space-y-1">
          <Label className="text-xs">SĐT</Label>
          <Input
            className="w-[140px] h-8 text-sm"
            value={draftFilters.phoneNumber}
            onChange={e =>
              setDraftFilters(p => ({ ...p, phoneNumber: e.target.value }))
            }
            placeholder="Số điện thoại"
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Tên KH</Label>
          <Input
            className="w-[140px] h-8 text-sm"
            value={draftFilters.consignerName}
            onChange={e =>
              setDraftFilters(p => ({ ...p, consignerName: e.target.value }))
            }
            placeholder="Tên khách hàng"
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Mã KG</Label>
          <Input
            className="w-[120px] h-8 text-sm"
            value={draftFilters.consignmentId}
            onChange={e =>
              setDraftFilters(p => ({ ...p, consignmentId: e.target.value }))
            }
            placeholder="Mã ký gửi"
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Trả tiền</Label>
          <Select
            value={draftFilters.isGetMoney}
            onValueChange={val =>
              setDraftFilters(p => ({
                ...p,
                isGetMoney: val === 'all' ? '' : val,
              }))
            }
          >
            <SelectTrigger className="w-[110px] h-8 text-sm">
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="true">Đã trả</SelectItem>
              <SelectItem value="false">Chưa trả</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" className="h-8" onClick={handleSearch}>
          <Search className="h-3 w-3 mr-1" />
          Tìm
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8"
          onClick={handleResetSearch}
        >
          Xoá lọc
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8 p-1" />
              <TableHead>Mã KG</TableHead>
              <TableHead>Tên KH</TableHead>
              <TableHead>SĐT</TableHead>
              <TableHead className="text-right">SL</TableHead>
              <TableHead className="text-right">Đã bán</TableHead>
              <TableHead className="text-right">Còn lại</TableHead>
              <TableHead className="text-right">Tiền trả KH</TableHead>
              <TableHead>Ngân hàng</TableHead>
              <TableHead>ID NH</TableHead>
              <TableHead className="w-[120px] text-center">Trả tiền</TableHead>
              <TableHead className="w-[150px] text-right">
                Thời gian TT
              </TableHead>
              <TableHead className="max-w-[180px]">Ghi chú</TableHead>
              <TableHead className="w-[100px] text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={15} className="text-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : dataSource.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={15}
                  className="text-center py-10 text-muted-foreground"
                >
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              dataSource.map((item, index) => {
                const isExpanded = expandedRows.has(item.objectId);
                const draft = rowDrafts[item.objectId] || item;
                const isSaving = savingRows.has(item.objectId);
                const remain =
                  (item.numberOfProducts || 0) - (item.numSoldConsignment || 0);

                return (
                  <React.Fragment key={item.objectId}>
                    {/* Main row — click anywhere to expand */}
                    <TableRow
                      className={cn(
                        'cursor-pointer select-none transition-colors',
                        item.isGetMoney
                          ? 'bg-green-50 hover:bg-green-100'
                          : 'hover:bg-muted/50',
                        isExpanded && 'bg-muted/40 border-b-0'
                      )}
                      onClick={() => toggleExpand(item)}
                    >
                      <TableCell className="p-1">
                        <span className="text-muted-foreground">
                          {isExpanded ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        <CopyCell value={item.consignmentId} />
                      </TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">
                        {item.consignerName}
                      </TableCell>
                      <TableCell className="text-xs">
                        <CopyCell value={item.phoneNumber} />
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {item.numberOfProducts}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {item.numSoldConsignment || 0}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {remain}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {item.moneyBack
                          ? formatVND(Number(item.moneyBack))
                          : '---'}
                      </TableCell>
                      <TableCell className="text-xs max-w-[100px] truncate">
                        {item.banks?.[0]?.type || item.bankName || '---'}
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        <CopyCell
                          value={
                            item.banks?.[0]?.accNumber ||
                            item.bankId ||
                            undefined
                          }
                        />
                      </TableCell>
                      <TableCell className="text-center w-[120px]">
                        {item.isGetMoney ? (
                          <Badge
                            variant="default"
                            className="bg-green-500 text-xs w-[75px]"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Đã trả
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            <XCircle className="h-3 w-3 mr-1" />
                            Chưa
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {item.timeConfirmGetMoney || '---'}
                      </TableCell>
                      <TableCell
                        className="text-xs max-w-[180px]"
                        title={
                          item.note
                            ? item.note
                                .split('\n---\n')
                                .filter(s => !s.trim().startsWith('['))
                                .join('\n---\n')
                            : undefined
                        }
                      >
                        <span className="line-clamp-2 text-muted-foreground">
                          {item.note
                            ? item.note
                                .split('\n---\n')
                                .filter(s => !s.trim().startsWith('['))
                                .join(' / ') || '---'
                            : '---'}
                        </span>
                      </TableCell>
                      <TableCell
                        className="text-right"
                        onClick={e => e.stopPropagation()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleToggleGetMoney(item)}
                            >
                              <DollarSign className="h-4 w-4 mr-2" />
                              {item.isGetMoney
                                ? 'Huỷ trả tiền'
                                : 'Xác nhận trả tiền'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleSendEmail(item)}
                            >
                              <Mail className="h-4 w-4 mr-2" />
                              Gửi email
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleSendPaymentEmail(item)}
                              className="text-green-600"
                            >
                              <DollarSign className="h-4 w-4 mr-2" />
                              Gửi email đã trả tiền
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(item.objectId)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Xoá
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>

                    {/* Expanded inline edit panel */}
                    {isExpanded && (
                      <TableRow>
                        <TableCell
                          colSpan={15}
                          className="p-0 border-b"
                          onClick={e => e.stopPropagation()}
                        >
                          <div className="bg-muted/20 border-t border-dashed px-6 py-4 space-y-4">
                            {/* Header row */}
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                Chi tiết — {draft.consignmentId}
                              </p>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => toggleExpand(item)}
                                >
                                  Đóng
                                </Button>
                                <Button
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => handleSaveRow(item.objectId)}
                                  disabled={isSaving}
                                >
                                  {isSaving ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                                  ) : (
                                    <Save className="h-3.5 w-3.5 mr-1" />
                                  )}
                                  Lưu thay đổi
                                </Button>
                              </div>
                            </div>

                            {/* Fields grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">
                                  Mã ký gửi
                                </Label>
                                <p className="h-8 flex items-center text-sm font-mono text-muted-foreground px-1">
                                  {draft.consignmentId || '---'}
                                </p>
                              </div>
                              <div className="space-y-1 col-span-2">
                                <Label className="text-xs text-muted-foreground">
                                  Ghi chú
                                </Label>
                                <Input
                                  className="h-8 text-sm"
                                  value={(draft.note || '')
                                    .split('\n---\n')
                                    .filter(s => !s.trim().startsWith('['))
                                    .join('\n---\n')}
                                  onChange={e => {
                                    const auditParts = (draft.note || '')
                                      .split('\n---\n')
                                      .filter(s => s.trim().startsWith('['));
                                    const newNote =
                                      auditParts.length > 0
                                        ? `${e.target.value}\n---\n${auditParts.join('\n---\n')}`
                                        : e.target.value;
                                    updateDraftField(
                                      item.objectId,
                                      'note',
                                      newNote
                                    );
                                  }}
                                  placeholder="Ghi chú đơn ký gửi..."
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">
                                  Trạng thái tiền
                                </Label>
                                <div className="flex items-center gap-2 h-8">
                                  <Switch
                                    checked={draft.isGetMoney || false}
                                    onCheckedChange={checked =>
                                      updateDraftField(
                                        item.objectId,
                                        'isGetMoney',
                                        checked
                                      )
                                    }
                                  />
                                  <span
                                    className={cn(
                                      'text-xs font-medium',
                                      draft.isGetMoney
                                        ? 'text-green-600'
                                        : 'text-orange-500'
                                    )}
                                  >
                                    {draft.isGetMoney
                                      ? 'Đã trả tiền'
                                      : 'Chưa trả'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Product list */}
                            {draft.productList &&
                            draft.productList.length > 0 ? (
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                  Sản phẩm ({draft.productList.length})
                                  <span className="ml-2 normal-case font-normal text-orange-500">
                                    — Giá/SL là trường nhạy cảm, thay đổi sẽ tự
                                    ghi log
                                  </span>
                                </p>
                                <div className="border rounded-md overflow-hidden">
                                  <Table>
                                    <TableHeader>
                                      <TableRow className="bg-muted/40">
                                        <TableHead className="text-xs h-8 w-24">
                                          Mã SP
                                        </TableHead>
                                        <TableHead className="text-xs h-8">
                                          Tên sản phẩm
                                        </TableHead>
                                        <TableHead className="text-xs h-8 w-[110px]">
                                          Giá (nghìn đ){' '}
                                          <span className="text-orange-400">
                                            ⚠
                                          </span>
                                        </TableHead>
                                        <TableHead className="text-xs h-8 text-right w-[110px]">
                                          Giá sau phí
                                        </TableHead>
                                        <TableHead className="text-xs h-8 w-20 text-center">
                                          SL{' '}
                                          <span className="text-orange-400">
                                            ⚠
                                          </span>
                                        </TableHead>
                                        <TableHead className="text-xs h-8 text-right w-16">
                                          Đã bán{' '}
                                          <span className="text-orange-400">
                                            ⚠
                                          </span>
                                        </TableHead>
                                        <TableHead className="text-xs h-8 text-right w-16">
                                          Còn lại
                                        </TableHead>
                                        <TableHead className="text-xs h-8 text-right w-[120px]">
                                          Tổng tiền sau phí
                                        </TableHead>
                                        <TableHead className="text-xs h-8">
                                          Ghi chú SP
                                        </TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {draft.productList.map((p, pIdx) => {
                                        const origP =
                                          dataSource.find(
                                            i => i.objectId === item.objectId
                                          )?.productList?.[pIdx] ?? p;
                                        return (
                                          <EditableProductRow
                                            key={pIdx}
                                            product={p}
                                            originalProduct={origP}
                                            index={pIdx}
                                            onChange={(i, field, val) =>
                                              updateDraftProduct(
                                                item.objectId,
                                                i,
                                                field,
                                                val
                                              )
                                            }
                                          />
                                        );
                                      })}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground italic">
                                Chưa có sản phẩm
                              </p>
                            )}

                            {/* Audit log — readonly */}
                            {draft.note?.includes('[') && (
                              <div className="space-y-1">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                  Lịch sử thay đổi
                                </p>
                                <pre className="text-xs bg-amber-50 border border-amber-200 rounded p-3 whitespace-pre-wrap font-mono text-muted-foreground select-all cursor-default">
                                  {draft.note
                                    .split('\n---\n')
                                    .filter(s => s.trim().startsWith('['))
                                    .join('\n---\n')}
                                </pre>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-4">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Trang {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xoá</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xoá đơn ký gửi này? Hành động không thể hoàn
              tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Xoá
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TableConsignmentScreen;
