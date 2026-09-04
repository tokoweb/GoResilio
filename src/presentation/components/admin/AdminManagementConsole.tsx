'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAssessment, DEFAULT_ADMIN_CONFIG } from '../../context/AssessmentContext';
import { getPaidDossierQuota, normalizeUserTier, UserTier } from '../../../domain/types/UserTier';
import {
  LayoutDashboard,
  Users,
  SlidersHorizontal,
  Database,
  Mail,
  UserCheck,
  Plus,
  Search,
  CheckCircle2,
  Trash2,
  Edit,
  Save,
  Check,
  X,
  ChevronRight,
  RefreshCw,
  Sliders,
  FileText,
  Clock,
  ArrowUpRight,
  Globe,
  Settings,
  Key,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  LogOut,
  Menu,
  Phone,
  ExternalLink,
  MessageSquare,
  Calendar,
  MapPin,
  Building2,
  User,
  Tag,
  Filter,
  Droplets,
  Mountain,
  Flame,
  Send,
  AlertCircle,
  AlertTriangle,
  Info,
  Compass,
  Waves
} from 'lucide-react';

interface CustomerSubscription {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'Home Buyer' | 'Property Developer' | 'Lender / Bank' | 'Consultant / Auditor';
  organization: string;
  tier: 'Tier 1 (Gratis)' | 'Tier 2 Pro (Instant Rp 35rb)' | 'Tier 2 Pro (Bundling Rp 85rb)' | 'Tier 3 Enterprise';
  reportCredits: number;
  status: 'Aktif' | 'Tertunda' | 'Nonaktif';
  joinDate: string;
}

interface ConsultationInquiry {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  packageInterest: string;
  propertyLocation: string;
  preferredDate: string;
  notes: string;
  adminNotes: string;
  assignedExpert?: string;
  status: 'Baru' | 'Dalam Proses' | 'Selesai';
  createdAt: string;
}

interface ApiServerHealth {
  id: string;
  name: string;
  category: string;
  endpoint: string;
  authority: string;
  status: 'Online' | 'Gangguan' | 'Belum Diuji';
  latencyMs: number | null;
  lastChecked: string;
  httpStatus?: number | null;
}

const INITIAL_API_SERVERS: ApiServerHealth[] = [
  {
    id: 'srv-openmeteo',
    name: 'Data Elevasi & Topografi Digital',
    category: 'Topografi',
    endpoint: 'https://api.open-meteo.com/v1/elevation?latitude=-6.2088&longitude=106.8456',
    authority: 'Open-Meteo / Copernicus DEM 90m',
    status: 'Belum Diuji',
    latencyMs: null,
    lastChecked: '-',
    httpStatus: null
  },
  {
    id: 'srv-usgs',
    name: 'Katalog Gempa Internasional',
    category: 'Seismik',
    endpoint: 'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&limit=1',
    authority: 'United States Geological Survey (USGS)',
    status: 'Belum Diuji',
    latencyMs: null,
    lastChecked: '-',
    httpStatus: null
  },
  {
    id: 'srv-bmkg',
    name: 'Pusat Data Gempa & Cuaca Terkini',
    category: 'Seismik & Iklim',
    endpoint: 'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json',
    authority: 'Badan Meteorologi, Klimatologi, dan Geofisika (BMKG)',
    status: 'Belum Diuji',
    latencyMs: null,
    lastChecked: '-',
    httpStatus: null
  },
  {
    id: 'srv-overpass',
    name: 'Peta Jaringan Jalan & Saluran Air',
    category: 'Infrastruktur',
    endpoint: 'https://overpass-api.de/api/interpreter',
    authority: 'OpenStreetMap Foundation (Peta Global)',
    status: 'Belum Diuji',
    latencyMs: null,
    lastChecked: '-',
    httpStatus: null
  },
  {
    id: 'srv-osrm',
    name: 'Kalkulasi Aksesibilitas & Waktu Tempuh',
    category: 'Transportasi',
    endpoint: 'https://router.project-osrm.org/route/v1/driving/106.8456,-6.2088;106.8500,-6.2100?overview=false',
    authority: 'Open Source Routing Machine (OSRM)',
    status: 'Belum Diuji',
    latencyMs: null,
    lastChecked: '-',
    httpStatus: null
  },
  {
    id: 'srv-kemenkes',
    name: 'Direktori Rumah Sakit & Faskes Resmi',
    category: 'Kesehatan',
    endpoint: 'Terintegrasi pada Sistem',
    authority: 'Kementerian Kesehatan RI',
    status: 'Belum Diuji',
    latencyMs: null,
    lastChecked: '-',
    httpStatus: null
  },
  {
    id: 'srv-pusgen',
    name: 'Peta Jalur Sesar Aktif Nasional',
    category: 'Geologi',
    endpoint: 'Terintegrasi pada Sistem',
    authority: 'Pusat Studi Gempa Nasional (PusGen PUPR)',
    status: 'Belum Diuji',
    latencyMs: null,
    lastChecked: '-',
    httpStatus: null
  }
];

