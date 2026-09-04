import { NextRequest, NextResponse } from 'next/server';
import { AuthGuard } from '../../../../infrastructure/auth/authGuard';
import { MySQLSystemFeedRepository } from '../../../../infrastructure/database/repositories/MySQLSystemFeedRepository';
import { MySQLBookingRepository } from '../../../../infrastructure/database/repositories/MySQLBookingRepository';
import { MySQLUserRepository } from '../../../../infrastructure/database/repositories/MySQLUserRepository';
import { checkDbHealth } from '../../../../infrastructure/database/connection/mysql.connection';

export async function GET(req: NextRequest) {
  // 1. Enforce Super Admin authorization
  const authResult = await AuthGuard.requireRole(req, ['Super Admin (RDI)']);
  if (authResult instanceof NextResponse) {
    return authResult; // 401 or 403
  }

  try {
    const [users, bookings, feeds, dbStatus] = await Promise.all([
      MySQLUserRepository.getAll(),
      MySQLBookingRepository.getAll(),
      MySQLSystemFeedRepository.getAll(),
      checkDbHealth()
    ]);

    const tier1FreeCount = users.filter((u) => !u.tierLevel || u.tierLevel.includes('FREE') || u.tierLevel.includes('Gratis') || u.tierLevel.includes('Tier 1')).length;
    const tier2InstantCount = users.filter((u) => u.tierLevel && u.tierLevel.includes('Instant')).length;
    const tier3BundleCount = users.filter((u) => u.tierLevel && u.tierLevel.includes('Bundling')).length;
    const tier4ConsultationCount = bookings.length;

    const totalVolumeNumber = (tier2InstantCount * 35000) + (tier3BundleCount * 85000) + (tier4ConsultationCount * 1500000);

    return NextResponse.json({
      success: true,
      data: {
        dbStatus,
        totalUsers: users.length,
        totalBookings: bookings.length,
        tierRevenue: {
          tier1FreeCount,
          tier2InstantCount,
          tier3BundleCount,
          tier4ConsultationCount,
          totalEstimatedVolumeIdr: `Rp ${totalVolumeNumber.toLocaleString('id-ID')}`
        },
        feeds,
        bookings
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memuat overview admin.' },
      { status: 500 }
    );
  }
}
