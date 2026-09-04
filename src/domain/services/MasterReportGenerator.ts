import type {
  MultiHazardAssessmentResult,
  PropertyType,
  UserPersona
} from '../types/hazard.types';
import type { ReportViewModel, DonutChartViewModel, SeismicTimelinePoint, RiskComparisonRow } from '../types/ReportViewModel.types';
import { ReportViewModelBuilder, ReportBuilderOptions } from './ReportViewModelBuilder';

export interface MasterReportOptions {
  assessment: MultiHazardAssessmentResult;
  lang?: 'id' | 'en';
  propertyType?: PropertyType;
  userPersona?: UserPersona;
  ownerName?: string | null;
  isSample?: boolean;
}

export class MasterReportGenerator {
  /**
   * Backward-compatible helper that returns the raw section content dictionary
   * Backed directly by the authoritative ReportViewModelBuilder.
   */
  public static getSectionContent(options: MasterReportOptions) {
    const vm = ReportViewModelBuilder.build(options.assessment, options);
    const isEn = options.lang === 'en';

    return {
      cover: {
        title: vm.cover.title,
        tagline: vm.cover.tagline,
        referenceNumber: vm.cover.referenceNumber,
        date: vm.cover.assessmentDate,
        locationAddress: vm.cover.propertyAddress,
        coordinates: vm.cover.coordinates,
        propertyType: vm.cover.propertyType,
        ownerName: vm.cover.ownerName
      },
      execSummary: {
        title: vm.executiveSummary.title,
        overallScoreText: vm.executiveSummary.overallScoreText,
        overallLevelText: vm.executiveSummary.overallLevelText,
        overallColor: vm.executiveSummary.overallColor,
        dominantHazard: vm.executiveSummary.dominantHazardName,
        hazardDonuts: vm.executiveSummary.hazardDonuts,
        generalOverview: vm.executiveSummary.generalOverview,
        topRecommendations: vm.executiveSummary.topRecommendations
      },
      propertyProfile: {
        title: vm.propertyProfile.title,
        cityRegency: vm.propertyProfile.cityRegency,
        areaCharacteristic: vm.propertyProfile.areaCharacteristic,
        buildingType: vm.propertyProfile.buildingType,
        floorCount: vm.propertyProfile.floorCount,
        buildingAge: vm.propertyProfile.buildingAge,
        distanceToWaterway: vm.propertyProfile.distanceToWaterway,
        buildingDensity: vm.propertyProfile.buildingDensity,
        accessibility: vm.propertyProfile.accessibility,
        description: vm.propertyProfile.description
      },
      methodology: {
        title: vm.methodology.title,
        intro: vm.methodology.introBody,
        tableRows: vm.methodology.aspectRows.map(r => ({ aspect: r.aspect, explanation: r.explanation })),
        simpleSummary: vm.methodology.layExplanationBody
      },
      earthquakeSection: {
        title: isEn ? 'Earthquake Risk' : 'Risiko Gempa Bumi',
        score: vm.earthquakeSection.donut.score,
        scoreColor: vm.earthquakeSection.donut.color,
        levelText: vm.earthquakeSection.donut.level,
        historicalEvidence: [
          { label: isEn ? 'Earthquake Hazard Level' : 'Tingkat Bahaya Gempa', value: vm.earthquakeSection.donut.level },
          { label: isEn ? 'Nearest Active Fault' : 'Sesar Aktif Terdekat', value: `${vm.earthquakeSection.faultNameDisplay} (${vm.earthquakeSection.faultDistanceDisplay})` },
          { label: isEn ? 'Estimated Ground Shaking' : 'Perkiraan Guncangan', value: vm.earthquakeSection.pgaDisplay },
          { label: isEn ? '10-Year Historical Seismicity' : 'Riwayat Gempa di Sekitar', value: vm.earthquakeSection.historicalCount10Yr },
          { label: isEn ? 'Strongest Recorded Event' : 'Gempa Terkuat', value: vm.earthquakeSection.strongestQuakeText },
          { label: isEn ? 'Liquefaction Potential' : 'Potensi Likuefaksi', value: vm.earthquakeSection.liquefactionStatus }
        ],
        frequency: vm.earthquakeSection.frequencyText,
        impactInterpretation: vm.earthquakeSection.impactText,
        recommendations: [
          { priority: isEn ? 'High Priority' : 'Prioritas Tinggi', text: vm.earthquakeSection.primaryRecommendation },
          { priority: isEn ? 'Suggested' : 'Disarankan', text: vm.earthquakeSection.suggestedRecommendation }
        ],
        conclusion: vm.earthquakeSection.conclusionText
      },
      floodSection: {
        title: isEn ? 'Flood Risk' : 'Risiko Banjir',
        score: vm.floodSection.donut.score,
        scoreColor: vm.floodSection.donut.color,
        levelText: vm.floodSection.donut.level,
        evidenceItems: [
          { label: isEn ? 'Site Historical Flood Record' : 'Riwayat Genangan Historis', value: vm.floodSection.historicalInundationDisplay },
          { label: isEn ? 'Observed Flood Depth' : 'Kedalaman Genangan', value: vm.floodSection.floodDepthDisplay },
          { label: isEn ? 'Site Elevation' : 'Ketinggian Lokasi', value: vm.floodSection.elevationDisplay },
          { label: isEn ? 'Max 24h Extreme Precipitation' : 'Hujan Terberat', value: vm.floodSection.rainfall24hDisplay },
          { label: isEn ? 'Distance to Waterway / Canal' : 'Jarak ke Sungai / Saluran', value: vm.floodSection.waterwayDistanceDisplay },
          { label: isEn ? 'Terrain Landform' : 'Bentuk Lahan', value: vm.floodSection.terrainLandformDisplay }
        ],
        frequency: vm.floodSection.frequencyText,
        impactInterpretation: vm.floodSection.impactText,
        recommendations: [
          { priority: isEn ? 'High Priority' : 'Prioritas Tinggi', text: vm.floodSection.primaryRecommendation },
          { priority: isEn ? 'Suggested' : 'Disarankan', text: vm.floodSection.suggestedRecommendation }
        ],
        conclusion: vm.floodSection.conclusionText
      },
      heatSection: {
        title: isEn ? 'Heat Stress Risk' : 'Risiko Heat Stress',
        score: vm.heatSection.donut.score,
        scoreColor: vm.heatSection.donut.color,
        levelText: vm.heatSection.donut.level,
        evidenceItems: [
          { label: isEn ? 'Forecast Peak Temperature' : 'Suhu Prakiraan', value: vm.heatSection.forecastPeakTempDisplay },
          { label: isEn ? 'Historical Peak Temperature' : 'Suhu Tertinggi', value: vm.heatSection.historicalPeakTempDisplay },
          { label: isEn ? 'Temperature Change Projection (CMIP6 2050)' : 'Proyeksi Perubahan Suhu (CMIP6 2050)', value: vm.heatSection.projectedTempRise2050Display },
          { label: isEn ? 'Ambient Air Quality' : 'Kualitas Udara Sekitar', value: vm.heatSection.airQualityDisplay },
          { label: isEn ? 'Heat Exposure Level' : 'Paparan Panas', value: vm.heatSection.heatExposureLevelDisplay }
        ],
        frequency: vm.heatSection.frequencyText,
        impactInterpretation: vm.heatSection.impactText,
        recommendations: [
          { priority: isEn ? 'High Priority' : 'Prioritas Tinggi', text: vm.heatSection.primaryRecommendation },
          { priority: isEn ? 'Suggested' : 'Disarankan', text: vm.heatSection.suggestedRecommendation }
        ],
        conclusion: vm.heatSection.conclusionText
      },
      transportSection: {
        title: isEn ? 'Accessibility & Transport' : 'Aksesibilitas dan Transportasi',
        facilities: vm.accessibilitySection.facilities.map(f => ({
          facility: f.category,
          name: f.name,
          distance: f.distance,
          travelTime: f.travelTime,
          category: f.category
        })),
        facilitiesTable: vm.accessibilitySection.facilities,
        interpretation: vm.accessibilitySection.interpretationText,
        riskNote: vm.accessibilitySection.riskNotesText,
        riskNotes: vm.accessibilitySection.riskNotesText,
        fastestRoute: vm.accessibilitySection.fastestRouteText,
        alternativeRoute: vm.accessibilitySection.alternativeRouteText,
        routeRecommendation: vm.accessibilitySection.fastestRouteText
      },
      riskComparison: {
        title: isEn ? 'Risk Comparison' : 'Perbandingan Risiko',
        rows: vm.riskComparison.rows,
        tableRows: vm.riskComparison.rows.map(r => ({
          hazard: r.hazardId === 'quake' ? (isEn ? 'Earthquake' : 'Gempa bumi') :
                  r.hazardId === 'flood' ? (isEn ? 'Flood' : 'Banjir') :
                  (isEn ? 'Heat Stress' : 'Heat Stress'),
          score: r.scoreNum !== null ? `${r.scoreNum}/100` : (isEn ? 'Data unavailable' : 'Data belum tersedia'),
          level: r.levelName,
          reliability: r.reliability,
          color: r.color
        })),
        dominantInsight: vm.riskComparison.insightText,
        dominantHazardConclusion: vm.riskComparison.insightText
      },
      actionPlan: {
        title: isEn ? 'Action Plan (Mitigation & Adaptation)' : 'Rencana Tindakan (Mitigasi dan Adaptasi)',
        subtitle: vm.actionPlan.subtitle,
        priority1: {
          heading: isEn ? 'Priority 1 (Immediate)' : 'Prioritas 1 (Segera)',
          items: vm.actionPlan.priority1List
        },
        priority2: {
          heading: isEn ? 'Priority 2 (Medium-Term)' : 'Prioritas 2 (Jangka Menengah)',
          items: vm.actionPlan.priority2List
        },
        priority3: {
          heading: isEn ? 'Priority 3 (Long-Term & Adaptation)' : 'Prioritas 3 (Jangka Panjang & Adaptasi)',
          items: vm.actionPlan.priority3List
        },
        note: isEn
          ? 'Notes: Not all actions need to be carried out at once—prioritize based on risk level.'
          : 'Catatan: Tidak semua tindakan perlu dilakukan sekaligus—prioritaskan berdasarkan tingkat risiko.',
        implementationNotes: vm.actionPlan.notesBody
      },
      closing: {
        title: isEn ? 'Conclusion & Next Steps' : 'Penutup',
        conclusion: vm.closing.conclusionSummary,
        conclusionSummary: vm.closing.conclusionSummary,
        disclaimer: isEn
          ? 'This analysis serves as an initial screening indicator based on public spatial data and does not replace technical due diligence, soil investigation, or professional structural audit.'
          : 'Analisis ini merupakan indikator penapisan awal berbasis data spasial publik dan tidak menggantikan uji tuntas teknis, penyelidikan tanah, atau audit struktural profesional.',
        nextSteps: vm.closing.nextSteps
      }
    };
  }

