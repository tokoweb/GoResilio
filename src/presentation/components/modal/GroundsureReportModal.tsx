import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAssessment } from '../../context/AssessmentContext';
import { MasterReportGenerator } from '../../../domain/services/MasterReportGenerator';
import {
  Printer,
  X,
  FileCheck2,
  MapPin,
  Building,
  User,
  ShieldCheck,
  Waves,
  Mountain,
  Flame,
  Navigation,
  Activity,
  Maximize2,
  Minimize2,
  Languages,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const SvgDonut: React.FC<{ score: number | null; color: string; size?: number }> = ({ score, color, size = 80 }) => {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const scoreVal = score !== null && !isNaN(score) ? Math.min(100, Math.max(0, score)) : null;
  const strokeDashoffset = scoreVal !== null ? circumference - (scoreVal / 100) * circumference : circumference;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <circle cx={size / 2} cy={size / 2} r={radius} stroke="#e2e8f0" strokeWidth={strokeWidth} fill="none" />
      {scoreVal !== null ? (
        <>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
          <text x={size / 2} y={size / 2 - 2} textAnchor="middle" fontSize={Math.round(size * 0.23)} fontWeight="800" fill="#0f172a">
            {scoreVal}
          </text>
          <text x={size / 2} y={size / 2 + 13} textAnchor="middle" fontSize={Math.round(size * 0.12)} fontWeight="600" fill="#64748b">
            /100
          </text>
        </>
      ) : (
        <text x={size / 2} y={size / 2 + 4} textAnchor="middle" fontSize={Math.round(size * 0.16)} fontWeight="700" fill="#94a3b8">
          N/A
        </text>
      )}
    </svg>
  );
};

