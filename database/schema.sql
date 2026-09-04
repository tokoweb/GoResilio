-- ==============================================================================
-- GoTangguh / MataTangguh — Multi-Hazard Spatial Due Diligence Platform
-- MySQL Database Production Schema & Real Seed Data
-- Benchmark: RDI & BGP Consultant Standards (SNI 1726:2019, PusGen 2024, DEMNAS)
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `gotangguh_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `gotangguh_db`;

-- ------------------------------------------------------------------------------
-- 1. Table: users (Enterprise Multi-Role Users & Clients)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(64) PRIMARY KEY,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(150) NOT NULL,
  `role` ENUM('Home Buyer', 'Property Developer', 'Lender / Bank', 'Consultant / Auditor', 'Super Admin (RDI)') NOT NULL DEFAULT 'Home Buyer',
  `organization` VARCHAR(150) NULL,
  `phone_number` VARCHAR(30) NULL,
  `tier_level` VARCHAR(50) NOT NULL DEFAULT 'Tier 2 Pro & B2B Suite',
  `is_verified` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. Table: saved_properties (Home Buyer & Owner Dossiers)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `saved_properties` (
  `id` VARCHAR(64) PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL,
  `ref_number` VARCHAR(64) NOT NULL UNIQUE,
  `property_name` VARCHAR(180) NOT NULL,
  `address` TEXT NOT NULL,
  `property_type` VARCHAR(80) NOT NULL DEFAULT 'Residential (Rumah Tapak)',
  `latitude` DECIMAL(10, 7) NOT NULL,
  `longitude` DECIMAL(10, 7) NOT NULL,
  `overall_score` INT NOT NULL DEFAULT 50,
  `risk_level` ENUM('low', 'medium', 'high', 'extreme') NOT NULL DEFAULT 'medium',
  `flood_score` INT NOT NULL DEFAULT 30,
  `quake_score` INT NOT NULL DEFAULT 40,
  `heat_score` INT NOT NULL DEFAULT 35,
  `elevation_meters` DECIMAL(6, 2) NOT NULL DEFAULT 15.0,
  `fault_distance_km` DECIMAL(6, 2) NOT NULL DEFAULT 12.5,
  `last_updated_str` VARCHAR(80) NOT NULL DEFAULT '23 Agustus 2026',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_prop_user` (`user_id`),
  CONSTRAINT `fk_prop_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. Table: developer_landbanks (Masterplan & Zoning Feasibility)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `developer_landbanks` (
  `id` VARCHAR(64) PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL,
  `project_name` VARCHAR(180) NOT NULL,
  `location_desc` VARCHAR(255) NOT NULL,
  `land_area_ha` DECIMAL(8, 2) NOT NULL DEFAULT 10.0,
  `dominant_hazard` VARCHAR(255) NOT NULL,
  `status_text` VARCHAR(255) NOT NULL,
  `kdb_rating` VARCHAR(80) NOT NULL DEFAULT 'KDB 50% / KLB 2.4',
  `kdh_pct` INT NOT NULL DEFAULT 30,
  `compliance_status` VARCHAR(50) NOT NULL DEFAULT 'VERIFIED',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_dev_user` (`user_id`),
  CONSTRAINT `fk_dev_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. Table: collateral_underwritings (Bank Loan & LTV Risk Haircut Matrix)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `collateral_underwritings` (
  `id` VARCHAR(64) PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL,
  `debtor_name` VARCHAR(150) NOT NULL,
  `collateral_ref` VARCHAR(80) NOT NULL UNIQUE,
  `property_location` VARCHAR(255) NOT NULL,
  `loan_amount_str` VARCHAR(80) NOT NULL,
  `composite_score` INT NOT NULL DEFAULT 50,
  `risk_level_desc` VARCHAR(120) NOT NULL,
  `ltv_policy` VARCHAR(180) NOT NULL,
  `esg_category` VARCHAR(120) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_collateral_user` (`user_id`),
  CONSTRAINT `fk_collateral_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. Table: consultation_bookings (Client Consultation & Survey Bookings)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `consultation_bookings` (
  `id` VARCHAR(64) PRIMARY KEY,
  `voucher_code` VARCHAR(64) NOT NULL UNIQUE,
  `client_name` VARCHAR(150) NOT NULL,
  `client_email` VARCHAR(191) NOT NULL,
  `client_phone` VARCHAR(30) NOT NULL,
  `target_location` VARCHAR(255) NOT NULL,
  `package_type` VARCHAR(120) NOT NULL,
  `assigned_expert` VARCHAR(150) NOT NULL DEFAULT 'Tim Peneliti RDI & BGP',
  `scheduled_date` VARCHAR(120) NOT NULL,
  `status` ENUM('MENUNGGU DISPATCH', 'DIKONFIRMASI', 'SURVEI BERJALAN', 'SELESAI') NOT NULL DEFAULT 'MENUNGGU DISPATCH',
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 6. Table: field_survey_assignments (Auditor & Geotechnical Field Logbook)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `field_survey_assignments` (
  `id` VARCHAR(64) PRIMARY KEY,
  `client_name` VARCHAR(150) NOT NULL,
  `site_target` VARCHAR(255) NOT NULL,
  `assigned_expert` VARCHAR(150) NOT NULL,
  `service_type` VARCHAR(180) NOT NULL,
  `survey_date` VARCHAR(100) NOT NULL,
  `status` VARCHAR(80) NOT NULL DEFAULT 'TERJADWAL',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 7. Table: system_feeds (Data Feed Ingestion Telemetry for Super Admin)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `system_feeds` (
  `id` VARCHAR(64) PRIMARY KEY,
  `feed_name` VARCHAR(150) NOT NULL,
  `provider` VARCHAR(150) NOT NULL,
  `resolution` VARCHAR(80) NOT NULL,
  `latency_ms` INT NOT NULL DEFAULT 120,
  `status` VARCHAR(50) NOT NULL DEFAULT 'LIVE',
  `last_sync` VARCHAR(100) NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 8. Table: user_reports (Persistent Multi-Hazard Assessment Report Library)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_reports` (
  `id` VARCHAR(64) PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL,
  `user_email` VARCHAR(191) NULL,
  `ref_number` VARCHAR(64) NOT NULL UNIQUE,
  `property_name` VARCHAR(180) NOT NULL,
  `address` TEXT NOT NULL,
  `latitude` DECIMAL(10, 7) NOT NULL,
  `longitude` DECIMAL(10, 7) NOT NULL,
  `overall_score` INT NOT NULL DEFAULT 50,
  `overall_level` VARCHAR(30) NOT NULL DEFAULT 'medium',
  `package_type` VARCHAR(120) NOT NULL DEFAULT 'Instant (1 Properti)',
  `report_data` JSON NULL,
  `status` VARCHAR(30) NOT NULL DEFAULT 'completed',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_rep_user` (`user_id`),
  INDEX `idx_rep_ref` (`ref_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 9. Table: payment_transactions (Historical Transaction & Inquiry Records)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `payment_transactions` (
  `id` VARCHAR(64) PRIMARY KEY,
  `order_id` VARCHAR(100) NOT NULL UNIQUE,
  `user_email` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(64) NULL,
  `plan_name` VARCHAR(150) NOT NULL,
  `tier_level` VARCHAR(80) NOT NULL DEFAULT 'Tier 2 Pro (Rp 45rb)',
  `amount` DECIMAL(12, 2) NOT NULL DEFAULT 45000.00,
  `payment_type` VARCHAR(50) NOT NULL DEFAULT 'direct_admin',
  `transaction_status` VARCHAR(50) NOT NULL DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_tx_order` (`order_id`),
  INDEX `idx_tx_email` (`user_email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 10. Table: system_configs (Dynamic Configuration & Scoring Settings)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `system_configs` (
  `config_key` VARCHAR(100) PRIMARY KEY,
  `config_value` JSON NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- REAL SEED DATA (5 PERSONAS / ROLES & PRODUCTION SAMPLES)
-- ==============================================================================

-- 1. Insert Real Users
INSERT INTO `users` (`id`, `email`, `password_hash`, `full_name`, `role`, `organization`, `phone_number`, `tier_level`) VALUES
('usr_buyer_01', 'buyer.demo@gotangguh.id', '$2b$10$w8fA3j1l0V2Kq9X.P8ZqOeQZq5bC8A8z7u8h', 'Budi Santoso', 'Home Buyer', 'Pribadi / Calon Pembeli Rumah', '+6281234567890', 'Tier 2 Pro & B2B Suite'),
('usr_dev_01', 'developer.lead@ciputra-group.com', '$2b$10$w8fA3j1l0V2Kq9X.P8ZqOeQZq5bC8A8z7u8h', 'Ir. Hendra Wijaya', 'Property Developer', 'PT Ciputra Development Tbk', '+6281398765432', 'Tier 3 Enterprise Masterplan'),
('usr_bank_01', 'risk.officer@bankmandiri.co.id', '$2b$10$w8fA3j1l0V2Kq9X.P8ZqOeQZq5bC8A8z7u8h', 'Rina Oktaviani, CFA', 'Lender / Bank', 'PT Bank Mandiri (Persero) Tbk', '+6281122334455', 'Tier 4 Bank Underwriting Suite'),
('usr_auditor_01', 'auditor.lead@rdi.or.id', '$2b$10$w8fA3j1l0V2Kq9X.P8ZqOeQZq5bC8A8z7u8h', 'Dr. Agus Salim, S.T., M.T.', 'Consultant / Auditor', 'Resilience Development Initiative (RDI)', '+6281876543210', 'RDI Lead Auditor Authority'),
('usr_admin_01', 'admin.ops@gotangguh.id', '$2b$10$w8fA3j1l0V2Kq9X.P8ZqOeQZq5bC8A8z7u8h', 'Tim Pusat Kendali MataTangguh', 'Super Admin (RDI)', 'MataTangguh & BGP Ops', '+6281199887766', 'Platform Master Authority')
ON DUPLICATE KEY UPDATE `full_name` = VALUES(`full_name`);

-- 2. Insert Saved Properties for Home Buyer
INSERT INTO `saved_properties` (`id`, `user_id`, `ref_number`, `property_name`, `address`, `property_type`, `latitude`, `longitude`, `overall_score`, `risk_level`, `flood_score`, `quake_score`, `heat_score`, `elevation_meters`, `fault_distance_km`, `last_updated_str`) VALUES
('prop_01', 'usr_buyer_01', 'MT-BKS-2026-0814', 'Rumah Tinggal Kemang Pratama', 'Jl. Kemang Pratama Raya Blok AV-12, Sepanjang Jaya, Bekasi', 'Residential (Rumah Tapak)', -6.2625000, 106.9920000, 78, 'high', 85, 42, 74, 11.20, 18.40, '22 Agustus 2026'),
('prop_02', 'usr_buyer_01', 'MT-TNG-2026-0792', 'Townhouse Cluster Aster BSD City', 'Cluster Aster, BSD City Sektor 7, Pagedangan, Tangerang', 'Residential (Townhouse)', -6.3021000, 106.6521000, 28, 'low', 18, 32, 35, 38.50, 24.10, '19 Agustus 2026'),
('prop_03', 'usr_buyer_01', 'MT-BGR-2026-0641', 'Ruko Niaga Sentra Sentul', 'Kompleks Ruko Sentul City Kav. 88, Babakan Madang, Bogor', 'Commercial (Ruko / Kantor)', -6.5540000, 106.8620000, 62, 'medium', 30, 68, 45, 215.00, 8.20, '15 Agustus 2026')
ON DUPLICATE KEY UPDATE `property_name` = VALUES(`property_name`);

-- 3. Insert Developer Land Banks
INSERT INTO `developer_landbanks` (`id`, `user_id`, `project_name`, `location_desc`, `land_area_ha`, `dominant_hazard`, `status_text`, `kdb_rating`, `kdh_pct`, `compliance_status`) VALUES
('site_01', 'usr_dev_01', 'Masterplan Kawasan Sentul Barat (120 Ha)', 'Kec. Babakan Madang, Bogor, Jawa Barat', 120.00, 'Sesar Baribis (8.2 km) · PGA 0.38g', 'KDH 35% Terpenuhi · Buffer Sesar 50m OK', 'KDB 50% / KLB 2.4', 35, 'VERIFIED'),
('site_02', 'usr_dev_01', 'Industrial Park Cikarang Phase 4 (45 Ha)', 'Kec. Cikarang Pusat, Bekasi, Jawa Barat', 45.00, 'Banjir Fluvial Kali Cibeet (Elevasi 14m)', 'Wajib Kolam Retensi 15% Luas Lahan', 'KDB 60% / KLB 1.8', 25, 'ACTION REQUIRED')
ON DUPLICATE KEY UPDATE `project_name` = VALUES(`project_name`);

-- 4. Insert Collateral Underwritings for Bank
INSERT INTO `collateral_underwritings` (`id`, `user_id`, `debtor_name`, `collateral_ref`, `property_location`, `loan_amount_str`, `composite_score`, `risk_level_desc`, `ltv_policy`, `esg_category`) VALUES
('collat_01', 'usr_bank_01', 'Budi Santoso & Pasangan', 'KPR-JKT-2026-8812', 'Kemang Pratama, Bekasi', 'Rp 1.850.000.000', 78, 'Tinggi (Banjir Fluvial)', 'LTV Direkomendasikan: 75% (Haircut 10%)', 'Kategori C (Physical Risk Exposed)'),
('collat_02', 'usr_bank_01', 'PT Mega Sentosa Distribusi', 'CORP-MDR-2026-5521', 'Kawasan Pergudangan Marunda, Jakarta Utara', 'Rp 8.500.000.000', 68, 'Sedang-Tinggi (Heat & Sea Level)', 'LTV Normal: 70% + Asuransi Perluasan Banjir Wajib', 'Kategori B (Mitigation Feasible)')
ON DUPLICATE KEY UPDATE `debtor_name` = VALUES(`debtor_name`);

-- 5. Insert Consultation Bookings
INSERT INTO `consultation_bookings` (`id`, `voucher_code`, `client_name`, `client_email`, `client_phone`, `target_location`, `package_type`, `assigned_expert`, `scheduled_date`, `status`, `notes`) VALUES
('bk_01', 'BK-2026-0819', 'Ahmad Fauzi (Pembeli Properti)', 'ahmad.fauzi@gmail.com', '+6281299887766', 'Kemang Pratama, Bekasi', 'Paket Lite Review (Rp 450.000)', 'Dr. Agus Salim (RDI)', '25 Agustus 2026 - 14:00 WIB', 'DIKONFIRMASI', 'Konsultasi virtual via Google Meet terkait peil banjir & perkuatan kolom.'),
('bk_02', 'BK-2026-0822', 'PT Nusantara Propertindo', 'land.acq@nusantaraproperty.co.id', '+6281144556677', 'Kawasan Sentul Hills 15 Ha', 'Paket Premium On-Site Sondir (Rp 3.500.000)', 'Ir. Hendra Wijaya (Geoteknik)', '28 Agustus 2026 - 09:00 WIB', 'MENUNGGU DISPATCH', 'Permintaan uji tanah sondir CPT 4 titik di area rencana klaster.'),
('bk_03', 'BK-2026-0805', 'Bank Central Asia (Risk Division)', 'risk.dept@bca.co.id', '+6281987654321', 'Portfolio 50 Agunan Jabodetabek', 'B2B Enterprise Custom Assessment', 'Tim Ahli RDI & BGP Consultant', '15 Agustus 2026', 'SELESAI', 'Audit ketahanan portofolio kredit KPR tuntas dan laporan diserahkan.')
ON DUPLICATE KEY UPDATE `client_name` = VALUES(`client_name`);

-- 6. Insert Field Survey Assignments
INSERT INTO `field_survey_assignments` (`id`, `client_name`, `site_target`, `assigned_expert`, `service_type`, `survey_date`, `status`) VALUES
('survey_01', 'Ciputra Residence & Land', 'Kawasan Klaster Sentul Hills', 'Ir. Hendra Wijaya, M.T. (RDI Geoteknik)', 'On-Site Geotechnical & Sondir CPT Survey', '26 Agustus 2026', 'TERJADWAL'),
('survey_02', 'Bank Mandiri (Persero) Tbk', 'Audit Kelayakan Portofolio 20 Agunan Residensial BSD', 'Dr. Agus Salim (Senior Disaster Auditor BGP)', 'Batch Dossier Stamping & OJK ESG Validation', '18 Agustus 2026', 'SELESAI & TERTANDATANGANI')
ON DUPLICATE KEY UPDATE `client_name` = VALUES(`client_name`);

-- 7. Insert System Feed Telemetry
INSERT INTO `system_feeds` (`id`, `feed_name`, `provider`, `resolution`, `latency_ms`, `status`, `last_sync`) VALUES
('feed_01', 'DEMNAS BIG (Badan Informasi Geospasial)', 'BIG Indonesia', '8.2m LiDAR / Radar', 124, 'LIVE', '2 menit lalu'),
('feed_02', 'PusGen 2024 / SNI 1726:2019', 'Kementerian PUPR', '295 Fault Segments', 85, 'LIVE', 'Real-time database'),
('feed_03', 'BMKG Open Data & Radar Presipitasi', 'BMKG Pusat', 'Real-time Radar AWS', 140, 'LIVE', 'Live stream active'),
('feed_04', 'ECMWF ERA5-Land & USGS Global Quake', 'Copernicus & USGS', '0.1° Gridded Climate', 195, 'LIVE', 'Siklus harian')
ON DUPLICATE KEY UPDATE `feed_name` = VALUES(`feed_name`);
