// API route to cancel Viettel Post order
import { NextRequest, NextResponse } from 'next/server';
import { getViettelPostService } from '@/services/shipping/viettel-post/ViettelPostService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderNumber, type } = body;

    // Validate required fields
    if (!orderNumber) {
      return NextResponse.json(
        { error: 'Order number is required' },
        { status: 400 }
      );
    }

    const viettelPostService = getViettelPostService();

    // Type: 2 = Cancel sent order, 3 = Cancel draft order
    const response = await viettelPostService.cancelOrder(
      orderNumber,
      type || 2
    );

    if (response.error || response.status !== 200) {
      return NextResponse.json(
        { error: response.message || 'Failed to cancel order' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully',
      data: response.data,
    });
  } catch (error: any) {
    console.error('Viettel Post cancel order error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
