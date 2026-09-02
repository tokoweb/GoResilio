import { NextRequest, NextResponse } from 'next/server';
import { MySQLPropertyRepository } from '../../../infrastructure/database/repositories/MySQLPropertyRepository';

export async function GET(req: NextRequest) {
  try {
    const properties = await MySQLPropertyRepository.getAll();
    return NextResponse.json({
      success: true,
      count: properties.length,
      data: properties
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memuat daftar portofolio properti' },
      { status: 500 }
    );
  }
}
