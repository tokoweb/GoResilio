import { NextResponse } from 'next/server';
import { MySQLSystemFeedRepository } from '../../../../infrastructure/database/repositories/MySQLSystemFeedRepository';
import { MySQLBookingRepository } from '../../../../infrastructure/database/repositories/MySQLBookingRepository';
import { MySQLUserRepository } from '../../../../infrastructure/database/repositories/MySQLUserRepository';
import { checkDbHealth } from '../../../../infrastructure/database/connection/mysql.connection';

export async function GET() {
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
}