  // =========================================================================
  // CHART & FIGURE VECTOR GENERATORS (GROUNDSURE SPEC)
  // =========================================================================

  /** Crisp institutional vector icon helper (Stroke 2px line-art, 100% zero emojis) */
  public static svgIcon(name: string, color = '#0f172a', size = 16): string {
    const s = `width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; flex-shrink:0;"`;
    switch (name) {
      case 'shield':
        return `<svg ${s}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
      case 'building':
        return `<svg ${s}><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/></svg>`;
      case 'chart':
        return `<svg ${s}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`;
      case 'seismic':
        return `<svg ${s}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`;
      case 'waves':
        return `<svg ${s}><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>`;
      case 'sun':
        return `<svg ${s}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
      case 'navigation':
        return `<svg ${s}><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>`;
      case 'scale':
        return `<svg ${s}><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>`;
      case 'clipboard':
        return `<svg ${s}><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="m9 14 2 2 4-4"/></svg>`;
      case 'alert':
        return `<svg ${s}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
      case 'pin':
        return `<svg ${s}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
      default:
        return '';
    }
  }

  /** Donut Score Chart SVG */
  public static renderSvgDonut(score: number | null, color: string, size = 80, strokeWidth = 8): string {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const scoreVal = score !== null && !isNaN(score) ? Math.min(100, Math.max(0, score)) : null;
    const strokeDashoffset = scoreVal !== null ? circumference - (scoreVal / 100) * circumference : circumference;

    return `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="display:inline-block; vertical-align:middle;">
        <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" stroke="#e2e8f0" stroke-width="${strokeWidth}" fill="none" />
        ${scoreVal !== null ? `
          <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" stroke="${color}" stroke-width="${strokeWidth}" fill="none"
            stroke-dasharray="${circumference}" stroke-dashoffset="${strokeDashoffset}" stroke-linecap="round"
            transform="rotate(-90 ${size / 2} ${size / 2})" />
          <text x="${size / 2}" y="${size / 2 - 2}" text-anchor="middle" font-size="${Math.round(size * 0.23)}" font-weight="800" fill="#0f172a" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">${scoreVal}</text>
          <text x="${size / 2}" y="${size / 2 + 13}" text-anchor="middle" font-size="${Math.round(size * 0.12)}" font-weight="600" fill="#64748b" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">/100</text>
        ` : `
          <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" stroke="#cbd5e1" stroke-width="${strokeWidth}" stroke-dasharray="3 3" fill="none" />
          <text x="${size / 2}" y="${size / 2 + 4}" text-anchor="middle" font-size="${Math.round(size * 0.16)}" font-weight="700" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">N/A</text>
        `}
      </svg>
    `;
  }

  /** 10-Year Seismic Activity Timeline */
  public static renderSvgEarthquakeTimeline(points: SeismicTimelinePoint[], width = 540, height = 110): string {
    if (!points || points.length === 0) return '';
    const maxCount = Math.max(5, ...points.map(p => p.count));
    const padL = 36, padR = 20, padT = 20, padB = 22;
    const chartW = width - padL - padR;
    const chartH = height - padT - padB;
    const stepX = chartW / (points.length - 1);

    const coords = points.map((p, i) => ({
      x: padL + i * stepX,
      y: padT + chartH - (p.count / maxCount) * chartH,
      year: p.year, count: p.count, mag: p.maxMagnitude
    }));

    const pathD = coords.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`, '');
    const areaD = `${pathD} L ${coords[coords.length - 1].x.toFixed(1)} ${(padT + chartH).toFixed(1)} L ${coords[0].x.toFixed(1)} ${(padT + chartH).toFixed(1)} Z`;
    const peakPt = coords.reduce((prev, curr) => (curr.mag > prev.mag ? curr : prev), coords[0]);

    return `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="width:100%; height:auto;">
        <defs>
          <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#e11d48" stop-opacity="0.18"/>
            <stop offset="100%" stop-color="#e11d48" stop-opacity="0.0"/>
          </linearGradient>
        </defs>
        <line x1="${padL}" y1="${padT}" x2="${width - padR}" y2="${padT}" stroke="#f1f5f9" stroke-width="1"/>
        <line x1="${padL}" y1="${padT + chartH / 2}" x2="${width - padR}" y2="${padT + chartH / 2}" stroke="#f1f5f9" stroke-width="1"/>
        <line x1="${padL}" y1="${padT + chartH}" x2="${width - padR}" y2="${padT + chartH}" stroke="#cbd5e1" stroke-width="1"/>
        <path d="${areaD}" fill="url(#eqGrad)" />
        <path d="${pathD}" fill="none" stroke="#e11d48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        ${coords.map((pt, i) => `
          <circle cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="2.5" fill="#ffffff" stroke="#e11d48" stroke-width="1.5" />
          ${i % 2 === 0 ? `<text x="${pt.x.toFixed(1)}" y="${height - 5}" text-anchor="middle" font-size="8" font-weight="600" fill="#64748b" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">${pt.year}</text>` : ''}
        `).join('')}
        <rect x="${peakPt.x - 30}" y="${peakPt.y - 20}" width="60" height="15" rx="3" fill="#0f172a" />
        <text x="${peakPt.x}" y="${peakPt.y - 9}" text-anchor="middle" font-size="7.5" font-weight="800" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">Peak M${peakPt.mag.toFixed(1)}</text>
      </svg>
    `;
  }

