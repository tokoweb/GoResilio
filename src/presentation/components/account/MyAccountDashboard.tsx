'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAssessment } from '../../context/AssessmentContext';
import { InstantReportPaymentModal } from '../modal/InstantReportPaymentModal';
import {
  LayoutDashboard,
  Building2,
  FileCheck,
  CreditCard,
  Settings,
  Compass,
  ArrowUpRight,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Download,
  Filter,
  Search,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Layers,
  MapPin,
  TrendingDown,
  Calendar,
  CheckCircle2,
  Lock,
  UserCheck,
  Share2,
  Activity,
  Plus,
  SlidersHorizontal,
  FolderLock,
  Flame,
  Droplets,
  Mountain,
  Zap,
  LayoutGrid,
  List,
  LogOut,
  Menu,
  Trash2,
  Award,
  Star,
  ChevronDown,
  ChevronUp,
  X,
  Info,
  FileText,
  Clock
} from 'lucide-react';
import { isPaidUser, canAccessComparison, getPaidDossierQuota, getTierDisplayName, getTierBadgeInfo, normalizeUserTier, UserTier } from '../../../domain/types/UserTier';

interface MonitoredProperty {
  id: string;
  name: string;
  address: string;
  city: string;
  type: string;
  overallScore: number;
  overallLevel: 'low' | 'medium' | 'high' | 'extreme';
  floodScore: number;
  quakeScore: number;
  heatScore: number;
  elevationMeters: number;
  nearestFaultKm: number;
  lastScanned: string;
  auditStatus: 'Siap Transaksi' | 'Perlu Mitigasi' | 'Zona Kritis';
}

