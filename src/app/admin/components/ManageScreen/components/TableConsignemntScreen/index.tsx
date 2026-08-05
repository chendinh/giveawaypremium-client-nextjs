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
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

import GapService from '@/app/actions/GapServices';
import { StoreServices } from '@/store/useAppStore';

import './style.scss';

// ─── Helpers ──────────────────────────────────────────
const numberWithCommas = (x: number | string): string =>
  x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// ─── Types ────────────────────────────────────────────
interface ProductItem {
  hashCode?: string;
  code?: string;
  name?: string;
  price: number | string;
  count: number;
  priceAfterFee?: number | string;
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

// ─── Inline editable product row ──────────────────────
interface EditableProductRowProps {
  product: ProductItem;
  index: number;
  onChange: (index: number, field: keyof ProductItem, value: string) => void;
}

const EditableProductRow: React.FC<EditableProductRowProps> = ({
  product,
  index,
  onChange,
}) => (
  <TableRow>
    <TableCell className="text-xs text-muted-foreground">{index + 1}</TableCell>
    <TableCell>
      <Input
        className="h-7 text-xs w-full min-w-[120px]"
        value={product.name || ''}
        onChange={e => onChange(index, 'name', e.target.value)}
        placeholder="Tên SP"
      />
    </TableCell>
    <TableCell className="text-xs text-right whitespace-nowrap">
      {numberWithCommas(Number(product.price) * 1000)}đ
    </TableCell>
    <TableCell className="text-xs text-right">{product.count}</TableCell>
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

// ─── Component ────────────────────────────────────────
const TableConsignmentScreen: React.FC = () => {
  const [dataSource, setDataSource] = useState<ConsignmentItem[]>([]);
  const [allInfoTag, setAllInfoTag] = useState<TagItem[]>([]);
  const [currentTagId, setCurrentTagId] = useState<string>('');
  const [currentTagCode, setCurrentTagCode] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingTags, setIsLoadingTags] = useState<boolean>(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
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

  const pageSize = 20;

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
        let res: any;
        if (searchFilters.phoneNumber) {
          res = await GapService.getConsignmentWithPhoneIncludeText(
            page,
            searchFilters.phoneNumber,
            pageSize
          );
        } else {
          res = await GapService.getConsignment(page, null, pageSize, groupId);
        }
        if (res?.results) {
          let filtered: ConsignmentItem[] = res.results;
          if (searchFilters.consignerName) {
            const kw = searchFilters.consignerName.toLowerCase();
            filtered = filtered.filter(i =>
              i.consignerName?.toLowerCase().includes(kw)
            );
          }
          if (searchFilters.consignmentId) {
            const kw = searchFilters.consignmentId.toLowerCase();
            filtered = filtered.filter(i =>
              i.consignmentId?.toLowerCase().includes(kw)
            );
          }
          if (searchFilters.isGetMoney === 'true')
            filtered = filtered.filter(i => i.isGetMoney);
          else if (searchFilters.isGetMoney === 'false')
            filtered = filtered.filter(i => !i.isGetMoney);
          setDataSource(filtered);
          setTotalCount(res.count || filtered.length);
        } else {
          setDataSource([]);
          setTotalCount(0);
        }
      } catch {
        toast.error('Không thể tải dữ liệu');
      }
      setIsLoading(false);
    },
    [currentTagId, searchFilters]
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
    fetchConsignments(1);
  };
  const handleResetSearch = () => {
    setSearchFilters({
      phoneNumber: '',
      consignerName: '',
      consignmentId: '',
      isGetMoney: '',
    });
    setCurrentPage(1);
    fetchConsignments(1);
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
      list[pIdx] = { ...list[pIdx], [field]: value };
      return { ...d, [objectId]: { ...draft, productList: list } };
    });
  };

  // ── Save draft ──
  const handleSaveRow = async (objectId: string) => {
    const draft = rowDrafts[objectId];
    if (!draft) return;
    setSavingRows(prev => new Set(prev).add(objectId));
    try {
      const res = await GapService.updateConsignment(draft);
      if (res) {
        toast.success('Cập nhật thành công');
        setDataSource(prev =>
          prev.map(i => (i.objectId === objectId ? { ...i, ...draft } : i))
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
    const updated = {
      ...item,
      isGetMoney: !item.isGetMoney,
      timeConfirmGetMoney: !item.isGetMoney
        ? format(new Date(), 'dd-MM-yyyy HH:mm')
        : '',
    };
    try {
      const res = await GapService.updateConsignment(updated);
      if (res) {
        toast.success(
          updated.isGetMoney ? 'Đã xác nhận trả tiền' : 'Đã huỷ xác nhận'
        );
        fetchConsignments(currentPage);
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
            value={searchFilters.phoneNumber}
            onChange={e =>
              setSearchFilters(p => ({ ...p, phoneNumber: e.target.value }))
            }
            placeholder="Số điện thoại"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Tên KH</Label>
          <Input
            className="w-[140px] h-8 text-sm"
            value={searchFilters.consignerName}
            onChange={e =>
              setSearchFilters(p => ({ ...p, consignerName: e.target.value }))
            }
            placeholder="Tên khách hàng"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Mã KG</Label>
          <Input
            className="w-[120px] h-8 text-sm"
            value={searchFilters.consignmentId}
            onChange={e =>
              setSearchFilters(p => ({ ...p, consignmentId: e.target.value }))
            }
            placeholder="Mã ký gửi"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Trả tiền</Label>
          <Select
            value={searchFilters.isGetMoney}
            onValueChange={val =>
              setSearchFilters(p => ({
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
              <TableHead className="w-[40px]">STT</TableHead>
              <TableHead>Mã KG</TableHead>
              <TableHead>Tên KH</TableHead>
              <TableHead>SĐT</TableHead>
              <TableHead className="text-right">SL</TableHead>
              <TableHead className="text-right">Đã bán</TableHead>
              <TableHead className="text-right">Còn lại</TableHead>
              <TableHead className="text-center">Trả tiền</TableHead>
              <TableHead>CK/TT</TableHead>
              <TableHead className="w-[90px] text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : dataSource.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={11}
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
                      <TableCell className="text-xs">
                        {(currentPage - 1) * pageSize + index + 1}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {item.consignmentId}
                      </TableCell>
                      <TableCell className="text-sm max-w-[120px] truncate">
                        {item.consignerName}
                      </TableCell>
                      <TableCell className="text-xs">
                        {item.phoneNumber}
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
                      <TableCell className="text-center">
                        {item.isGetMoney ? (
                          <Badge
                            variant="default"
                            className="bg-green-500 text-xs"
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
                      <TableCell className="text-xs">
                        {item.isTransferMoneyWithBank ? 'CK' : 'TT'}
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
                          colSpan={11}
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
                                <Input
                                  className="h-8 text-sm"
                                  value={draft.consignmentId || ''}
                                  onChange={e =>
                                    updateDraftField(
                                      item.objectId,
                                      'consignmentId',
                                      e.target.value
                                    )
                                  }
                                />
                              </div>
                              <div className="space-y-1 col-span-2">
                                <Label className="text-xs text-muted-foreground">
                                  Ghi chú
                                </Label>
                                <Input
                                  className="h-8 text-sm"
                                  value={draft.note || ''}
                                  onChange={e =>
                                    updateDraftField(
                                      item.objectId,
                                      'note',
                                      e.target.value
                                    )
                                  }
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
                                </p>
                                <div className="border rounded-md overflow-hidden">
                                  <Table>
                                    <TableHeader>
                                      <TableRow className="bg-muted/40">
                                        <TableHead className="text-xs h-8 w-8">
                                          #
                                        </TableHead>
                                        <TableHead className="text-xs h-8">
                                          Tên sản phẩm
                                        </TableHead>
                                        <TableHead className="text-xs h-8 text-right">
                                          Giá
                                        </TableHead>
                                        <TableHead className="text-xs h-8 text-center w-16">
                                          SL
                                        </TableHead>
                                        <TableHead className="text-xs h-8">
                                          Ghi chú
                                        </TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {draft.productList.map((p, pIdx) => (
                                        <EditableProductRow
                                          key={pIdx}
                                          product={p}
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
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground italic">
                                Chưa có sản phẩm
                              </p>
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
