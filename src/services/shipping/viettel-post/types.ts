// Viettel Post specific types and interfaces
// Based on Viettel Post API documentation

export interface ViettelPostAddress {
  PROVINCE?: string;
  DISTRICT?: string;
  WARDS?: string;
  STREET?: string;
  CUSTOMER_NAME?: string;
  CUSTOMER_PHONE?: string;
  EMAIL?: string;
}

export interface ViettelPostProduct {
  PRODUCT_NAME: string;
  PRODUCT_PRICE: number;
  PRODUCT_WEIGHT: number;
  PRODUCT_QUANTITY: number;
}

export interface ViettelPostPriceRequest {
  SENDER_PROVINCE: number;
  SENDER_DISTRICT: number;
  RECEIVER_PROVINCE: number;
  RECEIVER_DISTRICT: number;
  PRODUCT_TYPE: string; // 'HH' for goods
  PRODUCT_WEIGHT: number;
  PRODUCT_PRICE: number;
  MONEY_COLLECTION?: number;
  TYPE: number; // 1: Gửi tận nơi - Nhận tận nơi
}

export interface ViettelPostPriceResponse {
  status: number;
  error: boolean;
  message?: string;
  data?: {
    MONEY_TOTAL: number;
    MONEY_TOTAL_FEE: number;
    MONEY_FEE: number;
    MONEY_COLLECTION_FEE: number;
    MONEY_OTHER_FEE: number;
    MONEY_VAS: number;
    MONEY_VAT: number;
    KPI_HT: number;
  };
}

export interface ViettelPostCreateOrderRequest {
  ORDER_NUMBER: string; // Mã đơn hàng của shop
  GROUPADDRESS_ID?: number;
  CUS_ID?: number;
  DELIVERY_DATE?: string;
  SENDER_FULLNAME: string;
  SENDER_ADDRESS: string;
  SENDER_PHONE: string;
  SENDER_EMAIL?: string;
  SENDER_WARD?: number;
  SENDER_DISTRICT?: number;
  SENDER_PROVINCE?: number;
  RECEIVER_FULLNAME: string;
  RECEIVER_ADDRESS: string;
  RECEIVER_PHONE: string;
  RECEIVER_EMAIL?: string;
  RECEIVER_WARD?: number;
  RECEIVER_DISTRICT?: number;
  RECEIVER_PROVINCE?: number;
  PRODUCT_NAME: string;
  PRODUCT_DESCRIPTION?: string;
  PRODUCT_QUANTITY: number;
  PRODUCT_PRICE: number;
  PRODUCT_WEIGHT: number;
  PRODUCT_TYPE: string; // 'HH' - Hàng hóa
  ORDER_PAYMENT: number; // 1: Người gửi trả, 2: Người nhận trả, 3: Cả hai trả
  ORDER_SERVICE: string; // 'VCN' - Viettel Chuyển Nhanh
  ORDER_SERVICE_ADD?: string;
  ORDER_VOUCHER?: string;
  ORDER_NOTE?: string;
  MONEY_COLLECTION?: number; // Tiền thu hộ COD
  MONEY_TOTALFEE?: number;
  MONEY_FEECOD?: number;
  MONEY_FEEVAS?: number;
  MONEY_FEEINSURRANCE?: number;
  MONEY_FEE?: number;
  MONEY_FEEOTHER?: number;
  MONEY_TOTALVAT?: number;
  MONEY_TOTAL?: number;
  LIST_ITEM?: ViettelPostProduct[];
}

export interface ViettelPostCreateOrderResponse {
  status: number;
  error: boolean;
  message?: string;
  data?: {
    ORDER_NUMBER: string;
    MONEY_TOTAL: number;
    MONEY_TOTAL_FEE: number;
    EXCHANGE_WEIGHT: number;
    STATUS: number;
  };
}

export interface ViettelPostCancelOrderRequest {
  ORDER_NUMBER: string;
  TYPE: number; // 2: Hủy đơn hàng đã gửi, 3: Hủy đơn hàng nháp
}

