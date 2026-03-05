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
  static uploadSingleFileWithFormData = async (file: File): Promise<any> => {
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
      const key = authKey || getAuthToken();
      const HOST = hostLink || process.env.NEXT_PUBLIC_SERVER_URL || '';

      let header: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': process.env.NEXT_PUBLIC_APP_ID || '',
        'X-Parse-REST-API-Key': process.env.NEXT_PUBLIC_REST_API_KEY || '',
      };

      if (isUseAuthKey && key) {
        header['X-Parse-Session-Token'] = key;
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
