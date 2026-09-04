import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useLanguage } from '../../context/LanguageContext';
import { useAssessment } from '../../context/AssessmentContext';
import { PropertyType, UserPersona } from '../../../domain/types/hazard.types';
import { GeocodingSuggestion, GeocodingResultType } from '../../../domain/types/location.types';
import { CityPresets } from './CityPresets';
import { CustomSelect, CustomSelectOption } from '../ui/CustomSelect';
import {
  Search,
  MapPin,
  Building,
  Building2,
  UserCheck,
  Waves,
  Mountain,
  Flame,
  Navigation,
  Landmark,
  Compass,
  ArrowRight,
  ShieldCheck,
  Loader2,
  X
} from 'lucide-react';

export const HeroSection: React.FC = () => {
  const { language, t } = useLanguage();
  const {
    propertyType, setPropertyType,
    userPersona, setUserPersona,
    runAssessmentForCoords, assessment,
    setMapViewCenter, setMapMarkerPosition,
    isLoading
  } = useAssessment();

  const [query, setQuery] = useState<string>('');
  const [suggestions, setSuggestions] = useState<GeocodingSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<GeocodingSuggestion | null>(null);

  const debounceRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

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

  // Synchronize query input when an assessment finishes
  useEffect(() => {
    if (assessment?.location?.formattedAddress) {
      setQuery(assessment.location.formattedAddress);
    }
  }, [assessment?.location?.formattedAddress]);

  // Click outside to close suggestions dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced search via server-side POST /api/geocode/search
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setSelectedIndex(-1);

    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (abortControllerRef.current) abortControllerRef.current.abort();

    if (val.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setShowSuggestions(true);

    debounceRef.current = window.setTimeout(async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const res = await fetch('/api/geocode/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            query: val,
            language,
            limit: 8
          })
        });

        if (!res.ok) {
          throw new Error('Search request failed');
        }

        const data = await res.json();
        if (data && Array.isArray(data.data)) {
          setSuggestions(data.data);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.warn('[Search autocomplete error]', err);
        setSearchError(language === 'id' ? 'Data lokasi sedang tidak dapat dimuat.' : 'Location data currently unavailable.');
      } finally {
        setIsSearching(false);
      }
    }, 350);
  };

  /**
   * Selection does NOT immediately execute assessment (Requirement 14 & 15).
   * 1. Updates input with formattedAddress
   * 2. Moves map marker and viewport to coordinates
   * 3. Retains assessmentCoordinates as NULL until explicit confirmation
   * 4. Shows Selected Location panel with CTA "Analisis Lokasi"
   */
  const handleSelect = (item: GeocodingSuggestion) => {
    setQuery(item.formattedAddress);
    setSelectedLocation(item);
    setShowSuggestions(false);
    setSelectedIndex(-1);

    // Sync map viewport and marker
    setMapMarkerPosition({ lat: item.latitude, lng: item.longitude });
    setMapViewCenter({ lat: item.latitude, lng: item.longitude });
  };

  /**
   * Explicit confirmation trigger to run the assessment scan.
   */
  const handleConfirmScan = (item: GeocodingSuggestion) => {
    runAssessmentForCoords(item.latitude, item.longitude, item.formattedAddress);
    setTimeout(() => {
      document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 250);
  };

  /**
   * Scan button click handler:
   * If a location is already selected, runs scan for it.
   * If query is typed without selection, queries geocoder, takes top result, and runs scan.
   */
  const handleScanButtonClick = async () => {
    if (selectedLocation) {
      handleConfirmScan(selectedLocation);
      return;
    }

    if (!query.trim()) {
      document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    try {
      setIsSearching(true);
      const res = await fetch('/api/geocode/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          language,
          limit: 1
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.data && data.data.length > 0) {
          const top = data.data[0];
          setSelectedLocation(top);
          handleConfirmScan(top);
          return;
        }
      }
    } catch (e) {
      console.warn('Scan button geocoding fallback error:', e);
    } finally {
      setIsSearching(false);
    }

    document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /**
   * Keyboard UX: ArrowDown, ArrowUp, Enter, Escape (Requirement 13)
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleScanButtonClick();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1 < suggestions.length ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelect(suggestions[selectedIndex]);
        } else {
          handleScanButtonClick();
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const renderResultIcon = (type: GeocodingResultType) => {
    switch (type) {
      case 'locality':
        return <Building2 size={15} className="gt-sugg-icon-city" />;
      case 'street':
        return <Navigation size={15} className="gt-sugg-icon-road" />;
      case 'venue':
        return <Landmark size={15} className="gt-sugg-icon-venue" />;
      case 'address':
        return <MapPin size={15} className="gt-terminal-pin" />;
      default:
        return <Compass size={15} />;
    }
  };

  const getResultTypeTag = (type: GeocodingResultType, lang: string) => {
    switch (type) {
      case 'locality':
        return lang === 'id' ? 'Kota' : 'City';
      case 'street':
        return lang === 'id' ? 'Jalan' : 'Street';
      case 'venue':
        return lang === 'id' ? 'Fasilitas' : 'Place';
      case 'address':
        return lang === 'id' ? 'Alamat' : 'Address';
      case 'district':
        return lang === 'id' ? 'Kecamatan' : 'District';
      case 'neighbourhood':
        return lang === 'id' ? 'Area' : 'Area';
      case 'region':
        return lang === 'id' ? 'Provinsi' : 'Region';
      case 'country':
        return lang === 'id' ? 'Negara' : 'Country';
      default:
        return lang === 'id' ? 'Lokasi' : 'Location';
    }
  };

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

  const getHazardStatusLabel = (status: string | undefined | null, lang: string) => {
    if (!status) return lang === 'id' ? 'RENDAH' : 'LOW';
    const s = status.toLowerCase();
    if (s === 'high' || s === 'tinggi') return lang === 'id' ? 'TINGGI' : 'HIGH';
    if (s === 'medium' || s === 'moderate' || s === 'sedang') return lang === 'id' ? 'SEDANG' : 'MEDIUM';
    if (s === 'low' || s === 'rendah') return lang === 'id' ? 'RENDAH' : 'LOW';
    if (s === 'critical' || s === 'kritis') return lang === 'id' ? 'KRITIS' : 'CRITICAL';
    return status.toUpperCase();
  };

  return (
    <section className="gt-hero-stage" id="hero">
      {/* Topographic Contour Texture */}
      <div className="gt-topo-texture" aria-hidden="true" />

      <div className="gt-hero-container">
        {/* 1. Header Typography */}
        <div className="gt-hero-header" ref={headlineRef}>
          <div className="gt-hero-eyebrow">
            <ShieldCheck size={14} className="gt-eyebrow-icon" />
            <span>{language === 'id' ? 'Platform Asesmen Risiko Terverifikasi' : 'Verified Risk Assessment Platform'}</span>
          </div>

          <h1 className="gt-hero-heading">
            {language === 'id' ? (
              <>
                Ketahanan Bencana &amp; Iklim Terverifikasi untuk{' '}
                <span className="gt-hero-accent">Setiap Jengkal Properti</span>
              </>
            ) : (
              <>
                Empowering Smart Property Decisions with{' '}
                <span className="gt-hero-accent">Verified Hazard Intelligence</span>
              </>
            )}
          </h1>

          <p className="gt-hero-lead">{t.hero.subtitle}</p>
        </div>

        {/* 2. Unified High-Precision Search Terminal */}
        <div className="gt-search-terminal" ref={terminalRef}>
          <div className="gt-terminal-main-row" ref={dropdownRef}>
            <div className="gt-terminal-input-wrap">
              <MapPin size={17} className="gt-terminal-pin" />
              <input
                ref={inputRef}
                type="text"
                className="gt-terminal-field"
                placeholder={t.hero.searchPlaceholder}
                value={query}
                onChange={handleInputChange}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                onKeyDown={handleKeyDown}
                autoComplete="off"
                spellCheck="false"
              />
              {query && (
                <button
                  type="button"
                  className="gt-terminal-clear-btn"
                  onClick={() => {
                    setQuery('');
                    setSuggestions([]);
                    setShowSuggestions(false);
                    setSelectedLocation(null);
                    inputRef.current?.focus();
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Hapus pencarian"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              type="button"
              className={`gt-terminal-submit-btn ${isLoading || isSearching ? 'is-loading' : ''}`}
              onClick={handleScanButtonClick}
              disabled={isLoading || isSearching}
            >
              {isLoading ? (
                <>
                  <Loader2 size={15} className="gt-spin" />
                  <span>{language === 'id' ? 'Memindai...' : 'Scanning...'}</span>
                </>
              ) : isSearching ? (
                <>
                  <Loader2 size={15} className="gt-spin" />
                  <span>{language === 'id' ? 'Mencari...' : 'Searching...'}</span>
                </>
              ) : (
                <>
                  <Search size={15} />
                  <span>{language === 'id' ? 'Analisis Lokasi' : 'Analyze Site'}</span>
                </>
              )}
            </button>

            {/* Autocomplete Floating Dropdown (Separate items, high-contrast, zero concatenated text) */}
            {showSuggestions && (
              <div className="gt-terminal-suggestions">
                {isSearching && (
                  <div className="gt-suggestion-status-row">
                    <Loader2 size={16} className="gt-suggestion-spinner" />
                    <span>{language === 'id' ? 'Mencari lokasi...' : 'Searching locations...'}</span>
                  </div>
                )}
                {searchError && !isSearching && (
                  <div className="gt-suggestion-status-row" style={{ color: '#f87171' }}>
                    <span>{searchError}</span>
                  </div>
                )}
                {!isSearching && !searchError && suggestions.length === 0 && (
                  <div className="gt-suggestion-status-row">
                    <span>{language === 'id' ? 'Tidak ditemukan lokasi yang sesuai.' : 'No matching locations found.'}</span>
                  </div>
                )}
                {!isSearching && suggestions.length > 0 && suggestions.map((item, idx) => (
                  <button
                    key={item.id || `${item.latitude}-${item.longitude}-${idx}`}
                    type="button"
                    className={`gt-suggestion-item ${idx === selectedIndex ? 'is-highlighted' : ''}`}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <div className="gt-sugg-icon-wrap">
                      {renderResultIcon(item.resultType)}
                    </div>
                    <div className="gt-suggestion-texts">
                      <div className="gt-sugg-top-row">
                        <span className="gt-sugg-name">{item.name}</span>
                        <span className="gt-sugg-tag">{getResultTypeTag(item.resultType, language)}</span>
                      </div>
                      <span className="gt-sugg-address">{item.formattedAddress}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Location Confirmation Panel (Requirements 14, 15, 21) */}
          {selectedLocation && (
            <div className="gt-selected-location-panel">
              <div className="gt-selected-loc-info">
                <div className="gt-selected-loc-badge">
                  <MapPin size={12} />
                  <span>{language === 'id' ? 'Lokasi Terpilih' : 'Selected Location'}</span>
                </div>
                <div className="gt-selected-loc-title">{selectedLocation.name}</div>
                <div className="gt-selected-loc-meta">
                  <span>{selectedLocation.formattedAddress}</span>
                  <span>•</span>
                  <span>{selectedLocation.latitude.toFixed(5)}, {selectedLocation.longitude.toFixed(5)}</span>
                  <span>•</span>
                  <span>{selectedLocation.provider}</span>
                </div>
              </div>
              <div className="gt-selected-loc-actions">
                <button
                  type="button"
                  className="gt-btn-clear-selection"
                  onClick={() => {
                    setSelectedLocation(null);
                    setQuery('');
                  }}
                >
                  {language === 'id' ? 'Ganti' : 'Change'}
                </button>
                <button
                  type="button"
                  className="gt-btn-confirm-analyze"
                  onClick={() => handleConfirmScan(selectedLocation)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={14} className="gt-spin" />
                      <span>{language === 'id' ? 'Memindai...' : 'Scanning...'}</span>
                    </>
                  ) : (
                    <>
                      <Search size={14} />
                      <span>{language === 'id' ? 'Analisis Lokasi Ini' : 'Analyze This Site'}</span>
                    </>
                  )}
                </button>
              </div>
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
              <span className="gt-hazard-card__badge">{language === 'id' ? 'Banjir & Genangan' : 'Flood & Inundation'}</span>
            </div>
            <div className="gt-hazard-card__body">
              <span className="gt-hazard-metric">{floodScore !== null ? `${floodScore}/100` : '—'}</span>
              <span className={`gt-hazard-status gt-hazard-status--${assessment?.flood?.status || 'low'}`}>
                {getHazardStatusLabel(assessment?.flood?.status, language)}
              </span>
            </div>
            <div className="gt-hazard-card__foot">
              {language === 'id' ? 'Curah hujan harian & topografi tapak' : 'Daily precipitation & site topography'}
            </div>
          </div>

          {/* Earthquake Card */}
          <div className="gt-hazard-card">
            <div className="gt-hazard-card__head">
              <div className="gt-hazard-icon-box gt-hazard-icon-box--quake">
                <Mountain size={16} />
              </div>
              <span className="gt-hazard-card__badge">{language === 'id' ? 'Gempa & Sesar Aktif' : 'Earthquake & Active Faults'}</span>
            </div>
            <div className="gt-hazard-card__body">
              <span className="gt-hazard-metric">{quakeScore !== null ? `${quakeScore}/100` : '—'}</span>
              <span className={`gt-hazard-status gt-hazard-status--${assessment?.quake?.status || 'low'}`}>
                {getHazardStatusLabel(assessment?.quake?.status, language)}
              </span>
            </div>
            <div className="gt-hazard-card__foot">
              {language === 'id' ? 'Percepatan tanah (PGA) & riwayat gempa' : 'Peak ground acceleration & seismic history'}
            </div>
          </div>

          {/* Heat Card */}
          <div className="gt-hazard-card">
            <div className="gt-hazard-card__head">
              <div className="gt-hazard-icon-box gt-hazard-icon-box--heat">
                <Flame size={16} />
              </div>
              <span className="gt-hazard-card__badge">{language === 'id' ? 'Paparan Panas Lokasi' : 'Site Heat Exposure'}</span>
            </div>
            <div className="gt-hazard-card__body">
              <span className="gt-hazard-metric">{heatScore !== null ? `${heatScore}/100` : '—'}</span>
              <span className={`gt-hazard-status gt-hazard-status--${assessment?.heat?.status || 'low'}`}>
                {getHazardStatusLabel(assessment?.heat?.status, language)}
              </span>
            </div>
            <div className="gt-hazard-card__foot">
              {language === 'id' ? 'Suhu permukaan & proyeksi iklim' : 'Surface temperature & climate projection'}
            </div>
          </div>

          {/* Accessibility Card */}
          <div className="gt-hazard-card">
            <div className="gt-hazard-card__head">
              <div className="gt-hazard-icon-box gt-hazard-icon-box--transit">
                <Navigation size={16} />
              </div>
              <span className="gt-hazard-card__badge">{language === 'id' ? 'Aksesibilitas & Transit' : 'Accessibility & Transit'}</span>
            </div>
            <div className="gt-hazard-card__body">
              <span className="gt-hazard-metric">{transitScore !== null ? `${transitScore}/100` : '—'}</span>
              <span className={`gt-hazard-status gt-hazard-status--${assessment?.transport?.status || 'low'}`}>
                {getHazardStatusLabel(assessment?.transport?.status, language)}
              </span>
            </div>
            <div className="gt-hazard-card__foot">
              {language === 'id' ? 'Konektivitas jalan & fasilitas darurat' : 'Road connectivity & emergency facilities'}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
