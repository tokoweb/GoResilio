'use client';

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import type {
  MultiHazardAssessmentResult,
  PropertyType,
  UserPersona
} from '../../domain/types/hazard.types';
import type { UserEntity } from '../../domain/entities/User.entity';
import { isPaidUser, normalizeUserTier, UserTier } from '../../domain/types/UserTier';
import { IndexedDbRepository } from '../../infrastructure/database/IndexedDbRepository';
import { DataProvenanceAuditModal } from '../components/audit/DataProvenanceAuditModal';
import { PerformSiteAssessmentUseCase } from '../../application/use_cases/PerformSiteAssessment.usecase';

export type OverrideLevel = 'auto' | 'high' | 'medium' | 'low';
export type AppViewMode = 'public' | 'account';
export type AccountRole = 'Home Buyer' | 'Property Developer' | 'Lender / Bank' | 'Consultant / Auditor' | 'Super Admin (RDI)';

export interface PresetLocation {
  id: string;
  nameId: string;
  nameEn: string;
  latitude: number;
  longitude: number;
  country: string;
  highlightId: string;
  highlightEn: string;
}

export const PRESET_LOCATIONS: PresetLocation[] = [
  {
    id: 'bali',
    nameId: 'Bali',
    nameEn: 'Bali',
    latitude: -8.6705,
    longitude: 115.2126,
    country: 'Indonesia',
    highlightId: 'Heatstress & Megathrust',
    highlightEn: 'Heat Stress & Megathrust'
  },
  {
    id: 'jakarta',
    nameId: 'Jakarta',
    nameEn: 'Jakarta',
    latitude: -6.2088,
    longitude: 106.8456,
    country: 'Indonesia',
    highlightId: 'Banjir Fluvial & Sesar Baribis',
    highlightEn: 'Fluvial Flooding & Baribis Fault'
  },
  {
    id: 'manila',
    nameId: 'Manila',
    nameEn: 'Manila',
    latitude: 14.5995,
    longitude: 120.9842,
    country: 'Philippines',
    highlightId: 'West Valley Fault & Badai Typhoon',
    highlightEn: 'West Valley Fault & Typhoon Surge'
  }
];

export interface AdminApiKeyItem {
  id: string;
  name: string;
  provider: string;
  type: string;
  endpointUrl: string;
  apiKey: string;
  status: boolean;
  quotaLimit: number;
  quotaUsed: number;
  lastTested: string;
}

export interface RiskThresholdLevelConfig {
  maxScore: number;
  labelId: string;
  labelEn: string;
  badgeColor: string;
  criteriaDescriptionId: string;
  recommendationDirectiveId: string;
}

export interface AdminDashboardConfig {
  // 1. Scoring Formula Weights & Overall Dashboard Settings
  dominantHazardWeight: number; // e.g. 70
  averageHazardWeight: number;  // e.g. 30
  overallScoreOverride: number; // e.g. 78
  overallSummaryId: string;
  overallSummaryEn: string;

  // 2. Risk Classification Thresholds (Aman, Sedang, Bahaya, Ekstrem)
  lowRisk: RiskThresholdLevelConfig;     // Aman (0 - 35)
  mediumRisk: RiskThresholdLevelConfig;  // Sedang / Waspada (36 - 70)
  highRisk: RiskThresholdLevelConfig;    // Bahaya / Tinggi (71 - 85)
  extremeRisk: RiskThresholdLevelConfig; // Ekstrem / Kritis (86 - 100)

  // 3. Flood Hazard Details
  floodScore: number;
  floodElevationMeters: number;
  floodRainfallMm: number;
  floodCauseId: string;
  floodCauseEn: string;
  floodDirectiveId: string;
  floodDirectiveEn: string;

  // 4. Quake Hazard Details
  quakeScore: number;
  quakeFaultName: string;
  quakeDistanceKm: number;
  quakePgaG: number;
  quakeCauseId: string;
  quakeCauseEn: string;
  quakeDirectiveId: string;
  quakeDirectiveEn: string;

  // 5. Heat Hazard Details
  heatScore: number;
  heatAvgMaxTempC: number;
  heatUhiFactor: string;
  heatCauseId: string;
  heatCauseEn: string;
  heatDirectiveId: string;
  heatDirectiveEn: string;

