'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAssessment } from '../../context/AssessmentContext';
import {
  X,
  ShieldCheck,
  FileCheck2,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  ExternalLink,
  RotateCcw,
  Check,
  AlertCircle,
  CreditCard,
  Building,
  QrCode
} from 'lucide-react';

import { normalizeUserTier, UserTier, isPaidUser } from '../../../domain/types/UserTier';

interface InstantReportPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

declare global {
  interface Window {
    snap?: {
      pay: (token: string, callbacks: {
        onSuccess?: (result: any) => void;
        onPending?: (result: any) => void;
        onError?: (result: any) => void;
        onClose?: () => void;
      }) => void;
    };
  }
}

export const InstantReportPaymentModal: React.FC<InstantReportPaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess
}) => {
  const { language } = useLanguage();
  const { currentUser, accountEmail, setCurrentUser, assessment, selectedPaymentPlan, activeAccountRole, setIsReportModalOpen } = useAssessment();

  const isEn = language === 'en';

  const userTier = normalizeUserTier(currentUser?.tierLevel);
  const isPaid = isPaidUser(currentUser?.tierLevel, activeAccountRole);
  const isInstantOwned = userTier === UserTier.INSTANT_PRO || userTier === UserTier.BUNDLING_PRO || userTier === UserTier.ENTERPRISE || userTier === UserTier.ADMIN;
  const isBundlingOwned = userTier === UserTier.BUNDLING_PRO || userTier === UserTier.ENTERPRISE || userTier === UserTier.ADMIN;

  // Modal view states: 'plan_select' -> 'redirect_ready' -> 'payment_success'
  const [modalState, setModalState] = useState<'plan_select' | 'redirect_ready' | 'payment_success'>('plan_select');
  const [selectedSubPlan, setSelectedSubPlan] = useState<'instant' | 'bundling'>('instant');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isInstantOwned && !isBundlingOwned) {
      setSelectedSubPlan('bundling');
    } else if (selectedPaymentPlan) {
      setSelectedSubPlan(selectedPaymentPlan);
    }
  }, [selectedPaymentPlan, isOpen, isInstantOwned, isBundlingOwned]);
  const [snapData, setSnapData] = useState<{
    orderId: string;
    token: string;
    redirectUrl: string;
    grossAmount: number;
  } | null>(null);

  // Load official Midtrans Snap JS dynamically
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '';
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
    const snapScriptUrl = process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL || (isProduction
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js');

    let script = document.getElementById('midtrans-snap-script') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.id = 'midtrans-snap-script';
      script.src = snapScriptUrl;
      script.setAttribute('data-client-key', clientKey);
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  if (!isOpen) return null;

  const currentPrice = selectedSubPlan === 'bundling' ? 85000 : 35000;
  const currentPlanName = selectedSubPlan === 'bundling'
    ? (isEn ? 'GoTangguh Bundling 1 (3 Properties Side-by-Side)' : 'GoTangguh Bundling 1 (3 Properti Komparasi)')
    : (isEn ? 'GoTangguh Instant (1 Property PDF)' : 'GoTangguh Instant (1 Properti PDF)');
  const currentTierLevel = selectedSubPlan === 'bundling'
    ? 'Tier 2 Pro (Bundling 3 Properti)'
    : 'Tier 2 Pro (Instant 1 Properti)';

  // 1. Request real Midtrans Snap Token & Open Snap Popup
  const handleProceedToMidtrans = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const email = currentUser?.email || accountEmail || 'buyer.demo@gotangguh.id';
      const fullName = currentUser?.fullName || (isEn ? 'GoTangguh Customer' : 'Pelanggan GoTangguh');
      const phone = currentUser?.phoneNumber || '+628123456789';

      const res = await fetch('/api/payment/midtrans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          fullName,
          phone,
          price: currentPrice,
          planName: currentPlanName,
          tierLevel: currentTierLevel
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success || !data.token) {
        throw new Error(data.error || (isEn ? 'Failed to connect to Midtrans gateway.' : 'Gagal menghubungi gateway Midtrans.'));
      }

      setSnapData({
        orderId: data.orderId,
        token: data.token,
        redirectUrl: data.redirect_url,
        grossAmount: data.grossAmount || currentPrice
      });

      // If Midtrans Snap JS is loaded, trigger official Snap Popup
      if (window.snap && typeof window.snap.pay === 'function') {
        window.snap.pay(data.token, {
          onSuccess: async (result: any) => {
            console.log('[Midtrans Snap Success callback]:', result);
            await handleVerifySettlement(result.order_id || data.orderId, result.payment_type || 'midtrans_snap');
          },
          onPending: (result: any) => {
            console.log('[Midtrans Snap Pending callback]:', result);
            setIsProcessing(false);
            setModalState('redirect_ready');
            setErrorMessage(
              isEn
                ? 'Payment is pending. Please complete your transaction in your m-banking/e-wallet, then click "Check Payment Status".'
                : 'Pembayaran sedang menunggu (Pending). Silakan selesaikan pembayaran di m-banking/e-wallet Anda, lalu klik tombol "Cek Status Pembayaran".'
            );
          },
          onError: (err: any) => {
            console.error('[Midtrans Snap Error]:', err);
            setIsProcessing(false);
            setErrorMessage(isEn ? 'Payment failed or was canceled on Midtrans.' : 'Pembayaran dibatalkan atau gagal pada gateway Midtrans.');
          },
          onClose: () => {
            setIsProcessing(false);
            setModalState('redirect_ready');
          }
        });
      } else {
        // Fallback: If snap.js popup was blocked by browser, provide direct Midtrans redirect link
        setModalState('redirect_ready');
        setIsProcessing(false);
      }
    } catch (err: any) {
      console.error('[Midtrans Initiate Error]:', err);
      setIsProcessing(false);
      setErrorMessage(err.message || (isEn ? 'An error occurred while initiating payment.' : 'Terjadi kendala saat menghubungkan ke Midtrans.'));
    }
  };

  // 2. Query Real Midtrans Status API and Only Upgrade if Officially SETTLED
  const handleVerifySettlement = async (orderIdToVerify: string, paymentType?: string) => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/payment/status?order_id=${encodeURIComponent(orderIdToVerify)}`);
      const data = await res.json();

      if (data.success && data.isPaid === true) {
        if (data.user) {
          setCurrentUser(data.user);
        } else if (currentUser) {
          setCurrentUser({
            ...currentUser,
            tierLevel: currentTierLevel
          });
        }

        setModalState('payment_success');
        setTimeout(() => {
          setIsProcessing(false);
          onPaymentSuccess();
        }, 1600);
      } else {
        // Payment is NOT settled yet on Midtrans
        setIsProcessing(false);
        setErrorMessage(
          data.message ||
          (isEn
            ? 'Payment has not been completed on Midtrans server yet (Status: PENDING/UNPAID). Please complete your transfer, then re-check.'
            : 'Pembayaran belum terdeteksi LUNAS di server Midtrans (Status: PENDING/BELUM BAYAR). Silakan selesaikan transfer/pembayaran Anda terlebih dahulu, lalu klik cek status kembali.')
        );
      }
    } catch (err: any) {
      console.error('[Settlement Check Error]:', err);
      setIsProcessing(false);
      setErrorMessage(isEn ? 'Failed to verify payment status with Midtrans.' : 'Gagal memverifikasi status pembayaran dengan server Midtrans.');
    }
  };

  return (
    <div className="report-modal-overlay" onClick={onClose}>
      <div
        className="gt-login-modal-card"
        style={{ maxWidth: '520px', padding: '24px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          className="gt-login-modal-close"
          onClick={onClose}
          aria-label={isEn ? 'Close' : 'Tutup'}
        >
          <X size={18} />
        </button>

        {/* =========================================================================
           VIEW 3: PAYMENT SUCCESS CONFIRMATION
           ========================================================================= */}
        {modalState === 'payment_success' ? (
          <div style={{ textAlign: 'center', padding: '24px 10px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#dcfce7',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                boxShadow: '0 10px 25px -5px rgba(22, 163, 74, 0.3)'
              }}
            >
              <Check size={36} />
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {isEn ? 'MIDTRANS REAL GATEWAY SETTLEMENT VERIFIED' : 'TRANSAKSI MIDTRANS TERVERIFIKASI'}
            </span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '4px 0 8px 0' }}>
              {isEn ? 'Payment Successful!' : 'Pembayaran Berhasil!'}
            </h3>
            <p style={{ fontSize: '0.84rem', color: '#64748b', marginBottom: '16px', lineHeight: 1.5 }}>
              {isEn
                ? 'Your payment has been successfully verified. Opening your comprehensive due diligence report...'
                : 'Pembayaran Anda telah berhasil diverifikasi. Membuka dokumen dossier resmi...'}
            </p>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', textAlign: 'left', fontSize: '0.76rem', color: '#475569', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Order ID:</span>
                <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{snapData?.orderId || 'MT-MIDTRANS-2026'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>{isEn ? 'Amount Paid:' : 'Total Pembayaran:'}</span>
                <strong style={{ color: '#c2410c' }}>Rp {(snapData?.grossAmount || currentPrice).toLocaleString('id-ID')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Status Gateway:</span>
                <strong style={{ color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={13} /> SETTLEMENT (LUNAS)
                </strong>
              </div>
            </div>
          </div>
        ) : modalState === 'redirect_ready' && snapData ? (
          /* =========================================================================
             VIEW 2: REAL MIDTRANS SNAP REDIRECT / REOPEN POPUP
             ========================================================================= */
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#0052cc', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem' }}>
                M
              </div>
              <div>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#0052cc', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  MIDTRANS PAYMENT GATEWAY
                </span>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {isEn ? 'Continue on Midtrans Portal' : 'Lanjutkan di Portal Midtrans'}
                </h3>
              </div>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5, marginBottom: '14px' }}>
              {isEn
                ? 'If the Midtrans Snap modal was closed or blocked by your browser, you can reopen it or open the official hosted Midtrans page in a new tab.'
                : 'Jika jendela pop-up Midtrans tertutup atau diblokir browser, Anda dapat membukanya kembali atau menuju portal pembayaran resmi Midtrans.'}
            </p>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', fontSize: '0.78rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Order ID:</span>
                <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{snapData.orderId}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Total Tagihan:</span>
                <strong style={{ color: '#c2410c', fontSize: '0.95rem' }}>Rp {(snapData.grossAmount || currentPrice).toLocaleString('id-ID')}</strong>
              </div>
            </div>

            {/* Real-Time Status / Error Banner */}
            {errorMessage && (
              <div
                style={{
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  marginBottom: '14px',
                  fontSize: '0.76rem',
                  color: '#92400e',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  lineHeight: 1.4
                }}
              >
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '2px', color: '#d97706' }} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Action 1: Reopen Snap Modal */}
            <button
              type="button"
              onClick={() => {
                if (window.snap && snapData?.token) {
                  window.snap.pay(snapData.token, {
                    onSuccess: (result: any) => handleVerifySettlement(result.order_id || snapData.orderId),
                    onPending: (result: any) => {
                      setIsProcessing(false);
                      setErrorMessage(
                        isEn
                          ? 'Payment is pending. Please complete your payment, then click "Check Payment Status".'
                          : 'Pembayaran masih pending. Silakan selesaikan pembayaran, lalu klik "Cek Status Pembayaran".'
                      );
                    },
                    onError: () => {
                      setIsProcessing(false);
                      setErrorMessage(isEn ? 'Payment failed or was canceled on Midtrans.' : 'Pembayaran gagal atau dibatalkan pada Midtrans.');
                    },
                    onClose: () => setIsProcessing(false)
                  });
                }
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #c2410c, #ea580c)',
                color: '#ffffff',
                fontSize: '0.84rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '10px',
                boxShadow: '0 4px 14px rgba(194, 65, 12, 0.3)'
              }}
            >
              <CreditCard size={15} />
              <span>{isEn ? 'Reopen Midtrans Snap Dialog' : 'Buka Kembali Dialog Midtrans Snap'}</span>
            </button>

            {/* Action 2: Open Direct Midtrans Hosted URL */}
            <a
              href={snapData.redirectUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                width: '100%',
                padding: '11px 16px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#0f172a',
                fontSize: '0.82rem',
                fontWeight: 700,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '10px',
                boxSizing: 'border-box'
              }}
            >
              <ExternalLink size={14} />
              <span>{isEn ? 'Open Midtrans Hosted Page (New Tab)' : 'Buka Halaman Resmi Midtrans (Tab Baru)'}</span>
            </a>

            {/* Action 3: Check / Confirm Real-Time Status */}
            <button
              type="button"
              onClick={() => handleVerifySettlement(snapData.orderId)}
              disabled={isProcessing}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #86efac',
                background: '#f0fdf4',
                color: '#166534',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <CheckCircle2 size={14} style={{ color: '#16a34a' }} />
              <span>{isProcessing ? (isEn ? 'Verifying with Midtrans Server...' : 'Memverifikasi ke Server Midtrans...') : (isEn ? 'Check Payment Status (Real-Time)' : 'Cek Status Pembayaran (Real-Time)')}</span>
            </button>

            <button
              type="button"
              onClick={() => setModalState('plan_select')}
              style={{ width: '100%', padding: '8px', marginTop: '10px', background: 'none', border: 'none', color: '#64748b', fontSize: '0.74rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
            >
              <RotateCcw size={12} />
              <span>{isEn ? 'Back to plan details' : 'Kembali ke ringkasan paket'}</span>
            </button>
          </div>
        ) : (
          /* =========================================================================
             VIEW 1: PLAN BENEFIT OVERVIEW & PROCEED WITH REAL MIDTRANS
             ========================================================================= */
          <div>
            {/* Header Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'linear-gradient(135deg, #c2410c, #ea580c)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileCheck2 size={18} />
              </div>
              <div>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#c2410c' }}>
                  {isEn ? 'REAL MIDTRANS PAYMENT GATEWAY' : 'UPGRADE LAPORAN RESMI MIDTRANS'}
                </span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {isEn ? 'GoTangguh Multi-Hazard Dossier' : 'Paket Laporan Komprehensif Multi-Hazard'}
                </h3>
              </div>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5, marginBottom: '14px' }}>
              {isEn
                ? 'Upgrade to Tier 2 Pro via official Midtrans payment gateway to access the full multi-hazard due diligence report and structural mitigation prescriptions.'
                : 'Buka kunci dokumen lengkap berstandar perbankan dan preskripsi mitigasi struktural SNI 1726:2019 melalui gateway pembayaran resmi Midtrans.'}
            </p>

            {/* Target Location Banner */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', fontSize: '0.78rem' }}>
              <strong style={{ color: '#0f172a', display: 'block', marginBottom: '2px' }}>
                {isEn ? 'Target Site Location:' : 'Lokasi Tapak Properti Terpilih:'}
              </strong>
              <span style={{ color: '#475569' }}>
                {assessment?.location?.formattedAddress || (isEn ? 'Selected Plot Location' : 'Tapak Terpilih')}
              </span>
            </div>

            {/* Sub-Package Selection Pills */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
              {/* Option 1: Instant (1 Properti) */}
              <div
                onClick={() => setSelectedSubPlan('instant')}
                style={{
                  border: `2px solid ${
                    selectedSubPlan === 'instant'
                      ? isInstantOwned ? '#10b981' : '#c2410c'
                      : isInstantOwned ? '#bbf7d0' : '#e2e8f0'
                  }`,
                  background: selectedSubPlan === 'instant'
                    ? isInstantOwned ? '#f0fdf4' : '#fff7ed'
                    : isInstantOwned ? '#fafffd' : '#ffffff',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
              >
                {isInstantOwned && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-9px',
                      right: '10px',
                      background: '#10b981',
                      color: '#ffffff',
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      padding: '2px 7px',
                      borderRadius: '9999px',
                      boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}
                  >
                    <Check size={10} />
                    <span>{isEn ? 'Already Owned' : 'Sudah Dibeli'}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: selectedSubPlan === 'instant' ? (isInstantOwned ? '#047857' : '#c2410c') : '#334155' }}>
                    {isEn ? 'Instant (1 Property)' : 'Instant (1 Properti)'}
                  </span>
                  {selectedSubPlan === 'instant' && (
                    <CheckCircle2 size={14} style={{ color: isInstantOwned ? '#10b981' : '#c2410c' }} />
                  )}
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '4px 0 2px' }}>
                  Rp 35.000
                </div>
                <span style={{ fontSize: '0.68rem', color: isInstantOwned ? '#059669' : '#64748b', fontWeight: isInstantOwned ? 700 : 400 }}>
                  {isInstantOwned
                    ? (isEn ? '✓ Active Plan' : '✓ Paket Aktif Anda')
                    : (isEn ? '1 Location · ±10 Pages' : '1 Lokasi · ±10 Halaman')}
                </span>
              </div>

              {/* Option 2: Bundling 1 (3 Properti) */}
              <div
                onClick={() => setSelectedSubPlan('bundling')}
                style={{
                  border: `2px solid ${
                    selectedSubPlan === 'bundling'
                      ? isBundlingOwned ? '#10b981' : '#c2410c'
                      : isBundlingOwned ? '#bbf7d0' : '#e2e8f0'
                  }`,
                  background: selectedSubPlan === 'bundling'
                    ? isBundlingOwned ? '#f0fdf4' : '#fff7ed'
                    : isBundlingOwned ? '#fafffd' : '#ffffff',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
              >
                {isBundlingOwned ? (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-9px',
                      right: '10px',
                      background: '#10b981',
                      color: '#ffffff',
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      padding: '2px 7px',
                      borderRadius: '9999px',
                      boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}
                  >
                    <Check size={10} />
                    <span>{isEn ? 'Already Owned' : 'Sudah Dibeli'}</span>
                  </div>
                ) : isInstantOwned ? (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-9px',
                      right: '10px',
                      background: '#ea580c',
                      color: '#ffffff',
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      padding: '2px 7px',
                      borderRadius: '9999px',
                      boxShadow: '0 2px 6px rgba(234, 88, 12, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}
                  >
                    <Sparkles size={10} />
                    <span>{isEn ? 'Upgrade Plan' : 'Opsi Upgrade'}</span>
                  </div>
                ) : null}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: selectedSubPlan === 'bundling' ? (isBundlingOwned ? '#047857' : '#c2410c') : '#334155' }}>
                    {isEn ? 'Bundling 1 (3 Properties)' : 'Bundling 1 (3 Properti)'}
                  </span>
                  {selectedSubPlan === 'bundling' && (
                    <CheckCircle2 size={14} style={{ color: isBundlingOwned ? '#10b981' : '#c2410c' }} />
                  )}
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '4px 0 2px' }}>
                  Rp 85.000
                </div>
                <span style={{ fontSize: '0.68rem', color: isBundlingOwned ? '#059669' : '#64748b', fontWeight: isBundlingOwned ? 700 : 400 }}>
                  {isBundlingOwned
                    ? (isEn ? '✓ Active Plan' : '✓ Paket Aktif Anda')
                    : (isEn ? '3 Locations · Side-by-Side' : '1–3 Lokasi · Komparasi')}
                </span>
              </div>
            </div>

            {/* Price & Benefits Box */}
            {selectedSubPlan === 'instant' && isInstantOwned ? (
              <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1.5px solid #86efac', borderRadius: '10px', padding: '12px 14px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>
                      {isEn ? 'Selected Package' : 'Paket Terpilih'}
                    </span>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#15803d' }}>
                      {isEn ? 'Instant 1 Property (Rp 35,000)' : 'Instant 1 Properti (Rp 35.000)'}
                    </div>
                  </div>
                  <span style={{ background: '#16a34a', color: '#ffffff', padding: '4px 9px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={12} />
                    {isEn ? 'Already Owned' : 'Sudah Anda Miliki'}
                  </span>
                </div>
                <p style={{ fontSize: '0.76rem', color: '#14532d', lineHeight: 1.45, margin: 0 }}>
                  {isEn
                    ? 'You already have active Pro access for this instant report. You can open the PDF dossier directly or select Bundling 1 (Rp 85,000) to unlock 3-property comparative analysis.'
                    : 'Akun Anda sudah memiliki akses Pro aktif untuk paket Instant ini. Anda tidak perlu membayar lagi, silakan langsung buka dokumen PDF atau pilih paket Bundling 1 (Rp 85.000) untuk upgrade ke fitur komparasi 3 properti.'}
                </p>
              </div>
            ) : selectedSubPlan === 'bundling' && isBundlingOwned ? (
              <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1.5px solid #86efac', borderRadius: '10px', padding: '12px 14px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>
                      {isEn ? 'Selected Package' : 'Paket Terpilih'}
                    </span>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#15803d' }}>
                      {isEn ? 'Bundling 1 - 3 Properties (Rp 85,000)' : 'Bundling 1 - 3 Properti (Rp 85.000)'}
                    </div>
                  </div>
                  <span style={{ background: '#16a34a', color: '#ffffff', padding: '4px 9px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={12} />
                    {isEn ? 'Already Owned' : 'Sudah Anda Miliki'}
                  </span>
                </div>
                <p style={{ fontSize: '0.76rem', color: '#14532d', lineHeight: 1.45, margin: 0 }}>
                  {isEn
                    ? 'You have full Bundling 3-property access active on your account.'
                    : 'Akun Anda sudah memiliki akses penuh paket Bundling 1 (3 Properti Komparasi).'}
                </p>
              </div>
            ) : (
              <div style={{ background: 'linear-gradient(135deg, #fff7ed, #ffedd5)', border: '1px solid #fed7aa', borderRadius: '10px', padding: '12px 14px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#9a3412', textTransform: 'uppercase' }}>
                      {isInstantOwned && selectedSubPlan === 'bundling' ? (isEn ? 'Upgrade Package' : 'Upgrade Paket') : (isEn ? 'Selected Package' : 'Paket Terpilih')}
                    </span>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#c2410c' }}>
                      {selectedSubPlan === 'bundling' ? (isEn ? 'Rp 85,000 (Bundling 3 Properties)' : 'Rp 85.000 (Bundling 3 Properti)') : (isEn ? 'Rp 35,000 (Instant 1 Property)' : 'Rp 35.000 (Instant 1 Properti)')}
                    </div>
                  </div>
                  <span style={{ background: '#c2410c', color: '#ffffff', padding: '3px 8px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800 }}>
                    {selectedSubPlan === 'bundling' ? (isEn ? '3 Reports Quota' : 'Kuota 3 Laporan PDF') : (isEn ? '1 Report Quota' : 'Kuota 1 Laporan PDF')}
                  </span>
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.74rem', color: '#431407' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={13} style={{ color: '#ea580c', flexShrink: 0 }} />
                    <span>{isEn ? 'Baseline 3-Hazard Profile (Flood, Heat, Quake)' : 'Profil Risiko Dasar 3 Hazard (Banjir, Cuaca Panas, Gempa)'}</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={13} style={{ color: '#ea580c', flexShrink: 0 }} />
                    <span>{selectedSubPlan === 'bundling' ? (isEn ? 'Side-by-side comparative risk evaluation for buyers' : 'Laporan komparasi side-by-side untuk evaluasi 3 kandidat rumah') : (isEn ? 'Official automated PDF report (±10 pages) + General Recommendations' : 'Laporan PDF otomatis (±10 halaman) + Rekomendasi Umum')}</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={13} style={{ color: '#ea580c', flexShrink: 0 }} />
                    <span>{isEn ? 'Verified Multi-Agency Data Feeds (BNPB, USGS, Open-Meteo, OSM)' : 'Data Terverifikasi Resmi (BNPB inaRISK, USGS, Open-Meteo, OSM)'}</span>
                  </li>
                </ul>
              </div>
            )}

            {/* Midtrans Channel Support Badge */}
            <div style={{ marginBottom: '14px' }}>
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #e2e8f0',
                  background: '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#0052cc', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.76rem' }}>
                    M
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.78rem', color: '#0f172a', display: 'block' }}>
                      Midtrans Snap Payment Gateway
                    </strong>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                      {isEn ? 'QRIS · GoPay · Bank Transfer · Credit Card' : 'QRIS · GoPay · BCA · Mandiri · BNI · BRI · Kartu Kredit'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  marginBottom: '14px',
                  fontSize: '0.76rem',
                  color: '#991b1b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <AlertCircle size={15} style={{ flexShrink: 0, color: '#dc2626' }} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Action / Proceed Button */}
            {(selectedSubPlan === 'instant' && isInstantOwned) || (selectedSubPlan === 'bundling' && isBundlingOwned) ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setIsReportModalOpen(true);
                }}
                style={{
                  width: '100%',
                  padding: '12px 18px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#ffffff',
                  fontSize: '0.86rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 8px 24px -4px rgba(16, 185, 129, 0.4)'
                }}
              >
                <CheckCircle2 size={16} />
                <span>{isEn ? '✓ Plan Already Active — Open PDF Report' : '✓ Paket Sudah Aktif — Buka Laporan PDF'}</span>
                <ArrowRight size={15} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleProceedToMidtrans}
                disabled={isProcessing}
                style={{
                  width: '100%',
                  padding: '12px 18px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #c2410c, #ea580c)',
                  color: '#ffffff',
                  fontSize: '0.86rem',
                  fontWeight: 800,
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 8px 24px -4px rgba(194, 65, 12, 0.4)',
                  opacity: isProcessing ? 0.7 : 1,
                  transition: 'all 0.2s'
                }}
              >
                <Lock size={15} />
                <span>
                  {isProcessing
                    ? (isEn ? 'Connecting to Midtrans API...' : 'Menghubungkan ke Midtrans API...')
                    : (selectedSubPlan === 'bundling' && isInstantOwned
                        ? (isEn ? 'Pay Rp 85,000 Upgrade with Midtrans' : 'Bayar Upgrade Rp 85.000 dengan Midtrans')
                        : (isEn ? `Pay ${selectedSubPlan === 'bundling' ? 'Rp 85,000' : 'Rp 35,000'} with Midtrans` : `Bayar ${selectedSubPlan === 'bundling' ? 'Rp 85.000' : 'Rp 35.000'} dengan Midtrans`))}
                </span>
                <ArrowRight size={15} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
