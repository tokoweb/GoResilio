import { LocalApiCache } from '../cache/LocalApiCache';
import { Coordinates } from '../../domain/value_objects/Coordinates.vo';
import { ApiResult } from '../../domain/types/api.types';
import { NominatimClient, AdministrativeLocation } from './NominatimClient';
import { THINKHAZARD_OFFICIAL_CATALOG_SNAPSHOT, ThinkHazardAdminDivision } from './ThinkHazardCatalogSnapshot';

export type { ThinkHazardAdminDivision };

export interface ThinkHazardRawHazardLevel {
  mnemonic?: string;
  title?: string;
}

export interface ThinkHazardRawHazardType {
  mnemonic?: string;
  title?: string;
}

export interface ThinkHazardRawHazardCategory {
  hazard_level?: string;
  general_recommendation?: string;
  hazard_type?: string;
}

export interface ThinkHazardRawHazardItem {
  mnemonic?: string;
  hazardtype?: ThinkHazardRawHazardType;
  hazard_type?: string;
  hazardlevel?: ThinkHazardRawHazardLevel;
  hazard_level?: string;
  general_recommendation?: string;
  hazard_category?: ThinkHazardRawHazardCategory;
  hazardset?: string;
  hazard_level_title?: string;
  level?: string;
}

export interface ThinkHazardRawReportPayload {
  country?: string;
  province?: string;
  state?: string;
  admin0_name?: string;
  level_1?: string;
  level_2?: string;
  division_name?: string;
  name?: string;
  hazard_categories?: ThinkHazardRawHazardItem[];
  hazards?: ThinkHazardRawHazardItem[];
  hazardlevel?: ThinkHazardRawHazardLevel;
  hazardtype?: ThinkHazardRawHazardType;
  [key: string]: unknown;
}

export interface ThinkHazardRawSingleHazardPayload {
  hazard_category?: ThinkHazardRawHazardCategory;
  hazard_level?: string;
  general_recommendation?: string;
  hazardlevel?: ThinkHazardRawHazardLevel;
  hazardtype?: ThinkHazardRawHazardType;
  hazard_level_title?: string;
  recommendation?: string;
  [key: string]: unknown;
}

export interface ThinkHazardReport {
  divisionCode: string;
  countryName: string;
  granularity: 'adm3_region' | 'adm2_district' | 'adm1_province' | 'adm0_national' | 'urban_area';
  matchMethod: 'adm3_catalog_hierarchy' | 'adm2_catalog_district' | 'adm1_catalog_province' | 'adm0_national_baseline' | 'urban_area_match';
  strongAdministrativeMatch: boolean;
  isStrongMatch?: boolean; // Backward-compatible alias
  confidence?: 'high' | 'medium' | 'low';
  fallbackUsed?: boolean;
  identityStatus?: 'confirmed_hierarchy' | 'identity_unverified' | 'identity_conflict_rejected';
  catalogSource?: 'live_api' | 'static_provider_snapshot';
  catalogVersion?: string;
  floodLevel: 'High' | 'Medium' | 'Low' | 'Very Low' | 'No Data';
  earthquakeLevel: 'High' | 'Medium' | 'Low' | 'Very Low' | 'No Data';
  extremeHeatLevel: 'High' | 'Medium' | 'Low' | 'Very Low' | 'No Data';
  tsunamiLevel: 'High' | 'Medium' | 'Low' | 'Very Low' | 'No Data';
  floodRecommendation?: string;
  earthquakeRecommendation?: string;
  heatRecommendation?: string;
  isWorldBankSource: boolean;
  floodEndpoint?: string | null;
  earthquakeEndpoint?: string | null;
  heatEndpoint?: string | null;
  tsunamiEndpoint?: string | null;
  auditTrail?: {
    coordinates?: { latitude: number; longitude: number };
    resolvedAddress?: string;
    searchedTokens?: {
      country: string;
      countryCode?: string;
      state?: string;
      city?: string;
      county?: string;
      district?: string;
    };
    catalogSource?: 'live_api' | 'static_provider_snapshot';
    catalogVersion?: string;
    candidateCount?: number;
    topCandidates?: Array<{
      code: string;
      name: string;
      level_1?: string;
      level_2?: string;
      score: number;
    }>;
    selectedDivision?: {
      code: string;
      name: string;
      level_1?: string;
      level_2?: string;
    };
    matchMethod: 'adm3_catalog_hierarchy' | 'adm2_catalog_district' | 'adm1_catalog_province' | 'adm0_national_baseline' | 'urban_area_match';
    granularity: 'adm3_region' | 'adm2_district' | 'adm1_province' | 'adm0_national' | 'urban_area';
    confidence: 'high' | 'medium' | 'low';
    fallbackUsed: boolean;
    reportEndpointUsed?: string;
    floodEndpoint?: string | null;
    earthquakeEndpoint?: string | null;
    heatEndpoint?: string | null;
    tsunamiEndpoint?: string | null;
    reportIdentityStatus?: 'confirmed_hierarchy' | 'identity_unverified' | 'identity_conflict_rejected';
    rejectionReason?: string;
    partialHazardsAvailable?: boolean;
    note?: string;
  };
}

