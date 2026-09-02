'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface CustomSelectOption<T extends string = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
}

interface CustomSelectProps<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  options: CustomSelectOption<T>[];
  icon?: React.ReactNode;
  placeholder?: string;
  className?: string;
  theme?: 'dark' | 'light';
  ariaLabel?: string;
}

export function CustomSelect<T extends string = string>({
  value,
  onChange,
  options,
  icon,
  placeholder,
  className = '',
  theme = 'dark',
  ariaLabel
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const isLight = theme === 'light';

  return (
    <div
      ref={containerRef}
      className={`gt-custom-select-container ${isLight ? 'theme-light' : 'theme-dark'} ${className}`}
      aria-label={ariaLabel}
    >
      <button
        type="button"
        className={`gt-custom-select-trigger ${isOpen ? 'is-open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="gt-select-trigger-content">
          {icon && <span className="gt-select-trigger-lead-icon">{icon}</span>}
          {selectedOption?.icon && <span className="gt-select-opt-icon">{selectedOption.icon}</span>}
          <span className="gt-select-trigger-label">
            {selectedOption ? selectedOption.label : placeholder || 'Pilih...'}
          </span>
        </div>
        <ChevronDown size={14} className={`gt-select-chevron ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="gt-custom-select-dropdown" role="listbox">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                className={`gt-custom-select-item ${isSelected ? 'selected' : ''}`}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
              >
                <div className="gt-select-item-content">
                  {opt.icon && <span className="gt-select-item-icon">{opt.icon}</span>}
                  <span className="gt-select-item-text">{opt.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {opt.badge && <span className="gt-select-item-badge">{opt.badge}</span>}
                  {isSelected && <Check size={14} className="gt-select-item-check" />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
