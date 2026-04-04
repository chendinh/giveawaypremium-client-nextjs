import { StoreServices } from '@/store/useAppStore';
import moment from 'moment';
import { toast } from 'sonner';

// ============ STORAGE HELPERS (to avoid circular dependency with store) ============

const STORAGE_KEY = 'gap-app-storage';

const getFromStorage = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;

  try {
    const storage = localStorage.getItem(STORAGE_KEY);
    if (storage) {
      const parsed = JSON.parse(storage);
      return parsed?.state?.[key] ?? defaultValue;
    }
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
  }
  return defaultValue;
};

const getAuthToken = (): string => getFromStorage('sessionToken', '');
const getUserData = (): any => getFromStorage('userData', {});
const getIpHash = (): { objectId?: string } | null =>
  getFromStorage('ipHash', null);
const getSettings = (): any => getFromStorage('settings', {});

// ============ TYPES ============

export interface FormData {
  customerName: string;
  phoneNumber: string;
  numberOfProduct: number | string;
}

export interface ConsignmentFormData {
  consignmentId: string;
  consignerName: string;
  consignerIdCard: string;
  mail: string;
  consigneeName: string;
  phoneNumber: string;
  numberOfProducts: number;
  timeGetMoney?: string;
  bankName: string;
  bankId: string;
}

export interface ProductItem {
  name?: string;
  count?: number;
  note?: string;
  price?: number;
  priceAfterFee?: number;
  code?: string;
  objectId?: string;
  medias?: any[];
  rateNew?: number;
  sizeInfo?: string;
  detailInfo?: string;
  soldNumberProduct?: number;
  remainNumberProduct?: number;
  status?: string;
}

export interface CustomerInfo {
  mail?: string;
  consignerName?: string;
  phoneNumber?: string;
  consignerIdCard?: string;
  timeConfirmGetMoney?: string;
}

export interface ConsignmentInfo {
  consignmentId: string;
  moneyBack?: number;
  timeGetMoney?: string;
  timeConfirmGetMoney?: string;
  bankName?: string;
  bankId?: string;
  numberOfProducts?: number;
}

export interface OrderData {
  clientInfo: {
    phoneNumber?: string;
    fullName?: string;
    consignerIdCard?: string;
    mail?: string;
  };
  shippingInfo?: {
    orderAdressProvince?: string;
    orderAdressDistrict?: string;
    orderAdressWard?: string;
    orderAdressStreet?: string;
    province?: string;
    district?: string;
    ward?: string;
    address?: string;
    name?: string;
    phone?: string;
    mail?: string;
    optionTransfer?: string;
  };
  isTransferWithBank?: string;
  isTransferMoneyWithBankAndOffline?: string;
  transferBankMoneyAmount?: number;
  transferOfflineMoneyAmount?: number;
  productList?: ProductItem[];
  totalNumberOfProductForSale?: number;
  totalMoneyForSale?: number;
  totalMoneyForSaleAfterFee?: number;
  note?: string;
  isOnlineSale?: string;
  isGetMoney?: boolean;
  timeConfirmGetMoney?: string;
  objectId?: string;
}

export interface AppointmentResult {
  results?: Array<{
    slot?: string;
    date?: string;
    dateTime?: string;
    customerName?: string;
    phoneNumber?: string;
    objectId?: string;
  }>;
  count?: number;
}

export interface ApiResponse<T = any> {
  results?: T[];
  result?: T;
  count?: number;
  objectId?: string;
  error?: string;
}

export interface SelectedKeys {
  phoneNumber?: string;
  consignerName?: string;
  fullName?: string;
  objectId?: string;
  isTransferMoneyWithBank?: boolean;
  totalNumberOfProductForSale?: string;
  isOnlineSale?: boolean;
  remainNumConsignment?: string;
  consignmentId?: string;
  isGetMoney?: boolean;
  name?: string;
  code?: string;
  soldNumberProduct?: string;
  remainNumberProduct?: string;
  waitingCode?: string;
  productId?: string;
}

// ============ CONSTANTS ============

const REQUEST_TYPE = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
} as const;

type RequestMethod = (typeof REQUEST_TYPE)[keyof typeof REQUEST_TYPE];

const ADDRESS_GET_ORDER_ARRAY = [
  'Hồ Chí Minh',
  'Quận 1',
  'Phường Nguyễn Thái Bình',
];

// ============ HELPER FUNCTIONS ============

