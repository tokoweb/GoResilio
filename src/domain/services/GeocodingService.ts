import { GeocodingSuggestion, GeocodingResultType } from '../types/location.types';
import { LocalApiCache } from '../../infrastructure/cache/LocalApiCache';

export interface GeocodingSearchOptions {
  language?: string;
  countryCode?: string;
  limit?: number;
  lat?: number;
  lon?: number;
}

export class GeocodingService {
  private static readonly USER_AGENT = 'GoTangguh/1.0 (resilience@gotangguh.id)';
  private static readonly DEFAULT_LIMIT = 8;

  /**
   * Normalize search queries to prevent cache fragmentation and redundant network requests.
   */
  public static normalizeQuery(query: string): string {
    return (query || '').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  /**
   * Cleans and deduplicates address tokens to prevent concatenated artifacts
   * like "Bandung, West Java, IndonesiaIndonesiaBandung...".
   */
  public static deduplicateAddressTokens(tokens: Array<string | null | undefined>): string[] {
    const seen = new Set<string>();
    const cleanTokens: string[] = [];

    for (const t of tokens) {
      if (!t) continue;
      const trimmed = t.trim();
      if (!trimmed) continue;
      const lower = trimmed.toLowerCase();

      // Avoid adjacent duplicates and exact token repetition
      if (!seen.has(lower)) {
        seen.add(lower);
        cleanTokens.push(trimmed);
      }
    }

    return cleanTokens;
  }

  /**
   * Determine semantic result type from OSM key/value or structured address fields.
   */
  public static resolveResultType(
    props: {
      osm_key?: string;
      osm_value?: string;
      type?: string;
      housenumber?: string;
      street?: string;
      city?: string;
      country?: string;
    }
  ): GeocodingResultType {
    if (props.housenumber) return 'address';

    const key = (props.osm_key || '').toLowerCase();
    const val = (props.osm_value || props.type || '').toLowerCase();

    if (key === 'highway' || ['road', 'street', 'residential', 'primary', 'secondary', 'tertiary'].includes(val)) {
      return 'street';
    }
    if (key === 'place') {
      if (['city', 'town', 'village', 'hamlet', 'municipality', 'locality'].includes(val)) {
        return 'locality';
      }
      if (['suburb', 'neighbourhood', 'quarter'].includes(val)) {
        return 'neighbourhood';
      }
      if (['country'].includes(val)) {
        return 'country';
      }
    }
    if (key === 'boundary' || ['administrative', 'district', 'county', 'regency'].includes(val)) {
      return 'district';
    }
    if (['amenity', 'tourism', 'shop', 'leisure', 'building', 'historic', 'office', 'hospital', 'school', 'university'].includes(key) ||
        ['hospital', 'clinic', 'hotel', 'mall', 'supermarket', 'school', 'place_of_worship'].includes(val)) {
      return 'venue';
    }
    if (props.city && !props.street) return 'locality';
    if (props.street) return 'street';
    if (props.country && !props.city && !props.street) return 'country';

    return 'locality';
  }

  /**
   * Main Search entry point: Open-Source First with multi-tier fallback.
   * 1. Pelias (if self-hosted / PELIAS_URL configured)
   * 2. Komoot Photon (Free global OSM/Pelias-compatible autocomplete)
   * 3. OpenStreetMap Nominatim (Server-side fallback with rate limiting)
   */
  public static async search(
    query: string,
    options: GeocodingSearchOptions = {}
  ): Promise<GeocodingSuggestion[]> {
    const q = this.normalizeQuery(query);
    if (!q || q.length < 2) return [];

    const limit = Math.max(1, Math.min(options.limit || this.DEFAULT_LIMIT, 10));
    const lang = options.language || 'id';
    const targetCountryCode = options.countryCode?.toUpperCase();

    const cacheKey = `geo_srch_v4_${encodeURIComponent(q)}_${lang}_${targetCountryCode || 'any'}_${limit}`;
    const cached = LocalApiCache.get<GeocodingSuggestion[]>(cacheKey);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return cached;
    }

    let results: GeocodingSuggestion[] = [];

    // 1. Try Pelias if configured
    if (process.env.PELIAS_URL) {
      try {
        results = await this.queryPelias(q, { ...options, limit, language: lang });
      } catch (err) {
        console.warn('[GeocodingService] Pelias query failed, falling back to Photon:', err);
      }
    }

    // 2. Try Komoot Photon (Open-Source Pelias-compatible OSM autocomplete)
    if (results.length === 0) {
      try {
        results = await this.queryPhoton(q, { ...options, limit, language: lang });
      } catch (err) {
        console.warn('[GeocodingService] Photon query failed, falling back to Nominatim:', err);
      }
    }

    // 3. Try Server-Side Nominatim Fallback
    if (results.length === 0) {
      try {
        results = await this.queryNominatim(q, { ...options, limit, language: lang });
      } catch (err) {
        console.warn('[GeocodingService] Nominatim fallback failed:', err);
      }
    }

    // Rank, deduplicate, and limit candidates
    const ranked = this.rankAndFilterSuggestions(q, results, targetCountryCode, limit);

    if (ranked.length > 0) {
      LocalApiCache.set(cacheKey, ranked, 3600); // 1 hour TTL
    }

    return ranked;
  }

