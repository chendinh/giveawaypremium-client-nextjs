'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Loader2,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  Upload,
  Trash2,
} from 'lucide-react';

import GapService from '@/app/actions/GapServices';
import { useAppStore } from '@/store/useAppStore';

import './style.scss';

// ─── Helpers ──────────────────────────────────────────
const numberWithCommas = (x: number | string): string =>
  x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const convertPriceAfterFee = (price: number): number => {
  if (price < 1000) return Math.round(price * 0.74);
  if (price <= 10000) return Math.round(price * 0.77);
  return Math.round(price * 0.8);
};

const toMediaPointer = (m: MediaItem) => ({
  __type: 'Pointer' as const,
  className: 'Media',
  objectId: m.objectId,
});

// ─── Types ────────────────────────────────────────────
interface MediaItem {
  objectId: string;
  data?: {
    secure_url?: string;
  };
}

interface ProductItem {
  objectId: string;
  key: string;
  code?: string;
  name?: string;
  price: number;
  priceAfterFee: number;
  count: number;
  soldNumberProduct: number;
  remainNumberProduct: number;
  numberTagCount: number;
  moneyBackProduct: number;
  category?: string;
  categoryId?: string;
  status?: string;
  medias?: MediaItem[];
  sizeInfo?: string;
  rateNew?: number;
  detailInfo?: string;
  note?: string;
}

interface ConsignmentTag {
  objectId: string;
  code?: string;
}

interface SearchFilters {
  code: string;
  name: string;
  remainNumberProduct: string;
}

interface ExpandedEditData {
  sizeInfo: string;
  rateNew: string;
  detailInfo: string;
  note: string;
}