export const MyAccountDashboard: React.FC = () => {
  const { language, t } = useLanguage();
  const {
    currentUser,
    setCurrentUser,
    accountEmail,
    activeAccountRole,
    setActiveAccountRole,
    setCurrentView,
    setIsReportModalOpen,
    handleDownloadReportRequest,
    assessment,
    logout,
    openAdminConsole
  } = useAssessment();

  const isEn = language === 'en';

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'assets' | 'compare' | 'reports' | 'checklist' | 'settings'>('assets');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Real Monitored Portfolio Properties (starts empty, loads from MySQL)
  const [properties, setProperties] = useState<MonitoredProperty[]>([]);
  const [isLoadingProps, setIsLoadingProps] = useState(true);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [isMobileListExpanded, setIsMobileListExpanded] = useState(false);

  // 3 Comparison Slot Selected Property IDs for Bundling 1
  const [slotAId, setSlotAId] = useState<string>('');
  const [slotBId, setSlotBId] = useState<string>('');
  const [slotCId, setSlotCId] = useState<string>('');

  // Delete Property State Modal
  const [propertyToDelete, setPropertyToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingProp, setIsDeletingProp] = useState(false);

  // Client User Profile State from Real Authenticated User
  const [clientProfile, setClientProfile] = useState({
    fullName: currentUser?.fullName || (activeAccountRole === 'Super Admin (RDI)' ? 'Tim Admin Geospasial RDI' : 'Pengguna Terdaftar'),
    email: currentUser?.email || accountEmail || 'user@gotangguh.id',
    phone: currentUser?.phoneNumber || '+62 812-xxxx-xxxx',
    organization: currentUser?.organization || (activeAccountRole === 'Home Buyer' ? 'Pribadi / Pembeli Rumah' : '-'),
    plan: getTierDisplayName(currentUser?.tierLevel, isEn),
    reportQuotaRemaining: getPaidDossierQuota(currentUser?.tierLevel, activeAccountRole)
  });

  // Security & Profile Edit State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileMsg, setProfileMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Handle Property Deletion
  const handleConfirmDeleteProperty = async () => {
    if (!propertyToDelete) return;
    setIsDeletingProp(true);
    try {
      const res = await fetch(`/api/properties?id=${encodeURIComponent(propertyToDelete.id)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success || res.ok) {
        setProperties(prev => {
          const updated = prev.filter(p => p.id !== propertyToDelete.id);
          if (selectedPropertyId === propertyToDelete.id) {
            setSelectedPropertyId(updated[0]?.id || '');
          }
          if (slotAId === propertyToDelete.id) setSlotAId(updated[0]?.id || '');
          if (slotBId === propertyToDelete.id) setSlotBId(updated[1]?.id || updated[0]?.id || '');
          if (slotCId === propertyToDelete.id) setSlotCId(updated[2]?.id || updated[0]?.id || '');
          return updated;
        });
      }
    } catch (err) {
      console.warn('Failed to delete property:', err);
    } finally {
      setIsDeletingProp(false);
      setPropertyToDelete(null);
    }
  };

  // Sync client profile with current user when auth state updates
  useEffect(() => {
    if (currentUser) {
      setClientProfile({
        fullName: currentUser.fullName || 'Pengguna Terdaftar',
        email: currentUser.email || accountEmail,
        phone: currentUser.phoneNumber || '+62 812-xxxx-xxxx',
        organization: currentUser.organization || (activeAccountRole === 'Home Buyer' ? 'Pribadi / Pembeli Rumah' : '-'),
        plan: getTierDisplayName(currentUser.tierLevel, isEn),
        reportQuotaRemaining: getPaidDossierQuota(currentUser.tierLevel, activeAccountRole)
      });
    }
  }, [currentUser, accountEmail, activeAccountRole, isEn]);

  // Load Real Saved Properties
  useEffect(() => {
    const fetchUserProperties = async () => {
      setIsLoadingProps(true);
      try {
        const emailToQuery = currentUser?.email || accountEmail;
        const url = emailToQuery ? `/api/properties?email=${encodeURIComponent(emailToQuery)}` : '/api/properties';
        const res = await fetch(url);
        const data = await res.json();

        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          const mapped: MonitoredProperty[] = data.data.map((p: any) => {
            const hasScore = typeof p.overallScore === 'number';
            return {
              id: p.id || p.refNumber,
              name: p.propertyName || (isEn ? 'Monitored Plot' : 'Aset Terpantau'),
              address: p.address || '-',
              city: p.address?.split(',').pop()?.trim() || 'Indonesia',
              type: p.propertyType || (isEn ? 'Data unavailable' : 'Data belum tersedia'),
              overallScore: hasScore ? p.overallScore : null,
              overallLevel: (p.riskLevel || 'medium') as any,
              floodScore: typeof p.floodScore === 'number' ? p.floodScore : null,
              quakeScore: typeof p.quakeScore === 'number' ? p.quakeScore : null,
              heatScore: typeof p.heatScore === 'number' ? p.heatScore : null,
              elevationMeters: p.elevationMeters !== null && p.elevationMeters !== undefined ? Number(p.elevationMeters) : null,
              nearestFaultKm: p.faultDistanceKm !== null && p.faultDistanceKm !== undefined ? Number(p.faultDistanceKm) : null,
              lastScanned: p.lastUpdatedStr || (isEn ? 'Today' : 'Hari ini'),
              auditStatus: !hasScore ? 'Belum Dinilai' : p.overallScore > 75 ? 'Zona Kritis' : p.overallScore > 45 ? 'Perlu Mitigasi' : 'Siap Transaksi'
            };
          });
          setProperties(mapped);
          setSelectedPropertyId(mapped[0].id);
          if (mapped.length > 0) setSlotAId(mapped[0].id);
          if (mapped.length > 1) setSlotBId(mapped[1].id);
          if (mapped.length > 2) setSlotCId(mapped[2].id);
        } else if (assessment && emailToQuery) {
          try {
            await fetch('/api/properties', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userEmail: emailToQuery,
                userId: currentUser?.id,
                propertyName: assessment.location.formattedAddress?.split(',')[0] || 'Kavling Tapak Terpilih',
                address: assessment.location.formattedAddress || 'Titik Koordinat Geospasial',
                propertyType: assessment.propertyType || (isEn ? 'Data unavailable' : 'Data belum tersedia'),
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
            });
            const refetch = await fetch(url);
            const refData = await refetch.json();
            if (refData.success && Array.isArray(refData.data)) {
              const mapped: MonitoredProperty[] = refData.data.map((p: any) => {
                const hasScore = typeof p.overallScore === 'number';
                return {
                  id: p.id || p.refNumber,
                  name: p.propertyName || (isEn ? 'Monitored Plot' : 'Aset Terpantau'),
                  address: p.address || '-',
                  city: p.address?.split(',').pop()?.trim() || 'Indonesia',
                  type: p.propertyType || (isEn ? 'Data unavailable' : 'Data belum tersedia'),
                  overallScore: hasScore ? p.overallScore : null,
                  overallLevel: (p.riskLevel || 'medium') as any,
                  floodScore: typeof p.floodScore === 'number' ? p.floodScore : null,
                  quakeScore: typeof p.quakeScore === 'number' ? p.quakeScore : null,
                  heatScore: typeof p.heatScore === 'number' ? p.heatScore : null,
                  elevationMeters: p.elevationMeters !== null && p.elevationMeters !== undefined ? Number(p.elevationMeters) : null,
                  nearestFaultKm: p.faultDistanceKm !== null && p.faultDistanceKm !== undefined ? Number(p.faultDistanceKm) : null,
                  lastScanned: p.lastUpdatedStr || (isEn ? 'Today' : 'Hari ini'),
                  auditStatus: !hasScore ? 'Belum Dinilai' : p.overallScore > 75 ? 'Zona Kritis' : p.overallScore > 45 ? 'Perlu Mitigasi' : 'Siap Transaksi'
                };
              });
              setProperties(mapped);
              if (mapped.length > 0) {
                setSelectedPropertyId(mapped[0].id);
                setSlotAId(mapped[0].id);
              }
            }
          } catch {}
        } else {
          setProperties([]);
          setSelectedPropertyId('');
        }
      } catch (e) {
        console.warn('Could not fetch real properties from MySQL:', e);
        setProperties([]);
        setSelectedPropertyId('');
      } finally {
        setIsLoadingProps(false);
      }
    };

    fetchUserProperties();
  }, [currentUser, accountEmail, assessment]);

  // Selected Active Property for Inspector HUD
  const activeProperty = properties.find((p) => p.id === selectedPropertyId) || (properties.length > 0 ? properties[0] : null);

  // Filtered Properties
  const filteredProperties = properties.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk =
      selectedRiskFilter === 'all' ||
      (selectedRiskFilter === 'high' && (p.overallLevel === 'high' || p.overallLevel === 'extreme')) ||
      (selectedRiskFilter === 'medium' && p.overallLevel === 'medium') ||
      (selectedRiskFilter === 'low' && p.overallLevel === 'low');
    return matchesSearch && matchesRisk;
  });

  // Dynamic Metrics Computed from Real Portfolio Data
  const totalAssetsCount = properties.length;
  const scoredProperties = properties.filter((p) => typeof p.overallScore === 'number');
  const avgRiskScore = scoredProperties.length > 0
    ? (scoredProperties.reduce((acc, p) => acc + (p.overallScore ?? 0), 0) / scoredProperties.length).toFixed(1)
    : '0';
  const criticalAssetsCount = properties.filter(
    (p) => p.overallLevel === 'high' || p.overallLevel === 'extreme'
  ).length;

  const avgRiskBadge =
    Number(avgRiskScore) > 70
      ? { label: isEn ? 'High' : 'Tinggi', class: 'red' }
      : Number(avgRiskScore) > 35
      ? { label: isEn ? 'Moderate' : 'Sedang', class: 'amber' }
      : totalAssetsCount > 0
      ? { label: isEn ? 'Low' : 'Aman', class: 'green' }
      : { label: isEn ? 'Empty' : 'Kosong', class: 'neutral' };

  // Dynamic Hazard-Driven Due Diligence Checklist (Interactive & Persistent)
  const floodRiskScore = typeof assessment?.flood?.score === 'number' ? assessment.flood.score : 0;
  const quakeRiskScore = typeof assessment?.quake?.score === 'number' ? assessment.quake.score : 0;
  const heatRiskScore = typeof assessment?.heat?.score === 'number' ? assessment.heat.score : 0;

  const getDynamicChecklistTemplates = () => {
    const items: Array<{
      id: string;
      title: string;
      desc: string;
      category: 'flood' | 'quake' | 'heat' | 'universal';
      badgeLabel: string;
      badgeColor: string;
      checked: boolean;
    }> = [
      {
        id: 'chk-cpt',
        title: isEn ? 'Soil Cone Penetration Testing (CPT / Sondir)' : 'Uji Penetrasi Tanah Sederhana (Sondir / CPT)',
        desc: isEn ? 'Conduct 2-point CPT testing to verify hard stratum bearing capacity before deed signing.' : 'Lakukan uji CPT 2 titik untuk memastikan daya dukung tanah keras sebelum tanda tangan akad jual beli.',
        category: 'universal',
        badgeLabel: isEn ? 'Geotechnical' : 'Geoteknik SNI',
        badgeColor: '#0284c7',
        checked: false
      },
      {
        id: 'chk-insurance',
        title: isEn ? 'Insurance Policy Hazard Extension (FLEXAS PLUS)' : 'Klaim Klausul Perluasan Asuransi Gempa & Banjir (FLEXAS)',
        desc: isEn ? 'Ensure property insurance covers 100% replacement cost for flood and earthquake events.' : 'Pastikan polis asuransi properti menyertakan perluasan banjir dan gempa bumi 100% replacement cost.',
        category: 'universal',
        badgeLabel: isEn ? 'Insurance' : 'Asuransi Properti',
        badgeColor: '#059669',
        checked: false
      }
    ];

    if (floodRiskScore > 50) {
      items.unshift({
        id: 'chk-flood-elev',
        title: isEn ? 'Ground Elevation & Slab Level Verification (+60cm)' : 'Verifikasi Peil Banjir & Peninggian Lantai Dasar (+60cm)',
        desc: isEn
          ? `High flood exposure detected (Score: ${floodRiskScore}). Ensure ground floor slab is at least +60cm above road crown level and verify neighborhood drainage outlet.`
          : `Terdeteksi paparan banjir tinggi (Skor: ${floodRiskScore}). Pastikan elevasi peil lantai dasar minimum +60cm di atas puncak aspal jalan dan cek saluran drainase lingkungan.`,
        category: 'flood',
        badgeLabel: isEn ? 'Flood Hazard' : 'Mitigasi Banjir',
        badgeColor: '#0284c7',
        checked: false
      });
      items.push({
        id: 'chk-flood-valve',
        title: isEn ? 'Backflow Prevention Valve & Auto Sump Pump' : 'Instalasi Backflow Valve & Pompa Sump Otomatis',
        desc: isEn
          ? 'Prevent stormwater sewage backflow into residential perimeter during extreme rainfall events.'
          : 'Cegah arus balik luapan air got/drainase kota ke dalam perimeter hunian saat hujan ekstrem.',
        category: 'flood',
        badgeLabel: isEn ? 'Drainage' : 'Drainase Saluran',
        badgeColor: '#0284c7',
        checked: false
      });
    }

    if (quakeRiskScore > 40) {
      items.unshift({
        id: 'chk-quake-fault',
        title: isEn ? 'Active Fault Line & Seismic Code Audit (SNI 1726:2019)' : 'Audit Jarak Patahan Sesar Aktif & SNI 1726:2019',
        desc: isEn
          ? `Significant seismic hazard identified (Score: ${quakeRiskScore}). Ensure foundation footing, continuous tie-beams (sloof), and reinforced concrete frames conform to SNI 1726:2019.`
          : `Terdeteksi paparan gempa signifikan (Skor: ${quakeRiskScore}). Pastikan struktur pondasi, sloof pengikat, dan portal kolom mengacu ke standar SNI 1726:2019.`,
        category: 'quake',
        badgeLabel: isEn ? 'Seismic Code' : 'Mitigasi Gempa',
        badgeColor: '#ea580c',
        checked: false
      });
      items.push({
        id: 'chk-quake-anchor',
        title: isEn ? 'Masonry Wall Anchoring & Ring Beam Binding' : 'Angkur Dinding Bata & Ikatan Ringbalk Beton',
        desc: isEn
          ? 'Verify minimum 10mm rebars anchoring wall corners to perimeter ring beams to prevent out-of-plane collapse.'
          : 'Verifikasi ikatan besi angkur minimum 10mm pada pertemuan dinding dan ringbalk beton untuk mencegah roboh saat guncangan.',
        category: 'quake',
        badgeLabel: isEn ? 'Structural' : 'Struktur Bangunan',
        badgeColor: '#ea580c',
        checked: false
      });
    }

    if (heatRiskScore > 50) {
      items.push({
        id: 'chk-heat-insul',
        title: isEn ? 'Roof Thermal Insulation & Cross Ventilation (UHI)' : 'Insulasi Termal Atap & Ventilasi Silang (Mitigasi Panas)',
        desc: isEn
          ? `High heat stress / microclimate thermal index detected (Score: ${heatRiskScore}). Install reflective aluminum roof foil and optimize cross-ventilation.`
          : `Terdeteksi beban panas lingkungan tinggi (Skor: ${heatRiskScore}). Pasang insulasi alumunium foil reflektif di bawah atap dan optimalkan bukaan sirkulasi udara.`,
        category: 'heat',
        badgeLabel: isEn ? 'Heat Stress' : 'Mitigasi Panas',
        badgeColor: '#d97706',
        checked: false
      });
    }

    return items;
  };

  const [checklist, setChecklist] = useState(() => getDynamicChecklistTemplates());

  // Recompute checklist items when assessment hazard profile changes, preserving checked states
  useEffect(() => {
    try {
      const templates = getDynamicChecklistTemplates();
      const emailKey = currentUser?.email || accountEmail || 'guest';
      const saved = localStorage.getItem(`gt_dd_checklist_${emailKey}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setChecklist(templates.map((item) => {
            const found = parsed.find((p: any) => p.id === item.id);
            return found ? { ...item, checked: !!found.checked } : item;
          }));
          return;
        }
      }
      setChecklist(templates);
    } catch {}
  }, [currentUser, accountEmail, language, floodRiskScore, quakeRiskScore, heatRiskScore]);

  const toggleChecklistItem = (id: string) => {
    setChecklist((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, checked: !c.checked } : c));
      try {
        const emailKey = currentUser?.email || accountEmail || 'guest';
        localStorage.setItem(`gt_dd_checklist_${emailKey}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const completedCount = checklist.filter((c) => c.checked).length;
  const checklistPct = checklist.length > 0 ? Math.round((completedCount / checklist.length) * 100) : 0;

  // Customer Report Request Lifecycle State
  interface CustomerReportRequest {
    id: string;
    refNumber: string;
    propertyName: string;
    city: string;
    packageType: string;
    status: 'requested' | 'price_proposed' | 'payment_confirmed' | 'generating' | 'delivered';
    proposedPrice?: string;
    requestedDate: string;
    deliveredDate?: string;
    overallScore?: number;
    overallLevel?: 'low' | 'medium' | 'high' | 'extreme';
  }

  const [customerRequests, setCustomerRequests] = useState<CustomerReportRequest[]>([
    {
      id: 'crq-1',
      refNumber: 'REQ-2026-0819',
      propertyName: 'Cluster Bukit Asri Residence Kavling 4B',
      city: 'Kab. Bogor, Jawa Barat',
      packageType: 'Instant Groundsure Dossier (10–14 Hal)',
      status: 'delivered',
      proposedPrice: 'Rp 35.000',
      requestedDate: '2026-08-19',
      deliveredDate: '2026-08-19',
      overallScore: 38,
      overallLevel: 'medium'
    },
    {
      id: 'crq-2',
      refNumber: 'REQ-2026-0902',
      propertyName: 'Kavling Graha Harmoni Blok C1',
      city: 'Kota Bekasi, Jawa Barat',
      packageType: 'Instant Groundsure Dossier (10–14 Hal)',
      status: 'generating',
      proposedPrice: 'Rp 35.000',
      requestedDate: '2026-09-02',
      overallScore: 54,
      overallLevel: 'high'
    },
    {
      id: 'crq-3',
      refNumber: 'REQ-2026-0904',
      propertyName: 'Rukan Sudirman Bisnis Park',
      city: 'Jakarta Pusat, DKI Jakarta',
      packageType: 'Bundling Multi-Property Report (3 Kavling)',
      status: 'price_proposed',
      proposedPrice: 'Rp 85.000',
      requestedDate: '2026-09-04'
    }
  ]);

  const [reportFilter, setReportFilter] = useState<'all' | 'in_progress' | 'delivered'>('all');
  const [newRequestSuccessMsg, setNewRequestSuccessMsg] = useState<string | null>(null);

  const handleCreateNewReportRequest = () => {
    const newReqId = `crq-${Date.now()}`;
    const newRefNumber = `REQ-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const propName = assessment?.address ? assessment.address.split(',')[0] : (properties[0]?.name || 'Properti Asesmen Baru');
    const propCity = assessment?.city || (properties[0]?.city || 'Indonesia');

    const newReq: CustomerReportRequest = {
      id: newReqId,
      refNumber: newRefNumber,
      propertyName: propName,
      city: propCity,
      packageType: 'Instant Groundsure Dossier (10–14 Hal)',
      status: 'requested',
      requestedDate: new Date().toISOString().split('T')[0],
      overallScore: typeof assessment?.overallScore === 'number' ? assessment.overallScore : undefined,
      overallLevel: assessment?.overallLevel || undefined
    };

    setCustomerRequests((prev) => [newReq, ...prev]);
    setNewRequestSuccessMsg(isEn
      ? `Report request ${newRefNumber} successfully submitted! Admin team will review and issue quotation.`
      : `Permohonan laporan ${newRefNumber} berhasil dikirim! Tim admin akan segera meninjau dan menerbitkan penawaran.`
    );
    setTimeout(() => setNewRequestSuccessMsg(null), 6000);
  };

  const handleConfirmCustomerPayment = (reqId: string) => {
    setCustomerRequests((prev) => prev.map((r) => {
      if (r.id === reqId) {
        return { ...r, status: 'generating' };
      }
      return r;
    }));
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    setProfileMsg(null);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: clientProfile.email,
          fullName: clientProfile.fullName,
          phoneNumber: clientProfile.phone,
          organization: clientProfile.organization
        })
      });
      const data = await res.json();
      if (data.success) {
        if (data.user) setCurrentUser(data.user);
        setProfileMsg({ text: isEn ? 'Profile updated successfully!' : 'Profil berhasil diperbarui!', type: 'success' });
      } else {
        setProfileMsg({ text: data.error || (isEn ? 'Failed to update profile' : 'Gagal memperbarui profil'), type: 'error' });
      }
    } catch {
      setProfileMsg({ text: isEn ? 'Network error occurred' : 'Terjadi gangguan jaringan', type: 'error' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      setProfileMsg({ text: isEn ? 'Please fill in current and new password' : 'Mohon isi kata sandi saat ini dan baru', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setProfileMsg({ text: isEn ? 'New passwords do not match' : 'Konfirmasi kata sandi baru tidak cocok', type: 'error' });
      return;
    }
    setIsChangingPass(true);
    setProfileMsg(null);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: clientProfile.email,
          currentPassword,
          newPassword
        })
      });
      const data = await res.json();
      if (data.success) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setProfileMsg({ text: isEn ? 'Password changed successfully!' : 'Kata sandi keamanan akun berhasil diperbarui!', type: 'success' });
      } else {
        setProfileMsg({ text: data.error || (isEn ? 'Failed to change password' : 'Gagal mengubah kata sandi'), type: 'error' });
      }
    } catch {
      setProfileMsg({ text: isEn ? 'Network error occurred' : 'Terjadi gangguan jaringan', type: 'error' });
    } finally {
      setIsChangingPass(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'GT';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="gt-console-shell">
      {/* Background Architectural Vector SVG Contour Overlay */}
      <svg className="gt-spatial-contour-bg" viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 100 C150 120, 200 40, 350 80 C420 100, 480 50, 500 120" stroke="rgba(194, 65, 12, 0.08)" strokeWidth="1.5" strokeDasharray="4 4" />
        <path d="M0 200 C120 180, 220 260, 380 210 C440 190, 480 240, 500 220" stroke="rgba(194, 65, 12, 0.07)" strokeWidth="1.5" />
        <path d="M30 320 C140 340, 260 280, 390 350 C450 370, 490 310, 500 340" stroke="rgba(16, 185, 129, 0.08)" strokeWidth="1.5" strokeDasharray="3 3" />
        <circle cx="380" cy="210" r="4" fill="rgba(194, 65, 12, 0.25)" />
        <circle cx="200" cy="40" r="3" fill="rgba(16, 185, 129, 0.3)" />
      </svg>

      {/* Mobile Drawer Overlay Backdrop */}
      {isMobileMenuOpen && (
        <div className="gt-calm-mobile-backdrop" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* 1. Frosted Glass Modern Sidebar */}
      <aside className={`gt-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="gt-sidebar-header">
          <div className="gt-sidebar-logo-group">
            <div className="gt-sidebar-logo-sq">GR</div>
            <div className="gt-sidebar-brand-text">
              <span className="gt-sb-title">GoResilio</span>
              <span className="gt-sb-env">Spatial Asset Console</span>
            </div>
          </div>
          <button
            type="button"
            className="gt-mobile-close-btn"
            style={{ color: '#0f172a', border: '1px solid #cbd5e1', background: '#f1f5f9', borderRadius: '6px', padding: '5px', cursor: 'pointer' }}
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label={isEn ? 'Close Menu' : 'Tutup Menu'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Authenticated User Account Role Badge */}
        <div style={{ padding: '10px 14px', margin: '0 0 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <span style={{ display: 'block', fontSize: '0.66rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b' }}>
            {isEn ? 'Active Persona' : 'Profil Pengguna'}
          </span>
          <strong style={{ display: 'block', fontSize: '0.82rem', color: '#0f172a', marginTop: '2px', fontWeight: 800 }}>
            {activeAccountRole}
          </strong>
        </div>

        {/* Navigation Item Links */}
        <nav className="gt-sidebar-nav" aria-label="Menu My Account">
          <button
            type="button"
            className={`gt-sb-nav-item ${activeTab === 'assets' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('assets');
              setIsMobileMenuOpen(false);
            }}
          >
            <Building2 size={16} />
            <span>{isEn ? 'Asset Portfolio' : 'Portofolio Aset'}</span>
            <span className="gt-sb-pill-count">{properties.length}</span>
          </button>

          <button
            type="button"
            className={`gt-sb-nav-item ${activeTab === 'compare' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('compare');
              setIsMobileMenuOpen(false);
            }}
          >
            <SlidersHorizontal size={16} />
            <span>{isEn ? 'Side-by-Side Comparison' : 'Komparasi 3 Properti'}</span>
            <span className="gt-sb-pill-tag" style={{ background: '#fff7ed', color: '#c2410c', borderColor: '#fed7aa' }}>Bundling 1</span>
          </button>

          <button
            type="button"
            className={`gt-sb-nav-item ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('reports');
              setIsMobileMenuOpen(false);
            }}
          >
            <FileCheck size={16} />
            <span>{isEn ? 'Dossier Report (PDF)' : 'Laporan Komprehensif (PDF)'}</span>
            <span className="gt-sb-pill-tag">Standar Resmi</span>
          </button>

          <button
            type="button"
            className={`gt-sb-nav-item ${activeTab === 'checklist' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('checklist');
              setIsMobileMenuOpen(false);
            }}
          >
            <CheckCircle2 size={16} />
            <span>{isEn ? 'Due Diligence Checklist' : 'Uji Tuntas Properti'}</span>
          </button>

          <button
            type="button"
            className={`gt-sb-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('settings');
              setIsMobileMenuOpen(false);
            }}
          >
            <Settings size={16} />
            <span>{isEn ? 'Account Settings' : 'Pengaturan Akun'}</span>
          </button>
        </nav>

        {/* Sidebar Footer Real User Card & Logout Button */}
        <div className="gt-sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
          <div className="gt-sb-user-card">
            <div className="gt-sb-user-avatar">
              {getInitials(clientProfile.fullName)}
            </div>
            <div className="gt-sb-user-meta">
              <span className="gt-sb-user-name">{clientProfile.fullName}</span>
              <span className="gt-sb-user-role">{activeAccountRole}</span>
            </div>
          </div>

          <button
            type="button"
            className="gt-calm-btn-logout"
            onClick={() => openAdminConsole('reports', 'inquiries')}
            style={{ background: '#fff7ed', color: '#c2410c', borderColor: '#fed7aa', fontWeight: 700 }}
            title={isEn ? 'Switch to Consultation Admin Console' : 'Buka Dashboard Admin Konsultasi'}
          >
            <ShieldCheck size={14} style={{ color: '#c2410c' }} />
            <span>{isEn ? 'Consultation Admin' : 'Dashboard Admin Konsultasi'}</span>
          </button>

          <button
            type="button"
            className="gt-calm-btn-logout"
            onClick={() => setShowLogoutConfirm(true)}
          >
            <LogOut size={14} />
            <span>{isEn ? 'Log Out' : 'Keluar / Logout'}</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Spatial Workspace Stage */}
      <main className="gt-console-main">
        {/* Workspace Topbar */}
        <header className="gt-workspace-topbar">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              type="button"
              className="gt-mobile-hamburger"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label={isEn ? 'Open Menu' : 'Buka Menu'}
            >
              <Menu size={18} />
            </button>

            <div className="gt-topbar-breadcrumb">
              <span className="gt-bc-root">My Account</span>
              <ChevronRight size={14} className="gt-bc-divider" />
              <span className="gt-bc-current">
                {activeTab === 'assets' && (isEn ? 'Property Portfolio & Hazard Monitoring' : 'Portofolio & Pantauan Risiko Lokasi')}
                {activeTab === 'compare' && (isEn ? 'Bundling 1: Side-by-Side Property Comparison Matrix' : 'Bundling 1: Matriks Komparasi Multi-Tapak')}
                {activeTab === 'reports' && (isEn ? 'Dossier Report Archive (PDF)' : 'Arsip Laporan Properti (PDF)')}
                {activeTab === 'checklist' && (isEn ? 'Pre-Transaction Due Diligence Checklist' : 'Checklist Uji Tuntas Pra-Transaksi')}
                {activeTab === 'settings' && (isEn ? 'Profile & Account Security' : 'Profil & Keamanan Akun')}
              </span>
            </div>
          </div>

          <div className="gt-topbar-actions">
            <button
              type="button"
              className="gt-btn-ghost-sm"
              onClick={() => openAdminConsole('reports', 'inquiries')}
              style={{ background: '#fff7ed', color: '#c2410c', borderColor: '#fed7aa', fontWeight: 700 }}
              title={isEn ? 'Consultation & Site Survey Admin Console' : 'Dashboard Admin Konsultasi & Pengelola'}
            >
              <ShieldCheck size={14} style={{ color: '#c2410c' }} />
              <span>{isEn ? 'Admin Console' : 'Dashboard Admin'}</span>
            </button>
            <button
              type="button"
              className="gt-btn-ghost-sm"
              onClick={() => setCurrentView('public')}
            >
              <Compass size={14} />
              <span>{isEn ? 'Open Satellite Map' : 'Buka Peta Satelit'}</span>
            </button>
            <button
              type="button"
              className="gt-btn-primary-sm"
              onClick={() => setCurrentView('public')}
            >
              <Plus size={14} />
              <span>{isEn ? 'Scan New Property' : 'Pindai Properti Baru'}</span>
            </button>
          </div>
        </header>

        {/* Workspace Content Body */}
        <div className="gt-workspace-body">
          {/* TAB 1: ASSETS PORTFOLIO & SPATIAL RISK */}
          {activeTab === 'assets' && (
            <>
              {/* 1. Dynamic Metric Strip KPI Cards */}
              <div className="gt-metric-strip">
                <div className="gt-metric-tile">
                  <span className="gt-tile-label">{isEn ? 'Saved Properties' : 'Properti Tersimpan'}</span>
                  <div className="gt-tile-num-row">
                    <span className="gt-tile-num">{totalAssetsCount}</span>
                    <span className={`gt-tile-badge ${totalAssetsCount > 0 ? 'green' : 'neutral'}`}>
                      {totalAssetsCount > 0 ? (isEn ? 'Active' : 'Aktif') : (isEn ? 'None' : 'Kosong')}
                    </span>
                  </div>
                  <span className="gt-tile-sub">{isEn ? 'Total saved properties' : 'Total properti tersimpan'}</span>
                </div>

                <div className="gt-metric-tile">
                  <span className="gt-tile-label">{isEn ? 'Average Risk Index' : 'Indeks Risiko Rata-Rata'}</span>
                  <div className="gt-tile-num-row">
                    <span className="gt-tile-num">{avgRiskScore}</span>
                    <span className={`gt-tile-badge ${avgRiskBadge.class}`}>
                      {avgRiskBadge.label}
                    </span>
                  </div>
                  <span className="gt-tile-sub">{isEn ? 'Integrated Risk Index' : 'Indeks Risiko Terpadu'}</span>
                </div>

                <div className="gt-metric-tile">
                  <span className="gt-tile-label">{isEn ? 'Needs Attention' : 'Perlu Perhatian'}</span>
                  <div className="gt-tile-num-row">
                    <span className="gt-tile-num">{criticalAssetsCount}</span>
                    <span className={`gt-tile-badge ${criticalAssetsCount > 0 ? 'orange' : 'green'}`}>
                      {criticalAssetsCount > 0 ? (isEn ? 'Action Req.' : 'Perlu Tindakan') : (isEn ? 'Safe' : 'Terkendali')}
                    </span>
                  </div>
                  <span className="gt-tile-sub">{isEn ? 'High / critical risk locations' : 'Lokasi risiko tinggi / kritis'}</span>
                </div>

                <div className="gt-metric-tile">
                  <span className="gt-tile-label">{isEn ? 'Report Quota Remaining' : 'Sisa Kuota Laporan PDF'}</span>
                  <div className="gt-tile-num-row">
                    <span className="gt-tile-num">{clientProfile.reportQuotaRemaining}</span>
                    {(() => {
                      const tb = getTierBadgeInfo(currentUser?.tierLevel, activeAccountRole, isEn);
                      return <span className={`gt-tile-badge ${tb.class}`}>{tb.label}</span>;
                    })()}
                  </div>
                  <span className="gt-tile-sub">
                    {getTierBadgeInfo(currentUser?.tierLevel, activeAccountRole, isEn).subtext}
                  </span>
                </div>
              </div>

              {/* 2. Bento Dual-Split: Asset Dossiers & Live Spatial Inspector */}
              <div className="gt-dashboard-dual-split">
                {/* Left: Asset List / Grid with Filters */}
                <div className="gt-table-container-card">
                  <div className="gt-table-controls-bar">
                    <div className="gt-table-search-input-wrap">
                      <Search size={14} className="gt-search-icon" />
                      <input
                        type="text"
                        className="gt-table-search-input"
                        placeholder={isEn ? 'Search plot name, cluster, or city...' : 'Cari nama kavling, klaster, atau kota...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="gt-filter-pill-group">
                        <button
                          type="button"
                          className={`gt-filter-btn ${selectedRiskFilter === 'all' ? 'active' : ''}`}
                          onClick={() => setSelectedRiskFilter('all')}
                        >
                          {isEn ? `All (${properties.length})` : `Semua (${properties.length})`}
                        </button>
                        <button
                          type="button"
                          className={`gt-filter-btn ${selectedRiskFilter === 'high' ? 'active' : ''}`}
                          onClick={() => setSelectedRiskFilter('high')}
                        >
                          {isEn ? 'High Risk' : 'Risiko Tinggi'}
                        </button>
                        <button
                          type="button"
                          className={`gt-filter-btn ${selectedRiskFilter === 'medium' ? 'active' : ''}`}
                          onClick={() => setSelectedRiskFilter('medium')}
                        >
                          {isEn ? 'Moderate Risk' : 'Risiko Sedang'}
                        </button>
                        <button
                          type="button"
                          className={`gt-filter-btn ${selectedRiskFilter === 'low' ? 'active' : ''}`}
                          onClick={() => setSelectedRiskFilter('low')}
                        >
                          {isEn ? 'Low Risk' : 'Risiko Rendah'}
                        </button>
                      </div>

                      <button
                        type="button"
                        className="gt-btn-ghost-sm"
                        style={{ padding: '6px 12px', fontSize: '0.74rem', fontWeight: 800, color: '#c2410c', borderColor: '#fed7aa', background: '#fff7ed' }}
                        onClick={() => setActiveTab('compare')}
                      >
                        <SlidersHorizontal size={13} />
                        <span>{isEn ? 'Compare (Bundling 1)' : 'Komparasi 3 Properti'}</span>
                      </button>

                      <div style={{ display: 'flex', border: '1px solid #e8e4db', borderRadius: '8px', overflow: 'hidden' }}>
                        <button
                          type="button"
                          style={{
                            background: viewMode === 'grid' ? '#0f172a' : '#ffffff',
                            color: viewMode === 'grid' ? '#ffffff' : '#64748b',
                            border: 'none',
                            padding: '6px 10px',
                            cursor: 'pointer'
                          }}
                          onClick={() => setViewMode('grid')}
                          title={isEn ? 'Grid Card View' : 'Tampilan Kartu Spatial'}
                        >
                          <LayoutGrid size={14} />
                        </button>
                        <button
                          type="button"
                          style={{
                            background: viewMode === 'table' ? '#0f172a' : '#ffffff',
                            color: viewMode === 'table' ? '#ffffff' : '#64748b',
                            border: 'none',
                            padding: '6px 10px',
                            cursor: 'pointer'
                          }}
                          onClick={() => setViewMode('table')}
                          title={isEn ? 'Table Data View' : 'Tampilan Tabel Data'}
                        >
                          <List size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Empty State when user has 0 saved properties */}
                  {filteredProperties.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px 24px', background: '#fbfaf8', borderRadius: '12px', border: '1px dashed #cbd5e1', margin: '16px' }}>
                      <Building2 size={36} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
                      <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
                        {isEn ? 'No Saved Properties in Portfolio' : 'Belum Ada Properti yang Dipantau'}
                      </h4>
                      <p style={{ fontSize: '0.84rem', color: '#64748b', maxWidth: '440px', margin: '0 auto 18px', lineHeight: 1.5 }}>
                        {isEn
                          ? 'This newly registered account does not have any saved property plots yet. Scan your first location on the interactive map.'
                          : 'Akun Anda baru dan belum memiliki daftar tapak properti tersimpan. Evaluasi dan simpan tapak tanah/bangunan pertama Anda melalui peta interaktif.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => setCurrentView('public')}
                        style={{ background: '#c2410c', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '10px 18px', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', boxShadow: '0 3px 10px rgba(194, 65, 12, 0.2)' }}
                      >
                        <Compass size={14} />
                        <span>{isEn ? 'Scan New Property on Map' : 'Pindai Properti Baru di Peta'}</span>
                      </button>
                    </div>
                  ) : viewMode === 'grid' ? (
                    /* View Mode: Grid Bento Showcase - CLICK CARD TO EXPAND FULL DETAILS */
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px', padding: '16px' }}>
                        {(isMobileListExpanded ? filteredProperties : filteredProperties.slice(0, 4)).map((p) => {
                          const isSelected = activeProperty && p.id === activeProperty.id;
                          return (
                            <div
                              key={p.id}
                              onClick={() => setSelectedPropertyId(p.id)}
                              style={{
                                background: isSelected ? '#ffffff' : '#fbfaf8',
                                border: isSelected ? '2px solid #c2410c' : '1px solid #e8e4db',
                                borderRadius: '14px',
                                padding: '16px',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                                transition: 'all 0.2s ease',
                                boxShadow: isSelected ? '0 8px 24px rgba(194, 65, 12, 0.14)' : '0 2px 6px rgba(44, 38, 30, 0.02)',
                                position: 'relative'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#c2410c', fontFamily: 'monospace' }}>{p.id}</span>
                                  <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>{p.name}</h4>
                                  <span style={{ fontSize: '0.74rem', color: '#64748b' }}>{p.city}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPropertyToDelete({ id: p.id, name: p.name });
                                    }}
                                    style={{
                                      background: 'transparent',
                                      border: 'none',
                                      color: '#94a3b8',
                                      cursor: 'pointer',
                                      padding: '4px',
                                      borderRadius: '6px',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      transition: 'all 0.15s ease'
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                                    onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                                    title={isEn ? 'Delete Property' : 'Hapus Properti'}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                  <div
                                    style={{
                                      width: '36px',
                                      height: '36px',
                                      borderRadius: '8px',
                                      background: p.overallLevel === 'high' || p.overallLevel === 'extreme' ? '#fef2f2' : p.overallLevel === 'medium' ? '#fffbeb' : '#ecfdf5',
                                      color: p.overallLevel === 'high' || p.overallLevel === 'extreme' ? '#dc2626' : p.overallLevel === 'medium' ? '#d97706' : '#059669',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontWeight: 800,
                                      fontSize: '0.82rem',
                                      border: `1px solid ${p.overallLevel === 'high' || p.overallLevel === 'extreme' ? 'rgba(220, 38, 38, 0.3)' : p.overallLevel === 'medium' ? 'rgba(217, 119, 6, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                                    }}
                                  >
                                    {p.overallScore !== null ? p.overallScore : '-'}
                                  </div>
                                </div>
                              </div>

                              {/* Mini Spatial Metric Vector Chips */}
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '6px', background: '#f1f0ea', color: '#475569', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <Mountain size={11} style={{ color: '#059669' }} /> Elev: {p.elevationMeters !== null ? `${p.elevationMeters}m` : '-'}
                                </span>
                                <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '6px', background: '#f1f0ea', color: '#475569', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <Zap size={11} style={{ color: '#ea580c' }} /> {isEn ? 'Fault' : 'Sesar'}: {p.nearestFaultKm !== null ? `${p.nearestFaultKm}km` : '-'}
                                </span>
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #f1f0ea' }}>
                                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                  {isEn ? `Scanned ${p.lastScanned}` : `Dipindai ${p.lastScanned}`}
                                </span>
                                <span
                                  style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    color: p.auditStatus === 'Zona Kritis' || (p.overallScore ?? 0) > 75 ? '#dc2626' : p.auditStatus === 'Perlu Mitigasi' || (p.overallScore ?? 0) > 45 ? '#d97706' : p.overallScore !== null ? '#059669' : '#64748b'
                                  }}
                                >
                                  {isEn ? (p.overallScore === null ? 'Pending Assessment' : p.overallScore > 75 ? 'Critical Zone' : p.overallScore > 45 ? 'Mitigation Needed' : 'Ready for Transaction') : p.auditStatus}
                                </span>
                              </div>

                              {/* Interactive Expanded Detail on the Card (Accordion Dropdown - Mobile Only) */}
                              {isSelected && (
                                <div
                                  className="gt-card-mobile-accordion"
                                  style={{
                                    borderTop: '1px dashed #cbd5e1',
                                    paddingTop: '14px',
                                    marginTop: '4px',
                                    flexDirection: 'column',
                                    gap: '12px',
                                    animation: 'gtFadeIn 0.22s ease'
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {/* Score Slab */}
                                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                                    <span style={{ fontSize: '0.66rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                                      {isEn ? 'Environmental Hazard Index' : 'Indeks Bahaya Lingkungan'}
                                    </span>
                                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '4px', margin: '4px 0' }}>
                                      <span style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em' }}>{p.overallScore !== null ? p.overallScore : '-'}</span>
                                      <span style={{ fontSize: '0.88rem', color: '#94a3b8', fontWeight: 700 }}>/100</span>
                                    </div>
                                    <span
                                      style={{
                                        display: 'inline-block',
                                        fontSize: '0.72rem',
                                        fontWeight: 800,
                                        padding: '3px 10px',
                                        borderRadius: '6px',
                                        background: p.overallLevel === 'high' || p.overallLevel === 'extreme' ? '#fef2f2' : p.overallLevel === 'medium' ? '#fffbeb' : '#ecfdf5',
                                        color: p.overallLevel === 'high' || p.overallLevel === 'extreme' ? '#dc2626' : p.overallLevel === 'medium' ? '#d97706' : '#059669',
                                        border: `1px solid ${p.overallLevel === 'high' || p.overallLevel === 'extreme' ? '#fecaca' : p.overallLevel === 'medium' ? '#fde68a' : '#a7f3d0'}`
                                      }}
                                    >
                                      {isEn ? (p.overallScore > 75 ? 'Critical Zone' : p.overallScore > 45 ? 'Mitigation Needed' : 'Ready for Transaction') : p.auditStatus}
                                    </span>
                                  </div>

                                  {/* 5 Hazard Metric Breakdown Rows */}
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0' }}>
                                      <span style={{ color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                        <Droplets size={13} style={{ color: '#0284c7' }} /> {isEn ? 'Fluvial / Flood Risk' : 'Risiko Banjir Fluvial / Rob'}
                                      </span>
                                      <strong style={{ color: '#c2410c' }}>{p.floodScore} / 100</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0' }}>
                                      <span style={{ color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                        <Zap size={13} style={{ color: '#ea580c' }} /> {isEn ? 'PusGen 2024 Fault Exposure' : 'Paparan Sesar PusGen 2024'}
                                      </span>
                                      <strong>{p.quakeScore} / 100</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0' }}>
                                      <span style={{ color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                        <Flame size={13} style={{ color: '#ef4444' }} /> {isEn ? 'Heat Stress Score' : 'Skor Beban Termal'}
                                      </span>
                                      <strong>{p.heatScore} / 100</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0' }}>
                                      <span style={{ color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                        <Mountain size={13} style={{ color: '#16a34a' }} /> {isEn ? 'Ground Elevation (DEM)' : 'Elevasi Muka Tanah (DEM)'}
                                      </span>
                                      <strong>{p.elevationMeters} m dpl</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0' }}>
                                      <span style={{ color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                        <MapPin size={13} style={{ color: '#64748b' }} /> {isEn ? 'Distance to Active Fault' : 'Jarak ke Patahan Aktif'}
                                      </span>
                                      <strong>{p.nearestFaultKm} km</strong>
                                    </div>
                                  </div>

                                  {/* Primary Download Dossier PDF Button */}
                                  <button
                                    type="button"
                                    className="gt-btn-primary"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownloadReportRequest();
                                    }}
                                    style={{
                                      width: '100%',
                                      padding: '11px 16px',
                                      fontSize: '0.84rem',
                                      fontWeight: 800,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '8px',
                                      borderRadius: '10px'
                                    }}
                                  >
                                    <Download size={15} />
                                    <span>{isEn ? 'Download Full Multi-Hazard Dossier (PDF)' : 'Unduh Dossier Risiko Lengkap (PDF)'}</span>
                                  </button>

                                  {/* Secondary Delete Button */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPropertyToDelete({ id: p.id, name: p.name });
                                    }}
                                    style={{
                                      width: '100%',
                                      padding: '9px 14px',
                                      background: '#fef2f2',
                                      color: '#b91c1c',
                                      border: '1px solid #fecaca',
                                      borderRadius: '8px',
                                      fontSize: '0.78rem',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '6px'
                                    }}
                                  >
                                    <Trash2 size={13} />
                                    <span>{isEn ? 'Delete This Property Plot' : 'Hapus Riwayat Tapak Ini'}</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Expand / Collapse Button for Mobile & Desktop (Lihat Selengkapnya) */}
                      {filteredProperties.length > 4 && (
                        <div style={{ textAlign: 'center', padding: '12px 16px 18px', borderTop: '1px dashed #e8e4db', background: '#fdfcfb' }}>
                          <button
                            type="button"
                            onClick={() => setIsMobileListExpanded(!isMobileListExpanded)}
                            style={{
                              background: isMobileListExpanded ? '#ffffff' : '#fff7ed',
                              color: '#c2410c',
                              border: '1px solid #fed7aa',
                              borderRadius: '8px',
                              padding: '9px 20px',
                              fontSize: '0.82rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              boxShadow: '0 2px 6px rgba(194, 65, 12, 0.08)',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {isMobileListExpanded ? (
                              <>
                                <ChevronUp size={15} />
                                <span>{isEn ? 'Show Less' : 'Tampilkan Lebih Sedikit'}</span>
                              </>
                            ) : (
                              <>
                                <ChevronDown size={15} />
                                <span>
                                  {isEn
                                    ? `Show More (${filteredProperties.length - 4} More Properties)`
                                    : `Lihat Selengkapnya (${filteredProperties.length - 4} Properti Lainnya)`}
                                </span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    /* Table View - LIMITED TO INITIAL 4 ROWS WITH SHOW MORE */
                    <>
                      <div className="gt-data-table-scroll">
                        <table className="gt-enterprise-table">
                          <thead>
                            <tr>
                              <th>{isEn ? 'Property Asset Identity' : 'Identitas Aset Properti'}</th>
                              <th>{isEn ? 'Unit Type' : 'Tipe Unit'}</th>
                              <th>{isEn ? 'Risk Score' : 'Skor Risiko'}</th>
                              <th>{isEn ? 'Elevation (DEM)' : 'Elevasi (DEM)'}</th>
                              <th>{isEn ? 'Fault (PusGen)' : 'Sesar PusGen'}</th>
                              <th>{isEn ? 'Status' : 'Status Kelayakan'}</th>
                              <th style={{ textAlign: 'right' }}>{isEn ? 'Action' : 'Aksi'}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(isMobileListExpanded ? filteredProperties : filteredProperties.slice(0, 4)).map((p) => (
                              <tr
                                key={p.id}
                                className={activeProperty && p.id === activeProperty.id ? 'row-selected' : ''}
                                onClick={() => setSelectedPropertyId(p.id)}
                              >
                                <td>
                                  <div className="gt-cell-main">
                                    <span className="gt-cell-ref">{p.id}</span>
                                    <span className="gt-cell-title">{p.name}</span>
                                    <span className="gt-cell-sub">{p.city}</span>
                                  </div>
                                </td>
                                <td>
                                  <span className="gt-tag-neutral">{p.type}</span>
                                </td>
                                <td>
                                  <span
                                    className="gt-score-badge"
                                    style={{
                                      background: p.overallLevel === 'high' || p.overallLevel === 'extreme' ? '#fef2f2' : p.overallLevel === 'medium' ? '#fffbeb' : '#ecfdf5',
                                      color: p.overallLevel === 'high' || p.overallLevel === 'extreme' ? '#dc2626' : p.overallLevel === 'medium' ? '#d97706' : '#059669'
                                    }}
                                  >
                                    {p.overallScore !== null ? `${p.overallScore} / 100` : '-'}
                                  </span>
                                </td>
                                <td>{p.elevationMeters !== null ? `${p.elevationMeters} m dpl` : '-'}</td>
                                <td>{p.nearestFaultKm !== null ? `${p.nearestFaultKm} km` : '-'}</td>
                                <td>
                                  <span className={`gt-status-chip ${(p.overallScore ?? 0) > 75 ? 'danger' : (p.overallScore ?? 0) > 45 ? 'warning' : p.overallScore !== null ? 'success' : 'neutral'}`}>
                                    {isEn ? (p.overallScore === null ? 'Pending Assessment' : p.overallScore > 75 ? 'Critical Zone' : p.overallScore > 45 ? 'Mitigation Needed' : 'Ready for Transaction') : p.auditStatus}
                                  </span>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                  <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                                    <button
                                      type="button"
                                      className="gt-table-action-btn"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownloadReportRequest();
                                      }}
                                    >
                                      <Download size={13} />
                                      <span>{isEn ? 'Dossier' : 'Unduh'}</span>
                                    </button>
                                    <button
                                      type="button"
                                      className="gt-table-action-btn"
                                      style={{ color: '#dc2626', borderColor: '#fca5a5', background: '#fef2f2' }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPropertyToDelete({ id: p.id, name: p.name });
                                      }}
                                      title={isEn ? 'Delete Property' : 'Hapus Properti'}
                                    >
                                      <Trash2 size={13} />
                                      <span>{isEn ? 'Delete' : 'Hapus'}</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Expand / Collapse Button for Table View */}
                      {filteredProperties.length > 4 && (
                        <div style={{ textAlign: 'center', padding: '12px 16px 18px', borderTop: '1px dashed #e8e4db', background: '#fdfcfb' }}>
                          <button
                            type="button"
                            onClick={() => setIsMobileListExpanded(!isMobileListExpanded)}
                            style={{
                              background: isMobileListExpanded ? '#ffffff' : '#fff7ed',
                              color: '#c2410c',
                              border: '1px solid #fed7aa',
                              borderRadius: '8px',
                              padding: '9px 20px',
                              fontSize: '0.82rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              boxShadow: '0 2px 6px rgba(194, 65, 12, 0.08)',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {isMobileListExpanded ? (
                              <>
                                <ChevronUp size={15} />
                                <span>{isEn ? 'Show Less' : 'Tampilkan Lebih Sedikit'}</span>
                              </>
                            ) : (
                              <>
                                <ChevronDown size={15} />
                                <span>
                                  {isEn
                                    ? `Show More (${filteredProperties.length - 4} More Properties)`
                                    : `Lihat Selengkapnya (${filteredProperties.length - 4} Properti Lainnya)`}
                                </span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Right: Spatial Geometric Inspector Card (HUD) */}
                {activeProperty ? (
                  <div className="gt-inspector-card" id="gt-spatial-inspector-panel">
                    <div className="gt-inspector-head">
                      <span className="gt-inspector-ref">{activeProperty.id}</span>
                      <h3 className="gt-inspector-title">{activeProperty.name}</h3>
                      <p className="gt-inspector-addr">{activeProperty.address}, {activeProperty.city}</p>
                    </div>

                    {/* Polygonal Geometric Score Shield */}
                    <div className="gt-inspector-score-slab">
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {isEn ? 'Environmental Hazard Index' : 'Indeks Bahaya Lingkungan'}
                      </span>
                      <div className="gt-score-large-row">
                        <span className="gt-score-huge">{activeProperty.overallScore !== null ? activeProperty.overallScore : '-'}</span>
                        <span className="gt-score-max">/100</span>
                      </div>
                      <span className={`gt-inspector-level-badge ${activeProperty.overallLevel === 'extreme' ? 'high' : activeProperty.overallLevel}`}>
                        {isEn ? (activeProperty.overallScore === null ? 'Pending Assessment' : activeProperty.overallScore > 75 ? 'Critical Zone' : activeProperty.overallScore > 45 ? 'Mitigation Needed' : 'Ready for Transaction') : activeProperty.auditStatus}
                      </span>
                    </div>

                    {/* Spatial Metrics List */}
                    <div className="gt-inspector-metrics-list">
                      <div className="gt-insp-row">
                        <span className="gt-insp-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Droplets size={13} style={{ color: '#0284c7' }} /> {isEn ? 'Flood Risk' : 'Risiko Banjir'}
                        </span>
                        <span className="gt-insp-val" style={{ color: '#c2410c' }}>
                          {activeProperty.floodScore !== null ? `${activeProperty.floodScore} / 100` : '-'}
                        </span>
                      </div>

                      <div className="gt-insp-row">
                        <span className="gt-insp-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Zap size={13} style={{ color: '#ea580c' }} /> {isEn ? 'PusGen 2024 Fault Exposure' : 'Paparan Sesar PusGen 2024'}
                        </span>
                        <span className="gt-insp-val">{activeProperty.quakeScore} / 100</span>
                      </div>

                      <div className="gt-insp-row">
                        <span className="gt-insp-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Flame size={13} style={{ color: '#ef4444' }} /> {isEn ? 'Heat Stress Score' : 'Skor Beban Termal'}
                        </span>
                        <span className="gt-insp-val">{activeProperty.heatScore} / 100</span>
                      </div>

                      <div className="gt-insp-row">
                        <span className="gt-insp-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Mountain size={13} style={{ color: '#16a34a' }} /> {isEn ? 'Ground Elevation (DEM)' : 'Elevasi Muka Tanah (DEM)'}
                        </span>
                        <span className="gt-insp-val">{activeProperty.elevationMeters} m dpl</span>
                      </div>

                      <div className="gt-insp-row">
                        <span className="gt-insp-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <MapPin size={13} style={{ color: '#64748b' }} /> {isEn ? 'Distance to Active Fault' : 'Jarak ke Patahan Aktif'}
                        </span>
                        <span className="gt-insp-val">{activeProperty.nearestFaultKm} km</span>
                      </div>
                    </div>

                    {/* Primary PDF Action Button */}
                    <button
                      type="button"
                      className="gt-btn-inspector-full-pdf"
                      onClick={handleDownloadReportRequest}
                    >
                      <Download size={15} />
                      <span>{isEn ? 'Download Full Multi-Hazard Dossier' : 'Unduh Dossier Risiko Lengkap (PDF)'}</span>
                    </button>

                    {/* Delete Property Action Button in Inspector */}
                    <button
                      type="button"
                      onClick={() => setPropertyToDelete({ id: activeProperty.id, name: activeProperty.name })}
                      style={{
                        width: '100%',
                        padding: '9px 14px',
                        background: '#fef2f2',
                        color: '#b91c1c',
                        border: '1px solid #fecaca',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        marginTop: '8px',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#fee2e2')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#fef2f2')}
                    >
                      <Trash2 size={13} />
                      <span>{isEn ? 'Delete This Property Plot' : 'Hapus Riwayat Tapak Ini'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="gt-inspector-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '36px 20px', minHeight: '340px' }}>
                    <Layers size={36} style={{ color: '#94a3b8', marginBottom: '14px' }} />
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
                      {isEn ? 'Real-Time Spatial Inspector' : 'Inspektur Spasial Real-Time'}
                    </h4>
                    <p style={{ fontSize: '0.82rem', color: '#64748b', maxWidth: '280px', lineHeight: 1.5 }}>
                      {isEn
                        ? 'Select or scan a property plot to inspect active fault distances, inundation depths, and structural directives.'
                        : 'Pilih atau pindai tapak properti untuk melihat analisis jarak sesar, estimasi genangan, dan preskripsi rekayasa sipil.'}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* TAB 2: SIDE-BY-SIDE 3 PROPERTY COMPARISON (BUNDLING 1) */}
          {activeTab === 'compare' && (() => {
            const hasCompareAccess = canAccessComparison(currentUser?.tierLevel, activeAccountRole);

            if (!hasCompareAccess) {
              return (
                <div className="gt-portfolio-card" style={{ padding: '48px 24px', textAlign: 'center', background: '#fbfaf8', border: '1px dashed #cbd5e1' }}>
                  <div style={{ maxWidth: '580px', margin: '0 auto' }}>
                    <div
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '16px',
                        background: '#fff7ed',
                        border: '1.5px solid #fed7aa',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 18px',
                        color: '#c2410c',
                        boxShadow: '0 4px 12px rgba(194, 65, 12, 0.1)'
                      }}
                    >
                      <Lock size={30} />
                    </div>

                    <span
                      style={{
                        display: 'inline-block',
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        padding: '4px 12px',
                        borderRadius: '20px',
                        background: '#fff7ed',
                        color: '#c2410c',
                        border: '1px solid #fed7aa',
                        marginBottom: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}
                    >
                      {isEn ? 'Exclusive Pro Feature · Bundling 1' : 'Fitur Eksklusif · Paket Bundling 1 (Rp 85.000)'}
                    </span>

                    <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', marginBottom: '10px' }}>
                      {isEn ? 'Multi-Site Comparison Matrix is Locked' : 'Fitur Komparasi 3 Properti Berdampingan Terkunci'}
                    </h3>

                    <p style={{ fontSize: '0.86rem', color: '#64748b', lineHeight: 1.6, marginBottom: '24px' }}>
                      {isEn
                        ? 'Side-by-side due diligence comparison is designed for property buyers evaluating 3–5 candidate houses before bidding. Upgrade to Bundling 1 (Rp 85,000) or Enterprise to unlock side-by-side matrices and 3 official Groundsure PDF dossiers.'
                        : 'Evaluasi komparasi side-by-side 3 properti sebelum menawar harga merupakan fitur khusus Paket Bundling 1 (Rp 85.000). Tingkatkan ke paket Bundling 1 untuk membuka matriks komparasi lengkap serta kuota 3 unduhan PDF Dossier resmi.'}
                    </p>

                    {/* Benefit checklist */}
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px 20px', textAlign: 'left', marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', color: '#334155' }}>
                        <CheckCircle2 size={16} style={{ color: '#16a34a', flexShrink: 0 }} />
                        <span>{isEn ? 'Side-by-side 3-property comparative risk evaluation' : 'Komparasi side-by-side hingga 3 lokasi tapak sekaligus'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', color: '#334155' }}>
                        <CheckCircle2 size={16} style={{ color: '#16a34a', flexShrink: 0 }} />
                        <span>{isEn ? 'Automated Top Recommendation & safest site calculation' : 'Rekomendasi otomatis & kalkulasi tapak paling tangguh (Pilihan Paling Tangguh)'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', color: '#334155' }}>
                        <CheckCircle2 size={16} style={{ color: '#16a34a', flexShrink: 0 }} />
                        <span>{isEn ? 'Active fault distance & DEM elevation benchmark' : 'Komparasi jarak patahan aktif & elevasi peil DEM'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', color: '#334155' }}>
                        <CheckCircle2 size={16} style={{ color: '#16a34a', flexShrink: 0 }} />
                        <span>{isEn ? 'Includes quota for 3 Full Official Groundsure PDF Dossiers' : 'Termasuk kuota cetak/unduh 3 PDF Dossier Groundsure Lengkap (±10–14 halaman)'}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="gt-btn-primary"
                        onClick={handleDownloadReportRequest}
                        style={{ padding: '12px 24px', fontSize: '0.86rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                      >
                        <Lock size={15} />
                        <span>{isEn ? 'Unlock Bundling 1 (Rp 85,000)' : 'Beli Paket Bundling 1 (Rp 85.000)'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCurrentView('public')}
                        style={{
                          background: '#ffffff',
                          color: '#475569',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          padding: '12px 20px',
                          fontSize: '0.84rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Compass size={14} />
                        <span>{isEn ? 'Scan Single Plot on Map' : 'Pindai 1 Tapak di Peta'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            if (properties.length === 0) {
              return (
                <div className="gt-portfolio-card" style={{ padding: '48px 24px', textAlign: 'center', background: '#fbfaf8', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                  <Building2 size={40} style={{ color: '#94a3b8', margin: '0 auto 16px' }} />
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                    {isEn ? 'No Saved Properties to Compare' : 'Belum Ada Properti Tersimpan untuk Dibandingkan'}
                  </h4>
                  <p style={{ fontSize: '0.86rem', color: '#64748b', maxWidth: '480px', margin: '0 auto 20px', lineHeight: 1.5 }}>
                    {isEn
                      ? 'You have unlocked the Bundling 1 plan. Start by scanning and saving 2 to 3 property plots on the interactive map to compare them side-by-side.'
                      : 'Akun Anda telah memiliki akses Paket Bundling 1. Pindai dan simpan 2 hingga 3 calon tapak properti melalui peta interaktif untuk melihat perbandingan matriks risikonya secara berdampingan.'}
                  </p>
                  <button
                    type="button"
                    className="gt-btn-primary"
                    onClick={() => setCurrentView('public')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '11px 22px' }}
                  >
                    <Compass size={15} />
                    <span>{isEn ? 'Scan Properties on Interactive Map' : 'Pindai Properti di Peta Satelit'}</span>
                  </button>
                </div>
              );
            }

            const propA = properties.find(p => p.id === slotAId) || properties[0];
            const propB = properties.find(p => p.id === slotBId) || properties[1] || properties[0];
            const propC = properties.find(p => p.id === slotCId) || properties[2] || properties[1] || properties[0];

            const slots = [
              { slotName: isEn ? 'Property A' : 'Properti A', prop: propA, currentId: propA.id, setSlot: setSlotAId },
              { slotName: isEn ? 'Property B' : 'Properti B', prop: propB, currentId: propB.id, setSlot: setSlotBId },
              { slotName: isEn ? 'Property C' : 'Properti C', prop: propC, currentId: propC.id, setSlot: setSlotCId }
            ];

            const winner = [...slots].sort((a, b) => (a.prop.overallScore ?? 999) - (b.prop.overallScore ?? 999))[0];
            const allCandidatesList = properties;

            return (
              <div className="gt-compare-container">
                {/* Header Banner */}
                <div className="gt-compare-header-banner">
                  <div>
                    <span className="gt-compare-banner-badge">
                      {isEn ? 'Compare Up to 3 Sites' : 'Komparasi 3 Lokasi Tapak'}
                    </span>
                    <h3 className="gt-compare-banner-title">
                      {isEn ? 'Risk Comparison' : 'Perbandingan Risiko'}
                    </h3>
                    <p className="gt-compare-banner-sub">
                      {isEn
                        ? 'Side-by-side evaluation designed for buyers screening 3-5 properties before submitting a formal offer.'
                        : 'Evaluasi komparasi berdampingan untuk pembeli properti yang mengevaluasi 3–5 rumah sebelum mengajukan penawaran harga.'}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                      type="button"
                      className="gt-btn-ghost-sm"
                      style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1' }}
                      onClick={() => window.print()}
                    >
                      <Download size={14} />
                      <span>{isEn ? 'Print Matrix' : 'Cetak Matriks'}</span>
                    </button>
                    <button
                      type="button"
                      className="gt-btn-primary-sm"
                      onClick={handleDownloadReportRequest}
                    >
                      <Plus size={14} />
                      <span>{isEn ? 'Unlock 3 Full PDF Dossiers' : 'Buka Kunci 3 PDF Dossier'}</span>
                    </button>
                  </div>
                </div>

                {/* Winner / Best Safety Recommendation Card */}
                <div className="gt-compare-winner-card">
                  <span className="gt-compare-winner-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <Award size={14} />
                    <span>{isEn ? 'Most Balanced Risk Profile' : 'Profil Risiko Paling Seimbang'}</span>
                  </span>
                  <div>
                    <strong style={{ color: '#166534', fontSize: '0.9rem', display: 'block', marginBottom: '2px' }}>
                      {isEn
                        ? `Location with the most balanced risk profile: ${winner.prop.name} (${winner.prop.city})`
                        : `Lokasi dengan profil risiko paling seimbang: ${winner.prop.name} (${winner.prop.city})`}
                    </strong>
                    <span style={{ fontSize: '0.78rem', color: '#15803d', lineHeight: 1.4 }}>
                      {isEn
                        ? `Skor ${winner.prop.overallScore !== null ? `${winner.prop.overallScore}/100` : '-'} · Tapak ini memiliki profil ketahanan bencana paling optimal dengan elevasi peil tanah aman dan risiko gempa terkontrol.`
                        : `Skor ${winner.prop.overallScore !== null ? `${winner.prop.overallScore}/100` : '-'} · Tapak ini memiliki profil ketahanan bencana paling optimal dengan elevasi peil tanah aman dan risiko gempa terkontrol.`}
                    </span>
                  </div>
                </div>

                {/* Triple Benchmark Comparative Slots */}
                <div className="gt-compare-slots-grid">
                  {slots.map((s, idx) => (
                    <div key={idx} className="gt-compare-slot-col">
                      <div className="gt-compare-slot-card">
                        <span className="gt-compare-slot-badge">{s.slotName}</span>

                        {/* Candidate Dropdown Selector */}
                        <div>
                          <label style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                            {isEn ? 'Select Property:' : 'Pilih Properti:'}
                          </label>
                          <select
                            className="gt-sb-select"
                            value={s.currentId}
                            onChange={(e) => s.setSlot(e.target.value)}
                          >
                            {allCandidatesList.map((cand) => (
                              <option key={cand.id} value={cand.id}>
                                {cand.name} ({cand.city}) — {isEn ? 'Score' : 'Skor'}: {cand.overallScore !== null ? cand.overallScore : '-'}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Overall Score Badge Box */}
                        <div className="gt-compare-score-box">
                          <div>
                            <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>
                              {isEn ? 'Risk Score' : 'Skor Risiko'}
                            </span>
                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: (s.prop.overallScore ?? 0) > 70 ? '#dc2626' : (s.prop.overallScore ?? 0) > 40 ? '#d97706' : '#16a34a' }}>
                              {s.prop.overallScore !== null ? s.prop.overallScore : '-'}<span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>/100</span>
                            </div>
                          </div>
                          <span
                            className="gt-tag-neutral"
                            style={{
                              background: (s.prop.overallScore ?? 0) > 70 ? '#fef2f2' : (s.prop.overallScore ?? 0) > 40 ? '#fffbeb' : '#f0fdf4',
                              color: (s.prop.overallScore ?? 0) > 70 ? '#b91c1c' : (s.prop.overallScore ?? 0) > 40 ? '#b45309' : '#15803d',
                              borderColor: (s.prop.overallScore ?? 0) > 70 ? '#fecaca' : (s.prop.overallScore ?? 0) > 40 ? '#fde68a' : '#bbf7d0',
                              fontWeight: 800
                            }}
                          >
                            {isEn ? (s.prop.overallScore === null ? 'Data Unavailable' : s.prop.overallScore > 75 ? 'Critical Zone' : s.prop.overallScore > 45 ? 'Mitigation Needed' : 'Ready for Transaction') : s.prop.auditStatus}
                          </span>
                        </div>

                        {/* Comparison Breakdown Metrics List */}
                        <div className="gt-compare-metrics-list">
                          {/* 1. Flood Metric */}
                          <div className="gt-compare-metric-row">
                            <span className="gt-compare-metric-lbl">
                              <Droplets size={14} style={{ color: '#0284c7' }} />
                              <span>{isEn ? 'Flood:' : 'Banjir:'}</span>
                            </span>
                            <span className="gt-compare-metric-val" style={{ color: (s.prop.floodScore ?? 0) > 70 ? '#dc2626' : (s.prop.floodScore ?? 0) > 40 ? '#d97706' : '#16a34a' }}>
                              {s.prop.floodScore !== null ? `${s.prop.floodScore}/100` : '-'} {s.prop.elevationMeters !== null ? `(${s.prop.elevationMeters} mdpl)` : ''}
                            </span>
                          </div>

                          {/* 2. Quake Metric */}
                          <div className="gt-compare-metric-row">
                            <span className="gt-compare-metric-lbl">
                              <Mountain size={14} style={{ color: '#ea580c' }} />
                              <span>{isEn ? 'Earthquake:' : 'Gempa:'}</span>
                            </span>
                            <span className="gt-compare-metric-val" style={{ color: (s.prop.quakeScore ?? 0) > 70 ? '#dc2626' : (s.prop.quakeScore ?? 0) > 40 ? '#d97706' : '#16a34a' }}>
                              {s.prop.quakeScore !== null ? `${s.prop.quakeScore}/100` : '-'} {s.prop.nearestFaultKm !== null ? `(±${s.prop.nearestFaultKm} km)` : ''}
                            </span>
                          </div>

                          {/* 3. Heat Metric */}
                          <div className="gt-compare-metric-row">
                            <span className="gt-compare-metric-lbl">
                              <Flame size={14} style={{ color: '#e11d48' }} />
                              <span>{isEn ? 'Heat Conditions:' : 'Kondisi Panas:'}</span>
                            </span>
                            <span className="gt-compare-metric-val" style={{ color: (s.prop.heatScore ?? 0) > 70 ? '#dc2626' : (s.prop.heatScore ?? 0) > 40 ? '#d97706' : '#16a34a' }}>
                              {s.prop.heatScore !== null ? `${s.prop.heatScore}/100` : '-'}
                            </span>
                          </div>

                          {/* 4. Initial Civil Mitigation Cost */}
                          <div className="gt-compare-metric-row">
                            <span className="gt-compare-metric-lbl">
                              <Zap size={14} style={{ color: '#ca8a04' }} />
                              <span>{isEn ? 'Mitigation Action:' : 'Perkiraan Mitigasi:'}</span>
                            </span>
                            <span className="gt-compare-metric-val" style={{ color: (s.prop.overallScore ?? 0) > 70 ? '#dc2626' : '#0f172a' }}>
                              {(s.prop.overallScore ?? 0) > 70 ? (isEn ? 'Major Mitigation' : 'Mitigasi Utama') : (s.prop.overallScore ?? 0) > 40 ? (isEn ? 'Standard Mitigation' : 'Mitigasi Standar') : (isEn ? 'Routine Maintenance' : 'Pemeliharaan Rutin')}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons for Card */}
                        <div style={{ marginTop: 'auto', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <button
                            type="button"
                            className="gt-btn-primary-sm"
                            style={{ width: '100%', justifyContent: 'center' }}
                            onClick={() => {
                              setSelectedPropertyId(s.prop.id);
                              setActiveTab('assets');
                            }}
                          >
                            <Compass size={14} />
                            <span>{isEn ? 'Inspect Spatial Map' : 'Inspeksi Peta Tapak Ini'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* TAB 3: REPORTS (REPORT REQUEST LIFECYCLE & OFFICIAL DOSSIERS) */}
          {activeTab === 'reports' && (() => {
            const filteredRequests = customerRequests.filter((r) => {
              if (reportFilter === 'in_progress') return r.status !== 'delivered';
              if (reportFilter === 'delivered') return r.status === 'delivered';
              return true;
            });

            const inProgressCount = customerRequests.filter((r) => r.status !== 'delivered').length;
            const deliveredCount = customerRequests.filter((r) => r.status === 'delivered').length;

            return (
              <div className="gt-table-container-card" style={{ padding: '24px' }}>
                {/* Header with CTA */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #f1f0ea', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                        {isEn ? 'Official Report Requests & Archives' : 'Layanan Permohonan & Arsip Laporan Resmi'}
                      </h3>
                      <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800 }}>
                        {isEn ? `${deliveredCount} Delivered` : `${deliveredCount} Laporan Terbit`}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                      {isEn
                        ? 'Track geospatial report requests through review, pricing, processing, and download finalized 10–14 page bank-grade dossiers.'
                        : 'Pantau status permohonan audit geospasial komprehensif (10–14 halaman) berstandar perbankan atau ajukan laporan baru.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="gt-btn-primary-sm"
                    onClick={handleCreateNewReportRequest}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Plus size={15} />
                    <span>{isEn ? 'Request New Report' : 'Ajukan Permohonan Laporan'}</span>
                  </button>
                </div>

                {/* Lifecycle Pipeline Progress Indicator */}
                <div style={{ background: '#fafaf9', border: '1px solid #e7e5e4', borderRadius: '12px', padding: '14px 18px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#44403c', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {isEn ? 'Report Request Workflow Stages' : 'Alur Proses Permohonan Laporan GoResilio'}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                    {[
                      { step: '1', title: isEn ? 'Requested' : '1. Diajukan', desc: isEn ? 'Reviewing request' : 'Menunggu review' },
                      { step: '2', title: isEn ? 'Quotation' : '2. Penawaran', desc: isEn ? 'Price quote issued' : 'Harga diterbitkan' },
                      { step: '3', title: isEn ? 'Payment' : '3. Pembayaran', desc: isEn ? 'Awaiting payment' : 'Konfirmasi transfer' },
                      { step: '4', title: isEn ? 'Generating' : '4. Kompilasi', desc: isEn ? 'GIS analysis running' : 'Pengolahan spasial' },
                      { step: '5', title: isEn ? 'Delivered' : '5. Siap Unduh', desc: isEn ? 'PDF ready for download' : 'Dokumen PDF terbit' },
                    ].map((s, idx) => (
                      <div key={idx} style={{ background: '#ffffff', border: '1px solid #e7e5e4', borderRadius: '8px', padding: '8px 10px', fontSize: '0.72rem' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '2px' }}>{s.title}</div>
                        <div style={{ color: '#78716c', fontSize: '0.68rem' }}>{s.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Success Alert Banner */}
                {newRequestSuccessMsg && (
                  <div style={{ padding: '12px 16px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#065f46' }}>
                    <CheckCircle2 size={16} style={{ color: '#059669', flexShrink: 0 }} />
                    <span>{newRequestSuccessMsg}</span>
                  </div>
                )}

                {/* Filter Navigation */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setReportFilter('all')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: reportFilter === 'all' ? '#ea580c' : '#e2e8f0',
                      backgroundColor: reportFilter === 'all' ? '#fff7ed' : '#ffffff',
                      color: reportFilter === 'all' ? '#c2410c' : '#64748b'
                    }}
                  >
                    {isEn ? `All Requests (${customerRequests.length})` : `Semua Permohonan (${customerRequests.length})`}
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportFilter('in_progress')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: reportFilter === 'in_progress' ? '#ea580c' : '#e2e8f0',
                      backgroundColor: reportFilter === 'in_progress' ? '#fff7ed' : '#ffffff',
                      color: reportFilter === 'in_progress' ? '#c2410c' : '#64748b'
                    }}
                  >
                    {isEn ? `In Progress (${inProgressCount})` : `Dalam Proses (${inProgressCount})`}
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportFilter('delivered')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: reportFilter === 'delivered' ? '#ea580c' : '#e2e8f0',
                      backgroundColor: reportFilter === 'delivered' ? '#fff7ed' : '#ffffff',
                      color: reportFilter === 'delivered' ? '#c2410c' : '#64748b'
                    }}
                  >
                    {isEn ? `Delivered & Ready (${deliveredCount})` : `Siap Unduh (${deliveredCount})`}
                  </button>
                </div>

                {/* Request List Cards */}
                {filteredRequests.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', background: '#fafaf9', border: '1px dashed #d6d3d1', borderRadius: '12px' }}>
                    <FileText size={32} style={{ color: '#a8a29e', margin: '0 auto 12px' }} />
                    <h4 style={{ margin: '0 0 6px', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                      {isEn ? 'No Report Requests in this filter' : 'Tidak Ada Permohonan pada Kategori Ini'}
                    </h4>
                    <p style={{ margin: '0 auto 16px', maxWidth: '420px', color: '#78716c', fontSize: '0.8rem' }}>
                      {isEn
                        ? 'Click the button below to submit a new comprehensive multi-hazard report request.'
                        : 'Klik tombol di bawah untuk mengajukan permohonan laporan komprehensif baru.'}
                    </p>
                    <button
                      type="button"
                      className="gt-btn-primary-sm"
                      onClick={handleCreateNewReportRequest}
                    >
                      {isEn ? 'Request New Report' : 'Ajukan Permohonan Laporan'}
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
                    {filteredRequests.map((req) => {
                      const isDelivered = req.status === 'delivered';
                      const isPriceProposed = req.status === 'price_proposed';
                      const isGenerating = req.status === 'generating';
                      const isPaymentConfirmed = req.status === 'payment_confirmed';
                      const isRequested = req.status === 'requested';

                      const statusBadge = isDelivered
                        ? { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0', label: isEn ? 'Delivered / Ready' : 'Selesai & Siap Unduh' }
                        : isGenerating
                        ? { bg: '#eef2ff', text: '#4338ca', border: '#c7d2fe', label: isEn ? 'Compiling GIS Data...' : 'Kompilasi Data Spasial...' }
                        : isPaymentConfirmed
                        ? { bg: '#f5f3ff', text: '#6d28d9', border: '#ddd6fe', label: isEn ? 'Payment Confirmed' : 'Pembayaran Terkonfirmasi' }
                        : isPriceProposed
                        ? { bg: '#f0f9ff', text: '#0369a1', border: '#bae6fd', label: isEn ? 'Quotation Issued' : 'Penawaran Diterbitkan' }
                        : { bg: '#fffbeb', text: '#b45309', border: '#fde68a', label: isEn ? 'Under Review' : 'Menunggu Review Admin' };

                      return (
                        <div
                          key={req.id}
                          style={{
                            background: '#ffffff',
                            border: `1px solid ${isDelivered ? '#bbf7d0' : '#e7e5e4'}`,
                            borderRadius: '12px',
                            padding: '18px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                            <div>
                              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#c2410c', fontFamily: 'monospace' }}>
                                {req.refNumber}
                              </span>
                              <h4 style={{ margin: '2px 0 0', fontSize: '0.94rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>
                                {req.propertyName}
                              </h4>
                              <span style={{ fontSize: '0.74rem', color: '#78716c' }}>{req.city}</span>
                            </div>
                            <span style={{
                              background: statusBadge.bg,
                              color: statusBadge.text,
                              border: `1px solid ${statusBadge.border}`,
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              whiteSpace: 'nowrap'
                            }}>
                              {statusBadge.label}
                            </span>
                          </div>

                          <div style={{ background: '#fafaf9', border: '1px solid #f0eeeb', borderRadius: '8px', padding: '10px 12px', fontSize: '0.74rem', color: '#44403c', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#78716c' }}>{isEn ? 'Package:' : 'Paket Laporan:'}</span>
                              <span style={{ fontWeight: 700 }}>{req.packageType}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#78716c' }}>{isEn ? 'Date Requested:' : 'Tanggal Pengajuan:'}</span>
                              <span>{req.requestedDate}</span>
                            </div>
                            {req.proposedPrice && (
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#78716c' }}>{isEn ? 'Quotation / Fee:' : 'Biaya / Penawaran:'}</span>
                                <span style={{ fontWeight: 800, color: '#c2410c' }}>{req.proposedPrice}</span>
                              </div>
                            )}
                          </div>

                          {/* Action Button depending on status */}
                          {isDelivered ? (
                            <button
                              type="button"
                              className="gt-btn-ghost-sm"
                              style={{
                                width: '100%',
                                justifyContent: 'center',
                                backgroundColor: '#15803d',
                                color: '#ffffff',
                                border: 'none',
                                fontWeight: 700
                              }}
                              onClick={handleDownloadReportRequest}
                            >
                              <Download size={14} />
                              <span>{isEn ? 'Download Official PDF (10–14 Pages)' : 'Unduh PDF Resmi (10–14 Halaman)'}</span>
                            </button>
                          ) : isPriceProposed ? (
                            <button
                              type="button"
                              className="gt-btn-primary-sm"
                              style={{ width: '100%', justifyContent: 'center' }}
                              onClick={() => handleConfirmCustomerPayment(req.id)}
                            >
                              <CreditCard size={14} />
                              <span>{isEn ? `Accept & Pay ${req.proposedPrice || ''}` : `Bayar & Konfirmasi Penawaran`}</span>
                            </button>
                          ) : isGenerating ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.74rem', color: '#475569' }}>
                              <Clock size={13} style={{ color: '#0284c7' }} />
                              <span>{isEn ? 'Estimated delivery: 5-15 mins' : 'Estimasi kompilasi: 5–15 menit'}</span>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.74rem', color: '#64748b' }}>
                              <Clock size={13} />
                              <span>{isEn ? 'Awaiting administrative quotation' : 'Menunggu kalkulasi penawaran admin'}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* TAB 3: DUE DILIGENCE CHECKLIST */}
          {activeTab === 'checklist' && (
            <div className="gt-checklist-panel-card">
              <div className="gt-panel-head">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 className="gt-panel-title">
                      {isEn ? 'Pre-Transaction Due Diligence Checklist' : 'Checklist Uji Tuntas Pra-Transaksi Properti'}
                    </h3>
                    <p className="gt-panel-sub">
                      {isEn ? 'Mandatory geospatial risk mitigation steps dynamically generated from site hazard intelligence.' : 'Langkah mitigasi risiko geospasial yang dihasilkan secara dinamis berdasarkan data intelijen bahaya lokasi Anda.'}
                    </p>
                  </div>

                  {/* Progress Pill Indicator */}
                  <div style={{ background: completedCount === checklist.length && checklist.length > 0 ? '#ecfdf5' : '#fff7ed', border: completedCount === checklist.length && checklist.length > 0 ? '1px solid #a7f3d0' : '1px solid #fed7aa', padding: '8px 14px', borderRadius: '10px', textAlign: 'right' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: completedCount === checklist.length && checklist.length > 0 ? '#047857' : '#c2410c', textTransform: 'uppercase' }}>
                      {completedCount} / {checklist.length} {isEn ? 'Steps Done' : 'Langkah Selesai'} ({checklistPct}%)
                    </div>
                    <div style={{ width: '120px', height: '6px', background: '#e2e8f0', borderRadius: '3px', marginTop: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${checklistPct}%`, height: '100%', background: completedCount === checklist.length && checklist.length > 0 ? '#10b981' : '#ea580c', transition: 'width 0.3s ease' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Assessment Context Banner */}
              {!assessment ? (
                <div style={{ padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', color: '#64748b' }}>
                  <Info size={16} style={{ color: '#0284c7', flexShrink: 0 }} />
                  <span>
                    {isEn
                      ? 'Displaying baseline due diligence items. Perform an interactive location assessment on the main map to unlock site-specific hazard mitigation checks.'
                      : 'Menampilkan daftar periksa standar uji tuntas pra-transaksi. Lakukan asesmen lokasi pada peta utama untuk mengaktifkan rekomendasi mitigasi spesifik bahaya banjir, gempa, dan panas.'}
                  </span>
                </div>
              ) : (
                <div style={{ padding: '10px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', color: '#166534' }}>
                  <CheckCircle2 size={16} style={{ color: '#16a34a', flexShrink: 0 }} />
                  <span>
                    {isEn
                      ? `Active Site Hazard Profile: Flood (${floodRiskScore}/100), Seismic (${quakeRiskScore}/100), Heat Stress (${heatRiskScore}/100). Tailored action items highlighted below.`
                      : `Profil Bahaya Lokasi Aktif: Banjir (${floodRiskScore}/100), Gempa (${quakeRiskScore}/100), Beban Panas (${heatRiskScore}/100). Tindakan mitigasi disesuaikan di bawah.`}
                  </span>
                </div>
              )}

              <div className="gt-checklist-compact-list">
                {checklist.map((item) => (
                  <div
                    key={item.id}
                    className={`gt-check-item ${item.checked ? 'checked' : ''}`}
                    onClick={() => toggleChecklistItem(item.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <input
                      type="checkbox"
                      className="gt-checkbox"
                      checked={item.checked}
                      onChange={() => toggleChecklistItem(item.id)}
                    />
                    <div className="gt-check-label-box" style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '2px' }}>
                        <strong style={{ color: item.checked ? '#065f46' : '#0f172a' }}>{item.title}</strong>
                        {item.badgeLabel && (
                          <span style={{
                            fontSize: '0.66rem',
                            fontWeight: 700,
                            padding: '1px 8px',
                            borderRadius: '4px',
                            backgroundColor: item.badgeColor ? `${item.badgeColor}15` : '#f1f5f9',
                            color: item.badgeColor || '#475569',
                            border: `1px solid ${item.badgeColor ? `${item.badgeColor}40` : '#cbd5e1'}`
                          }}>
                            {item.badgeLabel}
                          </span>
                        )}
                      </div>
                      <span>{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: ACCOUNT & SECURITY SETTINGS */}
          {activeTab === 'settings' && (
            <div className="gt-checklist-panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="gt-panel-head">
                <h3 className="gt-panel-title">
                  {isEn ? 'Profile & Account Security Settings' : 'Pengaturan Profil & Keamanan Pengguna'}
                </h3>
                <p className="gt-panel-sub">
                  {isEn ? 'Manage user identity, organization affiliations, and access credentials.' : 'Kelola identitas, instansi, dan kata sandi keamanan akun Anda.'}
                </p>
              </div>

              {/* Status Banner */}
              {profileMsg && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  background: profileMsg.type === 'success' ? '#ecfdf5' : '#fef2f2',
                  border: profileMsg.type === 'success' ? '1px solid #a7f3d0' : '1px solid #fecaca',
                  color: profileMsg.type === 'success' ? '#065f46' : '#991b1b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {profileMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  <span>{profileMsg.text}</span>
                </div>
              )}

              {/* SECTION 1: PROFILE INFORMATION */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '18px' }}>
                <h4 style={{ margin: '0 0 14px', fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserCheck size={16} style={{ color: '#0284c7' }} />
                  <span>{isEn ? 'Profile Information' : 'Informasi Profil Pengguna'}</span>
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#475569', marginBottom: '6px' }}>
                      {isEn ? 'Full Name' : 'Nama Lengkap'}
                    </label>
                    <input
                      type="text"
                      className="gt-table-search-input"
                      style={{ paddingLeft: '12px' }}
                      value={clientProfile.fullName}
                      onChange={(e) => setClientProfile({ ...clientProfile, fullName: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#475569', marginBottom: '6px' }}>
                      {isEn ? 'Email Address' : 'Alamat Email (Akun)'}
                    </label>
                    <input
                      type="email"
                      className="gt-table-search-input"
                      style={{ paddingLeft: '12px', background: '#f1f5f9', color: '#64748b' }}
                      value={clientProfile.email}
                      disabled
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#475569', marginBottom: '6px' }}>
                      {isEn ? 'Phone / WhatsApp' : 'Nomor Telepon / WhatsApp'}
                    </label>
                    <input
                      type="text"
                      className="gt-table-search-input"
                      style={{ paddingLeft: '12px' }}
                      value={clientProfile.phone}
                      onChange={(e) => setClientProfile({ ...clientProfile, phone: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#475569', marginBottom: '6px' }}>
                      {isEn ? 'Company / Organization' : 'Organisasi / Instansi'}
                    </label>
                    <input
                      type="text"
                      className="gt-table-search-input"
                      style={{ paddingLeft: '12px' }}
                      value={clientProfile.organization}
                      onChange={(e) => setClientProfile({ ...clientProfile, organization: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    disabled={isSavingProfile}
                    className="gt-btn-primary-sm"
                    onClick={handleSaveProfile}
                  >
                    {isSavingProfile ? (isEn ? 'Saving...' : 'Menyimpan...') : (isEn ? 'Save Profile Changes' : 'Simpan Perubahan Profil')}
                  </button>
                </div>
              </div>

              {/* SECTION 2: ACCOUNT SECURITY & PASSWORD CHANGE */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '18px' }}>
                <h4 style={{ margin: '0 0 14px', fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lock size={16} style={{ color: '#ea580c' }} />
                  <span>{isEn ? 'Change Password & Security' : 'Ganti Kata Sandi & Keamanan Akun'}</span>
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#475569', marginBottom: '6px' }}>
                      {isEn ? 'Current Password' : 'Kata Sandi Saat Ini'}
                    </label>
                    <input
                      type="password"
                      className="gt-table-search-input"
                      style={{ paddingLeft: '12px' }}
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#475569', marginBottom: '6px' }}>
                      {isEn ? 'New Password' : 'Kata Sandi Baru'}
                    </label>
                    <input
                      type="password"
                      className="gt-table-search-input"
                      style={{ paddingLeft: '12px' }}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#475569', marginBottom: '6px' }}>
                      {isEn ? 'Confirm New Password' : 'Konfirmasi Kata Sandi Baru'}
                    </label>
                    <input
                      type="password"
                      className="gt-table-search-input"
                      style={{ paddingLeft: '12px' }}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    disabled={isChangingPass}
                    className="gt-btn-primary-sm"
                    style={{ background: '#0f172a' }}
                    onClick={handleChangePassword}
                  >
                    {isChangingPass ? (isEn ? 'Updating Password...' : 'Memperbarui Kata Sandi...') : (isEn ? 'Update Password' : 'Perbarui Kata Sandi')}
                  </button>
                </div>
              </div>

              {/* SECTION 3: SESSION & ENCRYPTION STATUS */}
              <div style={{ background: '#ffffff', border: '1px solid #e8e4db', borderRadius: '10px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldCheck size={20} style={{ color: '#10b981' }} />
                  <div>
                    <span style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>
                      {isEn ? 'Account Session Active & Protected' : 'Sesi Akun Aktif & Terlindungi'}
                    </span>
                    <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                      {isEn ? 'Your account session is authenticated and protected.' : 'Sesi Anda terautentikasi dan terlindungi dengan aman.'}
                    </span>
                  </div>
                </div>
                <span className="gt-tag-neutral" style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
                  {isEn ? 'Secured' : 'Terlindungi'}
                </span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="gt-calm-modal-backdrop" onClick={() => setShowLogoutConfirm(false)}>
          <div className="gt-confirm-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="gt-confirm-modal-icon danger">
              <AlertTriangle size={24} />
            </div>
            <h3 className="gt-confirm-modal-title">
              {isEn ? 'Confirm Sign Out' : 'Konfirmasi Keluar Akun'}
            </h3>
            <p className="gt-confirm-modal-desc">
              {isEn
                ? 'Are you sure you want to end your GoResilio session? You will be safely redirected to the public dashboard.'
                : 'Apakah Anda yakin ingin keluar dari sesi akun GoResilio? Sesi aktif Anda akan diakhiri dengan aman.'}
            </p>
            <div className="gt-confirm-modal-actions">
              <button
                type="button"
                className="gt-confirm-btn-cancel"
                onClick={() => setShowLogoutConfirm(false)}
              >
                {isEn ? 'Cancel' : 'Batal'}
              </button>
              <button
                type="button"
                className="gt-confirm-btn-danger"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                }}
              >
                <LogOut size={14} />
                <span>{isEn ? 'Yes, Sign Out' : 'Ya, Keluar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Property Delete Confirmation Modal */}
      {propertyToDelete && (
        <div
          className="gt-calm-modal-backdrop"
          style={{ zIndex: 99999 }}
          onClick={() => {
            if (!isDeletingProp) setPropertyToDelete(null);
          }}
        >
          <div className="gt-confirm-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="gt-confirm-modal-icon danger">
              <Trash2 size={24} />
            </div>
            <h3 className="gt-confirm-modal-title">
              {isEn ? 'Delete Monitored Property?' : 'Hapus Riwayat Tapak Properti?'}
            </h3>
            <p className="gt-confirm-modal-desc">
              {isEn
                ? `Are you sure you want to delete "${propertyToDelete.name}" (${propertyToDelete.id}) from your monitored portfolio? This action cannot be undone.`
                : `Apakah Anda yakin ingin menghapus data tapak "${propertyToDelete.name}" (${propertyToDelete.id}) dari portofolio pemantauan Anda? Tindakan ini tidak dapat dibatalkan.`}
            </p>
            <div className="gt-confirm-modal-actions">
              <button
                type="button"
                className="gt-confirm-btn-cancel"
                disabled={isDeletingProp}
                onClick={() => setPropertyToDelete(null)}
              >
                {isEn ? 'Cancel' : 'Batal'}
              </button>
              <button
                type="button"
                className="gt-confirm-btn-danger"
                disabled={isDeletingProp}
                onClick={handleConfirmDeleteProperty}
              >
                <Trash2 size={14} />
                <span>{isDeletingProp ? (isEn ? 'Deleting...' : 'Menghapus...') : (isEn ? 'Yes, Delete' : 'Ya, Hapus')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Midtrans Pro Upgrade Payment Modal */}
      <InstantReportPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onPaymentSuccess={() => {
          setIsPaymentModalOpen(false);
        }}
      />
    </div>
  );
};

export default MyAccountDashboard;
