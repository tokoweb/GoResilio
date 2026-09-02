export interface GeocodingSuggestion {
  displayName: string;
  latitude: number;
  longitude: number;
  type?: string;
  addressDetails?: {
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
  provenance?: {
    source: string;
    query?: string;
    resultCount?: number;
    selectedIndex?: number;
    osmType?: string;
    osmId?: string | number;
    featureId?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
}

export interface PresetCityConfig {
  id: string;
  nameId: string;
  nameEn: string;
  country: string;
  latitude: number;
  longitude: number;
  highlightId: string;
  highlightEn: string;
}
