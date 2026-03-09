'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { toast } from 'sonner';
import {
  Loader2,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Edit,
  MoreHorizontal,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import GapService from '@/app/actions/GapServices';
import { useAppStore } from '@/store/useAppStore';

import './style.scss';

// ─── Helpers ──────────────────────────────────────────
const numberWithCommas = (x: number | string): string =>
  x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// ─── Types ────────────────────────────────────────────
interface CustomerItem {
  objectId: string;
  fullName?: string;
  phoneNumber?: string;
  email?: string;
  birthday?: string;
  identityNumber?: string;
  bankName?: string;
  bankId?: string;
  totalMoneyForSale?: number | string;
  totalProductForSale?: number | string;
  numberOfSale?: number | string;
}

interface CustomerApiItem {
  objectId: string;
  fullName?: string;
  identityNumber?: string;
  phoneNumber?: string;
  mail?: string;
  birthday?: string;
  banks?: Array<{ type: string; accNumber: string }>;
  totalMoneyForSale?: number;
  totalProductForSale?: number;
  numberOfSale?: number;
}

interface SearchFilters {
  phoneNumber: string;
}

// ─── Component ────────────────────────────────────────
const TableCustomerScreen: React.FC = () => {
  const { userData } = useAppStore();

  // Data
  const [dataSource, setDataSource] = useState<CustomerItem[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const pageSize = 100;

  // Loading
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Search
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    phoneNumber: '',
  });

  // Edit modal
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<CustomerItem | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // ── Fetch customers ──
  const fetchCustomers = useCallback(
    async (page: number = 1) => {
      setIsLoading(true);
      try {
        const keyword = searchFilters.phoneNumber || null;
        const res = await GapService.getCustomerTable(page, keyword);

        if (res?.results) {
          const customers: CustomerItem[] = res.results.map(
            (item: CustomerApiItem) => ({
              objectId: item.objectId,
              fullName: item.fullName,
              identityNumber: item.identityNumber,
              phoneNumber: item.phoneNumber,
              bankName: Array.isArray(item.banks) && item.banks.length > 0 ? item.banks[0].type : '',
              bankId: Array.isArray(item.banks) && item.banks.length > 0 ? item.banks[0].accNumber : '',
              email: item.mail,
              birthday: item.birthday,
              totalMoneyForSale: item.totalMoneyForSale || 0,
              totalProductForSale: item.totalProductForSale || 0,
              numberOfSale: item.numberOfSale || 0,
            })
          );
          setDataSource(customers);
          setTotalCount(res.count || customers.length);
        } else {
          setDataSource([]);
          setTotalCount(0);
        }
      } catch (err) {
        console.error('Error fetching customers:', err);
        toast.error('Không thể tải dữ liệu');
      }
      setIsLoading(false);
    },
    [searchFilters]
  );

  // ── Init ──
  useEffect(() => {
    fetchCustomers(1);
  }, [fetchCustomers]);

  // ── Search ──
  const handleSearch = () => {
    setCurrentPage(1);
    fetchCustomers(1);
  };

  const handleResetSearch = () => {
    setSearchFilters({ phoneNumber: '' });
    setCurrentPage(1);
    fetchCustomers(1);
  };

  // ── Pagination ──
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchCustomers(page);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  // ── Edit ──
  const openEditModal = (item: CustomerItem) => {
    setEditingItem({ ...item });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    setIsSaving(true);
    try {
      const res = await GapService.updateCustomerTable(editingItem);
      if (res) {
        toast.success(`Cập nhật thành công ${editingItem.phoneNumber}`);
        setEditModalOpen(false);
        setEditingItem(null);
        fetchCustomers(currentPage);
      } else {
        toast.error('Cập nhật chưa được');
      }
    } catch (err) {
      console.error(err);
      toast.error('Có lỗi xảy ra');
    }
    setIsSaving(false);
  };

  // ── Render ──
  return (
    <div className="table-customer-container space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchCustomers(currentPage)}
        >
          <RefreshCw
            className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`}
          />
          Làm mới
        </Button>

        <span className="text-sm text-muted-foreground ml-auto">
          Tổng: {totalCount} khách hàng
        </span>
      </div>

      {/* Search filters */}
      <div className="flex flex-wrap items-end gap-3 p-3 border rounded-lg bg-muted/30">
        <div className="space-y-1">
          <Label className="text-xs">SĐT</Label>
          <Input
            className="w-[200px] h-8 text-sm"
            value={searchFilters.phoneNumber}
            onChange={e =>
              setSearchFilters(prev => ({
                ...prev,
                phoneNumber: e.target.value,
              }))
            }
            placeholder="Tìm số điện thoại"
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
              <TableHead>Tên khách hàng</TableHead>
              <TableHead>Số điện thoại</TableHead>
              <TableHead>Mail</TableHead>
              <TableHead>Sinh nhật</TableHead>
              <TableHead>CMND</TableHead>
              <TableHead>Ngân hàng</TableHead>
              <TableHead>ID Ngân hàng</TableHead>
              <TableHead className="text-right">Tổng tiền đã mua</TableHead>
              <TableHead className="text-right">Tổng SP đã mua</TableHead>
              <TableHead className="text-right">Số lần mua</TableHead>
              <TableHead className="text-right w-[80px]">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : dataSource.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={12}
                  className="text-center py-10 text-muted-foreground"
                >
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              dataSource.map((item, index) => (
                <TableRow key={item.objectId}>
                  <TableCell className="text-xs">
                    {(currentPage - 1) * pageSize + index + 1}
                  </TableCell>
                  <TableCell className="text-sm max-w-[150px] truncate">
                    {item.fullName || '---'}
                  </TableCell>
                  <TableCell className="text-xs">
                    {item.phoneNumber || '---'}
                  </TableCell>
                  <TableCell className="text-xs max-w-[150px] truncate">
                    {item.email || '---'}
                  </TableCell>
                  <TableCell className="text-xs">
                    {item.birthday || '---'}
                  </TableCell>
                  <TableCell className="text-xs">
                    {item.identityNumber || '---'}
                  </TableCell>
                  <TableCell className="text-xs">
                    {item.bankName || '---'}
                  </TableCell>
                  <TableCell className="text-xs">
                    {item.bankId || '---'}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    {/* API stores prices in thousands (e.g. 50 = 50,000vnđ) */}
                    {item.totalMoneyForSale
                      ? `${numberWithCommas(item.totalMoneyForSale)},000vnđ`
                      : '0'}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {item.totalProductForSale || '--'}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {item.numberOfSale || '--'}
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
              Chỉnh sửa khách hàng: {editingItem?.fullName}
            </DialogTitle>
          </DialogHeader>

          {editingItem && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Tên khách hàng</Label>
                  <Input
                    value={editingItem.fullName || ''}
                    onChange={e =>
                      setEditingItem(prev =>
                        prev ? { ...prev, fullName: e.target.value } : null
                      )
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Số điện thoại</Label>
                  <Input
                    value={editingItem.phoneNumber || ''}
                    onChange={e =>
                      setEditingItem(prev =>
                        prev ? { ...prev, phoneNumber: e.target.value } : null
                      )
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Mail</Label>
                  <Input
                    value={editingItem.email || ''}
                    onChange={e =>
                      setEditingItem(prev =>
                        prev ? { ...prev, email: e.target.value } : null
                      )
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Sinh nhật</Label>
                  <Input
                    value={editingItem.birthday || ''}
                    onChange={e =>
                      setEditingItem(prev =>
                        prev ? { ...prev, birthday: e.target.value } : null
                      )
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">CMND</Label>
                  <Input
                    value={editingItem.identityNumber || ''}
                    onChange={e =>
                      setEditingItem(prev =>
                        prev
                          ? { ...prev, identityNumber: e.target.value }
                          : null
                      )
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Ngân hàng</Label>
                  <Input
                    value={editingItem.bankName || ''}
                    onChange={e =>
                      setEditingItem(prev =>
                        prev ? { ...prev, bankName: e.target.value } : null
                      )
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">ID Ngân hàng</Label>
                  <Input
                    value={editingItem.bankId || ''}
                    onChange={e =>
                      setEditingItem(prev =>
                        prev ? { ...prev, bankId: e.target.value } : null
                      )
                    }
                  />
                </div>
              </div>
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
    </div>
  );
};

export default TableCustomerScreen;
