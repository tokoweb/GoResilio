import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAssessment } from '../../context/AssessmentContext';
import { FileSpreadsheet, Download } from 'lucide-react';

export const ReportSteps: React.FC = () => {
  const { language, t } = useLanguage();
  const { setIsReportModalOpen } = useAssessment();
  const isEn = language === 'en';

  return (
    <section className="report-structure-wrapper" id="report-structure">
      <div className="gt-luxury-dossier-slab" style={{ textAlign: 'center', padding: '48px 32px' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: '#fff7ed',
            color: '#ea580c',
            border: '1px solid #ffedd5',
            marginBottom: '16px'
          }}>
            <FileSpreadsheet size={24} />
          </div>

          <h3 style={{ fontSize: '1.65rem', fontWeight: 700, color: '#0f172a', marginBottom: '10px' }}>
            {t.reportSteps.title}
          </h3>

          <p style={{ fontSize: '0.98rem', color: '#64748b', lineHeight: 1.6, marginBottom: '28px' }}>
            {isEn
              ? 'Download a sample of our comprehensive 11-page property risk assessment report covering multi-hazard evaluation, spatial site profiling, evacuation routing, and structured mitigation roadmaps.'
              : 'Unduh sampel laporan lengkap analisis risiko properti 11 halaman mencakup penilaian multi-hazard, profil geospasial tapak, rute evakuasi, dan rencana mitigasi terstruktur.'}
          </p>

          <button
            type="button"
            className="gt-download-sample-btn"
            onClick={() => window.open('/api/reports/sample', '_blank')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 28px',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '0.95rem',
              border: '1px solid #334155',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(15, 23, 42, 0.15)',
              transition: 'all 0.2s ease'
            }}
          >
            <Download size={18} />
            <span>{t.reportSteps.downloadBtn || (isEn ? 'Download Sample Report' : 'Download Sample Report')}</span>
          </button>
        </div>
      </div>
    </section>
  );
};