  /** Flood Hydro-Profile Cross Section */
  public static renderSvgFloodProfile(
    elevationM: number | null, riverDistM: number | null, rain24hMm: number | null,
    width = 540, height = 105
  ): string {
    const elev = elevationM !== null && !isNaN(elevationM) ? Math.max(0, elevationM) : 10;
    const dist = riverDistM !== null && !isNaN(riverDistM) ? Math.max(50, riverDistM) : 500;
    const rain = rain24hMm !== null && !isNaN(rain24hMm) ? Math.max(10, rain24hMm) : 60;

    return `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="width:100%; height:auto;">
        <defs>
          <linearGradient id="terrainGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#cbd5e1" stop-opacity="0.5"/>
            <stop offset="100%" stop-color="#f8fafc" stop-opacity="0.1"/>
          </linearGradient>
          <linearGradient id="waterGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#0284c7"/>
            <stop offset="100%" stop-color="#38bdf8"/>
          </linearGradient>
        </defs>
        <line x1="30" y1="82" x2="${width - 30}" y2="82" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2 2" />
        <text x="30" y="96" font-size="7.5" font-weight="600" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">0 m (MSL)</text>
        <path d="M 50 82 Q 75 88 100 82 L 100 70 L 50 70 Z" fill="url(#waterGrad)" />
        <text x="75" y="65" text-anchor="middle" font-size="8" font-weight="700" fill="#0284c7" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">Waterway</text>
        <path d="M 100 82 Q 250 78 400 48 L 470 48 L 470 82 Z" fill="url(#terrainGrad)" stroke="#64748b" stroke-width="1.2"/>
        <circle cx="430" cy="46" r="4" fill="#c2410c" stroke="#ffffff" stroke-width="1.5"/>
        <rect x="385" y="14" width="90" height="24" rx="4" fill="#0f172a"/>
        <text x="430" y="25" text-anchor="middle" font-size="7.5" font-weight="700" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">Site: ${elev.toFixed(1)} m dpl</text>
        <text x="430" y="34" text-anchor="middle" font-size="7" font-weight="600" fill="#38bdf8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">${Math.round(dist)} m from canal</text>
        <rect x="200" y="14" width="115" height="20" rx="4" fill="#f0f9ff" stroke="#bae6fd" stroke-width="0.8"/>
        <text x="257" y="27" text-anchor="middle" font-size="7.5" font-weight="700" fill="#0369a1" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">Rain 24h: ${Math.round(rain)} mm</text>
      </svg>
    `;
  }

  /** Temperature Warming Trajectory Chart */
  public static renderSvgHeatTrend(
    forecastC: number | null, historicalPeakC: number | null, projectedRiseC: number | null,
    width = 540, height = 105
  ): string {
    const fc = forecastC !== null && !isNaN(forecastC) ? forecastC : 32.0;
    const hist = historicalPeakC !== null && !isNaN(historicalPeakC) ? historicalPeakC : 34.5;
    const rise = projectedRiseC !== null && !isNaN(projectedRiseC) ? projectedRiseC : 1.2;
    const p2050 = fc + rise;

    return `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="width:100%; height:auto;">
        <rect x="40" y="12" width="130" height="75" rx="6" fill="#faf8f4" stroke="#e7e3da" />
        <text x="105" y="32" text-anchor="middle" font-size="7.5" font-weight="700" fill="#64748b" text-transform="uppercase" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">Historical Peak</text>
        <text x="105" y="58" text-anchor="middle" font-size="16" font-weight="800" fill="#0f172a" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">${hist.toFixed(1)}°C</text>
        <text x="105" y="74" text-anchor="middle" font-size="7" font-weight="600" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">ERA5 1991–2020</text>

        <rect x="205" y="12" width="130" height="75" rx="6" fill="#faf8f4" stroke="#e7e3da" />
        <text x="270" y="32" text-anchor="middle" font-size="7.5" font-weight="700" fill="#64748b" text-transform="uppercase" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">Forecast Max</text>
        <text x="270" y="58" text-anchor="middle" font-size="16" font-weight="800" fill="#c2410c" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">${fc.toFixed(1)}°C</text>
        <text x="270" y="74" text-anchor="middle" font-size="7" font-weight="600" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">Seasonal Ambient</text>

        <rect x="370" y="12" width="130" height="75" rx="6" fill="#fff7ed" stroke="#fed7aa" />
        <text x="435" y="32" text-anchor="middle" font-size="7.5" font-weight="700" fill="#c2410c" text-transform="uppercase" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">Projected 2050</text>
        <text x="435" y="58" text-anchor="middle" font-size="16" font-weight="800" fill="#dc2626" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">${p2050.toFixed(1)}°C</text>
        <text x="435" y="74" text-anchor="middle" font-size="7" font-weight="700" fill="#ea580c" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">+${rise.toFixed(1)}°C CMIP6 Warming</text>
      </svg>
    `;
  }

  /**
   * Generates a 3×3 OpenStreetMap tile grid as an HTML figure.
   * Uses standard Slippy Map tile math to convert lat/lng to tile coordinates.
   */
  public static renderOsmMap(lat: number, lng: number, zoom = 15, widthPx = 540, heightPx = 220): string {
    const n = Math.pow(2, zoom);
    const tileX = Math.floor(((lng + 180) / 360) * n);
    const latRad = lat * Math.PI / 180;
    const tileY = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);

