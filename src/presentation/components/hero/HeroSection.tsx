import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useLanguage } from '../../context/LanguageContext';
import { useAssessment } from '../../context/AssessmentContext';
import { PropertyType, UserPersona } from '../../../domain/types/hazard.types';
import { GeocodingSuggestion } from '../../../domain/types/location.types';
import { NominatimClient } from '../../../infrastructure/external_apis/NominatimClient';
import { CityPresets } from './CityPresets';
import { CustomSelect, CustomSelectOption } from '../ui/CustomSelect';
import {
  Search,
  MapPin,
  Building,
  UserCheck,
  Waves,
  Mountain,
  Flame,
  Navigation,
  ArrowRight,
  ShieldCheck,
  Loader2
} from 'lucide-react';

export const HeroSection: React.FC = () => {
  const { language, t } = useLanguage();
  const {
    propertyType, setPropertyType,
    userPersona, setUserPersona,
    runAssessmentForCoords, assessment,
    isLoading
  } = useAssessment();

  const [query, setQuery] = useState<string>('');
  const [suggestions, setSuggestions] = useState<GeocodingSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const debounceRef = useRef<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const headlineRef = useRef<HTMLDivElement | null>(null);
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const pillarsRef = useRef<HTMLDivElement | null>(null);

  // GSAP staged entrance
  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    if (headlineRef.current) {
      tl.fromTo(headlineRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.75 });
    }
    if (terminalRef.current) {
      tl.fromTo(terminalRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.65 }, '-=0.35');
    }
    if (pillarsRef.current) {
      const items = pillarsRef.current.querySelectorAll('.gt-hazard-card');
      tl.fromTo(items, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.08 }, '-=0.25');
    }
  }, []);

  useEffect(() => {
    if (assessment?.location?.formattedAddress) {
      setQuery(assessment.location.formattedAddress);
    } else {
      setQuery('');
    }
  }, [assessment?.location?.formattedAddress]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (val.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = window.setTimeout(async () => {
      const results = await NominatimClient.searchLocations(val);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    }, 300);
  };

  const handleSelect = (item: GeocodingSuggestion) => {
    setQuery(item.displayName);
    setShowSuggestions(false);
    runAssessmentForCoords(item.latitude, item.longitude, item.displayName);
    setTimeout(() => {
      document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 250);
  };

  const handleScan = async () => {
    if (!query.trim()) {
      document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const results = await NominatimClient.searchLocations(query);
    if (results.length > 0) {
      handleSelect(results[0]);
    } else {
      document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Safe accessor for hazard scores matching MultiHazardAssessmentResult schema
  const floodScore = assessment?.flood?.score ?? null;
  const quakeScore = assessment?.quake?.score ?? null;
  const heatScore = assessment?.heat?.score ?? null;
  const transitScore = assessment?.transport?.score ?? null;

  const propertyTypeOptions: CustomSelectOption<PropertyType>[] = [
    { value: 'Residential', label: t.hero.types.residential, icon: <Building size={14} /> },
    { value: 'Commercial', label: t.hero.types.commercial, icon: <Building size={14} /> }
  ];

  const userPersonaOptions: CustomSelectOption<UserPersona>[] = [
    { value: 'Home Buyer', label: t.hero.personas.buyer, icon: <UserCheck size={14} /> },
    { value: 'Home Owner', label: t.hero.personas.owner, icon: <UserCheck size={14} /> },
    { value: 'Property Developer', label: t.hero.personas.developer, icon: <UserCheck size={14} /> },
    { value: 'Lender / Bank', label: t.hero.personas.lender, icon: <UserCheck size={14} /> },
    { value: 'Real Estate Agent', label: t.hero.personas.agent, icon: <UserCheck size={14} /> }
  ];

  return (
    <section className="gt-hero-stage" id="hero">
      {/* Topographic Contour Texture from Logo */}
      <div className="gt-topo-texture" aria-hidden="true" />

      <div className="gt-hero-container">
        {/* 1. Editorial Headline */}
        <div className="gt-hero-header" ref={headlineRef}>
          <div className="gt-hero-eyebrow">
            <ShieldCheck size={13} className="gt-eyebrow-icon" />
            <span>{language === 'id' ? 'Asesmen Risiko Lingkungan & Ketangguhan Properti' : 'Property Risk & Environmental Due Diligence'}</span>
          </div>

          <h1 className="gt-hero-heading">
            {language === 'id' ? (
              <>
                Ketahui Risiko Bencana,<br />
                <span className="gt-hero-accent">Sebelum Anda Berinvestasi.</span>
              </>
            ) : (
              <>
                Know the Disaster Risk,<br />
                <span className="gt-hero-accent">Before You Invest.</span>
              </>
            )}
          </h1>

          <p className="gt-hero-lead">{t.hero.subtitle}</p>
        </div>

        {/* 2. Unified High-Precision Search Terminal */}
        <div className="gt-search-terminal" ref={(el) => { terminalRef.current = el; dropdownRef.current = el; }}>
          <div className="gt-terminal-main-row">
            <div className="gt-terminal-input-wrap">
              <MapPin size={17} className="gt-terminal-pin" />
              <input
                type="text"
                className="gt-terminal-field"
                placeholder={t.hero.searchPlaceholder}
                value={query}
                onChange={handleInputChange}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              />
            </div>

            <button
              type="button"
              className={`gt-terminal-submit-btn ${isLoading ? 'is-loading' : ''}`}
              onClick={handleScan}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 size={15} className="gt-spin" />
                  <span>{language === 'id' ? 'Memindai...' : 'Scanning...'}</span>
                </>
              ) : (
                <>
                  <Search size={15} />
                  <span>{language === 'id' ? 'Analisis Lokasi' : 'Analyze Site'}</span>
                </>
              )}
            </button>
          </div>

          {/* Autocomplete Geocoding Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="gt-terminal-suggestions">
              {suggestions.map((item, idx) => (
                <button
                  key={`${item.latitude}-${item.longitude}-${idx}`}
                  type="button"
                  className="gt-suggestion-item"
                  onClick={() => handleSelect(item)}
                >
                  <MapPin size={14} className="gt-suggestion-icon" />
                  <div className="gt-suggestion-texts">
                    <span className="gt-suggestion-main">{item.displayName}</span>
                    <span className="gt-suggestion-sub">
                      {item.addressDetails?.city ? `${item.addressDetails.city}, ` : ''}{item.addressDetails?.country || 'Indonesia'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Integrated Inline Filters with Custom Glassmorphic Selects */}
          <div className="gt-terminal-options-row">
            <CustomSelect<PropertyType>
              value={propertyType}
              onChange={(val) => setPropertyType(val)}
              options={propertyTypeOptions}
              icon={<Building size={14} />}
              ariaLabel="Tipe Properti"
            />

            <div className="gt-terminal-sep" />

            <CustomSelect<UserPersona>
              value={userPersona}
              onChange={(val) => setUserPersona(val)}
              options={userPersonaOptions}
              icon={<UserCheck size={14} />}
              ariaLabel="Profil Pengguna"
            />
          </div>
        </div>

        {/* 3. Quick Location Presets */}
        <CityPresets />

        {/* 4. 4 Precision Hazard Intelligence Cards */}
        <div className="gt-hazard-grid" ref={pillarsRef}>
          {/* Flood Card */}
          <div className="gt-hazard-card">
            <div className="gt-hazard-card__head">
              <div className="gt-hazard-icon-box gt-hazard-icon-box--flood">
                <Waves size={16} />
              </div>
              <span className="gt-hazard-card__badge">{language === 'id' ? 'Banjir & Rob' : 'Flood Risk'}</span>
            </div>
            <div className="gt-hazard-card__body">
              <span className="gt-hazard-metric">{floodScore !== null ? `${floodScore}/100` : '--/100'}</span>
              <span className="gt-hazard-status">
                {floodScore === null
                  ? (language === 'en' ? 'Not Assessed' : 'Belum Diasesmen')
                  : language === 'en'
                  ? (floodScore > 65 ? 'High' : floodScore > 40 ? 'Moderate' : 'Low')
                  : (floodScore > 65 ? 'Tinggi' : floodScore > 40 ? 'Moderat' : 'Rendah')}
              </span>
            </div>
            <div className="gt-hazard-card__foot">Copernicus DEM & ERA5</div>
          </div>

          {/* Earthquake Card */}
          <div className="gt-hazard-card">
            <div className="gt-hazard-card__head">
              <div className="gt-hazard-icon-box gt-hazard-icon-box--quake">
                <Mountain size={16} />
              </div>
              <span className="gt-hazard-card__badge">{language === 'id' ? 'Gempa & Sesar' : 'Seismic Fault'}</span>
            </div>
            <div className="gt-hazard-card__body">
              <span className="gt-hazard-metric">{quakeScore !== null ? `${quakeScore}/100` : '--/100'}</span>
              <span className="gt-hazard-status">
                {quakeScore === null
                  ? (language === 'en' ? 'Not Assessed' : 'Belum Diasesmen')
                  : language === 'en'
                  ? (quakeScore > 65 ? 'High' : quakeScore > 40 ? 'Moderate' : 'Low')
                  : (quakeScore > 65 ? 'Tinggi' : quakeScore > 40 ? 'Moderat' : 'Rendah')}
              </span>
            </div>
            <div className="gt-hazard-card__foot">USGS & BNPB inaRISK</div>
          </div>

          {/* Heat Stress Card */}
          <div className="gt-hazard-card">
            <div className="gt-hazard-card__head">
              <div className="gt-hazard-icon-box gt-hazard-icon-box--heat">
                <Flame size={16} />
              </div>
              <span className="gt-hazard-card__badge">{language === 'id' ? 'Heat Stress' : 'Heat Stress'}</span>
            </div>
            <div className="gt-hazard-card__body">
              <span className="gt-hazard-metric">{heatScore !== null ? `${heatScore}/100` : '--/100'}</span>
              <span className="gt-hazard-status">
                {heatScore === null
                  ? (language === 'en' ? 'Not Assessed' : 'Belum Diasesmen')
                  : language === 'en'
                  ? (heatScore > 65 ? 'High' : heatScore > 40 ? 'Moderate' : 'Low')
                  : (heatScore > 65 ? 'Tinggi' : heatScore > 40 ? 'Moderat' : 'Rendah')}
              </span>
            </div>
            <div className="gt-hazard-card__foot">Open-Meteo & ERA5</div>
          </div>

          {/* Transit & Evacuation Card */}
          <div className="gt-hazard-card">
            <div className="gt-hazard-card__head">
              <div className="gt-hazard-icon-box gt-hazard-icon-box--transit">
                <Navigation size={16} />
              </div>
              <span className="gt-hazard-card__badge">{language === 'id' ? 'Aksesibilitas' : 'Connectivity'}</span>
            </div>
            <div className="gt-hazard-card__body">
              <span className="gt-hazard-metric">{transitScore !== null ? `${transitScore}/100` : '--/100'}</span>
              <span className="gt-hazard-status">
                {transitScore === null
                  ? (language === 'en' ? 'Not Assessed' : 'Belum Diasesmen')
                  : language === 'en'
                  ? (transitScore <= 35 ? 'Optimal' : transitScore <= 65 ? 'Moderate' : 'Limited')
                  : (transitScore <= 35 ? 'Prima' : transitScore <= 65 ? 'Sedang' : 'Terbatas')}
              </span>
            </div>
            <div className="gt-hazard-card__foot">OSRM & OpenStreetMap</div>
          </div>
        </div>
      </div>
      {/* Organic Wave Transition into Warm Alabaster Page */}
      <div className="gt-hero-bottom-transition" aria-hidden="true">
        <svg viewBox="0 0 1440 50" fill="none" preserveAspectRatio="none">
          <path d="M0,25 C360,50 720,0 1080,25 C1260,38 1360,32 1440,25 L1440,50 L0,50 Z" fill="var(--gt-bg-page)" />
        </svg>
      </div>
    </section>
  );
};
