'use client';

import React from 'react';
import { Navbar } from '../../presentation/components/navbar/Navbar';
import { PricingSection } from '../../presentation/components/pricing/PricingSection';
import { GroundsureReportModal } from '../../presentation/components/modal/GroundsureReportModal';
import { useLanguage } from '../../presentation/context/LanguageContext';

export default function PricingPage() {
  const { t } = useLanguage();

  return (
    <div className="app-root-container">
      <Navbar />
      <div style={{ paddingTop: '80px' }}>
        <PricingSection />
      </div>
      <GroundsureReportModal />
      <footer className="app-footer">
        <p>{t.footer.copyright}</p>
      </footer>
    </div>
  );
}
