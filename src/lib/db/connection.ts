import mysql from 'mysql2/promise';

/**
 * MySQL Connection Pool Configuration
 * Benchmark: High-Throughput Node.js Connection Pool
 */
const poolConfig: mysql.PoolOptions = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gotangguh_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

// Global pool instance
let pool: mysql.Pool | null = null;

export const getDbPool = (): mysql.Pool => {
  if (!pool) {
    pool = mysql.createPool(poolConfig);
  }
  return pool;
};

export interface DatabaseHealthStatus {
  isConnected: boolean;
  database: string;
  host: string;
  port: number;
  message: string;
  timestamp: string;
}

/**
 * Test MySQL connection health
 */
export const checkDbHealth = async (): Promise<DatabaseHealthStatus> => {
  const currentPool = getDbPool();
  try {
    const connection = await currentPool.getConnection();
    await connection.ping();
    connection.release();

    return {
      isConnected: true,
      database: poolConfig.database as string,
      host: poolConfig.host as string,
      port: poolConfig.port as number,
      message: 'Koneksi database MySQL aktif & terhubung secara normal (Port 3306).',
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    return {
      isConnected: false,
      database: poolConfig.database as string,
      host: poolConfig.host as string,
      port: poolConfig.port as number,
      message: `MySQL offline (${error.message || 'Connection refused'}). Beroperasi dalam mode resilient fallback.`,
      timestamp: new Date().toISOString()
    };
  }
};