  /**
   * Query Komoot Photon (Open-Source Pelias-compatible autocomplete).
   */
  private static async queryPhoton(
    query: string,
    options: GeocodingSearchOptions
  ): Promise<GeocodingSuggestion[]> {
    const limit = options.limit || this.DEFAULT_LIMIT;
    const lang = options.language === 'en' ? 'en' : 'de'; // Photon supports en, de, fr, it

    let url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=${limit + 5}`;
    if (lang) url += `&lang=${lang}`;

    // Apply geographic focus bias (default to Indonesia center if no coordinate provided)
    const biasLat = options.lat ?? -6.2088;
    const biasLon = options.lon ?? 106.8456;
    url += `&lat=${biasLat}&lon=${biasLon}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': this.USER_AGENT },
        signal: controller.signal
      });

      if (!res.ok) {
        throw new Error(`Photon returned HTTP ${res.status}`);
      }

      const json = await res.json();
      if (!json || !Array.isArray(json.features)) return [];

      const suggestions: GeocodingSuggestion[] = [];

      for (let i = 0; i < json.features.length; i++) {
        const feat = json.features[i];
        const coords = feat.geometry?.coordinates;
        const props = feat.properties || {};

        if (!coords || coords.length < 2) continue;
        const lng = Number(coords[0]);
        const lat = Number(coords[1]);
        if (isNaN(lat) || isNaN(lng)) continue;

        const name = (props.name || props.street || props.city || 'Lokasi').trim();
        const street = props.street ? String(props.street).trim() : null;
        const houseNumber = props.housenumber ? String(props.housenumber).trim() : null;
        const district = (props.district || props.suburb || props.quarter) ? String(props.district || props.suburb || props.quarter).trim() : null;
        const city = props.city ? String(props.city).trim() : null;
        const region = (props.state || props.county) ? String(props.state || props.county).trim() : null;
        const postalCode = props.postcode ? String(props.postcode).trim() : null;
        const country = props.country ? String(props.country).trim() : null;
        const countryCode = props.countrycode ? String(props.countrycode).toUpperCase().trim() : null;

        const streetLine = houseNumber && street ? `${street} No. ${houseNumber}` : (street || houseNumber || null);

        // Build structured address components without repeating the primary name
        const addressComponents = this.deduplicateAddressTokens([
          name !== streetLine ? streetLine : null,
          district,
          city,
          region,
          postalCode,
          country
        ]);

        const secondaryAddress = addressComponents.join(', ');
        const fullFormattedAddress = this.deduplicateAddressTokens([name, ...addressComponents]).join(', ');

        const resultType = this.resolveResultType({
          osm_key: props.osm_key,
          osm_value: props.osm_value,
          type: props.type,
          housenumber: props.housenumber,
          street: props.street,
          city: props.city,
          country: props.country
        });

        const id = `photon_${props.osm_type || 'N'}_${props.osm_id || `${lat}_${lng}_${i}`}`;

        suggestions.push({
          id,
          label: `${name}${secondaryAddress ? ` — ${secondaryAddress}` : ''}`,
          name,
          formattedAddress: fullFormattedAddress,
          houseNumber,
          street,
          neighbourhood: district,
          district,
          city,
          region,
          postalCode,
          country,
          countryCode,
          latitude: lat,
          longitude: lng,
          resultType,
          confidence: 0.85,
          provider: 'Photon (OpenStreetMap)',
          providerRecordId: props.osm_id ? String(props.osm_id) : null,
          displayName: fullFormattedAddress,
          type: resultType,
          addressDetails: {
            city: city || undefined,
            state: region || undefined,
            country: country || undefined,
            postcode: postalCode || undefined
          },
          provenance: {
            source: 'photon_komoot_osm',
            query,
            resultCount: json.features.length,
            selectedIndex: i,
            osmType: props.osm_type,
            osmId: props.osm_id,
            coordinates: { latitude: lat, longitude: lng }
          }
        });
      }

      return suggestions;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Query Pelias geocoder instance (if configured via PELIAS_URL).
   */
  private static async queryPelias(
    query: string,
    options: GeocodingSearchOptions
  ): Promise<GeocodingSuggestion[]> {
    const baseUrl = process.env.PELIAS_URL?.replace(/\/+$/, '');
    if (!baseUrl) return [];

    const limit = options.limit || this.DEFAULT_LIMIT;
    const url = `${baseUrl}/v1/autocomplete?text=${encodeURIComponent(query)}&size=${limit}`;

    const res = await fetch(url, {
      headers: { 'User-Agent': this.USER_AGENT }
    });

    if (!res.ok) throw new Error(`Pelias returned HTTP ${res.status}`);

    const json = await res.json();
    if (!json || !Array.isArray(json.features)) return [];

    return json.features.map((feat: any, idx: number) => {
      const coords = feat.geometry?.coordinates || [];
      const props = feat.properties || {};
      const lng = Number(coords[0]);
      const lat = Number(coords[1]);

      const name = props.name || props.label || 'Lokasi';
      const street = props.street || null;
      const houseNumber = props.housenumber || null;
      const district = props.locality || props.neighbourhood || null;
      const city = props.locality || props.county || null;
      const region = props.region || null;
      const postalCode = props.postalcode || null;
      const country = props.country || null;
      const countryCode = props.country_a ? String(props.country_a).toUpperCase() : null;

      const formattedAddress = props.label || this.deduplicateAddressTokens([name, street, district, city, region, country]).join(', ');

      return {
        id: `pelias_${props.id || idx}`,
        label: `${name} — ${formattedAddress}`,
        name,
        formattedAddress,
        houseNumber,
        street,
        neighbourhood: props.neighbourhood || null,
        district,
        city,
        region,
        postalCode,
        country,
        countryCode,
        latitude: lat,
        longitude: lng,
        resultType: (props.layer as GeocodingResultType) || 'locality',
        confidence: typeof props.confidence === 'number' ? props.confidence : 0.9,
        provider: 'Pelias Open Geocoder',
        providerRecordId: props.id ? String(props.id) : null,
        displayName: formattedAddress,
        type: props.layer || 'locality'
      };
    });
  }

  /**
   * Server-side fallback using OpenStreetMap Nominatim.
   */
  private static async queryNominatim(
    query: string,
    options: GeocodingSearchOptions
  ): Promise<GeocodingSuggestion[]> {
    const limit = options.limit || this.DEFAULT_LIMIT;
    let url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=jsonv2&addressdetails=1&limit=${limit + 4}`;
    if (options.countryCode) {
      url += `&countrycodes=${encodeURIComponent(options.countryCode.toLowerCase())}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': this.USER_AGENT, 'Accept-Language': options.language || 'id,en;q=0.8' },
        signal: controller.signal
      });

      if (!res.ok) return [];
      const json = await res.json();
      if (!Array.isArray(json)) return [];

      return json.map((item: any, idx: number) => {
        const lat = Number(item.lat);
        const lon = Number(item.lon);
        const addr = item.address || {};
        const name = (addr.road || addr.suburb || addr.city || addr.town || addr.village || item.display_name.split(',')[0] || 'Lokasi').trim();

        const houseNumber = addr.house_number ? String(addr.house_number).trim() : null;
        const street = addr.road ? String(addr.road).trim() : null;
        const district = (addr.suburb || addr.city_district || addr.district) ? String(addr.suburb || addr.city_district || addr.district).trim() : null;
        const city = (addr.city || addr.town || addr.municipality || addr.village) ? String(addr.city || addr.town || addr.municipality || addr.village).trim() : null;
        const region = (addr.state || addr.province || addr.region) ? String(addr.state || addr.province || addr.region).trim() : null;
        const postalCode = addr.postcode ? String(addr.postcode).trim() : null;
        const country = addr.country ? String(addr.country).trim() : null;
        const countryCode = addr.country_code ? String(addr.country_code).toUpperCase() : null;

        const streetLine = houseNumber && street ? `${street} No. ${houseNumber}` : (street || null);
        const fullFormattedAddress = this.deduplicateAddressTokens([name, streetLine, district, city, region, postalCode, country]).join(', ');

        const resultType = this.resolveResultType({
          type: item.type,
          housenumber: houseNumber || undefined,
          street: street || undefined,
          city: city || undefined,
          country: country || undefined
        });

        return {
          id: `osm_${item.osm_type || 'N'}_${item.osm_id || idx}`,
          label: `${name} — ${fullFormattedAddress}`,
          name,
          formattedAddress: fullFormattedAddress,
          houseNumber,
          street,
          neighbourhood: district,
          district,
          city,
          region,
          postalCode,
          country,
          countryCode,
          latitude: lat,
          longitude: lon,
          resultType,
          confidence: typeof item.importance === 'number' ? item.importance : 0.8,
          provider: 'OpenStreetMap Nominatim',
          providerRecordId: item.osm_id ? String(item.osm_id) : null,
          displayName: fullFormattedAddress,
          type: resultType
        };
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Rank and filter suggestions based on query relevance, country match, and result hierarchy.
   */
  private static rankAndFilterSuggestions(
    query: string,
    suggestions: GeocodingSuggestion[],
    preferredCountryCode?: string,
    limit: number = 8
  ): GeocodingSuggestion[] {
    const qLower = query.toLowerCase();

    // Deduplicate by geographical proximity (< 200m) and exact name
    const uniqueList: GeocodingSuggestion[] = [];
    for (const s of suggestions) {
      const isDuplicate = uniqueList.some(existing => {
        const sameName = existing.name.toLowerCase() === s.name.toLowerCase();
        const distLat = Math.abs(existing.latitude - s.latitude);
        const distLng = Math.abs(existing.longitude - s.longitude);
        return (sameName && distLat < 0.005 && distLng < 0.005) || (distLat < 0.0005 && distLng < 0.0005);
      });

      if (!isDuplicate) {
        uniqueList.push(s);
      }
    }

    const scored = uniqueList.map(item => {
      let score = 0;
      const nameLower = item.name.toLowerCase();
      const addrLower = item.formattedAddress.toLowerCase();

      // Exact text match bonus
      if (nameLower === qLower) score += 100;
      else if (nameLower.startsWith(qLower)) score += 60;
      else if (nameLower.includes(qLower)) score += 40;
      else if (addrLower.includes(qLower)) score += 20;

      // Preferred country match
      if (preferredCountryCode) {
        if (item.countryCode === preferredCountryCode) score += 30;
      } else {
        // Default Indonesia priority if query is typical Indonesian location
        if (item.countryCode === 'ID') score += 15;
      }

      // Hierarchy priority
      if (item.resultType === 'locality') score += 25;
      else if (item.resultType === 'street') score += 20;
      else if (item.resultType === 'address') score += 22;
      else if (item.resultType === 'venue') score += 18;
      else if (item.resultType === 'neighbourhood') score += 12;
      else if (item.resultType === 'district') score += 8;

      // Provider confidence
      if (item.confidence) score += Math.round(item.confidence * 10);

      return { item, score };
    });

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, limit).map(s => s.item);
  }
}
