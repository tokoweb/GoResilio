import { NextResponse } from 'next/server';
import { checkDbHealth } from '../../../infrastructure/database/connection/mysql.connection';

export async function GET() {
  const status = await checkDbHealth();
  return NextResponse.json(status);
}
