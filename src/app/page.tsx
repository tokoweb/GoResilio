'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useLanguage } from '../presentation/context/LanguageContext';
import { useAssessment } from '../presentation/context/AssessmentContext';
import { Navbar } from '../presentation/components/navbar/Navbar';
import { HeroSection } from '../presentation/components/hero/HeroSection';
import { HazardCard } from '../presentation/components/dashboard/HazardCard';
import { OverallGauge } from '../presentation/components/dashboard/OverallGauge';
import { PersonaInsight } from '../presentation/components/dashboard/PersonaInsight';
import { PricingSection } from '../presentation/components/pricing/PricingSection';
import { BookDemoSection } from '../presentation/components/demo/BookDemoSection';
import { ReportSteps } from '../presentation/components/report_structure/ReportSteps';
import { GroundsureReportModal } from '../presentation/components/modal/GroundsureReportModal';
import { InstantReportPaymentModal } from '../presentation/components/modal/InstantReportPaymentModal';
import { ClientLoginModal } from '../presentation/components/modal/ClientLoginModal';
import { MyAccountDashboard } from '../presentation/components/account/MyAccountDashboard';
import { AdminManagementConsole } from '../presentation/components/admin/AdminManagementConsole';

// Dynamic SSR-safe import for Leaflet Map component
const MapViewer = dynamic(
  () => import('../presentation/components/dashboard/MapViewer').then((mod) => mod.MapViewer),
  {
    ssr: false,
    loading: () => (
      <div style={{ height: '100%', minHeight: '440px', background: '#e8e4db', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '16px', color: '#64748b', fontSize: '0.85rem' }}>
        <span>Memuat Peta Spasial & Informasi Bahaya...</span>
      </div>
    )
  }
);

export default function HomePage() {
  const { t } = useLanguage();
  const {
    currentView,
    activeAccountRole,
    isLoginModalOpen,
    setIsLoginModalOpen,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    setIsReportModalOpen
  } = useAssessment();

  const isAdmin = (activeAccountRole as string) === 'Admin' || activeAccountRole === 'Super Admin (RDI)';

  return (
    <div className="app-root-container">
      {/* Top Fixed Header Navbar */}
      <Navbar />

      {/* Main Multi-Role Switcher View */}
      {currentView === 'account' ? (
        isAdmin ? (
          <AdminManagementConsole />
        ) : (
          <MyAccountDashboard />
        )
      ) : (
        <>
          {/* Hero Section & Search Address Filter */}
          <HeroSection />

          {/* Monolithic Spatial Due Diligence Console */}
          <section className="gt-console-section" id="dashboard">
            <div className="gt-console-container">
              {/* Row 1: Interactive Map (58%) + Executive Risk Score Dial (42%) */}
              <div className="gt-console-spatial-row">
                <div className="gt-console-map-pane">
                  <MapViewer />
                </div>
                <div className="gt-console-summary-pane">
                  <OverallGauge />
                  <PersonaInsight />
                </div>
              </div>

              {/* Row 2: 4-Pillar Due Diligence Hazard Dossier (Banjir, Gempa, Heat, Angin) */}
              <div className="gt-console-dossier-row">
                <HazardCard />
              </div>
            </div>
          </section>

          {/* Pricing Tiers Section */}
          <PricingSection />

          {/* B2B Consultation & Demo Scheduling */}
          <BookDemoSection />

          {/* 4-Step 14-Page Groundsure Report Summary */}
          <ReportSteps />
        </>
      )}

      {/* 14-Page Groundsure Style Full Report Modal */}
      <GroundsureReportModal />

      {/* Paywall Instant Report Checkout Modal */}
      <InstantReportPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onPaymentSuccess={() => {
          setIsPaymentModalOpen(false);
          setIsReportModalOpen(true);
        }}
      />

      {/* Global Auth Login & Register Modal */}
      <ClientLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      {/* Application Footer */}
      <footer className="app-footer">
        <p>{t.footer.copyright}</p>
      </footer>
    </div>
  );
}
