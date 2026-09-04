import { NextRequest, NextResponse } from 'next/server';
import { MasterReportGenerator } from '../../../../domain/services/MasterReportGenerator';
import type { MultiHazardAssessmentResult } from '../../../../domain/types/hazard.types';

/**
 * Public Sample Report Dossier Generator
 * Implements the client's 11-section master template 'Simple Report - BangunTangguh'
 * Supports ?lang=id (default) and ?lang=en
 */
export async function GET(req: NextRequest) {
  const lang = req.nextUrl.searchParams.get('lang') === 'en' ? 'en' : 'id';
  const isEn = lang === 'en';

  const sampleAssessment: MultiHazardAssessmentResult = {
    referenceNumber: 'SAMPLE-GT-2026-088',
    evaluatedAt: new Date().toISOString(),
    location: {
      formattedAddress: 'Jl. Kemang Pratama Raya Blok AV-12, Sepanjang Jaya, Rawalumbu, Kota Bekasi, Jawa Barat',
      latitude: -6.2625,
      longitude: 106.992,
      cityDistrict: 'Kota Bekasi',
      country: 'Indonesia'
    },
    propertyType: 'Residential',
    userPersona: 'Home Owner',
    overallScore: 78,
    overallLevel: 'high',
    dominantHazard: 'flood',
    scoringStatus: 'complete',
    dataCompletenessScorePct: 96,
    flood: {
      score: 85,
      level: 'high',
      scoreReliability: 'measured',
      observedComponents: 4,
      expectedComponents: 4,
      coveragePct: 100,
      floodModelLevel: 'High',
      floodClass: 'TINGGI',
      floodClassSource: 'BNPB',
      elevationMeters: 11.2,
      slopeDegrees: 1.2,
      localReliefMeters: -0.4,
      localReliefType: 'Cekungan Rendah',
      flowAccumulationPotential: isEn ? 'Relatively Flat' : 'Relatif Datar',
      max24hRainfallMm: 104,
      distanceToRiverMeters: 11,
      nearestRiverName: 'Kali Bekasi',
      riverDischargeM3s: null,
      potentialDepthRange: null,
      causeId: 'Elevasi 11.2 m dpl, berjarak 11 m dari Kali Bekasi dengan curah hujan harian 104 mm/hari.',
      causeEn: 'Ground elevation 11.2 m MSL, 11 m from Kali Bekasi with peak 24h rainfall of 104 mm/day.',
      impactId: 'Potensi genangan air permukaan saat intensitas hujan ekstrem dan luapan saluran lokal.',
      impactEn: 'Potential surface ponding during heavy rain events and local waterway surcharge.',
      recomId: 'Pertimbangkan evaluasi peil lantai bangunan dan pembersihan rutin saluran pembuangan tapak.',
      recomEn: 'Consider evaluating finished floor level elevations and regular site drainage maintenance.'
    },
    quake: {
      score: 42,
      level: 'medium',
      scoreReliability: 'measured',
      observedComponents: 4,
      expectedComponents: 4,
      coveragePct: 100,
      quakeClass: 'SEDANG',
      quakeClassSource: 'BNPB',
      estimatedPgaG: 0.28,
      historicalQuakesCount150km: 18,
      historicalQuakesCount100km: 10,
      maxHistoricalMag: 5.4,
      distanceToFaultKm: 18.4,
      nearestFaultName: 'Sesar Baribis (Segmen Bekasi)',
      nearestEpicenterKm: 32,
      soilSiteClass: null,
      sniStandardRef: 'SNI 1726:2019',
      liquefactionRisk: 'Rendah',
      causeId: 'Katalog seismik mencatat 18 kejadian gempa dalam 150 km; jarak ke segmen sesar terdekat ±18.4 km.',
      causeEn: 'Regional catalog records 18 earthquakes within 150 km; distance to active fault trace ±18.4 km.',
      impactId: 'Perkiraan percepatan tanah puncak model (PGA) 0.28 g untuk periode ulang 100 tahun.',
      impactEn: 'Estimated 100-year peak ground acceleration (PGA) of 0.28 g under regional seismic hazard models.',
      recomId: 'Disarankan dilakukan pemeriksaan berkala pada ikatan kolom praktis dan balok pengikat.',
      recomEn: 'Recommended periodic inspection of tie columns, ring beams, and wall-to-frame connections.'
    },
    heat: {
      score: 74,
      level: 'high',
      scoreReliability: 'measured',
      observedComponents: 4,
      expectedComponents: 4,
      coveragePct: 100,
      heatModelLevel: 'High',
      forecastPeakTempC: 34.8,
      avgMaxTempC: 33.5,
      historicalPeakTempC: 36.9,
      historicalPeriod: '2014-2024',
      greenSpaceRatioPct: 18,
      projectedTempRise2050C: 0.9,
      acCostIncreasePct: 12,
      causeId: 'Suhu maksimum udara harian mencapai 34.8°C dengan tutupan vegetasi 18%.',
      causeEn: 'Daily maximum air temperature reaches 34.8°C with site green canopy ratio of 18%.',
      impactId: 'Suhu lingkungan meningkatkan beban pendinginan ruangan (AC/kipas) dan kenyamanan termal.',
      impactEn: 'Ambient thermal stress increases indoor cooling load and influences occupant comfort.',
      recomId: 'Pertimbangkan peningkatan ventilasi silang alami dan pelapis atap reflektif.',
      recomEn: 'Consider optimizing natural cross-ventilation and applying solar-reflective roof coatings.'
    },
    transport: {
      score: 28,
      level: 'good',
      scoreReliability: 'measured',
      observedComponents: 4,
      expectedComponents: 4,
      coveragePct: 100,
      connectivityLabelId: 'Sangat Baik',
      connectivityLabelEn: 'Very Good',
      distanceToNearestRoadMeters: 15,
      nearestRoadName: 'Jl. Kemang Pratama Raya',
      distanceToArterialMeters: 450,
      nearestArterialName: 'Jl. Raya Pekayon',
      distanceToTransitHubMeters: 620,
      nearestTransitName: 'Halte Kemang Pratama',
      distanceToHospitalMeters: 580,
      nearestHospitalName: 'RS Hosana Medica Rawalumbu',
      distanceToAssemblyPointMeters: 380,
      nearestAssemblyPointName: 'Taman Kemang Pratama',
      assemblyPointIsOfficial: false,
      distanceToFireStationMeters: 2100,
      nearestFireStationName: 'Pos Damkar Rawalumbu',
      estimatedTravelTimeMinutes: '3-5 menit',
      travelTimeRouteDistanceMeters: 580,
      routingSource: 'OpenStreetMap / OSRM',
      evacuationRouteStatusId: 'Akses koridor evakuasi tergolong sangat baik menuju jalan arteri utama.',
      evacuationRouteStatusEn: 'Evacuation corridor connectivity is very good towards primary arterial network.',
      causeId: 'Akses jalan selebar 15 meter terhubung langsung dengan koridor arteri kota.',
      causeEn: 'Site access roadway is directly linked with city primary arterial corridors.',
      impactId: 'Konektivitas evakuasi memadai; risiko terpusat pada potensi genangan lokal pada persimpangan rendah.',
      impactEn: 'Evacuation access is sound; potential disruption is confined to low-elevation junctions.',
      recomId: 'Gunakan koridor utama menuju arteri dan pantau titik genangan saat musim hujan lebat.',
      recomEn: 'Utilize primary arterial connector routes and monitor low junctions during heavy rains.'
    },
    prescriptions: [
      {
        id: 'rx-1',
        category: 'flood',
        titleId: 'Evaluasi Peil Bebas Banjir & Pasang Check Valve',
        titleEn: 'Evaluate Freeboard Floor Elevation & Install Check Valve',
        descriptionId: 'Pastikan elevasi peil lantai dasar berada minimal 60 cm di atas as jalan lingkungan dan pasang katup pencegah arus balik (check valve) pada pipa pembuangan utama.',
        descriptionEn: 'Ensure finished ground floor elevation is at least 60 cm above the street crown and install a mechanical backflow check valve on the primary drainage line.',
        actionType: 'Civil / Site',
        estimatedCostIdr: 'Rp 4.500.000 – Rp 8.000.000',
        estimatedCostUsd: '$300 – $550',
        costBasis: 'indicative_screening',
        priority: 'High',
        basis: 'risk_model'
      },
      {
        id: 'rx-2',
        category: 'earthquake',
        titleId: 'Pemeriksaan Integritas Struktur Kolom Praktis & Dinding',
        titleEn: 'Structural Inspection of Tie-Columns & Brickwork Anchors',
        descriptionId: 'Lakukan pemeriksaan visual pada ikatan balok sloof dan kolom praktis untuk memastikan tidak ada retakan struktural serta kawat angkur terpasang kuat.',
        descriptionEn: 'Perform visual inspection of tie-beam and column joints to verify structural integrity and ensure masonry wall anchors are firmly embedded.',
        actionType: 'Structural',
        estimatedCostIdr: 'Rp 3.000.000 – Rp 6.000.000',
        estimatedCostUsd: '$200 – $400',
        costBasis: 'indicative_screening',
        priority: 'High',
        basis: 'risk_model'
      },
      {
        id: 'rx-3',
        category: 'heat',
        titleId: 'Insulasi Termal Atap & Peneduh Pasif Bangunan',
        titleEn: 'Roof Thermal Insulation & Passive Architectural Shading',
        descriptionId: 'Terapkan pelapis atap pemantul panas (cool roof coating) dan tambah kisi-kisi peneduh pada jendela barat untuk mereduksi kenaikan suhu dalam ruangan.',
        descriptionEn: 'Apply solar-reflective cool roof coatings and install shading louvers on west-facing windows to minimize indoor heat gain.',
        actionType: 'Architectural',
        estimatedCostIdr: 'Rp 5.000.000 – Rp 12.000.000',
        estimatedCostUsd: '$350 – $800',
        costBasis: 'indicative_screening',
        priority: 'Medium',
        basis: 'risk_model'
      }
    ],
    populationExposure: {
      population1km: 8400,
      populationDensity1km: 2673,
      population5km: 195000,
      populationDensity5km: 2480,
      sourceYear: 2020,
      spatialResolution: '100m',
      source: 'WorldPop',
      sourceDataset: 'Constrained Individual Countries 2020 (UN-adjusted)',
      endpoint: 'https://data.worldpop.org',
      isAvailable: true
    },
    executiveSummaryId: 'Properti ini berada di area dengan aktivitas gempa sedang dan paparan banjir luapan tinggi.',
    executiveSummaryEn: 'This property is located in an area with moderate seismic activity and high flood exposure.',
    sourceAttributions: ['Copernicus DEM', 'BNPB inaRISK', 'USGS FDSN', 'Open-Meteo ERA5', 'OpenStreetMap', 'WorldPop'],
    buildingProfile: {
      propertyType: 'Residential',
      buildingFloors: 2,
      constructionYear: 2018,
      foundationType: 'Pondasi Batu Kali & Sloof Beton Bertulang',
      structuralSystem: 'Rangka Dinding Terkekang (Confined Masonry)',
      estimatedPropertyValueIdr: 1850000000,
      profilingLevel: 'enriched_building_attributes',
      notesId: 'Bangunan 2 lantai dengan struktur rangka beton bertulang.',
      notesEn: '2-story residence with reinforced concrete frame structure.'
    }
  };

  const html = MasterReportGenerator.generateMasterReportHtml({
    assessment: sampleAssessment,
    lang,
    ownerName: isEn ? 'PT Properti Tangguh Perkasa' : 'Keluarga Bpk. Hendrawan',
    isSample: true
  });

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="gotangguh-sample-report-${lang}.html"`
    }
  });
}
