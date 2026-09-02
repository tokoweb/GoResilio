import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAssessment, PRESET_LOCATIONS } from '../../context/AssessmentContext';
import { MapPin } from 'lucide-react';

export const CityPresets: React.FC = () => {
  const { language, t } = useLanguage();
  const { selectPreset, selectedCoords, isLoading } = useAssessment();

  return (
    <div className="gt-presets-cluster">
      <span className="gt-presets-label">
        {t.hero.quickPresetsLabel}
      </span>
      <div className="gt-presets-list">
        {PRESET_LOCATIONS.map((preset) => {
          const isSelected = selectedCoords
            ? Math.abs(selectedCoords.lat - preset.latitude) < 0.05 &&
              Math.abs(selectedCoords.lng - preset.longitude) < 0.05
            : false;

          return (
            <button
              key={preset.id}
              type="button"
              disabled={isLoading}
              className={`gt-preset-pill ${isSelected ? 'gt-preset-pill--active' : ''} ${isLoading ? 'is-disabled' : ''}`}
              onClick={() => {
                if (isLoading) return;
                selectPreset(preset.id);
                setTimeout(() => {
                  document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 200);
              }}
              title={language === 'id' ? preset.highlightId : preset.highlightEn}
            >
              <MapPin size={12} className="gt-preset-pin" />
              <span>{language === 'id' ? preset.nameId : preset.nameEn}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