  // 6. API Keys Configuration
  apiKeys: AdminApiKeyItem[];
}

export const DEFAULT_ADMIN_CONFIG: AdminDashboardConfig = {
  dominantHazardWeight: 70,
  averageHazardWeight: 30,
  overallScoreOverride: 78,
  overallSummaryId: 'Zona Berbahaya Tinggi — Memerlukan Protokol Mitigasi Terstruktur Sebelum Transaksi',
  overallSummaryEn: 'High Hazard Zone — Structured Technical Mitigation Protocol Required Prior to Transaction',

  lowRisk: {
    maxScore: 35,
    labelId: 'Aman / Rendah',
    labelEn: 'Low / Safe',
    badgeColor: '#10b981',
    criteriaDescriptionId: 'Elevasi tanah > 15m, jarak sesar aktif > 25km, curah hujan normal, suhu nyaman.',
    recommendationDirectiveId: 'Kondisi tapak sangat prima. Tidak memerlukan perlakuan struktur khusus, aman untuk akad KPR.'
  },
  mediumRisk: {
    maxScore: 70,
    labelId: 'Sedang / Waspada',
    labelEn: 'Moderate / Caution',
    badgeColor: '#f59e0b',
    criteriaDescriptionId: 'Elevasi 8–15m, jarak sesar 10–25km (PGA 0.20–0.35g), atau beban mikroklimat termal moderat.',
    recommendationDirectiveId: 'Disarankan uji tuntas standar, saluran drainase terintegrasi, dan perluasan asuransi FLEXAS PLUS.'
  },
  highRisk: {
    maxScore: 85,
    labelId: 'Tinggi / Bahaya',
    labelEn: 'High / Hazard',
    badgeColor: '#ef4444',
    criteriaDescriptionId: 'Elevasi < 8m (DAS rawan genangan), jarak sesar < 10km (PGA > 0.35g), suhu ekstrem > 34°C.',
    recommendationDirectiveId: 'Wajib peninggian peil lantai dasar (+60cm) dan struktur beton bertulang standar SNI 1726:2019.'
  },
  extremeRisk: {
    maxScore: 100,
    labelId: 'Ekstrem / Kritis',
    labelEn: 'Extreme / Critical',
    badgeColor: '#dc2626',
    criteriaDescriptionId: 'Zona merah patahan sesar aktif permukaan (PusGen) atau sempadan sungai < 50m.',
    recommendationDirectiveId: 'Wajib audit geoteknik lapangan (SPT/CPT) oleh tim ahli RDI dan konsultasi struktural khusus.'
  },

  floodScore: 0,
  floodElevationMeters: 0,
  floodRainfallMm: 0,
  floodCauseId: 'Elevasi relatif terhadap sempadan air dan potensi genangan limpasan hujan lebat.',
  floodCauseEn: 'Site elevation relative to waterway buffers and torrential storm ponding exposure.',
  floodDirectiveId: 'Wajib peninggian peil lantai dasar minimum +60cm dan instalasi backflow preventer valve.',
  floodDirectiveEn: 'Elevate ground slab +60cm minimum and install backflow check valves.',

  quakeScore: 0,
  quakeFaultName: '',
  quakeDistanceKm: 0,
  quakePgaG: 0,
  quakeCauseId: 'Analisis katalog seismik dan zonasi bahaya gempa bumi tektonik.',
  quakeCauseEn: 'Seismic catalog analysis and tectonic earthquake hazard zoning.',
  quakeDirectiveId: 'Pondasi tapak diperkaku dengan sloof ikat dan kolom praktis tahan gempa SNI 1726:2019.',
  quakeDirectiveEn: 'Reinforced concrete framing and perimeter tie beams compliant with SNI 1726:2019.',

  heatScore: 0,
  heatAvgMaxTempC: 0,
  heatUhiFactor: '',
  heatCauseId: 'Kerapatan tutupan beton lingkungan tinggi dengan indeks kenyamanan termal rendah.',
  heatCauseEn: 'High impervious concrete coverage with low thermal comfort index.',
  heatDirectiveId: 'Pertahankan Koefisien Dasar Hijau (KDH) min. 30% dan insulasi termal atap reflektif.',
  heatDirectiveEn: 'Maintain min. 30% green area ratio and install cool roof thermal barrier.',

  apiKeys: [
    {
      id: 'DS-DEM-COPERNICUS',
      name: 'Copernicus DEM 90m (Digital Elevation Model)',
      provider: 'Open-Meteo / Copernicus',
      type: 'Elevasi & Kemiringan Lereng',
      endpointUrl: 'https://api.open-meteo.com/v1/elevation',
      apiKey: 'public_endpoint',
      status: true,
      quotaLimit: 50000,
      quotaUsed: 4920,
      lastTested: 'Aktif (18ms)'
    },
    {
      id: 'DS-PUSGEN',
      name: 'PusGen 2024 & Peta Sesar Aktif',
      provider: 'Kementerian PUPR / Badan Geologi',
      type: 'Patahan Sesar & Nilai PGA Seismik',
      endpointUrl: 'https://pusgen.pu.go.id/api/v3/active-faults',
      apiKey: 'server_managed',
      status: true,
      quotaLimit: 20000,
      quotaUsed: 295,
      lastTested: 'Aktif (Synced)'
    },
    {
      id: 'DS-BMKG',
      name: 'BMKG Open Weather & Radar Presipitasi',
      provider: 'Badan Meteorologi, Klimatologi, dan Geofisika',
      type: 'Curah Hujan Ekstrem 24 Jam',
      endpointUrl: 'https://data.bmkg.go.id/DataMKG/TEWS/rainfall',
      apiKey: 'server_managed',
      status: true,
      quotaLimit: 30000,
      quotaUsed: 8140,
      lastTested: 'Aktif (Hourly)'
    },
    {
      id: 'DS-ERA5',
      name: 'ECMWF ERA5-Land Reanalysis',
      provider: 'European Centre for Medium-Range Weather',
      type: 'Klimatologi Suhu Historis & Proyeksi 2050',
      endpointUrl: 'https://cds.climate.copernicus.eu/api/v2/resources',
      apiKey: 'server_managed',
      status: true,
      quotaLimit: 10000,
      quotaUsed: 1200,
      lastTested: 'Aktif (Daily)'
    }
  ]
};

