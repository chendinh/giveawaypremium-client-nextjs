// API route to get Viettel Post order tracking/status
import { NextRequest, NextResponse } from 'next/server';
import { getViettelPostService } from '@/services/shipping/viettel-post/ViettelPostService';
import { VIETTEL_POST_CONSTANTS } from '@/services/shipping/viettel-post/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderNumber, type, dateFrom, dateTo, provinceId } = body;

    const viettelPostService = getViettelPostService();

    const response = await viettelPostService.getOrderStatus({
      ORDER_NUMBER: orderNumber,
      TYPE: type || VIETTEL_POST_CONSTANTS.TRACKING_TYPE.ALL,
      DATE_FROM: dateFrom,
      DATE_TO: dateTo,
      PROVINCE_ID: provinceId,
    });

    if (response.error || response.status !== 200) {
      return NextResponse.json(
        { error: response.message || 'Failed to get order status' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      orders: response.data || [],
      message: 'Order status retrieved successfully',
    });
  } catch (error: any) {
    console.error('Viettel Post get tracking error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