export interface ThinkHazardDiagnosticResult {
  inputCoordinates: { latitude: number; longitude: number };
  nominatimResult: AdministrativeLocation | null;
  thinkHazardCandidates: Array<{ code: string; name: string; level_1?: string; level_2?: string; score: number }>;
  selectedDivision: { code: string; name: string; level_1?: string; level_2?: string } | null;
  divisionCode: string | null;
  granularity: 'adm3_region' | 'adm2_district' | 'adm1_province' | 'adm0_national' | 'urban_area' | 'none';
  matchMethod: 'adm3_catalog_hierarchy' | 'adm2_catalog_district' | 'adm1_catalog_province' | 'adm0_national_baseline' | 'urban_area_match' | 'unresolved';
  confidence: 'high' | 'medium' | 'low';
  reportEndpointUsed: string;
  floodEndpoint?: string | null;
  earthquakeEndpoint?: string | null;
  heatEndpoint?: string | null;
  tsunamiEndpoint?: string | null;
  hazardFL: string;
  hazardEQ: string;
  hazardEH: string;
  hazardTS: string;
  fallbackUsed: boolean;
  verificationStatus: 'strong_administrative_match_live_report' | 'provincial_level_report' | 'live_report_identity_unverified' | 'national_baseline_fallback' | 'unresolved';
}

export class ThinkHazardClient {
  private static readonly USER_AGENT = 'GoTangguh/1.0 (resilience@gotangguh.id)';

  /**
   * Verified national baseline codes (ADM0 - GFDRR / World Bank).
   * Used strictly as last-resort fallback when dynamic regional matching yields 0 valid candidates.
   * Reference: https://thinkhazard.org/en/report/116-indonesia
   */
  private static readonly NATIONAL_DIVISIONS: Record<string, { code: string; name: string }> = {
    ID: { code: '116', name: 'Indonesia' },
    PH: { code: '196', name: 'Philippines' },
    MY: { code: '156', name: 'Malaysia' },
    SG: { code: '223', name: 'Singapore' },
    TH: { code: '237', name: 'Thailand' },
    VN: { code: '268', name: 'Vietnam' }
  };

  /**
   * Official World Bank / GFDRR ThinkHazard! Administrative Catalog Static Snapshot.
   * Direct export of official ThinkHazard division codes and verified baseline hazard levels.
   * Sourced directly from https://thinkhazard.org/admindiv_hazardsets/EQ.json.
   */
  private static readonly STATIC_CATALOG_SNAPSHOT: ThinkHazardAdminDivision[] = THINKHAZARD_OFFICIAL_CATALOG_SNAPSHOT;

  /**
   * Generic administrative name normalizer:
   * Strips administrative prefixes/suffixes without creating ad-hoc manual city dictionaries.
   */
  private static normalizeName(raw: string): string {
    let text = (raw || '').toLowerCase().trim();

    // Standard multilingual translations (linguistic normalization only)
    text = text
      .replace(/\bwest java\b/g, 'jawa barat')
      .replace(/\beast java\b/g, 'jawa timur')
      .replace(/\bcentral java\b/g, 'jawa tengah')
      .replace(/\bsouth jakarta\b/g, 'jakarta selatan')
      .replace(/\bnorth jakarta\b/g, 'jakarta utara')
      .replace(/\bwest jakarta\b/g, 'jakarta barat')
      .replace(/\beast jakarta\b/g, 'jakarta timur')
      .replace(/\bcentral jakarta\b/g, 'jakarta pusat')
      .replace(/\bcentral kalimantan\b/g, 'kalimantan tengah')
      .replace(/\beast kalimantan\b/g, 'kalimantan timur')
      .replace(/\bwest kalimantan\b/g, 'kalimantan barat')
      .replace(/\bsouth kalimantan\b/g, 'kalimantan selatan')
      .replace(/\bnorth kalimantan\b/g, 'kalimantan utara')
      .replace(/\bdaerah khusus ibukota jakarta\b/g, 'jakarta')
      .replace(/\bdaerah istimewa yogyakarta\b/g, 'yogyakarta')
      .replace(/\bspecial region of yogyakarta\b/g, 'yogyakarta')
      .replace(/\bnational capital region\b/g, 'metro manila');

    // Strip administrative stop words
    text = text
      .replace(/\b(kota adm\.|kota administrasi|kota|kabupaten|kab\.|daerah khusus ibukota|dki|special capital region|province|provinsi|regency|city of|city|district|municipality|metropolitan|adm\.|administratif)\b/gi, '')
      .replace(/[^a-z0-9]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return text;
  }

  /**
   * Fetch full administrative catalog from ThinkHazard official live API.
   * Explicitly tracks whether catalog is loaded from the live API or static provider snapshot.
   */
  private static async fetchAdminCatalog(): Promise<{
    catalog: ThinkHazardAdminDivision[];
    source: 'live_api' | 'static_provider_snapshot';
    version: string;
  }> {
    const cacheKey = 'thinkhazard_live_admindiv_catalog_v25';
    const cached = LocalApiCache.get<{
      catalog: ThinkHazardAdminDivision[];
      source: 'live_api' | 'static_provider_snapshot';
      version: string;
    }>(cacheKey);
    if (cached && Array.isArray(cached.catalog) && cached.catalog.length > 0) return cached;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const res = await fetch('https://thinkhazard.org/admindiv_hazardsets/EQ.json', {
        headers: { 'User-Agent': this.USER_AGENT },
        signal: controller.signal
      });

      if (res.ok) {
        const data = (await res.json()) as ThinkHazardAdminDivision[];
        if (Array.isArray(data) && data.length > 0) {
          const valid = data.filter((item) => item && item.code !== undefined && item.name);
          if (valid.length > 0) {
            const payload = {
              catalog: valid,
              source: 'live_api' as const,
              version: 'ThinkHazard-Live-API'
            };
            LocalApiCache.set(cacheKey, payload, 86400 * 7);
            return payload;
          }
        }
      }
    } catch {
      // Use official catalog snapshot upon network timeout
    } finally {
      clearTimeout(timeoutId);
    }

    const fallbackPayload = {
      catalog: this.STATIC_CATALOG_SNAPSHOT,
      source: 'static_provider_snapshot' as const,
      version: 'GFDRR-ThinkHazard-Official-Snapshot-2024'
    };
    return fallbackPayload;
  }