    const tiles: string[] = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const tx = tileX + dx;
        const ty = tileY + dy;
        const left = (dx + 1) * 256;
        const top = (dy + 1) * 256;
        tiles.push(`<img src="https://tile.openstreetmap.org/${zoom}/${tx}/${ty}.png" style="position:absolute;left:${left}px;top:${top}px;width:256px;height:256px;" alt="" />`);
      }
    }

    const xFrac = ((lng + 180) / 360) * n - tileX;
    const yFrac = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n) - tileY;
    const pinX = 256 + xFrac * 256;
    const pinY = 256 + yFrac * 256;

    return `
    <div style="margin: 12px 0; break-inside: avoid;">
      <div style="position:relative; width:${widthPx}px; max-width:100%; height:${heightPx}px; overflow:hidden; border:1px solid #e7e3da; border-radius:8px; background:#faf8f4; margin:0 auto;">
        <div style="position:absolute; left:${widthPx / 2 - pinX}px; top:${heightPx / 2 - pinY}px; width:768px; height:768px;">
          ${tiles.join('\n          ')}
        </div>
        <!-- Site Pin Marker -->
        <div style="position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); z-index:10;">
          <div style="width:14px;height:14px;border-radius:50%;background:#c2410c;border:2.5px solid #ffffff;box-shadow:0 1px 4px rgba(0,0,0,0.35);"></div>
        </div>
        <!-- Coordinates Label -->
        <div style="position:absolute; left:50%; top:50%; transform:translate(-50%,-130%); z-index:10; background:#0f172a; color:#ffffff; padding:3px 10px; border-radius:4px; font-size:8px; font-weight:700; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; white-space:nowrap; box-shadow:0 2px 6px rgba(0,0,0,0.2);">
          ${lat.toFixed(5)}°, ${lng.toFixed(5)}°
        </div>
      </div>
      <div style="font-size:7px; color:#94a3b8; margin-top:3px; text-align:right; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">© OpenStreetMap contributors</div>
    </div>`;
  }

  // =========================================================================
  // COMPLETE 11-SECTION MASTER REPORT RENDERER (GROUNDSURE SPEC)
  // =========================================================================

  /**
   * Generates standalone, publication-grade printable HTML for the 11 client sections.
   * Adopts 100% of the original Groundsure Dossier layout and modern sans-serif aesthetics.
   */
  public static generateMasterReportHtml(options: MasterReportOptions): string {
    const { lang = 'id', isSample = false } = options;
    const isEn = lang === 'en';
    const lat = options.assessment?.location?.latitude;
    const lng = options.assessment?.location?.longitude;
    if (lat === null || lat === undefined || lng === null || lng === undefined || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw new Error('Assessment coordinate unavailable: Valid latitude and longitude are required for report generation');
    }

    const content = this.getSectionContent(options);
    const {
      cover,
      execSummary,
      propertyProfile,
      methodology,
      earthquakeSection,
      floodSection,
      heatSection,
      transportSection,
      riskComparison,
      actionPlan,
      closing
    } = content;

    const vm = ReportViewModelBuilder.build(options.assessment, options);
    const overallScore = options.assessment.overallScore;

    // Running Header / Footer helpers
    const pageOf = (n: number) => `${isEn ? 'Page' : 'Halaman'} ${n} ${isEn ? 'of' : 'dari'} 11`;
    const runningHeader = (sectionName: string, pageNum: number) => `
      <div class="rh">
        <div class="gs-header-section" style="margin-bottom: 12px; padding-bottom: 8px;">
          <div class="gs-brand-group">
            <div style="font-size: 1.15rem; font-weight: 800; color: #0f172a; letter-spacing: -0.025em;">
              Go<span style="color: #c2410c;">Tangguh</span>
            </div>
            <span style="color: #cbd5e1;">|</span>
            <div class="gs-subtitle-tag" style="font-size: 0.68rem; color: #64748b; font-weight: 700; text-transform: uppercase;">
              ${sectionName}
            </div>
          </div>
          <div class="gs-meta-info-box" style="font-size: 0.72rem; color: #64748b; text-align: right;">
            ${cover.referenceNumber} · ${pageOf(pageNum)}
          </div>
        </div>
      </div>`;

    const runningFooter = (pageNum: number) => `
      <div class="rf">
        <div class="gs-pdf-footer-note" style="margin-top: auto; padding-top: 8px; border-top: 1px solid #e2e8f0; font-size: 0.72rem; color: #94a3b8; display: flex; justify-content: space-between;">
          <span>${pageOf(pageNum)} · ${isEn ? 'GoTangguh Property Risk Assessment Report' : 'Laporan Risiko Properti GoTangguh'}</span>
          <span>${cover.referenceNumber}</span>
        </div>
      </div>`;

    return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <title>${cover.title} — ${cover.referenceNumber}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

    /* Institutional Formal PDF Report Stylesheet */
    @page {
      size: A4 portrait;
      margin: 10mm 12mm 10mm 12mm;
    }
    *, *:before, *:after { box-sizing: border-box; }
    html, body {
      width: 100%;
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #0f172a;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 8.5pt;
      line-height: 1.55;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    .groundsure-pdf-document {
      width: 100%;
      max-width: 820px;
      margin: 0 auto;
      background: #ffffff;
    }

    /* Page container */
    .page, .gs-pdf-page {
      background: #ffffff;
      width: 100%;
      min-height: 268mm;
      box-sizing: border-box;
      page-break-after: always;
      break-after: page;
      page-break-inside: avoid;
      break-inside: avoid;
      position: relative;
      padding: 4mm 0 6mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border-bottom: 2px dashed #e2e8f0;
      margin-bottom: 20px;
    }

    .page:last-child, .gs-pdf-page:last-child {
      page-break-after: auto;
      break-after: auto;
      border-bottom: none;
      margin-bottom: 0;
    }

    /* Page Badge Title */
    .gs-page-badge-title {
      display: inline-block;
      font-size: 0.68rem;
      font-weight: 800;
      color: #0f172a;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 3px 10px;
      border-radius: 4px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 12px;
      width: fit-content;
    }

    .gs-page-intro {
      font-size: 0.82rem;
      color: #334155;
      line-height: 1.55;
      margin: 0 0 12px;
    }

    /* Header Section */
    .gs-header-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 10px;
      margin-bottom: 14px;
    }

    .gs-brand-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .gs-title-main {
      font-size: 1.35rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.025em;
    }

    .gs-subtitle-tag {
      font-size: 0.68rem;
      color: #c2410c;
      text-transform: uppercase;
      font-weight: 800;
      letter-spacing: 0.08em;
    }

    .gs-meta-info-box {
      font-size: 0.74rem;
      color: #475569;
      text-align: right;
      line-height: 1.5;
    }

    /* Opinion Banner Box */
    .gs-opinion-banner-box {
      background: #faf8f4;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 18px;
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }

    .gs-opinion-text-col {
      flex: 1;
    }

    .gs-opinion-score-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
    }

    .gs-status-badge {
      font-size: 0.68rem;
      font-weight: 800;
      padding: 3px 10px;
      border-radius: 4px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      display: inline-block;
    }

    /* Cover Meta Items */
    .gs-cover-summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 16px;
    }

    .gs-cover-meta-item {
      background: #faf8f4;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .gs-meta-kicker {
      font-size: 0.66rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .gs-meta-val {
      font-size: 0.82rem;
      font-weight: 700;
      color: #0f172a;
    }

    /* Section Headings */
    .gs-section-heading {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.98rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.015em;
      margin: 0 0 12px;
      padding-bottom: 6px;
      border-bottom: 1px solid #e2e8f0;
    }

    /* Structured Table */
    .gs-structured-table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0 14px;
    }

    .gs-structured-table th, .gs-structured-table td {
      border: 1px solid #e2e8f0;
      padding: 8px 12px;
      text-align: left;
      font-size: 0.78rem;
    }

    .gs-structured-table th {
      background: #0f172a;
      color: #ffffff;
      font-weight: 700;
      font-size: 0.74rem;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    .gs-structured-table tbody tr:nth-child(even) {
      background: #faf8f4;
    }

    .gs-table-badge {
      font-size: 0.68rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
      display: inline-block;
    }

    /* Info Box Note */
    .gs-info-box-note {
      background: #faf8f4;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 0.78rem;
      color: #334155;
      line-height: 1.5;
      margin-top: 10px;
    }

    /* Action Plan Cards */
    .gs-rx-pdf-item {
      background: #faf8f4;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 14px;
    }

    .gs-pill-priority {
      font-size: 0.66rem;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 4px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      display: inline-block;
    }

    .gs-pill-priority.priority-1 { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
    .gs-pill-priority.priority-2 { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
    .gs-pill-priority.priority-3 { background: #dcfce7; color: #166534; border: 1px solid #86efac; }

    /* Running header/footer styles */
    .rh, .rf {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    /* Watermark for Sample */
    .watermark {
      position: fixed;
      top: 40%;
      left: 5%;
      right: 5%;
      font-size: 42pt;
      color: rgba(225, 29, 72, 0.08);
      transform: rotate(-30deg);
      font-weight: 900;
      pointer-events: none;
      z-index: 999;
      text-align: center;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      text-transform: uppercase;
      letter-spacing: 4px;
    }

    .sample-banner {
      background: #fff1f2;
      border: 1px solid #fecdd3;
      color: #be123c;
      padding: 6px 14px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 8pt;
      text-align: center;
      margin-bottom: 12px;
      letter-spacing: 0.5px;
    }

    @media print {
      body { padding: 0 !important; background: #ffffff !important; }
      .page, .gs-pdf-page { border-bottom: none !important; margin-bottom: 0 !important; }
    }
  </style>
</head>
<body>
  ${isSample ? `<div class="watermark">${cover.watermarkText || (isEn ? 'SAMPLE REPORT' : 'CONTOH LAPORAN RESMI')}</div>` : ''}

  <div class="groundsure-pdf-document">

    <!-- =========================================================================
        HALAMAN 1 — COVER
        ========================================================================= -->
    <div class="page" id="p1-cover"><a id="sec-1-cover"></a>
      <div>
        ${isSample ? `<div class="sample-banner">${isEn ? 'SAMPLE DOCUMENT FOR FORMAT REVIEW' : 'DOKUMEN CONTOH RESMI UNTUK PENINJAUAN FORMAT LAPORAN'}</div>` : ''}

        <div class="gs-header-section">
          <div class="gs-brand-group">
            <div>
              <div class="gs-title-main">Go<span style="color:#c2410c;">Tangguh</span></div>
              <div class="gs-subtitle-tag">${cover.tagline}</div>
            </div>
          </div>
          <div class="gs-meta-info-box">
            <strong>${isEn ? 'Reference No:' : 'No. Referensi:'}</strong> ${cover.referenceNumber}<br />
            <strong>${isEn ? 'Date of Issue:' : 'Tanggal Analisis:'}</strong> ${cover.date}<br />
            <strong>${isEn ? 'GPS Coordinates:' : 'Koordinat GPS:'}</strong> ${cover.coordinates}
          </div>
        </div>

        <div class="gs-page-badge-title">${isEn ? 'PAGE 1 — COVER' : 'HALAMAN 1 — COVER'}</div>

        <div style="text-align: center; padding: 20px 16px 16px;">
          <span class="gs-table-badge" style="background: #e0f2fe; color: #0369a1; font-size: 0.85rem; padding: 6px 14px; margin-bottom: 12px;">
            ${cover.propertyType}
          </span>
          <h1 style="font-size: 1.85rem; font-weight: 800; color: #0f172a; margin: 12px 0 6px; line-height: 1.3;">
            ${cover.title}
          </h1>
          <p style="font-size: 1.02rem; color: #c2410c; font-weight: 700; margin: 0 0 16px;">
            “${cover.tagline}”
          </p>
          <div style="max-width: 640px; margin: 0 auto; background: #faf8f4; border: 1px solid #e7e3da; border-radius: 10px; padding: 14px;">
            <div style="display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 0.92rem; color: #1e293b; font-weight: 600;">
              ${MasterReportGenerator.svgIcon('pin', '#c2410c', 16)}
              <span>${cover.locationAddress}</span>
            </div>
            <div style="margin-top: 6px; font-size: 0.8rem; color: #64748b;">
              ${isEn ? 'Coordinates' : 'Koordinat'}: <strong>${cover.coordinates}</strong> · ${cover.propertyType}
            </div>
            ${cover.ownerName ? `
            <div style="margin-top: 6px; font-size: 0.8rem; color: #475569; border-top: 1px solid #eae6dd; padding-top: 6px;">
              <strong>${isEn ? 'Owner / Client:' : 'Pemilik / Pengguna:'}</strong> ${cover.ownerName}
            </div>` : ''}
          </div>
        </div>

        <!-- Real Location Map Plate -->
        ${this.renderOsmMap(lat, lng, 15, 540, 180)}

        <div class="gs-cover-summary-grid" style="margin-top: 16px;">
          <div class="gs-cover-meta-item">
            <span class="gs-meta-kicker">${isEn ? 'Classification' : 'Klasifikasi'}</span>
            <span class="gs-meta-val" style="color:${isSample ? '#e11d48' : '#16a34a'};">
              ${isSample ? (isEn ? 'Sample Document' : 'Dokumen Sampel') : (isEn ? 'Verified Screening' : 'Penapisan Mandiri Terverifikasi')}
            </span>
          </div>
          <div class="gs-cover-meta-item">
            <span class="gs-meta-kicker">${isEn ? 'Overall Risk' : 'Risiko Keseluruhan'}</span>
            <span class="gs-meta-val" style="color: ${execSummary.overallColor};">${execSummary.overallScoreText} (${execSummary.overallLevelText})</span>
          </div>
          <div class="gs-cover-meta-item">
            <span class="gs-meta-kicker">${isEn ? 'Primary Hazard' : 'Bahaya Utama'}</span>
            <span class="gs-meta-val">${execSummary.dominantHazard}</span>
          </div>
          <div class="gs-cover-meta-item">
            <span class="gs-meta-kicker">${isEn ? 'Audit Reference' : 'Nomor Referensi'}</span>
            <span class="gs-meta-val">${cover.referenceNumber}</span>
          </div>
        </div>
      </div>

      ${runningFooter(1)}
    </div>

    <!-- =========================================================================
        HALAMAN 2 — EXECUTIVE SUMMARY
        ========================================================================= -->
    <div class="page" id="p2-exec"><a id="sec-2-exec-summary"></a>
      <div>
        ${runningHeader(execSummary.title, 2)}
        <div class="gs-page-badge-title">${isEn ? 'PAGE 2 — EXECUTIVE SUMMARY' : 'HALAMAN 2 — RINGKASAN EKSEKUTIF'}</div>
        <h3 class="gs-section-heading">
          ${MasterReportGenerator.svgIcon('shield', '#0f172a', 18)}
          <span>${execSummary.title}</span>
        </h3>

        <div class="gs-opinion-banner-box">
          <div class="gs-opinion-score-col" style="padding-right: 16px; border-right: 1px solid #e7e3da;">
            <div style="font-size: 0.72rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">
              ${isEn ? 'Overall Risk Level' : 'Tingkat Risiko'}
            </div>
            ${this.renderSvgDonut(overallScore, execSummary.overallColor, 88)}
            <span class="gs-status-badge" style="margin-top: 6px; background: ${execSummary.overallColor}18; color: ${execSummary.overallColor};">
              ${execSummary.overallLevelText}
            </span>
          </div>
          <div class="gs-opinion-text-col">
            <div style="font-size: 0.76rem; font-weight: 700; color: #c2410c; text-transform: uppercase; letter-spacing: 0.04em;">
              ${isEn ? 'Primary Hazard Driver' : 'Risiko Utama Lokasi'}
            </div>
            <div style="font-size: 1.05rem; font-weight: 800; color: #0f172a; margin: 2px 0 8px;">
              ${execSummary.dominantHazard}
            </div>
            <p style="font-size: 0.84rem; color: #334155; line-height: 1.55;">
              ${execSummary.generalOverview}
            </p>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 14px 0;">
          ${execSummary.hazardDonuts.map(donut => `
            <div class="gs-cover-meta-item" style="align-items: center; text-align: center; padding: 14px 8px;">
              <span class="gs-meta-kicker">${donut.label}</span>
              <div style="margin: 8px 0;">
                ${this.renderSvgDonut(donut.score, donut.color, 72)}
              </div>
              <span class="gs-table-badge" style="background: ${donut.color}18; color: ${donut.color}; font-size: 0.72rem;">
                ${donut.level}
              </span>
            </div>
          `).join('')}
        </div>

        <div class="gs-info-box-note" style="margin-top: 14px;">
          <strong style="display: block; margin-bottom: 6px; color: #1e293b;">
            ${isEn ? '3 Primary Strategic Recommendations:' : '3 Rekomendasi Utama:'}
          </strong>
          <ol style="margin: 0; padding-left: 20px; font-size: 0.8rem; color: #334155; line-height: 1.6;">
            ${execSummary.topRecommendations.map(rec => `
              <li style="margin-bottom: 4px;">${rec}</li>
            `).join('')}
          </ol>
        </div>
      </div>

      ${runningFooter(2)}
    </div>

    <!-- =========================================================================
        HALAMAN 3 — PROFIL PROPERTI
        ========================================================================= -->
    <div class="page" id="p3-profile"><a id="sec-3-property-profile"></a>
      <div>
        ${runningHeader(propertyProfile.title, 3)}
        <div class="gs-page-badge-title">${isEn ? 'PAGE 3 — PROPERTY PROFILE' : 'HALAMAN 3 — PROFIL PROPERTI'}</div>
        <h3 class="gs-section-heading">
          ${MasterReportGenerator.svgIcon('building', '#0f172a', 18)}
          <span>${propertyProfile.title}</span>
        </h3>

        <p class="gs-page-intro">${propertyProfile.description}</p>

        <table class="gs-structured-table">
          <thead>
            <tr>
              <th style="width: 35%;">${isEn ? 'Parameter' : 'Parameter Profil'}</th>
              <th style="width: 65%;">${isEn ? 'Site Observation' : 'Kondisi Faktual'}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>${isEn ? 'City / Regency' : 'Kota / Kabupaten'}</strong></td>
              <td>${propertyProfile.cityRegency}</td>
            </tr>
            <tr>
              <td><strong>${isEn ? 'Area Characteristic' : 'Karakteristik Area'}</strong></td>
              <td>${propertyProfile.areaCharacteristic}</td>
            </tr>
            <tr>
              <td><strong>${isEn ? 'Building Asset Type' : 'Jenis Bangunan'}</strong></td>
              <td>${propertyProfile.buildingType}</td>
            </tr>
            <tr>
              <td><strong>${isEn ? 'Floor Count' : 'Jumlah Lantai'}</strong></td>
              <td>${propertyProfile.floorCount}</td>
            </tr>
            <tr>
              <td><strong>${isEn ? 'Estimated Building Age' : 'Perkiraan Usia Bangunan'}</strong></td>
              <td>${propertyProfile.buildingAge}</td>
            </tr>
            <tr>
              <td><strong>${isEn ? 'Distance to Waterway' : 'Jarak ke Sungai / Badan Air'}</strong></td>
              <td>${propertyProfile.distanceToWaterway}</td>
            </tr>
            <tr>
              <td><strong>${isEn ? 'Building / Population Density' : 'Kepadatan Bangunan'}</strong></td>
              <td>${propertyProfile.buildingDensity}</td>
            </tr>
            <tr>
              <td><strong>${isEn ? 'Site Access / Connectivity' : 'Aksesibilitas'}</strong></td>
              <td>${propertyProfile.accessibility}</td>
            </tr>
          </tbody>
        </table>

        <div class="gs-info-box-note">
          <strong>${isEn ? 'Site Context Note:' : 'Catatan Konteks Tapak:'}</strong> ${isEn
            ? 'All observations reflect available open geospatial datasets (Copernicus DEM, WorldPop, OSM). Structural characteristics are pending licensed on-site engineering verification.'
            : 'Seluruh profil disusun berdasarkan data geospasial terbuka (Copernicus DEM, WorldPop, OSM). Parameter struktural gedung memerlukan verifikasi langsung oleh tenaga ahli berlisensi.'}
        </div>
      </div>

      ${runningFooter(3)}
    </div>

    <!-- =========================================================================
        HALAMAN 4 — PENJELASAN PENILAIAN
        ========================================================================= -->
    <div class="page" id="p4-methodology"><a id="sec-4-methodology"></a>
      <div>
        ${runningHeader(methodology.title, 4)}
        <div class="gs-page-badge-title">${isEn ? 'PAGE 4 — ASSESSMENT METHODOLOGY' : 'HALAMAN 4 — PENJELASAN PENILAIAN'}</div>
        <h3 class="gs-section-heading">
          ${MasterReportGenerator.svgIcon('chart', '#0f172a', 18)}
          <span>${methodology.title}</span>
        </h3>

        <p class="gs-page-intro">${methodology.intro}</p>

        <table class="gs-structured-table">
          <thead>
            <tr>
              <th style="width: 28%;">${isEn ? 'Aspect' : 'Aspek'}</th>
              <th style="width: 72%;">${isEn ? 'Explanation' : 'Penjelasan'}</th>
            </tr>
          </thead>
          <tbody>
            ${methodology.tableRows.map(row => `
              <tr>
                <td><strong>${row.aspect}</strong></td>
                <td>${row.explanation}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="gs-opinion-banner-box" style="margin-top: 16px;">
          <div style="display: flex; gap: 12px; align-items: center;">
            ${MasterReportGenerator.svgIcon('shield', '#0284c7', 24)}
            <div>
              <strong style="font-size: 0.9rem; color: #0f172a;">
                ${isEn ? 'Simple Evaluation Principle:' : 'Prinsip Penilaian Sederhana:'}
              </strong>
              <p style="font-size: 0.84rem; color: #475569; margin: 3px 0 0;">
                “${methodology.simpleSummary}”
              </p>
            </div>
          </div>
        </div>
      </div>

      ${runningFooter(4)}
    </div>

    <!-- =========================================================================
        HALAMAN 5 — RISIKO GEMPA BUMI
        ========================================================================= -->
    <div class="page" id="p5-quake"><a id="sec-5-earthquake"></a>
      <div>
        ${runningHeader(earthquakeSection.title, 5)}
        <div class="gs-page-badge-title">${isEn ? 'PAGE 5 — EARTHQUAKE RISK' : 'HALAMAN 5 — RISIKO GEMPA BUMI'}</div>
        <h3 class="gs-section-heading">
          ${MasterReportGenerator.svgIcon('seismic', '#0f172a', 18)}
          <span>${earthquakeSection.title}</span>
        </h3>

        <div class="gs-opinion-banner-box" style="margin-bottom: 14px;">
          <div class="gs-opinion-score-col" style="padding-right: 16px; border-right: 1px solid #e7e3da;">
            <span style="font-size: 0.7rem; font-weight: 700; color: #64748b; text-transform: uppercase;">
              ${isEn ? 'Seismic Score' : 'Skor Gempa'}
            </span>
            ${this.renderSvgDonut(earthquakeSection.score, earthquakeSection.scoreColor, 75)}
            <span class="gs-status-badge" style="margin-top: 4px; background: ${earthquakeSection.scoreColor}18; color: ${earthquakeSection.scoreColor};">
              ${earthquakeSection.levelText}
            </span>
          </div>
          <div class="gs-opinion-text-col">
            <div style="font-size: 0.8rem; font-weight: 700; color: #475569; margin-bottom: 6px;">
              ${isEn ? 'Observed Regional Seismic Evidence (USGS FDSN / BMKG Catalog):' : 'Bukti Kegempaan Regional (Katalog USGS / BMKG):'}
            </div>
            <ul style="margin: 0; padding-left: 18px; font-size: 0.8rem; color: #334155; line-height: 1.6;">
              ${earthquakeSection.historicalEvidence.map(e => `
                <li><strong>${e.label}:</strong> ${e.value}</li>
              `).join('')}
            </ul>
          </div>
        </div>

        ${vm.earthquakeSection.timelineData && vm.earthquakeSection.timelineData.length > 0 ? `
          <div style="margin: 12px 0; background: #faf8f4; border: 1px solid #e7e3da; border-radius: 8px; padding: 10px 14px;">
            <div style="font-size: 0.72rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">
              ${isEn ? '10-Year Seismic Activity Trend (Radius 150 km)' : 'Tren Aktivitas Gempa 10 Tahun (Radius 150 km)'}
            </div>
            ${this.renderSvgEarthquakeTimeline(vm.earthquakeSection.timelineData, 540, 105)}
          </div>
        ` : `
          <div style="margin: 12px 0; background: #faf8f4; border: 1px solid #e7e3da; border-radius: 8px; padding: 10px 14px;">
            <div style="font-size: 0.72rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">
              ${isEn ? '10-Year Seismic Activity Trend (Radius 150 km)' : 'Tren Aktivitas Gempa 10 Tahun (Radius 150 km)'}
            </div>
            <div style="font-size: 0.8rem; color: #64748b; font-style: italic; padding: 8px 0;">
              ${isEn ? 'Annual historical timeline unavailable from the dataset used.' : 'Riwayat tahunan tidak tersedia dari dataset yang digunakan.'}
            </div>
          </div>
        `}

        <div style="font-size: 0.82rem; color: #334155; line-height: 1.5; margin: 8px 0;">
          <p style="margin: 0 0 4px;"><strong>${isEn ? 'Frequency:' : 'Frekuensi:'}</strong> ${earthquakeSection.frequency}</p>
          <p style="margin: 0;">
            <strong>${isEn ? 'Potential Shaking Impact:' : 'Tingkat Dampak yang Mungkin Terjadi:'}</strong> ${earthquakeSection.impactInterpretation}
          </p>
        </div>

        <div class="gs-info-box-note" style="margin-top: 10px;">
          <strong style="display: block; margin-bottom: 4px; color: #0f172a;">
            ${isEn ? 'Mitigation Action Directives:' : 'Rekomendasi Tindakan:'}
          </strong>
          <ul style="margin: 0; padding-left: 18px; font-size: 0.8rem; color: #334155; line-height: 1.6;">
            ${earthquakeSection.recommendations.map(r => `
              <li><strong>[${r.priority}]</strong> ${r.text}</li>
            `).join('')}
          </ul>
        </div>

        <div class="gs-opinion-banner-box" style="margin-top: 10px; padding: 10px 14px;">
          <p style="font-size: 0.82rem; color: #475569; margin: 0;">
            <strong>${isEn ? 'Conclusion:' : 'Kesimpulan:'}</strong> ${earthquakeSection.conclusion}
          </p>
        </div>
      </div>

      ${runningFooter(5)}
    </div>

    <!-- =========================================================================
        HALAMAN 6 — RISIKO BANJIR
        ========================================================================= -->
    <div class="page" id="p6-flood"><a id="sec-6-flood"></a>
      <div>
        ${runningHeader(floodSection.title, 6)}
        <div class="gs-page-badge-title">${isEn ? 'PAGE 6 — FLOOD RISK' : 'HALAMAN 6 — RISIKO BANJIR'}</div>
        <h3 class="gs-section-heading">
          ${MasterReportGenerator.svgIcon('waves', '#0f172a', 18)}
          <span>${floodSection.title}</span>
        </h3>

        <div class="gs-opinion-banner-box" style="margin-bottom: 14px;">
          <div class="gs-opinion-score-col" style="padding-right: 16px; border-right: 1px solid #e7e3da;">
            <span style="font-size: 0.7rem; font-weight: 700; color: #64748b; text-transform: uppercase;">
              ${isEn ? 'Flood Score' : 'Skor Banjir'}
            </span>
            ${this.renderSvgDonut(floodSection.score, floodSection.scoreColor, 75)}
            <span class="gs-status-badge" style="margin-top: 4px; background: ${floodSection.scoreColor}18; color: ${floodSection.scoreColor};">
              ${floodSection.levelText}
            </span>
          </div>
          <div class="gs-opinion-text-col">
            <div style="font-size: 0.8rem; font-weight: 700; color: #475569; margin-bottom: 6px;">
              ${isEn ? 'Hydrological & Terrain Indicators (Copernicus DEM & ERA5):' : 'Indikator Hidrologi & Topografi (Copernicus DEM & ERA5):'}
            </div>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; font-size: 0.78rem;">
              ${floodSection.evidenceItems.map(e => `
                <div style="background: #ffffff; padding: 6px 8px; border-radius: 5px; border: 1px solid #eae6dd;">
                  <div style="color: #64748b; font-size: 0.68rem; text-transform: uppercase;">${e.label}</div>
                  <strong style="color: #1e293b;">${e.value}</strong>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div style="margin: 10px 0; background: #faf8f4; border: 1px solid #e7e3da; border-radius: 8px; padding: 10px 14px;">
          <div style="font-size: 0.72rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">
            ${isEn ? 'Hydrological Terrain Cross-Section' : 'Profil Topografi & Hidrologi Tapak'}
          </div>
          ${this.renderSvgFloodProfile(options.assessment.flood?.elevationMeters ?? null, options.assessment.flood?.distanceToWaterwayMeters ?? null, options.assessment.flood?.max24hRainfallMm ?? null, 540, 95)}
        </div>

        <div style="font-size: 0.82rem; color: #334155; line-height: 1.5; margin: 8px 0;">
          <p style="margin: 0 0 4px;"><strong>${isEn ? 'Seasonality & Runoff:' : 'Frekuensi & Musim:'}</strong> ${floodSection.frequency}</p>
          <p style="margin: 0;">
            <strong>${isEn ? 'Potential Flood Impact:' : 'Tingkat Dampak yang Mungkin Terjadi:'}</strong> ${floodSection.impactInterpretation}
          </p>
        </div>

        <div class="gs-info-box-note" style="margin-top: 10px;">
          <strong style="display: block; margin-bottom: 4px; color: #0f172a;">
            ${isEn ? 'Action Recommendations:' : 'Rekomendasi Tindakan:'}
          </strong>
          <ul style="margin: 0; padding-left: 18px; font-size: 0.8rem; color: #334155; line-height: 1.6;">
            ${floodSection.recommendations.map(r => `
              <li><strong>[${r.priority}]</strong> ${r.text}</li>
            `).join('')}
          </ul>
        </div>

        <div class="gs-opinion-banner-box" style="margin-top: 10px; padding: 10px 14px;">
          <p style="font-size: 0.82rem; color: #475569; margin: 0;">
            <strong>${isEn ? 'Conclusion:' : 'Kesimpulan:'}</strong> ${floodSection.conclusion}
          </p>
        </div>
      </div>

      ${runningFooter(6)}
    </div>

    <!-- =========================================================================
        HALAMAN 7 — RISIKO HEAT STRESS
        ========================================================================= -->
    <div class="page" id="p7-heat"><a id="sec-7-heat"></a>
      <div>
        ${runningHeader(heatSection.title, 7)}
        <div class="gs-page-badge-title">${isEn ? 'PAGE 7 — HEAT STRESS RISK' : 'HALAMAN 7 — RISIKO HEAT STRESS'}</div>
        <h3 class="gs-section-heading">
          ${MasterReportGenerator.svgIcon('sun', '#0f172a', 18)}
          <span>${heatSection.title}</span>
        </h3>

        <div class="gs-opinion-banner-box" style="margin-bottom: 14px;">
          <div class="gs-opinion-score-col" style="padding-right: 16px; border-right: 1px solid #e7e3da;">
            <span style="font-size: 0.7rem; font-weight: 700; color: #64748b; text-transform: uppercase;">
              ${isEn ? 'Heat Score' : 'Skor Panas'}
            </span>
            ${this.renderSvgDonut(heatSection.score, heatSection.scoreColor, 75)}
            <span class="gs-status-badge" style="margin-top: 4px; background: ${heatSection.scoreColor}18; color: ${heatSection.scoreColor};">
              ${heatSection.levelText}
            </span>
          </div>
          <div class="gs-opinion-text-col">
            <div style="font-size: 0.8rem; font-weight: 700; color: #475569; margin-bottom: 6px;">
              ${isEn ? 'Atmospheric Thermal Metrics (Open-Meteo ERA5 & CMIP6):' : 'Indikator Termal Atmosfer (Open-Meteo ERA5 & CMIP6):'}
            </div>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; font-size: 0.78rem;">
              ${heatSection.evidenceItems.map(e => `
                <div style="background: #ffffff; padding: 6px 8px; border-radius: 5px; border: 1px solid #eae6dd;">
                  <div style="color: #64748b; font-size: 0.68rem; text-transform: uppercase;">${e.label}</div>
                  <strong style="color: #1e293b;">${e.value}</strong>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div style="margin: 10px 0; background: #faf8f4; border: 1px solid #e7e3da; border-radius: 8px; padding: 10px 14px;">
          <div style="font-size: 0.72rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">
            ${isEn ? 'Temperature Trend & 2050 Climate Projection' : 'Tren Suhu & Proyeksi Iklim 2050'}
          </div>
          ${this.renderSvgHeatTrend(options.assessment.heat?.forecastPeakTempC ?? null, options.assessment.heat?.historicalPeakTempC ?? null, options.assessment.heat?.projectedTempRise2050C ?? null, 540, 95)}
        </div>

        <div style="font-size: 0.82rem; color: #334155; line-height: 1.5; margin: 8px 0;">
          <p style="margin: 0 0 4px;"><strong>${isEn ? 'Seasonal Trend:' : 'Tren & Frekuensi Musiman:'}</strong> ${heatSection.frequency}</p>
          <p style="margin: 0;">
            <strong>${isEn ? 'Potential Thermal Impact:' : 'Tingkat Dampak yang Mungkin Terjadi:'}</strong> ${heatSection.impactInterpretation}
          </p>
        </div>

        <div class="gs-info-box-note" style="margin-top: 10px;">
          <strong style="display: block; margin-bottom: 4px; color: #0f172a;">
            ${isEn ? 'Action Recommendations:' : 'Rekomendasi Tindakan:'}
          </strong>
          <ul style="margin: 0; padding-left: 18px; font-size: 0.8rem; color: #334155; line-height: 1.6;">
            ${heatSection.recommendations.map(r => `
              <li><strong>[${r.priority}]</strong> ${r.text}</li>
            `).join('')}
          </ul>
        </div>

        <div class="gs-opinion-banner-box" style="margin-top: 10px; padding: 10px 14px;">
          <p style="font-size: 0.82rem; color: #475569; margin: 0;">
            <strong>${isEn ? 'Conclusion:' : 'Kesimpulan:'}</strong> ${heatSection.conclusion}
          </p>
        </div>
      </div>

      ${runningFooter(7)}
    </div>

    <!-- =========================================================================
        HALAMAN 8 — AKSESIBILITAS & TRANSPORTASI
        ========================================================================= -->
    <div class="page" id="p8-access"><a id="sec-8-transport"></a>
      <div>
        ${runningHeader(transportSection.title, 8)}
        <div class="gs-page-badge-title">${isEn ? 'PAGE 8 — ACCESSIBILITY & TRANSPORT' : 'HALAMAN 8 — AKSESIBILITAS DAN TRANSPORTASI'}</div>
        <h3 class="gs-section-heading">
          ${MasterReportGenerator.svgIcon('navigation', '#0f172a', 18)}
          <span>${transportSection.title}</span>
        </h3>

        <p class="gs-page-intro">${transportSection.interpretation}</p>

        <table class="gs-structured-table">
          <thead>
            <tr>
              <th>${isEn ? 'Facility Type' : 'Jenis Fasilitas'}</th>
              <th>${isEn ? 'Nearest Identification' : 'Identifikasi Terdekat'}</th>
              <th>${isEn ? 'Distance' : 'Jarak'}</th>
              <th>${isEn ? 'Estimated Travel Distance' : 'Estimasi Jarak Tempuh'}</th>
              <th>${isEn ? 'Category' : 'Kategori'}</th>
            </tr>
          </thead>
          <tbody>
            ${transportSection.facilities.map(f => `
              <tr>
                <td><strong>${f.facility}</strong></td>
                <td>${f.name}</td>
                <td>${f.distance}</td>
                <td>${f.travelTime}</td>
                <td><span class="gs-table-badge" style="background: #f1f5f9; color: #334155;">${f.category}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="gs-info-box-note">
          <p style="margin: 0 0 6px;">
            <strong>${isEn ? 'Disaster Access Risk Note:' : 'Catatan Risiko Akses Darurat:'}</strong> ${transportSection.riskNote}
          </p>
          <p style="margin: 0 0 6px;">
            <strong>${isEn ? 'Fastest Evacuation Route:' : 'Rute Evakuasi Tercepat:'}</strong> ${transportSection.fastestRoute}
          </p>
          <p style="margin: 0;">
            <strong>${isEn ? 'Alternative Route:' : 'Rute Alternatif:'}</strong> ${transportSection.alternativeRoute}
          </p>
        </div>
      </div>

      ${runningFooter(8)}
    </div>

    <!-- =========================================================================
        HALAMAN 9 — PERBANDINGAN RISIKO
        ========================================================================= -->
    <div class="page" id="p9-compare"><a id="sec-9-risk-comparison"></a>
      <div>
        ${runningHeader(riskComparison.title, 9)}
        <div class="gs-page-badge-title">${isEn ? 'PAGE 9 — RISK COMPARISON' : 'HALAMAN 9 — PERBANDINGAN RISIKO'}</div>
        <h3 class="gs-section-heading">
          ${MasterReportGenerator.svgIcon('scale', '#0f172a', 18)}
          <span>${riskComparison.title}</span>
        </h3>

        <p class="gs-page-intro">
          ${isEn
            ? 'Comparative ranking across primary natural physical perils (transportation is excluded as a physical hazard):'
            : 'Perbandingan komparatif antarpilar bahaya fisik alami (transportasi tidak diperhitungkan sebagai bahaya fisik):'}
        </p>

        <table class="gs-structured-table">
          <thead>
            <tr>
              <th style="width: 32%;">${isEn ? 'Hazard Type' : 'Jenis Risiko'}</th>
              <th style="width: 22%;">${isEn ? 'Screening Score' : 'Skor (0–100)'}</th>
              <th style="width: 24%;">${isEn ? 'Rating Tier' : 'Tingkat'}</th>
              <th style="width: 22%;">${isEn ? 'Data Reliability' : 'Keandalan Data'}</th>
            </tr>
          </thead>
          <tbody>
            ${riskComparison.tableRows.map(r => `
              <tr>
                <td><strong>${r.hazard}</strong></td>
                <td><strong style="color: ${r.color}; font-size: 0.95rem;">${r.score}</strong></td>
                <td>
                  <span class="gs-table-badge" style="background: ${r.color}18; color: ${r.color};">
                    ${r.level}
                  </span>
                </td>
                <td>${r.reliability}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="gs-opinion-banner-box" style="margin-top: 16px;">
          <div style="display: flex; gap: 12px; align-items: center;">
            ${MasterReportGenerator.svgIcon('alert', '#0284c7', 22)}
            <div>
              <strong style="font-size: 0.9rem; color: #0f172a;">
                ${isEn ? 'Dominant Hazard Insight:' : 'Kesimpulan Risiko Dominan:'}
              </strong>
              <p style="font-size: 0.84rem; color: #475569; margin: 3px 0 0;">
                ${riskComparison.dominantInsight}
              </p>
            </div>
          </div>
        </div>
      </div>

      ${runningFooter(9)}
    </div>

    <!-- =========================================================================
        HALAMAN 10 — RENCANA TINDAKAN (MITIGASI & ADAPTASI)
        ========================================================================= -->
    <div class="page" id="p10-action"><a id="sec-10-action-plan"></a>
      <div>
        ${runningHeader(actionPlan.title, 10)}
        <div class="gs-page-badge-title">${isEn ? 'PAGE 10 — ACTION PLAN' : 'HALAMAN 10 — RENCANA TINDAKAN'}</div>
        <h3 class="gs-section-heading">
          ${MasterReportGenerator.svgIcon('clipboard', '#0f172a', 18)}
          <span>${actionPlan.title}</span>
        </h3>

        <div style="display: flex; flex-direction: column; gap: 10px; margin: 12px 0;">
          <div class="gs-rx-pdf-item" style="border: 1px solid #fecaca; border-radius: 8px; background: #fef2f2; padding: 12px 14px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <span class="gs-pill-priority priority-1">${isEn ? 'PRIORITY 1' : 'PRIORITAS 1'}</span>
              <strong style="color: #991b1b; font-size: 0.88rem; font-weight: 800;">${actionPlan.priority1.heading}</strong>
            </div>
            <ul style="margin: 0; padding-left: 20px; font-size: 0.8rem; color: #334155; line-height: 1.6;">
              ${actionPlan.priority1.items.map(item => `
                <li style="margin-bottom: 4px;">${item}</li>
              `).join('')}
            </ul>
          </div>

          <div class="gs-rx-pdf-item" style="border: 1px solid #fde68a; border-radius: 8px; background: #fffbeb; padding: 12px 14px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <span class="gs-pill-priority priority-2">${isEn ? 'PRIORITY 2' : 'PRIORITAS 2'}</span>
              <strong style="color: #92400e; font-size: 0.88rem; font-weight: 800;">${actionPlan.priority2.heading}</strong>
            </div>
            <ul style="margin: 0; padding-left: 20px; font-size: 0.8rem; color: #334155; line-height: 1.6;">
              ${actionPlan.priority2.items.map(item => `
                <li style="margin-bottom: 4px;">${item}</li>
              `).join('')}
            </ul>
          </div>

          <div class="gs-rx-pdf-item" style="border: 1px solid #bbf7d0; border-radius: 8px; background: #f0fdf4; padding: 12px 14px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <span class="gs-pill-priority priority-3">${isEn ? 'PRIORITY 3' : 'PRIORITAS 3'}</span>
              <strong style="color: #166534; font-size: 0.88rem; font-weight: 800;">${actionPlan.priority3.heading}</strong>
            </div>
            <ul style="margin: 0; padding-left: 20px; font-size: 0.8rem; color: #334155; line-height: 1.6;">
              ${actionPlan.priority3.items.map(item => `
                <li style="margin-bottom: 4px;">${item}</li>
              `).join('')}
            </ul>
          </div>
        </div>

        <div class="gs-info-box-note" style="font-style: italic; background: #faf8f4;">
          <strong>${actionPlan.note}</strong>
        </div>
      </div>

      ${runningFooter(10)}
    </div>

    <!-- =========================================================================
        HALAMAN 11 — PENUTUP
        ========================================================================= -->
    <div class="page" id="p11-closing"><a id="sec-11-closing"></a>
      <div>
        ${runningHeader(closing.title, 11)}
        <div class="gs-page-badge-title">${isEn ? 'PAGE 11 — CLOSING' : 'HALAMAN 11 — PENUTUP'}</div>
        <h3 class="gs-section-heading">
          ${MasterReportGenerator.svgIcon('shield', '#0f172a', 18)}
          <span>${closing.title}</span>
        </h3>

        <div style="margin-bottom: 14px;">
          <h4 style="font-size: 0.94rem; font-weight: 700; color: #0f172a; margin: 0 0 6px;">
            ${isEn ? 'Executive Conclusion' : 'Kesimpulan'}
          </h4>
          <p style="font-size: 0.84rem; color: #334155; line-height: 1.6; margin: 0;">
            ${closing.conclusion}
          </p>
        </div>

        <div style="margin-bottom: 14px;">
          <h4 style="font-size: 0.94rem; font-weight: 700; color: #0f172a; margin: 0 0 6px;">
            ${isEn ? 'Recommended Next Steps' : 'Langkah Selanjutnya'}
          </h4>
          <ol style="margin: 0; padding-left: 20px; font-size: 0.82rem; color: #334155; line-height: 1.65;">
            ${closing.nextSteps.map(step => `
              <li style="margin-bottom: 4px;">${step}</li>
            `).join('')}
          </ol>
        </div>

        <!-- Glossary Section (Requirement 20) -->
        <div style="margin: 14px 0; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px;">
          <h4 style="font-size: 0.86rem; font-weight: 800; color: #0f172a; margin: 0 0 8px 0; display: flex; align-items: center; gap: 6px;">
            ${MasterReportGenerator.svgIcon('shield', '#0284c7', 14)}
            <span>${isEn ? 'Key Technical Terminology Glossary' : 'Glosarium Istilah Teknis Utama'}</span>
          </h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px 12px; font-size: 0.74rem; color: #334155; line-height: 1.45;">
            <div><strong>dpl / MSL:</strong> ${isEn ? 'Meters above Mean Sea Level, vertical site elevation.' : 'Meter di atas permukaan laut, elevasi vertikal tapak.'}</div>
            <div><strong>PGA:</strong> ${isEn ? 'Peak Ground Acceleration (g), maximum seismic ground shaking.' : 'Percepatan tanah puncak (g), intensitas guncangan gempa.'}</div>
            <div><strong>DAS:</strong> ${isEn ? 'River Watershed / Drainage Basin catchment boundary.' : 'Daerah Aliran Sungai, batas tangkapan air limpasan hujan.'}</div>
            <div><strong>KDH:</strong> ${isEn ? 'Green Space Ratio (%), permeable vegetative canopy.' : 'Koefisien Dasar Hijau (%), persentase area terbuka bervegetasi.'}</div>
            <div><strong>Urban Heat Island:</strong> ${isEn ? 'Thermal phenomenon where built structures trap heat.' : 'Fenomena termal area terbangun menyerap dan memerangkap panas.'}</div>
            <div><strong>Buffer:</strong> ${isEn ? 'Radial spatial search radius for environmental screening.' : 'Radius jarak penapisan geospasial radial dari tapak properti.'}</div>
          </div>
        </div>

        <!-- Official Verbatim Disclaimer -->
        <div class="gs-info-box-note" style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px 16px; margin-top: 14px;">
          <strong style="display: block; color: #991b1b; font-size: 0.84rem; margin-bottom: 4px;">
            ${isEn ? 'Legal Notice & Limitations (Disclaimer):' : 'Pemberitahuan Hukum & Batasan (Disclaimer):'}
          </strong>
          <p style="font-size: 0.82rem; color: #7f1d1d; margin: 0; line-height: 1.5;">
            “${closing.disclaimer}”
          </p>
        </div>
      </div>

      ${runningFooter(11)}
    </div>

  </div>
</body>
</html>`;
  }
}