export interface ViettelPostCancelOrderResponse {
  status: number;
  error: boolean;
  message?: string;
  data?: any;
}

export interface ViettelPostOrderStatusRequest {
  ORDER_NUMBER?: string;
  TYPE: number; // 1: Tất cả, 2: Đang vận chuyển, 3: Đã giao hàng
  DATE_FROM?: string;
  DATE_TO?: string;
  PROVINCE_ID?: number;
}

export interface ViettelPostOrderStatusResponse {
  status: number;
  error: boolean;
  message?: string;
  data?: {
    ORDER_NUMBER: string;
    PRODUCT_NAME: string;
    RECEIVER_FULLNAME: string;
    RECEIVER_PHONE: string;
    RECEIVER_ADDRESS: string;
    ORDER_STATUS: number;
    ORDER_STATUS_NAME: string;
    MONEY_COLLECTION: number;
    MONEY_TOTAL: number;
    CREATE_DATE: string;
    UPDATE_DATE: string;
  }[];
}

export interface ViettelPostPrintRequest {
  TYPE: number; // 1: In đơn hàng, 2: In tem
  ORDER_ARRAY: string[]; // Array of ORDER_NUMBER
  PARTNER_ID?: string;
}

export interface ViettelPostPrintResponse {
  status: number;
  error: boolean;
  message?: string;
  data?: string; // Base64 PDF content
}

// Viettel Post Constants
export const VIETTEL_POST_CONSTANTS = {
  PRODUCT_TYPE: {
    GOODS: 'HH', // Hàng hóa
    DOCUMENT: 'TT', // Tài liệu
  },
  ORDER_PAYMENT: {
    SENDER_PAY: 1, // Người gửi trả
    RECEIVER_PAY: 2, // Người nhận trả
    BOTH_PAY: 3, // Cả hai trả
  },
  ORDER_SERVICE: {
    VCN: 'VCN', // Viettel Chuyển Nhanh
    VTK: 'VTK', // Viettel Tiết Kiệm
  },
  ORDER_STATUS: {
    DRAFT: -1, // Đơn nháp
    PENDING: 100, // Mới tạo
    PICKED_UP: 103, // Đã lấy hàng
    IN_WAREHOUSE: 104, // Nhập kho
    DELIVERING: 201, // Đang giao hàng
    DELIVERED: 500, // Đã giao hàng thành công
    RETURNING: 503, // Đang hoàn
    RETURNED: 504, // Đã hoàn
    CANCELLED: 508, // Đã hủy
    FAILED: 515, // Giao hàng thất bại
  },
  PRINT_TYPE: {
    ORDER: 1, // In đơn hàng
    LABEL: 2, // In tem
  },
  TRACKING_TYPE: {
    ALL: 1,
    IN_TRANSIT: 2,
    DELIVERED: 3,
  },
};

export const VIETTEL_POST_STATUS_TRANSLATIONS: Record<number, string> = {
  [-1]: 'Đơn nháp',
  [100]: 'Đơn hàng mới tạo',
  [101]: 'Đã tiếp nhận',
  [102]: 'Đang điều phối',
  [103]: 'Đã lấy hàng',
  [104]: 'Đã nhập kho',
  [105]: 'Đang luân chuyển',
  [200]: 'Đang phát',
  [201]: 'Đang giao hàng',
  [202]: 'Giao hàng lần 1 không thành công',
  [203]: 'Giao hàng lần 2 không thành công',
  [300]: 'Đã ký nhận',
  [500]: 'Đã giao hàng thành công',
  [501]: 'Đang chuyển hoàn',
  [502]: 'Đang chuyển hoàn (COD)',
  [503]: 'Đang hoàn',
  [504]: 'Đã hoàn',
  [505]: 'Hủy chuyển hoàn',
  [508]: 'Hủy đơn hàng',
  [509]: 'Chờ xác nhận giao lại',
  [510]: 'Đơn hàng tồn',
  [515]: 'Đơn hàng gặp sự cố',
};
