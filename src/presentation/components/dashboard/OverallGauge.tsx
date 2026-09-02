import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useLanguage } from '../../context/LanguageContext';
import { useAssessment } from '../../context/AssessmentContext';
import { FileText, ArrowRight, ShieldCheck, MapPin } from 'lucide-react';

export const OverallGauge: React.FC = () => {
  const { language, t } = useLanguage();
  const { assessment, propertyType, handleDownloadReportRequest, isLoading, setIsAuditModalOpen } = useAssessment();
  const [displayScore, setDisplayScore] = useState<number>(0);
  const polygonRef = useRef<SVGPolygonElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const rawOverall = assessment?.overallScore;
  const overallScore = typeof rawOverall === 'number' && !isNaN(rawOverall) ? rawOverall : 0;
  const overallLevel = assessment?.overallLevel || 'medium';

  // GSAP Counter Animation & SVG Stroke Dashoffset
  useEffect(() => {
    const obj = { val: displayScore };
    gsap.to(obj, {
      val: overallScore,
      duration: 1.2,
      ease: 'power2.out',
      onUpdate: () => {
        setDisplayScore(Math.round(obj.val));
      }
    });

    if (polygonRef.current) {
      const perimeter = 520;
      const targetOffset = perimeter - (overallScore / 100) * perimeter;
      gsap.to(polygonRef.current, {
        strokeDashoffset: targetOffset,
        duration: 1.4,
        ease: 'power2.out'
      });
    }
  }, [overallScore]);

  // Entrance animation
  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
      );
    }
  }, []);

  if (isLoading) {
    return (
      <div className="gt-cadastral-seal-card is-loading-shimmer" ref={cardRef}>
        <div className="gt-seal-header">
          <h3 className="gt-seal-title">{language === 'id' ? 'Status Asesmen Lokasi' : 'Location Assessment Status'}</h3>
          <span className="gt-seal-sub-type">
            {t.dashboard.propertyTypeLabel}: <strong>{propertyType}</strong>
          </span>
        </div>

        <div style={{ padding: '44px 20px', textAlign: 'center' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: '#fff7ed',
            border: '1.5px solid #ea580c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            color: '#ea580c',
            animation: 'cadastral-pulse 1.8s infinite ease-out'
          }}>
            <ShieldCheck size={28} />
          </div>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
            {language === 'id' ? 'Menyiapkan Asesmen Multi-Bahaya...' : 'Preparing Multi-Hazard Assessment...'}
          </h4>
          <p style={{ fontSize: '0.86rem', color: '#64748b', lineHeight: 1.5, maxWidth: '280px', margin: '0 auto' }}>
            {language === 'id'
              ? 'Menganalisis parameter risiko dan data geospasial untuk titik yang dipilih...'
              : 'Analyzing multi-hazard risk parameters and geospatial data for the selected location...'}
          </p>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="gt-cadastral-seal-card" ref={cardRef}>
        <div className="gt-seal-header">
          <h3 className="gt-seal-title">{language === 'id' ? 'Status Asesmen Lokasi' : 'Location Assessment Status'}</h3>
          <span className="gt-seal-sub-type">
            {t.dashboard.propertyTypeLabel}: <strong>{propertyType}</strong>
          </span>
        </div>

        <div style={{ padding: '44px 20px', textAlign: 'center' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: '#f1f5f9',
            border: '1.5px dashed #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            color: '#ea580c'
          }}>
            <MapPin size={26} />
          </div>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
            {language === 'id' ? 'Belum Ada Lokasi Asesmen' : 'No Assessment Location Selected'}
          </h4>
          <p style={{ fontSize: '0.86rem', color: '#64748b', lineHeight: 1.5, maxWidth: '280px', margin: '0 auto' }}>
            {language === 'id'
              ? 'Klik tombol "Gunakan Titik Tengah Peta" atau klik pada peta untuk memulai analisis multi-bahaya.'
              : 'Click "Assess Center Location" or click on the map to start multi-hazard analysis.'}
          </p>
        </div>
      </div>
    );
  }

  const color =
    overallLevel === 'extreme'
      ? '#dc2626'
      : overallLevel === 'high'
      ? '#ea580c'
      : overallLevel === 'medium'
      ? '#d97706'
      : '#15803d';

  const label =
    language === 'id'
      ? overallLevel === 'extreme'
        ? 'Risiko Ekstrem'
        : overallLevel === 'high'
        ? 'Risiko Tinggi'
        : overallLevel === 'medium'
        ? 'Risiko Sedang'
        : 'Risiko Rendah'
      : overallLevel === 'extreme'
      ? 'Extreme Risk'
      : overallLevel === 'high'
      ? 'High Risk'
      : overallLevel === 'medium'
      ? 'Moderate Risk'
      : 'Low Risk';

  const floodVal = typeof assessment.flood?.score === 'number' ? assessment.flood.score : 0;
  const quakeVal = typeof assessment.quake?.score === 'number' ? assessment.quake.score : 0;
  const heatVal = typeof assessment.heat?.score === 'number' ? assessment.heat.score : 0;
  const transportVal = typeof assessment.transport?.score === 'number' ? assessment.transport.score : 0;

  return (
    <div className={`gt-cadastral-seal-card ${isLoading ? 'is-loading-shimmer' : ''}`} ref={cardRef}>
      {/* Header */}
      <div className="gt-seal-header">
        <h3 className="gt-seal-title">{t.dashboard.overallScoreTitle}</h3>
        <span className="gt-seal-sub-type">
          {t.dashboard.propertyTypeLabel}: <strong>{propertyType}</strong>
        </span>
      </div>

      {/* Radial Hexagon Shield Dial */}
      <div className="gt-seal-dial-container">
        <svg className="gt-seal-dial-svg" viewBox="0 0 200 200">
          <defs>
            <linearGradient id="gtCadastralSealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="60%" stopColor={color} />
              <stop offset="100%" stopColor={color} />
            </linearGradient>
          </defs>

          {/* Track Hexagon */}
          <polygon
            points="100,14 178,56 178,144 100,186 22,144 22,56"
            fill="#faf8f4"
            stroke="#e4dfd5"
            strokeWidth="6"
            strokeLinejoin="round"
          />

          {/* Active Animated Score Hexagon */}
          <polygon
            ref={polygonRef}
            points="100,14 178,56 178,144 100,186 22,144 22,56"
            fill="transparent"
            stroke="url(#gtCadastralSealGrad)"
            strokeWidth="8"
            strokeLinejoin="round"
            strokeDasharray={520}
            strokeDashoffset={520}
            strokeLinecap="round"
          />
        </svg>

        {/* Center Numbers */}
        <div className="gt-seal-dial-center">
          <span className="gt-seal-score-number" style={{ color }}>
            {displayScore}
          </span>
          <span className="gt-seal-scale-denominator">/100</span>
          <span className="gt-seal-tier-label" style={{ color }}>
            {label}
          </span>
        </div>
      </div>

      {/* 4 Hazard Progress Spectrum Bars */}
      <div className="gt-seal-spectrum-list">
        <div className="gt-spectrum-row">
          <div className="gt-spectrum-info">
            <span className="gt-spectrum-name">{language === 'id' ? 'Banjir Fluvial & Rob' : 'Flood Inundation'}</span>
            <span className={`gt-spectrum-val gt-level-${assessment.flood.level}`}>{floodVal}/100</span>
          </div>
          <div className="gt-spectrum-track">
            <div className="gt-spectrum-bar" style={{ width: `${floodVal}%`, backgroundColor: assessment.flood.level === 'extreme' ? '#dc2626' : assessment.flood.level === 'high' ? '#ea580c' : assessment.flood.level === 'medium' ? '#d97706' : '#15803d' }} />
          </div>
        </div>

        <div className="gt-spectrum-row">
          <div className="gt-spectrum-info">
            <span className="gt-spectrum-name">{language === 'id' ? 'Seismik & Sesar Aktif' : 'Seismic & Fault'}</span>
            <span className={`gt-spectrum-val gt-level-${assessment.quake.level}`}>{quakeVal}/100</span>
          </div>
          <div className="gt-spectrum-track">
            <div className="gt-spectrum-bar" style={{ width: `${quakeVal}%`, backgroundColor: assessment.quake.level === 'extreme' ? '#dc2626' : assessment.quake.level === 'high' ? '#ea580c' : assessment.quake.level === 'medium' ? '#d97706' : '#15803d' }} />
          </div>
        </div>

        <div className="gt-spectrum-row">
          <div className="gt-spectrum-info">
            <span className="gt-spectrum-name">{language === 'id' ? 'Heat Stress & Iklim' : 'Heat Stress'}</span>
            <span className={`gt-spectrum-val gt-level-${assessment.heat.level}`}>{heatVal}/100</span>
          </div>
          <div className="gt-spectrum-track">
            <div className="gt-spectrum-bar" style={{ width: `${heatVal}%`, backgroundColor: assessment.heat.level === 'extreme' ? '#dc2626' : assessment.heat.level === 'high' ? '#ea580c' : assessment.heat.level === 'medium' ? '#d97706' : '#15803d' }} />
          </div>
        </div>

        <div className="gt-spectrum-row">
          <div className="gt-spectrum-info">
            <span className="gt-spectrum-name">{language === 'id' ? 'Aksesibilitas & Evakuasi' : 'Site Connectivity'}</span>
            <span className={`gt-spectrum-val gt-level-${assessment.transport.level === 'good' ? 'low' : assessment.transport.level === 'moderate' ? 'medium' : 'high'}`}>{transportVal}/100</span>
          </div>
          <div className="gt-spectrum-track">
            <div
              className="gt-spectrum-bar"
              style={{
                width: `${transportVal}%`,
                backgroundColor:
                  assessment.transport.level === 'critical'
                    ? '#dc2626'
                    : assessment.transport.level === 'isolated'
                    ? '#ea580c'
                    : assessment.transport.level === 'moderate'
                    ? '#d97706'
                    : '#15803d'
              }}
            />
          </div>
        </div>
      </div>

      {/* Primary Action Button */}
      <button
        type="button"
        className="gt-cadastral-download-cta"
        onClick={handleDownloadReportRequest}
      >
        <FileText size={16} />
        <span>{t.dashboard.downloadPdfBtn}</span>
        <ArrowRight size={15} className="gt-cta-arrow-icon" />
      </button>

      {/* Developer Audit Action */}
      <button
        type="button"
        style={{
          marginTop: '8px',
          width: '100%',
          padding: '8px',
          background: 'transparent',
          border: '1px dashed #94a3b8',
          borderRadius: '8px',
          color: '#64748b',
          fontSize: '0.78rem',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px'
        }}
        onClick={() => setIsAuditModalOpen(true)}
      >
        <ShieldCheck size={14} />
        <span>{language === 'id' ? 'Audit Provenance & Pipeline' : 'Audit Data Provenance'}</span>
      </button>
    </div>
  );
};
