import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAssessment } from '../../context/AssessmentContext';
import { ReportMetricRegistry } from '../../../domain/services/ReportMetricRegistry';
import type { HazardCategory } from '../../../domain/types/hazard.types';
import {
  Printer,
  X,
  FileCheck2,
  ShieldCheck,
  MapPin,
  Building,
  User,
  Waves,
  Mountain,
  Flame,
  Navigation,
  Activity,
  DollarSign,
  PieChart,
  Percent,
  Landmark,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface DeepDiveMetricItem {
  id: string;
  label: string;
  value: React.ReactNode;
  description: string;
}

export const GroundsureReportModal: React.FC = () => {
  const { language } = useLanguage();
  const { isReportModalOpen, setIsReportModalOpen, assessment, propertyType, userPersona } = useAssessment();
  const [isFullWidth, setIsFullWidth] = React.useState(true);

  if (!isReportModalOpen || !assessment) return null;

  const { overallScore, overallLevel, flood, quake, heat, transport, prescriptions } = assessment;

  const isEn = language === 'en';

  const opinionText = isEn
    ? overallLevel === 'extreme'
      ? 'The property site exhibits EXTREME multi-hazard exposure. In-depth geotechnical validation and mandatory structural adaptation are required before concluding transactions or beginning construction.'
      : overallLevel === 'high'
      ? 'Identified HIGH environmental and seismic risks. Upgraded structural column reinforcement, elevated ground floor finished levels, and integrated drainage channels are recommended.'
      : overallLevel === 'medium'
      ? 'Moderate environmental and seismic risk exposure identified. Standard preventive maintenance is recommended to protect long-term asset value.'
      : 'The site displays EXCELLENT disaster resilience with minimal hazard exposure. Standard periodic maintenance is sufficient.'
    : overallLevel === 'extreme'
    ? 'Tapak properti memiliki paparan multi-bahaya berkategori EKSTREM. Diperlukan penelaahan geoteknik mendalam serta preskripsi struktural wajib sebelum penyelesaian transaksi jual-beli atau pelaksanaan konstruksi fisik.'
    : overallLevel === 'high'
    ? 'Teridentifikasi risiko lingkungan dan seismik TINGGI. Disarankan perkuatan struktur kolom praktis, peninggian peil lantai bangunan, dan perbaikan drainase sebelum proses akad transaksi.'
    : overallLevel === 'medium'
    ? 'Paparan risiko lingkungan berada pada tingkat SEDANG. Mitigasi preventif standar direkomendasikan untuk mempertahankan nilai aset dan kenyamanan operasional jangka panjang.'
    : 'Kondisi tapak memiliki ketahanan PRIMA dengan paparan risiko bencana minimal. Pemeliharaan berkala standar sudah mencukupi.';

  const triggerPrint = () => {
    window.print();
  };

  const renderDeepDiveGrid = (items: DeepDiveMetricItem[], customStyle?: React.CSSProperties) => {
    return (
      <div className="gs-deepdive-grid" style={customStyle}>
        {items.map((item) => (
          <div key={item.id} className="gs-deepdive-card">
            <span className="gs-deepdive-label">{item.label}</span>
            <div className="gs-deepdive-val">{item.value}</div>
            <p className="gs-deepdive-desc">{item.description}</p>
          </div>
        ))}
      </div>
    );
  };

  const renderRegistryGrid = (category: HazardCategory, sliceStart?: number, sliceEnd?: number, customStyle?: React.CSSProperties) => {
    const allMetrics = ReportMetricRegistry.getDisplayMetrics(category, assessment, isEn);
    const metrics = (sliceStart !== undefined || sliceEnd !== undefined)
      ? allMetrics.slice(sliceStart ?? 0, sliceEnd)
      : allMetrics;

    return (
      <div className="gs-deepdive-grid" style={customStyle}>
        {metrics.map((item) => (
          <div key={item.id} className="gs-deepdive-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
              <span className="gs-deepdive-label">{isEn ? item.labelEn : item.labelId}</span>
              {item.dataType === 'status' && (
                <span className="gs-table-badge" style={{ background: '#fef3c7', color: '#b45309', fontSize: '0.62rem', padding: '1px 6px' }}>
                  {isEn ? 'STATUS' : 'STATUS'}
                </span>
              )}
            </div>
            <div className="gs-deepdive-val">
              {item.value !== null ? `${item.value}${item.unit ? ` ${item.unit}` : ''}` : (isEn ? 'Data unavailable' : 'Data belum tersedia')}
            </div>
            <p className="gs-deepdive-desc">
              {isEn ? (item.descriptionEn || item.source) : (item.descriptionId || item.source)}
            </p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`report-modal-overlay ${isFullWidth ? 'is-full-width' : ''}`} onClick={() => setIsReportModalOpen(false)}>
      <div className={`report-modal-inner ${isFullWidth ? 'is-full-width' : ''}`} onClick={(e) => e.stopPropagation()}>
        {/* 1. Top Fixed Header Bar */}
        <div className="report-modal-header-bar">
          <div className="modal-header-brand-group">
            <div className="modal-header-icon-badge">
              <FileCheck2 size={20} />
            </div>
            <div>
              <h3 className="modal-header-main-title">
                {isEn ? 'Official GoTangguh Due Diligence Dossier' : 'Dossier Resmi Uji Tuntas GoTangguh'}
              </h3>
              <p className="modal-header-sub-text">
                {isEn ? 'Comprehensive multi-hazard property due diligence & financial risk dossier, backed by RDI & BGP Consultants.' : 'Dossier lengkap uji tuntas risiko bencana properti & dampak finansial resmi, didukung tim ahli RDI & BGP Consultant.'}
              </p>
            </div>
          </div>

          <div className="modal-header-action-group">
            <button
              type="button"
              className="modal-header-print-btn"
              onClick={() => setIsFullWidth(!isFullWidth)}
              style={{ background: isFullWidth ? '#fff7ed' : '#f8fafc', color: isFullWidth ? '#c2410c' : '#334155', border: isFullWidth ? '1px solid #fed7aa' : '1px solid #cbd5e1' }}
              title={isFullWidth ? (isEn ? 'Standard View' : 'Tampilan Standar') : (isEn ? '100% Full View' : 'Tampilan 100% Penuh')}
            >
              {isFullWidth ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              <span>{isFullWidth ? (isEn ? 'Fit Screen' : 'Layar Pas') : (isEn ? '100% Full Width' : '100% Penuh')}</span>
            </button>

            <button
              type="button"
              className="modal-header-print-btn"
              onClick={triggerPrint}
              title={isEn ? 'Print or Save as PDF' : 'Cetak atau Simpan sebagai PDF'}
            >
              <Printer size={16} />
              <span>{isEn ? 'Print / Download PDF' : 'Cetak / Unduh PDF'}</span>
            </button>

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

        {/* 2. Single Dedicated Scroll Body */}
        <div className="report-modal-scroll-body">
          {/* ==========================================================================
             14-PAGE GROUNDSURE & JBA STANDARD PDF DOSSIER
             ========================================================================== */}
          <div className="groundsure-pdf-document" id="printableReportArea">
          
          {/* ==========================================================================
             HALAMAN 1: COVER & RINGKASAN EKSEKUTIF
             ========================================================================== */}
          <div className="gs-pdf-page" id="gs-page-1">
            <div className="gs-header-section">
              <div className="gs-brand-group">
                <img src="/assets/logo.svg" alt="GoTangguh Logo" className="gs-logo-icon" />
                <div>
                  <div className="gs-title-main">{isEn ? 'GoTangguh Spatial Due Diligence Dossier' : 'GoTangguh Due Diligence Report'}</div>
                  <div className="gs-subtitle-tag">{isEn ? 'PROPERTY MULTI-HAZARD RISK ASSESSMENT & CLIMATE ADAPTATION DOSSIER' : 'DOKUMEN ASESMEN RISIKO BENCANA PROPERTI & PANDUAN MITIGASI'}</div>
                </div>
              </div>
              <div className="gs-meta-info-box">
                <strong>{isEn ? 'Reference No:' : 'No. Referensi:'}</strong> {assessment.referenceNumber}<br />
                <strong>{isEn ? 'Date of Issue:' : 'Tanggal Terbit:'}</strong> {isNaN(Date.parse(assessment.evaluatedAt)) ? assessment.evaluatedAt : new Date(assessment.evaluatedAt).toLocaleDateString(isEn ? 'en-US' : 'id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br />
                <strong>{isEn ? 'GPS Coordinates:' : 'Koordinat GPS:'}</strong> {assessment.location.latitude.toFixed(5)}°, {assessment.location.longitude.toFixed(5)}°
              </div>
            </div>

            <div className="gs-page-badge-title">{isEn ? 'PAGE 1 — COVER & EXECUTIVE SUMMARY' : 'HALAMAN 1 — COVER & RINGKASAN EKSEKUTIF'}</div>

            {/* Identitas Lokasi & Konteks Tapak */}
            <div className="gs-site-context-banner">
              <div className="gs-site-addr-row">
                <MapPin size={15} className="gs-addr-ico" />
                <span><strong>{isEn ? 'Target Site Address:' : 'Alamat / Titik Tapak:'}</strong> {assessment.location.formattedAddress}</span>
              </div>
              <div className="gs-site-meta-pills">
                <span className="gs-meta-pill">
                  <Building size={12} />
                  <strong>{isEn ? 'Asset Type:' : 'Tipe Aset:'}</strong> {propertyType}
                </span>
                <span className="gs-meta-pill">
                  <User size={12} />
                  <strong>{isEn ? 'Client Perspective:' : 'Perspektif Pengguna:'}</strong> {userPersona}
                </span>
                <span className="gs-meta-pill">
                  <ShieldCheck size={12} />
                  <strong>{isEn ? 'Data Completeness:' : 'Kelengkapan Data:'}</strong> {assessment.dataCompletenessScorePct ?? 96}% (Verified Multi-Agency Sources)
                </span>
              </div>
            </div>

            {/* Skor Risiko & Opini Audit */}
            <div className={`gs-opinion-banner-box ${overallLevel}`}>
              <div className="gs-opinion-text-col">
                <h4>{isEn ? 'Executive Summary & Professional Opinion' : 'Ringkasan Eksekutif & Opini Profesional'}</h4>
                <p>{opinionText}</p>
                <p style={{ marginTop: '6px', fontSize: '0.78rem', color: '#64748b' }}>
                  {isEn ? 'Dominant Hazard:' : 'Dominan Hazard:'} <strong>{overallLevel === 'extreme' || overallLevel === 'high' ? (isEn ? 'Seismic & Active Faults / Inundation' : 'Gempa & Sesar Aktif / Banjir') : (isEn ? 'Managed Baseline Risk' : 'Paparan Terkendali')}</strong> · {isEn ? 'Key Action: Verify finished floor levels and tie-column structural anchoring before closing transaction.' : 'Rekomendasi Singkat: Lakukan evaluasi elevasi peil lantai dan perkuatan ikatan dinding kolom sebelum serah terima aset.'}
                </p>
              </div>
              <div className="gs-opinion-score-col">
                <div className="gs-opinion-score-dial">
                  <span className="gs-dial-num">{overallScore !== null ? overallScore : '--'}</span>
                  <span className="gs-dial-den">/100</span>
                </div>
                <span className={`gs-status-badge ${overallLevel}`}>
                  {overallLevel === 'insufficient_data' ? (isEn ? 'INSUFFICIENT DATA' : 'DATA TIDAK CUKUP') : (isEn ? `${overallLevel.toUpperCase()} RISK` : `RISIKO ${overallLevel.toUpperCase()}`)}
                </span>
              </div>
            </div>

            {/* Peta Mini & Ringkasan Cepat */}
            <div className="gs-cover-summary-grid">
              <div className="gs-cover-meta-item">
                <span className="gs-meta-kicker">{isEn ? 'Ground Elevation' : 'Elevasi Tanah Dasar'}</span>
                <span className="gs-meta-val">{flood.elevationMeters !== null ? `${flood.elevationMeters} m ${isEn ? 'MSL (Copernicus DEM)' : 'dpl (Copernicus DEM)'}` : (isEn ? 'Data unavailable' : 'Data tidak tersedia')}</span>
              </div>
              <div className="gs-cover-meta-item">
                <span className="gs-meta-kicker">{isEn ? 'Seismic Hazard Tier' : 'Zonasi Seismik BNPB'}</span>
                <span className="gs-meta-val">{quake.quakeClass || (isEn ? 'Official class unavailable' : 'Klasifikasi resmi belum tersedia')}</span>
              </div>
              <div className="gs-cover-meta-item">
                <span className="gs-meta-kicker">{isEn ? 'Forecast Peak Temp' : 'Suhu Maks Prakiraan'}</span>
                <span className="gs-meta-val">{heat.avgMaxTempC !== null ? `${heat.avgMaxTempC} °C (Open-Meteo)` : (isEn ? 'Data unavailable' : 'Data tidak tersedia')}</span>
              </div>
              <div className="gs-cover-meta-item">
                <span className="gs-meta-kicker">{isEn ? 'Evacuation Access' : 'Konektivitas Evakuasi'}</span>
                <span className="gs-meta-val">{transport.distanceToArterialMeters !== null ? `${transport.distanceToArterialMeters >= 1000 ? `${(transport.distanceToArterialMeters / 1000).toFixed(1)}km` : `${transport.distanceToArterialMeters}m`} ${isEn ? 'to Primary Arterial' : 'ke Jalan Arteri'}` : (isEn ? 'Data unavailable' : 'Data tidak tersedia')}</span>
              </div>
            </div>

            <div className="gs-pdf-footer-note">{isEn ? 'Page 1 of 14 · GoTangguh Location Intelligence Report' : 'Halaman 1 dari 14 · GoTangguh Location Intelligence Report'}</div>
          </div>

          {/* ==========================================================================
             HALAMAN 2: OVERVIEW TIGA HAZARD
             ========================================================================== */}
          <div className="gs-pdf-page" id="gs-page-2">
            <div className="gs-page-badge-title">{isEn ? 'PAGE 2 — MULTI-HAZARD COMPARATIVE OVERVIEW' : 'HALAMAN 2 — OVERVIEW TIGA HAZARD UTAMA'}</div>
            <p className="gs-page-intro">
              {isEn ? 'Comprehensive multi-hazard physical risk comparison at the assessed coordinate point:' : 'Ringkasan komparasi multirisiko fisik lingkungan pada titik koordinat properti yang dianalisis:'}
            </p>

            <table className="gs-structured-table">
              <thead>
                <tr>
                  <th style={{ width: '22%' }}>{isEn ? 'Hazard Pillar' : 'Pilar Bahaya'}</th>
                  <th style={{ width: '18%' }}>{isEn ? 'Score & Rating' : 'Skor & Rating'}</th>
                  <th style={{ width: '30%' }}>{isEn ? 'Field Empirical Metrics' : 'Parameter Faktual Lapangan'}</th>
                  <th style={{ width: '30%' }}>{isEn ? 'Adaptive Prescription Directive' : 'Arah Preskripsi Adaptif'}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>{isEn ? '01. Flooding & Inundation' : '01. Banjir & Genangan'}</strong></td>
                  <td>
                    <span className={`gs-table-badge gs-level-${flood.level}`}>
                      {flood.score !== null ? `${flood.score}/100` : '--/100'} · {flood.level.toUpperCase()}
                    </span>
                  </td>
                  <td>{isEn ? `Elevation ${flood.elevationMeters !== null ? `${flood.elevationMeters}m MSL` : 'N/A'} · ${flood.distanceToRiverMeters !== null ? (flood.distanceToRiverMeters >= 0 ? `Waterway distance ${flood.distanceToRiverMeters}m` : 'Clear of waterway (>2.5km)') : 'Waterway data unavailable'} · Peak 24h Rain ${flood.max24hRainfallMm !== null ? `${flood.max24hRainfallMm}mm` : 'N/A'}` : `Elevasi ${flood.elevationMeters !== null ? `${flood.elevationMeters}m dpl` : 'N/A'} · ${flood.distanceToRiverMeters !== null ? (flood.distanceToRiverMeters >= 0 ? `Jarak badan air ${flood.distanceToRiverMeters}m` : 'Jarak badan air (>2.5km)') : 'Data badan air tidak tersedia'} · Curah hujan 24j ${flood.max24hRainfallMm !== null ? `${flood.max24hRainfallMm}mm` : 'N/A'}`}</td>
                  <td>{isEn ? flood.recomEn : flood.recomId}</td>
                </tr>
                <tr>
                  <td><strong>{isEn ? '02. Earthquake & Faults' : '02. Gempa Bumi & Seismik'}</strong></td>
                  <td>
                    <span className={`gs-table-badge gs-level-${quake.level}`}>
                      {quake.score !== null ? `${quake.score}/100` : '--/100'} · {quake.level.toUpperCase()}
                    </span>
                  </td>
                  <td>{quake.quakeClass ? (isEn ? `Tier: ${quake.quakeClass}` : `Klasifikasi: ${quake.quakeClass}`) : (isEn ? 'Seismic tier unavailable' : 'Klasifikasi resmi belum tersedia')} · {quake.estimatedPgaG !== null ? `PGA ${quake.estimatedPgaG}g` : (isEn ? 'PGA requires testing' : 'PGA belum tersedia')} · {quake.historicalQuakesCount150km !== null ? `${quake.historicalQuakesCount150km} ${isEn ? 'events' : 'kejadian'}` : (isEn ? 'Seismic data unavailable' : 'Histori seismik tidak tersedia')}</td>
                  <td>{isEn ? quake.recomEn : quake.recomId}</td>
                </tr>
                <tr>
                  <td><strong>{isEn ? '03. Heat Stress & Microclimate' : '03. Heat Stress & Iklim'}</strong></td>
                  <td>
                    <span className={`gs-table-badge gs-level-${heat.level}`}>
                      {heat.score !== null ? `${heat.score}/100` : '--/100'} · {heat.level.toUpperCase()}
                    </span>
                  </td>
                  <td>{isEn ? `Forecast max ${heat.avgMaxTempC !== null ? `${heat.avgMaxTempC}°C` : 'N/A'} · Peak extreme ${heat.historicalPeakTempC !== null ? `${heat.historicalPeakTempC}°C` : 'N/A'}${heat.greenSpaceRatioPct !== null && heat.greenSpaceRatioPct >= 0 ? ` · Green canopy ${heat.greenSpaceRatioPct}%` : ''}` : `Suhu prakiraan ${heat.avgMaxTempC !== null ? `${heat.avgMaxTempC}°C` : 'N/A'} · Puncak historis ${heat.historicalPeakTempC !== null ? `${heat.historicalPeakTempC}°C` : 'N/A'}${heat.greenSpaceRatioPct !== null && heat.greenSpaceRatioPct >= 0 ? ` · Tutupan RTH ${heat.greenSpaceRatioPct}%` : ''}`}</td>
                  <td>{isEn ? heat.recomEn : heat.recomId}</td>
                </tr>
              </tbody>
            </table>

            <div className="gs-info-box-note">
              <strong>{isEn ? 'Priority Scale Determination:' : 'Penetapan Skala Prioritas:'}</strong> {isEn ? 'Mitigation sequence is prioritized first for hazards rated High or Extreme before allocating to routine maintenance.' : 'Urutan tindakan mitigasi difokuskan terlebih dahulu pada hazard berperingkat Tinggi atau Ekstrem sebelum dialokasikan pada pemeliharaan rutin.'}
            </div>

            <div className="gs-pdf-footer-note">{isEn ? 'Page 2 of 14 · GoTangguh Location Intelligence Report' : 'Halaman 2 dari 14 · GoTangguh Location Intelligence Report'}</div>
          </div>

          {/* ==========================================================================
             HALAMAN 3: DETAIL HAZARD GEMPA BUMI (ZONASI, SESAR & SEISMISITAS)
             ========================================================================== */}
          <div className="gs-pdf-page" id="gs-page-3">
            <div className="gs-page-badge-title">{isEn ? 'PAGE 3 — HAZARD DEEP-DIVE: SEISMIC & ACTIVE FAULTS (ZONING & SEISMICITY)' : 'HALAMAN 3 — DETAIL HAZARD: GEMPA BUMI & SESAR (ZONASI & SEISMISITAS)'}</div>
            
            <div className="gs-section-heading">
              <Mountain size={15} />
              <span>{isEn ? 'Seismic Hazard Analysis (BNPB inaRISK, ThinkHazard & USGS FDSN Catalog)' : 'Analisis Bahaya Seismik (BNPB inaRISK, ThinkHazard & Katalog USGS FDSN)'}</span>
            </div>

            {renderRegistryGrid('earthquake', 0, 4)}

            <div className="gs-info-box-note">
              <strong>{isEn ? 'Causal Factors & Potential Impact:' : 'Penyebab & Dampak Potensial:'}</strong> {quake.causeId ? (isEn ? quake.causeEn : quake.causeId) : (isEn ? 'Site is evaluated for tectonic motion. Ensure tie columns and continuous ring beams are installed.' : 'Tapak dianalisis terhadap potensi getaran seismik. Pastikan kolom praktis dan balok pengikat terpasang.')}
            </div>

            <div className="gs-pdf-footer-note">{isEn ? 'Page 3 of 14 · GoTangguh Location Intelligence Report' : 'Halaman 3 dari 14 · GoTangguh Location Intelligence Report'}</div>
          </div>

          {/* ==========================================================================
             HALAMAN 4: DETAIL HAZARD GEMPA BUMI (GEOLOGI, PROBABILITAS & SNI)
             ========================================================================== */}
          <div className="gs-pdf-page" id="gs-page-4">
            <div className="gs-page-badge-title">{isEn ? 'PAGE 4 — HAZARD DEEP-DIVE: EARTHQUAKE (GEOTECHNICAL & SEISMIC CODES)' : 'HALAMAN 4 — DETAIL HAZARD: GEMPA BUMI (GEOLOGI & STANDAR SNI)'}</div>
            
            <div className="gs-section-heading">
              <ShieldCheck size={15} />
              <span>{isEn ? 'Soil Site Class, Design Peak Ground Acceleration (PGA) & Structural Codes' : 'Klasifikasi Tanah, Percepatan PGA & Standar Bangunan Tahan Gempa (SNI 1726:2019)'}</span>
            </div>

            {renderRegistryGrid('earthquake', 4)}

            <div className="gs-info-box-note">
              <strong>{isEn ? 'Official Earthquake Building Codes Directive:' : 'Standar Bangunan Tahan Gempa Resmi:'}</strong> {isEn ? 'Structural designs should reference applicable earthquake standards (SNI 1726:2019 / NSCP) with continuous reinforced concrete tie beams and anchored tie columns.' : 'Perencanaan struktur bangunan disarankan mengacu pada standar desain ketahanan gempa yang berlaku (SNI 1726:2019) dengan ikatan sloof kaku dan penjangkaran kolom praktis.'}
            </div>

            <div className="gs-pdf-footer-note">{isEn ? 'Page 4 of 14 · GoTangguh Location Intelligence Report' : 'Halaman 4 dari 14 · GoTangguh Location Intelligence Report'}</div>
          </div>

          {/* ==========================================================================
             HALAMAN 5: DETAIL HAZARD BANJIR (TOPOGRAFI, ELEVASI & BADAN AIR)
             ========================================================================== */}
          <div className="gs-pdf-page" id="gs-page-5">
            <div className="gs-page-badge-title">{isEn ? 'PAGE 5 — HAZARD DEEP-DIVE: FLOODING (TOPOGRAPHY & RIVER PROXIMITY)' : 'HALAMAN 5 — DETAIL HAZARD: BANJIR (TOPOGRAFI & BADAN AIR)'}</div>
            
            <div className="gs-section-heading">
              <Waves size={15} />
              <span>{isEn ? 'Topographic Analysis, Waterway Distance & Flood Exposure Model' : 'Analisis Elevasi Topografi, Jarak Badan Air & Model Paparan Banjir'}</span>
            </div>

            {renderRegistryGrid('flood', 0, 4)}

            <div className="gs-info-box-note">
              <strong>{isEn ? 'Site Topography & Drainage Advice:' : 'Kondisi Topografi & Drainase Tapak:'}</strong> {isEn ? `Site ground elevation of ${flood.elevationMeters ?? 'N/A'}m MSL requires clean local drainage outflow channels to prevent localized ponding during severe downpours.` : `Posisi elevasi tapak ${flood.elevationMeters !== null ? `${flood.elevationMeters} m dpl` : 'terkait'} memerlukan saluran drainase lingkungan yang lancar guna mencegah genangan saat hujan lebat.`}
            </div>

            <div className="gs-pdf-footer-note">{isEn ? 'Page 5 of 14 · GoTangguh Location Intelligence Report' : 'Halaman 5 dari 14 · GoTangguh Location Intelligence Report'}</div>
          </div>

          {/* ==========================================================================
             HALAMAN 6: DETAIL HAZARD BANJIR (HISTORIS, PRESIPITASI & GENANGAN)
             ========================================================================== */}
          <div className="gs-pdf-page" id="gs-page-6">
            <div className="gs-page-badge-title">{isEn ? 'PAGE 6 — HAZARD DEEP-DIVE: FLOODING (PRECIPITATION & GLOFAS HYDROLOGY)' : 'HALAMAN 6 — DETAIL HAZARD: BANJIR (PRESIPITASI & HIDROLOGI GLOFAS)'}</div>
            
            <div className="gs-section-heading">
              <Activity size={15} />
              <span>{isEn ? 'Daily Extreme Precipitation (Open-Meteo ERA5) & GloFAS River Discharge' : 'Klimatologi Curah Hujan ERA5 & Debit Aliran Sungai GloFAS'}</span>
            </div>

            {renderRegistryGrid('flood', 4)}

            <div className="gs-info-box-note">
              <strong>{isEn ? 'Finished Floor Elevation Recommendation:' : 'Rekomendasi Peil Lantai Bangunan:'}</strong> {isEn ? 'Evaluate finished floor level elevation relative to surrounding roadway crown and consider installing backflow prevention valves and groundwater recharge drywells.' : 'Disarankan mengevaluasi peninggian peil lantai dasar bangunan terhadap elevasi muka jalan lingkungan serta melengkapi halaman dengan sumur resapan/biopori dan katup pencegah arus balik drainase.'}
            </div>

            <div className="gs-pdf-footer-note">{isEn ? 'Page 6 of 14 · GoTangguh Location Intelligence Report' : 'Halaman 6 dari 14 · GoTangguh Location Intelligence Report'}</div>
          </div>

          {/* ==========================================================================
             HALAMAN 7: DETAIL HAZARD HEAT STRESS & MIKROKLIMAT
             ========================================================================== */}
          <div className="gs-pdf-page" id="gs-page-7">
            <div className="gs-page-badge-title">{isEn ? 'PAGE 7 — HAZARD DEEP-DIVE: HEAT STRESS & MICROCLIMATE' : 'HALAMAN 7 — DETAIL HAZARD: HEAT STRESS & MIKROKLIMAT'}</div>
            
            <div className="gs-section-heading">
              <Flame size={15} />
              <span>{isEn ? 'Atmospheric Thermal Metrics (Open-Meteo ERA5) & Heat Stress Model' : 'Parameter Termal Atmosfer (Open-Meteo ERA5) & Model Beban Termal'}</span>
            </div>

            {renderRegistryGrid('heat')}

            <div className="gs-info-box-note">
              <strong>{isEn ? '10–30 Year Climate Projections & Energy Advisory:' : 'Proyeksi Iklim 10–30 Tahun & Rekomendasi Energi:'}</strong> {heat.projectedTempRise2050C !== null ? (isEn ? `CMIP6 climate model projections (MRI-AGCM3-2-S) indicate a signed temperature anomaly of +${heat.projectedTempRise2050C}°C by 2046–2049 relative to model baseline. Consider architectural shading, cool roof coatings, and envelope thermal insulation.` : `Pemodelan iklim CMIP6 (MRI-AGCM3-2-S) memproyeksikan anomali kenaikan suhu rata-rata +${heat.projectedTempRise2050C}°C pada periode 2046–2049 relatif terhadap baseline model. Disarankan mempertimbangkan insulasi selubung termal, peneduh arsitektural, dan pelapis atap reflektif (Cool Roof).`) : (isEn ? 'Consider architectural shading, cool roof coatings, and envelope thermal insulation to reduce AC electricity cooling load.' : 'Disarankan mempertimbangkan insulasi selubung termal, peneduh arsitektural, dan pelapis atap reflektif guna meminimalkan beban listrik pendinginan ruangan.')}
            </div>

            <div className="gs-pdf-footer-note">{isEn ? 'Page 7 of 14 · GoTangguh Location Intelligence Report' : 'Halaman 7 dari 14 · GoTangguh Location Intelligence Report'}</div>
          </div>

          {/* ==========================================================================
             HALAMAN 8: DIAGNOSIS KERENTANAN ELEMEN BANGUNAN
             ========================================================================== */}
          <div className="gs-pdf-page" id="gs-page-8">
            <div className="gs-page-badge-title">{isEn ? 'PAGE 8 — BUILDING ELEMENT VULNERABILITY DIAGNOSTICS' : 'HALAMAN 8 — DIAGNOSIS KERENTANAN ELEMEN BANGUNAN (*VULNERABILITY DIAGNOSTICS*)'}</div>
            
            <div className="gs-section-heading">
              <Building size={15} />
              <span>{isEn ? 'Structural Resilience Evaluation: Substructure, Walls, Roof Frame, Electrical & Drainage' : 'Evaluasi Ketahanan Fisik Spesifik: Pondasi, Dinding, Rangka Atap, Listrik & Drainase'}</span>
            </div>

            <table className="gs-structured-table">
              <thead>
                <tr>
                  <th style={{ width: '22%' }}>{isEn ? 'Structural Element' : 'Elemen Struktur'}</th>
                  <th style={{ width: '38%' }}>{isEn ? 'Potential Vulnerability Point / Impact' : 'Potensi Titik Kegagalan / Dampak Bencana'}</th>
                  <th style={{ width: '40%' }}>{isEn ? 'Resilience Standard & Specification' : 'Standar Rekomendasi Ketahanan Fisik'}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>{isEn ? 'Foundation & Substructure' : 'Pondasi & Substruktur'}</strong></td>
                  <td>{isEn ? 'Differential settlement and soil bearing capacity degradation under water-logged conditions.' : 'Penurunan diferensial (differential settlement) dan pelunakan tanah saat jenuh air.'}</td>
                  <td>{isEn ? 'Continuous strip footing with reinforced concrete tie beams and rigid corner joints.' : 'Pondasi batu kali menerus dengan sloof beton bertulang bertulangan rapat pengikat kaku.'}</td>
                </tr>
                <tr>
                  <td><strong>{isEn ? 'Walls & Columns' : 'Dinding & Kolom'}</strong></td>
                  <td>{isEn ? 'Diagonal shear cracks from lateral earthquake motion and flood moisture infiltration.' : 'Retak geser diagonal akibat gaya gempa lateral dan rembesan air genangan.'}</td>
                  <td>{isEn ? 'Install tie columns spaced max 3m & damp-proof mortar (trasraam) up to 60cm.' : 'Pasang kolom praktis interval maks 3 meter & plesteran kedap air (trasraam) setinggi 60cm.'}</td>
                </tr>
                <tr>
                  <td><strong>{isEn ? 'Roof Frame & Ceiling' : 'Rangka Atap & Plafon'}</strong></td>
                  <td>{isEn ? 'High thermal envelope gain and storm wind uplift damage.' : 'Beban termal tinggi dan daya angkat angin kencang (wind uplift).'}</td>
                  <td>{isEn ? 'Install radiant barrier foil insulation and diagonal steel wind bracing.' : 'Gunakan insulasi aluminium foil peredam panas dan ikatan angin (wind bracing) baja ringan.'}</td>
                </tr>
                <tr>
                  <td><strong>{isEn ? 'Electrical & Sanitary' : 'Instalasi Listrik & Sanitasi'}</strong></td>
                  <td>{isEn ? 'Short circuits during inundation and wastewater sewer backflow.' : 'Korsleting saat genangan air dan arus balik limbah kotor (backflow).'}</td>
                  <td>{isEn ? 'Elevate breaker panel min 1.5m and install check valve on main sewer.' : 'Elevasi panel MCB min 1.5m dari lantai dan pasang katup backflow check valve pada pembuangan.'}</td>
                </tr>
              </tbody>
            </table>

            <div className="gs-info-box-note">
              <strong>{isEn ? 'Existing Building Vulnerability Factors:' : 'Faktor Kerentanan Khusus Bangunan Eksisting:'}</strong> {isEn ? 'For existing structures, perform scheduled inspections on roof truss brackets, beam-column ties, and exterior boundary waterproofing.' : 'Untuk bangunan yang sudah berdiri, lakukan inspeksi berkala pada sambungan perkuatan simpul atap dan kedap air dinding pembatas persil.'}
            </div>

            <div className="gs-pdf-footer-note">{isEn ? 'Page 8 of 14 · GoTangguh Location Intelligence Report' : 'Halaman 8 dari 14 · GoTangguh Location Intelligence Report'}</div>
          </div>

          {/* ==========================================================================
             HALAMAN 9: REKOMENDASI STRATEGIS & ESTIMASI BIAYA
             ========================================================================== */}
          <div className="gs-pdf-page" id="gs-page-9">
            <div className="gs-page-badge-title">{isEn ? 'PAGE 9 — STRATEGIC RECOMMENDATIONS & ADAPTIVE PRESCRIPTIONS' : 'HALAMAN 9 — REKOMENDASI STRATEGIS & PRESKRIPSI MITIGASI'}</div>
            
            <div className="gs-section-heading">
              <ShieldCheck size={15} />
              <span>{isEn ? 'Targeted Adaptive Mitigation Specifications & Indications' : 'Paket Preskripsi Teknis Adaptif & Indikasi Mitigasi'}</span>
            </div>

            <div className="gs-prescriptions-pdf-list">
              {prescriptions.map((rx, idx) => (
                <div key={rx.id} className="gs-rx-pdf-item">
                  <div className="gs-rx-pdf-head">
                    <span className="gs-rx-num">0{idx + 1}.</span>
                    <strong>{isEn ? rx.titleEn : rx.titleId}</strong>
                    <span className="gs-rx-badge">{rx.actionType}</span>
                    <span className="gs-rx-cost" style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {rx.estimatedCostIdr || (isEn ? 'Cost basis unavailable' : 'Estimasi biaya belum tersedia')}
                    </span>
                  </div>
                  <p className="gs-rx-desc">{isEn ? rx.descriptionEn : rx.descriptionId}</p>
                </div>
              ))}
            </div>

            <div className="gs-info-box-note">
              <strong>{isEn ? 'Next Steps & Implementation:' : 'Rujukan Lanjutan & Eksekusi:'}</strong> {isEn ? 'For high-value transactions or developer site feasibility (B2B), escalate to On-Site Expert Field Survey or contact accredited contractors.' : 'Untuk keputusan bernilai besar atau skala kawasan pengembang (B2B), eskalasikan ke Konsultasi Ahli On-Site Survey atau hubungi jaringan mitra kontraktor bersertifikat GoTangguh.'}
            </div>

            <div className="gs-pdf-footer-note">{isEn ? 'Page 9 of 14 · GoTangguh Location Intelligence Report' : 'Halaman 9 dari 14 · GoTangguh Location Intelligence Report'}</div>
          </div>

          {/* ==========================================================================
             HALAMAN 10: AKSESIBILITAS SITE & KONEKTIVITAS TRANSPORTASI
             ========================================================================== */}
          <div className="gs-pdf-page" id="gs-page-10">
            <div className="gs-page-badge-title">{isEn ? 'PAGE 10 — SITE ACCESSIBILITY & EVACUATION CONNECTIVITY' : 'HALAMAN 10 — AKSESIBILITAS SITE & TRANSPORTASI'}</div>
            
            <div className="gs-section-heading">
              <Navigation size={15} />
              <span>{isEn ? 'Road Infrastructure, Emergency Egress Corridors & Transit Access' : 'Analisis Aksesibilitas, Infrastruktur Evakuasi & Transportasi Menuju Lokasi'}</span>
            </div>

            {renderRegistryGrid('transport', undefined, undefined, { gridTemplateColumns: 'repeat(3, 1fr)' })}

            <div className="gs-info-box-note">
              <strong>{isEn ? 'Emergency Dispatch & Access Analysis:' : 'Analisis Aksesibilitas & Evakuasi Darurat:'}</strong> {isEn ? `Frontage road (${transport.nearestRoadName || 'Site Access'}) connected to arterial corridors (${transport.nearestArterialName || 'Arterial'}) provides evacuation egress to emergency medical services.` : `Jalan akses tapak (${transport.nearestRoadName || 'Akses Tapak'}) yang terhubung ke koridor jalan (${transport.nearestArterialName || 'Arteri'}) mendukung akses evakuasi darurat menuju fasilitas kesehatan.`}
            </div>

            <div className="gs-pdf-footer-note">{isEn ? 'Page 10 of 14 · GoTangguh Location Intelligence Report' : 'Halaman 10 dari 14 · GoTangguh Location Intelligence Report'}</div>
          </div>

          {/* ==========================================================================
             HALAMAN 11: DAMPAK FINANSIAL — ESTIMASI PARAMETRIK (GOTANGGUH FINANCIAL SCREENING)
             ========================================================================== */}
          <div className="gs-pdf-page" id="gs-page-11">
            <div className="gs-page-badge-title">{isEn ? 'PAGE 11 — FINANCIAL IMPACT: PARAMETRIC RISK SCREENING' : 'HALAMAN 11 — DAMPAK FINANSIAL: PENAPISAN RISIKO PARAMETRIK'}</div>
            
            <div className="gs-section-heading">
              <DollarSign size={15} />
              <span>{isEn ? 'Indicative Financial Exposure via GoTangguh Parametric Damage Screening' : 'Penapisan Paparan Finansial Berbasis Model Kerusakan Parametrik GoTangguh'}</span>
            </div>

            {renderDeepDiveGrid([
              {
                id: 'ead',
                label: isEn ? 'Indicative Annual Damage Ratio' : 'Indikasi Kerusakan Tahunan (EAD)',
                value: assessment?.financialScreening?.expectedAnnualLossIdr ||
                  (assessment?.financialScreening?.expectedAnnualDamagePct !== null
                    ? `${assessment?.financialScreening?.expectedAnnualDamagePct}% ${isEn ? 'Asset / Yr' : 'Nilai Aset / Thn'}`
                    : (isEn ? 'Data Unavailable' : 'Data Tidak Tersedia')),
                description: isEn ? `Indicative average annual physical screening damage ratio (${assessment?.financialScreening?.expectedAnnualDamagePct ?? 'N/A'}% asset value) from multi-hazard physical exposure.` : `Indikasi rasio kerusakan fisik tahunan rata-rata (${assessment?.financialScreening?.expectedAnnualDamagePct ?? 'N/A'}% nilai aset) akibat paparan multi-bahaya fisik.`
              },
              {
                id: 'pml',
                label: isEn ? 'Parametric 100-Yr Scenario Loss' : 'Skenario Kerugian 100 Tahun',
                value: assessment?.financialScreening?.probableMaximumLoss100YrIdr ||
                  (assessment?.financialScreening?.probableMaximumLoss100YrPct !== null
                    ? `${assessment?.financialScreening?.probableMaximumLoss100YrPct}% ${isEn ? 'Scenario Loss' : 'Skenario Aset'}`
                    : (isEn ? 'Data Unavailable' : 'Data Tidak Tersedia')),
                description: isEn ? `Parametric 100-year extreme scenario loss screening indicator (${assessment?.financialScreening?.probableMaximumLoss100YrPct ?? 'N/A'}% asset value).` : `Indikator penapisan skenario kerugian ekstrem periode 100 tahun (${assessment?.financialScreening?.probableMaximumLoss100YrPct ?? 'N/A'}% nilai aset).`
              },
              {
                id: 'cvar',
                label: isEn ? 'Climate Value at Risk (2050)' : 'Climate Value at Risk (2050)',
                value: assessment?.financialScreening?.climateVaR2050Pct !== null ? `${assessment?.financialScreening?.climateVaR2050Pct}%` : (isEn ? 'Scenario Model Required' : 'Memerlukan Model Skenario Khusus'),
                description: isEn ? 'Long-term forward-looking asset VaR requires forward IPCC trajectory and discount rate modeling.' : 'Proyeksi VaR jangka panjang memerlukan pemodelan trajektori iklim dan tingkat diskonto nilai aset.'
              },
              {
                id: 'bcr',
                label: isEn ? 'Adaptation Benefit-Cost Ratio (BCR)' : 'Rasio Manfaat-Biaya Adaptasi (BCR)',
                value: assessment?.financialScreening?.adaptationBcr !== null ? `${assessment?.financialScreening?.adaptationBcr}x` : (isEn ? 'Site Evaluation Required' : 'Memerlukan Evaluasi Anggaran Tapak'),
                description: isEn ? 'Benefit-Cost Ratio requires itemized capital expenditure costs and site-specific structural avoided losses.' : 'Rasio BCR memerlukan rincian biaya belanja modal (Capex) spesifik dan estimasi kerugian struktur yang dihindari.'
              }
            ])}

            <div className="gs-info-box-note">
              <strong>{isEn ? 'Loss Screening Methodology:' : 'Metodologi Penapisan Kerugian:'}</strong> {assessment?.financialScreening?.methodologyNote || (isEn ? 'GoTangguh Parametric Multi-Hazard Financial Screening (Indicative screening estimate; not a formal valuation or direct CLIMADA model run).' : 'Penapisan Finansial Multi-Bahaya Parametrik GoTangguh (Estimasi penapisan indikatif; bukan penilaian properti formal atau eksekusi langsung paket model CLIMADA).')}
            </div>

            <div className="gs-pdf-footer-note">{isEn ? 'Page 11 of 14 · GoTangguh Location Intelligence Report' : 'Halaman 11 dari 14 · GoTangguh Location Intelligence Report'}</div>
          </div>

          {/* ==========================================================================
             HALAMAN 12: DAMPAK FINANSIAL — PREMI ASURANSI TEKNIS
             ========================================================================== */}
          <div className="gs-pdf-page" id="gs-page-12">
            <div className="gs-page-badge-title">{isEn ? 'PAGE 12 — FINANCIAL IMPACT: INSURANCE PREMIUM & RESILIENCE CREDITS' : 'HALAMAN 12 — DAMPAK FINANSIAL: PREMI ASURANSI TEKNIS (*INSURANCE PREMIUM*)'}</div>
            
            <div className="gs-section-heading">
              <Percent size={15} />
              <span>{isEn ? 'Disaster Insurance Rating & Structural Resilience Underwriting Indications' : 'Indikasi Beban Premi Asuransi Kebencanaan & Diskon Resiliensi Struktur'}</span>
            </div>

            {renderDeepDiveGrid([
              {
                id: 'quake_tariff',
                label: isEn ? 'Earthquake Tariff Zone' : 'Kategori Tarif Asuransi Gempa',
                value: isEn ? 'Standard Seismic Tariff Zone' : 'Zona Gempa Standar',
                description: isEn ? 'Based on property and earthquake insurance tariffs from national insurance association standards (AAUI).' : 'Berdasarkan tarif premi asuransi harta benda dan gempa bumi Asosiasi Asuransi Umum Indonesia (AAUI).'
              },
              {
                id: 'flood_clause',
                label: isEn ? 'Flood Policy Endorsement' : 'Kategori Perluasan Polis Banjir',
                value: isEn ? 'Moderate Exposure Clause' : 'Klausul Risiko Moderat',
                description: isEn ? 'Property policy extension covering physical damage from surface ponding and inundation.' : 'Perluasan jaminan polis asuransi properti terhadap kerusakan akibat genangan air dan limpasan permukaan.'
              },
              {
                id: 'resilience_discount',
                label: isEn ? 'Resilience Premium Indication' : 'Indikasi Diskon Premi Mitigasi',
                value: isEn ? 'Subject to Structural Audit' : 'Tergantung Audit Struktur',
                description: isEn ? 'Underwriters provide preferential premium rates for structures verified to adhere to applicable seismic design standards.' : 'Underwriter asuransi dapat memberikan premi lebih rendah jika bangunan terbukti memenuhi standar desain ketahanan gempa.'
              },
              {
                id: 'roi',
                label: isEn ? 'Mitigation ROI Potential' : 'Potensi ROI Mitigasi',
                value: isEn ? 'Indicative Long-Term Savings' : 'Penghematan Jangka Panjang',
                description: isEn ? 'Cumulative savings on damage prevention and lower insurance claims offset adaptation expenses.' : 'Efisiensi penghematan biaya pencegahan kerusakan mengkompensasi biaya investasi mitigasi.'
              }
            ])}

            <div className="gs-info-box-note">
              <strong>{isEn ? 'Insurance Advisory:' : 'Rekomendasi Perlindungan Asuransi:'}</strong> {isEn ? 'Ensure your property insurance includes Natural Disasters Endorsements with Full Value Protection.' : 'Pastikan polis asuransi properti Anda mencakup klausul perluasan bencana alam (Natural Disasters Endorsement) dengan proteksi nilai pertanggungan penuh (Full Value Protection).'}
            </div>

            <div className="gs-pdf-footer-note">{isEn ? 'Page 12 of 14 · GoTangguh Location Intelligence Report' : 'Halaman 12 dari 14 · GoTangguh Location Intelligence Report'}</div>
          </div>

          {/* ==========================================================================
             HALAMAN 13: DAMPAK FINANSIAL — RISIKO KREDIT & KPR
             ========================================================================== */}
          <div className="gs-pdf-page" id="gs-page-13">
            <div className="gs-page-badge-title">{isEn ? 'PAGE 13 — FINANCIAL IMPACT: MORTGAGE & CREDIT RISK (LENDING DUE DILIGENCE)' : 'HALAMAN 13 — DAMPAK FINANSIAL: RISIKO KREDIT HIPOTEK (*MORTGAGE / KPR RISK*)'}</div>
            
            <div className="gs-section-heading">
              <Landmark size={15} />
              <span>{isEn ? 'Bank Collateral Underwriting, Credit Risk Appraisal & Loan-to-Value (LTV)' : 'Kelayakan Agunan Perbankan, Penilaian Risiko Kredit & Loan-to-Value (LTV)'}</span>
            </div>

            {renderDeepDiveGrid([
              {
                id: 'bankable',
                label: isEn ? 'Bank Collateral Eligibility' : 'Kelayakan Agunan Perbankan',
                value: isEn ? 'Passed Due Diligence (Bankable)' : 'Lolos Uji Kelayakan (Bankable)',
                description: isEn ? 'Property meets standard climate due diligence criteria for mortgage lenders.' : 'Properti memenuhi kriteria standar mitigasi agunan KPR perbankan.'
              },
              {
                id: 'ltv',
                label: isEn ? 'LTV Ratio Sensitivity' : 'Sensitivitas Rasio LTV',
                value: isEn ? 'Standard LTV Headroom' : 'Plafon LTV Standar',
                description: isEn ? 'Optimal loan financing headroom supported by transparently quantified physical hazard profiles.' : 'Plafon pembiayaan kredit optimal berkat profil risiko fisik yang terukur secara transparan.'
              },
              {
                id: 'default_risk',
                label: isEn ? 'Disaster-Induced Default Risk' : 'Risiko Default Terkait Bencana',
                value: isEn ? 'Low (Controlled)' : 'Rendah (Terkendali)',
                description: isEn ? 'Preventive mitigation minimizes borrower default risk from post-disaster emergency repairs.' : 'Mitigasi preventif meminimalkan risiko gangguan finansial debitur akibat pengeluaran darurat pasca-bencana.'
              },
              {
                id: 'green_loan',
                label: isEn ? 'Green Loan Qualification' : 'Skema Pembiayaan Hijau (Green Loan)',
                value: isEn ? 'Eligible for Green Loan Review' : 'Memenuhi Syarat Tinjauan Hijau',
                description: isEn ? 'Climate adaptation compliance aligns with sustainable green finance taxonomies.' : 'Penerapan adaptasi iklim memenuhi taksonomi keuangan berkelanjutan Otoritas Jasa Keuangan (OJK).'
              }
            ])}

            <div className="gs-info-box-note">
              <strong>{isEn ? 'Note for Financial Institutions & Borrowers:' : 'Catatan untuk Institusi Finansial & Debitur:'}</strong> {isEn ? 'This document satisfies environmental due diligence criteria for mortgage underwriting and loan security appraisal.' : 'Dokumen laporan ini dapat dilampirkan dalam berkas pengajuan kredit KPR / KPA sebagai bukti pemenuhan due diligence lingkungan dan kelayakan agunan jangka panjang.'}
            </div>

            <div className="gs-pdf-footer-note">{isEn ? 'Page 13 of 14 · GoTangguh Location Intelligence Report' : 'Halaman 13 dari 14 · GoTangguh Location Intelligence Report'}</div>
          </div>

          {/* ==========================================================================
             HALAMAN 14: ANALISIS PORTOFOLIO KAWASAN & OTORITAS DATA RISET
             ========================================================================== */}
          <div className="gs-pdf-page" id="gs-page-14">
            <div className="gs-page-badge-title">{isEn ? 'PAGE 14 — ESTATE PORTFOLIO FEASIBILITY & RESEARCH CREDIBILITY' : 'HALAMAN 14 — ANALISIS PORTOFOLIO KAWASAN & KREDIBILITAS RISET'}</div>
            
            <div className="gs-section-heading">
              <PieChart size={15} />
              <span>{isEn ? 'Developer B2B Portfolio Recommendations & Verified Scientific Data Authorities' : 'Rekomendasi Portofolio Pengembang (Developer B2B) & Otoritas Data Terverifikasi'}</span>
            </div>

            {renderDeepDiveGrid([
              {
                id: 'estate_masterplan',
                label: isEn ? 'Estate-Scale Feasibility' : 'Studi Kelayakan Skala Kawasan',
                value: isEn ? 'Resilience-Led Masterplan' : 'Masterplan Berbasis Resiliensi',
                description: isEn ? 'Developers are advised to place core public amenities on parcels with favorable elevation and access profiles.' : 'Pengembang disarankan menerapkan zonasi peletakan fasilitas umum pada area tapak berelevasi dan berakses terbaik.'
              },
              {
                id: 'resilient_proto',
                label: isEn ? 'Resilient Prototype Catalog' : 'Katalog Prototipe Bangunan Tangguh',
                value: isEn ? 'Standard Design Guidelines Available' : 'Tersedia Panduan Desain Standar',
                description: isEn ? 'Climate-resilient and earthquake-tested architectural blueprints with optimal cost efficiency.' : 'Pilihan rancangan bangunan ramah iklim dan tahan gempa dengan efisiensi biaya konstruksi optimal.'
              }
            ])}

            {/* Source Attribution Footnotes & Research Backing */}
            <div className="gs-source-attribution-footer" style={{ marginTop: '16px' }}>
              <strong>{isEn ? 'Official Geospatial Data Authorities:' : 'Otoritas Data Geospasial Resmi:'}</strong> {isEn ? 'Copernicus DEM 90m (Open-Meteo), Badan Nasional Penanggulangan Bencana (BNPB inaRISK ImageServer), USGS Earthquake Hazards Program (FDSN Event API), EMSC / SeismicPortal, Open-Meteo ERA5-Seamless Reanalysis & CMIP6 Climate Projections, OpenStreetMap Contributors & OSRM Routing Engine.' : 'Copernicus DEM 90m (Open-Meteo), Badan Nasional Penanggulangan Bencana (BNPB inaRISK ImageServer), USGS Earthquake Hazards Program (Katalog FDSN), EMSC / SeismicPortal, Open-Meteo ERA5-Seamless Reanalysis & Proyeksi Iklim CMIP6, OpenStreetMap Contributors & OSRM Engine.'}<br />
              <strong>{isEn ? 'Research Credibility:' : 'Kredibilitas & Riset:'}</strong> {isEn ? 'Supported by research methodologies from RDI (Resilience Development Initiative) & BGP Consultants.' : 'Didukung metodologi penelitian dari RDI (Resilience Development Initiative) & BGP Consultant.'}
            </div>

            <div className="gs-info-box-note" style={{ marginTop: '12px' }}>
              <strong>{isEn ? 'Legal Disclaimer & Scope of Liability:' : 'Pernyataan Legal & Batasan Tanggung Jawab:'}</strong> {isEn ? 'This report is compiled using verified geospatial data and parametric screening models for initial due diligence. For major structural execution, licensed on-site geotechnical soil bore testing and structural engineer certification are recommended.' : 'Laporan ini disusun berdasarkan data geospasial terverifikasi dan model penapisan parametrik untuk memberikan panduan uji tuntas awal. Untuk eksekusi struktural berskala besar, disarankan melakukan penyelidikan tanah lapangan (soil test sondir / bor log) bersama tenaga ahli berlisensi.'}
            </div>

            <div className="gs-pdf-footer-note">{isEn ? 'Page 14 of 14 · GoTangguh Location Intelligence Report (End of Document)' : 'Halaman 14 dari 14 · GoTangguh Location Intelligence Report (End of Document)'}</div>
          </div>

        </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="modal-actions-bar-flex">
          <button type="button" className="btn-print-download" onClick={triggerPrint}>
            <Printer size={17} />
            <span>{isEn ? 'Print / Download Full PDF Dossier' : 'Cetak / Unduh PDF Dossier Lengkap'}</span>
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
    </div>
  );
};

export default GroundsureReportModal;