interface AssessmentContextProps {
  assessment: MultiHazardAssessmentResult | null;
  assessmentCoordinates: { lat: number; lng: number } | null;
  mapViewCenter: { lat: number; lng: number };
  setMapViewCenter: (center: { lat: number; lng: number }) => void;
  mapMarkerPosition: { lat: number; lng: number };
  setMapMarkerPosition: (pos: { lat: number; lng: number }) => void;
  isLoading: boolean;
  propertyType: PropertyType;
  setPropertyType: (type: PropertyType) => void;
  userPersona: UserPersona;
  setUserPersona: (persona: UserPersona) => void;
  selectedCoords: { lat: number; lng: number } | null;
  overrideMode: OverrideLevel;
  setOverrideMode: (mode: OverrideLevel) => void;
  isReportModalOpen: boolean;
  setIsReportModalOpen: (open: boolean) => void;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  isPaymentModalOpen: boolean;
  setIsPaymentModalOpen: (open: boolean) => void;
  isAuditModalOpen: boolean;
  setIsAuditModalOpen: (open: boolean) => void;
  selectedPaymentPlan: 'instant' | 'bundling';
  setSelectedPaymentPlan: (plan: 'instant' | 'bundling') => void;
  openPaymentModal: (plan?: 'instant' | 'bundling') => void;
  handleDownloadReportRequest: () => void;
  currentView: AppViewMode;
  setCurrentView: (view: AppViewMode) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (loggedIn: boolean) => void;
  currentUser: UserEntity | null;
  setCurrentUser: (user: UserEntity | null) => void;
  loginWithUser: (user: UserEntity) => void;
  activeAccountRole: AccountRole;
  setActiveAccountRole: (role: AccountRole) => void;
  accountEmail: string;
  loginAsRole: (role: AccountRole, email?: string) => void;
  logout: () => void;
  runAssessmentForCoords: (lat: number, lng: number, address?: string) => Promise<void>;
  selectPreset: (presetId: string) => Promise<void>;
  setManualScoreLevel: (level: 'high' | 'medium' | 'low') => void;
  
