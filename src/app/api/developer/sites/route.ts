import { NextResponse } from 'next/server';
import { MySQLDeveloperSiteRepository } from '../../../../infrastructure/database/repositories/MySQLDeveloperSiteRepository';

export async function GET() {
  const sites = await MySQLDeveloperSiteRepository.getAll();
  return NextResponse.json({ success: true, count: sites.length, data: sites });
}
