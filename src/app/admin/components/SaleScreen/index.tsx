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

import './style.scss';

// ─── Helpers ──────────────────────────────────────────
const numberWithCommas = (x: number | string): string =>
  x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

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
  orderAdressProvince?: string;
  orderAdressDistrict?: string;
  orderAdressWard?: string;
  orderAdressStreet?: string;
  shippingFee?: number;
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
}

interface AddressWard {
  name: string;
}

interface AddressDistrict {
  name: string;
  wards: AddressWard[];
}

interface AddressProvince {
  name: string;
  districts: AddressDistrict[];
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
};

// ─── Component ────────────────────────────────────────
const SaleScreen: React.FC = () => {
  const { userData, unitAddressRedux } = useAppStore();

  const [panes, setPanes] = useState<OrderPane[]>([]);
  const [currentPaneIndex, setCurrentPaneIndex] = useState<number>(0);
  const [activeKey, setActiveKey] = useState<number | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState<boolean>(false);

  // Address options derived from unitAddressRedux
  const [provinces, setProvinces] = useState<AddressProvince[]>([]);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const numPaneTempRef = useRef<number>(0);

  // ── Init ──
  useEffect(() => {
    if (unitAddressRedux && Array.isArray(unitAddressRedux)) {
      setProvinces(unitAddressRedux as AddressProvince[]);
    }
    addPane();
    return () => {
      numPaneTempRef.current = 0;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const recalculateTotals = (productList: ProductItem[]) => {
    let totalNumberOfProductForSale = 0;
    let totalMoneyForSale = 0;
    let totalMoneyForSaleAfterFee = 0;
    productList.forEach(item => {
      const qty = item.numberOfProductForSale || 1;
      totalNumberOfProductForSale += qty;
      totalMoneyForSale += qty * item.price;
      totalMoneyForSaleAfterFee += qty * item.priceAfterFee;
    });
    return { totalNumberOfProductForSale, totalMoneyForSale, totalMoneyForSaleAfterFee };
  };

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

      toast.loading('Đang tìm kiếm thông tin sản phẩm', { id: 'product-search' });

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
              toast.error(`Số lượng tối đa là ${existItem.remainNumberProduct}`);
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
          return { ...pane, isTransferWithBank: 'true', isTransferWithBankAndOffline: 'false' };
        } else if (value === 'both') {
          return { ...pane, isTransferWithBank: 'false', isTransferWithBankAndOffline: 'true' };
        }
        return { ...pane, isTransferWithBank: 'false', isTransferWithBankAndOffline: 'false' };
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
    (value: string, field: 'transferOfflineMoneyAmount' | 'transferBankMoneyAmount') => {
      updateCurrentPane(pane => {
        const numVal = Number(value);
        if (!(numVal >= 0)) {
          return { ...pane, transferOfflineMoneyAmount: null, transferBankMoneyAmount: null };
        }
        const total = Number(pane.totalMoneyForSale);
        const clamped = Math.min(numVal, total);
        const remainder = total - clamped;

        if (field === 'transferOfflineMoneyAmount') {
          return { ...pane, transferOfflineMoneyAmount: clamped, transferBankMoneyAmount: remainder };
        }
        return { ...pane, transferBankMoneyAmount: clamped, transferOfflineMoneyAmount: remainder };
      });
    },
    [updateCurrentPane]
  );

  // ─── Customer lookup by phone ───────────────────────
  const fetchUserByPhoneNumber = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const phoneValue = e.target.value || '';

      updateCurrentPane(pane => ({
        ...pane,
        clientInfo: { ...pane.clientInfo, phoneNumber: phoneValue },
        isLoadingUser: phoneValue.length >= 10,
        isFoundUser: false,
      }));

      if (phoneValue.length >= 10) {
        toast.loading('Đang lấy thông tin khách hàng...', { id: 'customer-lookup' });

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

  // ─── Shipping: address selects ──────────────────────
  const getDistrictsForProvince = (provinceName: string): AddressDistrict[] => {
    const prov = provinces.find(p => p.name === provinceName);
    return prov?.districts || [];
  };

  const getWardsForDistrict = (provinceName: string, districtName: string): AddressWard[] => {
    const districts = getDistrictsForProvince(provinceName);
    const dist = districts.find(d => d.name === districtName);
    return dist?.wards || [];
  };

  const onChangeProvince = useCallback(
    async (value: string) => {
      updateCurrentPane(pane => ({
        ...pane,
        shippingInfo: {
          ...pane.shippingInfo,
          orderAdressProvince: value,
          orderAdressDistrict: undefined,
          orderAdressWard: undefined,
          shippingFee: undefined,
        },
      }));
    },
    [updateCurrentPane]
  );

  const onChangeDistrict = useCallback(
    async (value: string) => {
      updateCurrentPane(pane => ({
        ...pane,
        shippingInfo: {
          ...pane.shippingInfo,
          orderAdressDistrict: value,
          orderAdressWard: undefined,
          shippingFee: undefined,
        },
      }));
    },
    [updateCurrentPane]
  );

  const onChangeWard = useCallback(
    async (value: string) => {
      updateCurrentPane(pane => {
        const newShipping: ShippingInfo = {
          ...pane.shippingInfo,
          orderAdressWard: value,
        };
        // Fetch fee in background
        fetchShippingFee(
          newShipping.orderAdressProvince || '',
          newShipping.orderAdressDistrict || '',
          value,
          newShipping.optionTransfer
        );
        return { ...pane, shippingInfo: newShipping };
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [updateCurrentPane]
  );

  const fetchShippingFee = async (
    province: string,
    district: string,
    ward: string,
    optionTransfer: string
  ) => {
    if (!province || !district || !ward) return;
    toast.loading('Đang lấy thông tin phí shipping...', { id: 'shipping-fee' });
    try {
      const formDataFee = {
        orderAdressProvince: province,
        orderAdressDistrict: district,
        orderAdressWard: ward,
      };
      const resFee = await GapService.getFeeForTransport(formDataFee, optionTransfer === 'ht');
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
  };

  const onChangeStreetAddress = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateCurrentPane(pane => ({
        ...pane,
        shippingInfo: { ...pane.shippingInfo, orderAdressStreet: e.target.value.trim() },
      }));
    },
    [updateCurrentPane]
  );

  // ─── Shipping method ────────────────────────────────
  const onChangeShippingMethod = useCallback(
    async (value: string) => {
      updateCurrentPane(pane => {
        if (pane.shippingInfo.optionTransfer === value) return pane;

        const newShipping: ShippingInfo = { ...pane.shippingInfo, optionTransfer: value };

        if (value === 'tt') {
          newShipping.shippingFee = 0;
        } else if (newShipping.orderAdressProvince) {
          fetchShippingFee(
            newShipping.orderAdressProvince || '',
            newShipping.orderAdressDistrict || '',
            newShipping.orderAdressWard || '',
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
    if (!currentPane.clientInfo.phoneNumber || currentPane.clientInfo.phoneNumber.length <= 9) {
      toast.error('Chưa nhập số điện thoại');
      return;
    }
    if (!currentPane.productList || currentPane.productList.length === 0) {
      toast.error('Chưa có sản phẩm nào');
      return;
    }
    if (currentPane.isOnlineSale === 'true' && !currentPane.clientInfo.fullName) {
      toast.error('Chưa nhập tên Khách hàng');
      return;
    }
    if (
      currentPane.isOnlineSale === 'true' &&
      (!currentPane.shippingInfo.orderAdressStreet ||
        currentPane.shippingInfo.orderAdressStreet.length === 0)
    ) {
      toast.error('Vui lòng nhập thêm thông tin số nhà/tên đường');
      return;
    }
    if (
      currentPane.isOnlineSale === 'true' &&
      (!currentPane.shippingInfo.orderAdressWard ||
        !currentPane.shippingInfo.orderAdressDistrict ||
        !currentPane.shippingInfo.orderAdressProvince)
    ) {
      toast.error('Vui nhập thông tin: xã.phường / quận.huyện / tỉnh.thành phố');
      return;
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

      const resUser = await GapService.getCustomer(currentPane.clientInfo.phoneNumber);

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
            Number(existing.totalMoneyForSale || 0) + Number(dataOrder.totalMoneyForSale || 0),
          numberOfSale: Number(existing.numberOfSale || 0) + 1,
          totalProductForSale:
            Number(existing.totalProductForSale || 0) +
            Number(dataOrder.totalNumberOfProductForSale || 0),
        };

        toast.dismiss('create-order');
        toast.loading('Đang cập nhật thông tin khách hàng', { id: 'create-order' });
        const resCustomer = await GapService.updateCustomer(customerFormData, existing.objectId);

        if (resCustomer?.updatedAt) {
          toast.success('Cập nhật khách hàng thành công');
          const result = await GapService.setOrder(dataOrder, userData?.objectId, existing.objectId);
          toast.dismiss('create-order');

          if (result?.objectId) {
            toast.success('Tạo Đơn hàng thành công');
            updateCurrentPane(pane => ({
              ...pane,
              objectIdOrder: result.objectId,
              isCreatedSuccessfully: true,
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
          const result = await GapService.setOrder(dataOrder, userData?.objectId, resCus.objectId);
          toast.dismiss('create-order');

          if (result?.objectId) {
            toast.success('Tạo Đơn hàng thành công');
            updateCurrentPane(pane => ({
              ...pane,
              objectIdOrder: result.objectId,
              isCreatedSuccessfully: true,
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

  // ─── Current pane shorthand ─────────────────────────
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
            <TabsList className="h-auto flex-wrap">
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

            <Button onClick={onHandleCreateOrder} disabled={isCreatingOrder}>
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
                            item.price * 1000 * (item.numberOfProductForSale || 1)
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
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tổng tiền:</span>
                    <span className="text-lg font-bold">
                      {numberWithCommas((currentPane.totalMoneyForSale || 0) * 1000)} vnđ
                    </span>
                  </div>

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
                            onChangeSplitAmount(e.target.value, 'transferOfflineMoneyAmount')
                          }
                          placeholder="0 vnd"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Tiền chuyển khoản</Label>
                        <Input
                          value={currentPane.transferBankMoneyAmount ?? ''}
                          onChange={e =>
                            onChangeSplitAmount(e.target.value, 'transferBankMoneyAmount')
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
                        onChange={e => onChangeClientField(e.target.value, 'fullName')}
                        placeholder="..."
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">CMND</Label>
                      <Input
                        value={currentPane.clientInfo.consignerIdCard}
                        onChange={e => onChangeClientField(e.target.value, 'consignerIdCard')}
                        placeholder="..."
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Email</Label>
                      <Input
                        value={currentPane.clientInfo.mail}
                        onChange={e => onChangeClientField(e.target.value, 'mail')}
                        placeholder="..."
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Tên ngân hàng</Label>
                      <Input
                        value={currentPane.clientInfo.bankName}
                        onChange={e => onChangeClientField(e.target.value, 'bankName')}
                        placeholder="..."
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">ID ngân hàng</Label>
                      <Input
                        value={currentPane.clientInfo.bankId}
                        onChange={e => onChangeClientField(e.target.value, 'bankId')}
                        placeholder="..."
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Sinh nhật</Label>
                      <Input
                        value={currentPane.clientInfo.birthday}
                        onChange={e => onChangeClientField(e.target.value, 'birthday')}
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
                      <Label className="text-xs">Địa chỉ giao hàng (số nhà - đường)</Label>
                      <Input
                        disabled={currentPane.shippingInfo.optionTransfer === 'tt'}
                        value={currentPane.shippingInfo.orderAdressStreet || ''}
                        onChange={onChangeStreetAddress}
                        placeholder="Số nhà - đường"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Tỉnh/Thành phố</Label>
                        <Select
                          value={currentPane.shippingInfo.orderAdressProvince || ''}
                          onValueChange={onChangeProvince}
                          disabled={currentPane.shippingInfo.optionTransfer === 'tt'}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn tỉnh" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px]">
                            {provinces.map(prov => (
                              <SelectItem key={prov.name} value={prov.name}>
                                {prov.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Quận/Huyện</Label>
                        <Select
                          value={currentPane.shippingInfo.orderAdressDistrict || ''}
                          onValueChange={onChangeDistrict}
                          disabled={
                            currentPane.shippingInfo.optionTransfer === 'tt' ||
                            !currentPane.shippingInfo.orderAdressProvince
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn quận" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px]">
                            {getDistrictsForProvince(
                              currentPane.shippingInfo.orderAdressProvince || ''
                            ).map(dist => (
                              <SelectItem key={dist.name} value={dist.name}>
                                {dist.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Xã/Phường</Label>
                        <Select
                          value={currentPane.shippingInfo.orderAdressWard || ''}
                          onValueChange={onChangeWard}
                          disabled={
                            currentPane.shippingInfo.optionTransfer === 'tt' ||
                            !currentPane.shippingInfo.orderAdressDistrict
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn xã" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px]">
                            {getWardsForDistrict(
                              currentPane.shippingInfo.orderAdressProvince || '',
                              currentPane.shippingInfo.orderAdressDistrict || ''
                            ).map(ward => (
                              <SelectItem key={ward.name} value={ward.name}>
                                {ward.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label className="text-xs">Hình thức giao hàng</Label>
                      <Select
                        value={currentPane.shippingInfo.optionTransfer}
                        onValueChange={onChangeShippingMethod}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tk">Giao hàng tiết kiệm</SelectItem>
                          <SelectItem value="ht">Hoả tốc</SelectItem>
                          <SelectItem value="tt">Lấy hàng trực tiếp</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Phí giao hàng:</span>
                      <span className="text-sm font-medium">
                        {currentPane.shippingInfo.shippingFee != null
                          ? `${numberWithCommas(currentPane.shippingInfo.shippingFee)} vnđ`
                          : '---'}
                      </span>
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
              <h2 className="text-xl font-semibold">Tạo đơn hàng thành công!</h2>
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

            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" onClick={() => toast.info('Chức năng in đang phát triển')}>
                <Printer className="h-4 w-4 mr-2" />
                In hoá đơn
              </Button>
              <Button onClick={resetData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Tạo mới
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};

export default SaleScreen;
