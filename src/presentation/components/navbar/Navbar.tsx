'use client';

import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useLanguage } from '../../context/LanguageContext';
import { useAssessment } from '../../context/AssessmentContext';
import { ClientLoginModal } from '../modal/ClientLoginModal';
import {
  FileText,
  User,
  ArrowUpRight,
  Menu,
  X,
  ChevronRight,
  Activity,
  Layers,
  CreditCard,
  CalendarCheck,
  Globe,
  MapPin,
  LogOut,
  Sparkles
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const {
    setIsReportModalOpen,
    handleDownloadReportRequest,
    isLoginModalOpen,
    setIsLoginModalOpen,
    currentView,
    setCurrentView,
    isLoggedIn,
    activeAccountRole,
    logout
  } = useAssessment();

  const isEn = language === 'en';

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'dashboard' | 'pricing' | 'report-structure' | 'book-demo'>('dashboard');
  const headerRef = useRef<HTMLElement | null>(null);

  // Scroll listener for sticky state & active section tracking
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 25;
      setScrolled(isScrolled);

      if (currentView === 'public') {
        const sections = ['dashboard', 'report-structure', 'pricing', 'book-demo'];
        const scrollPos = window.scrollY + 120;

        for (const sectionId of sections) {
          const el = document.getElementById(sectionId);
          if (el) {
            const top = el.offsetTop;
            const height = el.offsetHeight;
            if (scrollPos >= top && scrollPos < top + height) {
              setActiveSection(sectionId as any);
              break;
            }
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentView]);

  // Entrance animation for header
  useEffect(() => {
    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current,
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
      );
    }
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const scrollTo = (id: string) => {
    setMobileOpen(false);
    if (currentView === 'account') {
      setCurrentView('public');
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          const headerOffset = 70;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
      }, 100);
      return;
    }

    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 70;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const handlePortalClick = () => {
    setMobileOpen(false);
    if (isLoggedIn) {
      setCurrentView(currentView === 'account' ? 'public' : 'account');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setIsLoginModalOpen(true);
    }
  };

  return (
    <>
      <header
        ref={headerRef}
        className={`gt-editorial-header ${scrolled ? 'gt-editorial-header--scrolled' : ''}`}
      >
        <div className="gt-editorial-grid">
          {/* 1. Left Wing: Navigation Links */}
          <nav className="gt-nav-wing-left" aria-label="Main Navigation">
            {currentView === 'account' ? (
              <>
                <button
                  type="button"
                  onClick={() => setCurrentView('public')}
                  className="gt-nav-link-pure"
                >
                  <MapPin size={13} style={{ marginRight: '5px' }} />
                  <span>{isEn ? 'Site Risk Map' : 'Peta Skrining Lokasi'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="gt-nav-link-pure gt-nav-link-pure--active"
                >
                  <User size={13} style={{ marginRight: '5px' }} />
                  <span>{isEn ? 'Portfolio & Workspace' : 'Portofolio & Workspace'}</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => scrollTo('dashboard')}
                  className={`gt-nav-link-pure ${activeSection === 'dashboard' ? 'gt-nav-link-pure--active' : ''}`}
                >
                  <span>{t.nav.riskScan}</span>
                </button>

                <button
                  type="button"
                  onClick={() => scrollTo('report-structure')}
                  className={`gt-nav-link-pure ${activeSection === 'report-structure' ? 'gt-nav-link-pure--active' : ''}`}
                >
                  <span>{t.nav.reportStructure}</span>
                </button>

                <button
                  type="button"
                  onClick={() => scrollTo('pricing')}
                  className={`gt-nav-link-pure ${activeSection === 'pricing' ? 'gt-nav-link-pure--active' : ''}`}
                >
                  <span>{t.nav.pricing}</span>
                </button>

                <button
                  type="button"
                  onClick={() => scrollTo('book-demo')}
                  className={`gt-nav-link-pure ${activeSection === 'book-demo' ? 'gt-nav-link-pure--active' : ''}`}
                >
                  <span>{t.nav.bookDemo}</span>
                </button>
              </>
            )}
          </nav>

          {/* 2. Center Focal: Brand Identity */}
          <div
            className="gt-nav-center-brand"
            onClick={() => {
              if (currentView === 'account') {
                setCurrentView('public');
              } else {
                scrollTo('hero');
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="gt-brand-mark">
              <img
                src="/assets/logo.svg"
                alt="GoTangguh"
                className="gt-brand-mark__img"
              />
            </div>
            <div className="gt-brand-wordmark">
              <span className="gt-wordmark__go">Go</span>
              <span className="gt-wordmark__tangguh">Tangguh</span>
            </div>
          </div>

          {/* 3. Right Wing: Utilities & Editorial Signature CTA */}
          <div className="gt-nav-wing-right">
            {/* Minimalist Language Switcher */}
            <div className="gt-lang-minimalist">
              <button
                type="button"
                className={`gt-lang-choice-btn ${language === 'id' ? 'active' : ''}`}
                onClick={() => setLanguage('id')}
              >
                ID
              </button>
              <span className="gt-lang-choice-slash">/</span>
              <button
                type="button"
                className={`gt-lang-choice-btn ${language === 'en' ? 'active' : ''}`}
                onClick={() => setLanguage('en')}
              >
                EN
              </button>
            </div>

            {/* Sample Report Trigger */}
            <button
              type="button"
              className="gt-nav-text-btn"
              onClick={handleDownloadReportRequest}
              title={t.nav.sampleReportBtn}
            >
              <FileText size={13} />
              <span>{t.nav.sampleReportBtn}</span>
            </button>

            {/* Client Portal / My Account Toggle */}
            <button
              type="button"
              className={`gt-nav-text-btn ${currentView === 'account' ? 'gt-nav-link-pure--active' : ''}`}
              onClick={handlePortalClick}
              title={isLoggedIn ? (isEn ? 'My Account / Workspace' : 'Akun Saya / Workspace') : t.nav.loginBtn}
            >
              <User size={13} />
              <span>{isLoggedIn ? (currentView === 'account' ? (isEn ? 'Back to Map' : 'Kembali ke Peta') : (isEn ? `Account (${activeAccountRole})` : `Akun (${activeAccountRole})`)) : t.nav.loginBtn}</span>
            </button>

            {/* Editorial Luxury Signature Action CTA */}
            <button
              type="button"
              className="gt-editorial-cta"
              onClick={() => scrollTo('book-demo')}
            >
              <span>{t.nav.scheduleDemoBtn}</span>
              <ArrowUpRight size={13} className="gt-editorial-cta__arrow" />
            </button>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              className="gt-nav-mobile-trigger"
              onClick={() => setMobileOpen(true)}
              aria-label={isEn ? 'Open Menu' : 'Buka Menu'}
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Curated Drawer Sheet (Mounted outside header at root level) */}
      {mobileOpen && (
        <div className="gt-sheet-overlay" onClick={() => setMobileOpen(false)}>
          <div className="gt-sheet-modal" onClick={(e) => e.stopPropagation()}>
            {/* 1. Header Bar */}
            <div className="gt-sheet-head">
              <div className="gt-sheet-brand-row">
                <div className="gt-sheet-logo-box">
                  <img src="/assets/logo.svg" alt="GoTangguh" className="gt-sheet-logo-img" />
                </div>
                <div className="gt-sheet-wordmark">
                  <span className="gt-sheet-go">Go</span>
                  <span className="gt-sheet-tangguh">Tangguh</span>
                </div>
              </div>
              <button
                type="button"
                className="gt-sheet-close-btn"
                onClick={() => setMobileOpen(false)}
                aria-label={isEn ? 'Close Menu' : 'Tutup Menu'}
              >
                <X size={18} />
              </button>
            </div>

            {/* 2. Language Switcher Bar */}
            <div className="gt-sheet-lang-wrap">
              <div className="gt-sheet-lang-pill-row">
                <button
                  type="button"
                  className={`gt-sheet-lang-pill ${language === 'id' ? 'active' : ''}`}
                  onClick={() => setLanguage('id')}
                >
                  <Globe size={13} />
                  <span>Bahasa Indonesia</span>
                </button>
                <button
                  type="button"
                  className={`gt-sheet-lang-pill ${language === 'en' ? 'active' : ''}`}
                  onClick={() => setLanguage('en')}
                >
                  <span>English</span>
                </button>
              </div>
            </div>

            {/* 3. Navigation Links List */}
            <div className="gt-sheet-nav-body">
              {currentView === 'account' ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      setCurrentView('public');
                    }}
                    className="gt-sheet-nav-item"
                  >
                    <div className="gt-sheet-nav-left">
                      <MapPin size={17} className="gt-sheet-nav-icon" />
                      <span>{isEn ? 'Site Risk Map' : 'Peta Skrining Lokasi'}</span>
                    </div>
                    <ChevronRight size={15} className="gt-sheet-nav-arrow" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="gt-sheet-nav-item"
                  >
                    <div className="gt-sheet-nav-left">
                      <User size={17} className="gt-sheet-nav-icon" />
                      <span>{isEn ? `Portfolio (${activeAccountRole})` : `Portofolio (${activeAccountRole})`}</span>
                    </div>
                    <ChevronRight size={15} className="gt-sheet-nav-arrow" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => scrollTo('dashboard')}
                    className="gt-sheet-nav-item"
                  >
                    <div className="gt-sheet-nav-left">
                      <Activity size={17} className="gt-sheet-nav-icon" />
                      <span>{t.nav.riskScan}</span>
                    </div>
                    <ChevronRight size={15} className="gt-sheet-nav-arrow" />
                  </button>

                  <button
                    type="button"
                    onClick={() => scrollTo('report-structure')}
                    className="gt-sheet-nav-item"
                  >
                    <div className="gt-sheet-nav-left">
                      <Layers size={17} className="gt-sheet-nav-icon" />
                      <span>{t.nav.reportStructure}</span>
                    </div>
                    <ChevronRight size={15} className="gt-sheet-nav-arrow" />
                  </button>

                  <button
                    type="button"
                    onClick={() => scrollTo('pricing')}
                    className="gt-sheet-nav-item"
                  >
                    <div className="gt-sheet-nav-left">
                      <CreditCard size={17} className="gt-sheet-nav-icon" />
                      <span>{t.nav.pricing}</span>
                    </div>
                    <ChevronRight size={15} className="gt-sheet-nav-arrow" />
                  </button>

                  <button
                    type="button"
                    onClick={() => scrollTo('book-demo')}
                    className="gt-sheet-nav-item"
                  >
                    <div className="gt-sheet-nav-left">
                      <CalendarCheck size={17} className="gt-sheet-nav-icon" />
                      <span>{t.nav.bookDemo}</span>
                    </div>
                    <ChevronRight size={15} className="gt-sheet-nav-arrow" />
                  </button>
                </>
              )}
            </div>

            {/* 4. Bottom Action Buttons */}
            <div className="gt-sheet-foot">
              <div className="gt-sheet-secondary-grid">
                <button
                  type="button"
                  className="gt-sheet-btn-secondary"
                  onClick={handlePortalClick}
                >
                  <User size={14} />
                  <span>{isLoggedIn ? (isEn ? 'My Account' : 'Akun Saya') : t.nav.loginBtn}</span>
                </button>

                <button
                  type="button"
                  className="gt-sheet-btn-secondary"
                  onClick={() => {
                    setMobileOpen(false);
                    handleDownloadReportRequest();
                  }}
                >
                  <FileText size={14} />
                  <span>{t.nav.sampleReportBtn}</span>
                </button>
              </div>

              <button
                type="button"
                className="gt-sheet-cta-primary"
                onClick={() => scrollTo('book-demo')}
              >
                <span>{t.nav.scheduleDemoBtn}</span>
                <ArrowUpRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client Portal Login Modal */}
      <ClientLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </>
  );
};

export default Navbar;