export const AdminManagementConsole: React.FC = () => {
  const { language, t } = useLanguage();
  const isEn = language === 'en';
  const { activeAccountRole, setActiveAccountRole, setCurrentView, adminConfig, updateAdminConfig, logout } = useAssessment();

  const cfg = adminConfig || DEFAULT_ADMIN_CONFIG;

  // Mobile sidebar drawer state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Navigation Tab: Overview, Scoring, Customers, Inbox, API Health, Account
  const [activeTab, setActiveTab] = useState<'overview' | 'scoring' | 'customers' | 'inbox' | 'api_health' | 'account'>('overview');

  // 1. Dashboard Multi-Hazard & Scoring Content Form State
  const [dashboardForm, setDashboardForm] = useState({
    dominantHazardWeight: cfg.dominantHazardWeight ?? DEFAULT_ADMIN_CONFIG.dominantHazardWeight,
    averageHazardWeight: cfg.averageHazardWeight ?? DEFAULT_ADMIN_CONFIG.averageHazardWeight,
    overallScoreOverride: cfg.overallScoreOverride ?? DEFAULT_ADMIN_CONFIG.overallScoreOverride,
    overallSummaryId: cfg.overallSummaryId ?? DEFAULT_ADMIN_CONFIG.overallSummaryId,

    lowRisk: { ...(cfg.lowRisk || DEFAULT_ADMIN_CONFIG.lowRisk) },
    mediumRisk: { ...(cfg.mediumRisk || DEFAULT_ADMIN_CONFIG.mediumRisk) },
    highRisk: { ...(cfg.highRisk || DEFAULT_ADMIN_CONFIG.highRisk) },
    extremeRisk: { ...(cfg.extremeRisk || DEFAULT_ADMIN_CONFIG.extremeRisk) },
    
    floodScore: cfg.floodScore ?? DEFAULT_ADMIN_CONFIG.floodScore,
    floodElevationMeters: cfg.floodElevationMeters ?? DEFAULT_ADMIN_CONFIG.floodElevationMeters,
    floodRainfallMm: cfg.floodRainfallMm ?? DEFAULT_ADMIN_CONFIG.floodRainfallMm,
    floodCauseId: cfg.floodCauseId ?? DEFAULT_ADMIN_CONFIG.floodCauseId,
    floodDirectiveId: cfg.floodDirectiveId ?? DEFAULT_ADMIN_CONFIG.floodDirectiveId,

    quakeScore: cfg.quakeScore ?? DEFAULT_ADMIN_CONFIG.quakeScore,
    quakeFaultName: cfg.quakeFaultName ?? DEFAULT_ADMIN_CONFIG.quakeFaultName,
    quakeDistanceKm: cfg.quakeDistanceKm ?? DEFAULT_ADMIN_CONFIG.quakeDistanceKm,
    quakePgaG: cfg.quakePgaG ?? DEFAULT_ADMIN_CONFIG.quakePgaG,
    quakeCauseId: cfg.quakeCauseId ?? DEFAULT_ADMIN_CONFIG.quakeCauseId,
    quakeDirectiveId: cfg.quakeDirectiveId ?? DEFAULT_ADMIN_CONFIG.quakeDirectiveId,

    heatScore: cfg.heatScore ?? DEFAULT_ADMIN_CONFIG.heatScore,
    heatAvgMaxTempC: cfg.heatAvgMaxTempC ?? DEFAULT_ADMIN_CONFIG.heatAvgMaxTempC,
    heatUhiFactor: cfg.heatUhiFactor ?? DEFAULT_ADMIN_CONFIG.heatUhiFactor,
    heatCauseId: cfg.heatCauseId ?? DEFAULT_ADMIN_CONFIG.heatCauseId,
    heatDirectiveId: cfg.heatDirectiveId ?? DEFAULT_ADMIN_CONFIG.heatDirectiveId
  });
  const [isSavedAlert, setIsSavedAlert] = useState(false);

  // 2. Customer Subscriptions State (Live MySQL Database)
  const [customers, setCustomers] = useState<CustomerSubscription[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [searchCustomerQuery, setSearchCustomerQuery] = useState('');
  const [customerRoleFilter, setCustomerRoleFilter] = useState('all');
  const [customerTierFilter, setCustomerTierFilter] = useState('all');
  const [customerSortBy, setCustomerSortBy] = useState<'latest' | 'oldest' | 'name_asc' | 'credits_desc'>('latest');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [customerFormData, setCustomerFormData] = useState<Partial<CustomerSubscription>>({
    fullName: '',
    email: '',
    phone: '',
    role: 'Home Buyer',
    organization: '',
    tier: 'Tier 1 (Gratis)',
    reportCredits: 0,
    status: 'Aktif'
  });

  // 3. Consultation Inquiries State (Live MySQL Database)
  const [inboxMessages, setInboxMessages] = useState<ConsultationInquiry[]>([]);
  const [isLoadingInbox, setIsLoadingInbox] = useState(false);
  const [selectedInquiryId, setSelectedInquiryId] = useState<string>('');
  const [inboxSearchQuery, setInboxSearchQuery] = useState('');
  const [inboxStatusFilter, setInboxStatusFilter] = useState<'all' | 'Baru' | 'Dalam Proses' | 'Selesai'>('all');
  const [adminNoteSaveAlert, setAdminNoteSaveAlert] = useState(false);

  // 4. API Servers Live Health Monitoring
  const [apiServers, setApiServers] = useState<ApiServerHealth[]>(INITIAL_API_SERVERS);
  const [isTestingApis, setIsTestingApis] = useState(false);

  // 5. Admin Profile
  const [adminProfile, setAdminProfile] = useState({
    fullName: 'Master Administrator (RDI & BGP)',
    email: 'admin.ops@gotangguh.id',
    phone: '+62 811-9988-0011',
    role: 'Super Admin / Lead Risk Auditor',
    organization: 'Resilience Development Initiative (RDI) & BGP Consultant'
  });
  const [isProfileSaved, setIsProfileSaved] = useState(false);

  // Load Real Data on Mount
  useEffect(() => {
    fetchCustomers();
    fetchInquiries();
  }, []);

  // Helper to format WhatsApp direct URL
  const getSanitizedWhatsAppUrl = (phone: string, name: string, location: string) => {
    if (!phone || phone === '-') return '#';
    let cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('08')) {
      cleaned = '628' + cleaned.slice(2);
    } else if (cleaned.startsWith('8')) {
      cleaned = '628' + cleaned.slice(1);
    } else if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.slice(1);
    }
    const greeting = `Halo ${name || 'Bapak/Ibu'}, kami dari Tim Ahli GoTangguh menindaklanjuti permohonan konsultasi dan survei tapak Anda terkait lokasi: ${location || 'Tapak Properti'}. Apakah ada waktu luang untuk berdiskusi?`;
    return `https://wa.me/${cleaned}?text=${encodeURIComponent(greeting)}`;
  };

  // Fetch Customers from API or Local Storage
  const fetchCustomers = async () => {
    setIsLoadingCustomers(true);
    try {
      const res = await fetch('/api/admin/customers');
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        const mapped: CustomerSubscription[] = data.data.map((u: any) => {
          const quota = getPaidDossierQuota(u.tierLevel, u.role);
          return {
            id: u.id,
            fullName: u.fullName || u.email,
            email: u.email,
            phone: u.phoneNumber || '-',
            role: (u.role || 'Home Buyer') as any,
            organization: u.organization || '-',
            tier: (u.tierLevel || 'Tier 1 (Gratis)') as any,
            reportCredits: quota,
            status: u.isVerified ? 'Aktif' : 'Tertunda',
            joinDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Hari ini'
          };
        });
        setCustomers(mapped);
      } else {
        const saved = localStorage.getItem('gotangguh_admin_customers');
        if (saved) setCustomers(JSON.parse(saved));
      }
    } catch {
      const saved = localStorage.getItem('gotangguh_admin_customers');
      if (saved) setCustomers(JSON.parse(saved));
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  // Fetch Consultation Inquiries from API or Local Storage
  const fetchInquiries = async () => {
    setIsLoadingInbox(true);
    try {
      const res = await fetch('/api/bookings');
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        const mapped: ConsultationInquiry[] = data.data.map((b: any) => {
          let uiStatus: 'Baru' | 'Dalam Proses' | 'Selesai' = 'Baru';
          if (b.status === 'SELESAI') uiStatus = 'Selesai';
          else if (b.status === 'DIKONFIRMASI' || b.status === 'SURVEI BERJALAN') uiStatus = 'Dalam Proses';

          return {
            id: b.id,
            fullName: b.clientName || 'Calon Klien',
            email: b.clientEmail || '-',
            phone: b.clientPhone || '-',
            role: 'Pencari Rumah / Pembeli Pribadi',
            packageInterest: b.packageType || 'Konsultasi Lite / Basic (Rp 300rb - 750rb)',
            propertyLocation: b.targetLocation || 'Lokasi Belum Ditentukan',
            preferredDate: b.scheduledDate || 'Segera Dikonfirmasi',
            notes: b.notes || 'Permohonan review data bencana & survei tapak.',
            adminNotes: b.assignedExpert ? `Ditugaskan ke: ${b.assignedExpert}` : '',
            assignedExpert: b.assignedExpert || 'Pak SAS (Lead Scientist)',
            status: uiStatus,
            createdAt: b.createdAt ? new Date(b.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Baru saja'
          };
        });
        setInboxMessages(mapped);
      } else {
        const saved = localStorage.getItem('gotangguh_admin_inbox');
        if (saved) setInboxMessages(JSON.parse(saved));
      }
    } catch {
      const saved = localStorage.getItem('gotangguh_admin_inbox');
      if (saved) setInboxMessages(JSON.parse(saved));
    } finally {
      setIsLoadingInbox(false);
    }
  };

  // Save Dashboard Scoring Config Handler
  const handleSaveDashboardConfig = () => {
    updateAdminConfig({
      dominantHazardWeight: dashboardForm.dominantHazardWeight,
      averageHazardWeight: dashboardForm.averageHazardWeight,
      overallScoreOverride: dashboardForm.overallScoreOverride,
      overallSummaryId: dashboardForm.overallSummaryId,
      overallSummaryEn: dashboardForm.overallSummaryId,

      lowRisk: { ...dashboardForm.lowRisk },
      mediumRisk: { ...dashboardForm.mediumRisk },
      highRisk: { ...dashboardForm.highRisk },
      extremeRisk: { ...dashboardForm.extremeRisk },

      floodScore: dashboardForm.floodScore,
      floodElevationMeters: dashboardForm.floodElevationMeters,
      floodRainfallMm: dashboardForm.floodRainfallMm,
      floodCauseId: dashboardForm.floodCauseId,
      floodDirectiveId: dashboardForm.floodDirectiveId,

      quakeScore: dashboardForm.quakeScore,
      quakeFaultName: dashboardForm.quakeFaultName,
      quakeDistanceKm: dashboardForm.quakeDistanceKm,
      quakePgaG: dashboardForm.quakePgaG,
      quakeCauseId: dashboardForm.quakeCauseId,
      quakeDirectiveId: dashboardForm.quakeDirectiveId,

      heatScore: dashboardForm.heatScore,
      heatAvgMaxTempC: dashboardForm.heatAvgMaxTempC,
      heatUhiFactor: dashboardForm.heatUhiFactor,
      heatCauseId: dashboardForm.heatCauseId,
      heatDirectiveId: dashboardForm.heatDirectiveId
    });

    setIsSavedAlert(true);
    setTimeout(() => setIsSavedAlert(false), 4000);
  };

  // Confirmation Modal State (Safe CRUD)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel?: string;
    confirmVariant?: 'danger' | 'primary';
    onConfirm: () => void;
  } | null>(null);

  // Customer Actions
  const handleOpenAddCustomer = () => {
    setEditingCustomerId(null);
    setCustomerFormData({
      fullName: '',
      email: '',
      phone: '',
      role: 'Home Buyer',
      organization: 'Perorangan',
      tier: 'Tier 1 (Gratis)',
      reportCredits: 0,
      status: 'Aktif'
    });
    setIsCustomerModalOpen(true);
  };

  const handleOpenEditCustomer = (c: CustomerSubscription) => {
    setEditingCustomerId(c.id);
    setCustomerFormData({ ...c });
    setIsCustomerModalOpen(true);
  };

  const handleSaveCustomer = async () => {
    if (!customerFormData.fullName || !customerFormData.email) {
      alert(isEn ? 'Full name and email are required.' : 'Nama lengkap dan email pelanggan wajib diisi.');
      return;
    }

    try {
      if (editingCustomerId) {
        await fetch('/api/admin/customers', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingCustomerId,
            fullName: customerFormData.fullName,
            role: customerFormData.role,
            organization: customerFormData.organization,
            phoneNumber: customerFormData.phone,
            tierLevel: customerFormData.tier
          })
        });
      } else {
        await fetch('/api/admin/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: customerFormData.fullName,
            email: customerFormData.email,
            phoneNumber: customerFormData.phone,
            role: customerFormData.role,
            organization: customerFormData.organization,
            tierLevel: customerFormData.tier
          })
        });
      }
      await fetchCustomers();
    } catch (err) {
      console.warn('Failed to persist customer to MySQL:', err);
    }
    setIsCustomerModalOpen(false);
  };

  const handleAddCreditsQuick = async (id: string, amount: number) => {
    const target = customers.find((c) => c.id === id);
    if (!target) return;
    const newCredits = Math.max(0, target.reportCredits + amount);
    setCustomers(customers.map((c) => (c.id === id ? { ...c, reportCredits: newCredits } : c)));
    try {
      await fetch('/api/admin/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          tierLevel: target.tier,
          role: target.role
        })
      });
    } catch (err) {
      console.warn('Failed to update credits in MySQL:', err);
    }
  };

  const handleDeleteCustomer = (id: string, name?: string) => {
    const targetName = name || customers.find((c) => c.id === id)?.fullName || 'Pengguna';
    setConfirmModal({
      isOpen: true,
      title: isEn ? 'Delete Customer Account?' : 'Konfirmasi Hapus Pengguna',
      message: isEn
        ? `Are you sure you want to permanently delete the customer account for "${targetName}"?`
        : `Apakah Anda yakin ingin menghapus akun pengguna "${targetName}" secara permanen dari sistem?`,
      confirmLabel: isEn ? 'Delete Customer' : 'Ya, Hapus Pengguna',
      cancelLabel: isEn ? 'Cancel' : 'Batal',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await fetch(`/api/admin/customers?id=${id}`, { method: 'DELETE' });
          await fetchCustomers();
        } catch (err) {
          console.warn('Failed to delete customer from MySQL:', err);
        }
        setConfirmModal(null);
      }
    });
  };

  // Inquiry Real MySQL Actions
  const handleUpdateInquiryStatus = async (id: string, newStatus: 'Baru' | 'Dalam Proses' | 'Selesai') => {
    setInboxMessages(inboxMessages.map((m) => (m.id === id ? { ...m, status: newStatus } : m)));
    let dbStatus = 'MENUNGGU DISPATCH';
    if (newStatus === 'Dalam Proses') dbStatus = 'DIKONFIRMASI';
    if (newStatus === 'Selesai') dbStatus = 'SELESAI';

    try {
      await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: dbStatus })
      });
    } catch (e) {
      console.warn('Failed to update booking status in MySQL:', e);
    }
  };

  const handleAssignExpert = async (id: string, expertName: string) => {
    setInboxMessages(inboxMessages.map((m) => (m.id === id ? { ...m, assignedExpert: expertName } : m)));
    try {
      await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, assignedExpert: expertName })
      });
    } catch (e) {
      console.warn('Failed to assign expert in MySQL:', e);
    }
  };

  const handleUpdateAdminNotes = async (id: string, note: string) => {
    setInboxMessages(inboxMessages.map((m) => (m.id === id ? { ...m, adminNotes: note } : m)));
    try {
      await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, notes: note })
      });
      setAdminNoteSaveAlert(true);
      setTimeout(() => setAdminNoteSaveAlert(false), 2500);
    } catch (e) {
      console.warn('Failed to save notes to MySQL:', e);
    }
  };

  // Real Dynamic API Gateway Latency Ping Testing
  const handleTestAllApis = async () => {
    setIsTestingApis(true);
    const updatedServers = await Promise.all(
      apiServers.map(async (srv) => {
        // For local verified database / spatial index, test internal health endpoint
        if (srv.endpoint.startsWith('Local') || srv.endpoint.startsWith('Spatial')) {
          const start = performance.now();
          try {
            const res = await fetch('/api/health');
            const latency = Math.round(performance.now() - start);
            return {
              ...srv,
              latencyMs: latency,
              status: (res.ok ? 'Online' : 'Gangguan') as 'Online' | 'Gangguan',
              lastChecked: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB',
              httpStatus: res.status
            };
          } catch {
            return {
              ...srv,
              latencyMs: null,
              status: 'Gangguan' as 'Gangguan',
              lastChecked: 'Gagal merespons',
              httpStatus: 500
            };
          }
        }

        // For external endpoints, perform live HTTP ping with timeout
        const start = performance.now();
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);
          const res = await fetch(srv.endpoint, {
            method: 'GET',
            signal: controller.signal,
            headers: { 'User-Agent': 'GoTangguh/1.0 (resilience@gotangguh.id)' }
          });
          clearTimeout(timeoutId);
          const latency = Math.round(performance.now() - start);
          return {
            ...srv,
            latencyMs: latency,
            status: (res.ok ? 'Online' : 'Gangguan') as 'Online' | 'Gangguan',
            lastChecked: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB',
            httpStatus: res.status
          };
        } catch {
          return {
            ...srv,
            latencyMs: null,
            status: 'Gangguan' as 'Gangguan',
            lastChecked: 'Timeout / Tidak merespons',
            httpStatus: 0
          };
        }
      })
    );
    setApiServers(updatedServers);
    setIsTestingApis(false);
  };

  // Filtered Lists
  const filteredCustomers = customers
    .filter((c) => {
      const q = searchCustomerQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.fullName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.organization.toLowerCase().includes(q);
      const matchesRole = customerRoleFilter === 'all' || c.role === customerRoleFilter;
      const matchesTier = customerTierFilter === 'all' || c.tier.toLowerCase().includes(customerTierFilter.toLowerCase());
      return matchesSearch && matchesRole && matchesTier;
    })
    .sort((a, b) => {
      if (customerSortBy === 'name_asc') return a.fullName.localeCompare(b.fullName);
      if (customerSortBy === 'credits_desc') return b.reportCredits - a.reportCredits;
      if (customerSortBy === 'oldest') return a.id.localeCompare(b.id);
      return b.id.localeCompare(a.id); // default 'latest'
    });

  const filteredInquiries = inboxMessages.filter((m) => {
    const matchesSearch =
      m.fullName.toLowerCase().includes(inboxSearchQuery.toLowerCase()) ||
      m.propertyLocation.toLowerCase().includes(inboxSearchQuery.toLowerCase()) ||
      m.packageInterest.toLowerCase().includes(inboxSearchQuery.toLowerCase());
    const matchesStatus = inboxStatusFilter === 'all' || m.status === inboxStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeInquiry = inboxMessages.find((m) => m.id === selectedInquiryId) || inboxMessages[0];

  // Financial Estimates from Pricing Model
  const instantRevenue = customers.filter((c) => c.tier.includes('Instant')).length * 35000;
  const bundlingRevenue = customers.filter((c) => c.tier.includes('Bundling')).length * 85000;
  const enterpriseRevenue = customers.filter((c) => c.tier.includes('Enterprise')).length * 2500000;
  const consultationRevenue = inboxMessages.filter((m) => m.status === 'Selesai' || m.status === 'Dalam Proses').length * 1500000;
  const totalRevenue = instantRevenue + bundlingRevenue + enterpriseRevenue + consultationRevenue;

  return (
    <div className="gt-calm-admin-shell">
      {/* Mobile Drawer Overlay Backdrop */}
      {isMobileMenuOpen && (
        <div className="gt-calm-mobile-backdrop" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* ===================================================================
          1. FIXED DESKTOP SIDEBAR & MOBILE SLIDE-IN DRAWER
          =================================================================== */}
      <aside className={`gt-calm-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="gt-calm-sidebar-top">
          <div className="gt-calm-logo-group">
            <div className="gt-calm-logo-box">GT</div>
            <div className="gt-calm-brand-text">
              <span className="gt-calm-brand-title">GoTangguh</span>
              <span className="gt-calm-brand-sub">Master Operations Console</span>
            </div>
          </div>
          <button
            type="button"
            className="gt-mobile-close-btn"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Tutup Menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Authenticated Admin Account Badge */}
        <div style={{ padding: '12px 14px', margin: '0 12px 14px', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <span style={{ display: 'block', fontSize: '0.66rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8' }}>
            {language === 'en' ? 'Logged In Authority' : 'Otoritas Akun Terverifikasi'}
          </span>
          <strong style={{ display: 'block', fontSize: '0.8rem', color: '#ffffff', marginTop: '2px' }}>
            Super Admin (RDI)
          </strong>
        </div>

        {/* Navigation Item Links */}
        {/* Navigation Item Links */}
        <nav className="gt-calm-nav" aria-label="Admin Menu">
          <button
            type="button"
            className={`gt-calm-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('overview');
              setIsMobileMenuOpen(false);
            }}
          >
            <LayoutDashboard size={16} />
            <span>{language === 'en' ? 'Executive Overview & Revenue' : 'Ringkasan & Finansial'}</span>
          </button>

          <button
            type="button"
            className={`gt-calm-nav-item ${activeTab === 'scoring' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('scoring');
              setIsMobileMenuOpen(false);
            }}
          >
            <SlidersHorizontal size={16} />
            <span>{language === 'en' ? 'Risk Scoring & Weights' : 'Formula Skor & Bobot'}</span>
          </button>

          <button
            type="button"
            className={`gt-calm-nav-item ${activeTab === 'customers' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('customers');
              setIsMobileMenuOpen(false);
            }}
          >
            <Users size={16} />
            <span>{language === 'en' ? 'Manage Customers' : 'Kelola Pelanggan'}</span>
            <span className="gt-calm-pill">{customers.length}</span>
          </button>

          <button
            type="button"
            className={`gt-calm-nav-item ${activeTab === 'inbox' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('inbox');
              setIsMobileMenuOpen(false);
            }}
          >
            <Mail size={16} />
            <span>{language === 'en' ? 'Consultation Inquiries' : 'Pesan Masuk Form'}</span>
            <span className="gt-calm-pill orange">
              {inboxMessages.filter((m) => m.status === 'Baru').length}
            </span>
          </button>

          <button
            type="button"
            className={`gt-calm-nav-item ${activeTab === 'api_health' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('api_health');
              setIsMobileMenuOpen(false);
            }}
          >
            <Activity size={16} />
            <span>{language === 'en' ? 'Data Sources & Services' : 'Koneksi Layanan & Data'}</span>
            <span className="gt-calm-pill" style={{ background: '#15803d', color: '#ffffff' }}>7 Aktif</span>
          </button>

          <button
            type="button"
            className={`gt-calm-nav-item ${activeTab === 'account' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('account');
              setIsMobileMenuOpen(false);
            }}
          >
            <Settings size={16} />
            <span>{language === 'en' ? 'Admin Profile Settings' : 'Pengaturan Akun Admin'}</span>
          </button>
        </nav>

        {/* Sidebar Bottom Area */}
        <div className="gt-calm-sidebar-bottom">
          <button
            type="button"
            className="gt-calm-btn-switch"
            onClick={() => {
              setActiveAccountRole('Home Buyer');
              setIsMobileMenuOpen(false);
            }}
          >
            <UserCheck size={14} />
            <span>{language === 'en' ? 'View Client Interface' : 'Lihat Tampilan Klien'}</span>
          </button>

          <button
            type="button"
            className="gt-calm-btn-logout"
            onClick={() => {
              setConfirmModal({
                isOpen: true,
                title: isEn ? 'Confirm Admin Sign Out' : 'Konfirmasi Keluar Sistem Pengelola',
                message: isEn
                  ? 'Are you sure you want to log out from GoTangguh Admin Console? Your current session will be safely terminated.'
                  : 'Apakah Anda yakin ingin keluar dari Konsol Manajemen GoTangguh? Sesi pengelola aktif Anda akan diakhiri secara aman.',
                confirmLabel: isEn ? 'Yes, Sign Out' : 'Ya, Keluar Sistem',
                confirmVariant: 'danger',
                onConfirm: () => {
                  setConfirmModal(null);
                  logout();
                }
              });
            }}
          >
            <LogOut size={14} />
            <span>{language === 'en' ? 'Sign Out' : 'Keluar Sistem'}</span>
          </button>
        </div>
      </aside>

      {/* ===================================================================
          2. MAIN OPERATIONS AREA
          =================================================================== */}
      <main className="gt-calm-main">
        {/* Sticky Topbar */}
        <header className="gt-calm-topbar">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              type="button"
              className="gt-mobile-hamburger"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Buka Menu"
            >
              <Menu size={18} />
            </button>

            <div className="gt-calm-breadcrumb">
              <span className="gt-cb-parent">{isEn ? 'Control Hub' : 'Pusat Kendali'}</span>
              <span className="gt-cb-sep">/</span>
              <span className="gt-cb-current">
                {activeTab === 'overview' && (isEn ? 'Platform Overview & Revenue' : 'Ringkasan Eksekutif & Omzet')}
                {activeTab === 'scoring' && (isEn ? 'Risk Scoring & Threshold Matrix' : 'Formula Skor & Ambang Batas Risiko')}
                {activeTab === 'customers' && (isEn ? 'Customer Management & Access' : 'Daftar Pelanggan & Hak Akses')}
                {activeTab === 'inbox' && (isEn ? 'Incoming Consultation Inquiries' : 'Permohonan Konsultasi Masuk')}
                {activeTab === 'api_health' && (isEn ? 'Data Sources & Service Connectivity' : 'Status Koneksi Layanan & Data')}
                {activeTab === 'account' && (isEn ? 'Admin Account Security' : 'Keamanan Akun Pengelola')}
              </span>
            </div>
          </div>

          <div className="gt-calm-topbar-actions">
            <button
              type="button"
              className="gt-calm-btn-ghost"
              onClick={() => setCurrentView('public')}
            >
              <Globe size={13} />
              <span>{isEn ? 'Preview Dashboard' : 'Pratinjau Dashboard'}</span>
            </button>

            {activeTab === 'scoring' && (
              <button
                type="button"
                className="gt-calm-btn-primary"
                onClick={handleSaveDashboardConfig}
              >
                <Save size={13} />
                <span>{isSavedAlert ? (isEn ? 'Saved & Active' : 'Tersimpan & Aktif') : (isEn ? 'Save & Apply Scores' : 'Simpan & Terapkan Skor')}</span>
              </button>
            )}

            {activeTab === 'customers' && (
              <button
                type="button"
                className="gt-calm-btn-primary"
                onClick={handleOpenAddCustomer}
              >
                <Plus size={13} />
                <span>{isEn ? 'Add Customer' : 'Tambah Pelanggan'}</span>
              </button>
            )}

            {activeTab === 'api_health' && (
              <button
                type="button"
                className="gt-calm-btn-primary"
                onClick={handleTestAllApis}
                disabled={isTestingApis}
              >
                <RefreshCw size={13} className={isTestingApis ? 'gt-spin-icon' : ''} />
                <span>{isTestingApis ? (isEn ? 'Checking...' : 'Memeriksa...') : (isEn ? 'Check All Connections' : 'Periksa Semua Koneksi')}</span>
              </button>
            )}
          </div>
        </header>

        {/* Horizontal Mobile Direct Tab Switcher Bar */}
        <div className="gt-mobile-quick-nav-bar" aria-label="Navigasi Cepat Admin">
          <button
            type="button"
            className={`gt-mq-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <LayoutDashboard size={13} />
            <span>{isEn ? 'Overview' : 'Ringkasan'}</span>
          </button>
          <button
            type="button"
            className={`gt-mq-tab-btn ${activeTab === 'scoring' ? 'active' : ''}`}
            onClick={() => setActiveTab('scoring')}
          >
            <SlidersHorizontal size={13} />
            <span>{isEn ? 'Scoring' : 'Skor'}</span>
          </button>
          <button
            type="button"
            className={`gt-mq-tab-btn ${activeTab === 'customers' ? 'active' : ''}`}
            onClick={() => setActiveTab('customers')}
          >
            <Users size={13} />
            <span>{isEn ? 'Customers' : 'Pelanggan'}</span>
            <span className="gt-mq-badge">{customers.length}</span>
          </button>
          <button
            type="button"
            className={`gt-mq-tab-btn ${activeTab === 'inbox' ? 'active' : ''}`}
            onClick={() => setActiveTab('inbox')}
          >
            <Mail size={13} />
            <span>{isEn ? 'Inbox' : 'Pesan'}</span>
            {inboxMessages.filter((m) => m.status === 'Baru').length > 0 && (
              <span className="gt-mq-badge orange">
                {inboxMessages.filter((m) => m.status === 'Baru').length}
              </span>
            )}
          </button>
          <button
            type="button"
            className={`gt-mq-tab-btn ${activeTab === 'api_health' ? 'active' : ''}`}
            onClick={() => setActiveTab('api_health')}
          >
            <Activity size={13} />
            <span>{isEn ? 'Services' : 'Koneksi Data'}</span>
          </button>
          <button
            type="button"
            className={`gt-mq-tab-btn ${activeTab === 'account' ? 'active' : ''}`}
            onClick={() => setActiveTab('account')}
          >
            <Settings size={13} />
            <span>{isEn ? 'Account' : 'Akun'}</span>
          </button>
        </div>

        <div className="gt-calm-content-container">
          {/* =================================================================
              TAB 0: EXECUTIVE OVERVIEW & REVENUE METRICS (ENTERPRISE LEDGER)
              ================================================================= */}
          {activeTab === 'overview' && (
            <div className="gt-calm-stack">
              {/* Clean Executive Business KPI Metrics Strip */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em' }}>
                    {isEn ? 'Registered Accounts' : 'Akun Pengguna Terdaftar'}
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                    {customers.length} <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#64748b' }}>{isEn ? 'Accounts' : 'Akun'}</span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '3px' }}>
                    {customers.filter((c) => c.status === 'Aktif').length} {isEn ? 'verified active accounts' : 'akun aktif terverifikasi'}
                  </div>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em' }}>
                    {isEn ? 'Consultation Inquiries' : 'Permohonan Konsultasi'}
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                    {inboxMessages.length} <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#64748b' }}>{isEn ? 'Dossiers' : 'Berkas'}</span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#ea580c', fontWeight: 700, marginTop: '3px' }}>
                    {inboxMessages.filter((m) => m.status === 'Baru').length} {isEn ? 'pending expert assignment' : 'menunggu penugasan tim ahli'}
                  </div>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em' }}>
                    {isEn ? 'Estimated Operational Volume' : 'Akumulasi Nilai Transaksi'}
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#166534', marginTop: '4px' }}>
                    Rp {totalRevenue.toLocaleString('id-ID')}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '3px' }}>
                    {isEn ? 'Calculated from active service tiers' : 'Dihitung dari distribusi paket aktif'}
                  </div>
                </div>
              </div>

              {/* Service Matrix & Financial Distribution Ledger */}
              <div className="gt-calm-panel">
                <div className="gt-calm-panel-header" style={{ marginBottom: '12px' }}>
                  <div>
                    <h3 className="gt-calm-panel-title">{isEn ? 'Service Matrix & Revenue Distribution' : 'Rekapitulasi Paket Layanan & Distribusi Finansial'}</h3>
                    <p className="gt-calm-panel-desc">{isEn ? 'Monetization metrics according to GoTangguh Tiered Pricing Model.' : 'Struktur tarif dan volume layanan sesuai dokumen konsep produk GoTangguh.'}</p>
                  </div>
                  <button
                    type="button"
                    style={{ padding: '6px 12px', fontSize: '0.76rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
                    onClick={() => { fetchCustomers(); fetchInquiries(); }}
                  >
                    <RefreshCw size={12} className={isLoadingCustomers || isLoadingInbox ? 'spin' : ''} />
                    <span>{isEn ? 'Refresh Data' : 'Segarkan Data'}</span>
                  </button>
                </div>

                <div className="gt-matrix-table-wrap">
                  <table className="gt-matrix-table">
                    <thead>
                      <tr>
                        <th style={{ width: '28%' }}>{isEn ? 'Service Package' : 'Paket Layanan'}</th>
                        <th style={{ width: '24%' }}>{isEn ? 'Target Persona & Deliverable' : 'Target Persona & Output'}</th>
                        <th style={{ width: '18%' }}>{isEn ? 'Unit Pricing (IDR)' : 'Tarif Satuan (IDR)'}</th>
                        <th style={{ width: '15%' }}>{isEn ? 'Registered Volume' : 'Volume Terdaftar'}</th>
                        <th style={{ width: '15%' }}>{isEn ? 'Subtotal Revenue' : 'Subtotal Omzet'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <strong>{isEn ? 'Tier 1 — Free Screening' : 'Paket Gratis (Screening Tapak)'}</strong>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{isEn ? 'Interactive Map & Multi-Hazard 0-100' : 'Peta interaktif & skor multi-hazard 0-100'}</div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.75rem', color: '#334155' }}>{isEn ? 'Public / Home Buyers' : 'Masyarakat / Calon Pembeli Rumah'}</span>
                        </td>
                        <td><span style={{ fontWeight: 700, color: '#64748b' }}>Rp 0</span></td>
                        <td><strong>{customers.filter((c) => c.tier.includes('Gratis') || c.tier.includes('Tier 1')).length}</strong> {isEn ? 'Accounts' : 'Akun'}</td>
                        <td><span style={{ color: '#64748b' }}>Rp 0</span></td>
                      </tr>

                      <tr>
                        <td>
                          <strong style={{ color: '#0369a1' }}>{isEn ? 'Tier 2 — Instant Report (1 Property)' : 'Paket Instant (1 Properti)'}</strong>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{isEn ? 'Automated 14-page PDF Dossier' : 'Dossier Laporan PDF 14 Halaman'}</div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.75rem', color: '#334155' }}>{isEn ? 'Home Seekers & Individual Buyers' : 'Pencari Rumah & Pembeli Pribadi'}</span>
                        </td>
                        <td><strong style={{ color: '#0369a1' }}>Rp 35.000</strong></td>
                        <td><strong>{customers.filter((c) => c.tier.includes('Instant')).length}</strong> {isEn ? 'Licenses' : 'Lisensi'}</td>
                        <td><strong style={{ color: '#0f172a' }}>Rp {instantRevenue.toLocaleString('id-ID')}</strong></td>
                      </tr>

                      <tr>
                        <td>
                          <strong style={{ color: '#c2410c' }}>{isEn ? 'Tier 2 — Bundling (3 Properties)' : 'Paket Bundling Komparasi (3 Properti)'}</strong>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{isEn ? 'Side-by-side comparative PDF dossiers' : 'Perbandingan 3 tapak sebelum bayar DP'}</div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.75rem', color: '#334155' }}>{isEn ? 'Property Decision Makers' : 'Pembeli Memilih Antar Lokasi'}</span>
                        </td>
                        <td><strong style={{ color: '#c2410c' }}>Rp 85.000</strong></td>
                        <td><strong>{customers.filter((c) => c.tier.includes('Bundling')).length}</strong> {isEn ? 'Packages' : 'Paket'}</td>
                        <td><strong style={{ color: '#0f172a' }}>Rp {bundlingRevenue.toLocaleString('id-ID')}</strong></td>
                      </tr>

                      <tr>
                        <td>
                          <strong style={{ color: '#16a34a' }}>{isEn ? 'Consultation Lite / Basic' : 'Konsultasi Lite / Basic'}</strong>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{isEn ? 'Online specialist review & discussion' : 'Review data & sesi konsultasi online ahli'}</div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.75rem', color: '#334155' }}>{isEn ? 'Home Renovators & Land Buyers' : 'Pemilik Rumah & Pembeli Lahan'}</span>
                        </td>
                        <td><span style={{ fontWeight: 700, color: '#16a34a' }}>Rp 300rb - 750rb</span></td>
                        <td><strong>{inboxMessages.filter((m) => m.packageInterest.toLowerCase().includes('lite') || m.packageInterest.toLowerCase().includes('basic')).length}</strong> {isEn ? 'Inquiries' : 'Berkas'}</td>
                        <td><strong style={{ color: '#0f172a' }}>Rp {(inboxMessages.filter((m) => m.packageInterest.toLowerCase().includes('lite') || m.packageInterest.toLowerCase().includes('basic')).length * 500000).toLocaleString('id-ID')}</strong></td>
                      </tr>

                      <tr>
                        <td>
                          <strong style={{ color: '#b45309' }}>{isEn ? 'Consultation Gold / On-Site Survey' : 'Konsultasi Gold / On-Site Survey'}</strong>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{isEn ? 'Physical field inspection (Civil/Architect)' : 'Kunjungan fisik Arsitek / Ahli Sipil ke tapak'}</div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.75rem', color: '#334155' }}>{isEn ? 'High-Value Property Buyers & Investors' : 'Pembeli Rumah Mewah & Investor'}</span>
                        </td>
                        <td><span style={{ fontWeight: 700, color: '#b45309' }}>Rp 1.5Jt - 5.0Jt</span></td>
                        <td><strong>{inboxMessages.filter((m) => m.packageInterest.toLowerCase().includes('gold') || m.packageInterest.toLowerCase().includes('survey') || m.packageInterest.toLowerCase().includes('survei')).length}</strong> {isEn ? 'Projects' : 'Proyek'}</td>
                        <td><strong style={{ color: '#0f172a' }}>Rp {consultationRevenue.toLocaleString('id-ID')}</strong></td>
                      </tr>

                      <tr>
                        <td>
                          <strong style={{ color: '#7c3aed' }}>{isEn ? 'Developer B2B & Banking' : 'Kemitraan Developer B2B & Perbankan'}</strong>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{isEn ? 'Masterplan risk auditing & Green Taxonomy' : 'Audit resiliensi kawasan & taksonomi hijau KPR'}</div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.75rem', color: '#334155' }}>{isEn ? 'Property Developers & Lenders' : 'Pengembang Properti & Divisi KPR Bank'}</span>
                        </td>
                        <td><span style={{ fontWeight: 700, color: '#7c3aed' }}>{isEn ? 'Enterprise Contract' : 'Kontrak Kerjasama'}</span></td>
                        <td><strong>{customers.filter((c) => c.tier.includes('Enterprise') || c.role === 'Property Developer' || c.role === 'Lender / Bank').length}</strong> {isEn ? 'Partners' : 'Mitra'}</td>
                        <td><strong style={{ color: '#0f172a' }}>Rp {enterpriseRevenue.toLocaleString('id-ID')}</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Real Live Inquiries Stream */}
              <div className="gt-calm-panel">
                <div className="gt-calm-panel-header">
                  <div>
                    <h3 className="gt-calm-panel-title">{isEn ? 'Recent Consultation Inquiries' : 'Antrean Permohonan Konsultasi Terbaru'}</h3>
                    <p className="gt-calm-panel-desc">{isEn ? 'Real-time incoming consultation dossiers from the public portal.' : 'Permohonan masuk langsung dari formulir konsultasi dan survei tapak website.'}</p>
                  </div>
                  <button
                    type="button"
                    className="gt-calm-btn-ghost"
                    style={{ fontSize: '0.76rem', border: '1px solid #cbd5e1' }}
                    onClick={() => setActiveTab('inbox')}
                  >
                    <Mail size={13} />
                    <span>{isEn ? 'Open Full Inbox' : 'Buka Inbox Lengkap'}</span>
                  </button>
                </div>

                {inboxMessages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 20px', color: '#94a3b8', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                    <Mail size={24} style={{ margin: '0 auto 8px', color: '#cbd5e1' }} />
                    <strong style={{ display: 'block', color: '#475569', fontSize: '0.86rem' }}>{isEn ? 'No consultation bookings recorded yet.' : 'Belum ada permohonan konsultasi yang masuk.'}</strong>
                    <span style={{ fontSize: '0.74rem' }}>{isEn ? 'New bookings submitted from the public site will appear here automatically.' : 'Permohonan baru yang dikirim calon klien melalui formulir website akan tampil di sini secara otomatis.'}</span>
                  </div>
                ) : (
                  <div className="gt-matrix-table-wrap">
                    <table className="gt-matrix-table">
                      <thead>
                        <tr>
                          <th style={{ width: '22%' }}>{isEn ? 'Client Name & Contact' : 'Nama & Kontak Klien'}</th>
                          <th style={{ width: '22%' }}>{isEn ? 'Package Requested' : 'Paket Diminta'}</th>
                          <th style={{ width: '26%' }}>{isEn ? 'Site Location' : 'Lokasi Tapak'}</th>
                          <th style={{ width: '16%' }}>{isEn ? 'Assigned Specialist' : 'Ahli Ditugaskan'}</th>
                          <th style={{ width: '14%' }}>{isEn ? 'Status' : 'Status'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inboxMessages.slice(0, 5).map((m) => {
                          const isNew = m.status === 'Baru';
                          const isProgress = m.status === 'Dalam Proses';
                          const isDone = m.status === 'Selesai';
                          return (
                            <tr key={m.id}>
                              <td>
                                <strong style={{ display: 'block', color: '#0f172a', fontSize: '0.82rem' }}>{m.fullName}</strong>
                                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>WA: {m.phone || '-'}</span>
                              </td>
                              <td>
                                <span style={{ fontSize: '0.76rem', fontWeight: 600, color: '#334155' }}>{m.packageInterest}</span>
                              </td>
                              <td>
                                <span style={{ fontSize: '0.74rem', color: '#475569', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{m.propertyLocation}</span>
                              </td>
                              <td>
                                <span style={{ fontSize: '0.74rem', color: '#0369a1', fontWeight: 600 }}>{m.assignedExpert || 'Belum Ditugaskan'}</span>
                              </td>
                              <td>
                                <span
                                  style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    padding: '3px 8px',
                                    borderRadius: '4px',
                                    background: isNew ? '#fff7ed' : isProgress ? '#f0f9ff' : '#f0fdf4',
                                    color: isNew ? '#c2410c' : isProgress ? '#0369a1' : '#16a34a',
                                    border: isNew ? '1px solid #fed7aa' : isProgress ? '1px solid #bae6fd' : '1px solid #bbf7d0',
                                    display: 'inline-block'
                                  }}
                                >
                                  {m.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Research Backing & Official Authority Footer Note */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Building2 size={18} style={{ color: '#475569', flexShrink: 0 }} />
                  <div>
                    <strong style={{ fontSize: '0.82rem', color: '#1e293b', display: 'block' }}>{isEn ? 'Official Scientific & Geotechnical Advisory' : 'Otoritas Ilmiah & Konsultan Pendukung'}</strong>
                    <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                      {isEn ? 'Platform validated by Pak SAS, Fellows from RDI (Resilience Development Initiative), and BGP Consultants.' : 'Metodologi asesmen divalidasi oleh Pak SAS, Peneliti Resilience Development Initiative (RDI), dan Tim Konsultan BGP.'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="gt-calm-btn-ghost"
                  style={{ fontSize: '0.74rem', whiteSpace: 'nowrap', border: '1px solid #cbd5e1' }}
                  onClick={() => setActiveTab('api_health')}
                >
                  <Activity size={13} />
                  <span>{isEn ? 'Inspect 7 Geospatial Data Nodes' : 'Cek 7 Node Data Geospasial'}</span>
                </button>
              </div>
            </div>
          )}

          {/* =================================================================
              TAB 1: SCORING & RISK THRESHOLD MATRIX
              ================================================================= */}
          {activeTab === 'scoring' && (
            <div className="gt-calm-stack">
              {/* Notification Banner */}
              {isSavedAlert && (
                <div style={{ background: '#ecfdf5', border: '1px solid #10b981', color: '#065f46', padding: '10px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', fontWeight: 700 }}>
                  <CheckCircle2 size={16} />
                  <span>{isEn ? 'Risk scores and thresholds successfully updated and applied.' : 'Skor dan ambang batas risiko berhasil diperbarui dan telah diterapkan ke halaman utama.'}</span>
                </div>
              )}

              {/* Section 1: Overall Scoring Formula */}
              <div className="gt-calm-panel">
                <div className="gt-calm-panel-header">
                  <div>
                    <h3 className="gt-calm-panel-title">{isEn ? '1. Multi-Hazard Scoring Weights & Executive Summary' : '1. Formula Bobot & Ringkasan Skor Multi-Hazard'}</h3>
                    <p className="gt-calm-panel-desc">
                      {isEn ? 'Configure dominant vs supplementary hazard weighting ratios and primary executive summary conclusions.' : 'Atur rasio pembobotan bahaya dominan terhadap bahaya pendukung, serta kalimat ringkasan status utama.'}
                    </p>
                  </div>
                </div>

                <div className="gt-calm-form-stack">
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#334155', fontWeight: 700, marginBottom: '8px' }}>
                      <span>{isEn ? 'Dominant Hazard Weight:' : 'Bobot Bahaya Dominan:'} <strong>{dashboardForm.dominantHazardWeight}%</strong></span>
                      <span>{isEn ? 'Supplementary Hazard Weight:' : 'Bobot Rata-rata Bahaya Lain:'} <strong>{100 - dashboardForm.dominantHazardWeight}%</strong></span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="90"
                      value={dashboardForm.dominantHazardWeight}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setDashboardForm({
                          ...dashboardForm,
                          dominantHazardWeight: val,
                          averageHazardWeight: 100 - val
                        });
                      }}
                      className="gt-calm-range"
                    />
                  </div>

                  <div className="gt-form-field">
                    <label>{isEn ? 'Primary Multi-Hazard Executive Conclusion Summary' : 'Kalimat Ringkasan Status Risiko Utama (Bahasa Indonesia)'}</label>
                    <input
                      type="text"
                      className="gt-calm-input"
                      value={dashboardForm.overallSummaryId}
                      onChange={(e) => setDashboardForm({ ...dashboardForm, overallSummaryId: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                    <button
                      type="button"
                      className="gt-calm-btn-primary"
                      onClick={handleSaveDashboardConfig}
                      style={{ padding: '7px 16px', fontSize: '0.78rem' }}
                    >
                      <Save size={13} />
                      <span>{isSavedAlert ? (isEn ? 'Saved & Active' : 'Tersimpan & Aktif') : (isEn ? 'Save Weights' : 'Simpan Formula Bobot')}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Section 2: Executive Risk Threshold Matrix (Clean Table Layout) */}
              <div className="gt-calm-panel">
                <div className="gt-calm-panel-header">
                  <div>
                    <h3 className="gt-calm-panel-title">{isEn ? '2. Risk Classification Threshold Matrix' : '2. Matriks Ambang Batas Klasifikasi Risiko'}</h3>
                    <p className="gt-calm-panel-desc">
                      {isEn ? 'Configure score boundaries, physical criteria descriptions, and property mitigation directives.' : 'Konfigurasi ambang batas rentang nilai skor, deskripsi kriteria fisik tapak, dan arahan mitigasi properti.'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      type="button"
                      className="gt-calm-btn-primary"
                      onClick={handleSaveDashboardConfig}
                      style={{ padding: '6px 14px', fontSize: '0.76rem' }}
                    >
                      <Save size={13} />
                      <span>{isSavedAlert ? (isEn ? 'Saved' : 'Tersimpan') : (isEn ? 'Save Matrix' : 'Simpan Matriks')}</span>
                    </button>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '3px 8px', background: '#f1f5f9', borderRadius: '6px', color: '#475569' }}>
                      SNI 1726 & PusGen 2024
                    </span>
                  </div>
                </div>

                {/* Continuous Visual Risk Spectrum Track */}
                <div className="gt-risk-continuum-wrapper">
                  <div className="gt-risk-continuum-header">
                    <span>{isEn ? 'Continuous Risk Spectrum (0 to 100)' : 'Spektrum Kontinum Risiko (0 s/d 100)'}</span>
                    <span>{isEn ? 'Based on RDI Disaster Resilience Standards' : 'Berdasarkan Standar Ketahanan Bencana RDI'}</span>
                  </div>
                  <div className="gt-risk-track-bar">
                    <div className="gt-risk-track-seg" style={{ width: `${dashboardForm.lowRisk?.maxScore ?? 30}%`, background: '#10b981' }} />
                    <div className="gt-risk-track-seg" style={{ width: `${(dashboardForm.mediumRisk?.maxScore ?? 60) - (dashboardForm.lowRisk?.maxScore ?? 30)}%`, background: '#f59e0b' }} />
                    <div className="gt-risk-track-seg" style={{ width: `${(dashboardForm.highRisk?.maxScore ?? 80) - (dashboardForm.mediumRisk?.maxScore ?? 60)}%`, background: '#ef4444' }} />
                    <div className="gt-risk-track-seg" style={{ width: `${100 - (dashboardForm.highRisk?.maxScore ?? 80)}%`, background: '#dc2626' }} />
                  </div>
                  <div className="gt-risk-legend-row">
                    <div className="gt-risk-legend-item">
                      <span className="gt-risk-legend-dot" style={{ background: '#10b981' }} />
                      <span>{isEn ? 'Low:' : 'Aman:'} 0 – {dashboardForm.lowRisk?.maxScore ?? 30}</span>
                    </div>
                    <div className="gt-risk-legend-item">
                      <span className="gt-risk-legend-dot" style={{ background: '#f59e0b' }} />
                      <span>{isEn ? 'Moderate:' : 'Sedang:'} {(dashboardForm.lowRisk?.maxScore ?? 30) + 1} – {dashboardForm.mediumRisk?.maxScore ?? 60}</span>
                    </div>
                    <div className="gt-risk-legend-item">
                      <span className="gt-risk-legend-dot" style={{ background: '#ef4444' }} />
                      <span>{isEn ? 'High:' : 'Bahaya:'} {(dashboardForm.mediumRisk?.maxScore ?? 60) + 1} – {dashboardForm.highRisk?.maxScore ?? 80}</span>
                    </div>
                    <div className="gt-risk-legend-item">
                      <span className="gt-risk-legend-dot" style={{ background: '#dc2626' }} />
                      <span>{isEn ? 'Extreme:' : 'Ekstrem:'} &gt; {dashboardForm.highRisk?.maxScore ?? 80} – 100</span>
                    </div>
                  </div>
                </div>

                {/* Clean Matrix Table */}
                <div className="gt-matrix-table-wrap">
                  <table className="gt-matrix-table">
                    <thead>
                      <tr>
                        <th style={{ width: '180px' }}>{isEn ? 'Risk Level' : 'Tingkat Risiko'}</th>
                        <th style={{ width: '130px' }}>{isEn ? 'Max Score Limit' : 'Batas Skor Maks'}</th>
                        <th>{isEn ? 'Physical Site Criteria (Elevation, Faults, Thermal)' : 'Kriteria Fisik Tapak (Elevasi, Sesar, Suhu)'}</th>
                        <th>{isEn ? 'Mitigation & Transaction Directives' : 'Arahan Mitigasi & Transaksi Properti'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* LEVEL 1: AMAN */}
                      <tr>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span className="gt-matrix-tier-pill low">
                              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }} />
                              {dashboardForm.lowRisk?.labelId ?? 'Aman / Rendah'}
                            </span>
                            <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Skor 0 s/d {dashboardForm.lowRisk?.maxScore ?? 30}</span>
                          </div>
                        </td>
                        <td>
                          <input
                            type="number"
                            className="gt-calm-input"
                            value={dashboardForm.lowRisk?.maxScore ?? 30}
                            onChange={(e) =>
                              setDashboardForm({
                                ...dashboardForm,
                                lowRisk: { ...(dashboardForm.lowRisk || DEFAULT_ADMIN_CONFIG.lowRisk), maxScore: Number(e.target.value) }
                              })
                            }
                          />
                        </td>
                        <td>
                          <textarea
                            rows={2}
                            className="gt-calm-input"
                            value={dashboardForm.lowRisk?.criteriaDescriptionId ?? ''}
                            onChange={(e) =>
                              setDashboardForm({
                                ...dashboardForm,
                                lowRisk: { ...(dashboardForm.lowRisk || DEFAULT_ADMIN_CONFIG.lowRisk), criteriaDescriptionId: e.target.value }
                              })
                            }
                          />
                        </td>
                        <td>
                          <textarea
                            rows={2}
                            className="gt-calm-input"
                            value={dashboardForm.lowRisk?.recommendationDirectiveId ?? ''}
                            onChange={(e) =>
                              setDashboardForm({
                                ...dashboardForm,
                                lowRisk: { ...(dashboardForm.lowRisk || DEFAULT_ADMIN_CONFIG.lowRisk), recommendationDirectiveId: e.target.value }
                              })
                            }
                          />
                        </td>
                      </tr>

                      {/* LEVEL 2: SEDANG */}
                      <tr>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span className="gt-matrix-tier-pill medium">
                              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#f59e0b' }} />
                              {dashboardForm.mediumRisk?.labelId ?? 'Sedang / Waspada'}
                            </span>
                            <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Skor {(dashboardForm.lowRisk?.maxScore ?? 30) + 1} s/d {dashboardForm.mediumRisk?.maxScore ?? 60}</span>
                          </div>
                        </td>
                        <td>
                          <input
                            type="number"
                            className="gt-calm-input"
                            value={dashboardForm.mediumRisk?.maxScore ?? 60}
                            onChange={(e) =>
                              setDashboardForm({
                                ...dashboardForm,
                                mediumRisk: { ...(dashboardForm.mediumRisk || DEFAULT_ADMIN_CONFIG.mediumRisk), maxScore: Number(e.target.value) }
                              })
                            }
                          />
                        </td>
                        <td>
                          <textarea
                            rows={2}
                            className="gt-calm-input"
                            value={dashboardForm.mediumRisk?.criteriaDescriptionId ?? ''}
                            onChange={(e) =>
                              setDashboardForm({
                                ...dashboardForm,
                                mediumRisk: { ...(dashboardForm.mediumRisk || DEFAULT_ADMIN_CONFIG.mediumRisk), criteriaDescriptionId: e.target.value }
                              })
                            }
                          />
                        </td>
                        <td>
                          <textarea
                            rows={2}
                            className="gt-calm-input"
                            value={dashboardForm.mediumRisk?.recommendationDirectiveId ?? ''}
                            onChange={(e) =>
                              setDashboardForm({
                                ...dashboardForm,
                                mediumRisk: { ...(dashboardForm.mediumRisk || DEFAULT_ADMIN_CONFIG.mediumRisk), recommendationDirectiveId: e.target.value }
                              })
                            }
                          />
                        </td>
                      </tr>

                      {/* LEVEL 3: TINGGI */}
                      <tr>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span className="gt-matrix-tier-pill high">
                              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ef4444' }} />
                              {dashboardForm.highRisk?.labelId ?? 'Tinggi / Bahaya'}
                            </span>
                            <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Skor {(dashboardForm.mediumRisk?.maxScore ?? 60) + 1} s/d {dashboardForm.highRisk?.maxScore ?? 80}</span>
                          </div>
                        </td>
                        <td>
                          <input
                            type="number"
                            className="gt-calm-input"
                            value={dashboardForm.highRisk?.maxScore ?? 80}
                            onChange={(e) =>
                              setDashboardForm({
                                ...dashboardForm,
                                highRisk: { ...(dashboardForm.highRisk || DEFAULT_ADMIN_CONFIG.highRisk), maxScore: Number(e.target.value) }
                              })
                            }
                          />
                        </td>
                        <td>
                          <textarea
                            rows={2}
                            className="gt-calm-input"
                            value={dashboardForm.highRisk?.criteriaDescriptionId ?? ''}
                            onChange={(e) =>
                              setDashboardForm({
                                ...dashboardForm,
                                highRisk: { ...(dashboardForm.highRisk || DEFAULT_ADMIN_CONFIG.highRisk), criteriaDescriptionId: e.target.value }
                              })
                            }
                          />
                        </td>
                        <td>
                          <textarea
                            rows={2}
                            className="gt-calm-input"
                            value={dashboardForm.highRisk?.recommendationDirectiveId ?? ''}
                            onChange={(e) =>
                              setDashboardForm({
                                ...dashboardForm,
                                highRisk: { ...(dashboardForm.highRisk || DEFAULT_ADMIN_CONFIG.highRisk), recommendationDirectiveId: e.target.value }
                              })
                            }
                          />
                        </td>
                      </tr>

                      {/* LEVEL 4: EKSTREM */}
                      <tr>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span className="gt-matrix-tier-pill extreme">
                              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#dc2626' }} />
                              {dashboardForm.extremeRisk?.labelId ?? 'Ekstrem / Kritis'}
                            </span>
                            <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Skor &gt; {dashboardForm.highRisk?.maxScore ?? 80} s/d 100</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b', padding: '8px' }}>
                            Max 100
                          </div>
                        </td>
                        <td>
                          <textarea
                            rows={2}
                            className="gt-calm-input"
                            value={dashboardForm.extremeRisk?.criteriaDescriptionId ?? ''}
                            onChange={(e) =>
                              setDashboardForm({
                                ...dashboardForm,
                                extremeRisk: { ...(dashboardForm.extremeRisk || DEFAULT_ADMIN_CONFIG.extremeRisk), criteriaDescriptionId: e.target.value }
                              })
                            }
                          />
                        </td>
                        <td>
                          <textarea
                            rows={2}
                            className="gt-calm-input"
                            value={dashboardForm.extremeRisk?.recommendationDirectiveId ?? ''}
                            onChange={(e) =>
                              setDashboardForm({
                                ...dashboardForm,
                                extremeRisk: { ...(dashboardForm.extremeRisk || DEFAULT_ADMIN_CONFIG.extremeRisk), recommendationDirectiveId: e.target.value }
                              })
                            }
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 3: Hazard Parameter Cards */}
              <div className="gt-calm-panel">
                <div className="gt-calm-panel-header">
                  <div>
                    <h3 className="gt-calm-panel-title">{isEn ? '3. Specific Hazard Parameters & Directives' : '3. Parameter & Keterangan Kartu Bahaya Spesifik'}</h3>
                    <p className="gt-calm-panel-desc">{isEn ? 'Adjust default scores, physical parameters, causal diagnostics, and mitigation directives per hazard.' : 'Sesuaikan skor default, parameter fisik, analisis penyebab, dan panduan mitigasi per bahaya.'}</p>
                  </div>
                </div>

                <div className="gt-calm-stack">
                  {/* Flood Parameter Card */}
                  <div className="gt-param-card">
                    <div className="gt-param-card-head">
                      <div className="gt-param-card-title">
                        <Droplets size={16} style={{ color: '#0284c7' }} />
                        <span>{isEn ? 'Inundation Flood Hazard (Copernicus DEM & Fluvial Basin)' : 'Bahaya Banjir Genangan (Copernicus DEM & Fluvial Basin)'}</span>
                      </div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, background: '#f0f9ff', color: '#0369a1', padding: '2px 8px', borderRadius: '4px' }}>
                        {isEn ? 'Score:' : 'Skor:'} {dashboardForm.floodScore ?? 85} / 100
                      </span>
                    </div>

                    <div className="gt-calm-form-grid-3">
                      <div className="gt-form-field">
                        <label>{isEn ? 'Flood Hazard Score (0-100)' : 'Skor Bahaya Banjir (0-100)'}</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          className="gt-calm-input"
                          value={dashboardForm.floodScore ?? 85}
                          onChange={(e) => setDashboardForm({ ...dashboardForm, floodScore: Number(e.target.value) })}
                        />
                      </div>

                      <div className="gt-form-field">
                        <label>{isEn ? 'Site Topography Elevation (m ASL)' : 'Elevasi Topografi (m dpl)'}</label>
                        <input
                          type="number"
                          step="0.1"
                          className="gt-calm-input"
                          value={dashboardForm.floodElevationMeters ?? 4.2}
                          onChange={(e) => setDashboardForm({ ...dashboardForm, floodElevationMeters: Number(e.target.value) })}
                        />
                      </div>

                      <div className="gt-form-field">
                        <label>{isEn ? '24h Extreme Rainfall (mm/day)' : 'Curah Hujan 24 Jam (mm/hari)'}</label>
                        <input
                          type="number"
                          className="gt-calm-input"
                          value={dashboardForm.floodRainfallMm ?? 185}
                          onChange={(e) => setDashboardForm({ ...dashboardForm, floodRainfallMm: Number(e.target.value) })}
                        />
                      </div>
                    </div>

                    {/* Condition Threshold Guide for Flood */}
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px', fontSize: '0.74rem', color: '#334155' }}>
                      <div style={{ fontWeight: 800, marginBottom: '6px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Info size={13} style={{ color: '#0284c7' }} />
                        <span>{isEn ? 'Physical Inundation & Elevation Threshold Matrix' : 'Panduan Kriteria Fisik & Ambang Batas Bahaya Banjir'}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '6px 8px' }}>
                          <strong style={{ color: '#166534' }}>{isEn ? 'Low (0–30):' : 'Rendah (0–30):'}</strong> {isEn ? 'Elevation > 15m ASL, river distance > 1,000m, rainfall < 60mm/24h. Low overflow hazard, gravity drainage.' : 'Elevasi > 15m dpl, jarak sungai > 1.000m, hujan < 60mm/24h. Potensi genangan luapan relatif rendah, drainase lancar.'}
                        </div>
                        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', padding: '6px 8px' }}>
                          <strong style={{ color: '#92400e' }}>{isEn ? 'Moderate (31–60):' : 'Sedang (31–60):'}</strong> {isEn ? 'Elevation 6–15m ASL, river distance 300–1,000m, rainfall 60–120mm. Brief 0.2–0.5m ponding.' : 'Elevasi 6–15m dpl, jarak sungai 300–1.000m, hujan 60–120mm. Potensi genangan lokal singkat. Disarankan biopori.'}
                        </div>
                        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '6px 8px' }}>
                          <strong style={{ color: '#991b1b' }}>{isEn ? 'Critical (61–100):' : 'Tinggi / Kritis (61–100):'}</strong> {isEn ? 'Elevation < 5m ASL (Depression), river distance < 200m, rainfall > 150mm. Mandatory +60cm slab elevation.' : 'Elevasi < 5m dpl (Indikasi cekungan/DAS), jarak sungai < 200m, hujan lebat. Disarankan peninggian peil lantai & katup anti-balik.'}
                        </div>
                      </div>
                    </div>

                    <div className="gt-calm-form-grid-2">
                      <div className="gt-form-field">
                        <label>{isEn ? 'Fluvial Inundation Causal Analysis' : 'Analisis Penyebab Genangan'}</label>
                        <textarea
                          rows={2}
                          className="gt-calm-input"
                          value={dashboardForm.floodCauseId ?? ''}
                          onChange={(e) => setDashboardForm({ ...dashboardForm, floodCauseId: e.target.value })}
                        />
                      </div>

                      <div className="gt-form-field">
                        <label>{isEn ? 'Finished Floor Level & Drainage Directives' : 'Arahan Mitigasi Peil Lantai & Drainase'}</label>
                        <textarea
                          rows={2}
                          className="gt-calm-input"
                          value={dashboardForm.floodDirectiveId ?? ''}
                          onChange={(e) => setDashboardForm({ ...dashboardForm, floodDirectiveId: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quake Parameter Card */}
                  <div className="gt-param-card">
                    <div className="gt-param-card-head">
                      <div className="gt-param-card-title">
                        <Mountain size={16} style={{ color: '#ea580c' }} />
                        <span>{isEn ? 'Earthquake & Fault Line Hazard (PusGen 2024)' : 'Bahaya Gempa Bumi & Patahan Aktif (PusGen 2024)'}</span>
                      </div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, background: '#fff7ed', color: '#c2410c', padding: '2px 8px', borderRadius: '4px' }}>
                        {isEn ? 'Score:' : 'Skor:'} {dashboardForm.quakeScore ?? 78} / 100
                      </span>
                    </div>

                    <div className="gt-calm-form-grid-3">
                      <div className="gt-form-field">
                        <label>{isEn ? 'Seismic Hazard Score (0-100)' : 'Skor Bahaya Gempa (0-100)'}</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          className="gt-calm-input"
                          value={dashboardForm.quakeScore ?? 78}
                          onChange={(e) => setDashboardForm({ ...dashboardForm, quakeScore: Number(e.target.value) })}
                        />
                      </div>

                      <div className="gt-form-field">
                        <label>{isEn ? 'Nearest Active Fault Line (km)' : 'Jarak Sesar Terdekat (km)'}</label>
                        <input
                          type="number"
                          step="0.1"
                          className="gt-calm-input"
                          value={dashboardForm.quakeDistanceKm ?? 8.2}
                          onChange={(e) => setDashboardForm({ ...dashboardForm, quakeDistanceKm: Number(e.target.value) })}
                        />
                      </div>

                      <div className="gt-form-field">
                        <label>{isEn ? 'Peak Ground Acceleration (g)' : 'Percepatan Batuan Dasar PGA (g)'}</label>
                        <input
                          type="number"
                          step="0.01"
                          className="gt-calm-input"
                          value={dashboardForm.quakePgaG ?? 0.38}
                          onChange={(e) => setDashboardForm({ ...dashboardForm, quakePgaG: Number(e.target.value) })}
                        />
                      </div>
                    </div>

                    {/* Condition Threshold Guide for Quake */}
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px', fontSize: '0.74rem', color: '#334155' }}>
                      <div style={{ fontWeight: 800, marginBottom: '6px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Info size={13} style={{ color: '#0284c7' }} />
                        <span>{isEn ? 'PusGen 2024 & SNI 1726 Seismic Proximity Thresholds' : 'Panduan Jarak Sesar PusGen 2024 & SNI 1726'}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '6px 8px' }}>
                          <strong style={{ color: '#166534' }}>{isEn ? 'Low (0–30):' : 'Rendah (0–30):'}</strong> {isEn ? 'Fault distance > 30km, PGA < 0.10g. Standard reinforced framing.' : 'Jarak sesar > 30km, PGA < 0.10g. Standar struktur kolom praktis sederhana.'}
                        </div>
                        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', padding: '6px 8px' }}>
                          <strong style={{ color: '#92400e' }}>{isEn ? 'Moderate (31–60):' : 'Sedang (31–60):'}</strong> {isEn ? 'Fault distance 10–30km, PGA 0.10–0.25g. Mandatory column ties dia. 8mm pitch 100mm.' : 'Jarak sesar 10–30km, PGA 0.10–0.25g. Wajib sengkang kolom min. dia. 8mm jarak 100mm.'}
                        </div>
                        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '6px 8px' }}>
                          <strong style={{ color: '#991b1b' }}>{isEn ? 'High / Critical (61–100):' : 'Tinggi / Kritis (61–100):'}</strong> {isEn ? 'Fault distance < 10km, PGA > 0.25g. Mandatory ductile frame SNI 1726 & CPT soil investigation.' : 'Jarak sesar < 10km, PGA > 0.25g. Wajib struktur daktil SNI 1726:2019 & uji sondir CPT.'}
                        </div>
                      </div>
                    </div>

                    <div className="gt-form-field">
                      <label>{isEn ? 'Active Fault Segment Identifier' : 'Nama Segmen Sesar Aktif (PusGen 2024)'}</label>
                      <input
                        type="text"
                        className="gt-calm-input"
                        value={dashboardForm.quakeFaultName ?? ''}
                        onChange={(e) => setDashboardForm({ ...dashboardForm, quakeFaultName: e.target.value })}
                      />
                    </div>

                    <div className="gt-calm-form-grid-2">
                      <div className="gt-form-field">
                        <label>{isEn ? 'Seismic Potential Diagnostics' : 'Analisis Potensi Gempa'}</label>
                        <textarea
                          rows={2}
                          className="gt-calm-input"
                          value={dashboardForm.quakeCauseId ?? ''}
                          onChange={(e) => setDashboardForm({ ...dashboardForm, quakeCauseId: e.target.value })}
                        />
                      </div>

                      <div className="gt-form-field">
                        <label>{isEn ? 'SNI 1726 Structural Directives' : 'Arahan Mitigasi Struktur Beton SNI 1726'}</label>
                        <textarea
                          rows={2}
                          className="gt-calm-input"
                          value={dashboardForm.quakeDirectiveId ?? ''}
                          onChange={(e) => setDashboardForm({ ...dashboardForm, quakeDirectiveId: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Heat Parameter Card */}
                  <div className="gt-param-card">
                    <div className="gt-param-card-head">
                      <div className="gt-param-card-title">
                        <Flame size={16} style={{ color: '#dc2626' }} />
                        <span>{isEn ? 'Extreme Heat & Thermal Stress (Open-Meteo ERA5 / Copernicus)' : 'Bahaya Suhu Ekstrem & Beban Termal (Open-Meteo ERA5)'}</span>
                      </div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, background: '#fef2f2', color: '#b91c1c', padding: '2px 8px', borderRadius: '4px' }}>
                        {isEn ? 'Score:' : 'Skor:'} {dashboardForm.heatScore ?? 74} / 100
                      </span>
                    </div>

                    <div className="gt-calm-form-grid-3">
                      <div className="gt-form-field">
                        <label>{isEn ? 'Heat Hazard Score (0-100)' : 'Skor Bahaya Panas (0-100)'}</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          className="gt-calm-input"
                          value={dashboardForm.heatScore ?? 74}
                          onChange={(e) => setDashboardForm({ ...dashboardForm, heatScore: Number(e.target.value) })}
                        />
                      </div>

                      <div className="gt-form-field">
                        <label>{isEn ? 'Mean Maximum Temperature (°C)' : 'Suhu Maks Rata-Rata (°C)'}</label>
                        <input
                          type="number"
                          step="0.1"
                          className="gt-calm-input"
                          value={dashboardForm.heatAvgMaxTempC ?? 34.8}
                          onChange={(e) => setDashboardForm({ ...dashboardForm, heatAvgMaxTempC: Number(e.target.value) })}
                        />
                      </div>

                      <div className="gt-form-field">
                        <label>{isEn ? 'Heat Stress Model Level' : 'Tingkat Model Beban Termal'}</label>
                        <input
                          type="text"
                          className="gt-calm-input"
                          value={dashboardForm.heatUhiFactor ?? ''}
                          onChange={(e) => setDashboardForm({ ...dashboardForm, heatUhiFactor: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Condition Threshold Guide for Heat */}
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px', fontSize: '0.74rem', color: '#334155' }}>
                      <div style={{ fontWeight: 800, marginBottom: '6px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Info size={13} style={{ color: '#0284c7' }} />
                        <span>{isEn ? 'Urban Microclimate & Vegetation Index (KDH) Thresholds' : 'Panduan Suhu Mikro & Ambang Batas KDH Lingkungan'}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '6px 8px' }}>
                          <strong style={{ color: '#166534' }}>{isEn ? 'Low (0–30):' : 'Rendah (0–30):'}</strong> {isEn ? 'Daily temp < 31°C, green cover > 40%. Naturally cool microclimate.' : 'Suhu harian < 31°C, tutupan hijau (KDH) > 40%. Iklim mikro sejuk alami.'}
                        </div>
                        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', padding: '6px 8px' }}>
                          <strong style={{ color: '#92400e' }}>{isEn ? 'Moderate (31–60):' : 'Sedang (31–60):'}</strong> {isEn ? 'Daily temp 31–34°C, green cover 20–40%. Adequate cross-ventilation.' : 'Suhu 31–34°C, tutupan hijau 20–40%. Ventilasi silang memadai.'}
                        </div>
                        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '6px 8px' }}>
                          <strong style={{ color: '#991b1b' }}>{isEn ? 'High / Critical (61–100):' : 'Tinggi / Kritis (61–100):'}</strong> {isEn ? 'Daily temp > 34°C, asphalt cover > 80%. Roof insulation & shade recommended.' : 'Suhu > 34°C, tutupan aspal tinggi. Disarankan insulasi atap & penambahan vegetasi.'}
                        </div>
                      </div>
                    </div>

                    <div className="gt-calm-form-grid-2">
                      <div className="gt-form-field">
                        <label>{isEn ? 'Thermal & Land Cover Analysis' : 'Analisis Suhu & Tutupan Lahan'}</label>
                        <textarea
                          rows={2}
                          className="gt-calm-input"
                          value={dashboardForm.heatCauseId ?? ''}
                          onChange={(e) => setDashboardForm({ ...dashboardForm, heatCauseId: e.target.value })}
                        />
                      </div>

                      <div className="gt-form-field">
                        <label>{isEn ? 'Thermal Mitigation & KDH Directives' : 'Arahan Mitigasi Termal & KDH'}</label>
                        <textarea
                          rows={2}
                          className="gt-calm-input"
                          value={dashboardForm.heatDirectiveId ?? ''}
                          onChange={(e) => setDashboardForm({ ...dashboardForm, heatDirectiveId: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 3 Big Save Action Bar */}
                  <div style={{ marginTop: '14px', padding: '16px 20px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <strong style={{ fontSize: '0.88rem', color: '#0f172a', display: 'block', marginBottom: '2px' }}>
                        {isEn ? 'Apply Scoring Parameters & Mitigation Directives' : 'Terapkan Skor & Panduan Mitigasi Fisik'}
                      </strong>
                      <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                        {isEn ? 'Saves all weights, threshold matrices, and site parameters directly into the live assessment engine.' : 'Menyimpan seluruh formula bobot, matriks ambang batas, dan parameter tapak ke sistem.'}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="gt-calm-btn-primary"
                      style={{ padding: '9px 20px', fontSize: '0.84rem', fontWeight: 800 }}
                      onClick={handleSaveDashboardConfig}
                    >
                      <Save size={15} />
                      <span>{isSavedAlert ? (isEn ? 'Saved & Active' : 'Tersimpan & Aktif') : (isEn ? 'Save & Apply Score Changes' : 'Simpan & Terapkan Perubahan Skor')}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              TAB 2: CUSTOMERS & SUBSCRIPTIONS (PORTFOLIO PENGGUNA)
              ================================================================= */}
          {activeTab === 'customers' && (
            <div className="gt-calm-panel">
              <div className="gt-calm-panel-header" style={{ marginBottom: '14px' }}>
                <div>
                  <h3 className="gt-calm-panel-title">{isEn ? 'Customer Database & Access Rights' : 'Manajemen Pelanggan & Hak Akses Pengguna'}</h3>
                  <p className="gt-calm-panel-desc">{isEn ? 'Manage membership status, multi-hazard report quotas, and institutional subscription tiers.' : 'Kelola status keanggotaan, kuota laporan multi-hazard, dan tingkat langganan institusi.'}</p>
                </div>
                <button
                  type="button"
                  className="gt-calm-btn-primary"
                  onClick={handleOpenAddCustomer}
                >
                  <Plus size={13} />
                  <span>{isEn ? 'Add New Customer' : 'Tambah Pengguna Baru'}</span>
                </button>
              </div>

              {/* Multi-Facet Filter Bar */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Search Input */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '7px 12px', flex: '1 1 260px' }}>
                  <Search size={14} style={{ color: '#94a3b8' }} />
                  <input
                    type="text"
                    style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.8rem' }}
                    placeholder={isEn ? 'Search name, email, organization, or phone...' : 'Cari nama, email, instansi, atau nomor WA...'}
                    value={searchCustomerQuery}
                    onChange={(e) => setSearchCustomerQuery(e.target.value)}
                  />
                  {searchCustomerQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchCustomerQuery('')}
                      style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Filter by Role */}
                <select
                  className="gt-calm-select"
                  style={{ width: 'auto', fontSize: '0.78rem', minWidth: '150px' }}
                  value={customerRoleFilter}
                  onChange={(e) => setCustomerRoleFilter(e.target.value)}
                >
                  <option value="all">{isEn ? `All Roles (${customers.length})` : `Semua Peran (${customers.length})`}</option>
                  <option value="Home Buyer">Home Buyer</option>
                  <option value="Property Developer">Property Developer</option>
                  <option value="Lender / Bank">Lender / Bank</option>
                  <option value="Consultant / Auditor">Consultant</option>
                  <option value="Super Admin">Super Admin</option>
                </select>

                {/* Filter by Tier */}
                <select
                  className="gt-calm-select"
                  style={{ width: 'auto', fontSize: '0.78rem', minWidth: '150px' }}
                  value={customerTierFilter}
                  onChange={(e) => setCustomerTierFilter(e.target.value)}
                >
                  <option value="all">{isEn ? 'All Plans' : 'Semua Paket'}</option>
                  <option value="Tier 1">{isEn ? 'Tier 1 (Free)' : 'Tier 1 (Gratis)'}</option>
                  <option value="Tier 2">Tier 2 Pro</option>
                  <option value="B2B">B2B Suite / Masterplan</option>
                  <option value="Enterprise">Enterprise</option>
                </select>

                {/* Sort By */}
                <select
                  className="gt-calm-select"
                  style={{ width: 'auto', fontSize: '0.78rem', minWidth: '140px' }}
                  value={customerSortBy}
                  onChange={(e) => setCustomerSortBy(e.target.value as any)}
                >
                  <option value="latest">{isEn ? 'Sort: Newest' : 'Urutan: Terbaru'}</option>
                  <option value="oldest">{isEn ? 'Sort: Oldest' : 'Urutan: Terlama'}</option>
                  <option value="name_asc">{isEn ? 'Name (A-Z)' : 'Nama (A-Z)'}</option>
                  <option value="credits_desc">{isEn ? 'Highest Credits' : 'Sisa Kuota Tertinggi'}</option>
                </select>

                {/* Refresh Button */}
                <button
                  type="button"
                  style={{ padding: '7px 12px', fontSize: '0.76rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
                  onClick={fetchCustomers}
                  title={isEn ? 'Refresh Customer Data' : 'Segarkan Data Pengguna'}
                >
                  <RefreshCw size={13} className={isLoadingCustomers ? 'spin' : ''} />
                  <span>{isEn ? 'Refresh' : 'Segarkan'}</span>
                </button>
              </div>

              {/* Polished Table */}
              <div className="gt-matrix-table-wrap">
                <table className="gt-matrix-table">
                  <thead>
                    <tr>
                      <th style={{ width: '28%' }}>{isEn ? 'Full Name & Contact' : 'Nama & Kontak Lengkap'}</th>
                      <th style={{ width: '16%' }}>{isEn ? 'Role / Persona' : 'Peran / Persona'}</th>
                      <th style={{ width: '18%' }}>{isEn ? 'Organization' : 'Instansi / Organisasi'}</th>
                      <th style={{ width: '16%' }}>{isEn ? 'Subscription Plan' : 'Paket Langganan'}</th>
                      <th style={{ width: '10%' }}>{isEn ? 'Credits Left' : 'Sisa Kuota'}</th>
                      <th style={{ width: '12%' }}>{isEn ? 'Actions' : 'Aksi'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                          {isEn ? 'No customer data matching the filter criteria.' : 'Tidak ditemukan data pelanggan yang cocok dengan kriteria filter.'}
                        </td>
                      </tr>
                    ) : (
                      filteredCustomers.map((c) => {
                        const isFree = (c.tier as string).includes('Tier 1') || (c.tier as string).includes('Gratis') || (c.tier as string) === 'FREE';
                        const quota = isFree ? 0 : (c.reportCredits !== undefined ? c.reportCredits : getPaidDossierQuota(c.tier, c.role));
                        const isPro = quota > 0 || (c.tier as string).includes('Tier 2') || (c.tier as string).includes('Tier 3') || (c.tier as string).includes('B2B') || (c.tier as string).includes('Authority');
                        return (
                          <tr key={c.id}>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span className="gt-user-name-title">{c.fullName}</span>
                                <span className="gt-user-sub-email">{c.email}</span>
                                {c.phone && c.phone !== '-' && (
                                  <span className="gt-user-sub-phone">
                                    WA: {c.phone}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>
                              <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: '5px', background: '#f0f9ff', color: '#0369a1', display: 'inline-block' }}>
                                {c.role}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontSize: '0.78rem', color: '#475569' }}>
                                {c.organization && c.organization !== '-' ? c.organization : (isEn ? 'Individual' : 'Pribadi')}
                              </span>
                            </td>
                            <td>
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  padding: '3px 8px',
                                  borderRadius: '5px',
                                  background: isPro ? '#fff7ed' : '#f1f5f9',
                                  color: isPro ? '#c2410c' : '#475569',
                                  border: isPro ? '1px solid #fed7aa' : '1px solid #e2e8f0',
                                  display: 'inline-block'
                                }}
                              >
                                {c.tier}
                              </span>
                            </td>
                            <td>
                              <strong style={{ fontSize: '0.8rem', color: isPro ? '#16a34a' : '#94a3b8' }}>
                                {isPro ? (isEn ? `${quota} Credits` : `${quota} Kuota`) : (isEn ? '0 Credits' : '0 Kuota')}
                              </strong>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <button
                                  type="button"
                                  style={{ padding: '2px 6px', fontSize: '0.68rem', fontWeight: 700, borderRadius: '4px', border: '1px solid #bae6fd', background: '#f0f9ff', color: '#0369a1', cursor: 'pointer' }}
                                  onClick={() => handleAddCreditsQuick(c.id, 1)}
                                  title={isEn ? 'Add 1 Instant Report Credit' : 'Tambah +1 Kuota Instant'}
                                >
                                  +1
                                </button>
                                <button
                                  type="button"
                                  style={{ padding: '2px 6px', fontSize: '0.68rem', fontWeight: 700, borderRadius: '4px', border: '1px solid #fed7aa', background: '#fff7ed', color: '#c2410c', cursor: 'pointer' }}
                                  onClick={() => handleAddCreditsQuick(c.id, 3)}
                                  title={isEn ? 'Add 3 Bundling Report Credits' : 'Tambah +3 Kuota Bundling'}
                                >
                                  +3
                                </button>
                                <button
                                  type="button"
                                  style={{ background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer', padding: '4px' }}
                                  onClick={() => handleOpenEditCustomer(c)}
                                  title={isEn ? 'Edit Customer' : 'Edit Pengguna'}
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  type="button"
                                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                                  onClick={() => handleDeleteCustomer(c.id)}
                                  title={isEn ? 'Delete Customer' : 'Hapus Pengguna'}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =================================================================
              TAB 4: STRUCTURED CONSULTATION INBOX
              ================================================================= */}
          {activeTab === 'inbox' && (
            <div className="gt-calm-panel">
              <div className="gt-calm-panel-header">
                <div>
                  <h3 className="gt-calm-panel-title">{isEn ? 'Consultation & Site Survey Inquiries' : 'Permohonan Konsultasi & Survei Tapak'}</h3>
                  <p className="gt-calm-panel-desc">
                    {isEn ? 'Consultation inquiries received directly from public website forms for specialist follow-up.' : 'Data pemohon konsultasi yang masuk langsung dari formulir publik website untuk ditindaklanjuti oleh Tim Ahli.'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    type="button"
                    style={{ padding: '6px 10px', fontSize: '0.74rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                    onClick={fetchInquiries}
                    title={isEn ? 'Refresh Messages' : 'Segarkan Pesan'}
                  >
                    <RefreshCw size={12} className={isLoadingInbox ? 'spin' : ''} />
                    <span>{isEn ? 'Refresh' : 'Segarkan'}</span>
                  </button>

                  <button
                    type="button"
                    style={{ fontSize: '0.72rem', fontWeight: 700, padding: '5px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: inboxStatusFilter === 'all' ? '#0f172a' : '#ffffff', color: inboxStatusFilter === 'all' ? '#ffffff' : '#475569', cursor: 'pointer' }}
                    onClick={() => setInboxStatusFilter('all')}
                  >
                    {isEn ? `All (${inboxMessages.length})` : `Semua (${inboxMessages.length})`}
                  </button>
                  <button
                    type="button"
                    style={{ fontSize: '0.72rem', fontWeight: 700, padding: '5px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: inboxStatusFilter === 'Baru' ? '#c2410c' : '#ffffff', color: inboxStatusFilter === 'Baru' ? '#ffffff' : '#c2410c', cursor: 'pointer' }}
                    onClick={() => setInboxStatusFilter('Baru')}
                  >
                    {isEn ? `New (${inboxMessages.filter((m) => m.status === 'Baru').length})` : `Baru (${inboxMessages.filter((m) => m.status === 'Baru').length})`}
                  </button>
                  <button
                    type="button"
                    style={{ fontSize: '0.72rem', fontWeight: 700, padding: '5px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: inboxStatusFilter === 'Dalam Proses' ? '#0284c7' : '#ffffff', color: inboxStatusFilter === 'Dalam Proses' ? '#ffffff' : '#0284c7', cursor: 'pointer' }}
                    onClick={() => setInboxStatusFilter('Dalam Proses')}
                  >
                    {isEn ? `In Progress (${inboxMessages.filter((m) => m.status === 'Dalam Proses').length})` : `Proses (${inboxMessages.filter((m) => m.status === 'Dalam Proses').length})`}
                  </button>
                  <button
                    type="button"
                    style={{ fontSize: '0.72rem', fontWeight: 700, padding: '5px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: inboxStatusFilter === 'Selesai' ? '#16a34a' : '#ffffff', color: inboxStatusFilter === 'Selesai' ? '#ffffff' : '#16a34a', cursor: 'pointer' }}
                    onClick={() => setInboxStatusFilter('Selesai')}
                  >
                    {isEn ? `Done (${inboxMessages.filter((m) => m.status === 'Selesai').length})` : `Selesai (${inboxMessages.filter((m) => m.status === 'Selesai').length})`}
                  </button>
                </div>
              </div>

              {/* Master-Detail Split Grid */}
              <div className="gt-inbox-split-grid">
                {/* Left Master List */}
                <div className="gt-inbox-master-pane">
                  <div className="gt-inbox-search-bar">
                    <input
                      type="text"
                      className="gt-calm-input"
                      placeholder={isEn ? 'Search applicant name or location...' : 'Cari nama pemohon atau lokasi...'}
                      value={inboxSearchQuery}
                      onChange={(e) => setInboxSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="gt-inbox-items-scroll">
                    {filteredInquiries.length === 0 ? (
                      <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>
                        {isEn ? 'No consultation inquiries match.' : 'Tidak ada permohonan konsultasi yang cocok.'}
                      </div>
                    ) : (
                      filteredInquiries.map((inq) => (
                        <div
                          key={inq.id}
                          className={`gt-inbox-item-row ${inq.id === activeInquiry?.id ? 'selected' : ''}`}
                          onClick={() => setSelectedInquiryId(inq.id)}
                        >
                          <div className="gt-inbox-row-top">
                            <span className="gt-inbox-row-name">
                              {inq.status === 'Baru' && <span className="gt-inbox-unread-dot" />}
                              {inq.fullName}
                            </span>
                            <span className="gt-inbox-row-time">{inq.createdAt.split(',')[0]}</span>
                          </div>

                          <div className="gt-inbox-row-pkg">{inq.packageInterest}</div>

                          <div className="gt-inbox-row-loc">
                            <MapPin size={11} />
                            <span>{inq.propertyLocation.split(',')[0]}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Right Dossier Detail Pane */}
                {activeInquiry ? (
                  <div className="gt-inbox-detail-pane">
                    {/* Header */}
                    <div className="gt-inbox-dossier-header">
                      <div className="gt-inbox-applicant-title">
                        <h3>{activeInquiry.fullName}</h3>
                        <div className="gt-inbox-applicant-meta">
                          <span>{activeInquiry.role}</span>
                          <span>·</span>
                          <span>ID: {activeInquiry.id}</span>
                          <span>·</span>
                          <span>{isEn ? `Received: ${activeInquiry.createdAt}` : `Masuk: ${activeInquiry.createdAt}`}</span>
                        </div>
                      </div>

                      <div className="gt-inbox-dossier-actions">
                        <select
                          className="gt-calm-select"
                          style={{ width: 'auto', fontSize: '0.76rem', fontWeight: 800 }}
                          value={activeInquiry.status}
                          onChange={(e) =>
                            handleUpdateInquiryStatus(activeInquiry.id, e.target.value as any)
                          }
                        >
                          <option value="Baru">{isEn ? 'Status: New' : 'Status: Baru'}</option>
                          <option value="Dalam Proses">{isEn ? 'Status: In Progress' : 'Status: Dalam Proses'}</option>
                          <option value="Selesai">{isEn ? 'Status: Completed' : 'Status: Selesai'}</option>
                        </select>

                        <a
                          href={getSanitizedWhatsAppUrl(activeInquiry.phone, activeInquiry.fullName, activeInquiry.propertyLocation)}
                          target="_blank"
                          rel="noreferrer"
                          className="gt-btn-wa-direct"
                        >
                          <Phone size={13} />
                          <span>{isEn ? 'Contact via WhatsApp' : 'Hubungi via WhatsApp'}</span>
                        </a>

                        <a
                          href={`mailto:${activeInquiry.email}?subject=Konfirmasi Konsultasi GoTangguh: ${encodeURIComponent(activeInquiry.propertyLocation)}`}
                          className="gt-btn-mail-direct"
                        >
                          <Mail size={13} />
                          <span>{isEn ? 'Send Email' : 'Kirim Email'}</span>
                        </a>
                      </div>
                    </div>

                    {/* Structured Parameters Grid with Clearly Separated WA & Email */}
                    <div className="gt-inbox-field-card-grid">
                      {/* 1. Name & Profile */}
                      <div className="gt-inbox-field-card">
                        <span className="gt-inbox-fld-lbl">
                          <User size={12} /> {isEn ? 'Full Name & Profile' : 'Nama Lengkap & Profil'}
                        </span>
                        <span className="gt-inbox-fld-val">{activeInquiry.fullName}</span>
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{activeInquiry.role}</span>
                      </div>

                      {/* 2. WhatsApp Contact */}
                      <div className="gt-inbox-field-card">
                        <span className="gt-inbox-fld-lbl">
                          <Phone size={12} style={{ color: '#16a34a' }} /> {isEn ? 'Active WhatsApp Number' : 'Nomor WhatsApp Aktif'}
                        </span>
                        <span className="gt-inbox-fld-val" style={{ fontFamily: 'monospace' }}>
                          {activeInquiry.phone || '-'}
                        </span>
                        <a
                          href={getSanitizedWhatsAppUrl(activeInquiry.phone, activeInquiry.fullName, activeInquiry.propertyLocation)}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}
                        >
                          <span>{isEn ? 'Open Direct WhatsApp' : 'Buka Chat WhatsApp Langsung'}</span>
                          <ExternalLink size={11} />
                        </a>
                      </div>

                      {/* 3. Official Email */}
                      <div className="gt-inbox-field-card">
                        <span className="gt-inbox-fld-lbl">
                          <Mail size={12} style={{ color: '#0284c7' }} /> {isEn ? 'Official Email Address' : 'Alamat Email Resmi'}
                        </span>
                        <span className="gt-inbox-fld-val" style={{ wordBreak: 'break-all' }}>
                          {activeInquiry.email || '-'}
                        </span>
                        <a
                          href={`mailto:${activeInquiry.email}?subject=Konfirmasi Konsultasi GoTangguh: ${encodeURIComponent(activeInquiry.propertyLocation)}`}
                          style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}
                        >
                          <span>{isEn ? 'Send Direct Email' : 'Kirim Email Langsung'}</span>
                          <ExternalLink size={11} />
                        </a>
                      </div>

                      {/* 4. Package Interest */}
                      <div className="gt-inbox-field-card">
                        <span className="gt-inbox-fld-lbl">
                          <Tag size={12} /> {isEn ? 'Service Package Selection' : 'Pilihan Paket Layanan'}
                        </span>
                        <span className="gt-inbox-fld-val">{activeInquiry.packageInterest}</span>
                      </div>

                      {/* 5. Target Date */}
                      <div className="gt-inbox-field-card">
                        <span className="gt-inbox-fld-lbl">
                          <Calendar size={12} /> {isEn ? 'Preferred Consultation Date' : 'Rencana Tanggal Konsultasi'}
                        </span>
                        <span className="gt-inbox-fld-val">{activeInquiry.preferredDate}</span>
                      </div>

                      {/* 6. Target Location */}
                      <div className="gt-inbox-field-card">
                        <span className="gt-inbox-fld-lbl">
                          <MapPin size={12} /> {isEn ? 'Property / Site Location' : 'Titik Lokasi Properti / Lahan'}
                        </span>
                        <span className="gt-inbox-fld-val">{activeInquiry.propertyLocation}</span>
                      </div>
                    </div>

                    {/* Assigned Expert Selector */}
                    <div className="gt-form-field" style={{ marginTop: '12px' }}>
                      <label>{isEn ? 'Assigned Field Expert / Specialist Team' : 'Penugasan Tim Ahli / Spesialis Terkait'}</label>
                      <select
                        className="gt-calm-select"
                        value={activeInquiry.assignedExpert || 'Belum Ditugaskan'}
                        onChange={(e) => handleAssignExpert(activeInquiry.id, e.target.value)}
                      >
                        <option value="Belum Ditugaskan">{isEn ? 'Unassigned / Needs Review' : 'Belum Ditugaskan (Menunggu Review)'}</option>
                        <option value="Pak SAS (Lead Scientist)">Pak SAS (Lead Scientist & Risk Modeler)</option>
                        <option value="Fellow RDI (Geoteknik)">Fellow RDI (Ahli Geoteknik & Kegempaan)</option>
                        <option value="Tim BGP Consultant (Sipil)">Tim BGP Consultant (Ahli Teknik Sipil & Struktur)</option>
                        <option value="Lead Surveyor Lapangan">Tim Surveyor Lapangan & On-Site Inspector</option>
                      </select>
                    </div>

                    {/* Client Inquiry Notes */}
                    <div className="gt-inbox-notes-slab">
                      <span className="gt-inbox-fld-lbl">
                        <MessageSquare size={12} /> {isEn ? 'Applicant Specification Notes' : 'Catatan Spesifikasi Kebutuhan Pemohon'}
                      </span>
                      <p className="gt-inbox-notes-text">"{activeInquiry.notes}"</p>
                    </div>

                    {/* Internal Admin Log & Follow-up */}
                    <div className="gt-form-field">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label>{isEn ? 'Internal Specialist Notes & Follow-up' : 'Catatan Internal & Tindak Lanjut Tim Ahli'}</label>
                        {adminNoteSaveAlert && (
                          <span style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 700 }}>
                            {isEn ? 'Notes successfully updated!' : 'Catatan berhasil diperbarui!'}
                          </span>
                        )}
                      </div>
                      <textarea
                        rows={3}
                        className="gt-calm-input"
                        placeholder={isEn ? 'Add internal follow-up progress...' : 'Tuliskan progres tindak lanjut tim admin (contoh: sudah disurvei, jadwal meeting, dsb)...'}
                        value={activeInquiry.adminNotes}
                        onChange={(e) => handleUpdateAdminNotes(activeInquiry.id, e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '36px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                    {isEn ? 'Select an inquiry on the left to view full consultation details.' : 'Pilih permohonan di sebelah kiri untuk melihat rincian dossier konsultasi.'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =================================================================
              TAB 4: API GATEWAY & SPATIAL SERVER HEALTH MONITORING
              ================================================================= */}
          {activeTab === 'api_health' && (() => {
            const testedServers = apiServers.filter((s) => s.latencyMs !== null);
            const onlineServers = apiServers.filter((s) => s.status === 'Online');
            const avgLatency = testedServers.length > 0
              ? Math.round(testedServers.reduce((acc, s) => acc + (s.latencyMs || 0), 0) / testedServers.length)
              : null;
            const lastTestTime = apiServers.find((s) => s.lastChecked !== '-')?.lastChecked || '-';

            return (
              <div className="gt-calm-stack">
                {/* Header Bar with Real Latency Ping Button */}
                <div className="gt-calm-panel">
                  <div className="gt-calm-panel-header">
                    <div>
                      <h3 className="gt-calm-panel-title">{isEn ? 'Official Data Integrations & Service Connectivity' : 'Status Koneksi Layanan & Sumber Data Resmi'}</h3>
                      <p className="gt-calm-panel-desc">{isEn ? 'Real-time connectivity and response status for all verified disaster, mapping, and infrastructure services.' : 'Pemeriksaan status koneksi langsung ke seluruh penyedia data kebencanaan, peta spasial, dan fasilitas darurat resmi.'}</p>
                    </div>
                    <button
                      type="button"
                      className="gt-calm-btn-primary"
                      onClick={handleTestAllApis}
                      disabled={isTestingApis}
                    >
                      <RefreshCw size={13} className={isTestingApis ? 'gt-spin-icon' : ''} />
                      <span>{isTestingApis ? (isEn ? 'Checking Services...' : 'Memeriksa Layanan...') : (isEn ? 'Check All Connections' : 'Periksa Semua Koneksi')}</span>
                    </button>
                  </div>

                  {/* KPI Metrics Strip (100% Derived from Real Measurement) */}
                  <div className="gt-calm-form-grid-2" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
                    <div className="gt-param-card">
                      <span style={{ fontSize: '0.66rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>{isEn ? 'Active Services' : 'Layanan Terhubung'}</span>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: onlineServers.length > 0 ? '#166534' : '#64748b', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                        {testedServers.length > 0 ? (
                          <>
                            <CheckCircle2 size={16} /> {onlineServers.length} / {apiServers.length} {isEn ? 'Active' : 'Aktif'}
                          </>
                        ) : (
                          <span>{isEn ? 'Untested' : 'Belum Diperiksa'}</span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                        {testedServers.length > 0 ? (isEn ? `${testedServers.length} services checked` : `${testedServers.length} layanan berhasil diperiksa`) : (isEn ? 'Click button to check' : 'Klik tombol di atas untuk memeriksa')}
                      </p>
                    </div>

                    <div className="gt-param-card">
                      <span style={{ fontSize: '0.66rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>{isEn ? 'Average Response Speed' : 'Kecepatan Respon Rata-rata'}</span>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: avgLatency !== null ? (avgLatency < 300 ? '#166534' : '#ea580c') : '#64748b', marginTop: '4px' }}>
                        {avgLatency !== null ? `${avgLatency} ms` : '-'}
                      </div>
                      <p style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                        {avgLatency !== null ? (isEn ? 'Optimal response time' : 'Waktu respon data optimal') : (isEn ? 'Requires check' : 'Memerlukan pemeriksaan')}
                      </p>
                    </div>

                    <div className="gt-param-card">
                      <span style={{ fontSize: '0.66rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>{isEn ? 'Official Data Partners' : 'Penyedia Data Resmi'}</span>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>7 {isEn ? 'Sources' : 'Sumber Data'}</div>
                      <p style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>BNPB inaRISK, Copernicus DEM, Open-Meteo, USGS, OSRM, OSM</p>
                    </div>

                    <div className="gt-param-card">
                      <span style={{ fontSize: '0.66rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>{isEn ? 'Last Connection Check' : 'Pemeriksaan Terakhir'}</span>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0284c7', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {lastTestTime}
                      </div>
                      <p style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>{testedServers.length > 0 ? (isEn ? 'Check completed' : 'Pemeriksaan selesai') : (isEn ? 'Ready to check' : 'Siap diperiksa')}</p>
                    </div>
                  </div>

                  {/* API Servers Table */}
                  <div className="gt-calm-table-wrap">
                    <table className="gt-calm-table">
                      <thead>
                        <tr>
                          <th>{isEn ? 'Service / Data Source' : 'Layanan / Sumber Data'}</th>
                          <th>{isEn ? 'Data Category' : 'Kategori Data'}</th>
                          <th>{isEn ? 'Official Institution' : 'Instansi Penyedia'}</th>
                          <th>{isEn ? 'Response Speed' : 'Kecepatan Respon'}</th>
                          <th>{isEn ? 'Last Checked' : 'Terakhir Diperiksa'}</th>
                          <th>{isEn ? 'Service Status' : 'Status Layanan'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {apiServers.map((srv) => (
                          <tr key={srv.id}>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <strong style={{ fontSize: '0.82rem', color: '#121926' }}>{srv.name}</strong>
                                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{srv.authority}</span>
                              </div>
                            </td>
                            <td>
                              <span className="gt-calm-badge neutral">{srv.category}</span>
                            </td>
                            <td>
                              <span style={{ fontSize: '0.76rem', color: '#334155', fontWeight: 600 }}>{srv.authority}</span>
                            </td>
                            <td>
                              {srv.latencyMs !== null ? (
                                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: srv.latencyMs < 200 ? '#166534' : srv.latencyMs < 450 ? '#ea580c' : '#dc2626' }}>
                                  {srv.latencyMs} ms
                                </span>
                              ) : (
                                <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>-</span>
                              )}
                            </td>
                            <td>
                              <span style={{ fontSize: '0.74rem', color: srv.lastChecked !== '-' ? '#334155' : '#94a3b8' }}>
                                {srv.lastChecked}
                              </span>
                            </td>
                            <td>
                              {srv.status === 'Online' ? (
                                <span className="gt-calm-badge success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }} />
                                  {isEn ? 'Connected Normal' : 'Terhubung Normal'}
                                </span>
                              ) : srv.status === 'Gangguan' ? (
                                <span className="gt-calm-badge danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fee2e2', color: '#991b1b' }}>
                                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#dc2626' }} />
                                  {isEn ? 'Connection Slow / Unavailable' : 'Koneksi Terhambat'}
                                </span>
                              ) : (
                                <span className="gt-calm-badge neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#94a3b8' }} />
                                  {isEn ? 'Untested' : 'Belum Diperiksa'}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* =================================================================
              TAB 5: ADMIN ACCOUNT SETTINGS
              ================================================================= */}
          {activeTab === 'account' && (
            <div className="gt-calm-panel">
              <div className="gt-calm-panel-header">
                <div>
                  <h3 className="gt-calm-panel-title">{isEn ? 'Admin Profile & Security Settings' : 'Pengaturan Profil & Keamanan Admin'}</h3>
                  <p className="gt-calm-panel-desc">{isEn ? 'Manage platform operator account details.' : 'Kelola data identitas pengelola platform GoTangguh.'}</p>
                </div>
                <button
                  type="button"
                  className="gt-calm-btn-primary"
                  onClick={() => {
                    setIsProfileSaved(true);
                    setTimeout(() => setIsProfileSaved(false), 3000);
                  }}
                >
                  <Save size={13} />
                  <span>{isProfileSaved ? (isEn ? 'Changes Saved!' : 'Perubahan Tersimpan!') : (isEn ? 'Save Admin Profile' : 'Simpan Profil Admin')}</span>
                </button>
              </div>

              <div className="gt-calm-form-stack">
                <div className="gt-param-card">
                  <div className="gt-param-card-head">
                    <strong style={{ fontSize: '0.88rem' }}>{isEn ? 'Master Account Information' : 'Informasi Akun Master'}</strong>
                  </div>
                  <div className="gt-calm-form-grid-2">
                    <div className="gt-form-field">
                      <label>{isEn ? 'Full Name' : 'Nama Lengkap'}</label>
                      <input
                        type="text"
                        className="gt-calm-input"
                        value={adminProfile.fullName}
                        onChange={(e) => setAdminProfile({ ...adminProfile, fullName: e.target.value })}
                      />
                    </div>
                    <div className="gt-form-field">
                      <label>{isEn ? 'Email Address' : 'Alamat Email'}</label>
                      <input
                        type="email"
                        className="gt-calm-input"
                        value={adminProfile.email}
                        onChange={(e) => setAdminProfile({ ...adminProfile, email: e.target.value })}
                      />
                    </div>
                    <div className="gt-form-field">
                      <label>{isEn ? 'Phone / WhatsApp' : 'Nomor Telepon / WhatsApp'}</label>
                      <input
                        type="text"
                        className="gt-calm-input"
                        value={adminProfile.phone}
                        onChange={(e) => setAdminProfile({ ...adminProfile, phone: e.target.value })}
                      />
                    </div>
                    <div className="gt-form-field">
                      <label>{isEn ? 'Organization Name' : 'Nama Organisasi'}</label>
                      <input
                        type="text"
                        className="gt-calm-input"
                        value={adminProfile.organization}
                        onChange={(e) => setAdminProfile({ ...adminProfile, organization: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="gt-param-card">
                  <div className="gt-param-card-head">
                    <strong style={{ fontSize: '0.88rem' }}>{isEn ? 'Change Master Password' : 'Ganti Kata Sandi Master'}</strong>
                  </div>
                  <div className="gt-calm-form-grid-2">
                    <div className="gt-form-field">
                      <label>{isEn ? 'Current Password' : 'Kata Sandi Saat Ini'}</label>
                      <input type="password" placeholder="••••••••" className="gt-calm-input" />
                    </div>
                    <div className="gt-form-field">
                      <label>{isEn ? 'New Password' : 'Kata Sandi Baru'}</label>
                      <input type="password" placeholder={isEn ? 'Minimum 8 characters' : 'Minimal 8 karakter'} className="gt-calm-input" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ===================================================================
          MODAL 1: ADD / EDIT CUSTOMER (REAL DATABASE PERSISTENCE)
          =================================================================== */}
      {isCustomerModalOpen && (
        <div className="gt-calm-modal-backdrop" onClick={() => setIsCustomerModalOpen(false)}>
          <div className="gt-calm-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="gt-calm-modal-header">
              <h3 className="gt-calm-modal-title">
                {editingCustomerId
                  ? (language === 'en' ? 'Edit Customer Subscription' : 'Edit Data Langganan Pelanggan')
                  : (language === 'en' ? 'Register New Customer' : 'Daftarkan Pelanggan Baru')}
              </h3>
              <button
                type="button"
                className="gt-calm-modal-close"
                onClick={() => setIsCustomerModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="gt-calm-modal-body">
              <div className="gt-form-field">
                <label>{language === 'en' ? 'Customer Full Name *' : 'Nama Lengkap Pelanggan *'}</label>
                <input
                  type="text"
                  className="gt-calm-input"
                  placeholder={language === 'en' ? 'e.g. John Doe, M.Eng' : 'Contoh: Budi Santoso, S.T.'}
                  value={customerFormData.fullName}
                  onChange={(e) => setCustomerFormData({ ...customerFormData, fullName: e.target.value })}
                />
              </div>

              <div className="gt-calm-form-grid-2">
                <div className="gt-form-field">
                  <label>{language === 'en' ? 'Official Email Address *' : 'Alamat Email Resmi *'}</label>
                  <input
                    type="email"
                    disabled={!!editingCustomerId}
                    className="gt-calm-input"
                    placeholder="nama@perusahaan.com"
                    value={customerFormData.email}
                    onChange={(e) => setCustomerFormData({ ...customerFormData, email: e.target.value })}
                  />
                </div>
                <div className="gt-form-field">
                  <label>{language === 'en' ? 'WhatsApp / Mobile Number' : 'Nomor WhatsApp / Telepon'}</label>
                  <input
                    type="text"
                    className="gt-calm-input"
                    placeholder="+62 812-xxxx-xxxx"
                    value={customerFormData.phone}
                    onChange={(e) => setCustomerFormData({ ...customerFormData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="gt-calm-form-grid-2">
                <div className="gt-form-field">
                  <label>{language === 'en' ? 'User Persona / Role' : 'Peran / Sudut Pandang'}</label>
                  <select
                    className="gt-calm-select"
                    value={customerFormData.role}
                    onChange={(e) =>
                      setCustomerFormData({
                        ...customerFormData,
                        role: e.target.value as any
                      })
                    }
                  >
                    <option value="Home Buyer">Home Buyer</option>
                    <option value="Property Developer">Property Developer</option>
                    <option value="Lender / Bank">Lender / Bank</option>
                    <option value="Consultant / Auditor">Consultant / Auditor</option>
                  </select>
                </div>
                <div className="gt-form-field">
                  <label>{language === 'en' ? 'Subscription Tier' : 'Paket Langganan'}</label>
                  <select
                    className="gt-calm-select"
                    value={customerFormData.tier}
                    onChange={(e) => {
                      const selectedTier = e.target.value;
                      let autoCredits = 0;
                      if (selectedTier.includes('Instant') || selectedTier.includes('35')) autoCredits = 1;
                      else if (selectedTier.includes('Bundling') || selectedTier.includes('85') || selectedTier.includes('Pro')) autoCredits = 3;
                      setCustomerFormData({
                        ...customerFormData,
                        tier: selectedTier as any,
                        reportCredits: autoCredits
                      });
                    }}
                  >
                    <option value="Tier 1 (Gratis)">Tier 1 (Gratis) — 0 Kuota</option>
                    <option value="Tier 2 Pro (Instant 1 Properti)">Tier 2 Pro (Instant 1 Properti) — 1 Kuota</option>
                    <option value="Tier 2 Pro (Bundling 3 Properti)">Tier 2 Pro (Bundling 3 Properti) — 3 Kuota</option>
                  </select>
                </div>
              </div>

              <div className="gt-calm-form-grid-2">
                <div className="gt-form-field">
                  <label>{language === 'en' ? 'Company / Organization' : 'Nama Instansi / Perusahaan'}</label>
                  <input
                    type="text"
                    className="gt-calm-input"
                    placeholder={language === 'en' ? 'e.g. PT Santoso Graha' : 'Contoh: PT Santoso Graha'}
                    value={customerFormData.organization}
                    onChange={(e) =>
                      setCustomerFormData({ ...customerFormData, organization: e.target.value })
                    }
                  />
                </div>
                <div className="gt-form-field">
                  <label>{language === 'en' ? 'Report Download Credits' : 'Jumlah Kuota Cetak Laporan PDF'}</label>
                  <input
                    type="number"
                    className="gt-calm-input"
                    value={customerFormData.reportCredits}
                    onChange={(e) =>
                      setCustomerFormData({
                        ...customerFormData,
                        reportCredits: Number(e.target.value)
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="gt-calm-modal-footer">
              <button
                type="button"
                className="gt-calm-btn-ghost"
                onClick={() => setIsCustomerModalOpen(false)}
              >
                {language === 'en' ? 'Cancel' : 'Batal'}
              </button>
              <button
                type="button"
                className="gt-calm-btn-primary"
                onClick={handleSaveCustomer}
              >
                {language === 'en' ? 'Save Customer' : 'Simpan Data Pelanggan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          MODAL 3: CONFIRMATION MODAL (SAFE CRUD WITHOUT ACCIDENTAL DELETIONS)
          =================================================================== */}
      {confirmModal && confirmModal.isOpen && (
        <div className="gt-calm-modal-backdrop" onClick={() => setConfirmModal(null)}>
          <div className="gt-confirm-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className={`gt-confirm-icon-wrap ${confirmModal.confirmVariant || 'danger'}`}>
              <AlertTriangle size={26} />
            </div>
            <h3 className="gt-confirm-title">{confirmModal.title}</h3>
            <p className="gt-confirm-msg">{confirmModal.message}</p>
            <div className="gt-confirm-actions">
              <button
                type="button"
                className="gt-calm-btn-ghost"
                onClick={() => setConfirmModal(null)}
              >
                {confirmModal.cancelLabel || (language === 'en' ? 'Cancel' : 'Batal')}
              </button>
              <button
                type="button"
                className="gt-calm-btn-primary"
                style={confirmModal.confirmVariant === 'danger' ? { background: '#dc2626', borderColor: '#b91c1c', color: '#ffffff' } : {}}
                onClick={() => {
                  confirmModal.onConfirm();
                }}
              >
                {confirmModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagementConsole;