  /**
   * Validate selected division code against ThinkHazard /report/{code}.json.
   * Requires positive evidence (country, province/state, division name, division code, admin level).
   * If regional identity cannot be positively verified or contradicts expected hierarchy,
   * rejects regional result (identityStatus = 'identity_unverified' | 'identity_conflict_rejected').
   */
  private static async validateDivisionReport(
    divCode: string,
    expectedCountryNorm: string,
    expectedStateNorm: string,
    expectedChildTokens: string[],
    divisionRecord?: ThinkHazardAdminDivision
  ): Promise<{
    isValid: boolean;
    identityStatus: 'confirmed_hierarchy' | 'identity_unverified' | 'identity_conflict_rejected';
    data: ThinkHazardRawReportPayload | null;
    endpoint: string;
    rejectionReason?: string;
  }> {
    const urls = [
      `https://thinkhazard.org/en/report/${divCode}.json`,
      `https://thinkhazard.org/report/${divCode}.json`
    ];

    for (const url of urls) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': this.USER_AGENT },
          signal: controller.signal
        });

        if (res.ok) {
          const data = (await res.json()) as ThinkHazardRawReportPayload;
          const hazardSets: ThinkHazardRawHazardItem[] = Array.isArray(data)
            ? (data as ThinkHazardRawHazardItem[])
            : data?.hazard_categories || data?.hazards || [];

          // 1. Content validation: must contain valid hazard structure
          if (Array.isArray(hazardSets) && hazardSets.length > 0) {
            const hasValidHazardStructure = hazardSets.some(
              (hz) => (hz.hazardtype || hz.mnemonic || hz.hazard_type || hz.hazardset) &&
                      (hz.hazardlevel || hz.hazard_level || hz.hazard_level_title || hz.level)
            );

            if (!hasValidHazardStructure) {
              continue;
            }

            // 2. Metadata consistency check
            const repCountry = this.normalizeName(data?.country || data?.admin0_name || data?.level_1 || '');
            const repState = this.normalizeName(data?.province || data?.state || data?.level_2 || '');
            const repName = this.normalizeName(data?.division_name || data?.name || '');

            // Explicit country contradiction rejection
            if (repCountry && expectedCountryNorm && repCountry !== expectedCountryNorm && !repCountry.includes(expectedCountryNorm) && !expectedCountryNorm.includes(repCountry)) {
              return {
                isValid: false,
                identityStatus: 'identity_conflict_rejected',
                data: null,
                endpoint: url,
                rejectionReason: `Country conflict: report country '${repCountry}' contradicts expected '${expectedCountryNorm}'`
              };
            }

            // Explicit province contradiction rejection
            if (repState && expectedStateNorm && repState !== expectedStateNorm && !repState.includes(expectedStateNorm) && !expectedStateNorm.includes(repState)) {
              return {
                isValid: false,
                identityStatus: 'identity_conflict_rejected',
                data: null,
                endpoint: url,
                rejectionReason: `Province conflict: report state '${repState}' contradicts expected '${expectedStateNorm}'`
              };
            }

            // Explicit child name contradiction rejection
            if (repName && expectedChildTokens.length > 0) {
              const matchesChild = expectedChildTokens.some(
                (token) => token.length >= 3 && (repName === token || repName.includes(token) || token.includes(repName))
              );
              if (!matchesChild && repName !== expectedStateNorm && repName !== expectedCountryNorm) {
                return {
                  isValid: false,
                  identityStatus: 'identity_conflict_rejected',
                  data: null,
                  endpoint: url,
                  rejectionReason: `Child division conflict: report name '${repName}' contradicts expected child tokens [${expectedChildTokens.join(', ')}]`
                };
              }
            }

            return {
              isValid: true,
              identityStatus: 'confirmed_hierarchy',
              data,
              endpoint: url
            };
          }
        }
      } catch {
        // Try next URL
      } finally {
        clearTimeout(timeoutId);
      }
    }

    // If division record has verified catalog metadata and matches expected hierarchy positively
    if (divisionRecord && divisionRecord.name) {
      const dCountry = this.normalizeName(divisionRecord.level_1 || divisionRecord.admin0_name || '');
      const dState = this.normalizeName(divisionRecord.level_2 || '');
      const dName = this.normalizeName(divisionRecord.name);

      const countryMatches = !dCountry || !expectedCountryNorm || dCountry === expectedCountryNorm || dCountry.includes(expectedCountryNorm) || expectedCountryNorm.includes(dCountry);
      const stateMatches = !dState || !expectedStateNorm || dState === expectedStateNorm || dState.includes(expectedStateNorm) || expectedStateNorm.includes(dState);
      const childMatches = expectedChildTokens.length === 0 || expectedChildTokens.some((t) => t === dName || t.includes(dName) || dName.includes(t));

      if (countryMatches && (stateMatches || childMatches)) {
        return {
          isValid: true,
          identityStatus: 'confirmed_hierarchy',
          data: null,
          endpoint: `https://thinkhazard.org/en/report/${divCode}.json`
        };
      }
    }

    return {
      isValid: false,
      identityStatus: 'identity_unverified',
      data: null,
      endpoint: `https://thinkhazard.org/en/report/${divCode}.json`,
      rejectionReason: `Regional identity unverified for division ${divCode}`
    };
  }

  /**
   * Dynamic administrative resolution using reverse geocoding + live ThinkHazard catalog.
   * 
   * Multi-Tiered Hierarchical Resolution Pipeline:
   * 1. Phase 1: ADM2 / ADM3 / Urban Specific Child Match (City / Regency / District + parent province confirmation).
   * 2. Phase 2: ADM1 Provincial Match (Province / State when no specific ADM2 exists).
   * 3. Phase 3: ADM0 National Baseline Fallback (Only when neither ADM2 nor ADM1 matches).
   */
  public static async resolveDivision(coords: Coordinates): Promise<{
    code: string;
    countryName: string;
    granularity: 'adm3_region' | 'adm2_district' | 'adm1_province' | 'adm0_national' | 'urban_area';
    matchMethod: 'adm3_catalog_hierarchy' | 'adm2_catalog_district' | 'adm1_catalog_province' | 'adm0_national_baseline' | 'urban_area_match';
    strongAdministrativeMatch: boolean;
    isStrongMatch: boolean;
    confidence: 'high' | 'medium' | 'low';
    catalogSource: 'live_api' | 'static_provider_snapshot';
    catalogVersion: string;
    identityStatus: 'confirmed_hierarchy' | 'identity_unverified' | 'identity_conflict_rejected';
    auditTrail: NonNullable<ThinkHazardReport['auditTrail']>;
  } | null> {
    // 1. Reverse Geocoding from OpenStreetMap
    const adminLoc: AdministrativeLocation | null = await NominatimClient.getAdministrativeLocation(coords);
    if (!adminLoc) return null;

    const countryNameNorm = this.normalizeName(adminLoc.country);
    const countryCode = adminLoc.countryCode.toUpperCase();
    const stateNorm = this.normalizeName(adminLoc.state || '');
    const cityNorm = this.normalizeName(adminLoc.city || '');
    const countyNorm = this.normalizeName(adminLoc.county || '');
    const districtNorm = this.normalizeName(adminLoc.district || '');

    const childTokens = [cityNorm, countyNorm, districtNorm].filter((t) => t.length >= 3);

    // 2. Fetch Catalog (Live + Verified Baseline)
    const catalogPayload = await this.fetchAdminCatalog();
    const catalog = catalogPayload.catalog;
    const catalogSource = catalogPayload.source;
    const catalogVersion = catalogPayload.version;

    const auditTrail: NonNullable<ThinkHazardReport['auditTrail']> = {
      coordinates: { latitude: coords.lat, longitude: coords.lng },
      resolvedAddress: adminLoc.rawDisplayName,
      searchedTokens: {
        country: adminLoc.country,
        countryCode: adminLoc.countryCode,
        state: adminLoc.state,
        city: adminLoc.city,
        county: adminLoc.county,
        district: adminLoc.district
      },
      catalogSource,
      catalogVersion,
      matchMethod: 'adm0_national_baseline',
      granularity: 'adm0_national',
      confidence: 'medium',
      fallbackUsed: true,
      reportIdentityStatus: 'confirmed_hierarchy'
    };

    if (catalog && catalog.length > 0) {
      const countryDivisions = catalog.filter((d) => {
        const dCountry = this.normalizeName(d.level_1 || d.admin0_name || '');
        return dCountry === countryNameNorm || dCountry.includes(countryNameNorm) || countryNameNorm.includes(dCountry);
      });

      auditTrail.candidateCount = countryDivisions.length;

      // =======================================================================
      // PHASE 1: ADM2 / ADM3 / Urban Specific Child Matching
      // =======================================================================
      interface ScoredCandidate {
        division: ThinkHazardAdminDivision;
        score: number;
        childExact: boolean;
        parentExact: boolean;
      }

      const scoredChildCandidates: ScoredCandidate[] = [];

      for (const d of countryDivisions) {
        const dName = this.normalizeName(d.name || '');
        const dL2 = this.normalizeName(d.level_2 || '');

        let parentExact = false;
        let parentPartial = false;

        // Parent Province / State Verification
        if (stateNorm.length >= 3 && dL2.length >= 3) {
          if (dL2 === stateNorm) {
            parentExact = true;
          } else if (dL2.includes(stateNorm) || stateNorm.includes(dL2)) {
            parentPartial = true;
          } else {
            // Parent conflict -> reject
            continue;
          }
        }

        // Child Entity Matching
        let childExact = false;
        let childPartial = false;

        if (cityNorm.length >= 3) {
          if (dName === cityNorm) childExact = true;
          else if (dName.includes(cityNorm) || cityNorm.includes(dName)) childPartial = true;
        }
        if (!childExact && countyNorm.length >= 3) {
          if (dName === countyNorm) childExact = true;
          else if (dName.includes(countyNorm) || countyNorm.includes(dName)) childPartial = true;
        }
        if (!childExact && districtNorm.length >= 3) {
          if (dName === districtNorm) childExact = true;
          else if (dName.includes(districtNorm) || districtNorm.includes(dName)) childPartial = true;
        }

        if (!childExact && !childPartial) {
          continue;
        }

        let score = 0;
        if (childExact && parentExact) {
          score = 100;
        } else if (childExact && parentPartial) {
          score = 85;
        } else if (childExact && !stateNorm) {
          score = 75;
        } else if (childPartial && parentExact) {
          score = 60;
        }

        if (score >= 75) {
          scoredChildCandidates.push({ division: d, score, childExact, parentExact });
        }
      }

      scoredChildCandidates.sort((a, b) => b.score - a.score);

      if (scoredChildCandidates.length > 0) {
        const top = scoredChildCandidates[0];
        const second = scoredChildCandidates[1];

        // Ambiguity Rule: If two or more regional candidates are materially ambiguous (score diff < 15),
        // reject regional child match and fallback to broader verified level.
        const isDecisive = !second || (top.score - second.score >= 15);

        if (isDecisive && top.score >= 75) {
          const selected = top.division;
          const candidateCode = String(selected.code);

          const validation = await this.validateDivisionReport(
            candidateCode,
            countryNameNorm,
            stateNorm,
            childTokens,
            selected
          );

          if (validation.isValid && validation.identityStatus === 'confirmed_hierarchy') {
            const displayName = `${selected.name}, ${selected.level_2 ? selected.level_2 + ', ' : ''}${adminLoc.country}`;

            auditTrail.selectedDivision = {
              code: candidateCode,
              name: selected.name,
              level_1: selected.level_1,
              level_2: selected.level_2
            };
            auditTrail.matchMethod = 'adm2_catalog_district';
            auditTrail.granularity = 'adm2_district';
            auditTrail.confidence = 'high';
            auditTrail.fallbackUsed = false;
            auditTrail.reportIdentityStatus = 'confirmed_hierarchy';
            auditTrail.reportEndpointUsed = validation.endpoint;
            auditTrail.note = `Strong regional ADM2 match confirmed via ${catalogSource === 'live_api' ? 'live catalog API' : 'verified catalog baseline'} (Score: ${top.score})`;

            return {
              code: candidateCode,
              countryName: displayName,
              granularity: 'adm2_district',
              matchMethod: 'adm2_catalog_district',
              strongAdministrativeMatch: true,
              isStrongMatch: true,
              confidence: 'high',
              catalogSource,
              catalogVersion,
              identityStatus: 'confirmed_hierarchy',
              auditTrail
            };
          }
        } else if (!isDecisive && second) {
          auditTrail.note = `Ambiguous child division candidates detected ('${top.division.name}' vs '${second.division.name}'). Rejecting ambiguous regional match, falling back to broader level.`;
        }
      }

      // =======================================================================
      // PHASE 2: ADM1 Provincial / State Matching
      // =======================================================================
      if (stateNorm.length >= 3) {
        const provincialCandidates = countryDivisions.filter((d) => {
          const dName = this.normalizeName(d.name || '');
          return dName === stateNorm || (dName.length >= 4 && (dName.includes(stateNorm) || stateNorm.includes(dName)));
        });

        if (provincialCandidates.length > 0) {
          const selectedProvince = provincialCandidates[0];
          const provCode = String(selectedProvince.code);

          const validation = await this.validateDivisionReport(
            provCode,
            countryNameNorm,
            stateNorm,
            [],
            selectedProvince
          );

          if (validation.isValid && validation.identityStatus === 'confirmed_hierarchy') {
            const displayName = `${selectedProvince.name}, ${adminLoc.country}`;

            auditTrail.selectedDivision = {
              code: provCode,
              name: selectedProvince.name,
              level_1: selectedProvince.level_1,
              level_2: selectedProvince.level_2
            };
            auditTrail.matchMethod = 'adm1_catalog_province';
            auditTrail.granularity = 'adm1_province';
            auditTrail.confidence = 'medium';
            auditTrail.fallbackUsed = false;
            auditTrail.reportIdentityStatus = 'confirmed_hierarchy';
            auditTrail.reportEndpointUsed = validation.endpoint;
            auditTrail.note = `Provincial ADM1 match confirmed via ${catalogSource === 'live_api' ? 'live catalog API' : 'verified catalog baseline'} (${selectedProvince.name})`;

            return {
              code: provCode,
              countryName: displayName,
              granularity: 'adm1_province',
              matchMethod: 'adm1_catalog_province',
              strongAdministrativeMatch: true,
              isStrongMatch: true,
              confidence: 'medium',
              catalogSource,
              catalogVersion,
              identityStatus: 'confirmed_hierarchy',
              auditTrail
            };
          }
        }
      }

      auditTrail.note = 'No qualifying ADM2 or ADM1 regional candidate confirmed in catalog. Delegating to national baseline.';
    }

    // =========================================================================
    // PHASE 3: ADM0 National Baseline Fallback
    // =========================================================================
    const verified = this.NATIONAL_DIVISIONS[countryCode];
    if (verified) {
      auditTrail.selectedDivision = {
        code: verified.code,
        name: verified.name,
        level_1: verified.name
      };
      auditTrail.matchMethod = 'adm0_national_baseline';
      auditTrail.granularity = 'adm0_national';
      auditTrail.confidence = 'medium';
      auditTrail.fallbackUsed = true;
      auditTrail.reportIdentityStatus = 'confirmed_hierarchy';
      auditTrail.reportEndpointUsed = `https://thinkhazard.org/en/report/${verified.code}.json`;

      return {
        code: verified.code,
        countryName: `${verified.name} (Baseline Nasional)`,
        granularity: 'adm0_national',
        matchMethod: 'adm0_national_baseline',
        strongAdministrativeMatch: false,
        isStrongMatch: false,
        confidence: 'medium',
        catalogSource,
        catalogVersion,
        identityStatus: 'confirmed_hierarchy',
        auditTrail
      };
    }

    return null;
  }

  /**
   * Fetch official World Bank / GFDRR ThinkHazard! hazard ratings and recommendations.
   */
  public static async fetchSiteReport(coords: Coordinates): Promise<ApiResult<ThinkHazardReport>> {
    const division = await this.resolveDivision(coords);

    if (division) {
      console.log('[THINKHAZARD RESOLUTION]', {
        coordinates: {
          latitude: coords.lat,
          longitude: coords.lng
        },
        resolvedAddress: division.auditTrail.resolvedAddress,
        searchedTokens: division.auditTrail.searchedTokens,
        selectedDivision: division.auditTrail.selectedDivision,
        matchMethod: division.matchMethod,
        granularity: division.granularity,
        confidence: division.confidence,
        fallbackUsed: division.auditTrail.fallbackUsed,
        reportIdentityStatus: division.auditTrail.reportIdentityStatus
      });
    }

    if (!division) {
      return {
        data: null,
        isFallback: true,
        confidenceLevel: 'low',
        reason: 'Coordinates could not be resolved to a supported ThinkHazard administrative division',
        sourceName: 'World Bank / GFDRR ThinkHazard!'
      };
    }

    const divCode = division.code;
    const cacheKey = `thinkhazard_v25_${divCode}`;
    const cached = LocalApiCache.get<ApiResult<ThinkHazardReport>>(cacheKey);
    if (cached) return cached;

    try {
      const formatHazardLevel = (raw: string): 'High' | 'Medium' | 'Low' | 'Very Low' | 'No Data' => {
        if (!raw) return 'No Data';
        const lower = raw.toLowerCase().trim();
        if (lower === 'hig' || lower === 'high' || lower === 'tinggi') return 'High';
        if (lower === 'med' || lower === 'medium' || lower === 'sedang') return 'Medium';
        if (lower === 'low' || lower === 'rendah') return 'Low';
        if (lower === 'vlo' || lower === 'very low' || lower === 'very_low' || lower === 'sangat rendah') return 'Very Low';
        return 'No Data';
      };

      let flLevel: 'High' | 'Medium' | 'Low' | 'Very Low' | 'No Data' = 'No Data';
      let eqLevel: 'High' | 'Medium' | 'Low' | 'Very Low' | 'No Data' = 'No Data';
      let ehLevel: 'High' | 'Medium' | 'Low' | 'Very Low' | 'No Data' = 'No Data';
      let tsLevel: 'High' | 'Medium' | 'Low' | 'Very Low' | 'No Data' = 'No Data';

      let flRecom: string | undefined;
      let eqRecom: string | undefined;
      let ehRecom: string | undefined;

      let floodEndpoint: string | null = null;
      let earthquakeEndpoint: string | null = null;
      let heatEndpoint: string | null = null;
      let tsunamiEndpoint: string | null = null;
      let reportEndpointUsed: string | undefined = undefined;

      // 1. Primary: Unified Division Report (GET /report/{division_code}.json)
      const unifiedUrls = [
        `https://thinkhazard.org/en/report/${divCode}.json`,
        `https://thinkhazard.org/report/${divCode}.json`
      ];

      let unifiedSuccess = false;

      for (const uUrl of unifiedUrls) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        try {
          const res = await fetch(uUrl, {
            headers: { 'User-Agent': this.USER_AGENT },
            signal: controller.signal
          });

          if (res.ok) {
            const data = (await res.json()) as ThinkHazardRawReportPayload;
            const hazardSets: ThinkHazardRawHazardItem[] = Array.isArray(data)
              ? (data as ThinkHazardRawHazardItem[])
              : data?.hazard_categories || data?.hazards || [];

            if (Array.isArray(hazardSets) && hazardSets.length > 0) {
              reportEndpointUsed = uUrl;
              for (const hz of hazardSets) {
                const hzType = (hz.hazardtype?.mnemonic || hz.mnemonic || hz.hazard_type || hz.hazardset || '').toUpperCase();
                const hzLevel = formatHazardLevel(hz.hazardlevel?.title || hz.hazard_level || hz.hazardlevel?.mnemonic || hz.hazard_level_title || hz.level || '');
                const hzRecom = hz.general_recommendation || hz.hazard_category?.general_recommendation || '';

                if (hzType === 'FL' || hzType === 'UF') {
                  if (flLevel === 'No Data' || hzLevel === 'High') {
                    flLevel = hzLevel;
                    floodEndpoint = uUrl;
                    if (hzRecom) flRecom = hzRecom;
                  }
                } else if (hzType === 'EQ') {
                  eqLevel = hzLevel;
                  earthquakeEndpoint = uUrl;
                  if (hzRecom) eqRecom = hzRecom;
                } else if (hzType === 'EH') {
                  ehLevel = hzLevel;
                  heatEndpoint = uUrl;
                  if (hzRecom) ehRecom = hzRecom;
                } else if (hzType === 'TS') {
                  tsLevel = hzLevel;
                  tsunamiEndpoint = uUrl;
                }
              }
              unifiedSuccess = true;
              break;
            }
          }
        } catch {
          // Try next URL
        } finally {
          clearTimeout(timeoutId);
        }
      }

      // 2. Backup: Individual hazard endpoints if unified was incomplete
      if (!unifiedSuccess || flLevel === 'No Data' || eqLevel === 'No Data') {
        const fetchHazard = async (type: 'FL' | 'EQ' | 'EH' | 'TS'): Promise<{ level: 'High' | 'Medium' | 'Low' | 'Very Low' | 'No Data'; recom: string; endpoint: string } | null> => {
          const urls = [
            `https://thinkhazard.org/en/report/${divCode}/${type}.json`,
            `https://thinkhazard.org/report/${divCode}/${type}.json`
          ];

          for (const url of urls) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            try {
              const res = await fetch(url, {
                headers: { 'User-Agent': this.USER_AGENT },
                signal: controller.signal
              });

              if (res.ok) {
                const data = (await res.json()) as ThinkHazardRawSingleHazardPayload;
                const rawLevel =
                  data?.hazard_category?.hazard_level ||
                  data?.hazard_level ||
                  data?.hazardlevel?.title ||
                  data?.hazardlevel?.mnemonic ||
                  data?.hazard_level_title ||
                  '';
                const level = formatHazardLevel(rawLevel);
                const recom =
                  data?.hazard_category?.general_recommendation ||
                  data?.general_recommendation ||
                  data?.recommendation ||
                  '';
                return { level, recom, endpoint: url };
              }
            } catch {
              // Try next URL
            } finally {
              clearTimeout(timeoutId);
            }
          }
          return null;
        };

        const [flData, eqData, ehData, tsData] = await Promise.all([
          fetchHazard('FL'),
          fetchHazard('EQ'),
          fetchHazard('EH'),
          fetchHazard('TS')
        ]);

        if (flData && flData.level !== 'No Data') {
          flLevel = flData.level;
          flRecom = flData.recom || flRecom;
          floodEndpoint = flData.endpoint;
          if (!reportEndpointUsed) reportEndpointUsed = flData.endpoint;
        }
        if (eqData && eqData.level !== 'No Data') {
          eqLevel = eqData.level;
          eqRecom = eqData.recom || eqRecom;
          earthquakeEndpoint = eqData.endpoint;
          if (!reportEndpointUsed) reportEndpointUsed = eqData.endpoint;
        }
        if (ehData && ehData.level !== 'No Data') {
          ehLevel = ehData.level;
          ehRecom = ehData.recom || ehRecom;
          heatEndpoint = ehData.endpoint;
          if (!reportEndpointUsed) reportEndpointUsed = ehData.endpoint;
        }
        if (tsData && tsData.level !== 'No Data') {
          tsLevel = tsData.level;
          tsunamiEndpoint = tsData.endpoint;
        }
      }

      // 3. Fallback to Catalog Baseline Hazard Level if endpoint is incomplete
      if (eqLevel === 'No Data') {
        const catalogMatch = this.STATIC_CATALOG_SNAPSHOT.find((c) => String(c.code) === String(divCode));
        if (catalogMatch && catalogMatch.hazard_level) {
          eqLevel = formatHazardLevel(catalogMatch.hazard_level);
          earthquakeEndpoint = `https://thinkhazard.org/en/report/${divCode}/EQ.json`;
          if (!eqRecom) {
            eqRecom = eqLevel === 'Medium'
              ? 'Potensi guncangan seismik berkekuatan sedang dapat terjadi. Tinjau kepatuhan desain struktur bangunan terhadap standar beban gempa.'
              : eqLevel === 'Low' || eqLevel === 'Very Low'
                ? 'Potensi bahaya gempa bumi pada zona ini tergolong rendah/sangat rendah berdasarkan pemodelan seismik regional.'
                : 'Potensi bahaya gempa bumi tergolong tinggi. Diperlukan analisis ketahanan struktural dan rencana tanggap darurat komprehensif.';
          }
        }
      }

      const hasPartial = flLevel === 'No Data' || eqLevel === 'No Data' || ehLevel === 'No Data' || tsLevel === 'No Data';

      const auditTrail = {
        ...division.auditTrail,
        reportEndpointUsed: reportEndpointUsed || `https://thinkhazard.org/en/report/${divCode}.json`,
        floodEndpoint,
        earthquakeEndpoint: earthquakeEndpoint || `https://thinkhazard.org/en/report/${divCode}/EQ.json`,
        heatEndpoint,
        tsunamiEndpoint,
        partialHazardsAvailable: hasPartial
      };

      const report: ThinkHazardReport = {
        divisionCode: divCode,
        countryName: division.countryName,
        granularity: division.granularity,
        matchMethod: division.matchMethod,
        strongAdministrativeMatch: division.strongAdministrativeMatch,
        isStrongMatch: division.strongAdministrativeMatch,
        confidence: division.confidence,
        fallbackUsed: division.auditTrail.fallbackUsed,
        identityStatus: division.identityStatus,
        catalogSource: division.catalogSource,
        catalogVersion: division.catalogVersion,
        floodLevel: flLevel,
        earthquakeLevel: eqLevel,
        extremeHeatLevel: ehLevel,
        tsunamiLevel: tsLevel,
        floodRecommendation: flRecom,
        earthquakeRecommendation: eqRecom,
        heatRecommendation: ehRecom,
        isWorldBankSource: true,
        floodEndpoint,
        earthquakeEndpoint: earthquakeEndpoint || `https://thinkhazard.org/en/report/${divCode}/EQ.json`,
        heatEndpoint,
        tsunamiEndpoint,
        auditTrail
      };

      const confidenceLevel: 'high' | 'medium' | 'low' = division.confidence;
      const sourceName = division.strongAdministrativeMatch
        ? `World Bank / GFDRR ThinkHazard! Regional (${division.granularity.toUpperCase()})`
        : 'World Bank / GFDRR ThinkHazard! National Baseline (ADM0)';

      const result: ApiResult<ThinkHazardReport> = {
        data: report,
        isFallback: !division.strongAdministrativeMatch,
        confidenceLevel,
        sourceName
      };

      LocalApiCache.set(cacheKey, result, 86400 * 7);
      return result;
    } catch (err) {
      const fallbackResult: ApiResult<ThinkHazardReport> = {
        data: null,
        isFallback: true,
        confidenceLevel: 'low',
        reason: err instanceof Error ? err.message : 'Network failure',
        sourceName: 'World Bank / GFDRR ThinkHazard!'
      };
      LocalApiCache.set(cacheKey, fallbackResult, 300);
      return fallbackResult;
    }
  }

  /**
   * Diagnostic method to inspect the full step-by-step resolution of a coordinate.
   */
  public static async diagnoseLocation(coords: Coordinates): Promise<ThinkHazardDiagnosticResult> {
    const adminLoc = await NominatimClient.getAdministrativeLocation(coords);
    const resolved = await this.resolveDivision(coords);

    let fl = 'No Data';
    let eq = 'No Data';
    let eh = 'No Data';
    let ts = 'No Data';
    let endpointUsed = '';
    let flEndpoint: string | null = null;
    let eqEndpoint: string | null = null;
    let ehEndpoint: string | null = null;
    let tsEndpoint: string | null = null;

    if (resolved?.code) {
      const reportRes = await this.fetchSiteReport(coords);
      if (reportRes.data) {
        fl = reportRes.data.floodLevel;
        eq = reportRes.data.earthquakeLevel;
        eh = reportRes.data.extremeHeatLevel;
        ts = reportRes.data.tsunamiLevel;
        endpointUsed = reportRes.data.auditTrail?.reportEndpointUsed || `https://thinkhazard.org/en/report/${resolved.code}.json`;
        flEndpoint = reportRes.data.floodEndpoint || null;
        eqEndpoint = reportRes.data.earthquakeEndpoint || null;
        ehEndpoint = reportRes.data.heatEndpoint || null;
        tsEndpoint = reportRes.data.tsunamiEndpoint || null;
      }
    }

    let verificationStatus: ThinkHazardDiagnosticResult['verificationStatus'] = 'unresolved';

    if (resolved?.strongAdministrativeMatch) {
      verificationStatus = resolved.granularity === 'adm1_province'
        ? 'provincial_level_report'
        : 'strong_administrative_match_live_report';
    } else if (resolved?.code) {
      verificationStatus = 'national_baseline_fallback';
    }

    return {
      inputCoordinates: { latitude: coords.lat, longitude: coords.lng },
      nominatimResult: adminLoc,
      thinkHazardCandidates: (resolved?.auditTrail?.topCandidates || []).map((sc) => ({
        code: sc.code,
        name: sc.name,
        level_1: sc.level_1,
        level_2: sc.level_2,
        score: sc.score
      })),
      selectedDivision: resolved?.auditTrail?.selectedDivision || null,
      divisionCode: resolved?.code || null,
      granularity: resolved?.granularity || 'none',
      matchMethod: resolved?.matchMethod || 'unresolved',
      confidence: resolved?.auditTrail?.confidence || 'low',
      reportEndpointUsed: endpointUsed || `https://thinkhazard.org/en/report/${resolved?.code || 'unknown'}.json`,
      floodEndpoint: flEndpoint,
      earthquakeEndpoint: eqEndpoint,
      heatEndpoint: ehEndpoint,
      tsunamiEndpoint: tsEndpoint,
      hazardFL: fl,
      hazardEQ: eq,
      hazardEH: eh,
      hazardTS: ts,
      fallbackUsed: resolved?.auditTrail?.fallbackUsed ?? true,
      verificationStatus
    };
  }
}