const numberWithCommas = (x: number | string): string => {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const showNotification = (message: string): void => {
  toast.error(message);
};

const convertMediaArrayToPointerArray = (medias: any[]): any[] => {
  if (!medias || !Array.isArray(medias)) return [];
  return medias.map(media => ({
    __type: 'Pointer',
    className: 'Media',
    objectId: media.objectId || media,
  }));
};

// ============ GAP SERVICE CLASS ============

export class GapService {
  // Upload Functions
  static uploadSingleFileWithFormData = async (
    file: File,
    authKey?: string
  ): Promise<any> => {
    console.log('file uploading ======', file);
    const key = getAuthToken();

    return new Promise(resolve => {
      const data = new FormData();
      data.append('media', file);

      fetch('https://giveaway-premium-api-sbows.ondigitalocean.app/media', {
        body: data,
        method: 'POST',
        headers: {
          'x-parse-application-id': process.env.NEXT_PUBLIC_APP_ID || '',
          'x-parse-rest-api-key': process.env.NEXT_PUBLIC_REST_API_KEY || '',
          'x-parse-revocable-session': '1',
          'x-parse-session-token': key,
          'cache-control': 'no-cache',
        },
      }).then(result => resolve(result.json()));
    });
  };

  static uploadSingleFileWithTinify = async (file: File): Promise<any> => {
    console.log('file uploading ======', file);

    return new Promise(resolve => {
      const data = new FormData();
      data.append('media', file);

      fetch('https://api.tinify.com/shrink', {
        body: data,
        method: 'POST',
        headers: {
          Authorization: 'Basic Y4NWVvHdCfTbMYXwzvR8fNnr95vRrnx1',
        },
      }).then(result => resolve(result.json()));
    });
  };

  // Auth
  static logInAdmin(username: string, password: string): Promise<any> {
    const queryBody = { username, password };
    return this.fetchData(
      '/login',
      REQUEST_TYPE.GET,
      queryBody,
      null,
      null,
      null,
      null,
      true
    );
  }

  // Mail
  static async sendMail(
    customerInfo: CustomerInfo,
    consignmentInfo: ConsignmentInfo,
    type: string,
    title: string,
    timeGroupCode: string,
    productList: ProductItem[] = []
  ): Promise<any> {
    const productListTemp = productList.map(itemProduct => ({
      name: itemProduct.name || '',
      amount: itemProduct.count,
      status: itemProduct.note || '---',
      price: itemProduct.price
        ? `${numberWithCommas(itemProduct.price * 1000)} vnd`
        : '0 vnd',
      priceAfterFee: itemProduct.priceAfterFee
        ? `${numberWithCommas(itemProduct.priceAfterFee * 1000)} vnd`
        : '0 vnd',
    }));

    if (type) {
      let formatedTitle =
        customerInfo?.timeConfirmGetMoney &&
        customerInfo.timeConfirmGetMoney.length > 0
          ? `GAP ${title} ${consignmentInfo.consignmentId} ${consignmentInfo.timeConfirmGetMoney}`
          : `GAP ${title} ${consignmentInfo.consignmentId} ${consignmentInfo.timeGetMoney}`;
      formatedTitle = formatedTitle.replaceAll('-', '/');

      const body = {
        mailTo: customerInfo.mail?.toLowerCase(),
        title: formatedTitle,
        type,
        data: {
          moneyBack: consignmentInfo.moneyBack
            ? `${numberWithCommas(consignmentInfo.moneyBack)} vnd`
            : '0 vnd',
          customerName: customerInfo.consignerName,
          phoneNumber: customerInfo.phoneNumber,
          identityId: customerInfo.consignerIdCard,
          consignmentId: timeGroupCode
            ? `${consignmentInfo.consignmentId}-${timeGroupCode}`
            : consignmentInfo.consignmentId,
          numberOfProduct: consignmentInfo.numberOfProducts?.toString(),
          bankName: consignmentInfo.bankName,
          bankId: consignmentInfo.bankId,
          timeGetMoney: `${consignmentInfo.timeGetMoney} -> ${moment(consignmentInfo.timeGetMoney, 'DD-MM-YYYY').add(10, 'day').format('DD-MM-YYYY')}`,
          timeCheck: moment(consignmentInfo.timeGetMoney, 'DD-MM-YYYY')
            .subtract(3, 'day')
            .format('DD-MM-YYYY'),
          products: productListTemp,
        },
      };

      return this.fetchData(
        '/functions/email',
        REQUEST_TYPE.POST,
        null,
        body,
        null,
        null,
        null,
        true
      );
    }
  }

  // Media
  static async setMedia(infoMedia: any): Promise<any> {
    if (infoMedia?.asset_id) {
      const body = {
        data: infoMedia,
        cloud: 'Cloudinary',
        type: infoMedia.asset_id,
      };
      return this.fetchData('/classes/Media', REQUEST_TYPE.POST, null, body);
    } else {
      showNotification('Chưa Lưu thông tin ảnh được');
      return false;
    }
  }

  // Appointment
  static async getAppointmentWithPhone(
    phoneNumber: string,
    limit: number = 1,
    page: number = 1
  ): Promise<AppointmentResult> {
    const limited = limit || 1;
    const skip = limited * page - limited;
    const customQuery = `order=-createdAt&include=group&skip=${skip}&limit=${limited}&count=1&where={"deletedAt":${null},"phoneNumber":"${phoneNumber}"}`;
    return this.fetchData(
      '/classes/AppointmentSchedule',
      REQUEST_TYPE.GET,
      null,
      null,
      null,
      null,
      customQuery
    );
  }

  static async getAppointmentWithDate(
    dateArray: string[]
  ): Promise<AppointmentResult> {
    const limited = 300;
    const skip = limited * 1 - limited;
    const customQuery = `skip=${skip}&limit=${limited}&count=1&where={"deletedAt":${null},"date":{"$in":[${[...dateArray]}]}}`;
    return this.fetchData(
      '/classes/AppointmentSchedule',
      REQUEST_TYPE.GET,
      null,
      null,
      null,
      null,
      customQuery
    );
  }

  static async getAppointmentWithSlotId(
    slotID: string
  ): Promise<AppointmentResult> {
    const customQuery = `where={"slot":"${slotID}", "deletedAt":${null}}`;
    return this.fetchData(
      '/classes/AppointmentSchedule',
      REQUEST_TYPE.GET,
      null,
      null,
      null,
      null,
      customQuery
    );
  }

  static async deleteAppointmentWithSlotId(objectId: string): Promise<any> {
    try {
      const body = {
        deletedAt: {
          __type: 'Date',
          iso: moment().toISOString(),
        },
      };
      return this.fetchData(
        `/classes/AppointmentSchedule/${objectId}`,
        REQUEST_TYPE.PUT,
        null,
        body
      );
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  static async setAppointment(
    formData: FormData,
    slotID: string,
    formatedTime: string,
    formatedDay: string
  ): Promise<ApiResponse | false> {
    const res = await this.getAppointmentWithSlotId(slotID);

    if (res && res.results && res.results.length === 0) {
      const body = {
        slot: slotID,
        date: formatedDay,
        dateTime: formatedTime,
        agency: {
          __type: 'Pointer',
          className: 'Agency',
          objectId: 'HApHfw0saq',
        },
        customerName: formData.customerName,
        phoneNumber: formData.phoneNumber,
        numberOfProduct: `${formData.numberOfProduct}`,
      };
      return this.fetchData(
        '/classes/AppointmentSchedule',
        REQUEST_TYPE.POST,
        null,
        body
      );
    } else {
      showNotification('Đã có khách đặt slot này trước rồi');
      return false;
    }
  }

  // Consignment Search
  static async getConsignmentWithPhone(
    page: number = 1,
    phoneNumber: string,
    limit: number = 20
  ): Promise<any> {
    const skip = limit * page - limit;
    const customQuery = `include=group&order=-createdAt&skip=${skip}&limit=${limit}&count=1&where={"deletedAt":${null},"phoneNumber":"${phoneNumber}"}`;
    return this.fetchData(
      '/classes/Consignment',
      REQUEST_TYPE.GET,
      null,
      null,
      null,
      null,
      customQuery
    );
  }

  static async getConsignmentWithID(
    page: number = 1,
    consignerIdCard: string,
    limit: number = 20
  ): Promise<any> {
    const skip = limit * page - limit;
    const customQuery = `include=group&order=-createdAt&skip=${skip}&limit=${limit}&count=1&where={"deletedAt":${null},"consignerIdCard":"${consignerIdCard}"}`;
    return this.fetchData(
      '/classes/Consignment',
      REQUEST_TYPE.GET,
      null,
      null,
      null,
      null,
      customQuery
    );
  }

  // Consignment Group
  static async getConsignmentID(): Promise<any> {
    const customQuery = `where={"deletedAt":${null}}`;
    return this.fetchData(
      '/classes/ConsignmentGroup',
      REQUEST_TYPE.GET,
      null,
      null,
      null,
      null,
      customQuery
    );
  }

  static async setConsignmentID(tag: {
    code: string;
    timeGetMoney: string;
  }): Promise<any> {
    const body = {
      code: tag.code,
      timeGetMoney: tag.timeGetMoney,
    };
    return this.fetchData(
      '/classes/ConsignmentGroup',
      REQUEST_TYPE.POST,
      null,
      body
    );
  }

  static async deleteConsignmentID(objectId: string): Promise<any> {
    try {
      const body = {
        deletedAt: {
          __type: 'Date',
          iso: moment().toISOString(),
        },
      };
      return this.fetchData(
        `/classes/ConsignmentGroup/${objectId}`,
        REQUEST_TYPE.PUT,
        null,
        body
      );
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  // Event
  static async getEvents(): Promise<any> {
    const customQuery = `where={"deletedAt":${null}}`;
    return this.fetchData(
      '/classes/Event',
      REQUEST_TYPE.GET,
      null,
      null,
      null,
      null,
      customQuery
    );
  }

  static async setEvent(eventData: {
    name: string;
    discountPercent: number;
    moneyBackPercent: number;
  }): Promise<any> {
    const body = {
      name: eventData.name,
      discountPercent: eventData.discountPercent,
      moneyBackPercent: eventData.moneyBackPercent,
    };
    return this.fetchData('/classes/Event', REQUEST_TYPE.POST, null, body);
  }

  static async updateEvent(
    objectId: string,
    eventData: {
      name?: string;
      discountPercent?: number;
      moneyBackPercent?: number;
    }
  ): Promise<any> {
    return this.fetchData(
      `/classes/Event/${objectId}`,
      REQUEST_TYPE.PUT,
      null,
      eventData
    );
  }

  static async deleteEvent(objectId: string): Promise<any> {
    try {
      const body = {
        deletedAt: {
          __type: 'Date',
          iso: moment().toISOString(),
        },
      };
      return this.fetchData(
        `/classes/Event/${objectId}`,
        REQUEST_TYPE.PUT,
        null,
        body
      );
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  // Product
  static async getProduct(
    page: number = 1,
    selectedKeys: SelectedKeys | null = null,
    limit: number = 100,
    currentTagId: string
  ): Promise<any> {
    const limited = limit || 100;
    const skip = limited * page - limited;

    if (selectedKeys) {
      const whereUpperCase: Record<string, any> = {};
      const whereLowerCase: Record<string, any> = {};

      if (selectedKeys?.name && selectedKeys.name.length > 0) {
        whereUpperCase.name = { $regex: selectedKeys.name.trim() };
        whereLowerCase.name = {
          $regex: selectedKeys.name.trim().toLowerCase(),
        };
      }

      if (selectedKeys?.code && selectedKeys.code.length > 0) {
        whereUpperCase.code = { $regex: selectedKeys.code.trim() };
        whereLowerCase.code = {
          $regex: selectedKeys.code.trim().toLowerCase(),
        };
      }

      if (
        selectedKeys?.soldNumberProduct &&
        selectedKeys.soldNumberProduct.length > 0
      ) {
        whereUpperCase.soldNumberProduct = Number(
          selectedKeys.soldNumberProduct.trim()
        );
        whereLowerCase.soldNumberProduct = Number(
          selectedKeys.soldNumberProduct.trim()
        );
      }

      if (
        selectedKeys?.remainNumberProduct &&
        selectedKeys.remainNumberProduct.length > 0
      ) {
        whereUpperCase.remainNumberProduct = Number(
          selectedKeys.remainNumberProduct.trim()
        );
        whereLowerCase.remainNumberProduct = Number(
          selectedKeys.remainNumberProduct.trim()
        );
      }

      whereUpperCase.deletedAt = { $exists: false };
      whereLowerCase.deletedAt = { $exists: false };
      whereLowerCase.group = {
        __type: 'Pointer',
        className: 'ConsignmentGroup',
        objectId: currentTagId,
      };
      whereUpperCase.group = {
        __type: 'Pointer',
        className: 'ConsignmentGroup',
        objectId: currentTagId,
      };

      const allSearchRegex = JSON.stringify({
        $or: [whereUpperCase, whereLowerCase],
      });

      const customQuery = `include=medias&skip=${skip}&limit=${limited}&count=1&where=${allSearchRegex}`;
      return this.fetchData(
        '/classes/Product',
        REQUEST_TYPE.GET,
        null,
        null,
        null,
        null,
        customQuery
      );
    } else {
      const customQuery = `include=medias&skip=${skip}&limit=${limited}&count=1&where={"deletedAt":${null},"group":{"__type":"Pointer","className":"ConsignmentGroup","objectId":"${currentTagId}"}}`;
      return this.fetchData(
        '/classes/Product',
        REQUEST_TYPE.GET,
        null,
        null,
        null,
        null,
        customQuery
      );
    }
  }

  static async getProductStore(
    page: number = 1,
    keyword: string | null = null,
    limit: number = 100,
    categoryId: string,
    subCategoryId?: string
  ): Promise<any> {
    const limited = limit || 100;
    const skip = limited * page - limited;

    if (keyword) {
      const customQuery = `include=medias,category,subCategory&skip=${skip}&limit=${limited}&count=1&where={"remainNumberProduct":{"$gte":0}, "name":{"$regex":"${keyword}"},"status":"ACTIVE","categoryId.objectId":"${categoryId}"}`;

      return this.fetchData(
        '/classes/Product',
        REQUEST_TYPE.GET,
        null,
        null,
        null,
        null,
        customQuery
      );
    } else {
      const customQuery = `include=medias,category,subCategory&skip=${skip}&limit=${limited}&count=1&where={"remainNumberProduct":{"$gte":0}, "status":"ACTIVE","category":{"__type":"Pointer","className":"Category","objectId":"${categoryId}"}}`;

      return this.fetchData(
        '/classes/Product',
        REQUEST_TYPE.GET,
        null,
        null,
        null,
        null,
        customQuery
      );
    }
  }

  static async getProductWithCode(keyword: string): Promise<any> {
    const customQuery = `include=medias&limit=${1}&count=1&where={"code":"${keyword}"}`;

    return this.fetchData(
      '/classes/Product',
      REQUEST_TYPE.GET,
      null,
      null,
      null,
      null,
      customQuery
    );
  }

  static async getProductWithObjectKey(objectId: string): Promise<any> {
    const customQuery = `include=medias,category,subCategory&limit=${1}&count=1&where={"objectId":"${objectId}"}`;

    return this.fetchData(
      '/classes/Product',
      REQUEST_TYPE.GET,
      null,
      null,
      null,
      null,
      customQuery
    );
  }

  static async updateProduct(
    item: ProductItem,
    isUploadImg: boolean = false
  ): Promise<any> {
    try {
      let body: Record<string, any>;

      if (isUploadImg && item.medias) {
        body = {
          medias: convertMediaArrayToPointerArray(item.medias),
        };
      } else {
        body = {
          medias: convertMediaArrayToPointerArray(item.medias || []),
          rateNew: Number(item.rateNew) || 0,
          note: item.note || '---',
          sizeInfo: item.sizeInfo || '---',
          detailInfo: item.detailInfo || '---',
          code: item.code,
          name: item.name,
          price: item.price,
          priceAfterFee: item.priceAfterFee,
          count: item.count,
          soldNumberProduct: item.soldNumberProduct,
          remainNumberProduct: item.remainNumberProduct,
        };
      }

      if (item?.status) {
        body.status = item.status;
      }

      return this.fetchData(
        `/classes/Product/${item.objectId}`,
        REQUEST_TYPE.PUT,
        null,
        body
      );
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  // Order Guest
  static async getOrderGuestWithCode(keyword?: string): Promise<any> {
    let customQuery: string;
    if (keyword && keyword.length > 0) {
      customQuery = `include=medias&limit=${1}&count=1&where={"objectId":"${keyword}"}`;

      return this.fetchData(
        '/classes/Product',
        REQUEST_TYPE.GET,
        null,
        null,
        null,
        null,
        customQuery
      );
    } else {
      customQuery = `include=medias&limit=${1}&count=1`;
    }
    return this.fetchData(
      '/classes/Product',
      REQUEST_TYPE.GET,
      null,
      null,
      null,
      null,
      customQuery
    );
  }

  static async setOrderGuest(
    productId: string,
    count: number = 1
  ): Promise<any> {
    const body = {
      productId,
      count: count || 1,
    };
    return this.fetchData(
      '/functions/orderGuest',
      REQUEST_TYPE.POST,
      null,
      body
    );
  }

  static async updateClientInfoOrderRequest(
    objectId: string,
    userData: { clientInfo?: any; shippingInfo?: any },
    waitingCode?: string
  ): Promise<any> {
    try {
      const body: Record<string, any> = {
        userInformation: {
          ...userData.clientInfo,
          ...userData.shippingInfo,
        },
      };

      if (body?.userInformation?.phoneNumber) {
        body.phoneNumber = body.userInformation.phoneNumber;
      }

      if (waitingCode) {
        body.waitingCode = waitingCode;
      }

      return this.fetchData(
        `/classes/OrderRequest/${objectId}`,
        REQUEST_TYPE.PUT,
        null,
        body,
        null,
        null,
        null,
        true
      );
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  static async updateOrderRequest(
    item: {
      objectId: string;
      orderId?: string;
      transporterId?: string;
      isGetMoney?: boolean;
      isContact?: boolean;
      timeConfirmGetMoney?: string;
    },
    isUpdateOrderAndTransportOnly: boolean = false
  ): Promise<any> {
    try {
      const body: Record<string, any> = {};

      if (isUpdateOrderAndTransportOnly) {
        if (item?.orderId) {
          body.orderData = {
            __type: 'Pointer',
            className: 'Order',
            objectId: item.orderId,
          };
        }
        if (item?.transporterId) {
          body.transporterDaata = {
            __type: 'Pointer',
            className: 'Transporter',
            objectId: item.transporterId,
          };
        }
      } else {
        body.isGetMoney = item.isGetMoney || false;
        body.isContact = item.isContact || false;

        if (item?.timeConfirmGetMoney) {
          body.timeConfirmGetMoney = item.timeConfirmGetMoney;
        }
      }

      return this.fetchData(
        `/classes/OrderRequest/${item.objectId}`,
        REQUEST_TYPE.PUT,
        null,
        body,
        null,
        null,
        null,
        true
      );
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  static async deleteOrderRequest(objectId: string): Promise<any> {
    try {
      const body = {
        deletedAt: {
          __type: 'Date',
          iso: moment().toISOString(),
        },
      };
      return this.fetchData(
        `/classes/OrderRequest/${objectId}`,
        REQUEST_TYPE.PUT,
        null,
        body
      );
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  // Category
  static async getCategory(): Promise<any> {
    return this.fetchData(
      '/classes/Category?include=subCategories',
      REQUEST_TYPE.GET,
      null,
      null,
      null,
      null
    );
  }

  static async getCategoryNhanh(): Promise<any> {
    return this.fetchData(
      'functions/nhanh-category',
      REQUEST_TYPE.GET,
      null,
      null,
      null,
      null
    );
  }

  static async getBookingFormat(): Promise<any> {
    return this.fetchData(
      '/classes/Setting/meu8SzyuLd',
      REQUEST_TYPE.GET,
      null,
      null,
      null,
      null
    );
  }

  // Setting
  static async getSetting(): Promise<any> {
    return this.fetchData(
      '/classes/Setting',
      REQUEST_TYPE.GET,
      null,
      null,
      null,
      null
    );
  }

  static async updateSetting(settingObject: Record<string, any>): Promise<any> {
    const body = { Setting: settingObject };
    return this.fetchData(
      '/classes/Setting/meu8SzyuLd',
      REQUEST_TYPE.PUT,
      null,
      body,
      null,
      null,
      null,
      true
    );
  }

  // Transport
  static async getFeeForTransport(
    formData: {
      orderAdressProvince: string;
      orderAdressDistrict: string;
      orderAdressWard: string;
    },
    isXteam: boolean = false
  ): Promise<any> {
    const body = {
      service: 'giaohangtietkiem',
      action: 'PRICE_ESTIMATE',
      data: {
        weight: 0.1,
        serviceLevel: isXteam ? 'xteam' : 'none',
        from: {
          province: ADDRESS_GET_ORDER_ARRAY[0],
          district: ADDRESS_GET_ORDER_ARRAY[1],
          address: ADDRESS_GET_ORDER_ARRAY[2],
        },
        to: {
          province: formData.orderAdressProvince,
          district: formData.orderAdressDistrict,
          address: formData.orderAdressWard,
        },
        transport: 'road',
        value: 0,
      },
    };
    return this.fetchData(
      '/functions/transporter',
      REQUEST_TYPE.POST,
      null,
      body
    );
  }

  static async deleteTransport(orderId: string): Promise<any> {
    const body = {
      service: 'giaohangtietkiem',
      action: 'CANCEL_ORDER',
      data: { orderId },
    };
    return this.fetchData(
      '/functions/transporter',
      REQUEST_TYPE.POST,
      null,
      body
    );
  }

  static async getLabelTransform(
    orderId: string,
    orginal: 'landscape' | 'portrait' = 'landscape',
    pageSize: 'A6' | 'A5' = 'A6'
  ): Promise<any> {
    const body = {
      service: 'giaohangtietkiem',
      action: 'GET_ORDER_LABEL',
      data: { orderId, orginal, pageSize },
    };
    return this.fetchData(
      '/functions/transporter',
      REQUEST_TYPE.POST,
      null,
      body
    );
  }

  // ── Viettel Post Shipping ──

  /**
   * Get shipping fee estimate from Viettel Post
   */
  static async getViettelPostFee(
    formData: {
      orderAdressProvince?: string;
      orderAdressDistrict?: string;
      orderAdressWard?: string;
    },
    weight: number = 0.2,
    value: number = 0,
    moneyCollection: number = 0
  ): Promise<any> {
    try {
      // Note: This requires province/district IDs for Viettel Post
      // For now, we'll use a simplified approach
      const body = {
        senderProvinceId: 1, // Hồ Chí Minh - should be configurable
        senderDistrictId: 1, // Quận 1 - should be configurable
        receiverProvinceId: 1, // TODO: Map from province name to ID
        receiverDistrictId: 1, // TODO: Map from district name to ID
        weight,
        value,
        moneyCollection,
      };

      const response = await fetch('/api/shipping/viettel-post/estimate-fee', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      return await response.json();
    } catch (error) {
      console.error('Viettel Post fee estimate error:', error);
      return { error: true, message: 'Failed to estimate shipping fee' };
    }
  }

  /**
   * Create Viettel Post shipping order
   */
  static async pushOrderToViettelPost(
    orderData: any,
    orderId: string
  ): Promise<any> {
    try {
      const {
        clientInfo = {},
        shippingInfo = {},
        productList = [],
        totalMoneyForSale = 0,
      } = orderData;

      // Calculate total weight and prepare product info
      const totalWeight = productList.reduce(
        (sum: number, item: any) => sum + (item.count || 1) * 0.2,
        0
      );
      const productNames = productList
        .map((item: any) => `${item.name} (x${item.count || 1})`)
        .join(', ');

      const body = {
        orderNumber: orderId,
        sender: {
          name: 'Giveaway Premium store',
          address: '1 Phó Đức Chính, Phường Nguyễn Thái Bình',
          phone: '0703334443',
          email: 'store@giveawaypremium.com',
          provinceId: 1, // Hồ Chí Minh
          districtId: 1, // Quận 1
          wardId: 1, // Phường Nguyễn Thái Bình
        },
        receiver: {
          name: clientInfo.fullName || '',
          address: `${shippingInfo.orderAdressStreet || ''}, ${shippingInfo.orderAdressWard || ''}, ${shippingInfo.orderAdressDistrict || ''}, ${shippingInfo.orderAdressProvince || ''}`,
          phone: clientInfo.phoneNumber || '',
          email: clientInfo.mail || '',
          provinceId: 1, // TODO: Map from province name
          districtId: 1, // TODO: Map from district name
          wardId: 1, // TODO: Map from ward name
        },
        product: {
          name: productNames || 'Sản phẩm',
          description: productNames,
          quantity: productList.length,
          price: Math.min(totalMoneyForSale * 1000, 2000000),
          weight: totalWeight,
          items: productList.map((item: any) => ({
            PRODUCT_NAME: item.name || 'Sản phẩm',
            PRODUCT_PRICE: (item.priceAfterFee || item.price || 0) * 1000,
            PRODUCT_WEIGHT: 0.2,
            PRODUCT_QUANTITY: item.count || 1,
          })),
        },
        payment: {
          type: 1, // Người gửi trả
        },
        service: {
          type: 'VCN', // Viettel Chuyển Nhanh
        },
        moneyCollection: 0, // No COD
        note: shippingInfo.note || '',
      };

      const response = await fetch('/api/shipping/viettel-post/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      return await response.json();
    } catch (error) {
      console.error('Viettel Post create order error:', error);
      return { error: true, message: 'Failed to create Viettel Post order' };
    }
  }

  /**
   * Cancel Viettel Post order
   */
  static async cancelViettelPostOrder(orderNumber: string): Promise<any> {
    try {
      const response = await fetch('/api/shipping/viettel-post/cancel-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderNumber }),
      });

      return await response.json();
    } catch (error) {
      console.error('Viettel Post cancel order error:', error);
      return { error: true, message: 'Failed to cancel order' };
    }
  }

  /**
   * Get Viettel Post shipping label
   */
  static async getViettelPostLabel(orderNumber: string): Promise<any> {
    try {
      const response = await fetch('/api/shipping/viettel-post/get-label', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderNumbers: [orderNumber] }),
      });

      return await response.json();
    } catch (error) {
      console.error('Viettel Post get label error:', error);
      return { error: true, message: 'Failed to get shipping label' };
    }
  }

  /**
   * Get Viettel Post order tracking info
   */
  static async getViettelPostTracking(orderNumber: string): Promise<any> {
    try {
      const response = await fetch('/api/shipping/viettel-post/tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderNumber }),
      });

      return await response.json();
    } catch (error) {
      console.error('Viettel Post tracking error:', error);
      return { error: true, message: 'Failed to get tracking info' };
    }
  }

  // ── Customer ──
  static async getCustomer(
    phoneNumber: string,
    limit: number = 100
  ): Promise<any> {
    const limited = limit;
    const skip = limited * 1 - limited;
    const customQuery = `skip=${skip}&limit=${limited}&count=1&where={"$or":[{"phoneNumber":"${phoneNumber.toString()}"},{"username":"${phoneNumber.toString()}"}]}`;
    return this.fetchData(
      '/classes/_User',
      REQUEST_TYPE.GET,
      null,
      null,
      null,
      null,
      customQuery
    );
  }

  static async getCustomerTable(
    page: number = 1,
    keyword: string | null = null
  ): Promise<any> {
    const limited = 100;
    const skip = limited * page - limited;
    if (keyword) {
      const customQuery = `skip=${skip}&limit=${limited}&count=1&where={"role":"customer","phoneNumber":"${keyword.toString()}"}`;
      return this.fetchData(
        '/classes/_User',
        REQUEST_TYPE.GET,
        null,
        null,
        null,
        null,
        customQuery
      );
    } else {
      const customQuery = `skip=${skip}&limit=${limited}&count=1&where={"role":"customer"}`;
      return this.fetchData(
        '/classes/_User',
        REQUEST_TYPE.GET,
        null,
        null,
        null,
        null,
        customQuery
      );
    }
  }

  static async setCustomer(formData: any): Promise<any> {
    const body = {
      role: 'customer',
      fullName: formData.consignerName,
      phoneNumber: formData.phoneNumber,
      identityNumber: formData.consignerIdCard,
      mail: formData.mail,
      birthday: formData.birthday,
      username: formData.username || formData.phoneNumber,
      password: formData.password,
      banks: [
        {
          type: formData.bankName,
          accNumber: formData.bankId,
        },
      ],
    };
    return this.fetchData('/classes/_User', REQUEST_TYPE.POST, null, body);
  }

  static async updateCustomerTable(formData: any): Promise<any> {
    const body = {
      fullName: formData.fullName,
      phoneNumber: formData.phoneNumber,
      identityNumber: formData.identityNumber,
      mail: formData.mail,
      birthday: formData.birthday,
      banks: [
        {
          type: formData.bankName,
          accNumber: formData.bankId,
        },
      ],
    };
    return this.fetchData(
      `/classes/_User/${formData.objectId}`,
      REQUEST_TYPE.PUT,
      null,
      body,
      null,
      null,
      null,
      true
    );
  }

  static async updateCustomer(formData: any, objectId: string): Promise<any> {
    const body: Record<string, any> = {
      fullName: formData.consignerName,
      phoneNumber: formData.phoneNumber,
      identityNumber: formData.consignerIdCard,
      mail: formData.mail,
      birthday: formData.birthday,
      banks: [
        {
          type: formData.bankName,
          accNumber: formData.bankId,
        },
      ],
    };

    if (formData.totalMoneyForSale) {
      body.totalMoneyForSale = `${formData.totalMoneyForSale}`;
    }
    if (formData.numberOfSale) {
      body.numberOfSale = `${formData.numberOfSale}`;
    }
    if (formData.totalProductForSale) {
      body.totalProductForSale = `${formData.totalProductForSale}`;
    }

    return this.fetchData(
      `/users/${objectId}`,
      REQUEST_TYPE.PUT,
      null,
      body,
      null,
      null,
      null,
      true
    );
  }

  // ── Consignment ──
  static async getConsignment(
    page: number = 1,
    keyword?: string | null,
    limit?: number | null,
    groupId?: string | null
  ): Promise<any> {
    const lim = limit || 20;
    const skip = lim * page - lim;
    let whereObj: any = { deletedAt: null };
    if (groupId) {
      whereObj.group = {
        __type: 'Pointer',
        className: 'ConsignmentGroup',
        objectId: groupId,
      };
    }
    const customQuery = `order=-createdAt&skip=${skip}&limit=${lim}&count=1&where=${JSON.stringify(whereObj)}`;
    return this.fetchData(
      '/classes/Consignment',
      REQUEST_TYPE.GET,
      null,
      null,
      null,
      null,
      customQuery
    );
  }

  static async setConsignment(
    formData: any,
    consigneeData: string | undefined,
    consignerData: string,
    timeGroupId: string,
    timeGroupCode: string,
    productList: any[],
    moneyBackForFullSold: number,
    totalMoney: number,
    isTransferMoneyWithBank: string = 'false',
    note: string = ''
  ): Promise<any> {
    const body = {
      consignmentId: formData.consignmentId + '-' + timeGroupCode,
      consignerName: formData.consignerName,
      consignerIdCard: formData.consignerIdCard,
      mail: formData.mail,
      consignee: consigneeData
        ? { __type: 'Pointer', className: '_User', objectId: consigneeData }
        : undefined,
      consigner: {
        __type: 'Pointer',
        className: '_User',
        objectId: consignerData,
      },
      group: {
        __type: 'Pointer',
        className: 'ConsignmentGroup',
        objectId: timeGroupId,
      },
      consigneeName: formData.consigneeName,
      phoneNumber: formData.phoneNumber,
      numberOfProducts: Number(formData.numberOfProducts),
      timeGetMoney: formData.timeGetMoney || '',
      moneyBackForFullSold: Math.round(Number(moneyBackForFullSold)) || 0,
      totalMoney,
      banks: [
        {
          type: formData.bankName,
          accNumber: formData.bankId,
        },
      ],
      note,
      isTransferMoneyWithBank: isTransferMoneyWithBank === 'true',
      productList: productList || [],
    };
    return this.fetchData(
      '/classes/Consignment',
      REQUEST_TYPE.POST,
      null,
      body,
      null,
      null,
      null,
      true
    );
  }

  // ── Channel ──
  static async updateChannel(dataBody: any, objectId: string): Promise<any> {
    const body = { ...dataBody };
    return this.fetchData(
      `/classes/Channel/${objectId}`,
      REQUEST_TYPE.PUT,
      null,
      body,
      null,
      null,
      null,
      true
    );
  }

  static async getChannel(): Promise<any> {
    const customQuery = `where={"deletedAt":${null}}`;
    return this.fetchData(
      '/classes/Channel',
      REQUEST_TYPE.GET,
      null,
      null,
      null,
      null,
      customQuery
    );
  }

  static async setChannel(dataBody: any): Promise<any> {
    const body = {
      name: dataBody.name,
      data: dataBody.data || {},
      type: dataBody.type,
    };
    return this.fetchData(
      '/classes/Channel',
      REQUEST_TYPE.POST,
      null,
      body,
      null,
      null,
      null,
      true
    );
  }

  static async deleteChannel(objectId: string): Promise<any> {
    try {
      const body = {
        deletedAt: { __type: 'Date', iso: moment().toISOString() },
      };
      return this.fetchData(
        `/classes/Channel/${objectId}`,
        REQUEST_TYPE.PUT,
        null,
        body
      );
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  // ── IP Hash ──
  static async setIPHASH(formData: any): Promise<any> {
    const body = {
      HashIP: formData.HashIP,
    };
    return this.fetchData('/classes/IP', REQUEST_TYPE.POST, null, body);
  }

  static async updateIPHASH(formData: any = {}): Promise<any> {
    const ipHash = getIpHash();
    const ud = getUserData();

    const body = {
      userData: { ...ud, ...formData.userData },
    };

    if (ipHash && ipHash.objectId) {
      return this.fetchData(
        `/classes/IP/${ipHash.objectId}`,
        REQUEST_TYPE.PUT,
        null,
        body
      );
    } else {
      return false;
    }
  }

  // ── Order ──
  static async setOrder(
    dataOrder: OrderData,
    consigneeData: string,
    consignerData: string
  ): Promise<any> {
    const body: Record<string, any> = {
      phoneNumber: dataOrder.clientInfo.phoneNumber,
      fullName: dataOrder.clientInfo.fullName,
      consignerIdCard: dataOrder.clientInfo.consignerIdCard,
      clientInfo: dataOrder.clientInfo,
      consignee: {
        __type: 'Pointer',
        className: '_User',
        objectId: consigneeData,
      },
      client: {
        __type: 'Pointer',
        className: '_User',
        objectId: consignerData,
      },
      isTransferMoneyWithBank: dataOrder.isTransferWithBank === 'true',
      isTransferMoneyWithBankAndOffline:
        !(dataOrder.isTransferWithBank === 'true') &&
        dataOrder.isTransferMoneyWithBankAndOffline === 'true',
      transferBankMoneyAmount: dataOrder.transferBankMoneyAmount || 0,
      transferOfflineMoneyAmount: dataOrder.transferOfflineMoneyAmount || 0,
      productList: dataOrder.productList || [],
      totalNumberOfProductForSale: `${dataOrder.totalNumberOfProductForSale}`,
      totalMoneyForSale: `${dataOrder.totalMoneyForSale}`,
      totalMoneyForSaleAfterFee: `${dataOrder.totalMoneyForSaleAfterFee}`,
      note: dataOrder.note,
      isOnlineSale: dataOrder.isOnlineSale === 'true',
      shippingInfo: dataOrder.shippingInfo,
      isGetMoney: dataOrder.isGetMoney || false,
    };

    if (dataOrder.timeConfirmGetMoney) {
      body.timeConfirmGetMoney = dataOrder.timeConfirmGetMoney;
    }

    return this.fetchData('/classes/Order', REQUEST_TYPE.POST, null, body);
  }

  static async updateOrder(item: {
    objectId: string;
    isGetMoney?: boolean;
    timeConfirmGetMoney?: string;
  }): Promise<any> {
    try {
      const body: Record<string, any> = {
        isGetMoney: item.isGetMoney || false,
      };
      if (item.timeConfirmGetMoney) {
        body.timeConfirmGetMoney = item.timeConfirmGetMoney;
      }
      return this.fetchData(
        `/classes/Order/${item.objectId}`,
        REQUEST_TYPE.PUT,
        null,
        body,
        null,
        null,
        null,
        true
      );
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  static async deleteOrder(objectId: string): Promise<any> {
    try {
      const body = {
        deletedAt: { __type: 'Date', iso: moment().toISOString() },
      };
      return this.fetchData(
        `/classes/Order/${objectId}`,
        REQUEST_TYPE.PUT,
        null,
        body
      );
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  static async getOrder(
    page: number = 1,
    selectedKeys: SelectedKeys | null = null,
    limit: number = 100,
    fromDateMoment?: string,
    toDateMoment?: string
  ): Promise<any> {
    const limited = limit || 100;
    const skip = limited * page - limited;

    if (selectedKeys) {
      const fromDateFormated = moment(fromDateMoment, 'YYYY-MM-DD');
      const toDateFormated = moment(toDateMoment, 'YYYY-MM-DD');
      let allSearchRegex = `"deletedAt":${null}, "createdAt": {"$gte": {"__type": "Date","iso": "${fromDateFormated}"},"$lte": {"__type": "Date","iso": "${toDateFormated}"}}`;

      if (selectedKeys.phoneNumber) {
        allSearchRegex += `,"phoneNumber":{"$regex":"${selectedKeys.phoneNumber.trim()}"}`;
      }
      if (selectedKeys.fullName) {
        allSearchRegex += `,"fullName":{"$text":{"$search":{"$term":"${selectedKeys.fullName}"}}}`;
      }
      if (selectedKeys.isTransferMoneyWithBank) {
        allSearchRegex += `,"isTransferMoneyWithBank":${selectedKeys.isTransferMoneyWithBank}`;
      }
      if (selectedKeys.totalNumberOfProductForSale) {
        allSearchRegex += `,"totalNumberOfProductForSale":${selectedKeys.totalNumberOfProductForSale.trim()}`;
      }
      if (selectedKeys.isOnlineSale) {
        allSearchRegex += `,"isOnlineSale":${selectedKeys.isOnlineSale}`;
      }

      const customQuery = `skip=${skip}&limit=${limited}&count=1&include=client,transporter&where={${allSearchRegex}}`;
      const customQueryWithoutCondition = `include=client,transporter,productList.consignment`;

      if (selectedKeys.objectId) {
        return this.fetchData(
          `/classes/Order/${selectedKeys.objectId.trim()}`,
          REQUEST_TYPE.GET,
          null,
          null,
          null,
          null,
          customQueryWithoutCondition
        );
      } else {
        return this.fetchData(
          '/classes/Order',
          REQUEST_TYPE.GET,
          null,
          null,
          null,
          null,
          customQuery
        );
      }
    } else {
      const fromDateFormated = moment(fromDateMoment, 'YYYY-MM-DD');
      const toDateFormated = moment(toDateMoment, 'YYYY-MM-DD');
      const customQuery = `skip=${skip}&limit=${limited}&count=1&include=client,transporter,productList.consignment&where={"deletedAt":${null}, "createdAt": {"$gte": {"__type": "Date","iso": "${fromDateFormated}"},"$lte": {"__type": "Date","iso": "${toDateFormated}"}}}`;
      return this.fetchData(
        '/classes/Order',
        REQUEST_TYPE.GET,
        null,
        null,
        null,
        null,
        customQuery
      );
    }
  }

  // ── Order Request Search ──
  static async getOrderRequestWithSearchKey(
    page: number = 1,
    selectedKeys: SelectedKeys | null = null,
    limit: number = 100,
    fromDateMoment?: string,
    toDateMoment?: string
  ): Promise<any> {
    const limited = limit || 100;
    const skip = limited * page - limited;

    if (selectedKeys) {
      const fromDateFormated = moment(fromDateMoment, 'YYYY-MM-DD');
      const toDateFormated = moment(toDateMoment, 'YYYY-MM-DD');
      let allSearchRegex = `"deletedAt":${null}, "createdAt": {"$gte": {"__type": "Date","iso": "${fromDateFormated}"},"$lte": {"__type": "Date","iso": "${toDateFormated}"}}`;

      if (selectedKeys.phoneNumber) {
        allSearchRegex += `,"phoneNumber":{"$regex":"${selectedKeys.phoneNumber.trim()}"}`;
      }
      if (selectedKeys.fullName) {
        allSearchRegex += `,"fullName":{"$text":{"$search":{"$term":"${selectedKeys.fullName}"}}}`;
      }
      if (selectedKeys.isTransferMoneyWithBank) {
        allSearchRegex += `,"isTransferMoneyWithBank":${selectedKeys.isTransferMoneyWithBank}`;
      }
      if (selectedKeys.totalNumberOfProductForSale) {
        allSearchRegex += `,"totalNumberOfProductForSale":${selectedKeys.totalNumberOfProductForSale.trim()}`;
      }
      if (selectedKeys.waitingCode) {
        allSearchRegex += `,"waitingCode":{"$text":{"$search":{"$term":"${selectedKeys.waitingCode.trim()}"}}}`;
      }
      if (selectedKeys.isOnlineSale) {
        allSearchRegex += `,"isOnlineSale":${selectedKeys.isOnlineSale}`;
      }

      let customQuery = `skip=${skip}&limit=${limited}&count=1&include=product,orderData,orderData.transporter&where={${allSearchRegex}}`;
      const customQueryWithoutCondition = `include=product,orderData,orderData.transporter`;

      if (selectedKeys.productId) {
        allSearchRegex += `,"product":{"__type":"Pointer","className":"Product","objectId":"${selectedKeys.productId.trim()}"}`;
        customQuery = `skip=${skip}&limit=${limited}&count=1&include=product,orderData,orderData.transporter&where={${allSearchRegex}}`;
      }

      if (selectedKeys.objectId) {
        return this.fetchData(
          `/classes/OrderRequest/${selectedKeys.objectId.trim()}`,
          REQUEST_TYPE.GET,
          null,
          null,
          null,
          null,
          customQueryWithoutCondition
        );
      } else {
        return this.fetchData(
          '/classes/OrderRequest',
          REQUEST_TYPE.GET,
          null,
          null,
          null,
          null,
          customQuery
        );
      }
    } else {
      const fromDateFormated = moment(fromDateMoment, 'YYYY-MM-DD');
      const toDateFormated = moment(toDateMoment, 'YYYY-MM-DD');
      const customQuery = `skip=${skip}&limit=${limited}&count=1&include=product,orderData,orderData.transporter&where={"deletedAt":${null}, "createdAt": {"$gte": {"__type": "Date","iso": "${fromDateFormated}"},"$lte": {"__type": "Date","iso": "${toDateFormated}"}}}`;
      return this.fetchData(
        '/classes/OrderRequest',
        REQUEST_TYPE.GET,
        null,
        null,
        null,
        null,
        customQuery
      );
    }
  }

  static async getOrderRequestWithID(
    page: number = 1,
    productId: string | null = null,
    limit: number = 20
  ): Promise<any> {
    const limited = limit || 100;
    const skip = limited * page - limited;

    const fromDateFormated = moment().startOf('day');
    const toDateFormated = moment(fromDateFormated).add(1, 'day');

    const customQuery = `include=product&skip=${skip}&limit=${limited}&count=1&where={"$or":[{"status":"IN_QUEUE"}, {"status":"VALID"}],"deletedAt":${null}, "createdAt": {"$gte": {"__type": "Date","iso": "${fromDateFormated}"}} ,"product": { "__type": "Pointer", "className": "Product", "objectId": "${productId}" }}`;
    return this.fetchData(
      '/classes/OrderRequest',
      REQUEST_TYPE.GET,
      null,
      null,
      null,
      null,
      customQuery
    );
  }

  // ── Consignment extra ──
  static async getConsignmentWithPhoneIncludeText(
    page: number = 1,
    keyword: string | null = null,
    limit: number = 20
  ): Promise<any> {
    const limited = limit || 100;
    const skip = limited * page - limited;
    const customQuery = `order=-createdAt&include=group&skip=${skip}&limit=${limited}&count=1&where={"deletedAt":${null},"phoneNumber":{"$regex":"${keyword}"}}`;
    return this.fetchData(
      '/classes/Consignment',
      REQUEST_TYPE.GET,
      null,
      null,
      null,
      null,
      customQuery
    );
  }

  static async deleteConsignment(objectId: string): Promise<any> {
    try {
      const body = {
        deletedAt: { __type: 'Date', iso: moment().toISOString() },
      };
      return this.fetchData(
        `/classes/Consignment/${objectId}`,
        REQUEST_TYPE.PUT,
        null,
        body
      );
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  static async updateConsignment(item: any): Promise<any> {
    try {
      const productListTemp = [...item.productList];
      productListTemp.forEach((_: any, itemIndex: number) => {
        if (!productListTemp[itemIndex].note) {
          productListTemp[itemIndex].note = '---';
        }
      });
      const body = {
        consignmentId: item.consignmentId,
        numberOfProducts: Number(item.numberOfProducts),
        numSoldConsignment: Number(item.numSoldConsignment || 0),
        remainNumConsignment:
          Number(item.numberOfProducts) - Number(item.numSoldConsignment || 0),
        moneyBack: Number(item.moneyBack) || 0,
        moneyBackForFullSold: Number(item.moneyBackForFullSold) || 0,
        isGetMoney: item.isGetMoney || false,
        productList: productListTemp,
        timeConfirmGetMoney: item.timeConfirmGetMoney,
        note: item.note || '',
      };
      return this.fetchData(
        `/classes/Consignment/${item.objectId}`,
        REQUEST_TYPE.PUT,
        null,
        body,
        null,
        null,
        null,
        true
      );
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  static async sendEmailTongketWithObjectId(id: string): Promise<any> {
    const body = { objectId: id };
    return this.fetchData(
      '/functions/emailRemiderIndividualConsignment',
      REQUEST_TYPE.POST,
      null,
      body,
      null,
      null,
      null,
      true
    );
  }

  static async sendEmailTongketALLWithObjectIdConsigment(
    idConsignment: string
  ): Promise<any> {
    const body = { groupId: idConsignment };
    return this.fetchData(
      '/functions/emailReminderConsignmentGroup',
      REQUEST_TYPE.POST,
      null,
      body,
      null,
      null,
      null,
      true
    );
  }

  // ── Email ──
  static async getEmailTable(page: number = 1): Promise<any> {
    const limited = 100;
    const skip = limited * page - limited;
    const customQuery = `skip=${skip}&limit=${limited}&count=1`;
    return this.fetchData(
      '/classes/Email',
      REQUEST_TYPE.GET,
      null,
      null,
      null,
      null,
      customQuery
    );
  }

  static async updateEmailTable(objectId: string, content: any): Promise<any> {
    const body = { content };
    return this.fetchData(
      `/classes/Email/${objectId}`,
      REQUEST_TYPE.PUT,
      null,
      body,
      null,
      null,
      null,
      true
    );
  }

  // ── Setting extra ──
  static async updateSettingWithKeyAndValue(
    keyString: string = '',
    valueString: string = '',
    settingObject: any
  ): Promise<any> {
    const settingAPI = settingObject;
    const newSettingAPI = { ...settingAPI, [keyString]: valueString };
    const body = {
      Setting: newSettingAPI,
    };
    return this.fetchData(
      '/classes/Setting/meu8SzyuLd',
      REQUEST_TYPE.PUT,
      null,
      body,
      null,
      null,
      null,
      true
    );
  }

  static async deleteSettingWithKey(
    keyString: string = '',
    settingAPI: any
  ): Promise<any> {
    const newSettingAPI = { ...settingAPI };
    delete newSettingAPI[keyString];
    const body = { Setting: newSettingAPI };
    return this.fetchData(
      '/classes/Setting/meu8SzyuLd',
      REQUEST_TYPE.PUT,
      null,
      body,
      null,
      null,
      null,
      true
    );
  }

  // ── Custom API ──
  static async getUnitAddress(): Promise<any> {
    return this.fetchData(
      '/functions/administativeUnits',
      REQUEST_TYPE.POST,
      null,
      null
    );
  }

  static async pushOrderToGHTK(
    formData: OrderData,
    orderId: string
  ): Promise<any> {
    const formDataFee = {
      orderAdressProvince:
        formData.shippingInfo?.orderAdressProvince ||
        formData.shippingInfo?.province ||
        '',
      orderAdressDistrict:
        formData.shippingInfo?.orderAdressDistrict ||
        formData.shippingInfo?.district ||
        '',
      orderAdressWard:
        formData.shippingInfo?.orderAdressWard ||
        formData.shippingInfo?.ward ||
        '',
    };
    const resFee = await this.getFeeForTransport(formDataFee);

    let shippingFee: number;
    if (resFee?.result) {
      shippingFee = resFee.result;
    } else {
      showNotification('Không thể ước tính phí ship');
      return false;
    }

    const body: Record<string, any> = {
      service: 'giaohangtietkiem',
      action: 'CREATE_ORDER',
      data: {
        from: {
          province: ADDRESS_GET_ORDER_ARRAY[0],
          district: ADDRESS_GET_ORDER_ARRAY[1],
          address: '1 Phó Đức Chính',
          ward: ADDRESS_GET_ORDER_ARRAY[2],
          name: 'Giveaway Premium store',
          phone: '0703334443',
        },
        to: {
          email: formData.clientInfo.mail || formData.shippingInfo?.mail,
          province:
            formData.shippingInfo?.orderAdressProvince ||
            formData.shippingInfo?.province,
          district:
            formData.shippingInfo?.orderAdressDistrict ||
            formData.shippingInfo?.district,
          address:
            formData.shippingInfo?.orderAdressStreet ||
            formData.shippingInfo?.address,
          ward:
            formData.shippingInfo?.orderAdressWard ||
            formData.shippingInfo?.ward,
          name: formData.clientInfo.fullName || formData.shippingInfo?.name,
          phone:
            formData.clientInfo.phoneNumber || formData.shippingInfo?.phone,
        },
        orderId: orderId || formData.objectId,
        codMoney: 0,
        pick_option: 'cod',
        serviceLevel: 'road',
        value:
          Number(formData.totalMoneyForSale) * 1000 >= 2000000
            ? 2000000
            : Number(formData.totalMoneyForSale || 0) * 1000,
        items: [] as any[],
        orderRequest: {
          email: formData.clientInfo.mail || formData.shippingInfo?.mail,
          pick_money: Number(shippingFee),
          is_freeship: 1,
        },
      },
    };

    if (formData.productList && formData.productList.length > 0) {
      formData.productList.forEach((item: any) => {
        body.data.items.push({
          name: item.name,
          weight: 0.2,
          quantity: Number(item.numberOfProductForSale),
        });
      });
    }

    if (formData.shippingInfo?.optionTransfer === 'ht') {
      body.data.pick_option = 'cod';
      body.data.deliver_option = 'xteam';
      body.data.pick_session = 2;
    }

    return this.fetchData(
      '/functions/transporter',
      REQUEST_TYPE.POST,
      null,
      body
    );
  }

  // ============ NOTE CRUD ============

  static async getNotes(page: number = 1, limit: number = 100): Promise<any> {
    const limited = limit || 100;
    const skip = limited * page - limited;
    const customQuery = `order=-createdAt&skip=${skip}&limit=${limited}&count=1&where={"deletedAt":${null}}`;
    return this.fetchData(
      '/classes/Note',
      REQUEST_TYPE.GET,
      null,
      null,
      null,
      null,
      customQuery
    );
  }

  static async createNote(data: {
    title: string;
    content: string;
  }): Promise<any> {
    const body = {
      title: data.title,
      content: data.content,
    };
    return this.fetchData('/classes/Note', REQUEST_TYPE.POST, null, body);
  }

  static async updateNote(
    objectId: string,
    data: { title?: string; content?: string }
  ): Promise<any> {
    const body: Record<string, any> = {};
    if (data.title !== undefined) body.title = data.title;
    if (data.content !== undefined) body.content = data.content;
    return this.fetchData(
      `/classes/Note/${objectId}`,
      REQUEST_TYPE.PUT,
      null,
      body
    );
  }

  static async deleteNote(objectId: string): Promise<any> {
    try {
      const body = {
        deletedAt: { __type: 'Date', iso: moment().toISOString() },
      };
      return this.fetchData(
        `/classes/Note/${objectId}`,
        REQUEST_TYPE.PUT,
        null,
        body
      );
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  // Core Fetch Function
  static async fetchData(
    apiUrl: string,
    method: RequestMethod,
    queryBody: Record<string, any> | null,
    postData: Record<string, any> | null,
    hostLink?: string | null,
    authKey?: string | null,
    customQuery?: string | null,
    isUseAuthKey: boolean = false
  ): Promise<any> {
    try {
      const key = authKey || StoreServices.getUserData()?.sessionToken;
      const HOST = hostLink || process.env.NEXT_PUBLIC_SERVER_URL || '';

      let header: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': process.env.NEXT_PUBLIC_APP_ID || '',
        'X-Parse-REST-API-Key': process.env.NEXT_PUBLIC_REST_API_KEY || '',
      };

      if (isUseAuthKey && key) {
        header['X-Parse-Session-Token'] = key;
        header['X-Parse-Master-Key'] = process.env.NEXT_PUBLIC_MASTER_KEY || '';
      }

      const params: RequestInit = {
        method: method || REQUEST_TYPE.GET,
        headers: header,
      };

      if (postData) {
        params.body = JSON.stringify(postData);
      }

      let queryStr = '';
      if (queryBody) {
        queryStr =
          '?' +
          new URLSearchParams(queryBody as Record<string, string>).toString();
      }

      if (customQuery) {
        queryStr = `?${encodeURI(customQuery)}`;
      }

      const response = await fetch(HOST + apiUrl + queryStr, params);
      const responJson = await response.json();
      return responJson || response;
    } catch (error) {
      console.error('API Error:', error);
      return null;
    }
  }
}

export default GapService;