export const GroundsureReportModal: React.FC = () => {
  const { language: contextLang } = useLanguage();
  const { isReportModalOpen, setIsReportModalOpen, assessment, propertyType, userPersona } = useAssessment();
  const [isFullWidth, setIsFullWidth] = useState(true);
  
  // Independent report language state, defaults to app context language ('id' or 'en')
  const [reportLang, setReportLang] = useState<'id' | 'en'>(contextLang === 'en' ? 'en' : 'id');
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // Sync if context language changes initially
  React.useEffect(() => {
    setReportLang(contextLang === 'en' ? 'en' : 'id');
  }, [contextLang]);

  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !isReportModalOpen || !assessment || typeof document === 'undefined') return null;

  const isEn = reportLang === 'en';

  const content = MasterReportGenerator.getSectionContent({
    assessment,
    lang: reportLang,
    propertyType,
    userPersona
  });

  const {
    cover,
    execSummary,
    propertyProfile,
    methodology,
    earthquakeSection,
    floodSection,
    heatSection,
    transportSection,
    riskComparison,
    actionPlan,
    closing
  } = content;

  const triggerPrint = () => {
    window.print();
  };

  return createPortal(
    <div className={`report-modal-overlay ${isFullWidth ? 'is-full-width' : ''}`} onClick={() => setIsReportModalOpen(false)}>
      <div className={`report-modal-inner ${isFullWidth ? 'is-full-width' : ''}`} onClick={(e) => e.stopPropagation()}>
        {/* Top Fixed Header Bar */}
        <div className="report-modal-header-bar">
          <div className="modal-header-brand-group">
            <div className="modal-header-icon-badge">
              <FileCheck2 size={20} />
            </div>
            <div>
              <h3 className="modal-header-main-title">
                {isEn ? 'GoResilio Property Risk Report' : 'Laporan Risiko Properti GoResilio'}
              </h3>
              <p className="modal-header-sub-text">
                {isEn
                  ? 'Official 11-Section Property Risk Assessment Dossier — Client Master Template'
                  : 'Dokumen Resmi Analisis Risiko Properti 11 Bagian — Master Template Klien'}
              </p>
            </div>
          </div>

          <div className="modal-header-action-group">
            {/* Bilingual Selector */}
            <div style={{ display: 'inline-flex', alignItems: 'center', background: '#f1f5f9', borderRadius: '8px', padding: '2px', border: '1px solid #cbd5e1' }}>
              <Languages size={15} style={{ margin: '0 6px', color: '#64748b' }} />
              <button
                type="button"
                onClick={() => setReportLang('id')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: reportLang === 'id' ? '#0284c7' : 'transparent',
                  color: reportLang === 'id' ? '#ffffff' : '#475569',
                  transition: 'all 0.15s ease'
                }}
              >
                ID
              </button>
              <button
                type="button"
                onClick={() => setReportLang('en')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: reportLang === 'en' ? '#0284c7' : 'transparent',
                  color: reportLang === 'en' ? '#ffffff' : '#475569',
                  transition: 'all 0.15s ease'
                }}
              >
                EN
              </button>
            </div>

            {/* Fit / Full screen */}
            <button
              type="button"
              className="modal-header-print-btn"
              onClick={() => setIsFullWidth(!isFullWidth)}
              style={{ background: isFullWidth ? '#fff7ed' : '#f8fafc', color: isFullWidth ? '#c2410c' : '#334155', border: isFullWidth ? '1px solid #fed7aa' : '1px solid #cbd5e1' }}
              title={isFullWidth ? (isEn ? 'Standard View' : 'Tampilan Standar') : (isEn ? 'Full Screen' : 'Layar Penuh')}
            >
              {isFullWidth ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              <span>{isFullWidth ? (isEn ? 'Fit Screen' : 'Layar Pas') : (isEn ? 'Full Width' : 'Layar Penuh')}</span>
            </button>

            {/* Print Button */}
            <button
              type="button"
              className="modal-header-print-btn"
              onClick={triggerPrint}
              title={isEn ? 'Print or Save as PDF' : 'Cetak atau Simpan PDF'}
            >
              <Printer size={16} />
              <span>{isEn ? 'Print / Save PDF' : 'Cetak / Unduh PDF'}</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              className="modal-header-close-btn"
              onClick={() => setIsReportModalOpen(false)}
              title={isEn ? 'Close' : 'Tutup'}
              aria-label={isEn ? 'Close' : 'Tutup'}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Report Body */}
        <div className="report-modal-scroll-body">
          <div className="groundsure-pdf-document" id="printableReportArea">

            {/* =========================================================================
                HALAMAN 1 — COVER
                ========================================================================= */}
            <div className="gs-pdf-page" id="report-page-1">
              <div className="gs-header-section">
                <div className="gs-brand-group">
                  <img src="/assets/logo.svg" alt="GoResilio Logo" className="gs-logo-icon" />
                  <div>
                    <div className="gs-title-main">GoResilio</div>
                    <div className="gs-subtitle-tag">{cover.tagline}</div>
                  </div>
                </div>
                <div className="gs-meta-info-box">
                  <strong>{isEn ? 'Reference No:' : 'No. Referensi:'}</strong> {cover.referenceNumber}<br />
                  <strong>{isEn ? 'Date of Issue:' : 'Tanggal Analisis:'}</strong> {cover.date}<br />
                  <strong>{isEn ? 'GPS Coordinates:' : 'Koordinat GPS:'}</strong> {cover.coordinates}
                </div>
              </div>

              <div className="gs-page-badge-title">{isEn ? 'PAGE 1 — COVER' : 'HALAMAN 1 — COVER'}</div>

              <div style={{ textAlign: 'center', padding: '40px 16px 30px' }}>
                <span className="gs-table-badge" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.85rem', padding: '6px 14px', marginBottom: '14px' }}>
                  {cover.propertyType}
                </span>
                <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', margin: '14px 0 6px', lineHeight: 1.3 }}>
                  {cover.title}
                </h1>
                <p style={{ fontSize: '1.05rem', color: '#c2410c', fontWeight: 700, margin: '0 0 20px' }}>
                  “{cover.tagline}”
                </p>
                <div style={{ maxWidth: '640px', margin: '0 auto', background: '#faf8f4', border: '1px solid #e7e3da', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.92rem', color: '#1e293b', fontWeight: 600 }}>
                    <MapPin size={18} color="#c2410c" />
                    <span>{cover.locationAddress}</span>
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#64748b' }}>
                    {isEn ? 'Coordinates' : 'Koordinat'}: {cover.coordinates} · {cover.propertyType}
                  </div>
                  {cover.ownerName && (
                    <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#475569', borderTop: '1px solid #eae6dd', paddingTop: '8px' }}>
                      <strong>{isEn ? 'Owner / Client:' : 'Pemilik / Pengguna:'}</strong> {cover.ownerName}
                    </div>
                  )}
                </div>
              </div>

              <div className="gs-pdf-footer-note">
                {isEn ? 'Page 1 of 11 · GoResilio Property Risk Assessment Report' : 'Halaman 1 dari 11 · Laporan Risiko Properti GoResilio'}
              </div>
            </div>

            {/* =========================================================================
                HALAMAN 2 — EXECUTIVE SUMMARY
                ========================================================================= */}
            <div className="gs-pdf-page" id="report-page-2">
              <div className="gs-page-badge-title">{isEn ? 'PAGE 2 — EXECUTIVE SUMMARY' : 'HALAMAN 2 — RINGKASAN EKSEKUTIF'}</div>
              <h3 className="gs-section-heading">
                <ShieldCheck size={16} />
                <span>{execSummary.title}</span>
              </h3>

              <div className="gs-opinion-banner-box">
                <div className="gs-opinion-score-col" style={{ paddingRight: '16px', borderRight: '1px solid #e7e3da' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                    {isEn ? 'Overall Risk Level' : 'Tingkat Risiko'}
                  </div>
                  <SvgDonut score={assessment.overallScore} color={execSummary.overallColor} size={90} />
                  <span className="gs-status-badge" style={{ marginTop: '6px', background: `${execSummary.overallColor}18`, color: execSummary.overallColor }}>
                    {execSummary.overallLevelText}
                  </span>
                </div>
                <div className="gs-opinion-text-col">
                  <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#c2410c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {isEn ? 'Primary Hazard Driver' : 'Risiko Utama Lokasi'}
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '2px 0 8px' }}>
                    {execSummary.dominantHazard}
                  </div>
                  <p style={{ fontSize: '0.84rem', color: '#334155', lineHeight: 1.55 }}>
                    {execSummary.generalOverview}
                  </p>
                </div>
              </div>

              {/* 3 Donut Gauges for Hazards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', margin: '14px 0' }}>
                {execSummary.hazardDonuts.map(donut => (
                  <div key={donut.id} className="gs-cover-meta-item" style={{ alignItems: 'center', textAlign: 'center', padding: '14px 8px' }}>
                    <span className="gs-meta-kicker">{donut.label}</span>
                    <div style={{ margin: '8px 0' }}>
                      <SvgDonut score={donut.score} color={donut.color} size={70} />
                    </div>
                    <span className="gs-table-badge" style={{ background: `${donut.color}18`, color: donut.color, fontSize: '0.72rem' }}>
                      {donut.level}
                    </span>
                  </div>
                ))}
              </div>

              {/* 3 Main Recommendations */}
              <div className="gs-info-box-note" style={{ marginTop: '14px' }}>
                <strong style={{ display: 'block', marginBottom: '6px', color: '#1e293b' }}>
                  {isEn ? '3 Primary Strategic Recommendations:' : '3 Rekomendasi Utama:'}
                </strong>
                <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '0.8rem', color: '#334155', lineHeight: 1.6 }}>
                  {execSummary.topRecommendations.map((rec, i) => (
                    <li key={i} style={{ marginBottom: '4px' }}>{rec}</li>
                  ))}
                </ol>
              </div>

              <div className="gs-pdf-footer-note">
                {isEn ? 'Page 2 of 11 · GoResilio Property Risk Assessment Report' : 'Halaman 2 dari 11 · Laporan Risiko Properti GoResilio'}
              </div>
            </div>

            {/* =========================================================================
                HALAMAN 3 — PROFIL PROPERTI
                ========================================================================= */}
            <div className="gs-pdf-page" id="report-page-3">
              <div className="gs-page-badge-title">{isEn ? 'PAGE 3 — PROPERTY PROFILE' : 'HALAMAN 3 — PROFIL PROPERTI'}</div>
              <h3 className="gs-section-heading">
                <Building size={16} />
                <span>{propertyProfile.title}</span>
              </h3>

              <p className="gs-page-intro">{propertyProfile.description}</p>

              <table className="gs-structured-table">
                <thead>
                  <tr>
                    <th style={{ width: '35%' }}>{isEn ? 'Parameter' : 'Parameter Profil'}</th>
                    <th style={{ width: '65%' }}>{isEn ? 'Site Observation' : 'Kondisi Faktual'}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>{isEn ? 'City / Regency' : 'Kota / Kabupaten'}</strong></td>
                    <td>{propertyProfile.cityRegency}</td>
                  </tr>
                  <tr>
                    <td><strong>{isEn ? 'Area Characteristic' : 'Karakteristik Area'}</strong></td>
                    <td>{propertyProfile.areaCharacteristic}</td>
                  </tr>
                  <tr>
                    <td><strong>{isEn ? 'Building Asset Type' : 'Jenis Bangunan'}</strong></td>
                    <td>{propertyProfile.buildingType}</td>
                  </tr>
                  <tr>
                    <td><strong>{isEn ? 'Floor Count' : 'Jumlah Lantai'}</strong></td>
                    <td>{propertyProfile.floorCount}</td>
                  </tr>
                  <tr>
                    <td><strong>{isEn ? 'Estimated Building Age' : 'Perkiraan Usia Bangunan'}</strong></td>
                    <td>{propertyProfile.buildingAge}</td>
                  </tr>
                  <tr>
                    <td><strong>{isEn ? 'Distance to Waterway' : 'Jarak ke Sungai / Badan Air'}</strong></td>
                    <td>{propertyProfile.distanceToWaterway}</td>
                  </tr>
                  <tr>
                    <td><strong>{isEn ? 'Building / Population Density' : 'Kepadatan Bangunan'}</strong></td>
                    <td>{propertyProfile.buildingDensity}</td>
                  </tr>
                  <tr>
                    <td><strong>{isEn ? 'Site Access / Connectivity' : 'Aksesibilitas'}</strong></td>
                    <td>{propertyProfile.accessibility}</td>
                  </tr>
                </tbody>
              </table>

              <div className="gs-info-box-note">
                <strong>{isEn ? 'Site Context Note:' : 'Catatan Konteks Tapak:'}</strong> {isEn
                  ? 'All observations reflect available open geospatial datasets (Copernicus DEM, WorldPop, OSM). Structural characteristics are pending licensed on-site engineering verification.'
                  : 'Seluruh profil disusun berdasarkan data geospasial terbuka (Copernicus DEM, WorldPop, OSM). Parameter struktural gedung memerlukan verifikasi langsung oleh tenaga ahli berlisensi.'}
              </div>

              <div className="gs-pdf-footer-note">
                {isEn ? 'Page 3 of 11 · GoResilio Property Risk Assessment Report' : 'Halaman 3 dari 11 · Laporan Risiko Properti GoResilio'}
              </div>
            </div>

            {/* =========================================================================
                HALAMAN 4 — PENJELASAN PENILAIAN
                ========================================================================= */}
            <div className="gs-pdf-page" id="report-page-4">
              <div className="gs-page-badge-title">{isEn ? 'PAGE 4 — ASSESSMENT METHODOLOGY' : 'HALAMAN 4 — PENJELASAN PENILAIAN'}</div>
              <h3 className="gs-section-heading">
                <Activity size={16} />
                <span>{methodology.title}</span>
              </h3>

              <p className="gs-page-intro">{methodology.intro}</p>

              <table className="gs-structured-table">
                <thead>
                  <tr>
                    <th style={{ width: '28%' }}>{isEn ? 'Aspect' : 'Aspek'}</th>
                    <th style={{ width: '72%' }}>{isEn ? 'Explanation' : 'Penjelasan'}</th>
                  </tr>
                </thead>
                <tbody>
                  {methodology.tableRows.map((row, i) => (
                    <tr key={i}>
                      <td><strong>{row.aspect}</strong></td>
                      <td>{row.explanation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="gs-opinion-banner-box" style={{ marginTop: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <ShieldCheck size={28} color="#0284c7" />
                  <div>
                    <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>
                      {isEn ? 'Simple Evaluation Principle:' : 'Prinsip Penilaian Sederhana:'}
                    </strong>
                    <p style={{ fontSize: '0.84rem', color: '#475569', margin: '3px 0 0' }}>
                      “{methodology.simpleSummary}”
                    </p>
                  </div>
                </div>
              </div>

              <div className="gs-pdf-footer-note">
                {isEn ? 'Page 4 of 11 · GoResilio Property Risk Assessment Report' : 'Halaman 4 dari 11 · Laporan Risiko Properti GoResilio'}
              </div>
            </div>

            {/* =========================================================================
                HALAMAN 5 — RISIKO GEMPA BUMI
                ========================================================================= */}
            <div className="gs-pdf-page" id="report-page-5">
              <div className="gs-page-badge-title">{isEn ? 'PAGE 5 — EARTHQUAKE RISK' : 'HALAMAN 5 — RISIKO GEMPA BUMI'}</div>
              <h3 className="gs-section-heading">
                <Mountain size={16} />
                <span>{earthquakeSection.title}</span>
              </h3>

              <div className="gs-opinion-banner-box" style={{ marginBottom: '14px' }}>
                <div className="gs-opinion-score-col" style={{ paddingRight: '16px', borderRight: '1px solid #e7e3da' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    {isEn ? 'Seismic Score' : 'Skor Gempa'}
                  </span>
                  <SvgDonut score={earthquakeSection.score} color={earthquakeSection.scoreColor} size={75} />
                  <span className="gs-status-badge" style={{ marginTop: '4px', background: `${earthquakeSection.scoreColor}18`, color: earthquakeSection.scoreColor }}>
                    {earthquakeSection.levelText}
                  </span>
                </div>
                <div className="gs-opinion-text-col">
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                    {isEn ? 'Observed Regional Seismic Evidence (USGS FDSN / BMKG Catalog):' : 'Bukti Kegempaan Regional (Katalog USGS / BMKG):'}
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: '#334155', lineHeight: 1.6 }}>
                    {earthquakeSection.historicalEvidence.map((e, idx) => (
                      <li key={idx}><strong>{e.label}:</strong> {e.value}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.5, margin: '10px 0' }}>
                <p><strong>{isEn ? 'Frequency:' : 'Frekuensi:'}</strong> {earthquakeSection.frequency}</p>
                <p style={{ marginTop: '6px' }}>
                  <strong>{isEn ? 'Potential Shaking Impact:' : 'Tingkat Dampak yang Mungkin Terjadi:'}</strong> {earthquakeSection.impactInterpretation}
                </p>
              </div>

              <div className="gs-info-box-note" style={{ marginTop: '12px' }}>
                <strong style={{ display: 'block', marginBottom: '4px', color: '#0f172a' }}>
                  {isEn ? 'Mitigation Action Directives:' : 'Rekomendasi Tindakan:'}
                </strong>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: '#334155', lineHeight: 1.6 }}>
                  {earthquakeSection.recommendations.map((r, idx) => (
                    <li key={idx}><strong>[{r.priority}]</strong> {r.text}</li>
                  ))}
                </ul>
              </div>

              <div className="gs-opinion-banner-box" style={{ marginTop: '12px', padding: '10px 14px' }}>
                <p style={{ fontSize: '0.82rem', color: '#475569', margin: 0 }}>
                  <strong>{isEn ? 'Conclusion:' : 'Kesimpulan:'}</strong> {earthquakeSection.conclusion}
                </p>
              </div>

              <div className="gs-pdf-footer-note">
                {isEn ? 'Page 5 of 11 · GoResilio Property Risk Assessment Report' : 'Halaman 5 dari 11 · Laporan Risiko Properti GoResilio'}
              </div>
            </div>

            {/* =========================================================================
                HALAMAN 6 — RISIKO BANJIR
                ========================================================================= */}
            <div className="gs-pdf-page" id="report-page-6">
              <div className="gs-page-badge-title">{isEn ? 'PAGE 6 — FLOOD RISK' : 'HALAMAN 6 — RISIKO BANJIR'}</div>
              <h3 className="gs-section-heading">
                <Waves size={16} />
                <span>{floodSection.title}</span>
              </h3>

              <div className="gs-opinion-banner-box" style={{ marginBottom: '14px' }}>
                <div className="gs-opinion-score-col" style={{ paddingRight: '16px', borderRight: '1px solid #e7e3da' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    {isEn ? 'Flood Score' : 'Skor Banjir'}
                  </span>
                  <SvgDonut score={floodSection.score} color={floodSection.scoreColor} size={75} />
                  <span className="gs-status-badge" style={{ marginTop: '4px', background: `${floodSection.scoreColor}18`, color: floodSection.scoreColor }}>
                    {floodSection.levelText}
                  </span>
                </div>
                <div className="gs-opinion-text-col">
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                    {isEn ? 'Hydrological & Terrain Indicators (Copernicus DEM & ERA5):' : 'Indikator Hidrologi & Topografi (Copernicus DEM & ERA5):'}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', fontSize: '0.78rem' }}>
                    {floodSection.evidenceItems.map((e, idx) => (
                      <div key={idx} style={{ background: '#ffffff', padding: '6px 8px', borderRadius: '5px', border: '1px solid #eae6dd' }}>
                        <div style={{ color: '#64748b', fontSize: '0.68rem', textTransform: 'uppercase' }}>{e.label}</div>
                        <strong style={{ color: '#1e293b' }}>{e.value}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.5, margin: '10px 0' }}>
                <p><strong>{isEn ? 'Seasonality & Runoff:' : 'Frekuensi & Musim:'}</strong> {floodSection.frequency}</p>
                <p style={{ marginTop: '6px' }}>
                  <strong>{isEn ? 'Potential Flood Impact:' : 'Tingkat Dampak yang Mungkin Terjadi:'}</strong> {floodSection.impactInterpretation}
                </p>
              </div>

              <div className="gs-info-box-note" style={{ marginTop: '12px' }}>
                <strong style={{ display: 'block', marginBottom: '4px', color: '#0f172a' }}>
                  {isEn ? 'Action Recommendations:' : 'Rekomendasi Tindakan:'}
                </strong>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: '#334155', lineHeight: 1.6 }}>
                  {floodSection.recommendations.map((r, idx) => (
                    <li key={idx}><strong>[{r.priority}]</strong> {r.text}</li>
                  ))}
                </ul>
              </div>

              <div className="gs-opinion-banner-box" style={{ marginTop: '12px', padding: '10px 14px' }}>
                <p style={{ fontSize: '0.82rem', color: '#475569', margin: 0 }}>
                  <strong>{isEn ? 'Conclusion:' : 'Kesimpulan:'}</strong> {floodSection.conclusion}
                </p>
              </div>

              <div className="gs-pdf-footer-note">
                {isEn ? 'Page 6 of 11 · GoResilio Property Risk Assessment Report' : 'Halaman 6 dari 11 · Laporan Risiko Properti GoResilio'}
              </div>
            </div>

            {/* =========================================================================
                HALAMAN 7 — RISIKO HEAT STRESS
                ========================================================================= */}
            <div className="gs-pdf-page" id="report-page-7">
              <div className="gs-page-badge-title">{isEn ? 'PAGE 7 — HEAT STRESS RISK' : 'HALAMAN 7 — RISIKO HEAT STRESS'}</div>
              <h3 className="gs-section-heading">
                <Flame size={16} />
                <span>{heatSection.title}</span>
              </h3>

              <div className="gs-opinion-banner-box" style={{ marginBottom: '14px' }}>
                <div className="gs-opinion-score-col" style={{ paddingRight: '16px', borderRight: '1px solid #e7e3da' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    {isEn ? 'Heat Score' : 'Skor Panas'}
                  </span>
                  <SvgDonut score={heatSection.score} color={heatSection.scoreColor} size={75} />
                  <span className="gs-status-badge" style={{ marginTop: '4px', background: `${heatSection.scoreColor}18`, color: heatSection.scoreColor }}>
                    {heatSection.levelText}
                  </span>
                </div>
                <div className="gs-opinion-text-col">
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                    {isEn ? 'Atmospheric Thermal Metrics (Open-Meteo ERA5 & CMIP6):' : 'Indikator Termal Atmosfer (Open-Meteo ERA5 & CMIP6):'}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', fontSize: '0.78rem' }}>
                    {heatSection.evidenceItems.map((e, idx) => (
                      <div key={idx} style={{ background: '#ffffff', padding: '6px 8px', borderRadius: '5px', border: '1px solid #eae6dd' }}>
                        <div style={{ color: '#64748b', fontSize: '0.68rem', textTransform: 'uppercase' }}>{e.label}</div>
                        <strong style={{ color: '#1e293b' }}>{e.value}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.5, margin: '10px 0' }}>
                <p><strong>{isEn ? 'Seasonal Trend:' : 'Tren & Frekuensi Musiman:'}</strong> {heatSection.frequency}</p>
                <p style={{ marginTop: '6px' }}>
                  <strong>{isEn ? 'Potential Thermal Impact:' : 'Tingkat Dampak yang Mungkin Terjadi:'}</strong> {heatSection.impactInterpretation}
                </p>
              </div>

              <div className="gs-info-box-note" style={{ marginTop: '12px' }}>
                <strong style={{ display: 'block', marginBottom: '4px', color: '#0f172a' }}>
                  {isEn ? 'Action Recommendations:' : 'Rekomendasi Tindakan:'}
                </strong>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: '#334155', lineHeight: 1.6 }}>
                  {heatSection.recommendations.map((r, idx) => (
                    <li key={idx}><strong>[{r.priority}]</strong> {r.text}</li>
                  ))}
                </ul>
              </div>

              <div className="gs-opinion-banner-box" style={{ marginTop: '12px', padding: '10px 14px' }}>
                <p style={{ fontSize: '0.82rem', color: '#475569', margin: 0 }}>
                  <strong>{isEn ? 'Conclusion:' : 'Kesimpulan:'}</strong> {heatSection.conclusion}
                </p>
              </div>

              <div className="gs-pdf-footer-note">
                {isEn ? 'Page 7 of 11 · GoResilio Property Risk Assessment Report' : 'Halaman 7 dari 11 · Laporan Risiko Properti GoResilio'}
              </div>
            </div>

            {/* =========================================================================
                HALAMAN 8 — AKSESIBILITAS & TRANSPORTASI
                ========================================================================= */}
            <div className="gs-pdf-page" id="report-page-8">
              <div className="gs-page-badge-title">{isEn ? 'PAGE 8 — ACCESSIBILITY & TRANSPORT' : 'HALAMAN 8 — AKSESIBILITAS DAN TRANSPORTASI'}</div>
              <h3 className="gs-section-heading">
                <Navigation size={16} />
                <span>{transportSection.title}</span>
              </h3>

              <p className="gs-page-intro">{transportSection.interpretation}</p>

              <table className="gs-structured-table">
                <thead>
                  <tr>
                    <th>{isEn ? 'Facility Type' : 'Jenis Fasilitas'}</th>
                    <th>{isEn ? 'Nearest Identification' : 'Identifikasi Terdekat'}</th>
                    <th>{isEn ? 'Distance' : 'Jarak'}</th>
                    <th>{isEn ? 'Estimated Travel Distance' : 'Estimasi Jarak Tempuh'}</th>
                    <th>{isEn ? 'Category' : 'Kategori'}</th>
                  </tr>
                </thead>
                <tbody>
                  {transportSection.facilities.map((f, idx) => (
                    <tr key={idx}>
                      <td><strong>{f.facility}</strong></td>
                      <td>{f.name}</td>
                      <td>{f.distance}</td>
                      <td>{f.travelTime}</td>
                      <td><span className="gs-table-badge" style={{ background: '#f1f5f9', color: '#334155' }}>{f.category}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="gs-info-box-note">
                <p style={{ margin: '0 0 6px' }}>
                  <strong>{isEn ? 'Disaster Access Risk Note:' : 'Catatan Risiko Akses Darurat:'}</strong> {transportSection.riskNote}
                </p>
                <p style={{ margin: 0 }}>
                  <strong>{isEn ? 'Evacuation Route Guidance:' : 'Rekomendasi Rute Evakuasi:'}</strong> {transportSection.routeRecommendation}
                </p>
              </div>

              <div className="gs-pdf-footer-note">
                {isEn ? 'Page 8 of 11 · GoResilio Property Risk Assessment Report' : 'Halaman 8 dari 11 · Laporan Risiko Properti GoResilio'}
              </div>
            </div>

            {/* =========================================================================
                HALAMAN 9 — PERBANDINGAN RISIKO
                ========================================================================= */}
            <div className="gs-pdf-page" id="report-page-9">
              <div className="gs-page-badge-title">{isEn ? 'PAGE 9 — RISK COMPARISON' : 'HALAMAN 9 — PERBANDINGAN RISIKO'}</div>
              <h3 className="gs-section-heading">
                <ShieldCheck size={16} />
                <span>{riskComparison.title}</span>
              </h3>

              <p className="gs-page-intro">
                {isEn
                  ? 'Comparative ranking across primary natural physical perils (transportation is excluded as a physical hazard):'
                  : 'Perbandingan komparatif antarpilar bahaya fisik alami (transportasi tidak diperhitungkan sebagai bahaya fisik):'}
              </p>

              <table className="gs-structured-table">
                <thead>
                  <tr>
                    <th style={{ width: '32%' }}>{isEn ? 'Hazard Type' : 'Jenis Risiko'}</th>
                    <th style={{ width: '22%' }}>{isEn ? 'Screening Score' : 'Skor (0–100)'}</th>
                    <th style={{ width: '24%' }}>{isEn ? 'Rating Tier' : 'Tingkat'}</th>
                    <th style={{ width: '22%' }}>{isEn ? 'Data Reliability' : 'Keandalan Data'}</th>
                  </tr>
                </thead>
                <tbody>
                  {riskComparison.tableRows.map((r, idx) => (
                    <tr key={idx}>
                      <td><strong>{r.hazard}</strong></td>
                      <td><strong style={{ color: r.color, fontSize: '0.95rem' }}>{r.score}</strong></td>
                      <td>
                        <span className="gs-table-badge" style={{ background: `${r.color}18`, color: r.color }}>
                          {r.level}
                        </span>
                      </td>
                      <td>{r.reliability}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="gs-opinion-banner-box" style={{ marginTop: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <AlertTriangle size={24} color="#0284c7" />
                  <div>
                    <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>
                      {isEn ? 'Dominant Hazard Insight:' : 'Kesimpulan Risiko Dominan:'}
                    </strong>
                    <p style={{ fontSize: '0.84rem', color: '#475569', margin: '3px 0 0' }}>
                      {riskComparison.dominantInsight}
                    </p>
                  </div>
                </div>
              </div>

              <div className="gs-pdf-footer-note">
                {isEn ? 'Page 9 of 11 · GoResilio Property Risk Assessment Report' : 'Halaman 9 dari 11 · Laporan Risiko Properti GoResilio'}
              </div>
            </div>

            {/* =========================================================================
                HALAMAN 10 — RENCANA TINDAKAN (MITIGASI & ADAPTASI)
                ========================================================================= */}
            <div className="gs-pdf-page" id="report-page-10">
              <div className="gs-page-badge-title">{isEn ? 'PAGE 10 — ACTION PLAN' : 'HALAMAN 10 — RENCANA TINDAKAN'}</div>
              <h3 className="gs-section-heading">
                <CheckCircle2 size={16} />
                <span>{actionPlan.title}</span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '14px 0' }}>
                <div className="gs-rx-pdf-item" style={{ border: '1px solid #fecaca', borderRadius: '8px', background: '#fef2f2', padding: '12px 14px' }}>
                  <strong style={{ color: '#dc2626', fontSize: '0.88rem' }}>● {actionPlan.priority1.heading}</strong>
                  <ul style={{ margin: '6px 0 0', paddingLeft: '20px', fontSize: '0.8rem', color: '#334155', lineHeight: 1.6 }}>
                    {actionPlan.priority1.items.map((item, i) => (
                      <li key={i} style={{ marginBottom: '4px' }}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="gs-rx-pdf-item" style={{ border: '1px solid #fde68a', borderRadius: '8px', background: '#fffbeb', padding: '12px 14px' }}>
                  <strong style={{ color: '#d97706', fontSize: '0.88rem' }}>● {actionPlan.priority2.heading}</strong>
                  <ul style={{ margin: '6px 0 0', paddingLeft: '20px', fontSize: '0.8rem', color: '#334155', lineHeight: 1.6 }}>
                    {actionPlan.priority2.items.map((item, i) => (
                      <li key={i} style={{ marginBottom: '4px' }}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="gs-rx-pdf-item" style={{ border: '1px solid #bbf7d0', borderRadius: '8px', background: '#f0fdf4', padding: '12px 14px' }}>
                  <strong style={{ color: '#16a34a', fontSize: '0.88rem' }}>● {actionPlan.priority3.heading}</strong>
                  <ul style={{ margin: '6px 0 0', paddingLeft: '20px', fontSize: '0.8rem', color: '#334155', lineHeight: 1.6 }}>
                    {actionPlan.priority3.items.map((item, i) => (
                      <li key={i} style={{ marginBottom: '4px' }}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="gs-info-box-note" style={{ fontStyle: 'italic', background: '#faf8f4' }}>
                <strong>{actionPlan.note}</strong>
              </div>

              <div className="gs-pdf-footer-note">
                {isEn ? 'Page 10 of 11 · GoResilio Property Risk Assessment Report' : 'Halaman 10 dari 11 · Laporan Risiko Properti GoResilio'}
              </div>
            </div>

            {/* =========================================================================
                HALAMAN 11 — PENUTUP
                ========================================================================= */}
            <div className="gs-pdf-page" id="report-page-11">
              <div className="gs-page-badge-title">{isEn ? 'PAGE 11 — CLOSING' : 'HALAMAN 11 — PENUTUP'}</div>
              <h3 className="gs-section-heading">
                <ShieldCheck size={16} />
                <span>{closing.title}</span>
              </h3>

              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '0.94rem', fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>
                  {isEn ? 'Executive Conclusion' : 'Kesimpulan'}
                </h4>
                <p style={{ fontSize: '0.84rem', color: '#334155', lineHeight: 1.6, margin: 0 }}>
                  {closing.conclusion}
                </p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '0.94rem', fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>
                  {isEn ? 'Recommended Next Steps' : 'Langkah Selanjutnya'}
                </h4>
                <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '0.82rem', color: '#334155', lineHeight: 1.65 }}>
                  {closing.nextSteps.map((step, i) => (
                    <li key={i} style={{ marginBottom: '4px' }}>{step}</li>
                  ))}
                </ol>
              </div>

              {/* Glossary Section (Requirement 20) */}
              <div style={{ margin: '14px 0', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 14px' }}>
                <h4 style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={14} style={{ color: '#0284c7' }} />
                  <span>{isEn ? 'Key Technical Terminology Glossary' : 'Glosarium Istilah Teknis Utama'}</span>
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', fontSize: '0.74rem', color: '#334155', lineHeight: 1.45 }}>
                  <div><strong>dpl / MSL:</strong> {isEn ? 'Meters above Mean Sea Level, vertical site elevation.' : 'Meter di atas permukaan laut, elevasi vertikal tapak.'}</div>
                  <div><strong>PGA:</strong> {isEn ? 'Peak Ground Acceleration (g), maximum seismic ground shaking.' : 'Percepatan tanah puncak (g), intensitas guncangan gempa.'}</div>
                  <div><strong>DAS:</strong> {isEn ? 'River Watershed / Drainage Basin catchment boundary.' : 'Daerah Aliran Sungai, batas tangkapan air limpasan hujan.'}</div>
                  <div><strong>KDH:</strong> {isEn ? 'Green Space Ratio (%), permeable vegetative canopy.' : 'Koefisien Dasar Hijau (%), persentase area terbuka bervegetasi.'}</div>
                  <div><strong>Urban Heat Island:</strong> {isEn ? 'Thermal phenomenon where built structures trap heat.' : 'Fenomena termal area terbangun menyerap dan memerangkap panas.'}</div>
                  <div><strong>Buffer:</strong> {isEn ? 'Radial spatial search radius for environmental screening.' : 'Radius jarak penapisan geospasial radial dari tapak properti.'}</div>
                </div>
              </div>

              {/* Official Verbatim Disclaimer */}
              <div className="gs-info-box-note" style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '14px 16px', marginTop: '16px' }}>
                <strong style={{ display: 'block', color: '#991b1b', fontSize: '0.84rem', marginBottom: '4px' }}>
                  {isEn ? 'Legal Notice & Limitations (Disclaimer):' : 'Pemberitahuan Hukum & Batasan (Disclaimer):'}
                </strong>
                <p style={{ fontSize: '0.82rem', color: '#7f1d1d', margin: 0, lineHeight: 1.5 }}>
                  “{closing.disclaimer}”
                </p>
              </div>

              <div className="gs-pdf-footer-note" style={{ marginTop: '24px' }}>
                {isEn ? 'Page 11 of 11 · GoResilio Property Risk Assessment Report (End of Document)' : 'Halaman 11 dari 11 · Laporan Risiko Properti GoResilio (Akhir Dokumen)'}
              </div>
            </div>

            {/* Optional Technical Data Drawer (Screen Only) */}
            <div className="no-print" style={{ marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <button
                type="button"
                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'none',
                  border: 'none',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  color: '#0284c7',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                <span>{isEn ? 'View Data & Methodology Details' : 'Lihat Detail Data & Metodologi'}</span>
                {showTechnicalDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showTechnicalDetails && (
                <div style={{ marginTop: '14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', fontSize: '0.78rem', color: '#475569' }}>
                  <p style={{ margin: '0 0 8px' }}>
                    <strong>{isEn ? 'Primary Geospatial Data Providers:' : 'Penyedia Data Geospasial Utama:'}</strong> Copernicus DEM 90m (Open-Meteo), Badan Nasional Penanggulangan Bencana (BNPB inaRISK), USGS FDSN Earthquake Catalog, Open-Meteo ERA5-Seamless Reanalysis & CMIP6 Climate Projections, OpenStreetMap Contributors & OSRM Engine.
                  </p>
                  <p style={{ margin: '0 0 8px' }}>
                    <strong>{isEn ? 'Institutional Backing:' : 'Dukungan Riset:'}</strong> Resilience Development Initiative (RDI) & BGP Consultants.
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong>{isEn ? 'Data Completeness Score:' : 'Skor Kelengkapan Data:'}</strong> {assessment.dataCompletenessScorePct}% ({isEn ? 'Verified live multi-agency feeds' : 'Pemberi data resmi multi-lembaga terverifikasi'}).
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Modal Bottom Fixed Actions Bar */}
        <div className="modal-actions-bar-flex">
          <button type="button" className="btn-print-download" onClick={triggerPrint}>
            <Printer size={17} />
            <span>{isEn ? 'Print / Download PDF (11 Pages)' : 'Cetak / Unduh PDF (11 Halaman)'}</span>
          </button>
          <button
            type="button"
            className="btn-pricing-action"
            style={{ width: 'auto', padding: '12px 26px', background: '#f4f1ea', border: '1px solid #e0dbcf' }}
            onClick={() => setIsReportModalOpen(false)}
          >
            {isEn ? 'Close' : 'Tutup'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default GroundsureReportModal;
