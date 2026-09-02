import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAssessment } from '../../context/AssessmentContext';
import { Sliders } from 'lucide-react';

/**
 * @deprecated DEMO_ONLY - Simulation/Demo bar for offline preview testing.
 * Real location risk assessments are computed strictly by PerformSiteAssessmentUseCase.
 */
export const ScoreOverrideBar: React.FC = () => {
  const { t } = useLanguage();
  const { overrideMode, setManualScoreLevel } = useAssessment();

  return (
    <div className="gt-sim-bar">
      <div className="gt-sim-label">
        <Sliders size={13} className="gt-sim-icon" />
        <span>{t.hero.scoreOverrideLabel}</span>
      </div>

      <div className="gt-sim-actions">
        <button
          type="button"
          className={`gt-sim-btn ${overrideMode === 'high' ? 'active-high' : ''}`}
          onClick={() => setManualScoreLevel('high')}
        >
          {t.hero.scoreHigh}
        </button>
        <button
          type="button"
          className={`gt-sim-btn ${overrideMode === 'medium' ? 'active-med' : ''}`}
          onClick={() => setManualScoreLevel('medium')}
        >
          {t.hero.scoreMed}
        </button>
        <button
          type="button"
          className={`gt-sim-btn ${overrideMode === 'low' ? 'active-low' : ''}`}
          onClick={() => setManualScoreLevel('low')}
        >
          {t.hero.scoreLow}
        </button>
      </div>
    </div>
  );
};
