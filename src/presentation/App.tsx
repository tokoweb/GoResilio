import React from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AssessmentProvider, useAssessment } from './context/AssessmentContext';
import { Navbar } from './components/navbar/Navbar';
import { HeroSection } from './components/hero/HeroSection';
import { MapViewer } from './components/dashboard/MapViewer';
import { HazardCard } from './components/dashboard/HazardCard';
import { OverallGauge } from './components/dashboard/OverallGauge';
import { PersonaInsight } from './components/dashboard/PersonaInsight';
import { PricingSection } from './components/pricing/PricingSection';
import { BookDemoSection } from './components/demo/BookDemoSection';
import { ReportSteps } from './components/report_structure/ReportSteps';
import { GroundsureReportModal } from './components/modal/GroundsureReportModal';
import { MyAccountDashboard } from './components/account/MyAccountDashboard';

import './styles/theme.css';
import './styles/app.css';
import './styles/print_report.css';

const MainLayout: React.FC = () => {
  const { t, language } = useLanguage();
  const { currentView } = useAssessment();

  return (
    <div className="app-root-container">
      {/* Top Navbar */}
      <Navbar />

      {/* View Switcher: My Account Portal vs Public Screening */}
      {currentView === 'account' ? (
        <MyAccountDashboard />
      ) : (
        <>
          {/* Hero & Search Filters */}
          <HeroSection />

          {/* Main Dashboard Section: Monolithic Spatial Due Diligence Console */}
          <section className="gt-console-section" id="dashboard">
            <div className="gt-console-container">
              {/* Row 1: Interactive GIS Map Viewport (Left 58%) + Executive Score & Role Intelligence (Right 42%) */}
              <div className="gt-console-spatial-row">
                <div className="gt-console-map-pane">
                  <MapViewer />
                </div>
                <div className="gt-console-summary-pane">
                  <OverallGauge />
                  <PersonaInsight />
                </div>
              </div>

              {/* Row 2: Full-Width 4-Pillar Multi-Hazard Due Diligence Dossier */}
              <div className="gt-console-dossier-row">
                <HazardCard />
              </div>
            </div>
          </section>

          {/* Pricing Plans */}
          <PricingSection />

          {/* B2B Demo Scheduling */}
          <BookDemoSection />

          {/* 4-Step 10-14 Page Report Summary */}
          <ReportSteps />
        </>
      )}

      {/* Groundsure / JBA Sample Report Modal */}
      <GroundsureReportModal />

      {/* Footer */}
      <footer className="app-footer">
        <p style={{ maxWidth: '840px', margin: '0 auto 8px', fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5 }}>
          {language === 'en'
            ? 'Disclaimer: This analysis serves as an initial screening indicator based on public spatial data and does not replace technical due diligence, soil investigation, or professional structural audit.'
            : 'Disclaimer: Analisis ini merupakan indikator penapisan awal berbasis data spasial publik dan tidak menggantikan uji tuntas teknis, penyelidikan tanah, atau audit struktural profesional.'}
        </p>
        <p>{t.footer.copyright}</p>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AssessmentProvider>
        <MainLayout />
      </AssessmentProvider>
    </LanguageProvider>
  );
};

export default App;
