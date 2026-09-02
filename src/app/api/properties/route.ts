import { NextRequest, NextResponse } from 'next/server';
import { MySQLPropertyRepository } from '../../../infrastructure/database/repositories/MySQLPropertyRepository';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');

    let properties = [];
    if (email) {
      properties = await MySQLPropertyRepository.getByUserEmail(email);
    } else if (userId) {
      properties = await MySQLPropertyRepository.getByUserId(userId);
    } else {
      properties = await MySQLPropertyRepository.getAll();
    }

    return NextResponse.json({ success: true, count: properties.length, data: properties });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memuat properti' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = await MySQLPropertyRepository.save(body);
    return NextResponse.json({ success: true, id, message: 'Properti berhasil disimpan ke database MySQL.' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menyimpan properti' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Property ID is required' }, { status: 400 });
    }
    const deleted = await MySQLPropertyRepository.delete(id);
    return NextResponse.json({ success: deleted, message: 'Properti berhasil dihapus dari database MySQL.' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menghapus properti' },
      { status: 500 }
    );
  }
}
