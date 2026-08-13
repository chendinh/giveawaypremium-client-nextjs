'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { toast } from 'sonner';
import {
  Loader2,
  Plus,
  X,
  Trash2,
  ScanBarcode,
  CheckCircle2,
  Minus,
  Truck,
  ShoppingCart,
  User,
  CreditCard,
  Printer,
  RefreshCw,
} from 'lucide-react';

import GapService from '@/app/actions/GapServices';
import { useAppStore } from '@/store/useAppStore';
import { useReactToPrint } from 'react-to-print';
import ReceiptOffline from './components/ReceiptOffline/index';
import { SearchableSelect } from '@/components/ui/searchable-select';

import './style.scss';

// ─── Helpers ──────────────────────────────────────────
const numberWithCommas = (x: number | string): string =>
  x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** Làm tròn lên đến bội số 1000 gần nhất — dùng cho giá VTP */
const roundUpTo1000 = (price: number): number => Math.ceil(price / 1000) * 1000;

// ─── Types ────────────────────────────────────────────
interface ClientInfo {
  objectId: string;
  fullName: string;
  phoneNumber: string;
  birthday: string;
  bankName: string;
  bankId: string;
  consignerIdCard: string;
  mail: string;
}

interface ShippingInfo {
  optionTransfer: string;
  // tên hiển thị (label)
  orderAdressProvince?: string;
  orderAdressDistrict?: string;
  orderAdressWard?: string;
  orderAdressStreet?: string;
  // VTP numeric IDs — dùng trực tiếp khi gọi API
  vtpProvinceId?: number;
  vtpDistrictId?: number;
  vtpWardId?: number;
  shippingFee?: number;
  /**
   * Ai trả phí ship:
   * '3' = shop trả cước, khách trả tiền hàng (mặc định)
   * '2' = khách trả cả tiền hàng + cước
   * '4' = khách trả cước, shop trả tiền hàng (tiền hàng đã CK trước)
   */
  orderPayment?: '1' | '2' | '3' | '4';
  /**
   * Hình thức lấy hàng:
   * '2' = shipper đến lấy tại shop (mặc định)
   * '1' = shop gửi bưu cục
   */
  pickupType?: '1' | '2';
}

interface ProductItem {
  objectId: string;
  code: string;
  name: string;
  price: number;
  priceAfterFee: number;
  remainNumberProduct: number;
  numberOfProductForSale?: number;
  count?: number;
  [key: string]: unknown;
}

interface OrderPane {
  isOnlineSale: string;
  title: string;
  key: number;
  clientInfo: ClientInfo;
  shippingInfo: ShippingInfo;
  isTransferWithBank: string;
  isTransferWithBankAndOffline: string;
  productList: ProductItem[];
  inputText: string;
  currentTag: number;
  shippingAddress: string;
  isLoadingUser: boolean;
  isFoundUser: boolean;
  isCreatedSuccessfully: boolean;
  totalNumberOfProductForSale: number;
  totalMoneyForSale: number;
  totalMoneyForSaleAfterFee?: number;
  transferBankMoneyAmount: number | null;
  transferOfflineMoneyAmount: number | null;
  note?: string;
  objectIdOrder?: string;
  discountPercent: number;
  selectedEventId: string;
  // Vận đơn VTP
  vtpOrderNumber?: string; // ORDER_NUMBER sau khi tạo vận đơn thành công
  isCreatingShipment?: boolean; // đang gọi API tạo vận đơn
}

interface AddressWard {
  WARDS_ID: number;
  WARDS_NAME: string;
}

interface AddressDistrict {
  DISTRICT_ID: number;
  DISTRICT_NAME: string;
}

interface AddressProvince {
  PROVINCE_ID: number;
  PROVINCE_NAME: string;
}

// ─── Constants ────────────────────────────────────────
const DEFAULT_CLIENT_INFO: ClientInfo = {
  objectId: '',
  fullName: '',
  phoneNumber: '',
  birthday: '',
  bankName: '',
  bankId: '',
  consignerIdCard: '',
  mail: '',
};

const DEFAULT_SHIPPING_INFO: ShippingInfo = {
  optionTransfer: 'tk',
  orderPayment: '4', // khách trả cước, tiền hàng đã CK trước
  pickupType: '2',
};

