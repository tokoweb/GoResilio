import { NextResponse } from 'next/server';
import { checkDbHealth } from '../../../infrastructure/database/connection/mysql.connection';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  const dbStatus = await checkDbHealth();
  const latencyMs = Date.now() - startTime;

  const mem = process.memoryUsage();
  const isHealthy = dbStatus.isConnected;

  const responsePayload = {
    status: isHealthy ? 'healthy' : 'degraded',
    service: 'gotangguh-spatial-engine',
    version: process.env.npm_package_version || '2.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    database: {
      connected: dbStatus.isConnected,
      host: dbStatus.host,
      database: dbStatus.database,
      latencyMs,
      message: dbStatus.message
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      memory: {
        rssMb: Math.round(mem.rss / 1024 / 1024),
        heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024)
      }
    }
  };

  return NextResponse.json(responsePayload, {
    status: isHealthy ? 200 : 503
  });
}
