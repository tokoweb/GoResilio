import { NextRequest, NextResponse } from 'next/server';
import { AuthGuard } from '../../../../infrastructure/auth/authGuard';
import { MySQLUserRepository } from '../../../../infrastructure/database/repositories/MySQLUserRepository';

export async function GET(req: NextRequest) {
  const authResult = await AuthGuard.requireRole(req, ['Super Admin (RDI)']);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const users = await MySQLUserRepository.getAll();
    return NextResponse.json({ success: true, count: users.length, data: users });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memuat data pelanggan' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const authResult = await AuthGuard.requireRole(req, ['Super Admin (RDI)']);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await req.json();
    const newUser = await MySQLUserRepository.create(body);
    return NextResponse.json({ success: true, data: newUser, message: 'Pelanggan berhasil ditambahkan ke database MySQL.' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menambahkan pelanggan' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const authResult = await AuthGuard.requireRole(req, ['Super Admin (RDI)']);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }
    const updated = await MySQLUserRepository.update(id, data);
    return NextResponse.json({ success: updated, message: 'Data pelanggan berhasil diperbarui.' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memperbarui data pelanggan' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const authResult = await AuthGuard.requireRole(req, ['Super Admin (RDI)']);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }
    const deleted = await MySQLUserRepository.delete(id);
    return NextResponse.json({ success: deleted, message: 'Akun pelanggan berhasil dihapus dari database MySQL.' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menghapus akun pelanggan' },
      { status: 500 }
    );
  }
}
