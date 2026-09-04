import { NextRequest, NextResponse } from 'next/server';
import { MySQLPropertyRepository } from '../../../infrastructure/database/repositories/MySQLPropertyRepository';
import { AuthGuard } from '../../../infrastructure/auth/authGuard';
import { RateLimiter } from '../../../infrastructure/security/rateLimiter';
import { InputValidator } from '../../../infrastructure/security/inputValidator';

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate user
    const authResult = await AuthGuard.requireAuth(req);
    if (authResult instanceof NextResponse) {
      return authResult; // 401 Unauthorized
    }

    const { user } = authResult;
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('userId');
    const targetEmail = searchParams.get('email');

    let properties = [];

    // 2. Ownership-aware filtering:
    // Only Super Admin can view all properties or another user's properties
    if (user.role === 'Super Admin (RDI)') {
      if (targetEmail) {
        properties = await MySQLPropertyRepository.getByUserEmail(targetEmail);
      } else if (targetUserId) {
        properties = await MySQLPropertyRepository.getByUserId(targetUserId);
      } else {
        properties = await MySQLPropertyRepository.getAll();
      }
    } else {
      // Normal user only gets their own properties
      properties = await MySQLPropertyRepository.getByUserId(user.userId);
      if (properties.length === 0 && user.email) {
        properties = await MySQLPropertyRepository.getByUserEmail(user.email);
      }
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
  const rateLimitRes = RateLimiter.enforce(req, 'property_save', 30, 60000);
  if (rateLimitRes) return rateLimitRes;

  try {
    // 1. Authenticate user
    const authResult = await AuthGuard.requireAuth(req);
    if (authResult instanceof NextResponse) {
      return authResult; // 401 Unauthorized
    }

    const { user } = authResult;
    const body = await req.json();

    // 2. Validate payload
    const propertyName = InputValidator.validateString(body.propertyName, 'nama properti', 2, 180);
    const address = InputValidator.validateString(body.address, 'alamat', 2, 500);
    const { latitude, longitude } = InputValidator.validateCoordinates(body.latitude, body.longitude);

    // 3. Force ownership to authenticated user
    const savedData = {
      ...body,
      propertyName,
      address,
      latitude,
      longitude,
      userId: user.userId,
      userEmail: user.email
    };

    const id = await MySQLPropertyRepository.save(savedData);
    return NextResponse.json({ success: true, id, message: 'Properti berhasil disimpan ke portofolio akun.' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menyimpan properti' },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // 1. Authenticate user
    const authResult = await AuthGuard.requireAuth(req);
    if (authResult instanceof NextResponse) {
      return authResult; // 401 Unauthorized
    }

    const { user } = authResult;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ success: false, error: 'Property ID is required' }, { status: 400 });
    }

    // 2. Fetch property to verify ownership
    const existing = await MySQLPropertyRepository.getById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Properti tidak ditemukan' }, { status: 404 });
    }

    if (user.role !== 'Super Admin (RDI)' && existing.userId !== user.userId) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak: Anda tidak memiliki izin menghapus properti milik akun lain.' },
        { status: 403 }
      );
    }

    const deleted = await MySQLPropertyRepository.delete(id);
    return NextResponse.json({ success: deleted, message: 'Properti berhasil dihapus dari database.' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menghapus properti' },
      { status: 500 }
    );
  }
}
