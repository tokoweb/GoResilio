import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAssessment } from '../../context/AssessmentContext';
import { BookConsultationUseCase } from '../../../application/use_cases/BookConsultation.usecase';
import { CustomSelect } from '../ui/CustomSelect';
import { CheckCircle2, Send, Check, ShieldCheck, UserCheck, HardHat, Compass, MapPin, Building, Award, LayoutDashboard } from 'lucide-react';

export const BookDemoSection: React.FC = () => {
  const { language, t } = useLanguage();
  const { assessment, openAdminConsole } = useAssessment();

  const isEn = language === 'en';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [roleTitle, setRoleTitle] = useState(isEn ? 'Home Buyer / Individual' : 'Pencari Rumah / Pembeli Pribadi');
  const [packageInterest, setPackageInterest] = useState('');
  const [targetLocation, setTargetLocation] = useState(assessment?.location.formattedAddress || '');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [bookingRef, setBookingRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync with active assessment address if location changes
  React.useEffect(() => {
    if (assessment?.location.formattedAddress && !targetLocation) {
      setTargetLocation(assessment.location.formattedAddress);
    }
  }, [assessment, targetLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !phone || !date) return;

    setIsSubmitting(true);
    try {
      const res = await BookConsultationUseCase.execute({
        fullName,
        email,
        phone,
        organization: company || (isEn ? 'Individual' : 'Individu / Perorangan'),
        roleTitle,
        packageInterest: packageInterest || (isEn ? 'Lite Consultation: Expert Data Review' : 'Konsultasi Lite / Basic: Review Data Ahli'),
        targetLocation: targetLocation || assessment?.location.formattedAddress || (isEn ? 'Indonesia / Regional' : 'Indonesia'),
        preferredDate: date,
        notes
      });
      setBookingRef(res.bookingId);
      setSubmitted(true);
    } catch {
      // Handle error
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="demo-section-wrapper" id="book-demo">
      <div className="gt-luxury-consult-slab">
        {/* Left Information Column */}
        <div className="gt-consult-info-col">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            <div className="gt-consult-kicker-tag" style={{ marginBottom: 0 }}>
              <ShieldCheck size={14} />
              <span>{isEn ? 'OFFICIAL EXPERT CONSULTATION & FIELD VERIFICATION' : 'LAYANAN KONSULTASI AHLI & VERIFIKASI LAPANGAN'}</span>
            </div>

            <button
              type="button"
              onClick={() => openAdminConsole('reports', 'inquiries')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#f8fafc',
                color: '#334155',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '5px 11px',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#fff7ed';
                e.currentTarget.style.color = '#c2410c';
                e.currentTarget.style.borderColor = '#fdba74';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.color = '#334155';
                e.currentTarget.style.borderColor = '#cbd5e1';
              }}
              title={isEn ? 'Open Consultation Admin Dashboard' : 'Buka Dashboard Admin Permohonan Konsultasi'}
            >
              <LayoutDashboard size={13} style={{ color: '#c2410c' }} />
              <span>{isEn ? 'Consultation Admin Dashboard' : 'Dashboard Admin Konsultasi'}</span>
            </button>
          </div>

          <h2 className="gt-consult-title">{t.demo.title}</h2>
          <p className="gt-consult-subtitle">{t.demo.subtitle}</p>

          <div className="gt-consult-value-deck">
            <div className="gt-consult-val-item">
              <div className="gt-consult-val-icon">
                <UserCheck size={18} />
              </div>
              <div>
                <strong>{t.demo.pillar1Title || (isEn ? 'Disaster Risk & Geospatial Analysis' : 'Analisis Risiko bencana & Geospasial')}</strong>
                <p>{t.demo.pillar1Desc || (isEn ? 'Property risk evaluation powered by geospatial intelligence and engineering diagnostics.' : 'Evaluasi risiko properti berbasis data geospasial dan analisis teknis untuk mengidentifikasi potensi bahaya, kerentanan, serta kebutuhan mitigasi bersama tim ahli.')}</p>
              </div>
            </div>

            <div className="gt-consult-val-item">
              <div className="gt-consult-val-icon">
                <HardHat size={18} />
              </div>
              <div>
                <strong>{t.demo.pillar2Title || (isEn ? 'Technical Field Verification' : 'Verifikasi teknis lapangan')}</strong>
                <p>{t.demo.pillar2Desc || (isEn ? 'Actual site condition verification through ground inspection, elevation surveys, soil bearing tests (sondir), and structural checks.' : 'Verifikasi kondisi aktual properti melalui pemeriksaan tapak, elevasi, daya dukung tanah (sondir), serta kondisi dan integritas struktur bangunan eksisting.')}</p>
              </div>
            </div>

            <div className="gt-consult-val-item">
              <div className="gt-consult-val-icon">
                <Compass size={18} />
              </div>
              <div>
                <strong>{t.demo.pillar3Title || (isEn ? 'Design Guidelines & Contractor Referrals' : 'Panduan Desain & Kontraktor')}</strong>
                <p>{t.demo.pillar3Desc || (isEn ? 'Disaster-Resilient Housing design recommendations and certified contractor referrals for construction or retrofitting.' : 'Rekomendasi desain Rumah Tangguh Bencana dan referensi kontraktor untuk konstruksi atau renovasi.')}</p>
              </div>
            </div>
          </div>

          <div className="gt-consult-backing-badge">
            <strong>{t.demo.credibilityTitle || (isEn ? 'Credibility Backed By:' : 'Kredibilitas Didukung Oleh:')}</strong> {t.demo.credibilityText || (isEn ? 'Research & Disaster Resilience Specialists from Baresi Global Prime (BGP) Consultant' : 'Tim Peneliti & Ahli Kebencanaan dari Baresi Global Prime (BGP) Consultant')}
          </div>
        </div>

        {/* Right Form Column */}
        <div className="gt-consult-form-col">
          {submitted ? (
            <div className="gt-consult-success-box">
              <div className="gt-success-icon-wrap">
                <Check size={28} />
              </div>
              <h3 className="gt-success-title">{t.demo.successMsg}</h3>
              <p className="gt-success-sub">{t.demo.successSub}</p>

              <div className="gt-booking-ref-card">
                <span className="gt-ref-kicker">{isEn ? 'Booking Reference ID' : 'Nomor Referensi Permohonan'}</span>
                <span className="gt-ref-num">{bookingRef}</span>
                <span className="gt-ref-loc">
                  <MapPin size={13} style={{ display: 'inline', marginRight: '4px' }} />
                  {targetLocation || (isEn ? 'Selected Plot' : 'Tapak Terpilih')}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  type="button"
                  className="gt-btn-book-another"
                  onClick={() => {
                    setSubmitted(false);
                    setFullName('');
                    setEmail('');
                    setCompany('');
                    setDate('');
                    setNotes('');
                  }}
                >
                  {isEn ? 'Book Another Consultation' : 'Buat Permohonan Lain'}
                </button>
                <button
                  type="button"
                  onClick={() => openAdminConsole('reports', 'inquiries')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#0f172a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '9px 16px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <LayoutDashboard size={14} />
                  <span>{isEn ? 'View in Admin Inbox' : 'Lihat di Inbox Admin'}</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="gt-consult-form-body">
              <h3 className="gt-form-title">{t.demo.formTitle}</h3>

              {/* 1. Full Name */}
              <div className="gt-form-group">
                <label className="gt-form-label">{t.demo.nameLabel}</label>
                <input
                  type="text"
                  required
                  className="gt-form-input"
                  placeholder={t.demo.namePlaceholder}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              {/* 2. Email Address */}
              <div className="gt-form-group">
                <label className="gt-form-label">{t.demo.emailLabel}</label>
                <input
                  type="email"
                  required
                  className="gt-form-input"
                  placeholder={t.demo.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* 3. WhatsApp / Phone Number */}
              <div className="gt-form-group">
                <label className="gt-form-label">{t.demo.phoneLabel || (isEn ? 'Active WhatsApp Number' : 'Nomor WhatsApp / Kontak Aktif')}</label>
                <input
                  type="tel"
                  required
                  className="gt-form-input"
                  placeholder={t.demo.phonePlaceholder || (isEn ? '+62 812-xxxx-xxxx' : '0812-xxxx-xxxx')}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              {/* 3. Persona / Role */}
              <div className="gt-form-group">
                <label className="gt-form-label">{t.demo.roleLabel}</label>
                <CustomSelect
                  theme="light"
                  value={roleTitle}
                  onChange={(val) => setRoleTitle(val)}
                  options={[
                    { value: 'Pencari Rumah / Pembeli Pribadi', label: isEn ? 'Home Buyer / Individual Property Seeker' : 'Pencari Rumah / Pembeli Pribadi', icon: <UserCheck size={14} /> },
                    { value: 'Investor Lahan / Properti Jangka Panjang', label: isEn ? 'Long-Term Land / Property Investor' : 'Investor Lahan / Properti Jangka Panjang', icon: <Building size={14} /> },
                    { value: 'Property Developer (Studi Kawasan B2B)', label: isEn ? 'Property Developer (Estate Feasibility B2B)' : 'Property Developer (Studi Kawasan B2B)', icon: <HardHat size={14} /> },
                    { value: 'Institusi Finansial / Perbankan / Notaris', label: isEn ? 'Financial Institution / Banking / Appraisal' : 'Institusi Finansial / Perbankan / Notaris', icon: <Award size={14} /> }
                  ]}
                  ariaLabel={t.demo.roleLabel}
                />
              </div>

              {/* 4. Package Interest */}
              <div className="gt-form-group">
                <label className="gt-form-label">{t.demo.packageLabel}</label>
                <CustomSelect
                  theme="light"
                  value={packageInterest}
                  onChange={(val) => setPackageInterest(val)}
                  placeholder={t.demo.packagePlaceholder || (isEn ? 'Select service package...' : 'Pilih paket layanan...')}
                  options={[
                    {
                      value: 'Konsultasi Lite / Basic: Review Data Ahli',
                      label: isEn ? 'Lite Consultation: Expert Data Review' : 'Konsultasi Lite / Basic: Review Data Ahli'
                    },
                    {
                      value: 'Konsultasi Gold: On-Site Survey Arsitek & Sipil',
                      label: isEn ? 'Gold Package: On-Site Survey by Architects & Civil Engineers' : 'Konsultasi Gold: On-Site Survey Arsitek & Sipil',
                      badge: 'Populer'
                    },
                    {
                      value: 'Studi Kelayakan Kawasan Pengembang (B2B Custom)',
                      label: isEn ? 'Developer Masterplan & Zoning Feasibility (B2B Custom)' : 'Studi Kelayakan Kawasan Pengembang (B2B Custom)',
                      badge: 'B2B Custom'
                    },
                    {
                      value: 'Layanan Tambahan: Pemilihan Lahan & Katalog Desain Rumah Tangguh',
                      label: isEn ? 'Add-on Service: Land Selection & Resilient House Design Catalog' : 'Layanan Tambahan: Pemilihan Lahan & Katalog Desain Rumah Tangguh'
                    }
                  ]}
                  ariaLabel={t.demo.packageLabel}
                />
              </div>

              {/* 5. Target Location */}
              <div className="gt-form-group">
                <label className="gt-form-label">{t.demo.locationLabel}</label>
                <input
                  type="text"
                  className="gt-form-input"
                  placeholder={t.demo.locationPlaceholder || (isEn ? 'Enter property location or address' : 'Masukkan alamat atau lokasi properti')}
                  value={targetLocation}
                  onChange={(e) => setTargetLocation(e.target.value)}
                />
              </div>

              {/* 6. Date Selection */}
              <div className="gt-form-group">
                <label className="gt-form-label">{t.demo.dateLabel}</label>
                <input
                  type="date"
                  required
                  className="gt-form-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              {/* 7. Notes */}
              <div className="gt-form-group">
                <label className="gt-form-label">{t.demo.notesLabel}</label>
                <textarea
                  className="gt-form-textarea"
                  rows={2}
                  placeholder={t.demo.notesPlaceholder}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="gt-btn-submit-consult"
              >
                <Send size={16} />
                <span>{isSubmitting ? (isEn ? 'Submitting request...' : 'Memproses Permohonan...') : t.demo.submitBtn}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default BookDemoSection;
