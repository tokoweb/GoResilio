import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAssessment } from '../../context/AssessmentContext';
import { Check, ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { normalizeUserTier, UserTier, isPaidUser } from '../../../domain/types/UserTier';

export const PricingSection: React.FC = () => {
  const { language, t } = useLanguage();
  const { currentUser, activeAccountRole, openPaymentModal, setCurrentView } = useAssessment();
  const isEn = language === 'en';

  const userTier = normalizeUserTier(currentUser?.tierLevel);
  const isPaid = isPaidUser(currentUser?.tierLevel, activeAccountRole);

  const isFreeCurrent = !isPaid;
  const isInstantCurrent = userTier === UserTier.INSTANT_PRO;
  const isBundlingCurrent = userTier === UserTier.BUNDLING_PRO;
  const isEnterpriseCurrent = userTier === UserTier.ENTERPRISE || userTier === UserTier.ADMIN;

  // Has at least Instant Pro or higher
  const hasInstantAccess = isInstantCurrent || isBundlingCurrent || isEnterpriseCurrent;
  // Has at least Bundling Pro or higher
  const hasBundlingAccess = isBundlingCurrent || isEnterpriseCurrent;

  const scrollToDemo = () => {
    const el = document.getElementById('book-demo');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToDashboard = () => {
    const el = document.getElementById('hero');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const goToAccountPortfolio = () => {
    setCurrentView('account');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="gt-pricing-section" id="pricing">
      <div className="gt-pricing-header-center">
        <h2 className="gt-pricing-main-title">{t.pricing.title}</h2>
        <p className="gt-pricing-sub-title">{t.pricing.subtitle}</p>
      </div>

      <div className="gt-pricing-deck-grid">
        {/* Tier 1: Free */}
        <div className={`gt-pricing-tier-card ${isFreeCurrent ? 'gt-tier-card--current' : ''}`}>
          {isFreeCurrent && (
            <div className="gt-tier-active-badge">
              <CheckCircle2 size={12} />
              <span>{isEn ? 'Active Plan' : 'Paket Aktif'}</span>
            </div>
          )}
          <div className="gt-tier-top-info">
            <h3 className="gt-tier-name">{t.pricing.free.title}</h3>
            <p className="gt-tier-desc">{t.pricing.free.desc}</p>
          </div>

          <div className="gt-tier-body-wrap">
            <ul className="gt-tier-features">
              {t.pricing.free.features.map((f, i) => (
                <li key={i}>
                  <Check size={15} className="gt-tier-check-icon" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              className={`gt-tier-action-btn ${isFreeCurrent ? 'gt-tier-action-btn--current' : ''}`}
              onClick={scrollToDashboard}
            >
              {isFreeCurrent ? (
                <>
                  <CheckCircle2 size={15} style={{ color: '#16a34a' }} />
                  <span>{isEn ? 'Your Current Plan' : 'Paket Anda Saat Ini'}</span>
                </>
              ) : (
                <span>{t.pricing.free.btn}</span>
              )}
            </button>
          </div>
        </div>

        {/* Tier 2: Instant PDF (Featured Monolith) */}
        <div className={`gt-pricing-tier-card gt-tier-card--featured ${isInstantCurrent ? 'gt-tier-card--active-border' : ''}`}>
          {isInstantCurrent ? (
            <div className="gt-tier-active-badge">
              <CheckCircle2 size={12} />
              <span>{isEn ? 'Active Plan' : 'Paket Aktif'}</span>
            </div>
          ) : (
            <div className="gt-tier-recommend-tag">{t.pricing.instant.badge}</div>
          )}
          <div className="gt-tier-top-info">
            <h3 className="gt-tier-name">{t.pricing.instant.title}</h3>
            <p className="gt-tier-desc">{t.pricing.instant.desc}</p>
          </div>

          <div className="gt-tier-body-wrap">
            <ul className="gt-tier-features">
              {t.pricing.instant.features.map((f, i) => (
                <li key={i}>
                  <Check size={15} className="gt-tier-check-icon" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            {isInstantCurrent ? (
              <button
                type="button"
                className="gt-tier-action-btn gt-tier-action-btn--active"
                onClick={goToAccountPortfolio}
              >
                <CheckCircle2 size={15} />
                <span>{isEn ? 'Your Current Plan' : 'Paket Anda Saat Ini'}</span>
              </button>
            ) : hasBundlingAccess ? (
              <button
                type="button"
                className="gt-tier-action-btn"
                onClick={goToAccountPortfolio}
                style={{ background: '#f0fdf4', color: '#15803d', borderColor: '#bbf7d0' }}
              >
                <CheckCircle2 size={15} />
                <span>{isEn ? 'Included in Your Plan' : 'Termasuk di Paket Anda'}</span>
              </button>
            ) : (
              <button
                type="button"
                className="gt-tier-action-btn gt-tier-action-btn--primary"
                onClick={() => openPaymentModal('instant')}
              >
                <span>{t.pricing.instant.btn}</span>
                <ArrowRight size={14} className="gt-btn-arrow-subtle" />
              </button>
            )}
          </div>
        </div>

        {/* Tier 3: Bundling 1 (Bandingkan 3 Properti) */}
        <div className={`gt-pricing-tier-card ${isBundlingCurrent ? 'gt-tier-card--active-border' : ''}`}>
          {isBundlingCurrent && (
            <div className="gt-tier-active-badge">
              <CheckCircle2 size={12} />
              <span>{isEn ? 'Active Plan' : 'Paket Aktif'}</span>
            </div>
          )}
          <div className="gt-tier-top-info">
            <h3 className="gt-tier-name">{t.pricing.lite.title}</h3>
            <p className="gt-tier-desc">{t.pricing.lite.desc}</p>
          </div>

          <div className="gt-tier-body-wrap">
            <ul className="gt-tier-features">
              {t.pricing.lite.features.map((f, i) => (
                <li key={i}>
                  <Check size={15} className="gt-tier-check-icon" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            {isBundlingCurrent ? (
              <button
                type="button"
                className="gt-tier-action-btn gt-tier-action-btn--active"
                onClick={goToAccountPortfolio}
              >
                <CheckCircle2 size={15} />
                <span>{isEn ? 'Your Current Plan' : 'Paket Anda Saat Ini'}</span>
              </button>
            ) : isEnterpriseCurrent ? (
              <button
                type="button"
                className="gt-tier-action-btn"
                onClick={goToAccountPortfolio}
                style={{ background: '#f0fdf4', color: '#15803d', borderColor: '#bbf7d0' }}
              >
                <CheckCircle2 size={15} />
                <span>{isEn ? 'Included in Enterprise' : 'Termasuk di Enterprise'}</span>
              </button>
            ) : (
              <button
                type="button"
                className="gt-tier-action-btn"
                onClick={() => openPaymentModal('bundling')}
              >
                <span>{t.pricing.lite.btn}</span>
                <ArrowRight size={14} className="gt-btn-arrow-subtle" />
              </button>
            )}
          </div>
        </div>

        {/* Tier 4: B2B Consultation */}
        <div className={`gt-pricing-tier-card ${isEnterpriseCurrent ? 'gt-tier-card--active-border' : ''}`}>
          {isEnterpriseCurrent && (
            <div className="gt-tier-active-badge">
              <CheckCircle2 size={12} />
              <span>{isEn ? 'Enterprise Active' : 'Enterprise Aktif'}</span>
            </div>
          )}
          <div className="gt-tier-top-info">
            <h3 className="gt-tier-name">{t.pricing.gold.title}</h3>
            <p className="gt-tier-desc">{t.pricing.gold.desc}</p>
          </div>

          <div className="gt-tier-body-wrap">
            <ul className="gt-tier-features">
              {t.pricing.gold.features.map((f, i) => (
                <li key={i}>
                  <Check size={15} className="gt-tier-check-icon" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              className="gt-tier-action-btn"
              onClick={scrollToDemo}
            >
              <span>{t.pricing.gold.btn}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

