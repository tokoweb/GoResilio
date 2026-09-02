'use client';

import React from 'react';
import { Navbar } from '../../../presentation/components/navbar/Navbar';
import { ReportSteps } from '../../../presentation/components/report_structure/ReportSteps';
import { GroundsureReportModal } from '../../../presentation/components/modal/GroundsureReportModal';
import { useLanguage } from '../../../presentation/context/LanguageContext';

export default function ReportDetailPage({ params }: { params: { id: string } }) {
  const { t } = useLanguage();

  return (
    <div className="app-root-container">
      <Navbar />
      <div style={{ paddingTop: '90px' }}>
        <ReportSteps />
      </div>
      <GroundsureReportModal />
      <footer className="app-footer">
        <p>{t.footer.copyright}</p>
      </footer>
    </div>
  );
}
