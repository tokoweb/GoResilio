import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useLanguage } from '../../context/LanguageContext';
import { useAssessment } from '../../context/AssessmentContext';
import {
  Compass,
  Waves,
  Mountain,
  Crosshair,
  MapPin,
  LocateFixed,
  ChevronUp,
  ChevronDown,
  Clock
} from 'lucide-react';

type MapTileStyle = 'voyager' | 'satellite' | 'terrain';

export const MapViewer: React.FC = () => {
  const { language } = useLanguage();
  const {
    selectedCoords,
    mapViewCenter,
    setMapViewCenter,
    setMapMarkerPosition,
    assessment,
    runAssessmentForCoords,
    isLoading
  } = useAssessment();

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const customIconRef = useRef<L.DivIcon | null>(null);

  const [activeTileStyle, setActiveTileStyle] = useState<MapTileStyle>('voyager');
  const [isLocating, setIsLocating] = useState(false);
  const [isTelemetryExpanded, setIsTelemetryExpanded] = useState(false);

  const isEn = language === 'en';

  const tileUrls: Record<MapTileStyle, { url: string; attr: string }> = {
    voyager: {
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      attr: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attr: '&copy; Esri &copy; Maxar, Earthstar Geographics'
    },
    terrain: {
      url: 'https://tile.opentopomap.org/{z}/{x}/{y}.png',
      attr: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a> (&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors)'
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Artisanal Cadastral Map Pin with Pulse Ripple
    const customIcon = L.divIcon({
      className: 'gt-cadastral-map-pin',
      html: `
        <div style="position: relative; width: 44px; height: 50px; display: flex; align-items: center; justify-content: center; cursor: grab;">
          <div style="
            position: absolute;
            top: 6px;
            left: 3px;
            width: 38px;
            height: 38px;
            border-radius: 50%;
            background: rgba(234, 88, 12, 0.25);
            animation: cadastral-pulse 2.2s infinite ease-out;
            pointer-events: none;
          "></div>
          <svg viewBox="0 0 40 48" width="40" height="48" style="filter: drop-shadow(0 6px 14px rgba(18,25,38,0.32)); position: relative; z-index: 10;">
            <defs>
              <linearGradient id="cadastralGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#ea580c" />
                <stop offset="100%" stop-color="#9a3412" />
              </linearGradient>
            </defs>
            <path d="M 20,2 C 10,2 2,10 2,20 C 2,32 20,46 20,46 C 20,46 38,32 38,20 C 38,10 30,2 20,2 Z" 
                  fill="url(#cadastralGrad)" stroke="#ffffff" stroke-width="2.5" />
            <circle cx="20" cy="18" r="5.5" fill="#ffffff" />
          </svg>
        </div>
      `,
      iconSize: [44, 50],
      iconAnchor: [22, 48],
      popupAnchor: [0, -48]
    });
    customIconRef.current = customIcon;

    const initialCenter = selectedCoords
      ? [selectedCoords.lat, selectedCoords.lng]
      : [mapViewCenter.lat, mapViewCenter.lng];
    const initialZoom = selectedCoords ? 15 : 12;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter as [number, number],
      zoom: initialZoom,
      scrollWheelZoom: true,
      zoomControl: false,
      touchZoom: true
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    const initialLayer = L.tileLayer(tileUrls.voyager.url, {
      attribution: tileUrls.voyager.attr,
      maxZoom: 19
    }).addTo(map);

    // Initial marker placement
    const marker = L.marker([initialCenter[0], initialCenter[1]], {
      draggable: true,
      icon: customIcon
    }).addTo(map);

    marker.on('dragend', () => {
      const latlng = marker.getLatLng();
      setMapMarkerPosition(latlng);
      if (circleRef.current) circleRef.current.setLatLng(latlng);
      runAssessmentForCoords(latlng.lat, latlng.lng);
    });

    markerRef.current = marker;

    if (selectedCoords) {
      const circle = L.circle([selectedCoords.lat, selectedCoords.lng], {
        color: '#c2410c',
        fillColor: '#c2410c',
        fillOpacity: 0.07,
        radius: 800,
        weight: 1.5,
        dashArray: '5, 8'
      }).addTo(map);

      const popupContent = `
        <div class="gt-cadastral-popup">
          <div class="gt-cadastral-popup-addr">${assessment?.location?.formattedAddress || `${selectedCoords.lat.toFixed(4)}°, ${selectedCoords.lng.toFixed(4)}°`}</div>
          <div class="gt-cadastral-popup-coords">${selectedCoords.lat.toFixed(4)}°, ${selectedCoords.lng.toFixed(4)}°</div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        className: 'gt-custom-cadastral-popup',
        closeButton: false,
        autoPan: false
      });

      circleRef.current = circle;
    }

    // Direct Map Click: place/move pin directly and immediately trigger assessment at clicked coordinates
    map.on('click', (e) => {
      if (markerRef.current) {
        markerRef.current.setLatLng(e.latlng);
      }
      setMapMarkerPosition(e.latlng);

      if (!circleRef.current) {
        const circle = L.circle(e.latlng, {
          color: '#c2410c',
          fillColor: '#c2410c',
          fillOpacity: 0.07,
          radius: 800,
          weight: 1.5,
          dashArray: '5, 8'
        }).addTo(map);
        circleRef.current = circle;
      } else {
        circleRef.current.setLatLng(e.latlng);
      }

      map.panTo(e.latlng, { animate: true, duration: 0.4 });
      runAssessmentForCoords(e.latlng.lat, e.latlng.lng);
    });

    mapInstanceRef.current = map;
    tileLayerRef.current = initialLayer;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Switch Tile Layer
  const switchLayer = (style: MapTileStyle) => {
    setActiveTileStyle(style);
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    mapInstanceRef.current.removeLayer(tileLayerRef.current);
    const newLayer = L.tileLayer(tileUrls[style].url, {
      attribution: tileUrls[style].attr,
      maxZoom: 19
    }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newLayer;
  };

  // Recenter Map to Current Selected Coordinates
  const recenterMap = () => {
    if (!mapInstanceRef.current) return;
    const target = selectedCoords || mapViewCenter;
    mapInstanceRef.current.setView([target.lat, target.lng], selectedCoords ? 15 : 12, { animate: true });
  };

  // Use Device GPS Location
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      recenterMap();
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 16, { animate: true });
          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          }
          if (circleRef.current) {
            circleRef.current.setLatLng([lat, lng]);
          }
        }
        setMapMarkerPosition({ lat, lng });
        runAssessmentForCoords(lat, lng);
      },
      () => {
        setIsLocating(false);
        recenterMap();
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Sync coords & assessment changes with marker & circle
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (selectedCoords) {
      map.setView([selectedCoords.lat, selectedCoords.lng], map.getZoom() || 15, { animate: true });

      if (markerRef.current) {
        markerRef.current.setLatLng([selectedCoords.lat, selectedCoords.lng]);
      } else if (customIconRef.current) {
        const marker = L.marker([selectedCoords.lat, selectedCoords.lng], {
          draggable: true,
          icon: customIconRef.current
        }).addTo(map);

        marker.on('dragend', () => {
          const latlng = marker.getLatLng();
          if (circleRef.current) circleRef.current.setLatLng(latlng);
          runAssessmentForCoords(latlng.lat, latlng.lng);
        });

        markerRef.current = marker;
      }

      if (!circleRef.current) {
        const circle = L.circle([selectedCoords.lat, selectedCoords.lng], {
          color: '#c2410c',
          fillColor: '#c2410c',
          fillOpacity: 0.07,
          radius: 800,
          weight: 1.5,
          dashArray: '5, 8'
        }).addTo(map);
        circleRef.current = circle;
      } else {
        circleRef.current.setLatLng([selectedCoords.lat, selectedCoords.lng]);
      }

      const color =
        assessment?.overallLevel === 'extreme'
          ? '#dc2626'
          : assessment?.overallLevel === 'high'
          ? '#ea580c'
          : assessment?.overallLevel === 'medium'
          ? '#d97706'
          : '#15803d';

      circleRef.current.setStyle({ color, fillColor: color });

      const addr = assessment?.location?.formattedAddress || `${selectedCoords.lat.toFixed(4)}°, ${selectedCoords.lng.toFixed(4)}°`;
      const popupContent = `
        <div class="gt-cadastral-popup">
          <div class="gt-cadastral-popup-addr">${addr}</div>
          <div class="gt-cadastral-popup-coords">${selectedCoords.lat.toFixed(4)}°, ${selectedCoords.lng.toFixed(4)}°</div>
        </div>
      `;
      if (markerRef.current) {
        markerRef.current.bindPopup(popupContent, {
          className: 'gt-custom-cadastral-popup',
          closeButton: false,
          autoPan: false
        });
      }
    }
  }, [selectedCoords, assessment, language]);

  return (
    <div className="gt-cadastral-map-card">
      {/* Precision Drafting Header with Clear Assessed Location Label */}
      <div className="gt-cadastral-map-header">
        <div className="gt-cadastral-title-group">
          <div className="gt-cadastral-address-row">
            <MapPin size={16} className="gt-cadastral-pin-icon" />
            <h3
              className="gt-cadastral-site-address"
              title={
                assessment?.location?.formattedAddress ||
                (selectedCoords
                  ? `Titik Asesmen: ${selectedCoords.lat.toFixed(4)}°, ${selectedCoords.lng.toFixed(4)}°`
                  : isEn
                  ? 'Click directly anywhere on the map or search an address'
                  : 'Klik langsung di mana saja pada peta atau cari alamat properti')
              }
            >
              {assessment?.location?.formattedAddress ||
                (selectedCoords
                  ? `Titik Asesmen: ${selectedCoords.lat.toFixed(4)}°, ${selectedCoords.lng.toFixed(4)}°`
                  : isEn
                  ? 'Click anywhere on the map to select location'
                  : 'Klik langsung pada peta untuk memilih lokasi')}
            </h3>
          </div>
        </div>

        {/* Map Styles & Action Buttons */}
        <div className="gt-cadastral-map-tools">
          <div className="gt-cadastral-layer-segmented">
            <button
              type="button"
              className={`gt-cadastral-tool-btn ${activeTileStyle === 'voyager' ? 'active' : ''}`}
              onClick={() => switchLayer('voyager')}
            >
              {isEn ? 'Street' : 'Peta Jalan'}
            </button>
            <button
              type="button"
              className={`gt-cadastral-tool-btn ${activeTileStyle === 'satellite' ? 'active' : ''}`}
              onClick={() => switchLayer('satellite')}
            >
              {isEn ? 'Satellite' : 'Satelit'}
            </button>
            <button
              type="button"
              className={`gt-cadastral-tool-btn ${activeTileStyle === 'terrain' ? 'active' : ''}`}
              onClick={() => switchLayer('terrain')}
            >
              {isEn ? 'Terrain' : 'Topografi'}
            </button>
          </div>

          <button
            type="button"
            className={`gt-cadastral-recenter-btn ${isLocating ? 'is-locating' : ''}`}
            onClick={handleUseMyLocation}
            title={isEn ? 'Use GPS Location' : 'Gunakan GPS Lokasi Saya'}
          >
            <LocateFixed size={15} />
          </button>

          <button
            type="button"
            className="gt-cadastral-recenter-btn"
            onClick={recenterMap}
            title={isEn ? 'Recenter Map to Assessed Point' : 'Pusatkan Peta ke Titik Asesmen'}
          >
            <Crosshair size={15} />
          </button>
        </div>
      </div>

      {/* Map Viewport Canvas */}
      <div className="gt-cadastral-map-viewport">
        <div ref={mapContainerRef} className="gt-cadastral-map-canvas" />

        {/* Minimalist Location Analysis Loading Indicator */}
        {isLoading && (
          <>
            <div className="gt-map-top-loader-bar" />
            <div className="gt-map-minimal-pill">
              <span className="gt-loader-dot-pulse" />
              <span>{isEn ? 'Analyzing Location...' : 'Menganalisis Titik Lokasi...'}</span>
            </div>
          </>
        )}

        {/* Cadastral Telemetry HUD Ribbon */}
        <div className={`gt-cadastral-telemetry-ribbon ${isTelemetryExpanded ? 'is-expanded-mobile' : ''}`}>
          <div className="gt-telemetry-cell">
            <Compass size={13} className="gt-telemetry-cell-icon gt-cell-blue" />
            <div className="gt-telemetry-cell-body">
              <span className="gt-telemetry-cell-lbl">{isEn ? 'ASSESSED POINT' : 'TITIK ASESMEN'}</span>
              <span className="gt-telemetry-cell-val">
                {selectedCoords
                  ? `${selectedCoords.lat.toFixed(4)}°, ${selectedCoords.lng.toFixed(4)}°`
                  : isEn
                  ? 'No assessed point'
                  : 'Belum ada titik asesmen'}
              </span>
            </div>
          </div>

          <div className="gt-telemetry-hairline-sep" />

          <div className="gt-telemetry-cell">
            <Waves size={13} className="gt-telemetry-cell-icon gt-cell-teal" />
            <div className="gt-telemetry-cell-body">
              <span className="gt-telemetry-cell-lbl">{isEn ? 'ELEVATION' : 'ELEVASI'}</span>
              <span className="gt-telemetry-cell-val">
                {assessment?.flood?.elevationMeters != null
                  ? `${assessment.flood.elevationMeters} ${isEn ? 'm MSL' : 'm dpl'}`
                  : '—'}
              </span>
            </div>
          </div>

          <div className="gt-telemetry-hairline-sep" />

          <div className="gt-telemetry-cell">
            <Mountain size={13} className="gt-telemetry-cell-icon gt-cell-orange" />
            <div className="gt-telemetry-cell-body">
              <span className="gt-telemetry-cell-lbl">{isEn ? 'SEISMIC ZONE' : 'ZONASI GEMPA'}</span>
              <span className="gt-telemetry-cell-val">
                {assessment?.quake?.nearestFaultName || assessment?.quake?.quakeClass || '—'}
              </span>
            </div>
          </div>

          <div className="gt-telemetry-hairline-sep" />

          <div className="gt-telemetry-cell">
            <Clock size={13} className="gt-telemetry-cell-icon gt-cell-purple" />
            <div className="gt-telemetry-cell-body">
              <span className="gt-telemetry-cell-lbl">{isEn ? 'TIMESTAMP' : 'WAKTU ASESMEN'}</span>
              <span className="gt-telemetry-cell-val">
                {assessment?.evaluatedAt
                  ? (isNaN(Date.parse(assessment.evaluatedAt))
                    ? assessment.evaluatedAt
                    : new Date(assessment.evaluatedAt).toLocaleTimeString(isEn ? 'en-US' : 'id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      }))
                  : (isEn ? 'No assessment' : 'Belum ada asesmen')}
              </span>
            </div>
          </div>

          {/* Mobile Quick Collapse Toggle */}
          <button
            type="button"
            className="gt-telemetry-mobile-toggle"
            onClick={() => setIsTelemetryExpanded(!isTelemetryExpanded)}
            title={
              isTelemetryExpanded
                ? isEn
                  ? 'Compact View'
                  : 'Tampilan Ringkas'
                : isEn
                ? 'Expand Details'
                : 'Lihat Detail Lengkap'
            }
          >
            {isTelemetryExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapViewer;


