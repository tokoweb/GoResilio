'use client';

import React from 'react';
import { Navbar } from '../../presentation/components/navbar/Navbar';
import { BookDemoSection } from '../../presentation/components/demo/BookDemoSection';
import { GroundsureReportModal } from '../../presentation/components/modal/GroundsureReportModal';
import { useLanguage } from '../../presentation/context/LanguageContext';

export default function BookingPage() {
  const { t } = useLanguage();

  return (
    <div className="app-root-container">
      <Navbar />
      <div style={{ paddingTop: '80px' }}>
        <BookDemoSection />
      </div>
      <GroundsureReportModal />
      <footer className="app-footer">
        <p>{t.footer.copyright}</p>
      </footer>
    </div>
  );
}
