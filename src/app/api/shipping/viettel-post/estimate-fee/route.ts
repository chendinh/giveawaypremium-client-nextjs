// API route to estimate shipping fee with Viettel Post
import { NextRequest, NextResponse } from 'next/server';
import { getViettelPostService } from '@/services/shipping/viettel-post/ViettelPostService';
import { ViettelPostPriceRequest } from '@/services/shipping/viettel-post/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      senderProvinceId,
      senderDistrictId,
      receiverProvinceId,
      receiverDistrictId,
      weight,
      value,
      moneyCollection,
    } = body;

    // Validate required fields
    if (
      !senderProvinceId ||
      !senderDistrictId ||
      !receiverProvinceId ||
      !receiverDistrictId ||
      !weight
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const viettelPostService = getViettelPostService();

    const priceRequest: ViettelPostPriceRequest = {
      SENDER_PROVINCE: senderProvinceId,
      SENDER_DISTRICT: senderDistrictId,
      RECEIVER_PROVINCE: receiverProvinceId,
      RECEIVER_DISTRICT: receiverDistrictId,
      PRODUCT_TYPE: 'HH', // Hàng hóa
      PRODUCT_WEIGHT: weight,
      PRODUCT_PRICE: value || 0,
      MONEY_COLLECTION: moneyCollection || 0,
      TYPE: 1, // Gửi tận nơi - Nhận tận nơi
    };

    const response = await viettelPostService.estimatePrice(priceRequest);

    if (response.error || response.status !== 200) {
      return NextResponse.json(
        { error: response.message || 'Failed to estimate price' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      fee: response.data?.MONEY_TOTAL || 0,
      feeDetails: response.data,
    });
  } catch (error: any) {
    console.error('Viettel Post estimate fee error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
