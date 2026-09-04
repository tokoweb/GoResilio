'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAssessment } from '../../context/AssessmentContext';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Building,
  MessageSquare,
  Send,
  MapPin,
  Sparkles,
  PhoneCall,
  FileCheck2,
  Clock
} from 'lucide-react';

interface InstantReportPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

const ADMIN_WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || '6281199887766';

export const InstantReportPaymentModal: React.FC<InstantReportPaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess
}) => {
  const { language } = useLanguage();
  const { currentUser, assessment, selectedPaymentPlan } = useAssessment();
  const isEn = language === 'en';

  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [selectedPlan, setSelectedPlan] = useState<'instant' | 'bundling' | 'consultation'>(
    selectedPaymentPlan === 'bundling' ? 'bundling' : 'instant'
  );
  const [clientName, setClientName] = useState(currentUser?.fullName || '');
  const [clientContact, setClientContact] = useState(currentUser?.phoneNumber || currentUser?.email || '');
  const [clientNotes, setClientNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const planTitles = {
    instant: isEn ? 'Instant Report (1 Property)' : 'Laporan Instan (1 Properti)',
    bundling: isEn ? 'Bundling (Compare 3 Properties)' : 'Bundling (Bandingkan 3 Properti)',
    consultation: isEn ? 'Expert Consultation & Field Verification' : 'Konsultasi Ahli & Verifikasi Lapangan'
  };

  const planDescriptions = {
    instant: isEn
      ? 'Official comprehensive 10–14 page risk PDF report for 1 property site covering 4 risk categories, evacuation routes, and action plan.'
      : 'Laporan resmi format PDF (±10–14 halaman) mencakup 4 potensi risiko (banjir, gempa, panas, aksesibilitas), peta evakuasi, dan rencana tindakan mitigasi.',
    bundling: isEn
      ? 'Side-by-side comparison dossier for 3 candidate properties before purchase.'
      : 'Laporan komparasi risiko side-by-side 3 properti untuk memilih alternatif lokasi teraman.',
    consultation: isEn
      ? 'Direct review by Disaster Risk Specialists and on-site survey by Architects and Structural Engineers.'
      : 'Review mendalam oleh tim ahli kebumian serta verifikasi lapangan langsung oleh Arsitek dan Ahli Struktur.'
  };

  const propertyAddress = assessment?.location?.formattedAddress || 'Lokasi Titik Marker Terpilih';
  const coordsStr = assessment?.location?.latitude && assessment?.location?.longitude
    ? `${assessment.location.latitude.toFixed(5)}, ${assessment.location.longitude.toFixed(5)}`
    : 'Koordinat Tapak';

  const handleSendInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientContact.trim()) {
      setErrorMessage(isEn ? 'Please fill in your name and WhatsApp/contact.' : 'Nama pemesan dan nomor WhatsApp wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const targetPackageTitle = planTitles[selectedPlan];
    const voucherCode = `REQ-${Date.now().toString(36).toUpperCase()}`;

    try {
      // 1. Log order inquiry to backend database
      await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voucherCode,
          clientName: clientName.trim(),
          clientEmail: clientContact.includes('@') ? clientContact.trim() : (currentUser?.email || 'customer@gotangguh.id'),
          clientPhone: clientContact.trim(),
          targetLocation: `${propertyAddress} (${coordsStr})`,
          packageType: targetPackageTitle,
          notes: clientNotes.trim()
        })
      }).catch(() => {
        // Continue even if local DB is offline
      });

      // 2. Generate pre-filled WhatsApp message
      const waMessage =
        `Halo Tim Admin GoResilio / BGP Consultant,\n\n` +
        `Saya ingin memesan layanan asesmen properti:\n` +
        `• Paket: ${targetPackageTitle}\n` +
        `• Alamat Properti: ${propertyAddress}\n` +
        `• Koordinat: ${coordsStr}\n` +
        `• Nama Pemesan: ${clientName.trim()}\n` +
        `• Kontak / WA: ${clientContact.trim()}\n` +
        (clientNotes.trim() ? `• Catatan: ${clientNotes.trim()}\n` : '') +
        `• Kode Referensi: ${voucherCode}\n\n` +
        `Mohon informasi aktivasi dan penerbitan dokumen resmi. Terima kasih.`;

      const waUrl = `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(waMessage)}`;

      // 3. Open WhatsApp in new tab
      window.open(waUrl, '_blank', 'noopener,noreferrer');

      setIsSuccess(true);
      onPaymentSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengirim permohonan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isMounted || !isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className="gt-modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999999,
      padding: '16px'
    }}>
      <div className="gt-modal-card" style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        maxWidth: '560px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #e2e8f0'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          borderRadius: '16px 16px 0 0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#1e293b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8'
            }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>
                {isEn ? 'Order Report & Direct Consultation' : 'Pemesanan Laporan & Konsultasi Ahli'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                {isEn ? 'Official service backed by BGP Consultant & RDI' : 'Layanan resmi didukung BGP Consultant & RDI'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px' }}>
          {isSuccess ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#dcfce7',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <CheckCircle2 size={36} />
              </div>
              <h4 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                {isEn ? 'Inquiry Sent Successfully!' : 'Permohonan Berhasil Terkirim!'}
              </h4>
              <p style={{ fontSize: '0.92rem', color: '#64748b', lineHeight: 1.6, marginBottom: '24px' }}>
                {isEn
                  ? 'WhatsApp chat with our admin team has been initiated. Our specialists will assist you with official dossier issuance.'
                  : 'Pesan WhatsApp telah terkirim ke Admin GoResilio. Tim ahli kami akan segera memverifikasi detail lokasi dan menerbitkan dokumen laporan resmi Anda.'}
              </p>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '12px 28px',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  borderRadius: '10px',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  cursor: 'pointer'
                }}
              >
                {isEn ? 'Close Window' : 'Selesai & Tutup'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSendInquiry}>
              {/* Package Selector */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                  {isEn ? 'Select Service Package' : 'Pilihan Paket Layanan'}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                  {(['instant', 'bundling', 'consultation'] as const).map((pkg) => (
                    <div
                      key={pkg}
                      onClick={() => setSelectedPlan(pkg)}
                      style={{
                        padding: '14px 16px',
                        borderRadius: '12px',
                        border: selectedPlan === pkg ? '2px solid #0284c7' : '1px solid #e2e8f0',
                        backgroundColor: selectedPlan === pkg ? '#f0f9ff' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: selectedPlan === pkg ? '#0369a1' : '#0f172a' }}>
                            {planTitles[pkg]}
                          </span>
                        </div>
                        {selectedPlan === pkg && <CheckCircle2 size={18} color="#0284c7" />}
                      </div>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', lineHeight: 1.4 }}>
                        {planDescriptions[pkg]}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Property Target Summary */}
              <div style={{
                padding: '14px 16px',
                borderRadius: '12px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <MapPin size={18} color="#0284c7" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {isEn ? 'Target Site Location' : 'Lokasi Tapak Terpilih'}
                    </span>
                    <p style={{ margin: '2px 0 0', fontSize: '0.88rem', fontWeight: 600, color: '#0f172a' }}>
                      {propertyAddress}
                    </p>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      Koordinat: {coordsStr}
                    </span>
                  </div>
                </div>
              </div>

              {/* Client Info Inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    {isEn ? 'Full Name' : 'Nama Lengkap'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder={isEn ? 'Enter your full name' : 'Masukkan nama lengkap Anda'}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    {isEn ? 'WhatsApp Number' : 'Nomor WhatsApp / Kontak'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={clientContact}
                    onChange={(e) => setClientContact(e.target.value)}
                    placeholder={isEn ? '+62 812-xxxx-xxxx' : '0812-xxxx-xxxx'}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Notes Input */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  {isEn ? 'Special Notes / Questions (Optional)' : 'Catatan Khusus / Pertanyaan (Opsional)'}
                </label>
                <textarea
                  rows={2}
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  placeholder={isEn ? 'Enter any specific questions or property requirements...' : 'Tuliskan catatan khusus atau kebutuhan verifikasi properti Anda...'}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    outline: 'none',
                    resize: 'none'
                  }}
                />
              </div>

              {errorMessage && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  fontSize: '0.85rem',
                  marginBottom: '16px'
                }}>
                  {errorMessage}
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  borderRadius: '10px',
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.98rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(22, 163, 74, 0.3)',
                  transition: 'background 0.2s'
                }}
              >
                <MessageSquare size={20} />
                <span>
                  {isSubmitting
                    ? (isEn ? 'Connecting...' : 'Menghubungkan...')
                    : (isEn ? 'Chat WhatsApp Admin to Order' : 'Pesan & Hubungi WhatsApp Admin')}
                </span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '12px' }}>
                <Clock size={13} color="#64748b" />
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  {isEn ? 'Response time: <15 mins during business hours' : 'Respons cepat: <15 menit pada jam kerja'}
                </span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
