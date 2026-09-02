import { NextResponse } from 'next/server';
import { MySQLCollateralRepository } from '../../../../infrastructure/database/repositories/MySQLCollateralRepository';

export async function GET() {
  const collaterals = await MySQLCollateralRepository.getAll();
  return NextResponse.json({ success: true, count: collaterals.length, data: collaterals });
}
