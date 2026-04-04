// Shared shipping service types and interfaces

export interface ShippingAddress {
  province: string;
  district: string;
  ward: string;
  address: string;
  name: string;
  phone: string;
  email?: string;
}

export interface ShippingItem {
  name: string;
  weight: number;
  quantity: number;
  value?: number;
}

export interface ShippingOrderData {
  from: ShippingAddress;
  to: ShippingAddress;
  items: ShippingItem[];
  orderId: string;
  codMoney?: number;
  totalValue: number;
  note?: string;
}

export interface ShippingFeeEstimate {
  fee: number;
  provider: 'ghtk' | 'viettel-post';
  serviceType?: string;
}

export interface ShippingOrderResult {
  success: boolean;
  orderId?: string;
  labelId?: string;
  partnerId?: string;
  trackingNumber?: string;
  status?: string;
  message?: string;
  estimatedDeliveryTime?: string;
  shippingFee?: number;
  error?: string;
}

export interface ShippingLabelOptions {
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'A6' | 'A5' | 'A4';
}

export interface ShippingTrackingInfo {
  status: string;
  statusText: string;
  customerName?: string;
  customerPhone?: string;
  address?: string;
  deliveryDate?: string;
  pickupDate?: string;
  shippingFee?: number;
}

export enum ShippingProvider {
  GHTK = 'ghtk',
  VIETTEL_POST = 'viettel-post',
}

export enum ShippingStatus {
  PENDING = 'PENDING',
  WAITING_PICK_UP = 'WAITING_PICK_UP',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERING = 'DELIVERING',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  RETURNING = 'RETURNING',
  RETURNED = 'RETURNED',
  CANCELLED = 'CANCELLED',
}
