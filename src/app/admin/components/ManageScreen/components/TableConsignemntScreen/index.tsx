'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  Loader2,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit,
  Mail,
  DollarSign,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import moment from 'moment';

import GapService from '@/app/actions/GapServices';
import { useAppStore } from '@/store/useAppStore';

import './style.scss';

// ─── Helpers ──────────────────────────────────────────
const numberWithCommas = (x: number | string): string =>
  x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// ─── Types ────────────────────────────────────────────
interface ConsignmentItem {
  objectId: string;
  consignmentId: string;
  consignerName?: string;
  phoneNumber?: string;
  consignerIdCard?: string;
  mail?: string;
  numberOfProducts?: number;
  numSoldConsignment?: number;
  remainNumConsignment?: number;
  moneyBack?: number;
  moneyBackForFullSold?: number;
  totalMoney?: number;
  isGetMoney?: boolean;
  isTransferMoneyWithBank?: boolean;
  timeGetMoney?: string;
  timeConfirmGetMoney?: string;
  note?: string;
  createdAt?: string;
  banks?: Array<{ type: string; accNumber: string }>;
  productList?: ProductItem[];
  group?: { objectId: string; code?: string };
  consigneeName?: string;
}

interface ProductItem {
  hashCode?: string;
  code?: string;
  productId?: number | string;
  name?: string;
  price: number | string;
  count: number;
  remainNumberProduct?: number;
  priceAfterFee?: number | string;
  totalPriceAfterFee?: number | string;
  categoryId?: string;
  subCategoryId?: string | null;
  note?: string;
  isNew?: string;
  rateNew?: number;
  isDeleted?: boolean;
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
  remainNumConsignment: string;
}

