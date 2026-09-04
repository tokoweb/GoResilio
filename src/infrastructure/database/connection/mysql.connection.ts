import mysql from 'mysql2/promise';

/**
 * MySQL Connection Pool Configuration
 * Utilizes environment variables from .env.local with safe defaults
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

// Global pool instance (cached across serverless invocations)
let pool: mysql.Pool | null = null;
let tablesInitialized = false;

export const ensureTablesExist = async (p: mysql.Pool) => {
  if (tablesInitialized) return;
  try {
    // 1. Users Table
    await p.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(191) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(150) NOT NULL,
        role ENUM('Home Buyer', 'Property Developer', 'Lender / Bank', 'Consultant / Auditor', 'Super Admin (RDI)') NOT NULL DEFAULT 'Home Buyer',
        organization VARCHAR(150) NULL,
        phone_number VARCHAR(30) NULL,
        tier_level VARCHAR(50) NOT NULL DEFAULT 'Tier 2 Pro & B2B Suite',
        is_verified BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_users_role (role),
        INDEX idx_users_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Saved Properties Table
    await p.query(`
      CREATE TABLE IF NOT EXISTS saved_properties (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        ref_number VARCHAR(64) NOT NULL,
        property_name VARCHAR(180) NOT NULL,
        address TEXT NOT NULL,
        property_type VARCHAR(80) NOT NULL DEFAULT 'Residential (Rumah Tapak)',
        latitude DECIMAL(10, 7) NOT NULL,
        longitude DECIMAL(10, 7) NOT NULL,
        overall_score INT NOT NULL DEFAULT 50,
        risk_level ENUM('low', 'medium', 'high', 'extreme') NOT NULL DEFAULT 'medium',
        flood_score INT NOT NULL DEFAULT 30,
        quake_score INT NOT NULL DEFAULT 40,
        heat_score INT NOT NULL DEFAULT 35,
        elevation_meters DECIMAL(6, 2) NOT NULL DEFAULT 15.0,
        fault_distance_km DECIMAL(6, 2) NOT NULL DEFAULT 12.5,
        last_updated_str VARCHAR(80) NOT NULL DEFAULT '24 Agustus 2026',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_prop_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. Consultation Bookings Table
    await p.query(`
      CREATE TABLE IF NOT EXISTS consultation_bookings (
        id VARCHAR(64) PRIMARY KEY,
        voucher_code VARCHAR(64) NOT NULL UNIQUE,
        client_name VARCHAR(150) NOT NULL,
        client_email VARCHAR(191) NOT NULL,
        client_phone VARCHAR(30) NOT NULL,
        target_location VARCHAR(255) NOT NULL,
        package_type VARCHAR(120) NOT NULL,
        assigned_expert VARCHAR(150) NOT NULL DEFAULT 'Tim Peneliti RDI & BGP',
        scheduled_date VARCHAR(120) NOT NULL,
        status ENUM('MENUNGGU DISPATCH', 'DIKONFIRMASI', 'SURVEI BERJALAN', 'SELESAI') NOT NULL DEFAULT 'MENUNGGU DISPATCH',
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. Developer Landbanks Table
    await p.query(`
      CREATE TABLE IF NOT EXISTS developer_landbanks (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        project_name VARCHAR(180) NOT NULL,
        location_desc VARCHAR(255) NOT NULL,
        land_area_ha DECIMAL(8, 2) NOT NULL DEFAULT 10.0,
        dominant_hazard VARCHAR(255) NOT NULL,
        status_text VARCHAR(255) NOT NULL,
        kdb_rating VARCHAR(80) NOT NULL DEFAULT 'KDB 50% / KLB 2.4',
        kdh_pct INT NOT NULL DEFAULT 30,
        compliance_status VARCHAR(50) NOT NULL DEFAULT 'VERIFIED',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. Collateral Underwritings Table
    await p.query(`
      CREATE TABLE IF NOT EXISTS collateral_underwritings (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        debtor_name VARCHAR(150) NOT NULL,
        collateral_ref VARCHAR(80) NOT NULL UNIQUE,
        property_location VARCHAR(255) NOT NULL,
        loan_amount_str VARCHAR(80) NOT NULL,
        composite_score INT NOT NULL DEFAULT 50,
        risk_level_desc VARCHAR(120) NOT NULL,
        ltv_policy VARCHAR(180) NOT NULL,
        esg_category VARCHAR(120) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 6. Payment Transactions Table (Midtrans Snap & Sandbox Simulator)
    await p.query(`
      CREATE TABLE IF NOT EXISTS payment_transactions (
        id VARCHAR(64) PRIMARY KEY,
        order_id VARCHAR(100) NOT NULL UNIQUE,
        user_email VARCHAR(191) NOT NULL,
        user_id VARCHAR(64) NULL,
        plan_name VARCHAR(150) NOT NULL,
        tier_level VARCHAR(80) NOT NULL DEFAULT 'Tier 2 Pro (Rp 45rb)',
        amount DECIMAL(12, 2) NOT NULL DEFAULT 45000.00,
        payment_type VARCHAR(50) NOT NULL DEFAULT 'midtrans_snap',
        transaction_status ENUM('pending', 'settlement', 'capture', 'deny', 'cancel', 'expire', 'refund') NOT NULL DEFAULT 'pending',
        snap_token VARCHAR(255) NULL,
        snap_redirect_url TEXT NULL,
        va_number VARCHAR(64) NULL,
        bank VARCHAR(30) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_tx_order (order_id),
        INDEX idx_tx_email (user_email),
        INDEX idx_tx_status (transaction_status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 7. System Configs Table (Dynamic Risk Weights, Thresholds, & API Keys)
    await p.query(`
      CREATE TABLE IF NOT EXISTS system_configs (
        config_key VARCHAR(100) PRIMARY KEY,
        config_value JSON NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 8. User Reports Table (Persistent Official Report Dossiers)
    await p.query(`
      CREATE TABLE IF NOT EXISTS user_reports (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        user_email VARCHAR(191) NULL,
        ref_number VARCHAR(64) NOT NULL UNIQUE,
        property_name VARCHAR(180) NOT NULL,
        address TEXT NOT NULL,
        latitude DECIMAL(10, 7) NOT NULL,
        longitude DECIMAL(10, 7) NOT NULL,
        overall_score INT NOT NULL DEFAULT 50,
        overall_level VARCHAR(30) NOT NULL DEFAULT 'medium',
        package_type VARCHAR(120) NOT NULL DEFAULT 'Instant (1 Properti)',
        report_data JSON NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_rep_user (user_id),
        INDEX idx_rep_ref (ref_number)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Seed default users if table is empty
    const [userRows]: any = await p.query('SELECT COUNT(*) as count FROM users');
    if (userRows && userRows[0] && userRows[0].count === 0) {
      await p.query(`
        INSERT INTO users (id, email, password_hash, full_name, role, organization, phone_number, tier_level, is_verified) VALUES
        ('usr_admin_01', 'admin.ops@gotangguh.id', '$2b$10$hashed_superadmin_pw', 'Tim Admin Geospasial RDI', 'Super Admin (RDI)', 'Resilience Development Initiative', '+62 811-9988-0011', 'Platform Master Authority', TRUE),
        ('usr_buyer_01', 'buyer.demo@gotangguh.id', '$2b$10$hashed_buyer_pw', 'Budi Santoso, S.T.', 'Home Buyer', 'Pribadi / Pembeli Rumah', '+62 812-3456-7890', 'Tier 2 Pro (Instant 1 Properti)', TRUE),
        ('usr_dev_01', 'developer.lead@ciputra-group.com', '$2b$10$hashed_dev_pw', 'Ir. Hendra Wijaya', 'Property Developer', 'PT Ciputra Development Tbk', '+62 811-9876-5432', 'Tier 2 Pro (Bundling 3 Properti)', TRUE),
        ('usr_bank_01', 'risk.officer@bankmandiri.co.id', '$2b$10$hashed_bank_pw', 'Rina Oktaviani, CFA', 'Lender / Bank', 'PT Bank Mandiri (Persero) Tbk', '+62 813-8888-2233', 'Tier 2 Pro (Bundling 3 Properti)', TRUE),
        ('usr_consult_01', 'auditor.lead@rdi.or.id', '$2b$10$hashed_consult_pw', 'Dr. Agus Salim', 'Consultant / Auditor', 'Resilience Development Initiative (RDI)', '+62 815-7766-5544', 'Tier 2 Pro (Bundling 3 Properti)', TRUE)
        ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);
      `);

      // Seed initial consultation inquiry
      await p.query(`
        INSERT INTO consultation_bookings (id, voucher_code, client_name, client_email, client_phone, target_location, package_type, assigned_expert, scheduled_date, status, notes) VALUES
        ('bk_01', 'BK-202608-01', 'Dian Permata', 'dian.permata@gmail.com', '+62 812-9988-7766', 'Jl. Kemang Pratama Raya, Bekasi Barat', 'Konsultasi Lite / Basic (Rp 300rb - 750rb)', 'Tim Peneliti RDI & BGP Consultant', '28 Agustus 2026', 'MENUNGGU DISPATCH', 'Mohon analisis kedalaman genangan banjir 2020 dan peil lantai aman.')
        ON DUPLICATE KEY UPDATE client_name = VALUES(client_name);
      `);
    }

    // Normalize any existing legacy tier labels in users table
    await p.query(`
      UPDATE users 
      SET tier_level = 'Tier 2 Pro (Instant 1 Properti)' 
      WHERE tier_level LIKE '%45%' OR tier_level LIKE '%Instant%'
    `).catch(() => {});
    await p.query(`
      UPDATE users 
      SET tier_level = 'Tier 2 Pro (Bundling 3 Properti)' 
      WHERE tier_level LIKE '%B2B%' OR tier_level LIKE '%Bundling%'
    `).catch(() => {});

    tablesInitialized = true;
  } catch (err) {
    console.warn('[ensureTablesExist] Migration error:', err);
  }
};

declare global {
  var _mysqlPool: mysql.Pool | undefined;
}

export const getDbPool = (): mysql.Pool => {
  if (!global._mysqlPool) {
    global._mysqlPool = mysql.createPool(poolConfig);
    ensureTablesExist(global._mysqlPool).catch((e) => console.warn('Auto-init table check:', e));
  }
  return global._mysqlPool;
};

export interface DatabaseStatus {
  isConnected: boolean;
  database: string;
  host: string;
  port: number;
  message: string;
  timestamp: string;
}

/**
 * Test MySQL connection health & run migrations
 */
export const checkDbHealth = async (): Promise<DatabaseStatus> => {
  const currentPool = getDbPool();
  try {
    const connection = await currentPool.getConnection();
    await connection.ping();
    await ensureTablesExist(currentPool);
    connection.release();

    return {
      isConnected: true,
      database: poolConfig.database as string,
      host: poolConfig.host as string,
      port: poolConfig.port as number,
      message: 'Koneksi database MySQL aktif & seluruh tabel (users, bookings, properties) siap digunakan.',
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    return {
      isConnected: false,
      database: poolConfig.database as string,
      host: poolConfig.host as string,
      port: poolConfig.port as number,
      message: `Gagal menghubungkan ke MySQL: ${error.message}`,
      timestamp: new Date().toISOString()
    };
  }
};
