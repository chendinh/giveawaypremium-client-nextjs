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
  RotateCw,
} from 'lucide-react';

import GapService from '@/app/actions/GapServices';
import { useAppStore } from '@/store/useAppStore';
import { format, startOfMonth, addMonths, parseISO, isValid } from 'date-fns';

import { DatePickerInput } from '@/components/ui/date-picker-input';
import TagPrintBox from './components/TagPrintBox/index';
import BillOrderGHTK from './components/BillOrderGHTK/index';

import './style.scss';

// ─── Helpers ──────────────────────────────────────────
const numberWithCommas = (x: number | string): string => {
  // Làm tròn để tránh hiển thị floating point error (vd: "229.99999999999997")
  const n = Math.round(Number(x));
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const convertPriceAfterFee = (productPrice: number = 0): number => {
  if (productPrice <= 0) return 0;
  if (productPrice < 1000) return Math.round((productPrice * 74) / 100);
  if (productPrice <= 10000) return Math.round((productPrice * 77) / 100);
  return Math.round((productPrice * 80) / 100);
};

/** Format a date string or ISO date safely. Returns '---' on invalid input. */
const formatDate = (
  value: string | undefined,
  fmt = 'dd-MM-yyyy HH:mm'
): string => {
  if (!value) return '---';
  try {
    const d = parseISO(value);
    return isValid(d) ? format(d, fmt) : value;
  } catch {
    return value;
  }
};

/** Get YYYY-MM-DD bounds for current month */
const currentMonthRange = (): { from: string; to: string } => {
  const now = new Date();
  return {
    from: format(startOfMonth(now), 'yyyy-MM-dd'),
    to: format(addMonths(startOfMonth(now), 1), 'yyyy-MM-dd'),
  };
};

const translateStatusName = (
  transporter: TransporterInfo | undefined
): string => {
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
  vtpStatusName?: string; // tên trạng thái gốc từ VTP (lưu bởi webhook)
  res?: {
    // VTP envelope: { status, data: { ORDER_NUMBER, ... } }
    status?: number;
    message?: string;
    data?: {
      ORDER_NUMBER?: string;
      MONEY_TOTAL?: number;
      MONEY_COLLECTION?: number;
      EXCHANGE_WEIGHT?: number;
      ORDER_STATUS?: number;
      RECEIVER_PROVINCE?: number;
      RECEIVER_DISTRICT?: number;
      SORT_CODE?: string;
    };
    // Legacy: một số đơn cũ lưu trực tiếp ORDER_NUMBER ở root
    ORDER_NUMBER?: string;
    MONEY_TOTAL?: number;
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
  const [moneyConfirmItem, setMoneyConfirmItem] = useState<OrderItem | null>(
    null
  );

  // VTP detail modal
  const [vtpDetailOpen, setVtpDetailOpen] = useState<boolean>(false);
  const [vtpDetailItem, setVtpDetailItem] = useState<OrderItem | null>(null);
  const [isRefreshingVtp, setIsRefreshingVtp] = useState<boolean>(false);

  // ── Initialize date range to current month ──
  useEffect(() => {
    const { from, to } = currentMonthRange();
    setFromDate(from);
    setToDate(to);
  }, []);

  // ── Build selected keys for API ──
  const buildSelectedKeys = useCallback((): Record<string, string> | null => {
    const keys: Record<string, string> = {};
    if (searchFilters.objectId) keys.objectId = searchFilters.objectId;
    if (searchFilters.phoneNumber) keys.phoneNumber = searchFilters.phoneNumber;
    if (searchFilters.isTransferMoneyWithBank)
      keys.isTransferMoneyWithBank = searchFilters.isTransferMoneyWithBank;
    if (searchFilters.isOnlineSale)
      keys.isOnlineSale = searchFilters.isOnlineSale;
    return Object.keys(keys).length > 0 ? keys : null;
  }, [searchFilters]);

  // ── Fetch orders ──
  const fetchOrders = useCallback(
    async (page: number = 1) => {
      if (!fromDate || !toDate) return;
      setIsLoading(true);
      try {
        const selectedKeys = buildSelectedKeys();
        let res = await GapService.getOrder(
          page,
          selectedKeys,
          100,
          fromDate,
          toDate
        );

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
              isTransferMoneyWithBank: item.isTransferMoneyWithBank
                ? 'Chuyển khoản'
                : 'Trực tiếp',
              transferBankMoneyAmount: item.transferBankMoneyAmount || '---',
              transferOfflineMoneyAmount:
                item.transferOfflineMoneyAmount || '---',
              totalMoneyForSale: item.totalMoneyForSale
                ? `${item.totalMoneyForSale}`
                : 0,
              totalMoneyForSaleAfterFee:
                (item.totalMoneyForSaleAfterFee
                  ? `${item.totalMoneyForSaleAfterFee}`
                  : `${convertPriceAfterFee(item.totalMoneyForSaleAfterFee)}`) ||
                0,
              createdAt: formatDate(item.createdAt),
              note: item.note || '---',
              isOnlineSale: item.isOnlineSale ? 'Online' : 'Offline',
              shippingInfo: item.shippingInfo,
              clientInfo: item.clientInfo || item.client,
              transporter: item.transporter,
              moneyBackForFullSold: item.moneyBackForFullSold
                ? `${item.moneyBackForFullSold}`
                : 0,
              timeConfirmGetMoney: formatDate(item.timeConfirmGetMoney),
              productList: item.productList,
              isGetMoney: item.isOnlineSale ? item.isGetMoney || false : true,
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
      moneyBackProduct:
        Number(p.soldNumberProduct || 0) * Number(p.priceAfterFee),
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
        setOrderData(prev =>
          prev.filter(o => o.objectId !== deletingItem.objectId)
        );
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
    const index = newData.findIndex(
      o => o.objectId === moneyConfirmItem.objectId
    );
    if (index === -1) return;

    const item = newData[index];
    const newItem: OrderItem = { ...item, isGetMoney: !item.isGetMoney };

    if (newItem.isGetMoney) {
      newItem.timeConfirmGetMoney = format(new Date(), 'dd-MM-yyyy HH:mm');
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

  // ── VTP: push order ──
  const handlePushOrderToVTP = async (row: OrderItem) => {
    if (row && !row.isGetMoney) {
      toast.error('Vui lòng xác nhận Nhận Tiền trước');
      return;
    }

    // Kiểm tra địa chỉ VTP trước khi gọi API
    const shippingInfo = row.shippingInfo as any;
    if (
      !shippingInfo?.vtpProvinceId ||
      !shippingInfo?.vtpDistrictId ||
      !shippingInfo?.vtpWardId
    ) {
      toast.error(
        'Đơn hàng này thiếu thông tin địa chỉ VTP (tỉnh/quận/phường). ' +
          'Vui lòng tạo lại đơn từ màn hình Bán hàng và chọn đầy đủ địa chỉ.'
      );
      return;
    }

    try {
      const res = await GapService.pushOrderToGHTK(row as any, row.objectId);
      if (res) {
        if (typeof res.error === 'string' && res.error) {
          toast.error(res.error);
          return;
        }
        // Kiểm tra lỗi trong result (VTP trả về lỗi trong result.status)
        if (res.result?.status && res.result.status !== 200) {
          toast.error(res.result?.message || 'Tạo vận đơn VTP chưa được');
          return;
        }
        // Parse Cloud Function: { result: { data: { ORDER_NUMBER } } }
        const orderNumber =
          res?.result?.data?.ORDER_NUMBER ||
          res?.data?.ORDER_NUMBER ||
          res?.result?.ORDER_NUMBER ||
          res?.ORDER_NUMBER;
        toast.success(
          orderNumber
            ? `Tạo vận đơn thành công! Mã: ${orderNumber}`
            : 'Tạo vận đơn thành công'
        );
        handleRefresh();
      } else {
        toast.error(
          'Tạo vận đơn VTP chưa được. Kiểm tra lại địa chỉ người nhận.'
        );
      }
    } catch (err) {
      console.error(err);
      toast.error('Có lỗi xảy ra khi tạo vận đơn');
    }
  };

  // ── VTP: view detail ──
  const openVTPDetail = (item: OrderItem) => {
    if (item?.transporter) {
      setVtpDetailItem(item);
      setVtpDetailOpen(true);
    }
  };

  // ── VTP: cancel order ──
  const handleCancelTransport = async (orderId: string) => {
    try {
      const res = await GapService.deleteTransport(orderId);
      if (res?.result?.success) {
        toast.success('Huỷ vận đơn thành công');
        setVtpDetailOpen(false);
        handleRefresh();
      } else {
        toast.error('Huỷ vận đơn không thành công');
      }
    } catch (err) {
      console.error(err);
      toast.error('Có lỗi xảy ra');
    }
  };

  // ── VTP: tracking ──
  const trackingOrder = (orderNumber: string) => {
    window.open(
      `https://www.viettelpost.vn/tra-cuu-hanh-trinh-don/?orderNumber=${orderNumber}`,
      '_blank'
    );
  };

  // ── Refresh ──
  const handleRefresh = () => {
    const { from, to } = currentMonthRange();
    setFromDate(from);
    setToDate(to);
    setCurrentPage(1);
    fetchOrders(1);
  };

  // ── Nest table: save ──
  const handleSaveNestTable = async (
    productRow: ProductRow,
    record: OrderItem
  ) => {
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

  // ── VTP action column render ──
  const renderVTPAction = (item: OrderItem) => {
    if (item.isOnlineSale !== 'Online') return null;
    if (!item.transporter) {
      return (
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs w-full"
          onClick={() => handlePushOrderToVTP(item)}
        >
          <Truck className="h-3 w-3 mr-1" />
          Tạo đơn
        </Button>
      );
    }
    return (
      <div className="space-y-1">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs w-full"
          onClick={() => openVTPDetail(item)}
        >
          Xem VTP
        </Button>
        <p className="text-xs text-muted-foreground truncate">
          {translateStatusName(item.transporter)}
        </p>
      </div>
    );
  };

  // ── Render ──
  return (
    <div className="tableConsignemntScreen-container space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" onClick={handleRefresh}>
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
      <div className="flex flex-wrap items-end gap-3 p-3 border rounded-lg bg-muted/30 overflow-visible">
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
              setSearchFilters(prev => ({
                ...prev,
                phoneNumber: e.target.value,
              }))
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
        <div className="space-y-1 flex flex-col">
          <Label className="text-xs">Từ ngày</Label>
          <DatePickerInput
            value={fromDate}
            onChange={setFromDate}
            placeholder="Từ ngày"
          />
        </div>
        <div className="space-y-1 flex flex-col">
          <Label className="text-xs">Đến ngày</Label>
          <DatePickerInput
            value={toDate}
            onChange={setToDate}
            placeholder="Đến ngày"
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
            <TableRow className="text-sm">
              <TableHead className="w-8 p-1" />
              <TableHead className="min-w-[120px]">Mã đơn</TableHead>
              <TableHead className="min-w-[170px]">Khách hàng</TableHead>
              <TableHead className="min-w-[180px] text-right">Tiền</TableHead>
              <TableHead className="min-w-[110px]">Thanh toán</TableHead>
              <TableHead className="min-w-[150px]">Ngày</TableHead>
              <TableHead className="min-w-[120px]">VTP</TableHead>
              <TableHead className="min-w-[130px] text-center">
                Thao tác
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : orderData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-10 text-muted-foreground"
                >
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              orderData.map(item => {
                const isExpanded = expandedRows.has(item.objectId);
                const productRows = isExpanded ? buildProductRows(item) : [];

                return (
                  <React.Fragment key={item.objectId}>
                    <TableRow className="align-top">
                      {/* Expand toggle */}
                      <TableCell className="p-1 pt-2">
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

                      {/* Mã đơn + badge hình thức */}
                      <TableCell className="py-2">
                        <p className="text-xs font-mono text-muted-foreground leading-tight truncate max-w-[110px]">
                          {item.objectId}
                        </p>
                        <Badge
                          variant={
                            item.isOnlineSale === 'Online'
                              ? 'default'
                              : 'outline'
                          }
                          className="mt-1 text-xs px-1.5 h-5"
                        >
                          {item.isOnlineSale}
                        </Badge>
                      </TableCell>

                      {/* Khách hàng */}
                      <TableCell className="py-2">
                        <p className="text-sm font-medium leading-tight truncate max-w-[160px]">
                          {item.fullName || '---'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.phoneNumber || '---'}
                        </p>
                      </TableCell>

                      {/* Tiền — stacked */}
                      <TableCell className="py-2 text-right">
                        <p className="text-sm font-semibold leading-tight">
                          {item.totalMoneyForSale
                            ? `${numberWithCommas(Number(item.totalMoneyForSale) * 1000)}đ`
                            : '0đ'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          SL: {item.totalNumberOfProductForSale}
                        </p>
                        {item.transferOfflineMoneyAmount !== '---' && (
                          <p className="text-xs text-muted-foreground">
                            TM:{' '}
                            {numberWithCommas(
                              Number(item.transferOfflineMoneyAmount) * 1000
                            )}
                            đ
                          </p>
                        )}
                        {item.transferBankMoneyAmount !== '---' && (
                          <p className="text-xs text-muted-foreground">
                            CK:{' '}
                            {numberWithCommas(
                              Number(item.transferBankMoneyAmount) * 1000
                            )}
                            đ
                          </p>
                        )}
                      </TableCell>

                      {/* Thanh toán */}
                      <TableCell className="py-2">
                        <Badge
                          variant={
                            item.isTransferMoneyWithBank === 'Chuyển khoản'
                              ? 'default'
                              : 'secondary'
                          }
                          className="text-xs px-2 h-6 whitespace-nowrap"
                        >
                          {item.isTransferMoneyWithBank}
                        </Badge>
                      </TableCell>

                      {/* Ngày tạo + ngày nhận tiền */}
                      <TableCell className="py-2">
                        <p className="text-xs leading-tight">
                          {item.createdAt}
                        </p>
                        {item.timeConfirmGetMoney !== '---' && (
                          <p className="text-xs text-green-600 mt-0.5">
                            ✓ {item.timeConfirmGetMoney}
                          </p>
                        )}
                      </TableCell>

                      {/* VTP */}
                      <TableCell className="py-2">
                        {renderVTPAction(item)}
                      </TableCell>

                      {/* Thao tác — nhận tiền + bill + xoá */}
                      <TableCell className="py-2">
                        <div className="flex items-center gap-1 justify-center flex-wrap">
                          {item.isOnlineSale !== 'Offline' && (
                            <Button
                              variant={item.isGetMoney ? 'default' : 'outline'}
                              size="sm"
                              className={`h-7 text-xs px-2 ${
                                item.isGetMoney
                                  ? 'bg-green-600 hover:bg-green-700'
                                  : 'border-orange-400 text-orange-600 hover:bg-orange-50'
                              }`}
                              onClick={() => openMoneyConfirm(item)}
                            >
                              {item.isGetMoney ? 'Đã nhận' : 'Chưa nhận'}
                            </Button>
                          )}
                          <TagPrintBox
                            data={{
                              code: item.objectId,
                              objectIdOrder: item.objectId,
                              productList: item.productList?.map(p => ({
                                name: p.name,
                                price: p.price,
                                count:
                                  typeof p.count === 'string'
                                    ? parseInt(p.count, 10)
                                    : p.count,
                              })),
                              totalNumberOfProductForSale:
                                item.totalNumberOfProductForSale,
                              totalMoneyForSale: item.totalMoneyForSale,
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => openDeleteDialog(item)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expanded product rows */}
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={8} className="bg-muted/20 p-2">
                          <div className="border rounded-md overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Mã SP</TableHead>
                                  <TableHead>Mã ký gửi</TableHead>
                                  <TableHead>Tên SP</TableHead>
                                  <TableHead className="text-right">
                                    Giá
                                  </TableHead>
                                  <TableHead className="text-right">
                                    Số lượng
                                  </TableHead>
                                  <TableHead className="text-right">
                                    Tổng tiền
                                  </TableHead>
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
                                      <TableCell className="text-xs">
                                        {p.code || '---'}
                                      </TableCell>
                                      <TableCell className="text-xs">
                                        {p.consignmentId || '---'}
                                      </TableCell>
                                      <TableCell className="text-sm">
                                        {p.name || '---'}
                                      </TableCell>
                                      <TableCell className="text-right text-sm">
                                        {p.price
                                          ? `${numberWithCommas(p.price * 1000)} đ`
                                          : '0 đ'}
                                      </TableCell>
                                      <TableCell className="text-right text-sm">
                                        {p.count}
                                      </TableCell>
                                      <TableCell className="text-right text-sm font-medium">
                                        {p.totalMoney
                                          ? `${numberWithCommas(p.totalMoney * 1000)} đ`
                                          : '0 đ'}
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
              <strong>
                {deletingItem?.fullName || deletingItem?.phoneNumber}
              </strong>
              ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteOrder}>
              Xoá
            </AlertDialogAction>
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
            <AlertDialogAction onClick={handleMoneyConfirm}>
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* VTP Detail Modal */}
      <Dialog open={vtpDetailOpen} onOpenChange={setVtpDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>ViettelPost — Chi tiết vận đơn</DialogTitle>
          </DialogHeader>
          {vtpDetailItem?.transporter &&
            (() => {
              const res = vtpDetailItem.transporter!.res || {};
              // res là VTP envelope: { status, data: { ORDER_NUMBER, ... } }
              // Một số đơn cũ lưu ORDER_NUMBER trực tiếp ở root
              const orderNumber = res.data?.ORDER_NUMBER || res.ORDER_NUMBER;
              const moneyTotal = res.data?.MONEY_TOTAL ?? res.MONEY_TOTAL;
              const sortCode = res.data?.SORT_CODE;
              const vtpStatusName = vtpDetailItem.transporter!.vtpStatusName;
              return (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2 flex-1">
                      <p>
                        <span className="text-muted-foreground">
                          Mã vận đơn VTP:
                        </span>{' '}
                        <span className="font-mono font-medium">
                          {orderNumber || '---'}
                        </span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">
                          Tình trạng:
                        </span>{' '}
                        <span className="font-medium">
                          {translateStatusName(vtpDetailItem.transporter)}
                        </span>
                        {vtpStatusName && (
                          <span className="text-muted-foreground ml-1 text-xs">
                            ({vtpStatusName})
                          </span>
                        )}
                      </p>
                    </div>
                    {/* <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if (!vtpDetailItem.objectId) return;
                        setIsRefreshingVtp(true);
                        try {
                          const result = await GapService.getVtpOrderStatus(
                            vtpDetailItem.objectId
                          );
                          const detail = result?.result?.data || result?.data;
                          if (detail?.ORDER_STATUS != null) {
                            const VTP_STATUS_MAP: Record<number, string> = {
                              101: 'VTP từ chối nhận',
                              102: 'Chờ xử lý',
                              103: 'Giao bưu cục — đang chờ lấy',
                              104: 'Phân công bưu tá đi lấy',
                              105: 'Bưu tá đã lấy hàng',
                              200: 'VTP nhập doanh — đang vận chuyển',
                              300: 'Khai thác đi',
                              400: 'Khai thác đến',
                              500: 'Bưu tá đang đi giao',
                              501: 'Phát thành công ✓',
                              503: 'Hủy theo yêu cầu KH',
                              504: 'Hoàn thành công',
                              505: 'Phát thất bại — chờ xử lý',
                              506: 'Hẹn giao lại',
                              507: 'KH đến bưu cục nhận',
                            };
                            const statusText =
                              VTP_STATUS_MAP[detail.ORDER_STATUS] ||
                              `Mã ${detail.ORDER_STATUS}`;
                            toast.success(`Trạng thái VTP: ${statusText}`);
                            handleRefresh();
                          }
                        } catch {
                          toast.error('Không lấy được trạng thái từ VTP');
                        } finally {
                          setIsRefreshingVtp(false);
                        }
                      }}
                      disabled={isRefreshingVtp}
                      title="Lấy trạng thái mới nhất từ VTP"
                    >
                      {isRefreshingVtp ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <RotateCw className="h-3 w-3 mr-1" />
                      )}
                      Refresh
                    </Button> */}
                  </div>
                  {sortCode && (
                    <p>
                      <span className="text-muted-foreground">Sort code:</span>{' '}
                      <span className="font-mono text-xs">{sortCode}</span>
                    </p>
                  )}
                  {moneyTotal != null && (
                    <p>
                      <span className="text-muted-foreground">
                        Phí giao hàng:
                      </span>{' '}
                      {numberWithCommas(moneyTotal)} vnđ
                    </p>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() =>
                        handleCancelTransport(
                          vtpDetailItem?.transporter?.order?.objectId || ''
                        )
                      }
                    >
                      Huỷ vận đơn
                    </Button>
                    {orderNumber && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => trackingOrder(orderNumber)}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Tra cứu VTP
                      </Button>
                    )}
                  </div>
                  <div className="border-t pt-3 mt-3">
                    <p className="text-sm font-medium mb-2">Nhãn đơn hàng</p>
                    <BillOrderGHTK orderId={vtpDetailItem.objectId} />
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