// ─── Component ────────────────────────────────────────
const TableConsignmentScreen: React.FC = () => {
  const { userData } = useAppStore();

  // Data
  const [dataSource, setDataSource] = useState<ConsignmentItem[]>([]);
  const [allInfoTag, setAllInfoTag] = useState<TagItem[]>([]);
  const [currentTagId, setCurrentTagId] = useState<string>('');
  const [currentTagCode, setCurrentTagCode] = useState<string>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const pageSize = 20;

  // Loading
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingTags, setIsLoadingTags] = useState<boolean>(false);

  // Search
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    phoneNumber: '',
    consignerName: '',
    consignmentId: '',
    isGetMoney: '',
    remainNumConsignment: '',
  });

  // Edit modal
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<ConsignmentItem | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string>('');

  // ── Fetch tags ──
  const fetchAllTags = useCallback(async () => {
    setIsLoadingTags(true);
    try {
      const res = await GapService.getConsignmentID();
      if (res?.results?.length > 0) {
        const tags = [...res.results].reverse();
        setAllInfoTag(tags);
        // Auto select first tag
        if (tags.length > 0 && !currentTagId) {
          setCurrentTagId(tags[0].objectId);
          setCurrentTagCode(tags[0].code);
        }
      }
    } catch (err) {
      console.error('Error fetching tags:', err);
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
        const hasSearchFilter = Object.values(searchFilters).some(
          v => v.length > 0
        );

        let res: any;
        if (hasSearchFilter && searchFilters.phoneNumber) {
          res = await GapService.getConsignmentWithPhoneIncludeText(
            page,
            searchFilters.phoneNumber,
            pageSize
          );
        } else {
          res = await GapService.getConsignment(page, null, pageSize, groupId);
        }

        if (res?.results) {
          // Apply client-side filters
          let filtered = res.results;

          if (searchFilters.consignerName) {
            const keyword = searchFilters.consignerName.toLowerCase();
            filtered = filtered.filter((item: ConsignmentItem) =>
              item.consignerName?.toLowerCase().includes(keyword)
            );
          }

          if (searchFilters.consignmentId) {
            const keyword = searchFilters.consignmentId.toLowerCase();
            filtered = filtered.filter((item: ConsignmentItem) =>
              item.consignmentId?.toLowerCase().includes(keyword)
            );
          }

          if (searchFilters.isGetMoney === 'true') {
            filtered = filtered.filter(
              (item: ConsignmentItem) => item.isGetMoney === true
            );
          } else if (searchFilters.isGetMoney === 'false') {
            filtered = filtered.filter(
              (item: ConsignmentItem) => item.isGetMoney !== true
            );
          }

          if (searchFilters.remainNumConsignment) {
            const num = Number(searchFilters.remainNumConsignment);
            filtered = filtered.filter(
              (item: ConsignmentItem) =>
                Number(item.remainNumConsignment) === num
            );
          }

          setDataSource(filtered);
          setTotalCount(res.count || filtered.length);
        } else {
          setDataSource([]);
          setTotalCount(0);
        }
      } catch (err) {
        console.error('Error fetching consignments:', err);
        toast.error('Không thể tải dữ liệu');
      }
      setIsLoading(false);
    },
    [currentTagId, searchFilters]
  );

  // ── Init ──
  useEffect(() => {
    fetchAllTags();
  }, [fetchAllTags]);

  useEffect(() => {
    if (currentTagId) {
      setCurrentPage(1);
      fetchConsignments(1, currentTagId);
    }
  }, [currentTagId, fetchConsignments]);

  // ── Tag change ──
  const handleTagChange = (tagCode: string) => {
    const tag = allInfoTag.find(t => t.code === tagCode);
    if (tag) {
      setCurrentTagId(tag.objectId);
      setCurrentTagCode(tag.code);
    }
  };

  // ── Search ──
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
      remainNumConsignment: '',
    });
    setCurrentPage(1);
    fetchConsignments(1);
  };

  // ── Pagination ──
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchConsignments(page);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  // ── Edit ──
  const openEditModal = (item: ConsignmentItem) => {
    setEditingItem({ ...item });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    setIsSaving(true);
    try {
      const res = await GapService.updateConsignment(editingItem);
      if (res) {
        toast.success('Cập nhật thành công');
        setEditModalOpen(false);
        setEditingItem(null);
        fetchConsignments(currentPage);
      } else {
        toast.error('Cập nhật thất bại');
      }
    } catch (err) {
      console.error(err);
      toast.error('Có lỗi xảy ra');
    }
    setIsSaving(false);
  };

  // ── Confirm get money ──
  const handleToggleGetMoney = async (item: ConsignmentItem) => {
    const updatedItem = {
      ...item,
      isGetMoney: !item.isGetMoney,
      timeConfirmGetMoney: !item.isGetMoney
        ? moment().format('DD-MM-YYYY HH:mm')
        : '',
    };
    try {
      const res = await GapService.updateConsignment(updatedItem);
      if (res) {
        toast.success(
          updatedItem.isGetMoney ? 'Đã xác nhận trả tiền' : 'Đã huỷ xác nhận'
        );
        fetchConsignments(currentPage);
      }
    } catch (err) {
      console.error(err);
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
        setDeletingId('');
        fetchConsignments(currentPage);
      } else {
        toast.error('Xoá thất bại');
      }
    } catch (err) {
      console.error(err);
      toast.error('Có lỗi xảy ra');
    }
  };

  // ── Send email ──
  const handleSendEmail = async (item: ConsignmentItem) => {
    try {
      const res = await GapService.sendEmailTongketWithObjectId(item.objectId);
      if (res) {
        toast.success('Đã gửi email tổng kết');
      } else {
        toast.error('Gửi email thất bại');
      }
    } catch (err) {
      console.error(err);
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleSendEmailAll = async () => {
    if (!currentTagId) return;
    try {
      const res =
        await GapService.sendEmailTongketALLWithObjectIdConsigment(
          currentTagId
        );
      if (res) {
        toast.success('Đã gửi email tổng kết cho cả đợt');
      } else {
        toast.error('Gửi email thất bại');
      }
    } catch (err) {
      console.error(err);
      toast.error('Có lỗi xảy ra');
    }
  };

  // ── Render ──
  return (
    <div className="table-consignment-container space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Tag selector */}
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
            className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`}
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

      {/* Search filters */}
      <div className="flex flex-wrap items-end gap-3 p-3 border rounded-lg bg-muted/30">
        <div className="space-y-1">
          <Label className="text-xs">SĐT</Label>
          <Input
            className="w-[150px] h-8 text-sm"
            value={searchFilters.phoneNumber}
            onChange={e =>
              setSearchFilters(prev => ({
                ...prev,
                phoneNumber: e.target.value,
              }))
            }
            placeholder="Số điện thoại"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Tên KH</Label>
          <Input
            className="w-[150px] h-8 text-sm"
            value={searchFilters.consignerName}
            onChange={e =>
              setSearchFilters(prev => ({
                ...prev,
                consignerName: e.target.value,
              }))
            }
            placeholder="Tên khách hàng"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Mã KG</Label>
          <Input
            className="w-[130px] h-8 text-sm"
            value={searchFilters.consignmentId}
            onChange={e =>
              setSearchFilters(prev => ({
                ...prev,
                consignmentId: e.target.value,
              }))
            }
            placeholder="Mã ký gửi"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Trả tiền</Label>
          <Select
            value={searchFilters.isGetMoney}
            onValueChange={val =>
              setSearchFilters(prev => ({ ...prev, isGetMoney: val }))
            }
          >
            <SelectTrigger className="w-[120px] h-8 text-sm">
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="true">Đã trả</SelectItem>
              <SelectItem value="false">Chưa trả</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">SL còn lại</Label>
          <Input
            className="w-[100px] h-8 text-sm"
            type="number"
            value={searchFilters.remainNumConsignment}
            onChange={e =>
              setSearchFilters(prev => ({
                ...prev,
                remainNumConsignment: e.target.value,
              }))
            }
            placeholder="0"
          />
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
              <TableHead className="w-[50px]">STT</TableHead>
              <TableHead>Mã KG</TableHead>
              <TableHead>Tên KH</TableHead>
              <TableHead>SĐT</TableHead>
              <TableHead className="text-right">SL</TableHead>
              <TableHead className="text-right">Đã bán</TableHead>
              <TableHead className="text-right">Còn lại</TableHead>
              {/* <TableHead className="text-right">Tiền trả</TableHead>
              <TableHead className="text-right">Tổng tiền</TableHead> */}
              <TableHead className="text-center">Trả tiền</TableHead>
              <TableHead>CK/TT</TableHead>
              <TableHead>Ghi chú</TableHead>
              <TableHead className="text-right w-[80px]">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={13} className="text-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : dataSource.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={13}
                  className="text-center py-10 text-muted-foreground"
                >
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              dataSource.map((item, index) => (
                <TableRow
                  key={item.objectId}
                  className={item.isGetMoney ? 'bg-green-50' : ''}
                >
                  <TableCell className="text-xs">
                    {(currentPage - 1) * pageSize + index + 1}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {item.consignmentId}
                  </TableCell>
                  <TableCell className="text-sm max-w-[120px] truncate">
                    {item.consignerName}
                  </TableCell>
                  <TableCell className="text-xs">{item.phoneNumber}</TableCell>
                  <TableCell className="text-right text-sm">
                    {item.numberOfProducts}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {item.numSoldConsignment || 0}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {(item.numberOfProducts || 0) -
                      (item.numSoldConsignment || 0)}
                  </TableCell>
                  {/* <TableCell className="text-right text-sm font-medium">
                    {numberWithCommas(item.moneyBack || 0)}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {numberWithCommas(item.moneyBackForFullSold || 0)}
                  </TableCell> */}
                  <TableCell className="text-center">
                    {item.isGetMoney ? (
                      <Badge variant="default" className="bg-green-500 text-xs">
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
                    className="text-xs max-w-[100px] truncate"
                    title={item.note}
                  >
                    {item.note || '---'}
                  </TableCell>
                  <TableCell className="text-right">
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
                        <DropdownMenuItem onClick={() => openEditModal(item)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleGetMoney(item)}
                        >
                          <DollarSign className="h-4 w-4 mr-2" />
                          {item.isGetMoney
                            ? 'Huỷ trả tiền'
                            : 'Xác nhận trả tiền'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSendEmail(item)}>
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
              ))
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

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Chỉnh sửa đơn ký gửi: {editingItem?.consignmentId}
            </DialogTitle>
          </DialogHeader>

          {editingItem && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Mã KG</Label>
                  <Input
                    value={editingItem.consignmentId || ''}
                    onChange={e =>
                      setEditingItem(prev =>
                        prev ? { ...prev, consignmentId: e.target.value } : null
                      )
                    }
                  />
                </div>
                {/* <div className="space-y-1">
                  <Label className="text-xs">Số lượng SP</Label>
                  <Input
                    type="number"
                    value={editingItem.numberOfProducts || 0}
                    onChange={e =>
                      setEditingItem(prev =>
                        prev
                          ? {
                              ...prev,
                              numberOfProducts: Number(e.target.value),
                            }
                          : null
                      )
                    }
                  />
                </div> */}
                <div className="space-y-1">
                  <Label className="text-xs">SL đã bán</Label>
                  <Input
                    type="number"
                    value={editingItem.numSoldConsignment || 0}
                    onChange={e =>
                      setEditingItem(prev =>
                        prev
                          ? {
                              ...prev,
                              numSoldConsignment: Number(e.target.value),
                            }
                          : null
                      )
                    }
                  />
                </div>
                {/* <div className="space-y-1">
                  <Label className="text-xs">Tiền trả lại</Label>
                  <Input
                    type="number"
                    value={editingItem.moneyBack || 0}
                    onChange={e =>
                      setEditingItem(prev =>
                        prev
                          ? { ...prev, moneyBack: Number(e.target.value) }
                          : null
                      )
                    }
                  />
                </div> */}
                {/* <div className="space-y-1">
                  <Label className="text-xs">Tiền trả full</Label>
                  <Input
                    type="number"
                    value={editingItem.moneyBackForFullSold || 0}
                    onChange={e =>
                      setEditingItem(prev =>
                        prev
                          ? {
                              ...prev,
                              moneyBackForFullSold: Number(e.target.value),
                            }
                          : null
                      )
                    }
                  />
                </div> */}
                <div className="flex items-center gap-2 pt-5">
                  <Switch
                    checked={editingItem.isGetMoney || false}
                    onCheckedChange={checked =>
                      setEditingItem(prev =>
                        prev
                          ? {
                              ...prev,
                              isGetMoney: checked,
                              timeConfirmGetMoney: checked
                                ? moment().format('DD-MM-YYYY HH:mm')
                                : '',
                            }
                          : null
                      )
                    }
                  />
                  <Label className="text-xs">Đã trả tiền</Label>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Ghi chú</Label>
                <Textarea
                  value={editingItem.note || ''}
                  onChange={e =>
                    setEditingItem(prev =>
                      prev ? { ...prev, note: e.target.value } : null
                    )
                  }
                  rows={2}
                />
              </div>

              {/* Product list in edit */}
              {editingItem.productList &&
                editingItem.productList.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">
                      Danh sách sản phẩm
                    </Label>
                    <div className="border rounded max-h-[300px] overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">#</TableHead>
                            <TableHead className="text-xs">Tên</TableHead>
                            <TableHead className="text-xs text-right">
                              Giá
                            </TableHead>
                            <TableHead className="text-xs text-right">
                              SL
                            </TableHead>
                            <TableHead className="text-xs">Ghi chú</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {editingItem.productList.map((product, pIdx) => (
                            <TableRow key={pIdx}>
                              <TableCell className="text-xs">
                                {pIdx + 1}
                              </TableCell>
                              <TableCell className="text-xs">
                                <Input
                                  className="h-7 text-xs"
                                  value={product.name || ''}
                                  onChange={e => {
                                    const newList = [
                                      ...(editingItem.productList || []),
                                    ];
                                    newList[pIdx] = {
                                      ...newList[pIdx],
                                      name: e.target.value,
                                    };
                                    setEditingItem(prev =>
                                      prev
                                        ? { ...prev, productList: newList }
                                        : null
                                    );
                                  }}
                                />
                              </TableCell>
                              <TableCell className="text-xs text-right">
                                {numberWithCommas(Number(product.price) * 1000)}
                              </TableCell>
                              <TableCell className="text-xs text-right">
                                {product.count}
                              </TableCell>
                              <TableCell className="text-xs">
                                <Input
                                  className="h-7 text-xs"
                                  value={product.note || '---'}
                                  onChange={e => {
                                    const newList = [
                                      ...(editingItem.productList || []),
                                    ];
                                    newList[pIdx] = {
                                      ...newList[pIdx],
                                      note: e.target.value,
                                    };
                                    setEditingItem(prev =>
                                      prev
                                        ? { ...prev, productList: newList }
                                        : null
                                    );
                                  }}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Huỷ
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                'Lưu'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