  // Admin Live Configuration
  adminConfig: AdminDashboardConfig;
  updateAdminConfig: (newConfig: Partial<AdminDashboardConfig>) => void;
}

const AssessmentContext = createContext<AssessmentContextProps | undefined>(undefined);

export const AssessmentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [propertyType, setPropertyType] = useState<PropertyType>('Residential');
  const [userPersona, setUserPersona] = useState<UserPersona>('Home Buyer');
  
  // Visual Map Center for visual navigation (Default: Jakarta regional view)
  const [mapViewCenter, setMapViewCenter] = useState<{ lat: number; lng: number }>({
    lat: -6.2088,
    lng: 106.8456
  });

  // Map Marker Position for visual pin representation
  const [mapMarkerPosition, setMapMarkerPosition] = useState<{ lat: number; lng: number }>({
    lat: -6.2088,
    lng: 106.8456
  });

  // Authoritative Assessment Coordinates: null on fresh application state until user confirms a site
  const [assessmentCoordinates, setAssessmentCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  
  // Initial Assessment State: strictly null on fresh application start
  const [assessment, setAssessment] = useState<MultiHazardAssessmentResult | null>(null);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const scanGenerationRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [overrideMode, setOverrideMode] = useState<OverrideLevel>('auto');
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [selectedPaymentPlan, setSelectedPaymentPlan] = useState<'instant' | 'bundling'>('instant');

  // Admin Configuration State
  const [adminConfig, setAdminConfig] = useState<AdminDashboardConfig>(DEFAULT_ADMIN_CONFIG);

  // Load custom admin configuration from MySQL on mount
  useEffect(() => {
    fetch('/api/admin/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.config) {
          setAdminConfig((prev) => ({ ...prev, ...data.config }));
        }
      })
      .catch(() => {});
  }, []);

  const updateAdminConfig = (newConfig: Partial<AdminDashboardConfig>) => {
    setAdminConfig((prev) => {
      const updated = { ...prev, ...newConfig };

      // Persist to MySQL database in real-time
      fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      }).catch(() => {});

      // GUARANTEE: Admin dashboard configuration strictly manages weights & thresholds
      // and NEVER injects synthetic hazard scores, fake PGA, or fake elevation into live physical assessment.

      return updated;
    });
  };

  // My Account / Client Workspace state
  const [currentView, setCurrentView] = useState<AppViewMode>('public');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserEntity | null>(null);
  const [activeAccountRole, setActiveAccountRole] = useState<AccountRole>('Home Buyer');
  const [accountEmail, setAccountEmail] = useState<string>('user@gotangguh.id');

  // Restore persistent authenticated session from localStorage & /api/auth/me on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('gotangguh_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.user) {
          setCurrentUser(parsed.user);
          setActiveAccountRole(parsed.user.role || 'Home Buyer');
          setAccountEmail(parsed.user.email);
          setIsLoggedIn(true);
          if (parsed.view) setCurrentView(parsed.view);

          // Verify with database in background
          fetch(`/api/auth/me?email=${encodeURIComponent(parsed.user.email)}`)
            .then((r) => r.json())
            .then((data) => {
              if (data.success && data.user) {
                setCurrentUser(data.user);
                setActiveAccountRole(data.user.role);
                localStorage.setItem('gotangguh_session', JSON.stringify({ user: data.user, view: parsed.view || 'public' }));
              }
            })
            .catch(() => {});
        }
      }
    } catch (e) {
      console.warn('Session restore fallback:', e);
    }
  }, []);

  const loginWithUser = (user: UserEntity) => {
    setCurrentUser(user);
    setActiveAccountRole(user.role);
    setAccountEmail(user.email);
    if (user.role === 'Super Admin (RDI)') {
      setUserPersona('Real Estate Agent');
    } else {
      setUserPersona(user.role === 'Consultant / Auditor' ? 'Real Estate Agent' : (user.role as UserPersona));
    }
    setIsLoggedIn(true);
    setCurrentView('account');
    try {
      localStorage.setItem('gotangguh_session', JSON.stringify({ user, view: 'account' }));
    } catch {}

    // Auto-link active scan to newly logged-in user portfolio
    if (assessment && user?.email) {
      fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: user.email,
          userId: user.id,
          propertyName: assessment.location.formattedAddress?.split(',')[0] || 'Kavling Tapak Terpilih',
          address: assessment.location.formattedAddress || 'Titik Koordinat Geospasial',
          propertyType,
          latitude: assessment.location.latitude,
          longitude: assessment.location.longitude,
          overallScore: assessment.overallScore,
          riskLevel: assessment.overallLevel,
          floodScore: assessment.flood.score,
          quakeScore: assessment.quake.score,
          heatScore: assessment.heat.score,
          elevationMeters: assessment.flood.elevationMeters,
          faultDistanceKm: assessment.quake.distanceToFaultKm,
          lastUpdatedStr: 'Baru Saja'
        })
      }).catch(() => {});
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loginAsRole = (role: AccountRole, email?: string) => {
    setActiveAccountRole(role);
    if (role === 'Super Admin (RDI)') {
      setUserPersona('Real Estate Agent');
      setAccountEmail(email || 'admin.ops@gotangguh.id');
    } else {
      setUserPersona(role === 'Consultant / Auditor' ? 'Real Estate Agent' : (role as UserPersona));
      setAccountEmail(email || `${role.toLowerCase().replace(/[^a-z]/g, '')}@gotangguh.id`);
    }
    setIsLoggedIn(true);
    setCurrentView('account');
    try {
      localStorage.setItem('gotangguh_session', JSON.stringify({
        user: {
          id: `usr_${Date.now()}`,
          email: email || 'user@gotangguh.id',
          fullName: role === 'Super Admin (RDI)' ? 'Tim Admin Geospasial RDI' : 'Pengguna Terdaftar',
          role,
          tierLevel: role === 'Super Admin (RDI)' ? 'Platform Master Authority' : 'Free Tier (Skrining Dasar)',
          isVerified: true
        },
        view: 'account'
      }));
    } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const logout = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
    setCurrentView('public');
    try {
      localStorage.removeItem('gotangguh_session');
      fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const runAssessmentForCoords = async (lat: number, lng: number, address?: string) => {
    // 1. Abort any previous pending scan request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // 2. Increment request generation sequence
    const currentGen = ++scanGenerationRef.current;
    setIsLoading(true);
    setAssessmentCoordinates({ lat, lng });
    setMapMarkerPosition({ lat, lng });
    setMapViewCenter({ lat, lng });

    // Item 7: Log coordinates at moment assessment starts
    console.log('[GoTangguh Assessment Trigger]', {
      mapViewCenter: { lat, lng },
      mapMarkerPosition: { lat, lng },
      assessmentCoordinates: { lat, lng }
    });

    try {
      let result: MultiHazardAssessmentResult | null = null;

      // 1. Remote API execution
      try {
        const scanRes = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            latitude: lat,
            longitude: lng,
            formattedAddress: address,
            address: address,
            propertyType,
            userPersona
          })
        });

        if (scanRes.ok) {
          const json = await scanRes.json();
          if (json && json.data) {
            result = json.data;
          }
        }
      } catch (fetchErr: unknown) {
        if (fetchErr instanceof Error && fetchErr.name === 'AbortError') {
          return;
        }
        console.warn('API /api/scan remote fetch fallback:', fetchErr);
      }

      // 2. Direct fallback execution (ensures 100% assessment generation reliability)
      if (!result && currentGen === scanGenerationRef.current) {
        result = await PerformSiteAssessmentUseCase.execute({
          latitude: lat,
          longitude: lng,
          formattedAddress: address,
          propertyType,
          userPersona
        });
      }

      // 3. Stale response protection: if a newer scan started while waiting, discard this result
      if (currentGen !== scanGenerationRef.current) {
        return;
      }

      if (result) {
        setAssessment(result);
        setAssessmentCoordinates({ lat: result.location.latitude, lng: result.location.longitude });
        setMapMarkerPosition({ lat: result.location.latitude, lng: result.location.longitude });
        setOverrideMode('auto');

        // Persist to IndexedDB (client-side only)
        try { IndexedDbRepository.saveAssessment(result); } catch {}

        // Auto-save property to logged-in user portfolio
        const email = currentUser?.email || accountEmail;
        if (email && email !== 'user@gotangguh.id') {
          fetch('/api/properties', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userEmail: email,
              userId: currentUser?.id,
              propertyName: address?.split(',')[0] || (result.location.formattedAddress ? result.location.formattedAddress.split(',')[0] : 'Kavling Tapak Terpilih'),
              address: address || result.location.formattedAddress || 'Titik Koordinat Geospasial',
              propertyType,
              latitude: lat,
              longitude: lng,
              overallScore: result.overallScore,
              riskLevel: result.overallLevel,
              floodScore: result.flood.score,
              quakeScore: result.quake.score,
              heatScore: result.heat.score,
              elevationMeters: result.flood.elevationMeters,
              faultDistanceKm: result.quake.distanceToFaultKm,
              lastUpdatedStr: 'Baru Saja'
            })
          }).catch(() => {});
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Normal cancellation of older in-flight request when user picked a newer point
        return;
      }
      console.warn('Scan request error:', err);
    } finally {
      if (currentGen === scanGenerationRef.current) {
        setIsLoading(false);
      }
    }
  };

  const selectPreset = async (presetId: string) => {
    const target = PRESET_LOCATIONS.find((p) => p.id === presetId);
    if (!target) return;
    const addr = `${target.nameEn}, ${target.country}`;
    await runAssessmentForCoords(target.latitude, target.longitude, addr);
  };

  const setManualScoreLevel = (level: 'high' | 'medium' | 'low') => {
    setOverrideMode(level);
    // GUARANTEE: Live physical location assessments cannot be silently overwritten by manual UI overrides.
    // The overrideMode is strictly tracked for UI simulation inspection without mutating live assessment state.
  };

  const openPaymentModal = (plan: 'instant' | 'bundling' = 'instant') => {
    setSelectedPaymentPlan(plan);
    if (!isLoggedIn) {
      setIsLoginModalOpen(true);
      return;
    }
    setIsPaymentModalOpen(true);
  };

  const handleDownloadReportRequest = () => {
    // 1. If not logged in -> Prompt login first
    if (!isLoggedIn) {
      setIsLoginModalOpen(true);
      return;
    }

    // 2. If logged in but Free Tier -> Prompt payment checkout modal
    const hasPaidAccess = isPaidUser(currentUser?.tierLevel, activeAccountRole);

    if (!hasPaidAccess) {
      openPaymentModal('instant');
      return;
    }

    // 3. Paid Pro / Enterprise / Admin -> Open full 14-page report directly
    setIsReportModalOpen(true);
  };

  return (
    <AssessmentContext.Provider
      value={{
        assessment,
        assessmentCoordinates,
        mapViewCenter,
        setMapViewCenter,
        mapMarkerPosition,
        setMapMarkerPosition,
        isLoading,
        propertyType,
        setPropertyType,
        userPersona,
        setUserPersona,
        selectedCoords: assessmentCoordinates,
        overrideMode,
        setOverrideMode,
        isReportModalOpen,
        setIsReportModalOpen,
        isLoginModalOpen,
        setIsLoginModalOpen,
        isPaymentModalOpen,
        setIsPaymentModalOpen,
        isAuditModalOpen,
        setIsAuditModalOpen,
        selectedPaymentPlan,
        setSelectedPaymentPlan,
        openPaymentModal,
        handleDownloadReportRequest,
        currentView,
        setCurrentView,
        isLoggedIn,
        setIsLoggedIn,
        currentUser,
        setCurrentUser,
        loginWithUser,
        activeAccountRole,
        setActiveAccountRole,
        accountEmail,
        loginAsRole,
        logout,
        runAssessmentForCoords,
        selectPreset,
        setManualScoreLevel,
        adminConfig,
        updateAdminConfig
      }}
    >
      {children}
      <DataProvenanceAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        assessment={assessment}
      />
    </AssessmentContext.Provider>
  );
};

export const useAssessment = () => {
  const context = useContext(AssessmentContext);
  if (!context) {
    throw new Error('useAssessment must be used within an AssessmentProvider');
  }
  return context;
};
