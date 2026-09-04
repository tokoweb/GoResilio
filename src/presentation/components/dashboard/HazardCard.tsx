import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAssessment } from '../../context/AssessmentContext';
import {
  Waves,
  Activity,
  Flame,
  Navigation,
  ShieldCheck,
  Layers,
  X,
  FileText
} from 'lucide-react';
import type { HazardCategory } from '../../../domain/types/hazard.types';
import { CanonicalRatingResolver } from '../../../domain/services/CanonicalRatingResolver';
import { ReportMetricRegistry } from '../../../domain/services/ReportMetricRegistry';
import type { ReportMetric } from '../../../domain/types/feature.types';

export const HazardCard: React.FC = () => {
  const { language, t } = useLanguage();
  const { assessment, isLoading } = useAssessment();
  const [activeTab, setActiveTab] = useState<HazardCategory>('flood');
  const [showTechnicalModal, setShowTechnicalModal] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isEn = language === 'en';

  if (isLoading) {
    return (
      <div className="gt-luxury-matrix-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '440px', margin: '0 auto' }}>
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
          <h3 style={{ fontSize: '1.12rem', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
            {isEn ? 'Generating 4-Pillar Due Diligence Dossier...' : 'Menyiapkan Dossier Analisis Risiko 4-Pilar...'}
          </h3>
          <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.6 }}>
            {isEn
              ? 'Compiling live data for flood, seismic, thermal stress, and evacuation accessibility...'
              : 'Mengompilasi data live untuk bahaya banjir, seismik gempa, beban termal, dan aksesibilitas evakuasi...'}
          </p>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="gt-luxury-matrix-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
        <p style={{ color: '#64748b' }}>
          {isEn ? 'No assessment data available. Please trigger an assessment.' : 'Data penilaian tidak tersedia. Silakan jalankan analisis lokasi.'}
        </p>
      </div>
    );
  }

  const { flood, quake, heat, transport } = assessment;

  // Grade badge mapping via Canonical Rating Resolver (SSOT)
  const getGradeBadge = (scoreOrLevel: number | string | null | undefined, explicitScore?: number | null) => {
    const numScore = typeof scoreOrLevel === 'number' ? scoreOrLevel : explicitScore;
    const resolved = CanonicalRatingResolver.getHazardRating(numScore, language);
    const cls = resolved.badgeClass === 'low' ? 'gt-badge-pass'
      : resolved.badgeClass === 'medium' ? 'gt-badge-warning'
      : resolved.badgeClass === 'high' ? 'gt-badge-danger'
      : resolved.badgeClass === 'critical' ? 'gt-badge-critical'
      : 'gt-badge-neutral';
    return {
      label: resolved.rating,
      fullLabel: resolved.fullLabel,
      cls
    };
  };

  // Transport coverage badge mapping (PHASE 8.11.1 Requirement 21)
  const getTransportCoverageBadge = (observed = 0) => {
    if (observed >= 4) {
      return { label: isEn ? 'Data Complete' : 'DATA LENGKAP', cls: 'gt-badge-pass' };
    }
    if (observed === 3) {
      return { label: isEn ? 'Data Mostly Available' : 'DATA SEBAGIAN BESAR TERSEDIA', cls: 'gt-badge-pass' };
    }
    if (observed >= 1) {
      return { label: isEn ? 'Partial Data' : 'DATA PARSIAL', cls: 'gt-badge-warning' };
    }
    return { label: isEn ? 'No Data' : 'DATA BELUM TERSEDIA', cls: 'gt-badge-neutral' };
  };

  const getReliabilityBadge = (
    rel: string,
    obs?: number,
    exp?: number,
    _pct?: number
  ) => {
    const obsVal = obs ?? 0;
    const expVal = exp ?? 0;
    const tooltip = isEn
      ? 'Indicates data completeness and quality, not the risk level.'
      : 'Menunjukkan kelengkapan dan kualitas data yang tersedia, bukan tingkat risiko.';

    switch (rel) {
      case 'measured':
        return {
          label: isEn ? `STRONG EVIDENCE (${obsVal}/${expVal} data available)` : `BUKTI KUAT (${obsVal}/${expVal} data tersedia)`,
          tooltip,
          bg: '#ecfdf5',
          color: '#047857',
          border: '#a7f3d0'
        };
      case 'partially_observed':
      case 'imputed_model_baseline':
        return {
          label: isEn ? `ADEQUATE EVIDENCE (${obsVal}/${expVal} data available)` : `BUKTI CUKUP (${obsVal}/${expVal} data tersedia)`,
          tooltip,
          bg: '#fffbeb',
          color: '#b45309',
          border: '#fde68a'
        };
      case 'insufficient_data':
      default:
        return {
          label: isEn ? `LIMITED DATA (${obsVal}/${expVal} data available)` : `DATA TERBATAS (${obsVal}/${expVal} data tersedia)`,
          tooltip,
          bg: '#f8fafc',
          color: '#64748b',
          border: '#cbd5e1'
        };
    }
  };

  const resolveSourceBadge = (item: ReportMetric) => {
    const isAssessmentStatus = item.type === 'assessment_status' || item.dataType === 'status' || item.status === 'status';
    if (isAssessmentStatus) {
      return {
        label: isEn ? 'Status' : 'Status',
        bg: '#f1f5f9',
        color: '#475569',
        border: '#cbd5e1'
      };
    }
    if (item.status === 'timeout') {
      return {
        label: isEn ? 'Timeout' : 'Waktu Habis',
        bg: '#fffbeb',
        color: '#b45309',
        border: '#fde68a'
      };
    }
    if (item.status === 'error') {
      return {
        label: isEn ? 'Error' : 'Gagal',
        bg: '#fef2f2',
        color: '#b91c1c',
        border: '#fecaca'
      };
    }
    if (item.status === 'bounded' || item.relation === 'greater_than' || item.spatialState === 'AVAILABLE_BOUNDED' || item.spatialState === 'NODATA_SEARCH_SUCCESS') {
      return {
        label: isEn ? 'Bounded' : 'Batas Spasial',
        bg: '#f8fafc',
        color: '#0369a1',
        border: '#bae6fd'
      };
    }

    const src = (item.source || '').toLowerCase();
    const id = (item.id || '').toLowerCase();

    // 1. Weather / Climate Reanalysis
    if (src.includes('era5') || src.includes('open-meteo') || src.includes('reanalysis') || src.includes('cams')) {
      return {
        label: isEn ? 'Model / Reanalysis' : 'Model / Reanalisis',
        bg: '#eff6ff',
        color: '#1d4ed8',
        border: '#bfdbfe'
      };
    }

    // 2. Elevation / Topography DEM
    if (src.includes('dem') || src.includes('copernicus') || id.includes('elevation') || id.includes('slope') || id.includes('relief') || id.includes('terrain')) {
      return {
        label: isEn ? 'Elevation Model' : 'Model Elevasi',
        bg: '#eff6ff',
        color: '#1d4ed8',
        border: '#bfdbfe'
      };
    }

    // 3. Hazard Model / PGA / CMIP6
    if (src.includes('pga') || src.includes('cmip6') || src.includes('penapisan') || item.type === 'model' || item.dataType === 'model') {
      return {
        label: isEn ? 'Model' : 'Model',
        bg: '#eff6ff',
        color: '#1d4ed8',
        border: '#bfdbfe'
      };
    }

    // 4. Regional baseline / ThinkHazard / BNPB
    if (src.includes('thinkhazard') || src.includes('world bank') || src.includes('inarisk') || src.includes('regional')) {
      return {
        label: isEn ? 'Regional' : 'Regional',
        bg: '#f5f3ff',
        color: '#6d28d9',
        border: '#ddd6fe'
      };
    }

    // 5. OpenStreetMap
    if (src.includes('osm') || src.includes('openstreetmap')) {
      return {
        label: isEn ? 'Map Data' : 'Data Peta',
        bg: '#f0fdf4',
        color: '#15803d',
        border: '#bbf7d0'
      };
    }

    // 6. Seismic Catalog
    if (src.includes('usgs') || src.includes('bmkg') || src.includes('katalog') || src.includes('emsc')) {
      return {
        label: isEn ? 'Recorded Quake History' : 'Riwayat Gempa Tercatat',
        bg: '#f8fafc',
        color: '#334155',
        border: '#cbd5e1'
      };
    }

    // 7. Derived / Calculated
    if (item.type === 'derived' || item.dataType === 'derived') {
      return {
        label: isEn ? 'Calculated' : 'Hasil Perhitungan',
        bg: '#f0f9ff',
        color: '#0369a1',
        border: '#bae6fd'
      };
    }

    // 8. Direct Field Measurement (Strictly in-situ only)
    if ((item.type as string) === 'measured' || (item.dataType as string) === 'measured' || src.includes('sensor') || src.includes('field') || src.includes('in-situ')) {
      return {
        label: isEn ? 'Measured' : 'Data Lapangan',
        bg: '#ecfdf5',
        color: '#047857',
        border: '#a7f3d0'
      };
    }

    return {
      label: isEn ? 'Source' : 'Sumber Data',
      bg: '#f8fafc',
      color: '#475569',
      border: '#cbd5e1'
    };
  };

  const renderSurveyGrid = (metrics: ReportMetric[]) => {
    return (
      <div className="gt-survey-matrix-grid">
        {metrics.map((item) => {
          const isAssessmentStatus = item.type === 'assessment_status' || item.dataType === 'status' || item.status === 'status';
          const isModelDerived = item.type === 'model' || item.type === 'derived' || item.dataType === 'model' || item.dataType === 'derived';
          const isTimeout = item.status === 'timeout';
          const isError = item.status === 'error';
          const isNotApplicable = item.status === 'not_applicable';

          return (
            <div
              key={item.id}
              className={`gt-survey-cell ${isAssessmentStatus ? 'gt-cell-status-mode' : isModelDerived ? 'gt-cell-model-mode' : 'gt-cell-source-mode'}`}
            >
              <div className="gt-cell-header-row" style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '6px' }}>
                <span className="gt-cell-label">{isEn ? item.labelEn : item.labelId}</span>
              </div>
              <div className="gt-cell-metric">
                {item.value !== null && item.value !== undefined ? (
                  <>
                    {item.value} {item.unit && <span className="gt-cell-unit">{item.unit}</span>}
                  </>
                ) : (
                  <span style={{ fontSize: '13px', color: isError || isTimeout ? '#b91c1c' : 'var(--text-muted)' }}>
                    {isTimeout
                      ? (isEn ? 'Service did not respond' : 'Layanan tidak merespons')
                      : isError
                      ? (isEn ? 'Data could not be obtained' : 'Data tidak dapat diperoleh')
                      : isNotApplicable
                      ? (isEn ? 'Not applicable for this site' : 'Tidak berlaku untuk lokasi ini')
                      : (isEn ? 'Data unavailable' : 'Data belum tersedia')}
                  </span>
                )}
              </div>
              <span className="gt-cell-source" title={item.sourceTitle || item.source}>
                {item.source}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const activePrimaryMetrics = ReportMetricRegistry.getPrimaryMetrics(activeTab, assessment, isEn);
  const allTechnicalMetrics = ReportMetricRegistry.getMetricsForCategory(activeTab, assessment, isEn);

  return (
    <div className="gt-luxury-matrix-card">
      {/* Tab Navigation Header */}
      <div className="gt-luxury-tabs-rail" role="tablist">
        {/* TAB 1: FLOOD */}
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'flood'}
          className={`gt-luxury-tab-item ${activeTab === 'flood' ? 'active' : ''}`}
          onClick={() => setActiveTab('flood')}
        >
          <div className="gt-luxury-tab-content">
            <div className="gt-luxury-tab-label-row">
              <Waves size={15} className="gt-tab-glyph" />
              <span className="gt-tab-name">{t.dashboard.cards.floodTitle}</span>
            </div>
            <span className={`gt-tab-rating-tag ${getGradeBadge(flood.score).cls}`}>
              {flood.rating || getGradeBadge(flood.score).label}
            </span>
          </div>
        </button>

        {/* TAB 2: SEISMIC */}
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'earthquake'}
          className={`gt-luxury-tab-item ${activeTab === 'earthquake' ? 'active' : ''}`}
          onClick={() => setActiveTab('earthquake')}
        >
          <div className="gt-luxury-tab-content">
            <div className="gt-luxury-tab-label-row">
              <Activity size={15} className="gt-tab-glyph" />
              <span className="gt-tab-name">{t.dashboard.cards.quakeTitle}</span>
            </div>
            <span className={`gt-tab-rating-tag ${getGradeBadge(quake.score).cls}`}>
              {quake.rating || getGradeBadge(quake.score).label}
            </span>
          </div>
        </button>

        {/* TAB 3: HEAT STRESS */}
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'heat'}
          className={`gt-luxury-tab-item ${activeTab === 'heat' ? 'active' : ''}`}
          onClick={() => setActiveTab('heat')}
        >
          <div className="gt-luxury-tab-content">
            <div className="gt-luxury-tab-label-row">
              <Flame size={15} className="gt-tab-glyph" />
              <span className="gt-tab-name">{t.dashboard.cards.heatTitle}</span>
            </div>
            <span className={`gt-tab-rating-tag ${getGradeBadge(heat.score).cls}`}>
              {heat.rating || getGradeBadge(heat.score).label}
            </span>
          </div>
        </button>

        {/* TAB 4: TRANSPORT */}
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'transport'}
          className={`gt-luxury-tab-item ${activeTab === 'transport' ? 'active' : ''}`}
          onClick={() => setActiveTab('transport')}
        >
          <div className="gt-luxury-tab-content">
            <div className="gt-luxury-tab-label-row">
              <Navigation size={15} className="gt-tab-glyph" />
              <span className="gt-tab-name">{t.dashboard.cards.transportTitle}</span>
            </div>
            {(() => {
              const accessRating = CanonicalRatingResolver.getAccessibilityRating(transport.score, language);
              const transportObserved = transport.observedComponents ?? (
                (transport.distanceToNearestRoadMeters !== null ? 1 : 0) +
                (transport.distanceToArterialMeters !== null || (transport.arterialBounded && transport.arterialBounded.state === 'AVAILABLE_BOUNDED') ? 1 : 0) +
                (transport.distanceToHospitalMeters !== null || (transport.hospitalBounded && transport.hospitalBounded.state === 'AVAILABLE_BOUNDED') ? 1 : 0) +
                (transport.distanceToTransitHubMeters !== null || (transport.transitBounded && transport.transitBounded.state === 'AVAILABLE_BOUNDED') ? 1 : 0)
              );
              const coverageBadge = getTransportCoverageBadge(transportObserved);
              const label = transport.score !== null ? (transport.rating || accessRating.rating) : coverageBadge.label;
              const cls = transport.score !== null
                ? (accessRating.badgeClass === 'low' ? 'gt-badge-pass' : accessRating.badgeClass === 'medium' ? 'gt-badge-warning' : accessRating.badgeClass === 'high' ? 'gt-badge-danger' : 'gt-badge-neutral')
                : coverageBadge.cls;
              return (
                <span className={`gt-tab-rating-tag ${cls}`}>
                  {label}
                </span>
              );
            })()}
          </div>
        </button>
      </div>

      {/* Stage Layout with Dynamic Adaptive Grid */}
      <div className="gt-luxury-stage-wrap">
        {/* TAB 1: FLOOD */}
        {activeTab === 'flood' && (
          <div className="gt-luxury-panel-layout">
            <div className="gt-primary-cards-container">
              {renderSurveyGrid(activePrimaryMetrics)}
            </div>

            {/* Right: Synthesis & Engineering Directive */}
            <div className="gt-luxury-directive-stack">
              <div className="gt-luxury-synthesis-box">
                <div className="gt-synthesis-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span className="gt-synthesis-kicker">{t.dashboard.cards.causeLabel}</span>
                    {(() => {
                      const badge = getReliabilityBadge(flood.scoreReliability, flood.observedComponents, flood.expectedComponents, flood.coveragePct);
                      return (
                        <span title={badge.tooltip} style={{ cursor: 'help', fontSize: '0.68rem', fontWeight: 600, padding: '2px 8px', borderRadius: '12px', background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                          {badge.label}
                        </span>
                      );
                    })()}
                  </div>
                  <p className="gt-synthesis-text">{isEn ? flood.causeEn : flood.causeId}</p>
                </div>
                <div className="gt-synthesis-divider" />
                <div className="gt-synthesis-item">
                  <span className="gt-synthesis-kicker">{t.dashboard.cards.impactLabel}</span>
                  <p className="gt-synthesis-text">{isEn ? flood.impactEn : flood.impactId}</p>
                </div>
              </div>

              <div className="gt-luxury-directive-card">
                <div className="gt-directive-header">
                  <ShieldCheck size={16} className="gt-directive-shield" />
                  <span>{t.dashboard.cards.recomLabel}</span>
                </div>
                <p className="gt-directive-body">{isEn ? flood.recomEn : flood.recomId}</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SEISMIC */}
        {activeTab === 'earthquake' && (
          <div className="gt-luxury-panel-layout">
            <div className="gt-primary-cards-container">
              {renderSurveyGrid(activePrimaryMetrics)}
            </div>

            {/* Right: Synthesis & Engineering Directive */}
            <div className="gt-luxury-directive-stack">
              <div className="gt-luxury-synthesis-box">
                <div className="gt-synthesis-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span className="gt-synthesis-kicker">{t.dashboard.cards.causeLabel}</span>
                    {(() => {
                      const badge = getReliabilityBadge(quake.scoreReliability, quake.observedComponents, quake.expectedComponents, quake.coveragePct);
                      return (
                        <span title={badge.tooltip} style={{ cursor: 'help', fontSize: '0.68rem', fontWeight: 600, padding: '2px 8px', borderRadius: '12px', background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                          {badge.label}
                        </span>
                      );
                    })()}
                  </div>
                  <p className="gt-synthesis-text">{isEn ? quake.causeEn : quake.causeId}</p>
                </div>
                <div className="gt-synthesis-divider" />
                <div className="gt-synthesis-item">
                  <span className="gt-synthesis-kicker">{t.dashboard.cards.impactLabel}</span>
                  <p className="gt-synthesis-text">{isEn ? quake.impactEn : quake.impactId}</p>
                </div>
              </div>

              <div className="gt-luxury-directive-card">
                <div className="gt-directive-header">
                  <ShieldCheck size={16} className="gt-directive-shield" />
                  <span>{t.dashboard.cards.recomLabel}</span>
                </div>
                <p className="gt-directive-body">{isEn ? quake.recomEn : quake.recomId}</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: HEAT STRESS */}
        {activeTab === 'heat' && (
          <div className="gt-luxury-panel-layout">
            <div className="gt-primary-cards-container">
              {renderSurveyGrid(activePrimaryMetrics)}
            </div>

            {/* Right: Synthesis & Engineering Directive */}
            <div className="gt-luxury-directive-stack">
              <div className="gt-luxury-synthesis-box">
                <div className="gt-synthesis-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span className="gt-synthesis-kicker">{t.dashboard.cards.causeLabel}</span>
                    {(() => {
                      const badge = getReliabilityBadge(heat.scoreReliability, heat.observedComponents, heat.expectedComponents, heat.coveragePct);
                      return (
                        <span title={badge.tooltip} style={{ cursor: 'help', fontSize: '0.68rem', fontWeight: 600, padding: '2px 8px', borderRadius: '12px', background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                          {badge.label}
                        </span>
                      );
                    })()}
                  </div>
                  <p className="gt-synthesis-text">{isEn ? heat.causeEn : heat.causeId}</p>
                </div>
                <div className="gt-synthesis-divider" />
                <div className="gt-synthesis-item">
                  <span className="gt-synthesis-kicker">{t.dashboard.cards.impactLabel}</span>
                  <p className="gt-synthesis-text">{isEn ? heat.impactEn : heat.impactId}</p>
                </div>
              </div>

              <div className="gt-luxury-directive-card">
                <div className="gt-directive-header">
                  <ShieldCheck size={16} className="gt-directive-shield" />
                  <span>{t.dashboard.cards.recomLabel}</span>
                </div>
                <p className="gt-directive-body">{isEn ? heat.recomEn : heat.recomId}</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: TRANSPORT */}
        {activeTab === 'transport' && (
          <div className="gt-luxury-panel-layout">
            <div className="gt-primary-cards-container">
              {renderSurveyGrid(activePrimaryMetrics)}
            </div>

            {/* Right: Synthesis & Engineering Directive */}
            <div className="gt-luxury-directive-stack">
              <div className="gt-luxury-synthesis-box">
                <div className="gt-synthesis-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span className="gt-synthesis-kicker">{t.dashboard.cards.causeLabel}</span>
                    {(() => {
                      const badge = getReliabilityBadge(transport.scoreReliability, transport.observedComponents, transport.expectedComponents, transport.coveragePct);
                      return (
                        <span title={badge.tooltip} style={{ cursor: 'help', fontSize: '0.68rem', fontWeight: 600, padding: '2px 8px', borderRadius: '12px', background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                          {badge.label}
                        </span>
                      );
                    })()}
                  </div>
                  <p className="gt-synthesis-text">
                    {isEn ? transport.causeEn : transport.causeId}
                  </p>
                </div>
                <div className="gt-synthesis-divider" />
                <div className="gt-synthesis-item">
                  <span className="gt-synthesis-kicker">{t.dashboard.cards.impactLabel}</span>
                  <p className="gt-synthesis-text">
                    {isEn ? transport.impactEn : transport.impactId}
                  </p>
                </div>
              </div>

              <div className="gt-luxury-directive-card">
                <div className="gt-directive-header">
                  <ShieldCheck size={16} className="gt-directive-shield" />
                  <span>{t.dashboard.cards.accessRecomLabel}</span>
                </div>
                <p className="gt-directive-body">{isEn ? transport.recomEn : transport.recomId}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* TECHNICAL DETAILS & DATA LINEAGE MODAL */}
      {isMounted && showTechnicalModal && typeof document !== 'undefined' && createPortal(
        <div
          className="gt-modal-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            padding: '20px'
          }}
          onClick={() => setShowTechnicalModal(false)}
        >
          <div
            className="gt-modal-surface"
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '840px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e2e8f0',
              padding: '24px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '8px', borderRadius: '10px', background: '#eff6ff', color: '#1d4ed8' }}>
                  <FileText size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    {isEn ? `Basis of Assessment & Data Details: ${activeTab.toUpperCase()}` : `Dasar Penilaian & Detail Data: ${activeTab.toUpperCase()}`}
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '2px 0 0 0' }}>
                    {isEn ? 'Complete verified spatial metrics, data resolutions, and methodology notes.' : 'Seluruh metrik spasial terverifikasi, resolusi dataset, dan catatan metodologi.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTechnicalModal(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '6px', borderRadius: '6px' }}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content: Parameter Table / Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {allTechnicalMetrics.map((param) => (
                <div
                  key={param.id}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '14px 16px',
                    background: '#f8fafc'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <div>
                      <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a' }}>
                        {isEn ? param.labelEn : param.labelId}
                      </span>
                      <span style={{ marginLeft: '8px', fontSize: '0.72rem', padding: '2px 6px', borderRadius: '4px', background: '#e2e8f0', color: '#475569', fontWeight: 600 }}>
                        {param.type}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: param.value ? '#0f172a' : '#94a3b8' }}>
                      {param.value !== null ? `${param.value} ${param.unit || ''}` : (isEn ? 'Data unavailable' : 'Data belum tersedia')}
                    </div>
                  </div>

                  <p style={{ fontSize: '0.82rem', color: '#475569', margin: '4px 0 8px 0', lineHeight: 1.5 }}>
                    {isEn ? param.descriptionEn : param.descriptionId}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.75rem', color: '#64748b', borderTop: '1px dashed #cbd5e1', paddingTop: '6px' }}>
                    <span><strong>{isEn ? 'Source:' : 'Sumber:'}</strong> {param.source}</span>
                    {param.spatialResolution && (
                      <span><strong>{isEn ? 'Resolution:' : 'Resolusi:'}</strong> {param.spatialResolution}</span>
                    )}
                    <span><strong>{isEn ? 'Status:' : 'Status:'}</strong> {param.status}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Glossary Box (Requirement 20) */}
            <div style={{ marginTop: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Layers size={15} style={{ color: '#0284c7' }} />
                <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a' }}>
                  {isEn ? 'Key Technical Terminology Glossary' : 'Glosarium Istilah Teknis Utama'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px 14px', fontSize: '0.76rem', color: '#475569', lineHeight: 1.45 }}>
                <div><strong>dpl / MSL:</strong> {isEn ? 'Meters above Mean Sea Level, vertical site elevation.' : 'Meter di atas permukaan laut, elevasi vertikal tapak.'}</div>
                <div><strong>PGA:</strong> {isEn ? 'Peak Ground Acceleration (g), maximum seismic ground shaking.' : 'Percepatan tanah puncak (g), intensitas guncangan gempa.'}</div>
                <div><strong>DAS:</strong> {isEn ? 'River Watershed / Drainage Basin catchment boundary.' : 'Daerah Aliran Sungai, batas tangkapan air limpasan hujan.'}</div>
                <div><strong>KDH:</strong> {isEn ? 'Green Space Ratio (%), permeable vegetative canopy.' : 'Koefisien Dasar Hijau (%), persentase area terbuka bervegetasi.'}</div>
                <div><strong>Urban Heat Island:</strong> {isEn ? 'Thermal phenomenon where built structures trap heat.' : 'Fenomena termal area terbangun menyerap dan memerangkap panas.'}</div>
                <div><strong>Buffer:</strong> {isEn ? 'Radial spatial search radius for environmental screening.' : 'Radius jarak penapisan geospasial radial dari tapak properti.'}</div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                {isEn ? 'Data processed through GoResilio Open-Source Multi-Hazard Pipeline.' : 'Diproses melalui Pipeline Multi-Hazard Open-Source GoResilio.'}
              </span>
              <button
                type="button"
                onClick={() => setShowTechnicalModal(false)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  background: '#0f172a',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {isEn ? 'Close' : 'Tutup'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default HazardCard;

