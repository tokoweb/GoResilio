import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '../../../../lib/services/PaymentService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await PaymentService.createCheckout(body);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Checkout error' },
      { status: 500 }
    );
  }
}
