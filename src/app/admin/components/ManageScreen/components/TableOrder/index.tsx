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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Loader2,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Trash2,
  Truck,
  ExternalLink,
} from 'lucide-react';

import GapService from '@/app/actions/GapServices';
import { useAppStore } from '@/store/useAppStore';
import moment from 'moment';

import './style.scss';

// ─── Helpers ──────────────────────────────────────────
const numberWithCommas = (x: number | string): string =>
  x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const convertPriceAfterFee = (productPrice: number = 0): number => {
  let moneyBackForFullSold = productPrice;
  if (productPrice > 0) {
    if (productPrice < 1000) {
      moneyBackForFullSold = (productPrice * 74) / 100;
    } else if (productPrice >= 1000 && productPrice <= 10000) {
      moneyBackForFullSold = (productPrice * 77) / 100;
    } else if (productPrice > 10000) {
      moneyBackForFullSold = (productPrice * 80) / 100;
    }
    return moneyBackForFullSold;
  }
  return 0;
};

const translateStatusName = (transporter: TransporterInfo | undefined): string => {
  if (!transporter) return '';
  switch (transporter.status) {
    case 'WAITING_PICK_UP':
      return 'Đang chờ lấy hàng';
    case 'DELIVERING':
      return 'Đang vận chuyển';
    case 'DELIVERED':
      return 'Đã chuyển tới khách';
    case 'FAILED':
      return 'Đơn hàng bị lỗi';
    case 'RETURNING_BACK':
      return 'Đang trả hàng về';
    case 'RETURNED_BACK':
      return 'Đã trả về';
    case 'CANCELLED':
      return 'Đã huỷ đơn hàng';
    default:
      return '';
  }
};

// ─── Types ────────────────────────────────────────────
interface TransporterInfo {
  success?: boolean;
  status?: string;
  res?: {
    order?: {
      label_id?: string;
      partner_id?: string;
      status_text?: string;
      customer_fullname?: string;
      customer_tel?: string;
      deliver_date?: string;
      pick_date?: string;
      ship_money?: number;
      address?: string;
    };
  };
  order?: {
    objectId?: string;
  };
}

interface ProductItemRaw {
  name?: string;
  note?: string;
  categoryId?: string;
  code?: string;
  price?: number | string;
  count?: number | string;
  consignment?: { consignmentId?: string };
  priceAfterFee?: number | string;
  soldNumberProduct?: number | string;
  shippingInfo?: Record<string, unknown>;
  transporter?: TransporterInfo;
}

interface ProductRow {
  key: number;
  name: string;
  note: string;
  categoryId: string;
  code: string;
  price: number;
  count: number;
  consignmentId: string;
  priceAfterFee: number;
  soldNumberProduct: number;
  remainNumberProduct: number;
  moneyBackProduct: number;
  totalMoney: number;
  shippingInfo?: Record<string, unknown>;
  transporter?: TransporterInfo;
}

interface OrderItem {
  key: number;
  objectId: string;
  fullName?: string;
  consignmentId?: string;
  consignerIdCard?: string;
  consigneeName?: string;
  phoneNumber?: string;
  totalNumberOfProductForSale: string;
  isTransferMoneyWithBank: string;
  transferBankMoneyAmount: string | number;
  transferOfflineMoneyAmount: string | number;
  totalMoneyForSale: string | number;
  totalMoneyForSaleAfterFee: string | number;
  createdAt: string;
  note: string;
  isOnlineSale: string;
  shippingInfo?: Record<string, unknown>;
  clientInfo?: Record<string, unknown>;
  transporter?: TransporterInfo;
  moneyBackForFullSold: string | number;
  timeConfirmGetMoney: string;
  productList?: ProductItemRaw[];
  isGetMoney: boolean;
  numberOfProducts?: number;
  remainNumConsignment?: number;
  numSoldConsignment?: number;
  moneyBack?: number;
}

interface SearchFilters {
  objectId: string;
  phoneNumber: string;
  isTransferMoneyWithBank: string;
  isOnlineSale: string;
}

