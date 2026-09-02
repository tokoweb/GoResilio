import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAssessment } from '../../context/AssessmentContext';
import { PersonaInsightEngine } from '../../../domain/services/PersonaInsightEngine';
import { UserCheck, CheckCircle2, ClipboardCheck } from 'lucide-react';

export const PersonaInsight: React.FC = () => {
  const { language, t } = useLanguage();
  const { userPersona } = useAssessment();

  const insightData = PersonaInsightEngine.getInsight(userPersona);

  return (
    <div className="gt-cadastral-protocol-card">
      <div className="gt-protocol-header">
        <div className="gt-protocol-avatar">
          <UserCheck size={16} />
        </div>
        <div>
          <span className="gt-protocol-eyebrow">{t.dashboard.roleInsightTitle}</span>
          <h4 className="gt-protocol-role-name">{userPersona}</h4>
        </div>
      </div>

      <div className="gt-protocol-checklist-wrap">
        <div className="gt-protocol-caption-bar">
          <ClipboardCheck size={14} className="gt-protocol-caption-icon" />
          <span>{language === 'id' ? 'PROTOKOL VERIFIKASI SEBELUM TRANSAKSI / PEMBANGUNAN' : 'PRE-TRANSACTION DUE DILIGENCE PROTOCOL'}</span>
        </div>
        <ul className="gt-protocol-list">
          {(language === 'id' ? insightData.actionStepsId : insightData.actionStepsEn).map(
            (step, idx) => (
              <li key={idx} className="gt-protocol-item">
                <CheckCircle2 size={15} className="gt-protocol-check-icon" />
                <span>{step}</span>
              </li>
            )
          )}
        </ul>
      </div>
    </div>
  );
};
