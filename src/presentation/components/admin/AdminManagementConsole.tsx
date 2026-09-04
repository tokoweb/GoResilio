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
  Waves,
  Download,
  CreditCard,
  FileCheck,
  Server,
  CheckCheck,
  Copy
} from 'lucide-react';

export type AdminTab = 'overview' | 'scoring' | 'customers' | 'inbox' | 'reports' | 'documents' | 'system' | 'account';

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

export interface AdminReportRequest {
  id: string;
  refNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  propertyName: string;
  city: string;
  packageType: string;
  status: 'requested' | 'price_proposed' | 'payment_confirmed' | 'generating' | 'delivered';
  proposedPrice?: string;
  requestedDate: string;
  deliveredDate?: string;
  assignedExpert?: string;
  overallScore?: number;
  overallLevel?: 'low' | 'medium' | 'high' | 'extreme';
}

export interface ArchivedDocument {
  id: string;
  certificateId: string;
  title: string;
  customerName: string;
  customerRole: string;
  city: string;
  pageCount: number;
  overallScore: number;
  overallLevel: 'low' | 'medium' | 'high' | 'extreme';
  dominantHazard: string;
  issuedDate: string;
  fileSizeBytes: string;
  sha256Hash: string;
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
    endpoint: 'Copernicus DEM 90m / Open-Meteo Gateway',
    authority: 'Open-Meteo / European Space Agency',
    status: 'Online',
    latencyMs: 84,
    lastChecked: 'Terverifikasi Sinkron',
    httpStatus: 200
  },
  {
    id: 'srv-usgs',
    name: 'Katalog Gempa Internasional',
    category: 'Seismik',
    endpoint: 'USGS Real-time GeoJSON API',
    authority: 'United States Geological Survey (USGS)',
    status: 'Online',
    latencyMs: 142,
    lastChecked: 'Terverifikasi Sinkron',
    httpStatus: 200
  },
  {
    id: 'srv-bmkg',
    name: 'Pusat Data Gempa & Cuaca Terkini',
    category: 'Seismik & Iklim',
    endpoint: 'BMKG TEWS Gateway',
    authority: 'Badan Meteorologi, Klimatologi, dan Geofisika (BMKG)',
    status: 'Online',
    latencyMs: 95,
    lastChecked: 'Terverifikasi Sinkron',
    httpStatus: 200
  },
  {
    id: 'srv-overpass',
    name: 'Peta Jaringan Jalan & Fasilitas Publik',
    category: 'Infrastruktur',
    endpoint: 'OpenStreetMap Overpass Global Node',
    authority: 'OpenStreetMap Foundation (OSM)',
    status: 'Online',
    latencyMs: 180,
    lastChecked: 'Terverifikasi Sinkron',
    httpStatus: 200
  },
  {
    id: 'srv-osrm',
    name: 'Kalkulasi Waktu Tempuh & Aksesibilitas',
    category: 'Transportasi',
    endpoint: 'Project-OSRM Routing Engine',
    authority: 'Open Source Routing Machine (OSRM)',
    status: 'Online',
    latencyMs: 110,
    lastChecked: 'Terverifikasi Sinkron',
    httpStatus: 200
  },
  {
    id: 'srv-inarisk',
    name: 'Peta Bahaya Bencana Indonesia',
    category: 'Multi-Hazard',
    endpoint: 'InaRISK BNPB Spatial Catalog',
    authority: 'Badan Nasional Penanggulangan Bencana (BNPB)',
    status: 'Online',
    latencyMs: 92,
    lastChecked: 'Terverifikasi Sinkron',
    httpStatus: 200
  },
  {
    id: 'srv-pusgen',
    name: 'Peta Sesar Aktif & Deformasi Nasional',
    category: 'Geologi',
    endpoint: 'PusGen 2024 Spatial Database',
    authority: 'Pusat Studi Gempa Nasional (PusGen ESDM/PUPR)',
    status: 'Online',
    latencyMs: 65,
    lastChecked: 'Terverifikasi Sinkron',
    httpStatus: 200
  }
];
export const AdminManagementConsole: React.FC = () => {
  const { language, t } = useLanguage();
  const isEn = language === 'en';
  const { activeAccountRole, setActiveAccountRole, setCurrentView, adminConfig, logout, adminInitialTab } = useAssessment();

  // Mobile sidebar drawer state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Navigation Tab: Overview, Scoring, Customers, Inbox, System, Account
  const [activeTab, setActiveTab] = useState<AdminTab>('inbox');

  // Report Requests & Dossier Lifecycle State
  const [reportRequests, setReportRequests] = useState<AdminReportRequest[]>([
    {
      id: 'req-001',
      refNumber: 'REQ-2026-0904',
      customerName: 'Budi Santoso',
      customerEmail: 'budi.santoso@gmail.com',
      customerPhone: '+62 812-3456-7890',
      propertyName: 'Rukan Sudirman Bisnis Park Kav. 12',
      city: 'Jakarta Pusat, DKI Jakarta',
      packageType: 'Bundling Multi-Property Report (3 Kavling)',
      status: 'requested',
      requestedDate: '2026-09-04',
      overallScore: 52,
      overallLevel: 'high'
    },
    {
      id: 'req-002',
      refNumber: 'REQ-2026-0902',
      customerName: 'Dewi Lestari',
      customerEmail: 'dewi.lestari@gmail.com',
      customerPhone: '+62 813-8877-6655',
      propertyName: 'Kavling Graha Harmoni Blok C1',
      city: 'Kota Bekasi, Jawa Barat',
      packageType: 'Instant Groundsure Dossier (10–14 Hal)',
      status: 'payment_confirmed',
      proposedPrice: 'Rp 35.000',
      requestedDate: '2026-09-02',
      overallScore: 54,
      overallLevel: 'high'
    },
    {
      id: 'req-003',
      refNumber: 'REQ-2026-0829',
      customerName: 'Hendra Gunawan',
      customerEmail: 'hendra.gunawan@ciputra.co.id',
      customerPhone: '+62 811-2233-4455',
      propertyName: 'Masterplan Citra Maja Raya Tahap 3',
      city: 'Kab. Lebak, Banten',
      packageType: 'B2B Developer Masterplan Resilience Audit',
      status: 'generating',
      proposedPrice: 'Rp 4.500.000',
      requestedDate: '2026-08-29',
      overallScore: 61,
      overallLevel: 'high',
      assignedExpert: 'Pak SAS (Lead Scientist)'
    },
    {
      id: 'req-004',
      refNumber: 'REQ-2026-0819',
      customerName: 'Rudi Hermawan',
      customerEmail: 'rudi.h@propertybuyer.id',
      customerPhone: '+62 818-7654-3210',
      propertyName: 'Cluster Bukit Asri Residence Kavling 4B',
      city: 'Kab. Bogor, Jawa Barat',
      packageType: 'Instant Groundsure Dossier (10–14 Hal)',
      status: 'delivered',
      proposedPrice: 'Rp 35.000',
      requestedDate: '2026-08-19',
      deliveredDate: '2026-08-19',
      overallScore: 38,
      overallLevel: 'medium'
    }
  ]);

  const [requestFilter, setRequestFilter] = useState<'all' | 'requested' | 'price_proposed' | 'payment_confirmed' | 'generating' | 'delivered'>('all');
  const [requestSearch, setRequestSearch] = useState('');
  const [reportsSubView, setReportsSubView] = useState<'requests' | 'inquiries'>('requests');
  const [pricingModal, setPricingModal] = useState<{ isOpen: boolean; reqId: string; currentPrice: string } | null>(null);

  // Archived Documents State
  const [archivedDocuments, setArchivedDocuments] = useState<ArchivedDocument[]>([
    {
      id: 'doc-001',
      certificateId: 'GT-2026-CERT-0819',
      title: 'Dossier Audit Geospasial: Cluster Bukit Asri Residence Kavling 4B',
      customerName: 'Rudi Hermawan',
      customerRole: 'Home Buyer',
      city: 'Kab. Bogor, Jawa Barat',
      pageCount: 14,
      overallScore: 38,
      overallLevel: 'medium',
      dominantHazard: 'Banjir & Genangan (Score 46/100)',
      issuedDate: '19 Agu 2026',
      fileSizeBytes: '3.4 MB',
      sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    },
    {
      id: 'doc-002',
      certificateId: 'GT-2026-CERT-0730',
      title: 'Dossier Audit Geospasial: Apartemen Green Lake View Tower B',
      customerName: 'Siti Rahmawati',
      customerRole: 'Consultant / Auditor',
      city: 'Tangerang Selatan, Banten',
      pageCount: 12,
      overallScore: 42,
      overallLevel: 'medium',
      dominantHazard: 'Panas Ekstrem & UHI (Score 51/100)',
      issuedDate: '30 Jul 2026',
      fileSizeBytes: '2.8 MB',
      sha256Hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
    },
    {
      id: 'doc-003',
      certificateId: 'GT-2026-CERT-0615',
      title: 'Masterplan Resilience Audit: Kawasan Terpadu Industri Jababeka V',
      customerName: 'PT Jababeka Tbk',
      customerRole: 'Property Developer',
      city: 'Kab. Bekasi, Jawa Barat',
      pageCount: 28,
      overallScore: 29,
      overallLevel: 'low',
      dominantHazard: 'Kegempaan / Sesar Baribis (Score 34/100)',
      issuedDate: '15 Jun 2026',
      fileSizeBytes: '7.1 MB',
      sha256Hash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'
    }
  ]);
  const [documentSearch, setDocumentSearch] = useState('');
  const [verifiedHashModal, setVerifiedHashModal] = useState<ArchivedDocument | null>(null);

  // System Tab Subview
  const [systemSubView, setSystemSubView] = useState<'model_methodology' | 'service_integrity'>('model_methodology');

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

  // Listen to external navigation triggers (e.g. from Consultation section)
  useEffect(() => {
    if (adminInitialTab) {
      if (adminInitialTab.tab === 'reports' || adminInitialTab.tab === 'inbox') {
        setActiveTab('inbox');
      } else {
        setActiveTab(adminInitialTab.tab);
      }
      if (adminInitialTab.subView) {
        setReportsSubView(adminInitialTab.subView);
      }
      fetchInquiries();
    }
  }, [adminInitialTab]);

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
    const greeting = `Halo ${name || 'Bapak/Ibu'}, kami dari Tim Ahli GoResilio menindaklanjuti permohonan konsultasi dan survei tapak Anda terkait lokasi: ${location || 'Tapak Properti'}. Apakah ada waktu luang untuk berdiskusi?`;
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

  // Fetch Consultation Inquiries from Live MySQL Database
  // Fetch Consultation Inquiries from Live MySQL Database
  const fetchInquiries = async () => {
    setIsLoadingInbox(true);
    try {
      const res = await fetch('/api/bookings', {
        headers: {
          'Content-Type': 'application/json',
          'x-admin-role': 'Super Admin (RDI)'
        }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const mapped: ConsultationInquiry[] = data.data.map((b: any) => {
          let uiStatus: 'Baru' | 'Dalam Proses' | 'Selesai' = 'Baru';
          if (b.status === 'SELESAI' || b.status === 'Selesai') uiStatus = 'Selesai';
          else if (b.status === 'DIKONFIRMASI' || b.status === 'SURVEI BERJALAN' || b.status === 'Dalam Proses' || b.status === 'Proses') uiStatus = 'Dalam Proses';
          else uiStatus = 'Baru';

          return {
            id: b.id || b.voucherCode,
            fullName: b.clientName || 'Calon Klien',
            email: b.clientEmail || '-',
            phone: b.clientPhone || '-',
            role: b.role || 'Pencari Rumah / Pembeli Pribadi',
            packageInterest: b.packageType || 'Konsultasi Lite / Basic (Rp 300rb - 750rb)',
            propertyLocation: b.targetLocation || 'Lokasi Belum Ditentukan',
            preferredDate: b.scheduledDate || 'Segera Dikonfirmasi',
            notes: b.notes || 'Permohonan review data bencana & survei tapak.',
            adminNotes: b.adminNotes || (b.assignedExpert ? `Ditugaskan ke: ${b.assignedExpert}` : ''),
            assignedExpert: b.assignedExpert || 'Belum Ditugaskan',
            status: uiStatus,
            createdAt: b.createdAt
              ? new Date(b.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
              : '28 Agu 2026'
          };
        });

        setInboxMessages(mapped);
        setSelectedInquiryId((prev) => (prev && mapped.some((m) => m.id === prev) ? prev : (mapped[0]?.id || '')));
      }
    } catch (err) {
      console.warn('Error fetching inquiries from MySQL database:', err);
    } finally {
      setIsLoadingInbox(false);
    }
  };

  // Report Request Lifecycle Handlers
  const handleProposePrice = (reqId: string, price: string) => {
    setReportRequests((prev) =>
      prev.map((r) => (r.id === reqId ? { ...r, status: 'price_proposed', proposedPrice: price } : r))
    );
    setPricingModal(null);
  };

  const handleConfirmPayment = (reqId: string) => {
    setReportRequests((prev) =>
      prev.map((r) => (r.id === reqId ? { ...r, status: 'payment_confirmed' } : r))
    );
  };

  const handleStartGenerating = (reqId: string) => {
    setReportRequests((prev) =>
      prev.map((r) => (r.id === reqId ? { ...r, status: 'generating' } : r))
    );
  };

  const handleDeliverReport = (reqId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const targetReq = reportRequests.find((r) => r.id === reqId);
    setReportRequests((prev) =>
      prev.map((r) => (r.id === reqId ? { ...r, status: 'delivered', deliveredDate: today } : r))
    );
    // Auto archive into documents
    if (targetReq) {
      const certId = `GT-${new Date().getFullYear()}-CERT-${Math.floor(1000 + Math.random() * 9000)}`;
      const newDoc: ArchivedDocument = {
        id: `doc-${Date.now()}`,
        certificateId: certId,
        title: `Dossier Audit Geospasial: ${targetReq.propertyName}`,
        customerName: targetReq.customerName,
        customerRole: 'Verified Client',
        city: targetReq.city,
        pageCount: 14,
        overallScore: targetReq.overallScore || 45,
        overallLevel: targetReq.overallLevel || 'medium',
        dominantHazard: 'Multi-Hazard Verified (InaRISK & PusGen)',
        issuedDate: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
        fileSizeBytes: '3.2 MB',
        sha256Hash: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
      };
      setArchivedDocuments((prev) => [newDoc, ...prev]);
    }
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
    try {
      await fetch('/api/bookings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-role': 'Super Admin (RDI)'
        },
        body: JSON.stringify({ id, status: newStatus })
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
        headers: {
          'Content-Type': 'application/json',
          'x-admin-role': 'Super Admin (RDI)'
        },
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
        headers: {
          'Content-Type': 'application/json',
          'x-admin-role': 'Super Admin (RDI)'
        },
        body: JSON.stringify({ id, adminNotes: note, notes: note })
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
            headers: { 'User-Agent': 'GoResilio/1.0 (resilience@goresilio.id)' }
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

  const activeInquiry = filteredInquiries.find((m) => m.id === selectedInquiryId) || filteredInquiries[0] || inboxMessages[0];

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
            <div className="gt-calm-logo-box">GR</div>
            <div className="gt-calm-brand-text">
              <span className="gt-calm-brand-title">GoResilio</span>
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
        <div style={{ padding: '16px 14px 10px', margin: '0 12px 10px' }}>
          <span style={{ display: 'block', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8' }}>
            {language === 'en' ? 'VERIFIED ACCOUNT AUTHORITY' : 'OTORITAS AKUN TERVERIFIKASI'}
          </span>
        </div>

        {/* Navigation Item Links */}
        <nav className="gt-calm-nav" aria-label="Admin Menu">
          <button
            type="button"
            className={`gt-calm-nav-item ${activeTab === 'scoring' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('scoring');
              setIsMobileMenuOpen(false);
            }}
          >
            <SlidersHorizontal size={16} />
            <span>{language === 'en' ? 'Dashboard Scores & Details' : 'Skor & Keterangan Dashboard'}</span>
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
            <span>{language === 'en' ? 'Form Inbox Messages' : 'Pesan Masuk Form'}</span>
            <span className="gt-calm-pill" style={{ background: activeTab === 'inbox' ? '#0f172a' : '#0f172a', color: '#ffffff' }}>
              {inboxMessages.filter((m) => m.status === 'Baru').length}
            </span>
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
            <span>{language === 'en' ? 'Admin Account Settings' : 'Pengaturan Akun Admin'}</span>
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
                  ? 'Are you sure you want to log out from GoResilio Admin Console? Your current session will be safely terminated.'
                  : 'Apakah Anda yakin ingin keluar dari Konsol Manajemen GoResilio? Sesi pengelola aktif Anda akan diakhiri secara aman.',
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
                {activeTab === 'overview' && (isEn ? 'Platform Overview & Revenue' : 'Ringkasan Eksekutif & Operasional')}
                {activeTab === 'scoring' && (isEn ? 'Dashboard Scores & Details' : 'Skor & Keterangan Dashboard')}
                {activeTab === 'customers' && (isEn ? 'Customer Management & Access' : 'Daftar Pelanggan & Hak Akses')}
                {activeTab === 'inbox' && (isEn ? 'Consultation & Site Survey Inquiries' : 'Permohonan Konsultasi & Survei Tapak')}
                {activeTab === 'reports' && (isEn ? 'Report Requests & Inquiries' : 'Permohonan Laporan & Konsultasi')}
                {activeTab === 'documents' && (isEn ? 'Archived Reports & Dossiers' : 'Arsip Laporan & Sertifikat Digital')}
                {activeTab === 'system' && (isEn ? 'System Status & Methodology' : 'Status Sistem & Metodologi Resmi')}
                {activeTab === 'account' && (isEn ? 'Admin Profile & Security' : 'Profil & Keamanan Pengelola')}
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

            <button
              type="button"
              className="gt-calm-btn-ghost"
              onClick={() => {
                setCurrentView('public');
                setTimeout(() => {
                  const el = document.getElementById('book-demo');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }, 150);
              }}
              title={isEn ? 'Return to Consultation Booking Section' : 'Kembali ke Formulir Permohonan Konsultasi'}
            >
              <Calendar size={13} />
              <span>{isEn ? 'Consultation Section' : 'Formulir Konsultasi'}</span>
            </button>

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

            {(activeTab === 'inbox' || activeTab === 'reports') && (
              <button
                type="button"
                className="gt-calm-btn-ghost"
                style={{ fontSize: '0.76rem', border: '1px solid #cbd5e1' }}
                onClick={() => fetchInquiries()}
              >
                <RefreshCw size={13} className={isLoadingInbox ? 'spin' : ''} />
                <span>{isEn ? 'Refresh Requests' : 'Segarkan Permohonan'}</span>
              </button>
            )}

            {activeTab === 'system' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="gt-calm-pill" style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontSize: '0.72rem', fontWeight: 700 }}>
                  <ShieldCheck size={12} style={{ display: 'inline', marginRight: '3px' }} />
                  {isEn ? 'Engine Locked v2.4' : 'Engine Terkunci v2.4'}
                </span>
              </div>
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
            className={`gt-mq-tab-btn ${activeTab === 'customers' ? 'active' : ''}`}
            onClick={() => setActiveTab('customers')}
          >
            <Users size={13} />
            <span>{isEn ? 'Customers' : 'Pelanggan'}</span>
            <span className="gt-mq-badge">{customers.length}</span>
          </button>
          <button
            type="button"
            className={`gt-mq-tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            <FileText size={13} />
            <span>{isEn ? 'Requests' : 'Permohonan'}</span>
            {(reportRequests.filter((r) => r.status === 'requested').length + inboxMessages.filter((m) => m.status === 'Baru').length) > 0 && (
              <span className="gt-mq-badge orange">
                {reportRequests.filter((r) => r.status === 'requested').length + inboxMessages.filter((m) => m.status === 'Baru').length}
              </span>
            )}
          </button>
          <button
            type="button"
            className={`gt-mq-tab-btn ${activeTab === 'documents' ? 'active' : ''}`}
            onClick={() => setActiveTab('documents')}
          >
            <FileCheck size={13} />
            <span>{isEn ? 'Reports' : 'Laporan'}</span>
          </button>
          <button
            type="button"
            className={`gt-mq-tab-btn ${activeTab === 'system' ? 'active' : ''}`}
            onClick={() => setActiveTab('system')}
          >
            <Server size={13} />
            <span>{isEn ? 'System' : 'Sistem'}</span>
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
                    <p className="gt-calm-panel-desc">{isEn ? 'Monetization metrics according to GoResilio Tiered Pricing Model.' : 'Struktur tarif dan volume layanan sesuai dokumen konsep produk GoResilio.'}</p>
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
                    onClick={() => setActiveTab('reports')}
                  >
                    <Mail size={13} />
                    <span>{isEn ? 'Open Full Requests' : 'Buka Semua Permohonan'}</span>
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
                  onClick={() => setActiveTab('system')}
                >
                  <Activity size={13} />
                  <span>{isEn ? 'Inspect 7 Geospatial Data Nodes' : 'Cek 7 Node Data Geospasial'}</span>
                </button>
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
              TAB 3: REPORTS MANAGEMENT
              ================================================================= */}
          {activeTab === 'reports' && reportsSubView === 'requests' && (
            <div className="gt-calm-stack">
              {/* Sub-view Switcher Bar */}
              <div className="gt-calm-panel" style={{ padding: '14px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 className="gt-calm-panel-title">
                      {reportsSubView === 'requests'
                        ? (isEn ? 'Dossier & Audit Report Requests' : 'Permohonan Laporan & Dossier Audit')
                        : (isEn ? 'Consultation & Site Survey Inquiries' : 'Permohonan Konsultasi & Survei Tapak')}
                    </h3>
                    <p className="gt-calm-panel-desc">
                      {reportsSubView === 'requests'
                        ? (isEn ? 'Manage end-to-end lifecycle for client multi-hazard dossier orders, pricing proposals, and delivery.' : 'Kelola siklus hidup permohonan laporan audit multi-hazard, penawaran harga, dan pengiriman berkas.')
                        : (isEn ? 'Consultation inquiries received directly from public website forms for specialist follow-up.' : 'Data pemohon konsultasi yang masuk langsung dari formulir publik website untuk ditindaklanjuti oleh Tim Ahli.')}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
                    <button
                      type="button"
                      style={{
                        padding: '6px 14px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: reportsSubView === 'requests' ? '#0f172a' : 'transparent',
                        color: reportsSubView === 'requests' ? '#ffffff' : '#64748b'
                      }}
                      onClick={() => setReportsSubView('requests')}
                    >
                      <FileText size={13} />
                      <span>{isEn ? 'Report Orders' : 'Permohonan Laporan'}</span>
                      <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '10px', background: reportsSubView === 'requests' ? '#334155' : '#e2e8f0', color: reportsSubView === 'requests' ? '#ffffff' : '#475569' }}>
                        {reportRequests.length}
                      </span>
                    </button>
                    <button
                      type="button"
                      style={{
                        padding: '6px 14px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: reportsSubView === 'inquiries' ? '#0f172a' : 'transparent',
                        color: reportsSubView === 'inquiries' ? '#ffffff' : '#64748b'
                      }}
                      onClick={() => setReportsSubView('inquiries')}
                    >
                      <Mail size={13} />
                      <span>{isEn ? 'Consultation Inbox' : 'Inbox Konsultasi'}</span>
                      <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '10px', background: reportsSubView === 'inquiries' ? '#334155' : '#e2e8f0', color: reportsSubView === 'inquiries' ? '#ffffff' : '#475569' }}>
                        {inboxMessages.length}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* View 1: Report Requests Lifecycle Table */}
              {reportsSubView === 'requests' && (() => {
                const filtered = reportRequests.filter((r) => {
                  const matchStatus = requestFilter === 'all' || r.status === requestFilter;
                  const matchSearch =
                    requestSearch.trim() === '' ||
                    r.refNumber.toLowerCase().includes(requestSearch.toLowerCase()) ||
                    r.customerName.toLowerCase().includes(requestSearch.toLowerCase()) ||
                    r.propertyName.toLowerCase().includes(requestSearch.toLowerCase()) ||
                    r.city.toLowerCase().includes(requestSearch.toLowerCase());
                  return matchStatus && matchSearch;
                });

                const countPending = reportRequests.filter((r) => r.status === 'requested' || r.status === 'price_proposed').length;
                const countProcessing = reportRequests.filter((r) => r.status === 'payment_confirmed' || r.status === 'generating').length;
                const countDelivered = reportRequests.filter((r) => r.status === 'delivered').length;

                return (
                  <div className="gt-calm-stack">
                    {/* Summary KPI Strip */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                      <div className="gt-param-card">
                        <span style={{ fontSize: '0.66rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                          {isEn ? 'Total Report Orders' : 'Total Permohonan Laporan'}
                        </span>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                          {reportRequests.length}
                        </div>
                        <p style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                          {isEn ? 'All recorded requests' : 'Semua berkas masuk'}
                        </p>
                      </div>

                      <div className="gt-param-card">
                        <span style={{ fontSize: '0.66rem', fontWeight: 800, color: '#c2410c', textTransform: 'uppercase' }}>
                          {isEn ? 'Awaiting Price / Payment' : 'Menunggu Penawaran / Bayar'}
                        </span>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ea580c', marginTop: '4px' }}>
                          {countPending}
                        </div>
                        <p style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                          {isEn ? 'Action required by admin' : 'Perlu respon admin'}
                        </p>
                      </div>

                      <div className="gt-param-card">
                        <span style={{ fontSize: '0.66rem', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase' }}>
                          {isEn ? 'In Generation / Audit' : 'Sedang Diproses'}
                        </span>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0284c7', marginTop: '4px' }}>
                          {countProcessing}
                        </div>
                        <p style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                          {isEn ? 'Engine / Expert analysis' : 'Analisis engine & ahli'}
                        </p>
                      </div>

                      <div className="gt-param-card">
                        <span style={{ fontSize: '0.66rem', fontWeight: 800, color: '#16a34a', textTransform: 'uppercase' }}>
                          {isEn ? 'Delivered & Archived' : 'Selesai & Diarsipkan'}
                        </span>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#16a34a', marginTop: '4px' }}>
                          {countDelivered}
                        </div>
                        <p style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                          {isEn ? 'Certificates verified' : 'Sertifikat terbit'}
                        </p>
                      </div>
                    </div>

                    {/* Filter and Search Bar */}
                    <div className="gt-calm-panel" style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {(
                            [
                              { key: 'all', labelId: 'Semua Status', labelEn: 'All Status' },
                              { key: 'requested', labelId: 'Baru Diminta', labelEn: 'Requested' },
                              { key: 'price_proposed', labelId: 'Penawaran Diberikan', labelEn: 'Price Proposed' },
                              { key: 'payment_confirmed', labelId: 'Lunas / Siap', labelEn: 'Paid' },
                              { key: 'generating', labelId: 'Sedang Proses', labelEn: 'Generating' },
                              { key: 'delivered', labelId: 'Selesai Terkirim', labelEn: 'Delivered' }
                            ] as const
                          ).map((tab) => (
                            <button
                              key={tab.key}
                              type="button"
                              style={{
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                padding: '5px 10px',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                background: requestFilter === tab.key ? '#0f172a' : '#ffffff',
                                color: requestFilter === tab.key ? '#ffffff' : '#475569',
                                cursor: 'pointer'
                              }}
                              onClick={() => setRequestFilter(tab.key)}
                            >
                              {isEn ? tab.labelEn : tab.labelId}
                            </button>
                          ))}
                        </div>

                        <div style={{ position: 'relative', width: '280px' }}>
                          <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                          <input
                            type="text"
                            className="gt-calm-input"
                            style={{ paddingLeft: '30px', fontSize: '0.78rem' }}
                            placeholder={isEn ? 'Search ref, client, or property...' : 'Cari ref, pemohon, atau properti...'}
                            value={requestSearch}
                            onChange={(e) => setRequestSearch(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Report Requests Table */}
                    <div className="gt-calm-panel">
                      <div className="gt-calm-table-wrap">
                        <table className="gt-calm-table">
                          <thead>
                            <tr>
                              <th>{isEn ? 'Ref # & Date' : 'Ref # & Tanggal'}</th>
                              <th>{isEn ? 'Client Information' : 'Pemohon Laporan'}</th>
                              <th>{isEn ? 'Property & City' : 'Objek Properti & Kota'}</th>
                              <th>{isEn ? 'Package & Pricing' : 'Paket & Penawaran'}</th>
                              <th>{isEn ? 'Risk Score' : 'Skor Risiko'}</th>
                              <th>{isEn ? 'Status' : 'Status Alur'}</th>
                              <th style={{ textAlign: 'right' }}>{isEn ? 'Actions' : 'Aksi Operasional'}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filtered.length === 0 ? (
                              <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                                  {isEn ? 'No report requests found matching your filter.' : 'Tidak ada permohonan laporan yang sesuai kriteria pencarian.'}
                                </td>
                              </tr>
                            ) : (
                              filtered.map((req) => {
                                const isReq = req.status === 'requested';
                                const isProposed = req.status === 'price_proposed';
                                const isPaid = req.status === 'payment_confirmed';
                                const isGenerating = req.status === 'generating';
                                const isDelivered = req.status === 'delivered';

                                return (
                                  <tr key={req.id}>
                                    <td>
                                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <strong style={{ fontSize: '0.8rem', color: '#0f172a' }}>{req.refNumber}</strong>
                                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{req.requestedDate}</span>
                                      </div>
                                    </td>
                                    <td>
                                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <strong style={{ fontSize: '0.82rem', color: '#1e293b' }}>{req.customerName}</strong>
                                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{req.customerEmail}</span>
                                        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{req.customerPhone}</span>
                                      </div>
                                    </td>
                                    <td>
                                      <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '200px' }}>
                                        <strong style={{ fontSize: '0.8rem', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={req.propertyName}>
                                          {req.propertyName}
                                        </strong>
                                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{req.city}</span>
                                      </div>
                                    </td>
                                    <td>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                        <span style={{ fontSize: '0.74rem', color: '#334155', fontWeight: 600 }}>{req.packageType}</span>
                                        {req.proposedPrice ? (
                                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0284c7' }}>
                                            {req.proposedPrice}
                                          </span>
                                        ) : (
                                          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{isEn ? 'Standard / TBD' : 'Perlu Penawaran'}</span>
                                        )}
                                      </div>
                                    </td>
                                    <td>
                                      {req.overallScore !== undefined ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                          <span
                                            style={{
                                              fontSize: '0.72rem',
                                              fontWeight: 800,
                                              padding: '2px 8px',
                                              borderRadius: '4px',
                                              background: req.overallLevel === 'low' ? '#f0fdf4' : req.overallLevel === 'medium' ? '#fffbeb' : '#fef2f2',
                                              color: req.overallLevel === 'low' ? '#166534' : req.overallLevel === 'medium' ? '#b45309' : '#991b1b',
                                              border: req.overallLevel === 'low' ? '1px solid #bbf7d0' : req.overallLevel === 'medium' ? '1px solid #fde68a' : '1px solid #fecaca'
                                            }}
                                          >
                                            {req.overallScore}/100
                                          </span>
                                        </div>
                                      ) : (
                                        <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>-</span>
                                      )}
                                    </td>
                                    <td>
                                      {isReq && (
                                        <span className="gt-calm-badge warning" style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' }}>
                                          {isEn ? 'Requested' : 'Baru Diminta'}
                                        </span>
                                      )}
                                      {isProposed && (
                                        <span className="gt-calm-badge" style={{ background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd' }}>
                                          {isEn ? 'Price Proposed' : 'Penawaran Dikirim'}
                                        </span>
                                      )}
                                      {isPaid && (
                                        <span className="gt-calm-badge" style={{ background: '#fdf4ff', color: '#86198f', border: '1px solid #f5d0fe' }}>
                                          {isEn ? 'Payment Confirmed' : 'Lunas Terverifikasi'}
                                        </span>
                                      )}
                                      {isGenerating && (
                                        <span className="gt-calm-badge" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                                          {isEn ? 'Generating Audit' : 'Sedang Diproses'}
                                        </span>
                                      )}
                                      {isDelivered && (
                                        <span className="gt-calm-badge success" style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}>
                                          {isEn ? 'Delivered' : 'Selesai Terkirim'}
                                        </span>
                                      )}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                        {isReq && (
                                          <button
                                            type="button"
                                            className="gt-calm-btn-primary"
                                            style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                                            onClick={() => setPricingModal({ isOpen: true, reqId: req.id, currentPrice: req.proposedPrice || 'Rp 35.000' })}
                                          >
                                            <CreditCard size={12} />
                                            <span>{isEn ? 'Set Price' : 'Beri Harga'}</span>
                                          </button>
                                        )}

                                        {isProposed && (
                                          <button
                                            type="button"
                                            className="gt-calm-btn-primary"
                                            style={{ padding: '4px 10px', fontSize: '0.72rem', background: '#0284c7' }}
                                            onClick={() => handleConfirmPayment(req.id)}
                                          >
                                            <CheckCircle2 size={12} />
                                            <span>{isEn ? 'Confirm Pay' : 'Konfirmasi Bayar'}</span>
                                          </button>
                                        )}

                                        {isPaid && (
                                          <button
                                            type="button"
                                            className="gt-calm-btn-primary"
                                            style={{ padding: '4px 10px', fontSize: '0.72rem', background: '#7c3aed' }}
                                            onClick={() => handleStartGenerating(req.id)}
                                          >
                                            <Zap size={12} />
                                            <span>{isEn ? 'Start Engine' : 'Mulai Proses'}</span>
                                          </button>
                                        )}

                                        {isGenerating && (
                                          <button
                                            type="button"
                                            className="gt-calm-btn-primary"
                                            style={{ padding: '4px 10px', fontSize: '0.72rem', background: '#16a34a' }}
                                            onClick={() => handleDeliverReport(req.id)}
                                          >
                                            <Send size={12} />
                                            <span>{isEn ? 'Deliver & Archive' : 'Kirim & Arsipkan'}</span>
                                          </button>
                                        )}

                                        {isDelivered && (
                                          <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <CheckCheck size={14} /> {req.deliveredDate || 'Terkirim'}
                                          </span>
                                        )}
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
                  </div>
                );
              })()}
            </div>
          )}

          {/* =================================================================
              TAB 4: PESAN MASUK FORM (CONSULTATION INBOX)
              ================================================================= */}
          {(activeTab === 'inbox' || (activeTab === 'reports' && reportsSubView === 'inquiries')) && (
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
                          href={`mailto:${activeInquiry.email}?subject=Konfirmasi Konsultasi GoResilio: ${encodeURIComponent(activeInquiry.propertyLocation)}`}
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
                          href={`mailto:${activeInquiry.email}?subject=Konfirmasi Konsultasi GoResilio: ${encodeURIComponent(activeInquiry.propertyLocation)}`}
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
              TAB 4: ARCHIVED REPORTS & DIGITAL CERTIFICATES REPOSITORY
              ================================================================= */}
          {activeTab === 'documents' && (() => {
            const filteredDocs = archivedDocuments.filter((d) => {
              if (documentSearch.trim() === '') return true;
              const q = documentSearch.toLowerCase();
              return (
                d.title.toLowerCase().includes(q) ||
                d.certificateId.toLowerCase().includes(q) ||
                d.customerName.toLowerCase().includes(q) ||
                d.city.toLowerCase().includes(q) ||
                d.sha256Hash.toLowerCase().includes(q)
              );
            });

            const totalPages = archivedDocuments.reduce((acc, d) => acc + d.pageCount, 0);
            const avgScore = Math.round(
              archivedDocuments.reduce((acc, d) => acc + d.overallScore, 0) / (archivedDocuments.length || 1)
            );

            return (
              <div className="gt-calm-stack">
                <div className="gt-calm-panel">
                  <div className="gt-calm-panel-header">
                    <div>
                      <h3 className="gt-calm-panel-title">{isEn ? 'Archived Reports & Cryptographic Certificates' : 'Repositori Laporan & Sertifikat Digital'}</h3>
                      <p className="gt-calm-panel-desc">
                        {isEn ? 'Permanent archival of issued multi-hazard dossiers and verified SHA-256 digital certificate tamper proofs.' : 'Penyimpanan permanen seluruh berkas audit multi-hazard yang telah diterbitkan dengan pembuktian integritas kriptografis SHA-256.'}
                      </p>
                    </div>
                  </div>

                  {/* Document Metrics */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '12px' }}>
                    <div className="gt-param-card">
                      <span style={{ fontSize: '0.66rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                        {isEn ? 'Archived Dossiers' : 'Dokumen Diarsipkan'}
                      </span>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                        {archivedDocuments.length} {isEn ? 'Files' : 'Berkas'}
                      </div>
                      <p style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                        {isEn ? 'Stored permanently' : 'Tersimpan permanen'}
                      </p>
                    </div>

                    <div className="gt-param-card">
                      <span style={{ fontSize: '0.66rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                        {isEn ? 'Total Pages Generated' : 'Total Halaman Laporan'}
                      </span>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0284c7', marginTop: '4px' }}>
                        {totalPages} {isEn ? 'Pages' : 'Halaman'}
                      </div>
                      <p style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                        {isEn ? 'Audit documentation volume' : 'Volume audit teknis'}
                      </p>
                    </div>

                    <div className="gt-param-card">
                      <span style={{ fontSize: '0.66rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                        {isEn ? 'Average Hazard Score' : 'Rata-rata Skor Arsip'}
                      </span>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: avgScore > 50 ? '#ea580c' : '#16a34a', marginTop: '4px' }}>
                        {avgScore} / 100
                      </div>
                      <p style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                        {isEn ? 'Composite site risk' : 'Tingkat risiko tapak'}
                      </p>
                    </div>

                    <div className="gt-param-card">
                      <span style={{ fontSize: '0.66rem', fontWeight: 800, color: '#16a34a', textTransform: 'uppercase' }}>
                        {isEn ? 'Cryptographic Integrity' : 'Integritas Kriptografi'}
                      </span>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#16a34a', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ShieldCheck size={18} /> 100% SHA-256
                      </div>
                      <p style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                        {isEn ? 'Zero tampering detected' : 'Jaminan keaslian dokumen'}
                      </p>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ position: 'relative', width: '340px' }}>
                      <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input
                        type="text"
                        className="gt-calm-input"
                        style={{ paddingLeft: '30px', fontSize: '0.78rem' }}
                        placeholder={isEn ? 'Search by certificate ID, title, client, or hash...' : 'Cari sertifikat ID, judul dokumen, pemohon, atau hash...'}
                        value={documentSearch}
                        onChange={(e) => setDocumentSearch(e.target.value)}
                      />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {isEn ? `Showing ${filteredDocs.length} archived records` : `Menampilkan ${filteredDocs.length} rekaman arsip`}
                    </span>
                  </div>

                  {/* Documents Table */}
                  <div className="gt-calm-table-wrap" style={{ marginTop: '12px' }}>
                    <table className="gt-calm-table">
                      <thead>
                        <tr>
                          <th>{isEn ? 'Certificate ID & Date' : 'ID Sertifikat & Tanggal'}</th>
                          <th>{isEn ? 'Dossier Title & Location' : 'Judul Berkas & Lokasi'}</th>
                          <th>{isEn ? 'Recipient' : 'Penerima & Peran'}</th>
                          <th>{isEn ? 'Hazard & Score' : 'Bahaya Utama & Skor'}</th>
                          <th>{isEn ? 'Pages & Size' : 'Volume Berkas'}</th>
                          <th>{isEn ? 'SHA-256 Checksum' : 'Checksum SHA-256'}</th>
                          <th style={{ textAlign: 'right' }}>{isEn ? 'Actions' : 'Aksi Verifikasi'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDocs.length === 0 ? (
                          <tr>
                            <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                              {isEn ? 'No archived documents matched your search.' : 'Tidak ada dokumen arsip yang sesuai kata kunci pencarian.'}
                            </td>
                          </tr>
                        ) : (
                          filteredDocs.map((doc) => (
                            <tr key={doc.id}>
                              <td>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <strong style={{ fontSize: '0.8rem', color: '#0f172a', fontFamily: 'monospace' }}>{doc.certificateId}</strong>
                                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{doc.issuedDate}</span>
                                </div>
                              </td>
                              <td>
                                <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '240px' }}>
                                  <strong style={{ fontSize: '0.82rem', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={doc.title}>
                                    {doc.title}
                                  </strong>
                                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{doc.city}</span>
                                </div>
                              </td>
                              <td>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e293b' }}>{doc.customerName}</span>
                                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{doc.customerRole}</span>
                                </div>
                              </td>
                              <td>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  <span
                                    style={{
                                      fontSize: '0.72rem',
                                      fontWeight: 800,
                                      display: 'inline-block',
                                      width: 'fit-content',
                                      padding: '1px 6px',
                                      borderRadius: '4px',
                                      background: doc.overallLevel === 'low' ? '#f0fdf4' : doc.overallLevel === 'medium' ? '#fffbeb' : '#fef2f2',
                                      color: doc.overallLevel === 'low' ? '#166534' : doc.overallLevel === 'medium' ? '#b45309' : '#991b1b',
                                      border: doc.overallLevel === 'low' ? '1px solid #bbf7d0' : doc.overallLevel === 'medium' ? '1px solid #fde68a' : '1px solid #fecaca'
                                    }}
                                  >
                                    Skor {doc.overallScore}/100
                                  </span>
                                  <span style={{ fontSize: '0.68rem', color: '#64748b', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={doc.dominantHazard}>
                                    {doc.dominantHazard}
                                  </span>
                                </div>
                              </td>
                              <td>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <strong style={{ fontSize: '0.78rem', color: '#334155' }}>{doc.pageCount} {isEn ? 'Pages' : 'Halaman'}</strong>
                                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{doc.fileSizeBytes}</span>
                                </div>
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <code style={{ fontSize: '0.7rem', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#334155', fontFamily: 'monospace' }}>
                                    {doc.sha256Hash.slice(0, 8)}...{doc.sha256Hash.slice(-8)}
                                  </code>
                                  <CheckCircle2 size={13} style={{ color: '#16a34a' }} title="Verified Valid SHA-256" />
                                </div>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                  <button
                                    type="button"
                                    className="gt-calm-btn-ghost"
                                    style={{ padding: '4px 8px', fontSize: '0.72rem', border: '1px solid #cbd5e1' }}
                                    onClick={() => setVerifiedHashModal(doc)}
                                    title={isEn ? 'Verify Cryptographic Hash' : 'Verifikasi Integritas Hash'}
                                  >
                                    <ShieldCheck size={12} style={{ color: '#0284c7' }} />
                                    <span>{isEn ? 'Verify' : 'Integritas'}</span>
                                  </button>
                                  <button
                                    type="button"
                                    className="gt-calm-btn-ghost"
                                    style={{ padding: '4px 8px', fontSize: '0.72rem', border: '1px solid #cbd5e1' }}
                                    onClick={() => alert(isEn ? `Downloading archived PDF: ${doc.certificateId}` : `Mengunduh salinan berkas PDF arsip: ${doc.certificateId}`)}
                                    title={isEn ? 'Download Document PDF' : 'Unduh Berkas PDF'}
                                  >
                                    <Download size={12} />
                                    <span>PDF</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* =================================================================
              TAB 5: SYSTEM INTEGRITY & SCORING METHODOLOGY
              ================================================================= */}
          {(activeTab === 'scoring' || activeTab === 'system') && (
            <div className="gt-calm-stack">
              {/* Sub-view Switcher Bar (only when in system tab) */}
              {activeTab === 'system' && (
                <div className="gt-calm-panel" style={{ padding: '14px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h3 className="gt-calm-panel-title">
                        {systemSubView === 'model_methodology'
                          ? (isEn ? 'Multi-Hazard Risk Model & Scientific Methodology' : 'Model Penilaian Multi-Hazard & Metodologi Ilmiah')
                          : (isEn ? 'Service Integrity & Spatial API Gateway Monitoring' : 'Integritas Layanan & Status Gateway Data Geospasial')}
                      </h3>
                      <p className="gt-calm-panel-desc">
                        {systemSubView === 'model_methodology'
                          ? (isEn ? 'Internal, versioned, read-only calculation matrix and official Indonesian disaster mitigation standards.' : 'Matriks perhitungan internal yang terkunci (read-only) dan kepatuhan standar mitigasi bencana resmi nasional.')
                          : (isEn ? 'Real-time connectivity and response latency verification for official national and international data sources.' : 'Verifikasi konektivitas real-time dan latensi respon sumber data resmi nasional dan internasional.')}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
                      <button
                        type="button"
                        style={{
                          padding: '6px 14px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: systemSubView === 'model_methodology' ? '#0f172a' : 'transparent',
                          color: systemSubView === 'model_methodology' ? '#ffffff' : '#64748b'
                        }}
                        onClick={() => setSystemSubView('model_methodology')}
                      >
                        <Layers size={13} />
                        <span>{isEn ? 'Model & Methodology' : 'Model & Metodologi'}</span>
                      </button>
                      <button
                        type="button"
                        style={{
                          padding: '6px 14px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: systemSubView === 'service_integrity' ? '#0f172a' : 'transparent',
                          color: systemSubView === 'service_integrity' ? '#ffffff' : '#64748b'
                        }}
                        onClick={() => setSystemSubView('service_integrity')}
                      >
                        <Activity size={13} />
                        <span>{isEn ? 'Service Integrity' : 'Integritas Layanan'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-view 1: Model & Metodologi (Read-Only) */}
              {(activeTab === 'scoring' || (activeTab === 'system' && systemSubView === 'model_methodology')) && (
                <div className="gt-calm-stack">
                  {/* Engine Lock Banner */}
                  <div
                    style={{
                      padding: '16px 20px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '14px',
                      boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)'
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <Lock size={18} style={{ color: '#38bdf8' }} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '0.9rem', letterSpacing: '-0.01em' }}>
                          {isEn ? 'Standardized Multi-Hazard Scoring Engine' : 'Engine Penilaian Multi-Hazard Terstandardisasi'}
                        </strong>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: '#0284c7',
                            color: '#ffffff'
                          }}
                        >
                          v2.4 Locked Engine
                        </span>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: 'rgba(16, 185, 129, 0.2)',
                            color: '#6ee7b7',
                            border: '1px solid rgba(16, 185, 129, 0.3)'
                          }}
                        >
                          {isEn ? 'Read-Only Matrix' : 'Matriks Read-Only'}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: '6px', lineHeight: 1.5 }}>
                        {isEn
                          ? 'Hazard scoring calculations and parameter weights are strictly internal, versioned, and read-only. Operational admin cannot manually manipulate weights to ensure mathematical consistency, compliance with SNI standards, and complete cryptographic validity of certified dossiers.'
                          : 'Formula perhitungan skor bahaya, bobot parameter, dan ambang batas risiko bersifat internal, berversi (versioned), dan terkunci read-only. Admin operasional tidak dapat memanipulasi bobot secara manual guna menjamin kepatuhan SNI 1726:2019, konsistensi matematis, serta integritas hukum sertifikat audit.'}
                      </p>
                    </div>
                  </div>

                  {/* 3 Core Hazards Breakdown */}
                  <div className="gt-calm-panel">
                    <div className="gt-calm-panel-header">
                      <div>
                        <h4 className="gt-calm-panel-title">{isEn ? '3 Core Hazard Dimensions & Official Weights' : '3 Dimensi Bahaya Utama & Pembobotan Resmi'}</h4>
                        <p className="gt-calm-panel-desc">
                          {isEn ? 'Overall Risk Score is computed exclusively from these 3 primary physical natural hazards.' : 'Skor Risiko Keseluruhan (Overall Hazard Score) dihitung khusus dari 3 bahaya fisik alamiah utama.'}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginTop: '12px' }}>
                      {/* Flood Card */}
                      <div className="gt-param-card" style={{ borderTop: '3px solid #0284c7' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: 30, height: 30, borderRadius: '6px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Droplets size={16} />
                            </div>
                            <strong style={{ fontSize: '0.85rem' }}>{isEn ? 'Flood & Inundation' : 'Banjir & Genangan'}</strong>
                          </div>
                          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0284c7', background: '#f0f9ff', padding: '2px 8px', borderRadius: '4px', border: '1px solid #bae6fd' }}>
                            40% {isEn ? 'Weight' : 'Bobot'}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '8px', lineHeight: 1.5 }}>
                          {isEn
                            ? 'Evaluates fluvial, pluvial, and coastal flooding vulnerability based on catchment basin hydrology and site elevation.'
                            : 'Mengevaluasi kerentanan banjir luapan sungai (fluvial), genangan lokal (pluvial), dan rob pesisir berdasarkan DAS dan elevasi tapak.'}
                        </p>
                        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#475569' }}>{isEn ? 'Official Data Pipeline:' : 'Sumber Data Resmi:'}</span>
                          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>• InaRISK BNPB 100m Grid Raster</span>
                          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>• Copernicus DEM 30m Global Elevation</span>
                          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>• CHIRPS 24h Extreme Precipitation</span>
                        </div>
                      </div>

                      {/* Earthquake Card */}
                      <div className="gt-param-card" style={{ borderTop: '3px solid #b45309' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: 30, height: 30, borderRadius: '6px', background: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Mountain size={16} />
                            </div>
                            <strong style={{ fontSize: '0.85rem' }}>{isEn ? 'Earthquake & Faults' : 'Gempa & Sesar Aktif'}</strong>
                          </div>
                          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#b45309', background: '#fffbeb', padding: '2px 8px', borderRadius: '4px', border: '1px solid #fde68a' }}>
                            35% {isEn ? 'Weight' : 'Bobot'}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '8px', lineHeight: 1.5 }}>
                          {isEn
                            ? 'Ground acceleration hazard (PGA), proximity to mapped quaternary fault lines, and regional tectonic activity.'
                            : 'Percepatan tanah puncak (PGA g), jarak terhadap garis sesar kuarter aktif, dan riwayat aktivitas seismik regional.'}
                        </p>
                        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#475569' }}>{isEn ? 'Official Data Pipeline:' : 'Sumber Data Resmi:'}</span>
                          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>• Peta Gempa Nasional PusGen 2024</span>
                          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>• USGS Worldwide Seismic Database</span>
                          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>• Standar Desain Tahan Gempa SNI 1726</span>
                        </div>
                      </div>

                      {/* Heat Card */}
                      <div className="gt-param-card" style={{ borderTop: '3px solid #dc2626' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: 30, height: 30, borderRadius: '6px', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Flame size={16} />
                            </div>
                            <strong style={{ fontSize: '0.85rem' }}>{isEn ? 'Extreme Heat & UHI' : 'Panas Ekstrem & UHI'}</strong>
                          </div>
                          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#dc2626', background: '#fef2f2', padding: '2px 8px', borderRadius: '4px', border: '1px solid #fecaca' }}>
                            25% {isEn ? 'Weight' : 'Bobot'}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '8px', lineHeight: 1.5 }}>
                          {isEn
                            ? 'Maximum surface temperature, Urban Heat Island intensification, and vegetated canopy density.'
                            : 'Suhu permukaan maksimum harian, intensifikasi pulau bahang perkotaan (UHI), dan densitas tutupan kanopi vegetasi.'}
                        </p>
                        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#475569' }}>{isEn ? 'Official Data Pipeline:' : 'Sumber Data Resmi:'}</span>
                          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>• Open-Meteo ERA5 Atmospheric Reanalysis</span>
                          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>• Copernicus Climate Change Service</span>
                          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>• Landsat 8/9 Thermal Infrared Sensor</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Critical Methodology Notice: Transport & Emergency Services Exclusion */}
                  <div
                    style={{
                      padding: '14px 18px',
                      borderRadius: '8px',
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px'
                    }}
                  >
                    <Info size={18} style={{ color: '#0284c7', flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong style={{ fontSize: '0.82rem', color: '#0f172a' }}>
                        {isEn
                          ? 'Methodology Architecture Note: Transport & Emergency Facility Separation'
                          : 'Catatan Metodologi: Pemisahan Transportasi & Fasilitas Darurat'}
                      </strong>
                      <p style={{ fontSize: '0.76rem', color: '#475569', marginTop: '4px', lineHeight: 1.5 }}>
                        {isEn
                          ? 'Transport proximity, road connectivity, and distances to emergency facilities (Hospitals, Fire Stations, Police) ARE NOT included in the composite natural hazard score. Natural hazard is an inherent physical vulnerability of the geographical terrain, whereas emergency infrastructure is evaluated independently as an evacuation accessibility and adaptive capacity metric.'
                          : 'Aksesibilitas transportasi, konektivitas jalan, dan jarak menuju fasilitas darurat (Rumah Sakit, Pos Pemadam Kebakaran, Kantor Polisi) TIDAK DIGABUNGKAN ke dalam skor bahaya alam (Overall Hazard Score). Bahaya alam adalah kerentanan fisik murni tapak geologis, sedangkan ketersediaan fasilitas darurat dihitung terpisah sebagai parameter Kapasitas Evakuasi & Mitigasi Adaptif.'}
                      </p>
                    </div>
                  </div>

                  {/* Read-Only Risk Tier Matrix */}
                  <div className="gt-calm-panel">
                    <div className="gt-calm-panel-header">
                      <div>
                        <h4 className="gt-calm-panel-title">{isEn ? 'National 4-Tier Risk Classification Matrix' : 'Matriks Ambang Batas 4 Tingkat Risiko Nasional'}</h4>
                        <p className="gt-calm-panel-desc">
                          {isEn ? 'Standardized classification thresholds applied uniformly to all assessment reports.' : 'Ambang batas skor terstandarisasi yang diterapkan secara seragam pada seluruh berkas evaluasi tapak.'}
                        </p>
                      </div>
                    </div>

                    <div className="gt-calm-table-wrap" style={{ marginTop: '10px' }}>
                      <table className="gt-calm-table">
                        <thead>
                          <tr>
                            <th>{isEn ? 'Risk Tier & Color Code' : 'Tingkat Risiko & Label'}</th>
                            <th>{isEn ? 'Score Range' : 'Rentang Skor'}</th>
                            <th>{isEn ? 'Engineering & Structural Implication' : 'Implikasi Rekayasa Struktur'}</th>
                            <th>{isEn ? 'Mitigation Requirement' : 'Ketentuan Mitigasi Tapak'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>
                              <span style={{ fontSize: '0.74rem', fontWeight: 800, padding: '3px 10px', borderRadius: '4px', background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a' }} />
                                {isEn ? 'Low / Safe' : 'Aman / Rendah'}
                              </span>
                            </td>
                            <td>
                              <code style={{ fontWeight: 700, color: '#166534' }}>0 - 30</code>
                            </td>
                            <td style={{ fontSize: '0.76rem', color: '#334155' }}>
                              {isEn ? 'Standard structural design adequate. Natural drainage and baseline soil bearing capacity sufficient.' : 'Struktur standar memadai. Drainase alami gravitasi lancar dan daya dukung tanah dasar stabil.'}
                            </td>
                            <td style={{ fontSize: '0.76rem', color: '#64748b' }}>
                              {isEn ? 'Routine maintenance & standard building permit (PBG).' : 'Pemeliharaan berkala & kelengkapan PBG standar.'}
                            </td>
                          </tr>

                          <tr>
                            <td>
                              <span style={{ fontSize: '0.74rem', fontWeight: 800, padding: '3px 10px', borderRadius: '4px', background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#d97706' }} />
                                {isEn ? 'Moderate / Alert' : 'Waspada / Sedang'}
                              </span>
                            </td>
                            <td>
                              <code style={{ fontWeight: 700, color: '#b45309' }}>31 - 60</code>
                            </td>
                            <td style={{ fontSize: '0.76rem', color: '#334155' }}>
                              {isEn ? 'Enhanced column tie spacing (sengkang rapat) & integrated retention wells recommended.' : 'Diperlukan sengkang kolom gempa lebih rapat & sumur resapan air hujan berpori terintegrasi.'}
                            </td>
                            <td style={{ fontSize: '0.76rem', color: '#64748b' }}>
                              {isEn ? 'Site slope stabilization and localized backflow valves.' : 'Stabilisasi lereng lokal & katup pencegah arus balik drainase.'}
                            </td>
                          </tr>

                          <tr>
                            <td>
                              <span style={{ fontSize: '0.74rem', fontWeight: 800, padding: '3px 10px', borderRadius: '4px', background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ea580c' }} />
                                {isEn ? 'High / Danger' : 'Bahaya / Tinggi'}
                              </span>
                            </td>
                            <td>
                              <code style={{ fontWeight: 700, color: '#c2410c' }}>61 - 80</code>
                            </td>
                            <td style={{ fontSize: '0.76rem', color: '#334155' }}>
                              {isEn ? 'Mandatory seismic-resistant deep foundation (SNI 1726) & elevated finished floor level (+50cm peil).' : 'Wajib pondasi dalam tahan gempa sesuai SNI 1726 & peninggian peil lantai bangunan minimal +50 cm.'}
                            </td>
                            <td style={{ fontSize: '0.76rem', color: '#64748b' }}>
                              {isEn ? 'Comprehensive site drainage pump & certified architectural audit.' : 'Pompa penguras darurat & sertifikasi audit struktur berkala.'}
                            </td>
                          </tr>

                          <tr>
                            <td>
                              <span style={{ fontSize: '0.74rem', fontWeight: 800, padding: '3px 10px', borderRadius: '4px', background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626' }} />
                                {isEn ? 'Critical / Extreme' : 'Kritis / Ekstrem'}
                              </span>
                            </td>
                            <td>
                              <code style={{ fontWeight: 700, color: '#991b1b' }}>81 - 100</code>
                            </td>
                            <td style={{ fontSize: '0.76rem', color: '#334155' }}>
                              {isEn ? 'Severe hazard zone. Full geotechnical CPT bore test & multi-layered structural redundancy required.' : 'Zona bahaya tinggi. Wajib penyelidikan tanah sondir CPT mendalam & proteksi struktur berlapis.'}
                            </td>
                            <td style={{ fontSize: '0.76rem', color: '#64748b' }}>
                              {isEn ? 'Dedicated evacuation route & strict disaster masterplanning.' : 'Jalur evakuasi khusus tapak & masterplan mitigasi ketat.'}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-view 2: Service Integrity & Spatial API Gateway Monitoring */}
              {(activeTab === 'system' && systemSubView === 'service_integrity') && (() => {
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
            </div>
          )}

          {/* =================================================================
              TAB 5: ADMIN ACCOUNT SETTINGS
              ================================================================= */}
          {activeTab === 'account' && (
            <div className="gt-calm-panel">
              <div className="gt-calm-panel-header">
                <div>
                  <h3 className="gt-calm-panel-title">{isEn ? 'Admin Profile & Security Settings' : 'Pengaturan Profil & Keamanan Admin'}</h3>
                  <p className="gt-calm-panel-desc">{isEn ? 'Manage platform operator account details.' : 'Kelola data identitas pengelola platform GoResilio.'}</p>
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
                  placeholder={language === 'en' ? 'Enter customer full name' : 'Masukkan nama lengkap pelanggan'}
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
                    placeholder={language === 'en' ? 'name@company.com' : 'nama@email.com'}
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
                    placeholder={language === 'en' ? 'Enter company / organization name' : 'Masukkan nama instansi atau perusahaan'}
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

      {/* ===================================================================
          MODAL 4: PROPOSE PRICING MODAL
          =================================================================== */}
      {pricingModal && pricingModal.isOpen && (
        <div className="gt-calm-modal-backdrop" onClick={() => setPricingModal(null)}>
          <div className="gt-calm-modal-card" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="gt-calm-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: 28, height: 28, borderRadius: '6px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Tag size={15} />
                </div>
                <h3 className="gt-calm-modal-title">{isEn ? 'Propose Dossier Pricing' : 'Ajukan Penawaran Biaya Dossier'}</h3>
              </div>
              <button type="button" className="gt-calm-modal-close" onClick={() => setPricingModal(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="gt-calm-modal-body" style={{ padding: '16px 20px' }}>
              <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '14px', lineHeight: 1.5 }}>
                {isEn
                  ? 'Set the customized quote price for this enterprise / bespoke multi-hazard site audit dossier.'
                  : 'Tentukan harga penawaran resmi untuk permohonan audit dossier multi-hazard khusus ini.'}
              </p>
              <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                {isEn ? 'Proposed Price (IDR)' : 'Nominal Penawaran (IDR)'}
              </label>
              <input
                type="text"
                className="gt-calm-input"
                value={pricingModal.currentPrice}
                onChange={(e) => setPricingModal({ ...pricingModal, currentPrice: e.target.value })}
                placeholder="Contoh: Rp 750.000 atau Rp 2.500.000"
                style={{ fontSize: '0.88rem', fontWeight: 700 }}
              />
            </div>
            <div className="gt-calm-modal-footer">
              <button type="button" className="gt-calm-btn-ghost" onClick={() => setPricingModal(null)}>
                {isEn ? 'Cancel' : 'Batal'}
              </button>
              <button
                type="button"
                className="gt-calm-btn-primary"
                onClick={() => handleProposePrice(pricingModal.reqId, pricingModal.currentPrice)}
              >
                <Send size={13} />
                <span>{isEn ? 'Send Price Quote' : 'Kirim Penawaran'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          MODAL 5: CRYPTOGRAPHIC HASH VERIFICATION PROOF MODAL
          =================================================================== */}
      {verifiedHashModal && (
        <div className="gt-calm-modal-backdrop" onClick={() => setVerifiedHashModal(null)}>
          <div className="gt-calm-modal-card" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="gt-calm-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: 28, height: 28, borderRadius: '6px', background: '#dbeafe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <h3 className="gt-calm-modal-title">{isEn ? 'Cryptographic Certificate Verification' : 'Verifikasi Kriptografis Sertifikat'}</h3>
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{verifiedHashModal.certificateId}</span>
                </div>
              </div>
              <button type="button" className="gt-calm-modal-close" onClick={() => setVerifiedHashModal(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="gt-calm-modal-body" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
                <CheckCircle2 size={18} style={{ color: '#16a34a', flexShrink: 0 }} />
                <div>
                  <strong style={{ fontSize: '0.8rem', color: '#166534' }}>
                    {isEn ? 'Authenticity & Tamper-Proof Verified' : 'Keaslian Terverifikasi & Bebas Manipulasi'}
                  </strong>
                  <p style={{ fontSize: '0.72rem', color: '#15803d', marginTop: '2px' }}>
                    {isEn ? 'Digital signature matches the recorded immutable archival block.' : 'Tanda tangan digital cocok dengan rekaman blok arsip yang tidak dapat diubah.'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>{isEn ? 'Dossier Title' : 'Judul Berkas'}</span>
                  <strong style={{ color: '#0f172a', maxWidth: '300px', textAlign: 'right' }}>{verifiedHashModal.title}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>{isEn ? 'Recipient' : 'Penerima / Pemohon'}</span>
                  <span style={{ color: '#0f172a', fontWeight: 600 }}>{verifiedHashModal.customerName} ({verifiedHashModal.customerRole})</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>{isEn ? 'Issued Date' : 'Tanggal Penerbitan'}</span>
                  <span style={{ color: '#0f172a' }}>{verifiedHashModal.issuedDate}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>{isEn ? 'Audit Score & Tier' : 'Skor Audit Multi-Hazard'}</span>
                  <span style={{ color: '#0f172a', fontWeight: 700 }}>{verifiedHashModal.overallScore}/100 ({verifiedHashModal.overallLevel.toUpperCase()})</span>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
                    {isEn ? 'SHA-256 Cryptographic Checksum' : 'Checksum SHA-256 Dokumen'}
                  </span>
                  <button
                    type="button"
                    style={{ fontSize: '0.7rem', color: '#0284c7', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                    onClick={() => {
                      navigator.clipboard.writeText(verifiedHashModal.sha256Hash);
                      alert(isEn ? 'SHA-256 Hash copied to clipboard!' : 'Hash SHA-256 berhasil disalin ke papan klip!');
                    }}
                  >
                    <Copy size={11} />
                    <span>{isEn ? 'Copy Hash' : 'Salin Hash'}</span>
                  </button>
                </div>
                <div
                  style={{
                    background: '#0f172a',
                    color: '#38bdf8',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    fontSize: '0.74rem',
                    wordBreak: 'break-all',
                    lineHeight: 1.4
                  }}
                >
                  {verifiedHashModal.sha256Hash}
                </div>
              </div>
            </div>

            <div className="gt-calm-modal-footer">
              <button type="button" className="gt-calm-btn-primary" onClick={() => setVerifiedHashModal(null)}>
                {isEn ? 'Close Verification' : 'Tutup Verifikasi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagementConsole;
