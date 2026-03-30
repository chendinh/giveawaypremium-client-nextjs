'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
// import { Checkbox } from '@/components/ui/checkbox';
// Update the import path below if your radio-group component is located elsewhere
import { RadioGroup, RadioGroupItem } from '@/components/ui/radioGroup';
// Or, if the file is named RadioGroup.tsx:
// import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup';
// Or, if you don't have these components, install or create them as needed.
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
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, Plus, X, DollarSign } from 'lucide-react';
import Lottie from 'react-lottie';
import moment from 'moment';

import GapService from '@/app/actions/GapServices';
import successJson from '@images/Lottie/success.json';
import { useAppStore } from '@/store/useAppStore';

import './style.scss';

// ─── Helper ───────────────────────────────────────────
const numberWithCommas = (x: number | string): string =>
  x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const generateIdMix = (): string =>
  Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

// ─── Types ────────────────────────────────────────────
interface ProductItem {
  hashCode: string;
  code?: string;
  productId: number | string;
  name?: string;
  price: number | string;
  count: number;
  remainNumberProduct: number;
  priceAfterFee: number | string;
  totalPriceAfterFee?: number | string;
  categoryId: string;
  subCategoryId: string | null;
  note: string;
  isNew: string;
  rateNew: number;
  isDeleted?: boolean;
  key?: number;
  defaultCategoryCode?: { key: string; label: string; value: string };
}

interface FormDataType {
  consigneeName: string;
  consignerName: string;
  phoneNumber: string;
  consignerIdCard: string;
  mail: string;
  birthday: string;
  bankName: string;
  bankId: string;
  numberOfProducts: number;
  consignmentId: string;
  timeGetMoney: string;
  numberOfConsignmentTime: number;
  numberOfConsignment: number;
}

interface TagItem {
  objectId: string;
  code: string;
  timeGetMoney: string;
  [key: string]: any;
}

interface CategoryItem {
  objectId: string;
  name: string;
  keyCode?: string;
  isParentSelf?: boolean;
  category?: { objectId: string };
  subCategories?: CategoryItem[];
  [key: string]: any;
}

interface ConsignmentProps {
  // These will come from parent or store
}

const DATE_FORMAT = 'DD-MM-YYYY';

