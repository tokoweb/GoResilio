export type GeocodingResultType =
  | 'address'
  | 'street'
  | 'neighbourhood'
  | 'locality'
  | 'district'
  | 'region'
  | 'country'
  | 'venue';

export interface GeocodingSuggestion {
  id: string;
  label: string;
  name: string;
  formattedAddress: string;
  houseNumber: string | null;
  street: string | null;
  neighbourhood: string | null;
  district: string | null;
  city: string | null;
  region: string | null;
  postalCode: string | null;
  country: string | null;
  countryCode: string | null;
  latitude: number;
  longitude: number;
  resultType: GeocodingResultType;
  confidence: number | null;
  provider: string;
  providerRecordId: string | null;

  // Backward-compatibility fields
  displayName?: string;
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
