// API route to get Viettel Post shipping label
import { NextRequest, NextResponse } from 'next/server';
import { getViettelPostService } from '@/services/shipping/viettel-post/ViettelPostService';
import { VIETTEL_POST_CONSTANTS } from '@/services/shipping/viettel-post/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderNumbers, type } = body;

    // Validate required fields
    if (!orderNumbers || !Array.isArray(orderNumbers) || orderNumbers.length === 0) {
      return NextResponse.json(
        { error: 'Order numbers array is required' },
        { status: 400 }
      );
    }

    const viettelPostService = getViettelPostService();

    // Type: 1 = Print order, 2 = Print label
    const printType = type || VIETTEL_POST_CONSTANTS.PRINT_TYPE.LABEL;

    const response = await viettelPostService.getShippingLabel(
      orderNumbers,
      printType
    );

    if (response.error || response.status !== 200) {
      return NextResponse.json(
        { error: response.message || 'Failed to get shipping label' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      pdfBase64: response.data,
      message: 'Label retrieved successfully',
    });
  } catch (error: any) {
    console.error('Viettel Post get label error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
