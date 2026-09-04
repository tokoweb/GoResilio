import { NextRequest, NextResponse } from 'next/server';
import { AuthGuard } from '../../../../infrastructure/auth/authGuard';
import { MySQLDeveloperSiteRepository } from '../../../../infrastructure/database/repositories/MySQLDeveloperSiteRepository';

export async function GET(req: NextRequest) {
  const authResult = await AuthGuard.requireRole(req, ['Property Developer', 'Super Admin (RDI)']);
  if (authResult instanceof NextResponse) return authResult;

  const sites = await MySQLDeveloperSiteRepository.getAll();
  return NextResponse.json({ success: true, count: sites.length, data: sites });
}
