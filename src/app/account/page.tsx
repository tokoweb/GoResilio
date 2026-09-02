'use client';

import React from 'react';
import { Navbar } from '../../presentation/components/navbar/Navbar';
import { MyAccountDashboard } from '../../presentation/components/account/MyAccountDashboard';
import { GroundsureReportModal } from '../../presentation/components/modal/GroundsureReportModal';
import { useLanguage } from '../../presentation/context/LanguageContext';

export default function AccountPage() {
  const { t } = useLanguage();

  return (
    <div className="app-root-container">
      <Navbar />
      <MyAccountDashboard />
      <GroundsureReportModal />
      <footer className="app-footer">
        <p>{t.footer.copyright}</p>
      </footer>
    </div>
  );
}