// ─── Component ────────────────────────────────────────
const Consignment: React.FC<ConsignmentProps> = () => {
  const {
    userData,
    categoryRedux,
    channelMonitorRedux,
    tempConsignmentRedux,
    setTempConsignment,
    eventsRedux,
  } = useAppStore();

  // ── State ──
  const [allInfoTag, setAllInfoTag] = useState<TagItem[]>([]);
  const [isTransferMoneyWithBank, setIsTransferMoneyWithBank] =
    useState<string>('false');
  const [productList, setProductList] = useState<ProductItem[]>([
    {
      hashCode: generateIdMix(),
      code: '',
      productId: 0,
      price: '',
      count: 1,
      remainNumberProduct: 1,
      priceAfterFee: '',
      totalPriceAfterFee: '',
      categoryId: '',
      subCategoryId: '',
      note: '---',
      isNew: 'false',
      rateNew: 100,
    },
  ]);
  const [formData, setFormData] = useState<FormDataType>({
    consigneeName: userData?.name || '',
    consignerName: '',
    phoneNumber: '',
    consignerIdCard: '',
    mail: '',
    birthday: '',
    bankName: '',
    bankId: '',
    numberOfProducts: 1,
    consignmentId: '',
    timeGetMoney: '',
    numberOfConsignmentTime: 0,
    numberOfConsignment: 0,
  });
  const [moneyBackForFullSold, setMoneyBackForFullSold] = useState<number>(0);
  const [totalMoney, setTotalMoney] = useState<number>(0);
  const [isLoadingTags, setIsLoadingTags] = useState<boolean>(false);
  const [objectIdFoundUser, setObjectIdFoundUser] = useState<string>('');
  const [birthday, setBirthday] = useState<string>('');
  const [isConsigning, setIsConsigning] = useState<boolean>(false);
  const [isShowConfirmForm, setIsShowConfirmForm] = useState<boolean>(false);
  const [isFoundUser, setIsFoundUser] = useState<boolean>(false);
  const [isLoadingUser, setIsLoadingUser] = useState<boolean>(false);
  const [categoryList, setCategoryList] = useState<CategoryItem[]>([]);
  const [timeGroupId, setTimeGroupId] = useState<string>('');
  const [timeGroupCode, setTimeGroupCode] = useState<string>('');
  const [onlineCodeStringInput, setOnlineCodeStringInput] =
    useState<string>('');
  const [isErrorFormat, setIsErrorFormat] = useState<boolean>(false);
  const [note, setNote] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [moneyBackPercent, setMoneyBackPercent] = useState<number>(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // ── Build category list from Redux ──
  useEffect(() => {
    const catList: CategoryItem[] = [];
    if (categoryRedux) {
      categoryRedux.forEach((item: any) => {
        if (item?.subCategories?.length > 0) {
          catList.push(...item.subCategories);
        } else {
          catList.push({ ...item, isParentSelf: true });
        }
      });
    }
    setCategoryList(catList);
  }, [categoryRedux]);

  // ── Mounted ──
  useEffect(() => {
    if (tempConsignmentRedux) {
      // Restore temp state – simplified, restore key fields
      // In production you'd restore full state
    }

    fetchAllTags();

    if (channelMonitorRedux?.objectId) {
      intervalRef.current = setInterval(async () => {
        const body = { data: { formData, productList, note } };
        await GapService.updateChannel(body, channelMonitorRedux.objectId);
      }, 2000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (moneyBackPercent > 0) {
      const list = productList.slice();
      recalcTotals(list);
    }
  }, [moneyBackPercent]);

  // ── Fetch tags ──
  const fetchAllTags = async () => {
    setIsLoadingTags(true);
    const res = await GapService.getConsignmentID();
    if (res?.results?.length > 0) {
      setAllInfoTag([...res.results].reverse());
    }
    setIsLoadingTags(false);
  };

  // ── Price calculation ──
  //
  const convertPriceAfterFee = useCallback(
    (productPrice: number = 0): number => {
      if (moneyBackPercent > 0) {
        return (productPrice * moneyBackPercent) / 100;
      }
      if (productPrice <= 0) return 0;
      if (productPrice < 1000) return (productPrice * 74) / 100;
      if (productPrice >= 1000 && productPrice <= 10000)
        return (productPrice * 77) / 100;
      return (productPrice * 80) / 100;
    },
    [moneyBackPercent]
  );

  const recalcTotals = useCallback(
    (list: ProductItem[]) => {
      let moneyBack = 0;
      let total = 0;
      let count = 0;
      let listTemp = [];
      list.forEach(item => {
        if (!item.isDeleted) {
          count += Number(item.count);
          moneyBack +=
            item.count * convertPriceAfterFee(Number(item.price)) * 1000;
          total += item.count * Number(item.price) * 1000;
        }
      });

      list.map(productItem => {
        listTemp.push({
          ...productItem,
          priceAfterFee: convertPriceAfterFee(Number(productItem.price)),
          totalPriceAfterFee: Math.round(
            productItem.count * convertPriceAfterFee(Number(productItem.price))
          ),
        });
      });

      setProductList(listTemp);
      setMoneyBackForFullSold(moneyBack);
      setTotalMoney(total);
      return { moneyBack, total, count };
    },
    [convertPriceAfterFee]
  );

  // ── Fetch user by phone ──
  const fetchUserByPhoneNumber = async (phoneValue: string) => {
    setFormData(prev => ({ ...prev, phoneNumber: phoneValue }));

    if (phoneValue.length >= 10) {
      setIsLoadingUser(true);
      const res = await GapService.getCustomer(phoneValue);
      if (res?.results?.[0]) {
        const u = res.results[0];
        setFormData(prev => ({
          ...prev,
          consignerName: u.fullName || '',
          phoneNumber: u.phoneNumber || phoneValue,
          consignerIdCard: u.identityNumber || '',
          mail: u.mail || '',
          birthday: u.birthday || '',
          bankName: u.banks?.[0]?.type || '',
          bankId: u.banks?.[0]?.accNumber || '',
          numberOfConsignment: u.numberOfConsignment || 0,
          numberOfConsignmentTime: u.numberOfConsignmentTime || 0,
        }));
        setBirthday(u.birthday || '');
        setIsFoundUser(true);
        setObjectIdFoundUser(u.objectId);
      } else {
        setIsFoundUser(false);
      }
      setIsLoadingUser(false);
    } else {
      setFormData(prev => ({
        ...prev,
        consignerName: '',
        phoneNumber: phoneValue,
        consignerIdCard: '',
        mail: '',
        birthday: '',
        bankName: '',
        bankId: '',
        consignmentId: '',
      }));
      setObjectIdFoundUser('');
      setBirthday('');
      setIsShowConfirmForm(false);
      setIsFoundUser(false);
      setNote('');
    }
  };

  // ── Change form field ──
  const changeFormField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // ── Change time get money ──
  const onChangeTimeGetMoney = async (value: string) => {
    const findTag = allInfoTag.find(tag => tag.code === value);
    if (!findTag) return;

    const resConsignment = await GapService.getConsignment(
      1,
      null,
      1,
      findTag.objectId
    );
    const newConsignmentId = resConsignment?.count
      ? `${resConsignment.count + 1}`
      : '';

    setFormData(prev => ({
      ...prev,
      timeGetMoney: moment(findTag.timeGetMoney).format(DATE_FORMAT),
      ...(newConsignmentId ? { consignmentId: newConsignmentId } : {}),
    }));
    setTimeGroupCode(value);
    setTimeGroupId(findTag.objectId);
  };

  // ── Product list mutations ──
  const changeDataProduct = (
    field: string,
    value: string | number,
    indexProduct: number
  ) => {
    const list = productList.slice();

    if (field === 'priceProduct') {
      list[indexProduct].price = Number(value);
      list[indexProduct].priceAfterFee = Math.round(
        convertPriceAfterFee(Number(value))
      );
      list[indexProduct].totalPriceAfterFee = Math.round(
        list[indexProduct].count * convertPriceAfterFee(Number(value))
      );
    } else if (field === 'numberOfProducts') {
      list[indexProduct].count = Number(value);
      list[indexProduct].remainNumberProduct = Number(value);
      list[indexProduct].priceAfterFee = Math.round(
        convertPriceAfterFee(Number(list[indexProduct].price))
      );
      list[indexProduct].totalPriceAfterFee = Math.round(
        Number(value) * convertPriceAfterFee(Number(list[indexProduct].price))
      );
    } else if (field === 'nameProduct') {
      list[indexProduct].name = String(value);
    } else if (field === 'note') {
      list[indexProduct].note = String(value) || '---';
    }

    setProductList(list);

    const { count } = recalcTotals(list);
    if (field === 'numberOfProducts' || field === 'priceProduct') {
      setFormData(prev => ({ ...prev, numberOfProducts: count }));
    }
  };

  const onPlusProductList = () => {
    const newItems: ProductItem[] = [0, 1, 2].map(i => ({
      categoryId: '',
      subCategoryId: '',
      hashCode: generateIdMix(),
      price: '',
      count: 1,
      remainNumberProduct: 1,
      priceAfterFee: '',
      note: '---',
      productId: productList.length + i,
      isNew: 'false',
      rateNew: 100,
    }));
    setProductList(prev => [...prev, ...newItems]);
    setFormData(prev => ({
      ...prev,
      numberOfProducts: prev.numberOfProducts + 3,
    }));
  };

  const onDeleteProductList = (hashCode: string) => {
    const index = productList.findIndex(item => item.hashCode === hashCode);
    if (index < 0) return;

    const item = productList[index];
    const moneyBackTemp =
      moneyBackForFullSold -
      convertPriceAfterFee(Number(item.price)) * 1000 * Number(item.count);
    const totalMoneyTemp =
      totalMoney - Number(item.price) * 1000 * Number(item.count);
    const productNumber = formData.numberOfProducts - Number(item.count);

    let productId = -1;
    const newList = productList.map((p, i) => {
      if (i !== index) {
        productId += 1;
        return { ...p, productId };
      }
      return { ...p, productId: 0, isDeleted: true };
    });

    setMoneyBackForFullSold(moneyBackTemp);
    setTotalMoney(totalMoneyTemp);
    setProductList(newList);
    setFormData(prev => ({ ...prev, numberOfProducts: productNumber }));
  };

  const onChangeProductTypeNewOrOld = (value: string, indexProduct: number) => {
    const list = productList.slice();
    if (value === 'new') {
      list[indexProduct].isNew = 'true';
      list[indexProduct].rateNew = 100;
    } else {
      list[indexProduct].isNew = 'false';
      list[indexProduct].rateNew = 99;
    }
    setProductList(list);
  };

  const onChangeCategory = (
    valueProp: string,
    hashCode: string,
    label?: string
  ) => {
    const list = productList.slice();
    const categorySplitTxt = valueProp.split('+');
    let categoryId = '';
    let subCategoryId: string | null = null;
    let defaultCategoryCode: any = null;

    if (categorySplitTxt.length === 3) {
      categoryId = categorySplitTxt[0];
      subCategoryId = categorySplitTxt[1];
      // hashCode is categorySplitTxt[2]
      defaultCategoryCode = {
        key: valueProp,
        label: label || '',
        value: valueProp,
      };
    } else if (categorySplitTxt.length === 2) {
      categoryId = categorySplitTxt[0];
      subCategoryId = null;
      defaultCategoryCode = {
        key: valueProp,
        label: label || '',
        value: valueProp,
      };
    }

    const idx = list.findIndex(item => item.hashCode === hashCode);
    if (idx >= 0) {
      list[idx].categoryId = categoryId;
      list[idx].subCategoryId = subCategoryId;
      list[idx].defaultCategoryCode = defaultCategoryCode;
      setProductList(list);
    }
  };

  // ── Refresh all ──
  const onRefreshAll = (isSetTemp = false) => {
    if (isSetTemp && setTempConsignment) {
      setTempConsignment(null);
    }
    setIsTransferMoneyWithBank('false');
    setProductList([
      {
        hashCode: generateIdMix(),
        code: '',
        productId: '',
        price: '',
        count: 1,
        remainNumberProduct: 1,
        priceAfterFee: '',
        totalPriceAfterFee: '',
        categoryId: '',
        subCategoryId: '',
        note: '---',
        isNew: 'false',
        rateNew: 100,
      },
    ]);
    setFormData({
      consigneeName: userData?.name || '',
      consignerName: '',
      phoneNumber: '',
      consignerIdCard: '',
      mail: '',
      birthday: '',
      bankName: '',
      bankId: '',
      numberOfProducts: 1,
      consignmentId: '',
      timeGetMoney: '',
      numberOfConsignmentTime: 0,
      numberOfConsignment: 0,
    });
    setMoneyBackForFullSold(0);
    setTotalMoney(0);
    setIsLoadingTags(false);
    setObjectIdFoundUser('');
    setBirthday('');
    setIsConsigning(false);
    setIsShowConfirmForm(false);
    setIsFoundUser(false);
    setIsLoadingUser(false);
    setOnlineCodeStringInput('');
    setIsErrorFormat(false);
    setTimeGroupId('');
    setTimeGroupCode('');
    setNote('');
  };

  // ── Convert string name to category ──
  const convertStringNameToObjectIdCategory = (
    stringName: string = ''
  ): string => {
    const s = stringName.toLowerCase();
    if (
      s.includes('áo khoác') ||
      s.includes('áo khoac') ||
      s.includes('ao khoác') ||
      s.includes('ao khoac') ||
      s.includes('aokhoac')
    )
      return 'khoac';
    if (s.includes('áo') || s.includes('bra')) return 'ao';
    if (s.includes('đầm')) return 'dam';
    if (s.includes('quần')) return 'quan';
    if (
      s.includes('chân váy') ||
      s.includes('chan váy') ||
      s.includes('cv') ||
      s.includes('cvay') ||
      s.includes('chân vay') ||
      s.includes('váy') ||
      s.includes('vay')
    )
      return 'vay';
    if (
      s.includes('body') ||
      s.includes('bodysuit') ||
      s.includes('suit') ||
      s.includes('jum') ||
      s.includes('jumsuit')
    )
      return 'set';
    if (s.includes('giày') || s.includes('giay') || s.includes('sneaker'))
      return 'thao';
    if (s.includes('cao gót') || s.includes('cao got')) return 'cao';
    if (s.includes('dép') || s.includes('đôi dép')) return 'dep';
    if (s.includes('boot')) return 'boot';
    if (s.includes('sandal')) return 'sandal';
    if (s.includes('balo') || s.includes('balô') || s.includes('ba lô'))
      return 'balo';
    if (s.includes('túi') || s.includes('chiếc túi')) return 'tui';
    if (s.includes('clutch')) return 'clutch';
    if (s.includes('beltbag') || s.includes('belt bag')) return 'bag';
    if (s.includes('ví')) return 'vi';
    if (
      s.includes('vòng') ||
      s.includes('vòng tay') ||
      s.includes('vong tay') ||
      s.includes('lắc') ||
      s.includes('cuff')
    )
      return 'vong';
    if (
      s.includes('hoa tai') ||
      s.includes('bông tai') ||
      s.includes('bong tai')
    )
      return 'tai';
    if (s.includes('nhẫn')) return 'nhan';
    if (
      s.includes('dây chuyền') ||
      s.includes('day chuyen') ||
      s.includes('vòng cổ')
    )
      return 'chuyen';
    if (s.includes('cài') || s.includes('charm')) return 'pkhac';
    if (
      s.includes('đồng hồ') ||
      s.includes('dong ho') ||
      s.includes('watch') ||
      s.includes('đh') ||
      s.includes('dh')
    )
      return 'ho';
    if (s.includes('mắt kính') || s.includes('kính')) return 'kinh';
    if (
      s.includes('mascara') ||
      s.includes('son') ||
      s.includes('phấn') ||
      s.includes('nền') ||
      s.includes('tẩy trang') ||
      s.includes('cọ') ||
      s.includes('mỹ phẩm') ||
      s.includes('cushion') ||
      s.includes('kem lót') ||
      s.includes('kem nền') ||
      s.includes('trang điểm') ||
      s.includes('má hồng') ||
      s.includes('bảng mắt')
    )
      return 'diem';
    if (
      s.includes('toner') ||
      s.includes('tonner') ||
      s.includes('kem dưỡng') ||
      s.includes('dưỡng') ||
      s.includes('sữa rửa mặt') ||
      s.includes('serum') ||
      s.includes('kem chống nắng') ||
      s.includes('kcn') ||
      s.includes('lotion') ||
      s.includes('mặt nạ') ||
      s.includes('sữa tắm') ||
      s.includes('gel') ||
      s.includes('dầu gội') ||
      s.includes('mask')
    )
      return 'da';
    if (
      s.includes('nước hoa') ||
      s.includes('nuoc hoa') ||
      s.includes('perfume') ||
      s.includes('scent') ||
      s.includes('fragrance')
    )
      return 'YIUniNrIKb';
    if (
      s.includes('máy rửa mặt') ||
      s.includes('thiết bị') ||
      s.includes('máy rửa') ||
      s.includes('máy')
    )
      return 'B3OQuAChW1';
    return 'ao';
  };

  // ── Convert string to consignment (online input) ──
  const convertStringToConsignment = () => {
    let newProductList: ProductItem[] = [];
    let hasError = false;

    const categoryListObj: Record<string, any> = {};
    categoryList.forEach(itemCate => {
      if (itemCate.objectId === 'B3OQuAChW1') {
        categoryListObj['B3OQuAChW1'] = { ...itemCate, keyCode: 'thiet' };
      } else if (itemCate.objectId === 'YIUniNrIKb') {
        categoryListObj['YIUniNrIKb'] = { ...itemCate, keyCode: 'hoa' };
      } else {
        categoryListObj[itemCate.keyCode || ''] = { ...itemCate };
      }
    });

    const lines = onlineCodeStringInput.trim().split(/\r?\n/);

    lines.forEach((line, itemIndex) => {
      if (hasError) return;
      const parts = line.trim().split('/');
      let name = '';
      let price = 0;
      let amount = 1;
      let detail = '---';

      const priceStr = parts[1]?.trim().replaceAll('k', '').replaceAll('K', '');
      if (!priceStr || Number(priceStr) + 1 <= 0) {
        hasError = true;
        return;
      }

      const isValid4 =
        parts.length === 4 &&
        ((parts[2]?.trim().substring(0, 2) === 'tt' &&
          parts[3]?.trim().substring(0, 2) === 'sl') ||
          (parts[2]?.trim().substring(0, 2) === 'sl' &&
            parts[3]?.trim().substring(0, 2) === 'tt'));
      const isValid3 =
        parts.length === 3 &&
        (parts[2]?.trim().substring(0, 2) === 'tt' ||
          parts[2]?.trim().substring(0, 2) === 'sl');
      const isValid2 = parts.length === 2;

      if (!isValid4 && !isValid3 && !isValid2) {
        hasError = true;
        return;
      }

      name = parts[0].trim();
      price = Number(priceStr);

      if (parts.length === 4) {
        if (parts[2].trim().substring(0, 2) === 'tt') {
          detail = parts[2].trim().replace('tt', '').trim() || '---';
          amount = Number(parts[3].trim().replace('sl', '').trim()) || 1;
        } else {
          amount = Number(parts[2].trim().replace('sl', '').trim()) || 1;
          detail = parts[3].trim().replace('tt', '').trim() || '---';
        }
      } else if (parts.length === 3) {
        if (parts[2].trim().substring(0, 2) === 'tt') {
          detail = parts[2].trim().replace('tt', '').trim() || '---';
          amount = 1;
        } else {
          amount = Number(parts[2].trim().replace('sl', '').trim()) || 1;
          detail = '---';
        }
      }

      const type = convertStringNameToObjectIdCategory(name);
      let categoryId = '';
      let subCategoryId: string | null = null;

      if (type && categoryListObj[type]) {
        if (categoryListObj[type].isParentSelf) {
          subCategoryId = categoryListObj[type].objectId;
          categoryId = categoryListObj[type].objectId;
        } else {
          subCategoryId = categoryListObj[type].objectId;
          categoryId = categoryListObj[type].category?.objectId || '';
        }
      }

      const hashCode = generateIdMix();

      newProductList.push({
        name,
        productId: itemIndex,
        hashCode,
        price,
        count: amount,
        remainNumberProduct: amount,
        totalPriceAfterFee: Math.round(amount * convertPriceAfterFee(price)),
        priceAfterFee: Math.round(convertPriceAfterFee(price)),
        categoryId,
        subCategoryId,
        note: detail || '---',
        defaultCategoryCode: categoryListObj[type]
          ? {
              key: categoryListObj[type].isParentSelf
                ? `${categoryId}+${subCategoryId}+${hashCode}`
                : `${subCategoryId}+${hashCode}`,
              label: categoryListObj[type].name,
              value: categoryListObj[type].isParentSelf
                ? `${categoryId}+${subCategoryId}+${hashCode}`
                : `${subCategoryId}+${hashCode}`,
            }
          : undefined,
        rateNew: detail?.includes('new') ? 100 : 99,
        isNew: detail?.includes('new') ? 'true' : 'false',
      });
    });

    if (!hasError && newProductList.length > 0) {
      let moneyBack = 0;
      let total = 0;
      let numProducts = 0;
      newProductList.forEach(item => {
        numProducts += item.count;
        moneyBack +=
          item.count * convertPriceAfterFee(Number(item.price)) * 1000;
        total += item.count * Number(item.price) * 1000;
      });

      setIsErrorFormat(false);
      setProductList(newProductList);
      setMoneyBackForFullSold(moneyBack);
      setTotalMoney(total);
      setFormData(prev => ({ ...prev, numberOfProducts: numProducts }));
      setIsModalOpen(false);
    } else {
      setIsErrorFormat(true);
    }
  };

  // ── Consign submit ──
  const onConsign = async (e: React.FormEvent) => {
    e.preventDefault();

    const activeProducts = productList.filter(item => !item.isDeleted);
    let hasError = false;
    let productListTemp: ProductItem[] = [];
    let productId = 0;
    let productCount = 0;

    activeProducts.forEach((item, idx) => {
      if (Number(item.price) === 0 || String(item.price).length === 0) {
        hasError = true;
        toast.error(`Chưa nhập giá sản phẩm số ${idx + 1}`);
      } else if (Number(item.count) === 0) {
        hasError = true;
        toast.error(`SL sản phẩm số ${idx + 1} phải lớn hơn 0`);
      } else if (!item.categoryId || item.categoryId.length === 0) {
        hasError = true;
        toast.error(`Chưa nhập loại sản phẩm số ${idx + 1}`);
      } else if (!item.name || item.name.length === 0) {
        hasError = true;
        toast.error(`Chưa nhập tên sản phẩm số ${idx + 1}`);
      }

      if (
        (Number(item.price) > 0 || String(item.price).length > 0) &&
        Number(item.count) > 0
      ) {
        productId += 1;
        productCount += Number(item.count);
        productListTemp.push({
          ...item,
          isNew: item.isNew || 'true',
          code: formData.consignmentId + '-' + timeGroupCode + '-' + productId,
          key: idx,
          productId,
          rateNew: item.isNew === 'true' ? 100 : 99,
        });
      }
    });

    if (hasError) return;

    if (productListTemp.length === 0) {
      toast.error('Cần ít nhất 1 sản phẩm');
      return;
    }
    if (!timeGroupId) {
      toast.error('Nhập thời gian tổng kết');
      return;
    }
    if (formData.phoneNumber.length < 10) {
      toast.error('Nhập số điện thoại');
      return;
    }
    if (!formData.consignmentId) {
      toast.error('Nhập mã ký gửi');
      return;
    }

    const resConsignment = await GapService.getConsignment(
      1,
      null,
      null,
      timeGroupId
    );
    let newConsignmentId: string | undefined;
    if (resConsignment?.count) {
      newConsignmentId = `${resConsignment.count + 1}`;
    }

    setIsConsigning(true);
    const finalProductList = productListTemp;
    const finalFormData = {
      ...formData,
      numberOfProducts: productCount,
      consignmentId: newConsignmentId || formData.consignmentId,
    };
    setProductList(finalProductList);
    setFormData(finalFormData);

    try {
      const resUser = await GapService.getCustomer(formData.phoneNumber);

      // Normalize product prices to number for API compatibility
      const normalizedProductList = finalProductList.map(p => ({
        ...p,
        price: Number(p.price),
      })) as any[];

      if (resUser?.results?.[0]) {
        // Existing user
        const result = await GapService.setConsignment(
          finalFormData,
          userData?.objectId,
          objectIdFoundUser,
          timeGroupId,
          timeGroupCode,
          normalizedProductList,
          moneyBackForFullSold,
          totalMoney,
          isTransferMoneyWithBank,
          note
        );
        if (result?.objectId) {
          setIsShowConfirmForm(true);
          setIsConsigning(false);
          setTempConsignment?.(null);

          const customerFormData = {
            consignerName: finalFormData.consignerName,
            phoneNumber: finalFormData.phoneNumber,
            consignerIdCard: finalFormData.consignerIdCard,
            mail: finalFormData.mail,
            email: finalFormData.mail || 'nothing@giveaway.com',
            birthday:
              finalFormData.birthday &&
              finalFormData.birthday !== 'Invalid date'
                ? finalFormData.birthday
                : '',
            bankName: finalFormData.bankName,
            bankId: finalFormData.bankId,
          };
          if (finalFormData.mail?.length > 0) {
            GapService.sendMail(
              customerFormData,
              finalFormData as any,
              'CONSIGNMENT',
              'CONSIGNMENT',
              timeGroupCode,
              normalizedProductList as any
            );
          }
          GapService.updateCustomer(customerFormData, objectIdFoundUser);
        } else {
          setIsConsigning(false);
          toast.error('Tạo Đơn Ký gửi thất bại');
        }
      } else {
        // New user
        const customerFormData = {
          consignerName: finalFormData.consignerName,
          phoneNumber: finalFormData.phoneNumber,
          consignerIdCard: finalFormData.consignerIdCard,
          mail: finalFormData.mail,
          username: finalFormData.phoneNumber,
          password: finalFormData.consignerIdCard,
          birthday:
            finalFormData.birthday && finalFormData.birthday !== 'Invalid date'
              ? finalFormData.birthday
              : '',
          bankName: finalFormData.bankName,
          bankId: finalFormData.bankId,
        };
        const resCus = await GapService.setCustomer(customerFormData);

        if (resCus?.objectId) {
          toast.success('Thêm khách hàng thành công');
          const result = await GapService.setConsignment(
            finalFormData,
            userData?.objectId,
            resCus.objectId,
            timeGroupId,
            timeGroupCode,
            normalizedProductList,
            moneyBackForFullSold,
            totalMoney,
            isTransferMoneyWithBank,
            note
          );
          if (result?.objectId) {
            setIsShowConfirmForm(true);
            setIsConsigning(false);
            setTempConsignment?.(null);
            GapService.sendMail(
              customerFormData,
              finalFormData as any,
              'CONSIGNMENT',
              'CONSIGNMENT',
              timeGroupCode,
              normalizedProductList as any
            );
          } else {
            setIsConsigning(false);
            toast.error('Tạo đơn ký gửi thất bại');
          }
        } else {
          setIsConsigning(false);
          toast.error('Tạo khách hàng thất bại');
        }
      }
    } catch (err) {
      console.error(err);
      setIsConsigning(false);
      toast.error('Có lỗi xảy ra');
    }
  };

  const onOpenInputOnline = () => {
    onRefreshAll();
    setOnlineCodeStringInput('');
    setIsErrorFormat(false);
    setIsModalOpen(true);
  };

  const onUpdateMonitorData = async () => {
    if (channelMonitorRedux?.objectId) {
      const body = { data: { formData, productList, note } };
      await GapService.updateChannel(body, channelMonitorRedux.objectId);
      toast.success('Đã cập nhật monitor');
    }
  };

  // ── Lottie options ──
  const defaultOptionsSuccess = {
    loop: false,
    autoplay: true,
    animationData: successJson,
  };

  const isPhoneDisabled =
    !formData.phoneNumber || formData.phoneNumber.length < 10;

  // ─── Render: Confirm Form ──
  if (isShowConfirmForm) {
    return (
      <div className="consignment-container">
        <Lottie
          options={defaultOptionsSuccess}
          height={150}
          width={150}
          isStopped={false}
          isPaused={false}
        />
        <div className="w-full max-w-2xl mx-auto p-4 space-y-2">
          {[
            ['Mã Ký gửi', formData.consignmentId + '-' + timeGroupCode],
            ['Số lượng Hàng Hoá', formData.numberOfProducts],
            ['Ngày trả tiền', formData.timeGetMoney],
            ['Tên Khách Hàng', formData.consignerName],
            ['Tên Nhân Viên', formData.consigneeName],
            ['Số điện thoại', formData.phoneNumber],
            ['Email', formData.mail],
            ['Ngân hàng', formData.bankName],
            ['ID Ngân hàng', formData.bankId],
            [
              'Hình thức nhận tiền',
              isTransferMoneyWithBank === 'true' ? 'Chuyển khoản' : 'Trực tiếp',
            ],
            ['Chứng minh thư', formData.consignerIdCard],
            ['Sinh nhật', formData.birthday],
            ['Ghi chú', note || '--'],
          ].map(([label, value]) => (
            <div key={String(label)} className="flex gap-2">
              <span className="font-medium min-w-[160px]">{label}:</span>
              <span>{value}</span>
            </div>
          ))}

          {productList.map((item, idx) => (
            <div key={idx} className="border rounded p-3 mt-4 space-y-2">
              <span className="text-sm text-gray-500">#{idx}</span>
              <Input
                disabled
                value={item.name || ''}
                placeholder="Tên sản phẩm"
              />
              <div className="flex gap-2">
                <Input
                  disabled
                  value={String(item.price)}
                  placeholder="Giá tiền"
                />
                <Input disabled value={String(item.count)} placeholder="SL" />
              </div>
              <Textarea
                disabled
                value={item.note || '---'}
                placeholder="Ghi chú"
              />
            </div>
          ))}
        </div>
        <Button className="mt-5 mb-5" onClick={() => onRefreshAll(true)}>
          Quay lại
        </Button>
      </div>
    );
  }

  // ─── Render: Main Form ──
  return (
    <div className="consignment-container">
      {/* Online input modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Thông tin đơn ký gửi</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p>Tên sản phẩm / giá tiền (k) /tt tình trạng /sl số lượng</p>
            <p>Tên sản phẩm / giá tiền (k) /sl số lượng /tt tình trạng</p>
            <p>Tên sản phẩm / giá tiền (k) /tt tình trạng</p>
            <p>Tên sản phẩm / giá tiền (k) /sl số lượng</p>
            <p>Tên sản phẩm / giá tiền (k)</p>
          </div>
          {isErrorFormat && (
            <span className="text-red-500 text-sm">Sai Định dạng</span>
          )}
          <Textarea
            className="min-h-[300px]"
            value={onlineCodeStringInput}
            onChange={e => setOnlineCodeStringInput(e.target.value)}
            placeholder="Nhập thông tin sản phẩm..."
          />
          <Button onClick={convertStringToConsignment}>Ok</Button>
        </DialogContent>
      </Dialog>

      {/* Form */}
      <form onSubmit={onConsign} className="w-full max-w-3xl mx-auto p-4">
        <div className="flex flex-col gap-4">
          {/* Online consignment button */}
          <div className="flex justify-center">
            <Button type="button" variant="outline" onClick={onOpenInputOnline}>
              <DollarSign className="mr-2 h-4 w-4" /> Ký gửi online
            </Button>
          </div>

          {/* Phone */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-2">
            <Label>Số điện thoại</Label>
            <div className="relative">
              <Input
                value={formData.phoneNumber}
                minLength={10}
                maxLength={11}
                onChange={e => fetchUserByPhoneNumber(e.target.value)}
                placeholder="..."
              />
              {isLoadingUser && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
              )}
              {!isLoadingUser && isFoundUser && (
                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
              )}
            </div>
          </div>

          {/* Customer name */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-2">
            <Label>Tên Khách Hàng</Label>
            <Input
              disabled={isPhoneDisabled}
              value={formData.consignerName}
              onChange={e => changeFormField('consignerName', e.target.value)}
              placeholder="..."
            />
          </div>

          {/* CMND */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-2">
            <Label>CMND</Label>
            <Input
              disabled={isPhoneDisabled}
              value={formData.consignerIdCard}
              onChange={e => changeFormField('consignerIdCard', e.target.value)}
              placeholder="..."
            />
          </div>

          {/* Email */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-2">
            <Label>Email</Label>
            <Input
              disabled={isPhoneDisabled}
              value={formData.mail}
              onChange={e => changeFormField('mail', e.target.value)}
              placeholder="..."
            />
          </div>

          {/* Bank name */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-2">
            <Label>Ngân hàng</Label>
            <Input
              disabled={isPhoneDisabled}
              value={formData.bankName}
              onChange={e => changeFormField('bankName', e.target.value)}
              placeholder="..."
            />
          </div>

          {/* Bank ID */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-2">
            <Label>ID Ngân hàng</Label>
            <Input
              disabled={isPhoneDisabled}
              type="number"
              value={formData.bankId}
              onChange={e => changeFormField('bankId', e.target.value)}
              placeholder="..."
            />
          </div>

          {/* Birthday */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-2">
            <Label>Sinh nhật</Label>
            <Input
              disabled={isPhoneDisabled}
              value={formData.birthday}
              onChange={e => changeFormField('birthday', e.target.value)}
              placeholder={DATE_FORMAT}
            />
          </div>

          <Separator />

          {/* ── Product List ── */}
          <div className="space-y-4">
            {productList.map((item, idx) => {
              if (item.isDeleted) return null;
              return (
                <div
                  key={item.hashCode}
                  className="border rounded-lg p-4 space-y-3 relative"
                >
                  {/* Close btn */}
                  <button
                    type="button"
                    title="Xoá sản phẩm"
                    className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded"
                    onClick={() => onDeleteProductList(item.hashCode)}
                  >
                    <X className="h-4 w-4" />
                  </button>

                  {/* Name + Category */}
                  <div className="flex gap-2">
                    <Input
                      className="flex-1"
                      value={item.name || ''}
                      onChange={e =>
                        changeDataProduct('nameProduct', e.target.value, idx)
                      }
                      placeholder="Tên sản phẩm"
                    />
                    <Select
                      value={item.defaultCategoryCode?.value || ''}
                      onValueChange={val => {
                        const cat = categoryList.find(c => {
                          if (!c.isParentSelf) {
                            return (
                              `${c.category?.objectId}+${c.objectId}+${item.hashCode}` ===
                              val
                            );
                          }
                          return `${c.objectId}+${item.hashCode}` === val;
                        });
                        onChangeCategory(val, item.hashCode, cat?.name);
                      }}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Danh mục" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryList.map((catItem, catIdx) => {
                          const val = !catItem.isParentSelf
                            ? `${catItem.category?.objectId}+${catItem.objectId}+${item.hashCode}`
                            : `${catItem.objectId}+${item.hashCode}`;
                          return (
                            <SelectItem key={catIdx} value={val}>
                              {catItem.name}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Price + Quantity */}
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={String(item.price)}
                      onChange={e =>
                        changeDataProduct('priceProduct', e.target.value, idx)
                      }
                      placeholder="Giá tiền"
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-gray-500">SL</span>
                      <Input
                        type="number"
                        className="w-24"
                        value={String(item.count)}
                        onChange={e =>
                          changeDataProduct(
                            'numberOfProducts',
                            e.target.value,
                            idx
                          )
                        }
                        placeholder="SL"
                      />
                    </div>
                  </div>

                  {/* New/Old */}
                  <RadioGroup
                    value={item.isNew === 'true' ? 'new' : 'old'}
                    onValueChange={val => onChangeProductTypeNewOrOld(val, idx)}
                    className="flex gap-4"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="new" id={`new-${item.hashCode}`} />
                      <Label htmlFor={`new-${item.hashCode}`}>Hàng mới</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="old" id={`old-${item.hashCode}`} />
                      <Label htmlFor={`old-${item.hashCode}`}>
                        Hàng đã sử dụng
                      </Label>
                    </div>
                  </RadioGroup>

                  {/* Note */}
                  <Textarea
                    value={item.note || '---'}
                    onChange={e =>
                      changeDataProduct('note', e.target.value, idx)
                    }
                    placeholder="Ghi Chú"
                  />
                </div>
              );
            })}

            <Button type="button" variant="outline" onClick={onPlusProductList}>
              <Plus className="mr-2 h-4 w-4" /> Thêm sản phẩm
            </Button>
          </div>

          <Separator />

          {/* Event selection */}
          {eventsRedux && eventsRedux.length > 0 && (
            <div className="grid grid-cols-[140px_1fr] items-center gap-2">
              <Label>Sự kiện</Label>
              <Select
                value={selectedEventId || 'none'}
                onValueChange={value => {
                  const eventId = value === 'none' ? '' : value;
                  setSelectedEventId(eventId);
                  const selectedEvent = eventsRedux?.find(
                    (ev: any) => ev.objectId === eventId
                  );
                  setMoneyBackPercent(selectedEvent?.moneyBackPercent || 0);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn sự kiện" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không có sự kiện</SelectItem>
                  {eventsRedux.map((event: any) => (
                    <SelectItem key={event.objectId} value={event.objectId}>
                      {event.name} ({event.moneyBackPercent}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* MoneyBack percent input */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-2">
            <Label>% Tiền ký gửi nhận được</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={moneyBackPercent}
              onChange={e => setMoneyBackPercent(Number(e.target.value))}
              placeholder="0"
            />
          </div>

          {/* Note */}
          <div className="grid grid-cols-[140px_1fr] items-start gap-2">
            <Label>Ghi chú đơn ký gửi</Label>
            <Textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Ghi chú..."
            />
          </div>

          {/* Total after fee */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-2">
            <Label>Tổng tiền sau thu phí</Label>
            <div className="relative">
              <Input
                disabled
                value={numberWithCommas(Math.round(moneyBackForFullSold))}
                placeholder="...000 vnd"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                vnđ
              </span>
            </div>
          </div>

          {/* Total before fee */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-2">
            <Label>Tổng tiền trước thu phí</Label>
            <div className="relative">
              <Input
                disabled
                value={numberWithCommas(Math.round(totalMoney))}
                placeholder="...000 vnd"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                vnđ
              </span>
            </div>
          </div>

          {/* Number of products */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-2">
            <Label>Số lượng Hàng Hoá</Label>
            <Input disabled type="number" value={formData.numberOfProducts} />
          </div>

          {/* Payment method */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-2">
            <Label>Hình thức nhận tiền</Label>
            <RadioGroup
              value={isTransferMoneyWithBank}
              onValueChange={val => setIsTransferMoneyWithBank(val)}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="true" id="bank-transfer" />
                <Label htmlFor="bank-transfer">Chuyển khoản</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="false" id="direct" />
                <Label htmlFor="direct">Trực tiếp</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Time get money */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-2">
            <Label>Ngày trả tiền</Label>
            <div className="flex gap-2">
              <Select
                value={timeGroupCode}
                onValueChange={onChangeTimeGetMoney}
              >
                <SelectTrigger className="w-[200px]">
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
              <Input
                disabled
                value={formData.timeGetMoney}
                placeholder={DATE_FORMAT}
              />
            </div>
          </div>

          {/* Consignment ID */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-2">
            <Label>Mã ký gửi</Label>
            <Input
              value={formData.consignmentId}
              onChange={e => changeFormField('consignmentId', e.target.value)}
              placeholder="..."
            />
          </div>

          {/* Staff name */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-2">
            <Label>Tên Nhân Viên</Label>
            <Input disabled value={userData?.name || ''} placeholder="..." />
          </div>

          {/* Buttons */}
          <div className="flex justify-center gap-4 mt-5 mb-10">
            {channelMonitorRedux?.objectId && (
              <Button
                type="button"
                variant="outline"
                onClick={onUpdateMonitorData}
              >
                Cập nhật monitor
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => onRefreshAll(true)}
            >
              Khôi phục
            </Button>
            <Button
              type="submit"
              disabled={
                isLoadingTags ||
                isLoadingUser ||
                !formData.phoneNumber ||
                isConsigning
              }
            >
              {isConsigning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang xử
                  lý...
                </>
              ) : (
                'Xác nhận'
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Consignment;