// ─── Component ────────────────────────────────────────
const TableOrderScreen: React.FC = () => {
  const { userData } = useAppStore();

  // Data
  const [orderData, setOrderData] = useState<OrderItem[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const pageSize = 100;

  // Loading
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Search
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    objectId: '',
    phoneNumber: '',
    isTransferMoneyWithBank: '',
    isOnlineSale: '',
  });

  // Date range
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Expanded rows
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Delete confirm
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [deletingItem, setDeletingItem] = useState<OrderItem | null>(null);

  // Money confirm
  const [moneyConfirmOpen, setMoneyConfirmOpen] = useState<boolean>(false);
  const [moneyConfirmItem, setMoneyConfirmItem] = useState<OrderItem | null>(null);

  // GHTK detail modal
  const [ghtkDetailOpen, setGhtkDetailOpen] = useState<boolean>(false);
  const [ghtkDetailItem, setGhtkDetailItem] = useState<OrderItem | null>(null);

  // ── Initialize date range to current month ──
  useEffect(() => {
    const thisMonth = moment().month() + 1;
    const thisYear = moment().year();
    const from = moment(`${thisYear}-${thisMonth}-01`, 'YYYY-M-DD').format('YYYY-MM-DD');
    const to = moment(`${thisYear}-${thisMonth}-01`, 'YYYY-M-DD').add(1, 'month').format('YYYY-MM-DD');
    setFromDate(from);
    setToDate(to);
  }, []);

  // ── Build selected keys for API ──
  const buildSelectedKeys = useCallback((): Record<string, string> | null => {
    const keys: Record<string, string> = {};
    if (searchFilters.objectId) keys.objectId = searchFilters.objectId;
    if (searchFilters.phoneNumber) keys.phoneNumber = searchFilters.phoneNumber;
    if (searchFilters.isTransferMoneyWithBank) keys.isTransferMoneyWithBank = searchFilters.isTransferMoneyWithBank;
    if (searchFilters.isOnlineSale) keys.isOnlineSale = searchFilters.isOnlineSale;
    return Object.keys(keys).length > 0 ? keys : null;
  }, [searchFilters]);

  // ── Fetch orders ──
  const fetchOrders = useCallback(
    async (page: number = 1) => {
      if (!fromDate || !toDate) return;
      setIsLoading(true);
      try {
        const selectedKeys = buildSelectedKeys();
        let res = await GapService.getOrder(page, selectedKeys, 100, fromDate, toDate);

        if (selectedKeys?.objectId && res && !res.results) {
          res = { ...res, results: [res], count: 1 };
        }

        if (res?.results) {
          const items: OrderItem[] = res.results.map(
            (item: Record<string, any>, indexItem: number) => ({
              key: indexItem,
              objectId: item.objectId,
              fullName: item.fullName,
              consignmentId: item.consignmentId,
              consignerIdCard: item.consignerIdCard,
              consigneeName: item.consigneeName,
              phoneNumber: item.phoneNumber,
              totalNumberOfProductForSale: `${Number(item.totalNumberOfProductForSale)}`,
              isTransferMoneyWithBank: item.isTransferMoneyWithBank ? 'Chuyển khoản' : 'Trực tiếp',
              transferBankMoneyAmount: item.transferBankMoneyAmount || '---',
              transferOfflineMoneyAmount: item.transferOfflineMoneyAmount || '---',
              totalMoneyForSale: item.totalMoneyForSale ? `${item.totalMoneyForSale}` : 0,
              totalMoneyForSaleAfterFee:
                (item.totalMoneyForSaleAfterFee
                  ? `${item.totalMoneyForSaleAfterFee}`
                  : `${convertPriceAfterFee(item.totalMoneyForSaleAfterFee)}`) || 0,
              createdAt: moment(item.createdAt).format('DD-MM-YYYY HH:mm'),
              note: item.note || '---',
              isOnlineSale: item.isOnlineSale ? 'Online' : 'Offline',
              shippingInfo: item.shippingInfo,
              clientInfo: item.clientInfo || item.client,
              transporter: item.transporter,
              moneyBackForFullSold: item.moneyBackForFullSold ? `${item.moneyBackForFullSold}` : 0,
              timeConfirmGetMoney:
                item.timeConfirmGetMoney || moment(item.timeConfirmGetMoney).format('DD-MM-YYYY HH:mm'),
              productList: item.productList,
              isGetMoney: item.isOnlineSale ? (item.isGetMoney || false) : true,
            })
          );
          setOrderData(items);
          setTotalCount(res.count || items.length);
        } else {
          setOrderData([]);
          setTotalCount(0);
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
        toast.error('Không thể tải dữ liệu');
      }
      setIsLoading(false);
    },
    [buildSelectedKeys, fromDate, toDate]
  );

  // ── Init: fetch when dates are ready ──
  useEffect(() => {
    if (fromDate && toDate) {
      fetchOrders(1);
    }
  }, [fromDate, toDate, fetchOrders]);

  // ── Search ──
  const handleSearch = () => {
    setCurrentPage(1);
    fetchOrders(1);
  };

  const handleResetSearch = () => {
    setSearchFilters({
      objectId: '',
      phoneNumber: '',
      isTransferMoneyWithBank: '',
      isOnlineSale: '',
    });
    setCurrentPage(1);
    fetchOrders(1);
  };

  // ── Pagination ──
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchOrders(page);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  // ── Expand/Collapse rows ──
  const toggleRow = (objectId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(objectId)) {
        next.delete(objectId);
      } else {
        next.add(objectId);
      }
      return next;
    });
  };

  // ── Build product rows for expanded view ──
  const buildProductRows = (item: OrderItem): ProductRow[] => {
    if (!item.productList) return [];
    return item.productList.map((p, index) => ({
      key: index,
      name: p.name || '',
      note: p.note || '---',
      categoryId: p.categoryId || '',
      code: p.code || '',
      price: Number(p.price) || 0,
      count: Number(p.count) || 0,
      consignmentId: p.consignment?.consignmentId || '',
      priceAfterFee: Number(p.priceAfterFee) || 0,
      soldNumberProduct: Number(p.soldNumberProduct) || 0,
      remainNumberProduct: Number(p.count) - Number(p.soldNumberProduct || 0),
      moneyBackProduct: Number(p.soldNumberProduct || 0) * Number(p.priceAfterFee),
      totalMoney: (Number(p.count) || 0) * (Number(p.price) || 0),
      shippingInfo: p.shippingInfo,
      transporter: p.transporter,
    }));
  };

  // ── Delete order ──
  const openDeleteDialog = (item: OrderItem) => {
    setDeletingItem(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteOrder = async () => {
    if (!deletingItem) return;
    try {
      const res = await GapService.deleteOrder(deletingItem.objectId);
      if (res) {
        setOrderData(prev => prev.filter(o => o.objectId !== deletingItem.objectId));
        toast.success('Xoá thành công');
      } else {
        toast.error('Xoá chưa được');
      }
    } catch (err) {
      console.error(err);
      toast.error('Có lỗi xảy ra');
    }
    setDeleteDialogOpen(false);
    setDeletingItem(null);
  };

  // ── Money confirmation toggle ──
  const openMoneyConfirm = (item: OrderItem) => {
    setMoneyConfirmItem(item);
    setMoneyConfirmOpen(true);
  };

  const handleMoneyConfirm = async () => {
    if (!moneyConfirmItem) return;
    const newData = [...orderData];
    const index = newData.findIndex(o => o.objectId === moneyConfirmItem.objectId);
    if (index === -1) return;

    const item = newData[index];
    let newItem: OrderItem = { ...item, isGetMoney: !item.isGetMoney };

    if (newItem.isGetMoney) {
      newItem = { ...newItem, timeConfirmGetMoney: moment().format('DD-MM-YYYY HH:mm') };
    }

    newData.splice(index, 1, newItem);
    setOrderData(newData);

    try {
      const res = await GapService.updateOrder(newItem);
      if (res) {
        toast.success(`Cập nhật thành công ${item.phoneNumber}`);
      } else {
        toast.error('Cập nhật chưa được');
      }
    } catch (err) {
      console.error(err);
      toast.error('Có lỗi xảy ra');
    }
    setMoneyConfirmOpen(false);
    setMoneyConfirmItem(null);
  };

  // ── GHTK: push order ──
  const handlePushOrderToGHTK = async (row: OrderItem) => {
    if (row && !row.isGetMoney) {
      toast.error('Vui lòng xác nhận Nhận Tiền trước');
      return;
    }
    try {
      const res = await GapService.pushOrderToGHTK(row as any, row.objectId);
      if (res) {
        if (res.error) {
          toast.error(res.error || 'Cập nhật GHTK chưa được');
          return;
        }
        handleRefresh();
      } else {
        toast.error('Cập nhật GHTK chưa được');
      }
    } catch (err) {
      console.error(err);
      toast.error('Có lỗi xảy ra');
    }
  };

  // ── GHTK: view detail ──
  const openGHTKDetail = (item: OrderItem) => {
    if (item?.transporter?.res?.order) {
      setGhtkDetailItem(item);
      setGhtkDetailOpen(true);
    }
  };

  // ── GHTK: cancel order ──
  const handleCancelTransport = async (orderId: string) => {
    try {
      const res = await GapService.deleteTransport(orderId);
      if (res?.result?.success) {
        toast.success('Xoá đơn thành công');
        setGhtkDetailOpen(false);
        handleRefresh();
      } else {
        toast.error('Xoá đơn không thành công');
      }
    } catch (err) {
      console.error(err);
      toast.error('Có lỗi xảy ra');
    }
  };

  // ── GHTK: tracking ──
  const trackingOrder = (labelId: string) => {
    window.open(`https://i.ghtk.vn/${labelId}`, '_blank');
  };

  // ── Refresh ──
  const handleRefresh = () => {
    const thisMonth = moment().month() + 1;
    const thisYear = moment().year();
    const from = moment(`${thisYear}-${thisMonth}-01`, 'YYYY-M-DD').format('YYYY-MM-DD');
    const to = moment(`${thisYear}-${thisMonth}-01`, 'YYYY-M-DD').add(1, 'month').format('YYYY-MM-DD');
    setFromDate(from);
    setToDate(to);
    setCurrentPage(1);
    fetchOrders(1);
  };

  // ── Nest table: save ──
  const handleSaveNestTable = async (productRow: ProductRow, record: OrderItem) => {
    const newData = [...orderData];
    const index = newData.findIndex(o => o.key === record.key);
    if (index === -1) return;

    const item = { ...newData[index] };
    if (!item.productList) return;

    item.productList[productRow.key] = {
      ...item.productList[productRow.key],
      note: productRow.note || '---',
      code: productRow.code,
      name: productRow.name,
      price: Number(productRow.price),
      priceAfterFee: convertPriceAfterFee(Number(productRow.price)) || 0,
      count: Number(productRow.count),
      soldNumberProduct: Number(productRow.soldNumberProduct) || 0,
    };

    let newNumberOfProducts = 0;
    let newRemainNumConsignment = 0;
    let newMoneyBack = 0;
    let newNumSoldConsignment = 0;

    item.productList.forEach(productItem => {
      newNumberOfProducts += Number(productItem.count) || 0;
      newRemainNumConsignment +=
        Number(productItem.count) - Number(productItem.soldNumberProduct || 0);
      newMoneyBack +=
        Number(productItem.soldNumberProduct || 0) *
        Number(productItem.priceAfterFee) *
        1000;
      newNumSoldConsignment += Number(productItem.soldNumberProduct) || 0;
    });

    const newItem: OrderItem = {
      ...item,
      numberOfProducts: newNumberOfProducts,
      remainNumConsignment: newRemainNumConsignment,
      moneyBack: Math.round(newMoneyBack),
      numSoldConsignment: newNumSoldConsignment,
    };

    newData.splice(index, 1, newItem);
    setOrderData(newData);

    try {
      const res = await GapService.updateConsignment(newItem);
      if (res) {
        toast.success(`Cập nhật thành công ${item.phoneNumber}`);
      } else {
        toast.error('Cập nhật chưa được');
      }
    } catch (err) {
      console.error(err);
      toast.error('Có lỗi xảy ra');
    }
  };

  // ── GHTK action column render ──
  const renderGhtkAction = (item: OrderItem) => {
    if (item.isOnlineSale !== 'Online') return null;
    if (!item.transporter) {
      return (
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs w-full"
          onClick={() => handlePushOrderToGHTK(item)}
        >
          <Truck className="h-3 w-3 mr-1" />
          Tạo đơn
        </Button>
      );
    }
    if (item.transporter.success) {
      return (
        <div className="space-y-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs w-full"
            onClick={() => openGHTKDetail(item)}
          >
            Xem GHTK
          </Button>
          <p className="text-xs text-muted-foreground truncate">
            {translateStatusName(item.transporter)}
          </p>
        </div>
      );
    }
    return null;
  };

  // ── Render ──
  return (
    <div className="tableConsignemntScreen-container space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
        >
          <RefreshCw
            className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`}
          />
          Cập nhật
        </Button>

        <span className="text-sm text-muted-foreground ml-auto">
          Tổng: {totalCount} đơn hàng
        </span>
      </div>

      {/* Search filters */}
      <div className="flex flex-wrap items-end gap-3 p-3 border rounded-lg bg-muted/30">
        <div className="space-y-1">
          <Label className="text-xs">Mã đơn hàng</Label>
          <Input
            className="w-[160px] h-8 text-sm"
            value={searchFilters.objectId}
            onChange={e =>
              setSearchFilters(prev => ({ ...prev, objectId: e.target.value }))
            }
            placeholder="Tìm mã đơn"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">SĐT</Label>
          <Input
            className="w-[160px] h-8 text-sm"
            value={searchFilters.phoneNumber}
            onChange={e =>
              setSearchFilters(prev => ({ ...prev, phoneNumber: e.target.value }))
            }
            placeholder="Tìm số điện thoại"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Thanh toán</Label>
          <Select
            value={searchFilters.isTransferMoneyWithBank}
            onValueChange={val =>
              setSearchFilters(prev => ({
                ...prev,
                isTransferMoneyWithBank: val === 'all' ? '' : val,
              }))
            }
          >
            <SelectTrigger className="w-[140px] h-8 text-sm">
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="true">Chuyển khoản</SelectItem>
              <SelectItem value="false">Trực tiếp</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Hình thức</Label>
          <Select
            value={searchFilters.isOnlineSale}
            onValueChange={val =>
              setSearchFilters(prev => ({
                ...prev,
                isOnlineSale: val === 'all' ? '' : val,
              }))
            }
          >
            <SelectTrigger className="w-[140px] h-8 text-sm">
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="true">Online</SelectItem>
              <SelectItem value="false">Offline</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Từ ngày</Label>
          <Input
            type="date"
            className="w-[150px] h-8 text-sm"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Đến ngày</Label>
          <Input
            type="date"
            className="w-[150px] h-8 text-sm"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
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
              <TableHead className="w-[140px]">Mã đơn hàng</TableHead>
              <TableHead>Tên khách hàng</TableHead>
              <TableHead>SĐT</TableHead>
              <TableHead className="text-right">Số lượng</TableHead>
              <TableHead className="text-right">Tổng tiền</TableHead>
              <TableHead className="text-right">Tiền mặt</TableHead>
              <TableHead className="text-right">Chuyển khoản</TableHead>
              <TableHead>Thanh toán</TableHead>
              <TableHead>Hình thức</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead>Ngày nhận tiền</TableHead>
              <TableHead className="w-[70px]">Xoá</TableHead>
              <TableHead className="w-[120px]">GHTK</TableHead>
              <TableHead className="w-[100px]">Bill</TableHead>
              <TableHead className="w-[90px]">Nhận tiền</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={16} className="text-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : orderData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={16}
                  className="text-center py-10 text-muted-foreground"
                >
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              orderData.map((item) => {
                const isExpanded = expandedRows.has(item.objectId);
                const productRows = isExpanded ? buildProductRows(item) : [];

                return (
                  <React.Fragment key={item.objectId}>
                    {/* Main row */}
                    <TableRow>
                      <TableCell className="p-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => toggleRow(item.objectId)}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {item.objectId}
                      </TableCell>
                      <TableCell className="text-sm max-w-[150px] truncate">
                        {item.fullName || '---'}
                      </TableCell>
                      <TableCell className="text-xs">
                        {item.phoneNumber || '---'}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {item.totalNumberOfProductForSale}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {item.totalMoneyForSale
                          ? `${numberWithCommas(Number(item.totalMoneyForSale) * 1000)} đ`
                          : '0 đ'}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {item.transferOfflineMoneyAmount !== '---'
                          ? `${numberWithCommas(Number(item.transferOfflineMoneyAmount) * 1000)} đ`
                          : '---'}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {item.transferBankMoneyAmount !== '---'
                          ? `${numberWithCommas(Number(item.transferBankMoneyAmount) * 1000)} đ`
                          : '---'}
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge variant={item.isTransferMoneyWithBank === 'Chuyển khoản' ? 'default' : 'secondary'}>
                          {item.isTransferMoneyWithBank}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge variant={item.isOnlineSale === 'Online' ? 'default' : 'outline'}>
                          {item.isOnlineSale}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {item.createdAt}
                      </TableCell>
                      <TableCell className="text-xs">
                        {item.timeConfirmGetMoney || '---'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => openDeleteDialog(item)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                      <TableCell>
                        {renderGhtkAction(item)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        (chưa hỗ trợ)
                      </TableCell>
                      <TableCell>
                        {item.isOnlineSale === 'Offline' ? null : (
                          <Button
                            variant={item.isGetMoney ? 'default' : 'outline'}
                            size="sm"
                            className={`h-7 text-xs w-full ${
                              item.isGetMoney
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'border-orange-400 text-orange-600 hover:bg-orange-50'
                            }`}
                            onClick={() => openMoneyConfirm(item)}
                          >
                            {item.isGetMoney ? 'Rồi' : 'Chưa'}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>

                    {/* Expanded product rows */}
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={16} className="bg-muted/20 p-2">
                          <div className="border rounded-md overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Mã SP</TableHead>
                                  <TableHead>Mã ký gửi</TableHead>
                                  <TableHead>Tên SP</TableHead>
                                  <TableHead className="text-right">Giá</TableHead>
                                  <TableHead className="text-right">Số lượng</TableHead>
                                  <TableHead className="text-right">Tổng tiền</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {productRows.length === 0 ? (
                                  <TableRow>
                                    <TableCell
                                      colSpan={6}
                                      className="text-center py-4 text-muted-foreground text-sm"
                                    >
                                      Không có sản phẩm
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  productRows.map(p => (
                                    <TableRow key={p.key}>
                                      <TableCell className="text-xs">{p.code || '---'}</TableCell>
                                      <TableCell className="text-xs">{p.consignmentId || '---'}</TableCell>
                                      <TableCell className="text-sm">{p.name || '---'}</TableCell>
                                      <TableCell className="text-right text-sm">
                                        {p.price ? `${numberWithCommas(p.price * 1000)} đ` : '0 đ'}
                                      </TableCell>
                                      <TableCell className="text-right text-sm">{p.count}</TableCell>
                                      <TableCell className="text-right text-sm font-medium">
                                        {p.totalMoney ? `${numberWithCommas(p.totalMoney * 1000)} đ` : '0 đ'}
                                      </TableCell>
                                    </TableRow>
                                  ))
                                )}
                              </TableBody>
                            </Table>
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

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xoá đơn hàng</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xoá đơn hàng{' '}
              <strong>{deletingItem?.objectId}</strong> của{' '}
              <strong>{deletingItem?.fullName || deletingItem?.phoneNumber}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteOrder}>Xoá</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Money confirmation dialog */}
      <AlertDialog open={moneyConfirmOpen} onOpenChange={setMoneyConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận nhận tiền</AlertDialogTitle>
            <AlertDialogDescription>
              {moneyConfirmItem?.isGetMoney
                ? `Huỷ xác nhận nhận tiền cho đơn ${moneyConfirmItem?.objectId}?`
                : `Xác nhận đã nhận tiền cho đơn ${moneyConfirmItem?.objectId}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction onClick={handleMoneyConfirm}>Xác nhận</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* GHTK Detail Modal */}
      <Dialog open={ghtkDetailOpen} onOpenChange={setGhtkDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Giao hàng tiết kiệm</DialogTitle>
          </DialogHeader>
          {ghtkDetailItem?.transporter?.res?.order && (() => {
            const shipData = ghtkDetailItem.transporter!.res!.order!;
            return (
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">ID đơn GHTK:</span>{' '}
                  {shipData.label_id}
                </p>
                <p>
                  <span className="text-muted-foreground">ID đơn kho GAP:</span>{' '}
                  {shipData.partner_id}
                </p>
                <p>
                  <span className="text-muted-foreground">Tình trạng:</span>{' '}
                  {shipData.status_text}
                </p>
                <p>
                  <span className="text-muted-foreground">Tên KH:</span>{' '}
                  {shipData.customer_fullname}
                </p>
                <p>
                  <span className="text-muted-foreground">SĐT KH:</span>{' '}
                  {shipData.customer_tel}
                </p>
                <p>
                  <span className="text-muted-foreground">Ngày dự kiến:</span>{' '}
                  {shipData.deliver_date}
                </p>
                <p>
                  <span className="text-muted-foreground">Ngày nhận hàng:</span>{' '}
                  {shipData.pick_date}
                </p>
                <p>
                  <span className="text-muted-foreground">Phí giao hàng:</span>{' '}
                  {shipData.ship_money != null
                    ? `${numberWithCommas(shipData.ship_money)} vnđ`
                    : '---'}
                </p>
                <p>
                  <span className="text-muted-foreground">Địa chỉ:</span>{' '}
                  {shipData.address}
                </p>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() =>
                      handleCancelTransport(
                        ghtkDetailItem?.transporter?.order?.objectId || ''
                      )
                    }
                  >
                    Huỷ Đơn Hàng
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      trackingOrder(shipData.label_id || '')
                    }
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Tra cứu GHTK
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TableOrderScreen;
