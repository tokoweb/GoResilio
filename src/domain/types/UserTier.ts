export enum UserTier {
  FREE = 'FREE',                   // Akun Gratis: Scan Peta Satelit Interaktif & Skrining Dasar
  INSTANT_PRO = 'INSTANT_PRO',     // Tier 2 Pro Instant (Rp 35.000): 1 Lokasi Tapak Dossier PDF Resmi
  BUNDLING_PRO = 'BUNDLING_PRO',   // Tier 2 Pro Bundling (Rp 85.000): 3 Lokasi Tapak Dossier PDF + Komparasi Side-by-Side
  ENTERPRISE = 'ENTERPRISE',       // Tier 3 Enterprise / Developer B2B Suite
  ADMIN = 'ADMIN'                  // Super Admin Authority
}

export enum UserRole {
  HOME_BUYER = 'Home Buyer',
  PROPERTY_DEVELOPER = 'Property Developer',
  BANK_INSURANCE = 'Bank / Underwriter',
  SUPER_ADMIN = 'Super Admin (RDI)'
}

export function normalizeUserTier(tierLevel?: string | null): UserTier {
  if (!tierLevel) return UserTier.FREE;
  const lower = tierLevel.toLowerCase().trim();
  
  if (lower === 'admin' || lower.includes('admin') || lower.includes('authority')) {
    return UserTier.ADMIN;
  }
  if (lower === 'enterprise' || lower.includes('enterprise') || lower.includes('b2b') || lower.includes('tier 3')) {
    return UserTier.ENTERPRISE;
  }
  if (lower === 'bundling_pro' || lower.includes('bundling') || lower.includes('3 properti') || lower.includes('85')) {
    return UserTier.BUNDLING_PRO;
  }
  if (lower === 'instant_pro' || lower.includes('instant') || lower.includes('1 properti') || lower.includes('35') || lower.includes('45') || lower.includes('tier 2')) {
    return UserTier.INSTANT_PRO;
  }
  if (lower === 'free' || lower.includes('free') || lower.includes('gratis') || lower.includes('skrining') || lower.includes('tier 1')) {
    return UserTier.FREE;
  }

  return UserTier.FREE;
}

export function isPaidUser(tierLevel?: string | null, role?: string | null): boolean {
  if (role === 'Super Admin (RDI)' || role === 'Admin') return true;
  const tier = normalizeUserTier(tierLevel);
  return tier !== UserTier.FREE;
}

export function canAccessComparison(tierLevel?: string | null, role?: string | null): boolean {
  if (role === 'Super Admin (RDI)' || role === 'Admin') return true;
  const tier = normalizeUserTier(tierLevel);
  return tier === UserTier.BUNDLING_PRO || tier === UserTier.ENTERPRISE || tier === UserTier.ADMIN;
}

export function getPaidDossierQuota(tierLevel?: string | null, role?: string | null): number {
  if (role === 'Super Admin (RDI)' || role === 'Admin') return 999;
  const tier = normalizeUserTier(tierLevel);
  switch (tier) {
    case UserTier.INSTANT_PRO:
      return 1;
    case UserTier.BUNDLING_PRO:
    case UserTier.ENTERPRISE:
      return 3;
    default:
      return 0; // Free tier has 0 paid dossiers
  }
}

export function getTierDisplayName(tierLevel?: string | null, isEn = false): string {
  const tier = normalizeUserTier(tierLevel);
  switch (tier) {
    case UserTier.ADMIN:
      return isEn ? 'Super Admin Authority' : 'Super Admin (Otoritas Sistem)';
    case UserTier.ENTERPRISE:
      return isEn ? 'Tier 2 Pro (Bundling 3 Sites)' : 'Tier 2 Pro (Bundling 3 Properti)';
    case UserTier.BUNDLING_PRO:
      return isEn ? 'Tier 2 Pro (Bundling 3 Sites)' : 'Tier 2 Pro (Bundling 3 Properti)';
    case UserTier.INSTANT_PRO:
      return isEn ? 'Tier 2 Pro (Instant 1 Site)' : 'Tier 2 Pro (Instant 1 Properti)';
    case UserTier.FREE:
    default:
      return isEn ? 'Free Tier (Basic Screening)' : 'Akun Gratis (Skrining Dasar)';
  }
}

export function getTierBadgeInfo(tierLevel?: string | null, role?: string | null, isEn = false): { label: string; class: string; subtext: string } {
  if (role === 'Super Admin (RDI)' || role === 'Admin') {
    return {
      label: 'Admin',
      class: 'green',
      subtext: isEn ? 'Unlimited dossiers & master authority' : 'Akses tak terbatas & kelola sistem'
    };
  }
  const tier = normalizeUserTier(tierLevel);
  switch (tier) {
    case UserTier.BUNDLING_PRO:
    case UserTier.ENTERPRISE:
      return {
        label: 'Bundling Pro',
        class: 'green',
        subtext: isEn ? '3 Reports per Bundling Pack' : '3 Kuota Laporan per Paket Bundling'
      };
    case UserTier.INSTANT_PRO:
      return {
        label: 'Instant Pro',
        class: 'green',
        subtext: isEn ? '1 Report for Selected Property' : '1 Kuota Laporan untuk Properti Terpilih'
      };
    case UserTier.FREE:
    default:
      return {
        label: 'Free Tier',
        class: 'slate',
        subtext: isEn ? 'Interactive Map & Basic Screening' : 'Peta Interaktif & Skrining Dasar'
      };
  }
}