// ─── Component ────────────────────────────────────────
const TableProductScreen: React.FC = () => {
  const { userData } = useAppStore();

  // Data
  const [productData, setProductData] = useState<ProductItem[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const pageSize = 100;

  // Loading
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [isLoadingTags, setIsLoadingTags] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Consignment tabs
  const [allInfoTag, setAllInfoTag] = useState<ConsignmentTag[]>([]);
  const [currentTag, setCurrentTag] = useState<string>('');

  // Search
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    code: '',
    name: '',
    remainNumberProduct: '',
  });

  // Expanded rows
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Edit modal for expanded row details
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(
    null
  );
  const [editData, setEditData] = useState<ExpandedEditData>({
    sizeInfo: '',
    rateNew: '',
    detailInfo: '',
    note: '',
  });
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetKey, setUploadTargetKey] = useState<string>('');

  // ── Fetch consignment tags ──
  const fetchAllTags = useCallback(async () => {
    setIsLoadingTags(true);
    try {
      const res = await GapService.getConsignmentID();
      if (res?.results?.length > 0) {
        const tempArray = [...res.results].reverse();
        setAllInfoTag(tempArray);
        setCurrentTag(tempArray[0].objectId);
      }
    } catch (err) {
      console.error('Error fetching tags:', err);
      toast.error('Không thể tải nhóm ký gửi');
    }
    setIsLoadingTags(false);
  }, []);

  // ── Fetch products ──
  const fetchTableData = useCallback(
    async (page: number = 1, tagId?: string) => {
      const tagToUse = tagId || currentTag;
      if (!tagToUse) return;

      setIsLoadingData(true);
      try {
        const hasFilters =
          searchFilters.code ||
          searchFilters.name ||
          searchFilters.remainNumberProduct;

        const selectedKeys = hasFilters
          ? {
              ...(searchFilters.code && { code: searchFilters.code }),
              ...(searchFilters.name && { name: searchFilters.name }),
              ...(searchFilters.remainNumberProduct && {
                remainNumberProduct: searchFilters.remainNumberProduct,
              }),
            }
          : null;

        const res = await GapService.getProduct(
          page,
          selectedKeys,
          100,
          tagToUse
        );

        if (res?.results) {
          const mapped: ProductItem[] = res.results.map(
            (item: Record<string, any>) => {
              let categoryType = '';
              if (
                item.category?.name &&
                item.subCategory?.name
              ) {
                categoryType = `${item.category.name} → ${item.subCategory.name}`;
              } else if (item.category?.name) {
                categoryType = item.category.name;
              }

              const price = Number(item.price) || 0;
              const count = Number(item.count) || 0;
              const priceAfterFee = Number(item.priceAfterFee) || 0;
              const soldNumberProduct = Number(item.soldNumberProduct) || 0;

              return {
                ...item,
                key: item.objectId,
                category: categoryType,
                categoryId: item.category?.objectId,
                price,
                count,
                priceAfterFee,
                soldNumberProduct,
                remainNumberProduct: count - soldNumberProduct,
                numberTagCount: count - soldNumberProduct,
                moneyBackProduct: Math.round(soldNumberProduct * priceAfterFee),
              };
            }
          );
          setProductData(mapped);
          setTotalCount(res.count || mapped.length);
        } else {
          setProductData([]);
          setTotalCount(0);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        toast.error('Không thể tải dữ liệu sản phẩm');
      }
      setIsLoadingData(false);
    },
    [currentTag, searchFilters]
  );

  // ── Init: fetch tags, then products ──
  useEffect(() => {
    fetchAllTags();
  }, [fetchAllTags]);

  useEffect(() => {
    if (currentTag) {
      fetchTableData(1, currentTag);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTag]);

  // ── Tab change ──
  const handleTabChange = (value: string) => {
    const idx = parseInt(value, 10);
    if (allInfoTag[idx]) {
      setCurrentPage(1);
      setCurrentTag(allInfoTag[idx].objectId);
    }
  };

  // ── Search ──
  const handleSearch = () => {
    setCurrentPage(1);
    fetchTableData(1);
  };

  const handleResetSearch = () => {
    setSearchFilters({ code: '', name: '', remainNumberProduct: '' });
    setCurrentPage(1);
    fetchTableData(1);
  };

  // ── Pagination ──
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchTableData(page);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  // ── Toggle status ──
  const handleToggleStatus = async (record: ProductItem) => {
    const newStatus = record.status === 'NEW' ? 'ACTIVE' : 'NEW';
    const newData = [...productData];
    const index = newData.findIndex(item => item.key === record.key);
    if (index === -1) return;

    const updatedItem = { ...record, status: newStatus };
    newData.splice(index, 1, updatedItem);
    setProductData(newData);

    try {
      const res = await GapService.updateProduct(updatedItem);
      if (res) {
        toast.success(`Cập nhật thành công ${record.key}`);
      } else {
        // Revert on failure
        const reverted = { ...record };
        newData.splice(index, 1, reverted);
        setProductData([...newData]);
        toast.error('Cập nhật chưa được');
      }
    } catch {
      const reverted = { ...record };
      newData.splice(index, 1, reverted);
      setProductData([...newData]);
      toast.error('Có lỗi xảy ra');
    }
  };

  // ── Expand / Collapse row ──
  const toggleExpand = (key: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // ── Edit expanded row details ──
  const openEditModal = (product: ProductItem) => {
    setEditingProduct(product);
    setEditData({
      sizeInfo: product.sizeInfo || '',
      rateNew: String(product.rateNew || 0),
      detailInfo: product.detailInfo || '',
      note: product.note || '',
    });
    setEditModalOpen(true);
  };

  const handleSaveExpanded = async () => {
    if (!editingProduct) return;
    setIsSaving(true);

    const newData = [...productData];
    const index = newData.findIndex(
      item => item.key === editingProduct.key
    );
    if (index === -1) {
      setIsSaving(false);
      return;
    }

    const updatedItem: ProductItem = {
      ...editingProduct,
      sizeInfo: editData.sizeInfo || '--',
      rateNew: Number(editData.rateNew) || 0,
      detailInfo: editData.detailInfo || '--',
      note: editData.note || '--',
    };

    newData.splice(index, 1, updatedItem);
    setProductData(newData);

    try {
      const res = await GapService.updateProduct({
        ...updatedItem,
        objectId: editingProduct.objectId,
      });
      if (res) {
        toast.success(`Cập nhật thành công ${editingProduct.key}`);
        setEditModalOpen(false);
        setEditingProduct(null);
      } else {
        toast.error('Cập nhật chưa được');
      }
    } catch {
      toast.error('Có lỗi xảy ra');
    }
    setIsSaving(false);
  };

  // ── Image upload ──
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    recordKey: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const newData = [...productData];
    const index = newData.findIndex(item => item.key === recordKey);
    if (index === -1) {
      setIsUploading(false);
      return;
    }

    try {
      const res = await GapService.uploadSingleFileWithFormData(file);
      if (!res?.objectId) {
        toast.error('Upload ảnh thất bại');
        setIsUploading(false);
        return;
      }

      const newImage: MediaItem = {
        objectId: res.objectId,
        data: res.data,
      };
      const newImagePointer = {
        __type: 'Pointer',
        className: 'Media',
        objectId: res.objectId,
      };

      const currentItem = newData[index];
      const currentMedias = currentItem.medias || [];
      const updatedItemForApi = {
        ...currentItem,
        medias: [...currentMedias.map(toMediaPointer), newImagePointer],
      };
      const updatedItemLocal = {
        ...currentItem,
        medias: [...currentMedias, newImage],
      };

      const resPro = await GapService.updateProduct(updatedItemForApi, true);
      if (resPro) {
        newData[index] = updatedItemLocal;
        setProductData([...newData]);
        toast.success(`Cập nhật thành công ${currentItem.objectId}`);
      } else {
        toast.error(`Cập nhật chưa thành công ${currentItem.objectId}`);
      }
    } catch {
      toast.error('Có lỗi xảy ra khi upload');
    }
    setIsUploading(false);
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ── Image remove ──
  const handleRemovePhoto = async (
    mediaItem: MediaItem,
    record: ProductItem
  ) => {
    setIsUploading(true);
    const newData = [...productData];
    const index = newData.findIndex(item => item.key === record.key);
    if (index === -1) {
      setIsUploading(false);
      return;
    }

    try {
      const currentItem = newData[index];
      const currentMedias = currentItem.medias || [];
      const filteredMedias = currentMedias.filter(
        m => m.objectId !== mediaItem.objectId
      );

      const updatedItemForApi = {
        ...currentItem,
        medias: filteredMedias.map(toMediaPointer),
      };

      const resPro = await GapService.updateProduct(updatedItemForApi);
      if (resPro) {
        newData[index] = { ...currentItem, medias: filteredMedias };
        setProductData([...newData]);
        toast.success(`Xoá thành công ${currentItem.objectId}`);
      } else {
        toast.error(`Xoá chưa thành công ${currentItem.objectId}`);
      }
    } catch {
      toast.error('Có lỗi xảy ra');
    }
    setIsUploading(false);
  };

  // ── Render expanded row ──
  const renderExpandedRow = (record: ProductItem) => {
    const medias = record.medias || [];

    return (
      <TableRow key={`${record.key}-expanded`}>
        <TableCell colSpan={12} className="bg-muted/20 p-4">
          <div className="space-y-4">
            {/* Images section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">
                  Ảnh ({medias.length}/5)
                </Label>
                {medias.length < 5 && (
                  <div className="relative">
                    <input
                      ref={uploadTargetKey === record.key ? fileInputRef : undefined}
                      type="file"
                      accept=".png,.jpg,.jpeg,.gif"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={e => handleFileUpload(e, record.key)}
                      disabled={isUploading}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isUploading}
                      onClick={() => setUploadTargetKey(record.key)}
                    >
                      {isUploading && uploadTargetKey === record.key ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <Upload className="h-4 w-4 mr-1" />
                      )}
                      Thêm ảnh
                    </Button>
                  </div>
                )}
              </div>
              {medias.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {medias.map((media, idx) => (
                    <div
                      key={media.objectId || idx}
                      className="relative group w-[70px] h-[70px] border rounded overflow-hidden"
                    >
                      <img
                        src={media.data?.secure_url || ''}
                        alt={`product-${idx}`}
                        className="w-full h-full object-contain"
                        onError={e => {
                          (e.target as HTMLImageElement).src = '';
                        }}
                      />
                      <button
                        className="absolute top-0 right-0 bg-destructive text-destructive-foreground rounded-bl p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemovePhoto(media, record)}
                        disabled={isUploading}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Chưa có ảnh</p>
              )}
            </div>

            {/* Detail fields */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <Label className="text-xs text-muted-foreground">Size</Label>
                <p>{record.sizeInfo || '-'}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Độ mới</Label>
                <p>{record.rateNew || 0}%</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Chi tiết sản phẩm
                </Label>
                <p className="truncate max-w-[200px]">
                  {record.detailInfo || '-'}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Ghi chú</Label>
                <p className="truncate max-w-[200px]">{record.note || '-'}</p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => openEditModal(record)}
            >
              Chỉnh sửa chi tiết
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  // ── Render ──
  return (
    <div className="table-product-container space-y-4">
      {/* Consignment Tabs */}
      {isLoadingTags ? (
        <div className="flex items-center gap-2 py-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">
            Đang tải nhóm ký gửi...
          </span>
        </div>
      ) : allInfoTag.length > 0 ? (
        <Tabs
          defaultValue="0"
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="flex flex-wrap h-auto gap-1">
            {allInfoTag.map((tag, idx) => (
              <TabsTrigger key={tag.objectId} value={String(idx)}>
                {tag.code || `Nhóm ${idx + 1}`}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      ) : null}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchTableData(currentPage)}
        >
          <RefreshCw
            className={`h-4 w-4 mr-1 ${isLoadingData ? 'animate-spin' : ''}`}
          />
          Làm mới
        </Button>

        <span className="text-sm text-muted-foreground ml-auto">
          Tổng: {totalCount} sản phẩm
        </span>
      </div>

      {/* Search filters */}
      <div className="flex flex-wrap items-end gap-3 p-3 border rounded-lg bg-muted/30">
        <div className="space-y-1">
          <Label className="text-xs">Code SP</Label>
          <Input
            className="w-[160px] h-8 text-sm"
            value={searchFilters.code}
            onChange={e =>
              setSearchFilters(prev => ({ ...prev, code: e.target.value }))
            }
            placeholder="Tìm mã SP"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Tên SP</Label>
          <Input
            className="w-[160px] h-8 text-sm"
            value={searchFilters.name}
            onChange={e =>
              setSearchFilters(prev => ({ ...prev, name: e.target.value }))
            }
            placeholder="Tìm tên SP"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Còn lại</Label>
          <Input
            className="w-[120px] h-8 text-sm"
            value={searchFilters.remainNumberProduct}
            onChange={e =>
              setSearchFilters(prev => ({
                ...prev,
                remainNumberProduct: e.target.value,
              }))
            }
            placeholder="Số còn lại"
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
              <TableHead className="w-[40px]" />
              <TableHead>Code SP</TableHead>
              <TableHead className="text-right w-[80px]">SL TAG IN</TableHead>
              <TableHead>Tên SP</TableHead>
              <TableHead className="text-right">Giá</TableHead>
              <TableHead className="text-right">Giá sau phí</TableHead>
              <TableHead className="text-right w-[70px]">Số lượng</TableHead>
              <TableHead className="text-right w-[70px]">Đã bán</TableHead>
              <TableHead className="text-right w-[70px]">Còn lại</TableHead>
              <TableHead className="text-right">Tổng tiền sau phí</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead className="text-center w-[100px]">
                Tình trạng
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingData || isLoadingTags ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : productData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={12}
                  className="text-center py-10 text-muted-foreground"
                >
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              productData.map(item => (
                <React.Fragment key={item.key}>
                  <TableRow>
                    {/* Expand toggle */}
                    <TableCell className="px-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => toggleExpand(item.key)}
                      >
                        {expandedRows.has(item.key) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {item.code || '---'}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {item.numberTagCount}
                    </TableCell>
                    <TableCell className="text-sm max-w-[150px] truncate">
                      {item.name || '---'}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {item.price
                        ? `${numberWithCommas(item.price * 1000)} đ`
                        : '0 đ'}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {item.priceAfterFee
                        ? `${numberWithCommas(item.priceAfterFee * 1000)} đ`
                        : '0 đ'}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {item.count}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {item.soldNumberProduct}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {item.remainNumberProduct}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {item.moneyBackProduct
                        ? `${numberWithCommas(item.moneyBackProduct * 1000)} đ`
                        : '0 đ'}
                    </TableCell>
                    <TableCell className="text-xs max-w-[150px] truncate">
                      {item.category || '---'}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Switch
                          checked={item.status === 'ACTIVE'}
                          onCheckedChange={() => handleToggleStatus(item)}
                        />
                        <span className="text-[10px] text-muted-foreground">
                          {item.status === 'ACTIVE' ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedRows.has(item.key) && renderExpandedRow(item)}
                </React.Fragment>
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

      {/* Edit Detail Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Chỉnh sửa chi tiết: {editingProduct?.code || editingProduct?.name}
            </DialogTitle>
          </DialogHeader>

          {editingProduct && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Size</Label>
                  <Input
                    value={editData.sizeInfo}
                    onChange={e =>
                      setEditData(prev => ({
                        ...prev,
                        sizeInfo: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Độ mới (%)</Label>
                  <Input
                    type="number"
                    value={editData.rateNew}
                    onChange={e =>
                      setEditData(prev => ({
                        ...prev,
                        rateNew: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Chi tiết sản phẩm</Label>
                <Textarea
                  value={editData.detailInfo}
                  onChange={e =>
                    setEditData(prev => ({
                      ...prev,
                      detailInfo: e.target.value,
                    }))
                  }
                  rows={3}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Ghi chú</Label>
                <Textarea
                  value={editData.note}
                  onChange={e =>
                    setEditData(prev => ({
                      ...prev,
                      note: e.target.value,
                    }))
                  }
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Huỷ
            </Button>
            <Button onClick={handleSaveExpanded} disabled={isSaving}>
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
    </div>
  );
};

export default TableProductScreen;