// ─── Component ────────────────────────────────────────
const SaleScreen: React.FC = () => {
  const { userData, eventsRedux } = useAppStore();

  const [panes, setPanes] = useState<OrderPane[]>([]);
  const [currentPaneIndex, setCurrentPaneIndex] = useState<number>(0);
  const [activeKey, setActiveKey] = useState<number | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState<boolean>(false);

  // VTP address state (cascade)
  const [vtpProvinces, setVtpProvinces] = useState<AddressProvince[]>([]);
  const [vtpDistricts, setVtpDistricts] = useState<AddressDistrict[]>([]);
  const [vtpWards, setVtpWards] = useState<AddressWard[]>([]);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingWards, setIsLoadingWards] = useState(false);

  // VTP available services for current address
  const [vtpServices, setVtpServices] = useState<
    Array<{ code: string; name: string; price: number; time: string }>
  >([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const numPaneTempRef = useRef<number>(0);
  const receiptRef = useRef<HTMLDivElement>(null);
  const didInitRef = useRef<boolean>(false);

  const handlePrintBill = useReactToPrint({
    contentRef: receiptRef,
  });

  // ── Init ──
  useEffect(() => {
    // Guard chống React 18 Strict Mode double-invoke useEffect
    if (didInitRef.current) return;
    didInitRef.current = true;
    addPane();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load VTP provinces once on mount ──
  useEffect(() => {
    GapService.getVtpProvinces()
      .then(res => {
        const list: AddressProvince[] = Array.isArray(res?.result)
          ? res.result
          : [];
        setVtpProvinces(list);
      })
      .catch(() => toast.error('Không thể tải danh sách tỉnh/thành'));
  }, []);

  // ── Focus input when pane changes ──
  useEffect(() => {
    searchInputRef.current?.focus();
  }, [currentPaneIndex]);

  // ─── Tab management ─────────────────────────────────

  const addPane = useCallback(() => {
    const newKey = numPaneTempRef.current;
    numPaneTempRef.current += 1;

    const newPane: OrderPane = {
      isOnlineSale: 'false',
      title: `Đơn hàng ${newKey}`,
      key: newKey,
      clientInfo: { ...DEFAULT_CLIENT_INFO },
      shippingInfo: { ...DEFAULT_SHIPPING_INFO },
      isTransferWithBank: 'false',
      isTransferWithBankAndOffline: 'false',
      productList: [],
      inputText: '',
      currentTag: 1,
      shippingAddress: '',
      isLoadingUser: false,
      isFoundUser: false,
      isCreatedSuccessfully: false,
      totalNumberOfProductForSale: 0,
      totalMoneyForSale: 0,
      transferBankMoneyAmount: null,
      transferOfflineMoneyAmount: null,
      discountPercent: 0,
      selectedEventId: '',
    };

    setPanes(prev => {
      const updated = [...prev, newPane];
      const idx = updated.length - 1;
      setCurrentPaneIndex(idx);
      setActiveKey(newKey);
      return updated;
    });
  }, []);

  const removePane = useCallback(
    (targetKey: number) => {
      setPanes(prev => {
        const deleteIdx = prev.findIndex(p => p.key === targetKey);
        if (deleteIdx === -1) return prev;

        const newPanes = prev.filter(p => p.key !== targetKey);
        if (newPanes.length === 0) {
          setCurrentPaneIndex(0);
          setActiveKey(null);
          return newPanes;
        }

        let newIdx = currentPaneIndex;
        if (deleteIdx <= currentPaneIndex) {
          newIdx = Math.max(0, currentPaneIndex - 1);
        }
        newIdx = Math.min(newIdx, newPanes.length - 1);

        setCurrentPaneIndex(newIdx);
        setActiveKey(newPanes[newIdx]?.key ?? null);
        return newPanes;
      });
    },
    [currentPaneIndex]
  );

  const onChangeTab = useCallback(
    (tabValue: string) => {
      const tabKey = Number(tabValue);
      const idx = panes.findIndex(p => p.key === tabKey);
      if (idx >= 0) {
        setCurrentPaneIndex(idx);
        setActiveKey(tabKey);
        searchInputRef.current?.focus();
      }
    },
    [panes]
  );

  const resetData = useCallback(() => {
    setPanes(prev => {
      const updated = [...prev];
      updated[currentPaneIndex] = {
        ...updated[currentPaneIndex],
        isOnlineSale: 'false',
        clientInfo: { ...DEFAULT_CLIENT_INFO },
        shippingInfo: { ...DEFAULT_SHIPPING_INFO },
        isTransferWithBank: 'false',
        isTransferWithBankAndOffline: 'false',
        productList: [],
        inputText: '',
        currentTag: 1,
        shippingAddress: '',
        isLoadingUser: false,
        isFoundUser: false,
        isCreatedSuccessfully: false,
        totalNumberOfProductForSale: 0,
        totalMoneyForSale: 0,
        totalMoneyForSaleAfterFee: undefined,
        transferBankMoneyAmount: null,
        transferOfflineMoneyAmount: null,
        note: undefined,
        objectIdOrder: undefined,
        discountPercent: 0,
        selectedEventId: '',
      };
      return updated;
    });
  }, [currentPaneIndex]);

  // ─── Helper: update current pane ────────────────────
  const updateCurrentPane = useCallback(
    (updater: (pane: OrderPane) => OrderPane) => {
      setPanes(prev => {
        const updated = [...prev];
        if (updated[currentPaneIndex]) {
          updated[currentPaneIndex] = updater(updated[currentPaneIndex]);
        }
        return updated;
      });
    },
    [currentPaneIndex]
  );

  // ─── Recalculate totals ─────────────────────────────
  const recalculateTotals = useCallback((productList: ProductItem[]) => {
    let totalNumberOfProductForSale = 0;
    let totalMoneyForSale = 0;
    let totalMoneyForSaleAfterFee = 0;
    productList.forEach(item => {
      const qty = item.numberOfProductForSale || 1;
      totalNumberOfProductForSale += qty;
      totalMoneyForSale += qty * item.price;
      totalMoneyForSaleAfterFee += qty * item.priceAfterFee;
    });
    return {
      totalNumberOfProductForSale,
      // Làm tròn để tránh floating point error (vd: 3 * 76.666... = 229.999...)
      totalMoneyForSale: Math.round(totalMoneyForSale * 100) / 100,
      totalMoneyForSaleAfterFee:
        Math.round(totalMoneyForSaleAfterFee * 100) / 100,
    };
  }, []);

  // ─── Recalc totals when discount changes ────────────
  // Chỉ trigger khi discountPercent thực sự thay đổi, không gọi updateCurrentPane
  // vì productList không thay đổi — chỉ cần re-render để hiển thị giá mới
  // (totals được tính inline trong render, không cần lưu vào state)

  // ─── Product scanning ──────────────────────────────
  const onChangeTextProductInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateCurrentPane(pane => ({ ...pane, inputText: e.target.value }));
    },
    [updateCurrentPane]
  );

  const onHandleEnterAndCheckIdProduct = useCallback(
    async (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== 'Enter') return;

      const value = (e.target as HTMLInputElement).value?.trim();
      if (!value) {
        toast.error('Chưa có dữ liệu');
        return;
      }

      toast.loading('Đang tìm kiếm thông tin sản phẩm', {
        id: 'product-search',
      });

      try {
        const productResArr = await GapService.getProductWithCode(value);
        toast.dismiss('product-search');

        if (!productResArr?.results?.[0]?.objectId) {
          toast.error('Sản phẩm không tồn tại');
          return;
        }

        const productRes: ProductItem = productResArr.results[0];

        if (
          productRes.remainNumberProduct !== undefined &&
          Number(productRes.remainNumberProduct) === 0
        ) {
          toast.error('Sản phẩm này đã hết hàng');
          updateCurrentPane(pane => ({ ...pane, inputText: '' }));
          return;
        }

        updateCurrentPane(pane => {
          const existIdx = pane.productList.findIndex(
            item => item.objectId === productRes.objectId
          );

          const newList = [...pane.productList];

          if (existIdx >= 0) {
            const existItem = newList[existIdx];
            const currentQty = existItem.numberOfProductForSale || 1;
            if (currentQty + 1 > existItem.remainNumberProduct) {
              toast.error(
                `Số lượng tối đa là ${existItem.remainNumberProduct}`
              );
              return pane;
            }
            toast.info('Sản phẩm tương đồng');
            newList[existIdx] = {
              ...existItem,
              numberOfProductForSale: currentQty + 1,
            };
          } else {
            newList.push({ ...productRes });
          }

          const totals = recalculateTotals(newList);
          return {
            ...pane,
            productList: newList,
            inputText: '',
            ...totals,
          };
        });
      } catch {
        toast.dismiss('product-search');
        toast.error('Lỗi khi tìm sản phẩm');
      }
    },
    [updateCurrentPane]
  );

  const onDeleteProductItem = useCallback(
    (itemIndex: number) => {
      updateCurrentPane(pane => {
        const newList = pane.productList.filter((_, idx) => idx !== itemIndex);
        const totals = recalculateTotals(newList);
        return { ...pane, productList: newList, ...totals };
      });
    },
    [updateCurrentPane]
  );

  const onChangeProductQuantity = useCallback(
    (value: number, itemIndex: number) => {
      updateCurrentPane(pane => {
        const item = pane.productList[itemIndex];
        if (!item) return pane;
        if (value > item.remainNumberProduct) {
          toast.error(`Số lượng tối đa là ${item.remainNumberProduct}`);
          return pane;
        }
        if (value < 1) return pane;

        const newList = [...pane.productList];
        newList[itemIndex] = { ...item, numberOfProductForSale: value };
        const totals = recalculateTotals(newList);
        return { ...pane, productList: newList, ...totals };
      });
    },
    [updateCurrentPane]
  );

  // ─── Sale type (online/offline) ─────────────────────
  const onChangeOnlineSale = useCallback(
    (value: string) => {
      updateCurrentPane(pane => ({
        ...pane,
        isOnlineSale: value,
        isTransferWithBank: value === 'true' ? 'true' : pane.isTransferWithBank,
      }));
      searchInputRef.current?.focus();
    },
    [updateCurrentPane]
  );

  // ─── Payment method ─────────────────────────────────
  const onChangePaymentMethod = useCallback(
    (value: string) => {
      updateCurrentPane(pane => {
        if (value === 'true') {
          return {
            ...pane,
            isTransferWithBank: 'true',
            isTransferWithBankAndOffline: 'false',
          };
        } else if (value === 'both') {
          return {
            ...pane,
            isTransferWithBank: 'false',
            isTransferWithBankAndOffline: 'true',
          };
        }
        return {
          ...pane,
          isTransferWithBank: 'false',
          isTransferWithBankAndOffline: 'false',
        };
      });
    },
    [updateCurrentPane]
  );

  // ─── Note ───────────────────────────────────────────
  const onChangeNote = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateCurrentPane(pane => ({ ...pane, note: e.target.value }));
    },
    [updateCurrentPane]
  );

  // ─── Split payment amounts ──────────────────────────
  const onChangeSplitAmount = useCallback(
    (
      value: string,
      field: 'transferOfflineMoneyAmount' | 'transferBankMoneyAmount'
    ) => {
      updateCurrentPane(pane => {
        const numVal = Number(value);
        if (!(numVal >= 0)) {
          return {
            ...pane,
            transferOfflineMoneyAmount: null,
            transferBankMoneyAmount: null,
          };
        }
        const total = Number(
          (pane.totalMoneyForSale * (100 - pane.discountPercent)) / 100
        );
        const clamped = Math.min(numVal, total);
        const remainder = total - clamped;

        if (field === 'transferOfflineMoneyAmount') {
          return {
            ...pane,
            transferOfflineMoneyAmount: clamped,
            transferBankMoneyAmount: remainder,
          };
        }
        return {
          ...pane,
          transferBankMoneyAmount: clamped,
          transferOfflineMoneyAmount: remainder,
        };
      });
    },
    [updateCurrentPane]
  );

  // ─── Customer lookup by phone (debounced 400ms) ────
  const phoneDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchUserByPhoneNumber = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const phoneValue = e.target.value || '';

      updateCurrentPane(pane => ({
        ...pane,
        clientInfo: { ...pane.clientInfo, phoneNumber: phoneValue },
        isLoadingUser: phoneValue.length >= 10,
        isFoundUser: false,
      }));

      if (phoneDebounceRef.current) clearTimeout(phoneDebounceRef.current);

      if (phoneValue.length >= 10) {
        phoneDebounceRef.current = setTimeout(async () => {
          toast.loading('Đang lấy thông tin khách hàng...', {
            id: 'customer-lookup',
          });
          try {
            const res = await GapService.getCustomer(phoneValue);
            toast.dismiss('customer-lookup');
            if (res?.results?.[0]) {
              const cust = res.results[0];
              toast.success('Thông tin khách hàng đã tồn tại');
              updateCurrentPane(pane => ({
                ...pane,
                isLoadingUser: false,
                isFoundUser: true,
                clientInfo: {
                  fullName: cust.fullName || '',
                  phoneNumber: cust.phoneNumber || phoneValue,
                  bankName: cust.banks?.[0]?.type || '',
                  bankId: cust.banks?.[0]?.accNumber || '',
                  consignerIdCard: cust.identityNumber || '',
                  birthday: cust.birthday || '',
                  mail: cust.mail || '',
                  objectId: cust.objectId || '',
                },
              }));
            } else {
              toast.info('Thông tin khách hàng chưa tồn tại');
              updateCurrentPane(pane => ({
                ...pane,
                isLoadingUser: false,
                isFoundUser: false,
                clientInfo: { ...DEFAULT_CLIENT_INFO, phoneNumber: phoneValue },
              }));
            }
          } catch {
            toast.dismiss('customer-lookup');
            updateCurrentPane(pane => ({
              ...pane,
              isLoadingUser: false,
              isFoundUser: false,
              clientInfo: { ...DEFAULT_CLIENT_INFO, phoneNumber: phoneValue },
            }));
          }
        }, 400);
      } else {
        updateCurrentPane(pane => ({
          ...pane,
          isLoadingUser: false,
          isFoundUser: false,
          clientInfo: { ...DEFAULT_CLIENT_INFO, phoneNumber: phoneValue },
        }));
      }
    },
    [updateCurrentPane]
  );

  // ─── Client info fields ─────────────────────────────
  const onChangeClientField = useCallback(
    (value: string, field: keyof ClientInfo) => {
      updateCurrentPane(pane => ({
        ...pane,
        clientInfo: { ...pane.clientInfo, [field]: value.trim() },
      }));
    },
    [updateCurrentPane]
  );

  const fetchShippingFee = useCallback(
    async (
      provinceId: number,
      districtId: number,
      wardId: number,
      serviceCode: string
    ) => {
      if (!provinceId || !districtId || !wardId || !serviceCode) return;
      toast.loading('Đang lấy thông tin phí shipping...', {
        id: 'shipping-fee',
      });
      try {
        const resFee = await GapService.getFeeForTransport(
          {
            orderAdressProvince: '',
            orderAdressDistrict: '',
            orderAdressWard: '',
            vtpProvinceId: provinceId,
            vtpDistrictId: districtId,
            vtpWardId: wardId,
            vtpServiceCode: serviceCode,
          },
          false
        );
        toast.dismiss('shipping-fee');
        if (resFee?.result) {
          updateCurrentPane(pane => ({
            ...pane,
            shippingInfo: { ...pane.shippingInfo, shippingFee: resFee.result },
          }));
        } else {
          toast.error('Không thể ước tính phí ship');
        }
      } catch {
        toast.dismiss('shipping-fee');
        toast.error('Không thể ước tính phí ship');
      }
    },
    [updateCurrentPane]
  );

  // ─── Shipping: address selects (VTP cascade) ───────
  const onChangeProvince = useCallback(
    async (value: string) => {
      // value = "PROVINCE_ID|PROVINCE_NAME"
      const [idStr, name] = value.split('|');
      const provinceId = Number(idStr);
      updateCurrentPane(pane => ({
        ...pane,
        shippingInfo: {
          ...pane.shippingInfo,
          orderAdressProvince: name,
          vtpProvinceId: provinceId,
          orderAdressDistrict: undefined,
          vtpDistrictId: undefined,
          orderAdressWard: undefined,
          vtpWardId: undefined,
          shippingFee: undefined,
        },
      }));
      setVtpDistricts([]);
      setVtpWards([]);
      setIsLoadingDistricts(true);
      try {
        const res = await GapService.getVtpDistricts(provinceId);
        setVtpDistricts(Array.isArray(res?.result) ? res.result : []);
      } catch {
        toast.error('Không thể tải danh sách quận/huyện');
      } finally {
        setIsLoadingDistricts(false);
      }
    },
    [updateCurrentPane]
  );

  const onChangeDistrict = useCallback(
    async (value: string) => {
      // value = "DISTRICT_ID|DISTRICT_NAME"
      const [idStr, name] = value.split('|');
      const districtId = Number(idStr);
      updateCurrentPane(pane => ({
        ...pane,
        shippingInfo: {
          ...pane.shippingInfo,
          orderAdressDistrict: name,
          vtpDistrictId: districtId,
          orderAdressWard: undefined,
          vtpWardId: undefined,
          shippingFee: undefined,
        },
      }));
      setVtpWards([]);
      setIsLoadingWards(true);
      try {
        const res = await GapService.getVtpWards(districtId);
        setVtpWards(Array.isArray(res?.result) ? res.result : []);
      } catch {
        toast.error('Không thể tải danh sách phường/xã');
      } finally {
        setIsLoadingWards(false);
      }
    },
    [updateCurrentPane]
  );

  const onChangeWard = useCallback(
    async (value: string) => {
      const [idStr, name] = value.split('|');
      const wardId = Number(idStr);

      // Cập nhật ward vào state, đồng thời lấy provinceId/districtId từ pane hiện tại
      let capturedProvinceId: number | undefined;
      let capturedDistrictId: number | undefined;

      updateCurrentPane(pane => {
        capturedProvinceId = pane.shippingInfo.vtpProvinceId;
        capturedDistrictId = pane.shippingInfo.vtpDistrictId;
        return {
          ...pane,
          shippingInfo: {
            ...pane.shippingInfo,
            orderAdressWard: name,
            vtpWardId: wardId,
            shippingFee: undefined,
            optionTransfer: '',
          },
        };
      });

      if (!capturedProvinceId || !capturedDistrictId) return;

      setVtpServices([]);
      setIsLoadingServices(true);
      try {
        const res = await GapService.getVtpServices(
          capturedProvinceId,
          capturedDistrictId,
          wardId
        );
        const services = Array.isArray(res?.result) ? res.result : [];
        setVtpServices(services);
        if (services.length > 0) {
          const first = services[0];
          updateCurrentPane(p => ({
            ...p,
            shippingInfo: { ...p.shippingInfo, optionTransfer: first.code },
          }));
          fetchShippingFee(
            capturedProvinceId!,
            capturedDistrictId!,
            wardId,
            first.code
          );
        } else {
          toast.error('Không có dịch vụ vận chuyển cho địa chỉ này');
        }
      } catch {
        toast.error('Không thể tải dịch vụ vận chuyển');
      } finally {
        setIsLoadingServices(false);
      }
    },
    [updateCurrentPane, fetchShippingFee]
  );

  const onChangeStreetAddress = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateCurrentPane(pane => ({
        ...pane,
        shippingInfo: {
          ...pane.shippingInfo,
          orderAdressStreet: e.target.value, // trim khi submit, không trim realtime
        },
      }));
    },
    [updateCurrentPane]
  );

  // ─── Shipping method ────────────────────────────────
  const onChangeShippingMethod = useCallback(
    async (value: string) => {
      updateCurrentPane(pane => {
        if (pane.shippingInfo.optionTransfer === value) return pane;
        const newShipping: ShippingInfo = {
          ...pane.shippingInfo,
          optionTransfer: value,
          shippingFee: undefined,
        };
        if (
          newShipping.vtpProvinceId &&
          newShipping.vtpDistrictId &&
          newShipping.vtpWardId
        ) {
          fetchShippingFee(
            newShipping.vtpProvinceId,
            newShipping.vtpDistrictId,
            newShipping.vtpWardId,
            value
          );
        }
        return { ...pane, shippingInfo: newShipping };
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [updateCurrentPane]
  );

  // ─── Create order ───────────────────────────────────
  const onHandleCreateOrder = useCallback(async () => {
    const currentPane = panes[currentPaneIndex];
    if (!currentPane) return;

    // Validation
    if (
      !currentPane.clientInfo.phoneNumber ||
      currentPane.clientInfo.phoneNumber.length <= 9
    ) {
      toast.error('Chưa nhập số điện thoại');
      return;
    }
    if (!currentPane.productList || currentPane.productList.length === 0) {
      toast.error('Chưa có sản phẩm nào');
      return;
    }
    if (
      currentPane.isOnlineSale === 'true' &&
      !currentPane.clientInfo.fullName
    ) {
      toast.error('Chưa nhập tên Khách hàng');
      return;
    }
    if (currentPane.isOnlineSale === 'true') {
      if (
        !currentPane.shippingInfo.orderAdressStreet ||
        currentPane.shippingInfo.orderAdressStreet.trim().length === 0
      ) {
        toast.error('Vui lòng nhập số nhà / tên đường');
        return;
      }
      if (!currentPane.shippingInfo.vtpProvinceId) {
        toast.error('Vui lòng chọn Tỉnh/Thành phố');
        return;
      }
      if (!currentPane.shippingInfo.vtpDistrictId) {
        toast.error('Vui lòng chọn Quận/Huyện');
        return;
      }
      if (!currentPane.shippingInfo.vtpWardId) {
        toast.error('Vui lòng chọn Xã/Phường');
        return;
      }
      if (
        !currentPane.shippingInfo.optionTransfer ||
        currentPane.shippingInfo.optionTransfer === ''
      ) {
        toast.error(
          'Không có dịch vụ vận chuyển cho địa chỉ này. ' +
            'Vui lòng chọn lại địa chỉ hoặc liên hệ hỗ trợ.'
        );
        return;
      }
    }

    setIsCreatingOrder(true);
    toast.loading('Đang xử lý thông tin đơn hàng', { id: 'create-order' });

    try {
      const dataOrder = { ...currentPane };
      // Set count field for each product
      dataOrder.productList = dataOrder.productList.map(item => ({
        ...item,
        count: item.numberOfProductForSale || 1,
      }));

      // Áp dụng discount 1 lần duy nhất cho API call
      const discountedTotal = Math.round(
        (dataOrder.totalMoneyForSale || 0) *
          (1 - (dataOrder.discountPercent || 0) / 100)
      );
      dataOrder.totalMoneyForSale = discountedTotal;

      const resUser = await GapService.getCustomer(
        currentPane.clientInfo.phoneNumber
      );

      if (resUser?.results?.[0]) {
        // Existing customer — update
        const existing = resUser.results[0];
        const customerFormData = {
          consignerName: currentPane.clientInfo.fullName,
          phoneNumber: currentPane.clientInfo.phoneNumber,
          consignerIdCard: currentPane.clientInfo.consignerIdCard,
          mail: currentPane.clientInfo.mail,
          birthday:
            currentPane.clientInfo.birthday &&
            currentPane.clientInfo.birthday.length > 0 &&
            currentPane.clientInfo.birthday !== 'Invalid date'
              ? currentPane.clientInfo.birthday
              : '',
          bankName: currentPane.clientInfo.bankName,
          bankId: currentPane.clientInfo.bankId,
          totalMoneyForSale:
            Number(existing.totalMoneyForSale || 0) +
            Number(dataOrder.totalMoneyForSale || 0),
          numberOfSale: Number(existing.numberOfSale || 0) + 1,
          totalProductForSale:
            Number(existing.totalProductForSale || 0) +
            Number(dataOrder.totalNumberOfProductForSale || 0),
        };

        toast.dismiss('create-order');
        toast.loading('Đang cập nhật thông tin khách hàng', {
          id: 'create-order',
        });
        const resCustomer = await GapService.updateCustomer(
          customerFormData,
          existing.objectId
        );

        if (resCustomer?.updatedAt) {
          toast.success('Cập nhật khách hàng thành công');
          const result = await GapService.setOrder(
            dataOrder,
            userData?.objectId,
            existing.objectId
          );
          toast.dismiss('create-order');

          if (result?.objectId) {
            toast.success('Tạo Đơn hàng thành công');
            updateCurrentPane(pane => ({
              ...pane,
              objectIdOrder: result.objectId,
              isCreatedSuccessfully: true,
              productList: pane.productList.map(item => ({
                ...item,
                count: item.numberOfProductForSale || 1,
              })),
              // Dùng discountedTotal đã tính — không apply discount lần 2
              totalMoneyForSale: discountedTotal,
            }));
          } else {
            toast.error('Tạo Đơn hàng thất bại');
          }
        } else {
          toast.dismiss('create-order');
          toast.error('Cập nhật khách hàng thất bại');
        }
      } else {
        // New customer — create
        const customerFormData = {
          consignerName: currentPane.clientInfo.fullName,
          phoneNumber: currentPane.clientInfo.phoneNumber,
          consignerIdCard: currentPane.clientInfo.consignerIdCard,
          mail: currentPane.clientInfo.mail || 'example@gmail.com',
          birthday:
            currentPane.clientInfo.birthday &&
            currentPane.clientInfo.birthday.length > 0 &&
            currentPane.clientInfo.birthday !== 'Invalid date'
              ? currentPane.clientInfo.birthday
              : '',
          bankName: currentPane.clientInfo.bankName,
          bankId: currentPane.clientInfo.bankId,
          username: currentPane.clientInfo.phoneNumber,
          password: currentPane.clientInfo.phoneNumber,
        };

        toast.dismiss('create-order');
        toast.loading('Đang lưu thông tin khách hàng', { id: 'create-order' });
        const resCus = await GapService.setCustomer(customerFormData);

        if (resCus?.objectId) {
          toast.success('Thêm khách hàng thành công');
          const result = await GapService.setOrder(
            dataOrder,
            userData?.objectId,
            resCus.objectId
          );
          toast.dismiss('create-order');

          if (result?.objectId) {
            toast.success('Tạo Đơn hàng thành công');
            updateCurrentPane(pane => ({
              ...pane,
              objectIdOrder: result.objectId,
              isCreatedSuccessfully: true,
              productList: pane.productList.map(item => ({
                ...item,
                count: item.numberOfProductForSale || 1,
              })),
              totalMoneyForSale: discountedTotal,
            }));
          } else {
            toast.error('Tạo Đơn hàng thất bại');
          }
        } else {
          toast.dismiss('create-order');
          toast.error('Tạo khách hàng thất bại');
        }
      }
    } catch {
      toast.dismiss('create-order');
      toast.error('Có lỗi xảy ra khi tạo đơn hàng');
    }

    setIsCreatingOrder(false);
  }, [panes, currentPaneIndex, userData, updateCurrentPane]);

  // ─── Tạo vận đơn VTP sau khi đơn hàng đã được tạo ──
  const onCreateShipment = useCallback(async () => {
    const currentPane = panes[currentPaneIndex];
    if (!currentPane?.objectIdOrder) return;

    updateCurrentPane(pane => ({ ...pane, isCreatingShipment: true }));
    toast.loading('Đang tạo vận đơn ViettelPost...', { id: 'create-shipment' });

    try {
      const res = await GapService.pushOrderToGHTK(
        currentPane as any,
        currentPane.objectIdOrder
      );

      toast.dismiss('create-shipment');

      // Parse Cloud Function wrap: { result: { status, data: { ORDER_NUMBER } } }
      const orderNumber =
        res?.result?.data?.ORDER_NUMBER || // ← chuẩn
        res?.data?.ORDER_NUMBER ||
        res?.result?.ORDER_NUMBER ||
        res?.ORDER_NUMBER;

      if (orderNumber) {
        toast.success(`Tạo vận đơn thành công! Mã: ${orderNumber}`);
        updateCurrentPane(pane => ({
          ...pane,
          vtpOrderNumber: orderNumber,
          isCreatingShipment: false,
        }));
      } else {
        const errMsg =
          (typeof res?.error === 'string' ? res.error : undefined) ||
          res?.result?.message ||
          res?.message ||
          'Tạo vận đơn thất bại';
        toast.error(errMsg);
        updateCurrentPane(pane => ({ ...pane, isCreatingShipment: false }));
      }
    } catch {
      toast.dismiss('create-shipment');
      toast.error('Lỗi khi tạo vận đơn');
      updateCurrentPane(pane => ({ ...pane, isCreatingShipment: false }));
    }
  }, [panes, currentPaneIndex, updateCurrentPane]);

  const currentPane = panes[currentPaneIndex] ?? null;

  const currentPaymentValue =
    currentPane?.isTransferWithBankAndOffline === 'true'
      ? 'both'
      : currentPane?.isTransferWithBank === 'true'
        ? 'true'
        : 'false';

  // ─── Render ─────────────────────────────────────────
  return (
    <div className="saleScreen-container space-y-4">
      {/* ── Tab bar ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <Tabs
          value={activeKey?.toString() ?? ''}
          onValueChange={onChangeTab}
          className="flex-1"
        >
          <div className="flex items-center gap-2">
            <TabsList className="h-auto flex-wrap gap-5 p-1">
              {panes.map((pane, idx) => (
                <TabsTrigger
                  key={pane.key}
                  value={pane.key.toString()}
                  className="relative pr-7 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {pane.title}
                  {panes.length > 1 && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        removePane(pane.key);
                      }}
                      className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full p-0.5 hover:bg-destructive/20"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
            <Button variant="outline" size="sm" onClick={addPane}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </Tabs>
      </div>

      {/* ── Pane content ── */}
      {currentPane && !currentPane.isCreatedSuccessfully ? (
        <div className="space-y-4">
          {/* Top bar: product input + sale type + create button */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[250px]">
              <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                className="pl-10"
                placeholder="Nhập ID Sản Phẩm"
                value={currentPane.inputText}
                onChange={onChangeTextProductInput}
                onKeyDown={onHandleEnterAndCheckIdProduct}
                autoFocus
              />
            </div>

            <Select
              value={currentPane.isOnlineSale}
              onValueChange={onChangeOnlineSale}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">Offline</SelectItem>
                <SelectItem value="true">Online</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={onHandleCreateOrder}
              disabled={
                isCreatingOrder ||
                (currentPane.isOnlineSale === 'true' &&
                  !!currentPane.shippingInfo.vtpWardId &&
                  !isLoadingServices &&
                  vtpServices.length === 0)
              }
            >
              {isCreatingOrder ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ShoppingCart className="h-4 w-4 mr-2" />
              )}
              Tạo Đơn Hàng
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* ─── Left: Product list ─── */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Danh sách sản phẩm
                  {currentPane.totalNumberOfProductForSale > 0 && (
                    <Badge variant="secondary">
                      {currentPane.totalNumberOfProductForSale} món
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentPane.productList.length > 0 ? (
                  <div className="space-y-1 max-h-[50vh] overflow-y-auto">
                    {/* Header */}
                    <div className="grid grid-cols-[40px_1fr_80px_100px_100px] gap-2 text-xs font-medium text-muted-foreground bg-muted/50 p-2 rounded sticky top-0">
                      <span>#</span>
                      <span>Sản phẩm</span>
                      <span className="text-center">SL</span>
                      <span className="text-right">Giá</span>
                      <span className="text-right">Tổng</span>
                    </div>
                    {/* Items */}
                    {currentPane.productList.map((item, idx) => (
                      <div
                        key={item.objectId}
                        className="grid grid-cols-[40px_1fr_80px_100px_100px] gap-2 items-center p-2 rounded hover:bg-muted/30 text-sm"
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs text-muted-foreground">
                            {idx + 1}
                          </span>
                          <button
                            onClick={() => onDeleteProductItem(idx)}
                            className="text-destructive hover:text-destructive/80"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-mono text-muted-foreground truncate">
                            {item.code}
                          </p>
                          <p className="truncate">{item.name}</p>
                        </div>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() =>
                              onChangeProductQuantity(
                                (item.numberOfProductForSale || 1) - 1,
                                idx
                              )
                            }
                            className="h-6 w-6 flex items-center justify-center rounded border hover:bg-muted"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-sm font-medium">
                            {item.numberOfProductForSale || 1}
                          </span>
                          <button
                            onClick={() =>
                              onChangeProductQuantity(
                                (item.numberOfProductForSale || 1) + 1,
                                idx
                              )
                            }
                            className="h-6 w-6 flex items-center justify-center rounded border hover:bg-muted"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <span className="text-[10px] text-muted-foreground block">
                            /{item.remainNumberProduct}
                          </span>
                        </div>
                        <span className="text-right text-xs">
                          {numberWithCommas(item.price * 1000)} vnđ
                        </span>
                        <span className="text-right text-sm font-medium">
                          {numberWithCommas(
                            item.price *
                              1000 *
                              (item.numberOfProductForSale || 1)
                          )}{' '}
                          vnđ
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-muted-foreground text-sm">
                    Chưa có sản phẩm nào
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ─── Right: Order info + Customer info + Shipping ─── */}
            <div className="space-y-4">
              {/* Order info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Thông tin đơn hàng
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Event selection */}
                  {eventsRedux && eventsRedux.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs">Sự kiện</Label>
                      <Select
                        value={currentPane.selectedEventId || 'none'}
                        onValueChange={value => {
                          const eventId = value === 'none' ? '' : value;
                          const selectedEvent = eventsRedux?.find(
                            (ev: any) => ev.objectId === eventId
                          );
                          updateCurrentPane(pane => ({
                            ...pane,
                            selectedEventId: eventId,
                            discountPercent:
                              selectedEvent?.discountPercent || 0,
                          }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn sự kiện" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Không có sự kiện</SelectItem>
                          {eventsRedux.map((event: any) => (
                            <SelectItem
                              key={event.objectId}
                              value={event.objectId}
                            >
                              {event.name} (-{event.discountPercent}%)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Discount percent input */}
                  <div className="space-y-2">
                    <Label className="text-xs">% Giảm giá</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={currentPane.discountPercent}
                      onChange={e =>
                        updateCurrentPane(pane => ({
                          ...pane,
                          discountPercent: Number(e.target.value),
                        }))
                      }
                      placeholder="0"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Tổng tiền:
                    </span>
                    <span className="text-lg font-bold">
                      {numberWithCommas(
                        (currentPane.totalMoneyForSale || 0) * 1000
                      )}{' '}
                      vnđ
                    </span>
                  </div>

                  {currentPane.discountPercent > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Sau giảm giá ({currentPane.discountPercent}%):
                      </span>
                      <span className="text-lg font-bold text-green-600">
                        {numberWithCommas(
                          Math.round(
                            (currentPane.totalMoneyForSale || 0) *
                              1000 *
                              (1 - currentPane.discountPercent / 100)
                          )
                        )}{' '}
                        vnđ
                      </span>
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-2">
                    <Label className="text-xs">Hình thức trả tiền</Label>
                    <Select
                      value={currentPaymentValue}
                      onValueChange={onChangePaymentMethod}
                      disabled={currentPane.isOnlineSale === 'true'}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currentPane.isOnlineSale !== 'true' && (
                          <SelectItem value="false">Trực tiếp</SelectItem>
                        )}
                        <SelectItem value="true">Chuyển khoản</SelectItem>
                        {currentPane.isOnlineSale !== 'true' && (
                          <SelectItem value="both">Cả hai</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {currentPane.isTransferWithBankAndOffline === 'true' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Tiền mặt</Label>
                        <Input
                          value={currentPane.transferOfflineMoneyAmount ?? ''}
                          onChange={e =>
                            onChangeSplitAmount(
                              e.target.value,
                              'transferOfflineMoneyAmount'
                            )
                          }
                          placeholder="0 vnd"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Tiền chuyển khoản</Label>
                        <Input
                          value={currentPane.transferBankMoneyAmount ?? ''}
                          onChange={e =>
                            onChangeSplitAmount(
                              e.target.value,
                              'transferBankMoneyAmount'
                            )
                          }
                          placeholder="0 vnd"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <Label className="text-xs">Ghi chú</Label>
                    <Textarea
                      placeholder="Ghi chú"
                      value={currentPane.note || ''}
                      onChange={onChangeNote}
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Customer info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Thông tin khách hàng
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Số điện thoại</Label>
                    <div className="relative">
                      <Input
                        value={currentPane.clientInfo.phoneNumber}
                        onChange={fetchUserByPhoneNumber}
                        placeholder="Nhập số điện thoại"
                        maxLength={11}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {currentPane.isLoadingUser ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : currentPane.isFoundUser ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Tên khách hàng</Label>
                      <Input
                        value={currentPane.clientInfo.fullName}
                        onChange={e =>
                          onChangeClientField(e.target.value, 'fullName')
                        }
                        placeholder="..."
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">CMND</Label>
                      <Input
                        value={currentPane.clientInfo.consignerIdCard}
                        onChange={e =>
                          onChangeClientField(e.target.value, 'consignerIdCard')
                        }
                        placeholder="..."
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Email</Label>
                      <Input
                        value={currentPane.clientInfo.mail}
                        onChange={e =>
                          onChangeClientField(e.target.value, 'mail')
                        }
                        placeholder="..."
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Tên ngân hàng</Label>
                      <Input
                        value={currentPane.clientInfo.bankName}
                        onChange={e =>
                          onChangeClientField(e.target.value, 'bankName')
                        }
                        placeholder="..."
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">ID ngân hàng</Label>
                      <Input
                        value={currentPane.clientInfo.bankId}
                        onChange={e =>
                          onChangeClientField(e.target.value, 'bankId')
                        }
                        placeholder="..."
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Sinh nhật</Label>
                      <Input
                        value={currentPane.clientInfo.birthday}
                        onChange={e =>
                          onChangeClientField(e.target.value, 'birthday')
                        }
                        placeholder="..."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Shipping info (online only) */}
              {currentPane.isOnlineSale === 'true' && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      Thông tin vận chuyển
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs">
                        Địa chỉ giao hàng (số nhà - đường)
                        <span className="text-destructive ml-0.5">*</span>
                      </Label>
                      <Input
                        disabled={
                          currentPane.shippingInfo.optionTransfer === 'tt'
                        }
                        value={currentPane.shippingInfo.orderAdressStreet || ''}
                        onChange={onChangeStreetAddress}
                        placeholder="Số nhà - đường"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">
                          Tỉnh/Thành phố
                          <span className="text-destructive ml-0.5">*</span>
                        </Label>
                        <SearchableSelect
                          options={vtpProvinces.map(p => ({
                            value: `${p.PROVINCE_ID}|${p.PROVINCE_NAME}`,
                            label: p.PROVINCE_NAME,
                          }))}
                          value={
                            currentPane.shippingInfo.vtpProvinceId
                              ? `${currentPane.shippingInfo.vtpProvinceId}|${currentPane.shippingInfo.orderAdressProvince}`
                              : ''
                          }
                          onValueChange={onChangeProvince}
                          placeholder="Chọn tỉnh"
                          searchPlaceholder="Tìm tỉnh/thành..."
                          disabled={
                            currentPane.shippingInfo.optionTransfer === 'tt'
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">
                          Quận/Huyện
                          <span className="text-destructive ml-0.5">*</span>
                        </Label>
                        <SearchableSelect
                          options={vtpDistricts.map(d => ({
                            value: `${d.DISTRICT_ID}|${d.DISTRICT_NAME}`,
                            label: d.DISTRICT_NAME,
                          }))}
                          value={
                            currentPane.shippingInfo.vtpDistrictId
                              ? `${currentPane.shippingInfo.vtpDistrictId}|${currentPane.shippingInfo.orderAdressDistrict}`
                              : ''
                          }
                          onValueChange={onChangeDistrict}
                          placeholder={
                            isLoadingDistricts ? 'Đang tải...' : 'Chọn quận'
                          }
                          searchPlaceholder="Tìm quận/huyện..."
                          disabled={
                            currentPane.shippingInfo.optionTransfer === 'tt' ||
                            !currentPane.shippingInfo.vtpProvinceId ||
                            isLoadingDistricts
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">
                          Xã/Phường
                          <span className="text-destructive ml-0.5">*</span>
                        </Label>
                        <SearchableSelect
                          options={vtpWards.map(w => ({
                            value: `${w.WARDS_ID}|${w.WARDS_NAME}`,
                            label: w.WARDS_NAME,
                          }))}
                          value={
                            currentPane.shippingInfo.vtpWardId
                              ? `${currentPane.shippingInfo.vtpWardId}|${currentPane.shippingInfo.orderAdressWard}`
                              : ''
                          }
                          onValueChange={onChangeWard}
                          placeholder={
                            isLoadingWards ? 'Đang tải...' : 'Chọn xã'
                          }
                          searchPlaceholder="Tìm xã/phường..."
                          disabled={
                            currentPane.shippingInfo.optionTransfer === 'tt' ||
                            !currentPane.shippingInfo.vtpDistrictId ||
                            isLoadingWards
                          }
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label className="text-xs">Hình thức giao hàng</Label>
                      {isLoadingServices ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Đang tải dịch vụ...
                        </div>
                      ) : vtpServices.length > 0 ? (
                        <Select
                          value={currentPane.shippingInfo.optionTransfer}
                          onValueChange={onChangeShippingMethod}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn dịch vụ" />
                          </SelectTrigger>
                          <SelectContent>
                            {vtpServices.map(svc => (
                              <SelectItem key={svc.code} value={svc.code}>
                                {svc.name} —{' '}
                                {numberWithCommas(roundUpTo1000(svc.price))} vnđ
                                ({svc.time})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div>
                          {currentPane.shippingInfo.vtpWardId &&
                          !isLoadingServices ? (
                            <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2">
                              <span className="text-destructive text-sm">
                                ⚠️
                              </span>
                              <p className="text-xs text-destructive leading-relaxed">
                                ViettelPost chưa phục vụ địa chỉ này. Vui lòng
                                kiểm tra lại địa chỉ hoặc liên hệ khách hàng
                                chọn địa chỉ khác.
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Chọn đầy đủ Tỉnh → Quận → Phường để xem dịch vụ
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Phí giao hàng:
                      </span>
                      <span className="text-sm font-medium">
                        {currentPane.shippingInfo.shippingFee != null
                          ? `${numberWithCommas(roundUpTo1000(currentPane.shippingInfo.shippingFee))} vnđ`
                          : '---'}
                      </span>
                    </div>

                    <Separator />

                    {/* Người trả phí ship */}
                    <div className="space-y-2">
                      <Label className="text-xs">Người trả phí ship</Label>
                      <Select
                        value={currentPane.shippingInfo.orderPayment ?? '4'}
                        onValueChange={(value: '1' | '2' | '3' | '4') =>
                          updateCurrentPane(pane => ({
                            ...pane,
                            shippingInfo: {
                              ...pane.shippingInfo,
                              orderPayment: value,
                            },
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="4">
                            Khách trả cước — tiền hàng đã CK
                          </SelectItem>
                          <SelectItem value="3">
                            Shop trả cước — khách trả tiền hàng
                          </SelectItem>
                          <SelectItem value="2">
                            Khách trả cả tiền hàng + cước
                          </SelectItem>
                          <SelectItem value="1">
                            Không thu hộ (shop trả cước + tiền hàng)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Hình thức lấy hàng */}
                    <div className="space-y-2">
                      <Label className="text-xs">Hình thức lấy hàng</Label>
                      <Select
                        value={currentPane.shippingInfo.pickupType ?? '2'}
                        onValueChange={(value: '1' | '2') =>
                          updateCurrentPane(pane => ({
                            ...pane,
                            shippingInfo: {
                              ...pane.shippingInfo,
                              pickupType: value,
                            },
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2">
                            Shipper đến lấy tại shop
                          </SelectItem>
                          <SelectItem value="1">Shop gửi bưu cục</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      ) : currentPane?.isCreatedSuccessfully ? (
        /* ── Success view ── */
        <Card className="max-w-lg mx-auto mt-8">
          <CardContent className="pt-6 text-center space-y-6">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <div>
              <h2 className="text-xl font-semibold">
                Tạo đơn hàng thành công!
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {currentPane.isOnlineSale === 'true'
                  ? 'Đơn hàng online đã được tạo. Bước tiếp theo: vận chuyển.'
                  : 'Đơn hàng đã hoàn tất.'}
              </p>
              {currentPane.objectIdOrder && (
                <Badge variant="outline" className="mt-2">
                  Mã đơn: {currentPane.objectIdOrder}
                </Badge>
              )}
            </div>

            {/* Progress steps */}
            <div className="flex items-center justify-center gap-2 text-sm">
              <Badge variant="default">Đơn Hàng ✓</Badge>
              <span className="text-muted-foreground">→</span>
              <Badge variant="default">Khách Hàng ✓</Badge>
              {currentPane.isOnlineSale === 'true' && (
                <>
                  <span className="text-muted-foreground">→</span>
                  <Badge variant="default">Vận chuyển ✓</Badge>
                </>
              )}
              <span className="text-muted-foreground">→</span>
              <Badge variant="default">Hoàn Thành ✓</Badge>
            </div>

            {/* ── Tạo vận đơn VTP (chỉ khi online) ── */}
            {currentPane.isOnlineSale === 'true' && (
              <div className="border rounded-lg p-4 space-y-3 text-left bg-muted/30">
                <div className="flex items-center gap-2 font-medium text-sm">
                  <Truck className="h-4 w-4" />
                  Vận đơn ViettelPost
                </div>

                {currentPane.vtpOrderNumber ? (
                  /* Đã có vận đơn */
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      <span className="text-sm text-green-700 font-medium">
                        Vận đơn đã được tạo
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        Mã vận đơn:
                      </span>
                      <Badge
                        variant="secondary"
                        className="font-mono text-sm select-all"
                      >
                        {currentPane.vtpOrderNumber}
                      </Badge>
                      <a
                        href={`https://viettelpost.vn/tra-cuu-hanh-trinh-don/?peopleTracking=sender&orderNumber=${currentPane.vtpOrderNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 underline underline-offset-2 hover:text-blue-800"
                      >
                        Tra cứu →
                      </a>
                    </div>
                  </div>
                ) : (
                  /* Chưa có vận đơn */
                  <div className="space-y-3">
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>
                        Dịch vụ:{' '}
                        <span className="font-medium">
                          {currentPane.shippingInfo.optionTransfer || '—'}
                        </span>
                      </p>
                      <p>
                        Địa chỉ:{' '}
                        <span className="font-medium">
                          {[
                            currentPane.shippingInfo.orderAdressStreet,
                            currentPane.shippingInfo.orderAdressWard,
                            currentPane.shippingInfo.orderAdressDistrict,
                            currentPane.shippingInfo.orderAdressProvince,
                          ]
                            .filter(Boolean)
                            .join(', ') || '—'}
                        </span>
                      </p>
                    </div>
                    <Button
                      className="w-full"
                      onClick={onCreateShipment}
                      disabled={currentPane.isCreatingShipment}
                    >
                      {currentPane.isCreatingShipment ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Truck className="h-4 w-4 mr-2" />
                      )}
                      {currentPane.isCreatingShipment
                        ? 'Đang tạo vận đơn...'
                        : 'Tạo vận đơn ViettelPost'}
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" onClick={() => handlePrintBill()}>
                <Printer className="h-4 w-4 mr-2" />
                In hoá đơn
              </Button>
              <Button onClick={resetData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Tạo mới
              </Button>
            </div>
            <div style={{ display: 'none' }}>
              <ReceiptOffline
                ref={receiptRef}
                data={{
                  objectIdOrder: currentPane?.objectIdOrder,
                  productList: currentPane?.productList?.map(p => ({
                    name: p.name,
                    price: p.price,
                    count: p.count,
                  })),
                  totalNumberOfProductForSale:
                    currentPane?.totalNumberOfProductForSale,
                  totalMoneyForSale: currentPane?.totalMoneyForSale,
                }}
              />
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};

export default SaleScreen;
