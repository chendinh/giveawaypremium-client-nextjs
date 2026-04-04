// API route to create Viettel Post shipping order
import { NextRequest, NextResponse } from 'next/server';
import { getViettelPostService } from '@/services/shipping/viettel-post/ViettelPostService';
import { ViettelPostCreateOrderRequest } from '@/services/shipping/viettel-post/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      orderNumber,
      sender,
      receiver,
      product,
      payment,
      service,
      moneyCollection,
      note,
    } = body;

    // Validate required fields
    if (!orderNumber || !sender || !receiver || !product) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const viettelPostService = getViettelPostService();

    // Build create order request
    const createOrderRequest: ViettelPostCreateOrderRequest = {
      ORDER_NUMBER: orderNumber,

      // Sender information
      SENDER_FULLNAME: sender.name,
      SENDER_ADDRESS: sender.address,
      SENDER_PHONE: sender.phone,
      SENDER_EMAIL: sender.email,
      SENDER_WARD: sender.wardId,
      SENDER_DISTRICT: sender.districtId,
      SENDER_PROVINCE: sender.provinceId,

      // Receiver information
      RECEIVER_FULLNAME: receiver.name,
      RECEIVER_ADDRESS: receiver.address,
      RECEIVER_PHONE: receiver.phone,
      RECEIVER_EMAIL: receiver.email,
      RECEIVER_WARD: receiver.wardId,
      RECEIVER_DISTRICT: receiver.districtId,
      RECEIVER_PROVINCE: receiver.provinceId,

      // Product information
      PRODUCT_NAME: product.name,
      PRODUCT_DESCRIPTION: product.description,
      PRODUCT_QUANTITY: product.quantity || 1,
      PRODUCT_PRICE: product.price,
      PRODUCT_WEIGHT: product.weight,
      PRODUCT_TYPE: 'HH', // Hàng hóa

      // Order configuration
      ORDER_PAYMENT: payment?.type || 1, // 1: Người gửi trả
      ORDER_SERVICE: service?.type || 'VCN', // VCN: Viettel Chuyển Nhanh
      ORDER_NOTE: note,
      MONEY_COLLECTION: moneyCollection || 0,

      // List items if provided
      LIST_ITEM: product.items || undefined,
    };

    const response = await viettelPostService.createOrder(createOrderRequest);

    if (response.error || response.status !== 200) {
      return NextResponse.json(
        { error: response.message || 'Failed to create order' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      orderNumber: response.data?.ORDER_NUMBER,
      totalFee: response.data?.MONEY_TOTAL_FEE,
      totalAmount: response.data?.MONEY_TOTAL,
      exchangeWeight: response.data?.EXCHANGE_WEIGHT,
      status: response.data?.STATUS,
      data: response.data,
    });
  } catch (error: any) {
    console.error('Viettel Post create order error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
