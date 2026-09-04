import { NextRequest, NextResponse } from 'next/server';
import { AuthGuard } from '../../../../infrastructure/auth/authGuard';
import { MySQLCollateralRepository } from '../../../../infrastructure/database/repositories/MySQLCollateralRepository';

export async function GET(req: NextRequest) {
  const authResult = await AuthGuard.requireRole(req, ['Lender / Bank', 'Super Admin (RDI)']);
  if (authResult instanceof NextResponse) return authResult;

  const collaterals = await MySQLCollateralRepository.getAll();
  return NextResponse.json({ success: true, count: collaterals.length, data: collaterals });
}
