import type { MultiHazardAssessmentResult, HazardCategory } from '../types/hazard.types';
import type { ReportMetric } from '../types/feature.types';

export class ReportMetricRegistry {
  /**
   * Builds normalized ReportMetric items for a specific hazard category from an assessment.
   * Returns items with strict status assignment ('available' | 'nodata' | 'error' | 'status').
   */
  public static getMetricsForCategory(
    category: HazardCategory,
    assessment: MultiHazardAssessmentResult,
    isEn: boolean
  ): ReportMetric[] {
    const { flood, quake, heat, transport } = assessment;

    switch (category) {
      case 'flood':
        return [
          {
            id: 'flood_elevation',
            labelId: 'Elevasi Permukaan Tanah',
            labelEn: 'Ground Surface Elevation',
            value: flood.elevationMeters !== null ? `${flood.elevationMeters}` : null,
            unit: isEn ? 'm MSL' : 'm dpl',
            source: 'Copernicus DEM (Open-Meteo)',
            spatialResolution: '~90m grid',
            status: flood.elevationMeters !== null ? 'available' : 'nodata',
            priority: 1,
            type: 'source',
            dataType: 'source',
            descriptionId: 'Ketinggian tanah diekstraksi dari Digital Elevation Model Copernicus 90m.',
            descriptionEn: 'Ground height extracted from Copernicus DEM 90m resolution elevation model.'
          },
          {
            id: 'flood_slope',
            labelId: 'Kemiringan Lereng Topografi',
            labelEn: 'Terrain Slope Gradient',
            value: flood.slopeDegrees !== null && flood.slopeDegrees !== undefined
              ? `${flood.slopeDegrees}° (${flood.slopeClassification || (isEn ? 'DEM Gradient' : 'Gradien DEM')})`
              : null,
            source: 'Copernicus DEM 90m Stencil',
            spatialResolution: '~90m grid',
            status: flood.slopeDegrees !== null && flood.slopeDegrees !== undefined ? 'available' : 'nodata',
            priority: 1.5,
            type: 'derived',
            dataType: 'derived',
            descriptionId: 'Kemiringan lereng dihitung dari gradien elevasi 5 titik DEM (bukan hasil survei lapangan langsung).',
            descriptionEn: 'Terrain slope calculated from 5-point DEM elevation gradient (not a direct field survey measurement).'
          },
          {
            id: 'flood_local_relief',
            labelId: 'Relief Relatif Tapak',
            labelEn: 'Local Relative Relief',
            value: flood.localReliefMeters !== null && flood.localReliefMeters !== undefined
              ? `${flood.localReliefMeters > 0 ? `+${flood.localReliefMeters}` : flood.localReliefMeters} m (${flood.localReliefType || (isEn ? 'Topography' : 'Topografi')})`
              : null,
            source: 'Copernicus DEM 90m Topography',
            spatialResolution: '~100m radius stencil',
            status: flood.localReliefMeters !== null && flood.localReliefMeters !== undefined ? 'available' : 'nodata',
            priority: 1.8,
            type: 'derived',
            dataType: 'derived',
            descriptionId: 'Selisih elevasi titik tapak terhadap median elevasi area sekitar (~100m) sebagai bukti pendukung topografi.',
            descriptionEn: 'Elevation difference between site center and median surrounding terrain (~100m) as supporting topographic evidence.'
          },
          {
            id: 'flood_flow_accumulation',
            labelId: 'Indikasi Konvergensi Limpasan Permukaan',
            labelEn: 'Surface Runoff Convergence Indicator',
            value: flood.flowAccumulationPotential || null,
            source: 'GoTangguh Terrain Model',
            spatialResolution: '~90m grid stencil',
            status: flood.flowAccumulationPotential ? 'available' : 'nodata',
            priority: 2,
            type: 'derived',
            dataType: 'derived',
            descriptionId: 'Indikasi topografi konvergensi limpasan berdasarkan data DEM. Bukan simulasi hidrologi penuh ataupun klasifikasi resmi BNPB.',
            descriptionEn: 'Topographic runoff convergence indication based on DEM data. Not a full hydrological simulation nor an official BNPB classification.'
          },
          {
            id: 'flood_max_rainfall',
            labelId: 'Maksimum Curah Hujan Harian (2020–2024 / ERA5)',
            labelEn: 'Max Daily Precipitation (2020–2024 / ERA5)',
            value: flood.max24hRainfallMm !== null ? `${flood.max24hRainfallMm}` : null,
            unit: isEn ? 'mm/day' : 'mm/hari',
            source: 'ERA5-Seamless (Open-Meteo)',
            spatialResolution: '~25km grid (2020–2024)',
            status: flood.max24hRainfallMm !== null ? 'available' : 'nodata',
            priority: 3,
            type: 'source',
            dataType: 'source',
            descriptionId: 'Curah hujan harian tertinggi yang tercatat dalam rentang 5 tahun (2020–2024) dari dataset reanalisis atmosfer ERA5-Seamless (Open-Meteo).',
            descriptionEn: '5-year historical peak daily precipitation (2020–2024) from ERA5-Seamless atmospheric reanalysis dataset.'
          },
          {
            id: 'flood_waterway_distance',
            labelId: 'Jarak ke Badan Air Terdekat',
            labelEn: 'Distance to Nearest Waterway',
            value: flood.distanceToRiverMeters !== null && flood.distanceToRiverMeters >= 0
              ? `±${flood.distanceToRiverMeters}`
              : (flood.waterwayBounded && (flood.waterwayBounded.state === 'AVAILABLE_BOUNDED' || flood.waterwayBounded.state === 'NODATA_SEARCH_SUCCESS')
                  ? (flood.waterwayBounded.displayValue || '>5 km')
                  : null),
            unit: flood.distanceToRiverMeters !== null && flood.distanceToRiverMeters >= 0 ? (isEn ? 'm' : 'meter') : undefined,
            source: flood.nearestRiverName ? `OSM (${flood.nearestRiverName})` : 'OpenStreetMap Waterways',
            sourceTitle: flood.nearestRiverName,
            spatialResolution: 'vector polyline',
            status: (flood.distanceToRiverMeters !== null && flood.distanceToRiverMeters >= 0) ||
                    Boolean(flood.waterwayBounded && (flood.waterwayBounded.state === 'AVAILABLE_BOUNDED' || flood.waterwayBounded.state === 'NODATA_SEARCH_SUCCESS'))
              ? 'available'
              : 'nodata',
            spatialState: flood.waterwayBounded?.state ?? (flood.distanceToRiverMeters !== null ? 'AVAILABLE_EXACT' : 'ERROR_OR_TIMEOUT'),
            relation: flood.waterwayBounded?.relation ?? (flood.distanceToRiverMeters !== null ? 'exact' : null),
            boundMeters: flood.waterwayBounded?.lowerBoundMeters ?? null,
            priority: 4,
            type: 'source',
            dataType: 'source',
            descriptionId: (flood.distanceToRiverMeters !== null && flood.distanceToRiverMeters >= 0)
              ? (flood.nearestRiverName ? `Badan air: ${flood.nearestRiverName}` : 'Jarak tegak lurus terdekat ke geometri badan air (sungai/kanal/saluran) dari OpenStreetMap (Bukan garis sempadan resmi pemerintah).')
              : (flood.waterwayBounded?.state === 'AVAILABLE_BOUNDED' || flood.waterwayBounded?.state === 'NODATA_SEARCH_SUCCESS'
                  ? 'Tidak teridentifikasi badan air/sungai terpetakan dalam radius 5 km (Pencarian Berhasil).'
                  : 'Data badan air tidak dapat dimuat karena server OpenStreetMap tidak merespon.'),
            descriptionEn: (flood.distanceToRiverMeters !== null && flood.distanceToRiverMeters >= 0)
              ? (flood.nearestRiverName ? `Waterway: ${flood.nearestRiverName}` : 'Perpendicular distance to nearest mapped waterway (river/canal/drain) from OpenStreetMap (Not an official regulatory setback boundary).')
              : (flood.waterwayBounded?.state === 'AVAILABLE_BOUNDED' || flood.waterwayBounded?.state === 'NODATA_SEARCH_SUCCESS'
                  ? 'No mapped waterway identified within 5 km search radius (Search Succeeded).'
                  : 'Waterway data unavailable due to OpenStreetMap server error/timeout.')
          },
          {
            id: 'flood_drainage_channel',
            labelId: 'Saluran Drainase Mikro',
            labelEn: 'Micro Drainage Channel',
            value: flood.nearestDrainageChannel ? `${flood.nearestDrainageChannel} (±${flood.distanceToDrainageMeters}m)` : (isEn ? 'Data saluran drainase mikro belum tersedia' : 'Data saluran drainase mikro belum tersedia'),
            source: 'OpenStreetMap Infrastructure',
            status: flood.nearestDrainageChannel ? 'available' : 'status',
            priority: 4.5,
            type: flood.nearestDrainageChannel ? 'source' : 'assessment_status',
            dataType: flood.nearestDrainageChannel ? 'source' : 'status',
            descriptionId: flood.nearestDrainageChannel ? 'Saluran drainase terpetakan dalam basis data OpenStreetMap.' : 'Data dimensi dan kapasitas saluran drainase lingkungan memerlukan survei utilitas lokal terverifikasi.',
            descriptionEn: flood.nearestDrainageChannel ? 'Mapped drainage feature from OpenStreetMap database.' : 'Site-specific drainage dimensions and capacity require verified local utility engineering surveys.'
          },
          {
            id: 'flood_inundation_depth',
            labelId: 'Kedalaman Genangan In-Situ',
            labelEn: 'In-Situ Inundation Depth',
            value: flood.floodDepthMeters !== null ? `${flood.floodDepthMeters} m` : (isEn ? 'Data sensor genangan in-situ belum tersedia' : 'Data sensor genangan in-situ belum tersedia'),
            source: 'Sensor Pemantau Genangan / Model Hidraulik Mikro',
            status: flood.floodDepthMeters !== null ? 'available' : 'status',
            priority: 5,
            type: flood.floodDepthMeters !== null ? 'source' : 'assessment_status',
            dataType: flood.floodDepthMeters !== null ? 'source' : 'status',
            descriptionId: flood.floodDepthMeters !== null ? 'Kedalaman genangan langsung dari sensor/perekam elevasi air terverifikasi.' : 'Data kedalaman genangan mikro memerlukan pengukuran sensor in-situ atau pemodelan hidraulik 2D terkalibrasi.',
            descriptionEn: flood.floodDepthMeters !== null ? 'Direct inundation depth from verified in-situ water level sensor.' : 'Micro inundation depth requires in-situ sensor monitoring or calibrated 2D hydraulic simulation.'
          },
          {
            id: 'flood_historical_events',
            labelId: 'Histori Kejadian Banjir',
            labelEn: 'Historical Inundation Records',
            value: flood.historicalFloodEventsCount !== null ? `${flood.historicalFloodEventsCount} kejadian (${flood.historicalFloodPeriod || 'DIBI'})` : (isEn ? 'Data histori banjir mikro tapak belum tersedia' : 'Data histori banjir mikro tapak belum tersedia'),
            source: 'DIBI BNPB / BPBD Regional',
            status: flood.historicalFloodEventsCount !== null ? 'available' : 'status',
            priority: 5.5,
            type: flood.historicalFloodEventsCount !== null ? 'source' : 'assessment_status',
            dataType: flood.historicalFloodEventsCount !== null ? 'source' : 'status',
            descriptionId: flood.historicalFloodEventsCount !== null ? 'Catatan kejadian bencana banjir dari basis data resmi DIBI BNPB / BPBD.' : 'Data histori kejadian banjir berbasis persil mikro belum tersedia dalam katalog bencana terbuka.',
            descriptionEn: flood.historicalFloodEventsCount !== null ? 'Historical flood disaster event records from official DIBI BNPB / BPBD database.' : 'Parcel-level historical inundation records are currently unavailable in open disaster catalogs.'
          },
          {
            id: 'flood_glofas_discharge',
            labelId: 'Debit Model Hidrologi GloFAS (Konteks DAS)',
            labelEn: 'GloFAS River Discharge (Catchment Context)',
            value: (flood.glofasDischargeModelM3s ?? flood.riverDischargeM3s) !== null && (flood.glofasDischargeModelM3s ?? flood.riverDischargeM3s) !== undefined
              ? `${flood.glofasDischargeModelM3s ?? flood.riverDischargeM3s}`
              : null,
            unit: 'm³/s',
            source: 'Copernicus GloFAS',
            spatialResolution: '~5km grid cell',
            status: (flood.glofasDischargeModelM3s ?? flood.riverDischargeM3s) !== null && (flood.glofasDischargeModelM3s ?? flood.riverDischargeM3s) !== undefined ? 'available' : 'nodata',
            priority: 6,
            type: 'model',
            dataType: 'model',
            descriptionId: 'Debit rata-rata model hidrologi DAS regional Copernicus GloFAS (~5km grid) sebagai indikator konteks hidrologi makro kawasan (tidak dimasukkan ke skor persil mikro tanpa model hidraulik 2D).',
            descriptionEn: 'Regional catchment hydrological model discharge from Copernicus GloFAS (~5km grid) as macro hydrological context (not injected into micro parcel score without a 2D hydraulic simulation).'
          },
          {
            id: 'flood_bnpb_index',
            labelId: 'Indeks Bahaya Banjir BNPB',
            labelEn: 'BNPB Flood Hazard Index',
            value: flood.bnpbFloodHazardIndex !== null && flood.bnpbFloodHazardIndex !== undefined
              ? `${(+flood.bnpbFloodHazardIndex).toFixed(3)}`
              : null,
            source: 'BNPB inaRISK GIS Server',
            spatialResolution: 'raster 250m',
            status: flood.bnpbFloodHazardIndex !== null && flood.bnpbFloodHazardIndex !== undefined ? 'available' : 'nodata',
            priority: 7,
            type: 'source',
            dataType: 'source',
            descriptionId: 'Nilai indeks bahaya banjir raster murni dari server GIS BNPB inaRISK (INDEKS_BAHAYA_BANJIR).',
            descriptionEn: 'Raw raster flood hazard index value from BNPB inaRISK GIS Server (INDEKS_BAHAYA_BANJIR).'
          },
          {
            id: 'flood_bnpb_tier',
            labelId: 'Zonasi Bahaya Banjir BNPB',
            labelEn: 'BNPB Flood Hazard Tier',
            value: flood.floodClassSource === 'BNPB' && flood.floodClass && !flood.floodClass.includes('tidak tersedia') ? flood.floodClass : (flood.bnpbInaRiskClass && !flood.bnpbInaRiskClass.includes('tidak tersedia') ? flood.bnpbInaRiskClass : null),
            source: 'BNPB inaRISK GIS Server',
            spatialResolution: 'raster 250m',
            status: (flood.floodClassSource === 'BNPB' && flood.floodClass && !flood.floodClass.includes('tidak tersedia')) || (flood.bnpbInaRiskClass && !flood.bnpbInaRiskClass.includes('tidak tersedia')) ? 'available' : 'nodata',
            priority: 8,
            type: 'source',
            dataType: 'source',
            descriptionId: 'Zonasi indeks bahaya banjir resmi dari server GIS BNPB inaRISK.',
            descriptionEn: 'Official flood hazard index layer from BNPB inaRISK GIS Server.'
          },
          {
            id: 'flood_thinkhazard_class',
            labelId: assessment.worldBankReport?.floodLevel && !assessment.worldBankReport.strongAdministrativeMatch
              ? 'Baseline Nasional (ThinkHazard)'
              : 'Klasifikasi Regional (ThinkHazard)',
            labelEn: assessment.worldBankReport?.floodLevel && !assessment.worldBankReport.strongAdministrativeMatch
              ? 'National Baseline (ThinkHazard)'
              : 'Regional Classification (ThinkHazard)',
            value: (assessment.worldBankReport?.floodLevel && assessment.worldBankReport.floodLevel !== 'No Data')
              ? assessment.worldBankReport.floodLevel
              : (flood.thinkHazardFloodLevel && flood.thinkHazardFloodLevel !== 'No Data' ? flood.thinkHazardFloodLevel : null),
            source: 'World Bank / GFDRR ThinkHazard!',
            spatialResolution: isEn ? 'regional analysis' : 'analisis regional',
            status: (assessment.worldBankReport?.floodLevel && assessment.worldBankReport.floodLevel !== 'No Data') || (flood.thinkHazardFloodLevel && flood.thinkHazardFloodLevel !== 'No Data') ? 'available' : 'nodata',
            priority: 9,
            type: 'source',
            dataType: 'source',
            descriptionId: assessment.worldBankReport?.strongAdministrativeMatch
              ? 'Klasifikasi bahaya banjir tingkat administratif regional dari World Bank / GFDRR ThinkHazard! (Bukan pengukuran titik tapak).'
              : 'Baseline bahaya banjir makro tingkat nasional (ADM0) dari World Bank ThinkHazard! (Bukan pengukuran titik tapak).',
            descriptionEn: assessment.worldBankReport?.strongAdministrativeMatch
              ? 'Regional administrative-level flood hazard classification from World Bank / GFDRR ThinkHazard! (Not a site-specific point measurement).'
              : 'National macro-level flood hazard baseline (ADM0) from World Bank ThinkHazard! (Not a site-specific point measurement).'
          },
          {
            id: 'flood_model_level',
            labelId: 'Skor Penapisan Risiko Banjir GoTangguh',
            labelEn: 'GoTangguh Flood Screening Score',
            value: flood.score !== null ? `${flood.score}/100 (${flood.floodModelLevel})` : (flood.floodModelLevel && flood.floodModelLevel !== 'Data Tidak Tersedia' ? flood.floodModelLevel : null),
            source: 'GoTangguh Risk Engine',
            status: flood.score !== null || (flood.floodModelLevel && flood.floodModelLevel !== 'Data Tidak Tersedia') ? 'available' : 'nodata',
            priority: 10,
            type: 'model',
            dataType: 'model',
            descriptionId: 'Skor penapisan risiko banjir internal GoTangguh (0–100) berbasis integrasi baseline resmi, elevasi DEM, presipitasi ERA5, dan jarak badan air OSM. Bukan nilai probabilitas empiris maupun skor resmi BNPB.',
            descriptionEn: 'GoTangguh internal flood screening score (0–100) based on official baseline, DEM elevation, ERA5 precipitation, and OSM waterway proximity. Not an empirical probability or official BNPB score.'
          }
        ];

      case 'earthquake':
        return [
          {
            id: 'seismic_model_score',
            labelId: 'Skor Penapisan Risiko Seismik GoTangguh',
            labelEn: 'GoTangguh Seismic Screening Score',
            value: quake.score !== null ? `${quake.score}/100` : null,
            source: 'GoTangguh Risk Engine',
            status: quake.score !== null ? 'available' : 'nodata',
            priority: 0.5,
            type: 'model',
            dataType: 'model',
            descriptionId: 'Skor penapisan risiko seismik internal GoTangguh (0–100) berbasis integrasi zonasi resmi BNPB/PVMBG, percepatan PGA (MCEG 100th), riwayat klaster gempa USGS, dan kerentanan likuefaksi. Bukan nilai probabilitas empiris maupun sertifikasi resmi BNPB.',
            descriptionEn: 'GoTangguh internal seismic screening score (0–100) based on official BNPB/PVMBG zonation, PGA ground motion (100yr MCEG), USGS earthquake cluster history, and liquefaction susceptibility. Not an empirical probability or official BNPB score.'
          },
          {
            id: 'seismic_thinkhazard_class',
            labelId: assessment.worldBankReport?.earthquakeLevel && !assessment.worldBankReport.strongAdministrativeMatch
              ? 'Baseline Nasional (ThinkHazard)'
              : 'Klasifikasi Regional (ThinkHazard)',
            labelEn: assessment.worldBankReport?.earthquakeLevel && !assessment.worldBankReport.strongAdministrativeMatch
              ? 'National Baseline (ThinkHazard)'
              : 'Regional Classification (ThinkHazard)',
            value: (assessment.worldBankReport?.earthquakeLevel && assessment.worldBankReport.earthquakeLevel !== 'No Data')
              ? assessment.worldBankReport.earthquakeLevel
              : (quake.quakeClassSource === 'ThinkHazard' ? quake.quakeClass : null),
            source: assessment.worldBankReport?.countryName
              ? `World Bank / GFDRR ThinkHazard! (${assessment.worldBankReport.countryName})`
              : 'World Bank / GFDRR ThinkHazard!',
            spatialResolution: isEn ? 'regional analysis' : 'analisis regional',
            status: (assessment.worldBankReport?.earthquakeLevel && assessment.worldBankReport.earthquakeLevel !== 'No Data') || (quake.quakeClassSource === 'ThinkHazard' && Boolean(quake.quakeClass)) ? 'available' : 'nodata',
            priority: 1,
            type: 'source',
            dataType: 'source',
            descriptionId: assessment.worldBankReport?.strongAdministrativeMatch
              ? `Klasifikasi bahaya seismik regional tingkat ${assessment.worldBankReport.granularity || 'wilayah'} dari World Bank ThinkHazard! (Bukan pengukuran titik mikro).`
              : 'Baseline bahaya seismik makro nasional Indonesia dari World Bank ThinkHazard! (Bukan pengukuran titik mikro).',
            descriptionEn: assessment.worldBankReport?.strongAdministrativeMatch
              ? `Regional seismic hazard classification at ${assessment.worldBankReport.granularity || 'division'} level from World Bank ThinkHazard! (Not a site-specific point measurement).`
              : 'National macro-level seismic hazard baseline for Indonesia from World Bank ThinkHazard! (Not a site-specific point measurement).'
          },
          {
            id: 'seismic_bnpb_class',
            labelId: 'Klasifikasi Gempa BNPB (PVMBG)',
            labelEn: 'BNPB Earthquake Class (PVMBG)',
            value: quake.quakeClassSource === 'BNPB' && quake.quakeClass && !quake.quakeClass.includes('tidak tersedia')
              ? quake.quakeClass
              : (quake.bnpbInaRiskClass && !quake.bnpbInaRiskClass.includes('tidak tersedia') ? quake.bnpbInaRiskClass : null),
            source: 'BNPB inaRISK / PVMBG',
            spatialResolution: 'raster 250m',
            status: (quake.quakeClassSource === 'BNPB' && quake.quakeClass && !quake.quakeClass.includes('tidak tersedia')) || (quake.bnpbInaRiskClass && !quake.bnpbInaRiskClass.includes('tidak tersedia')) ? 'available' : 'nodata',
            priority: 1.5,
            type: 'source',
            dataType: 'source',
            descriptionId: 'Klasifikasi tingkat bahaya seismik resmi dari BNPB inaRISK / PVMBG.',
            descriptionEn: 'Official seismic hazard classification layer from BNPB inaRISK / PVMBG.'
          },
          {
            id: 'seismic_historical_quakes_150km',
            labelId: 'Histori Gempa (Radius 150km, M≥4.0)',
            labelEn: 'Historical Quakes (150km, M≥4.0)',
            value: quake.historicalQuakesCount150km !== null && quake.historicalQuakesCount150km !== undefined ? `${quake.historicalQuakesCount150km}` : null,
            unit: isEn ? 'events (10 yrs)' : 'kejadian (10 thn)',
            source: 'USGS / EMSC Historical Catalog',
            spatialResolution: isEn ? '150km catalog' : 'katalog 150km',
            status: quake.historicalQuakesCount150km !== null && quake.historicalQuakesCount150km !== undefined ? 'available' : 'nodata',
            priority: 2,
            type: 'source',
            dataType: 'source',
            descriptionId: 'Jumlah kejadian gempa tercatat (M>=4.0) dalam radius 150 km selama 10 tahun terakhir.',
            descriptionEn: 'Recorded earthquake events (M>=4.0) within 150 km over the past 10 years.'
          },
          {
            id: 'seismic_historical_quakes_100km',
            labelId: 'Histori Gempa (Radius 100km, M≥4.0)',
            labelEn: 'Historical Quakes (100km, M≥4.0)',
            value: quake.historicalQuakesCount100km !== null && quake.historicalQuakesCount100km !== undefined ? `${quake.historicalQuakesCount100km}` : null,
            unit: isEn ? 'events (10 yrs)' : 'kejadian (10 thn)',
            source: 'USGS / EMSC Historical Catalog',
            spatialResolution: isEn ? '100km catalog' : 'katalog 100km',
            status: quake.historicalQuakesCount100km !== null && quake.historicalQuakesCount100km !== undefined ? 'available' : 'nodata',
            priority: 2.5,
            type: 'source',
            dataType: 'source',
            descriptionId: 'Jumlah kejadian gempa tercatat (M>=4.0) dalam radius 100 km selama 10 tahun terakhir.',
            descriptionEn: 'Recorded earthquake events (M>=4.0) within 100 km over the past 10 years.'
          },
          {
            id: 'seismic_max_mag',
            labelId: 'Magnitudo Maksimum Historis',
            labelEn: 'Maximum Historical Magnitude',
            value: quake.maxHistoricalMag !== null ? `M ${quake.maxHistoricalMag}` : null,
            source: 'USGS Earthquake Hazards Program',
            status: quake.maxHistoricalMag !== null ? 'available' : 'nodata',
            priority: 3,
            type: 'source',
            dataType: 'source',
            descriptionId: 'Magnitudo gempa bumi terkuat yang tercatat dalam katalog seismik 10 tahun terakhir.',
            descriptionEn: 'Peak earthquake magnitude recorded in the 10-year seismic catalog.'
          },
          {
            id: 'seismic_bmkg_recent',
            labelId: 'Aktivitas Seismik Terkini (BMKG)',
            labelEn: 'Recent Seismic Monitoring (BMKG)',
            value: quake.nearestEpicenterKm !== null
              ? (quake.latestQuakeDescription || `±${quake.nearestEpicenterKm} km`)
              : null,
            source: 'BMKG Indonesia (TEWS)',
            status: quake.nearestEpicenterKm !== null ? 'available' : 'nodata',
            priority: 4,
            type: 'source',
            dataType: 'source',
            descriptionId: 'Pemantauan real-time gempa bumi terkini dari sistem TEWS BMKG.',
            descriptionEn: 'Real-time earthquake monitoring feed from BMKG TEWS.'
          },
          {
            id: 'seismic_liquefaction_status',
            labelId: 'Tingkat Bahaya Likuefaksi',
            labelEn: 'Liquefaction Hazard Tier',
            value: quake.liquefactionRisk || (isEn ? 'Official class unavailable' : 'Klasifikasi resmi tidak tersedia'),
            source: 'BNPB inaRISK',
            status: quake.liquefactionRisk ? 'available' : 'status',
            priority: 5,
            type: quake.liquefactionRisk ? 'source' : 'assessment_status',
            dataType: quake.liquefactionRisk ? 'source' : 'status',
            descriptionId: 'Indeks kerentanan likuefaksi tanah dari Server GIS BNPB inaRISK.',
            descriptionEn: 'Subsurface liquefaction susceptibility layer from BNPB inaRISK.'
          },
          {
            id: 'seismic_pga',
            labelId: 'Percepatan Batuan Dasar (PGA)',
            labelEn: 'Peak Ground Acceleration (PGA)',
            value: quake.estimatedPgaG !== null ? `${quake.estimatedPgaG} g` : (isEn ? 'Belum tersedia' : 'Belum tersedia'),
            source: quake.estimatedPgaG !== null
              ? 'BNPB inaRISK (PGA_MCEG_100)'
              : (isEn ? 'Verified geotechnical/spectral data required' : 'Memerlukan data percepatan/geoteknik terverifikasi'),
            status: quake.estimatedPgaG !== null ? 'available' : 'status',
            priority: 6,
            type: quake.estimatedPgaG !== null ? 'source' : 'assessment_status',
            dataType: quake.estimatedPgaG !== null ? 'source' : 'status',
            descriptionId: quake.estimatedPgaG !== null ? 'Nilai PGA menunjukkan tingkat percepatan gerakan tanah yang perlu dipertimbangkan dalam evaluasi struktur (Sumber: BNPB PGA_MCEG_100).' : 'Data percepatan seismik memerlukan pengukuran geoteknik/spektral terverifikasi.',
            descriptionEn: quake.estimatedPgaG !== null ? 'PGA value indicates peak ground acceleration level to be considered in structural engineering evaluation (Source: BNPB PGA_MCEG_100).' : 'PGA requires verified geotechnical or spectral borehole measurements.'
          },
          {
            id: 'soil_regional_texture',
            labelId: 'Karakteristik Tanah Regional',
            labelEn: 'Regional Soil Characteristics',
            value: assessment.soil?.clayPercent !== null && assessment.soil?.clayPercent !== undefined
              ? (isEn
                  ? `Clay ${assessment.soil?.clayPercent}%, Sand ${assessment.soil?.sandPercent}%, Silt ${assessment.soil?.siltPercent}%`
                  : `Lempung ${assessment.soil?.clayPercent}%, Pasir ${assessment.soil?.sandPercent}%, Debu ${assessment.soil?.siltPercent}%`)
              : (quake.soilSiteClass ? (isEn ? `Class ${quake.soilSiteClass}` : `Kelas ${quake.soilSiteClass}`) : (isEn ? 'Perlu verifikasi Vs30/SPT untuk klasifikasi tapak' : 'Perlu verifikasi Vs30/SPT untuk klasifikasi tapak')),
            source: assessment.soil?.clayPercent !== null ? 'ISRIC SoilGrids 2.0' : (quake.sniStandardRef || 'SNI 1726:2019'),
            spatialResolution: assessment.soil?.clayPercent !== null ? '250m' : undefined,
            status: assessment.soil?.clayPercent !== null ? 'available' : 'status',
            priority: 7,
            type: assessment.soil?.clayPercent !== null ? 'source' : 'assessment_status',
            dataType: assessment.soil?.clayPercent !== null ? 'source' : 'status',
            descriptionId: 'Karakteristik fraksi tekstur tanah lapisan 0-30cm dari ISRIC SoilGrids 2.0. Perlu verifikasi Vs30/SPT untuk klasifikasi tapak SNI 1726:2019.',
            descriptionEn: 'Regional soil texture characteristics (0-30cm) from ISRIC SoilGrids 2.0. In-situ Vs30/SPT geotechnical testing is required for SNI 1726:2019 site classification.'
          }
        ];

      case 'heat':
        return [
          {
            id: 'heat_forecast_temp',
            labelId: 'Suhu Puncak Prakiraan (7 Hari)',
            labelEn: 'Forecast Peak Temperature (7d)',
            value: (heat.forecastPeakTempC ?? heat.avgMaxTempC) !== null && (heat.forecastPeakTempC ?? heat.avgMaxTempC) !== undefined ? `${heat.forecastPeakTempC ?? heat.avgMaxTempC}` : null,
            unit: '°C',
            source: 'Open-Meteo Numerical Forecast',
            spatialResolution: '7-day forecast grid',
            status: (heat.forecastPeakTempC ?? heat.avgMaxTempC) !== null && (heat.forecastPeakTempC ?? heat.avgMaxTempC) !== undefined ? 'available' : 'nodata',
            priority: 1,
            type: 'source',
            dataType: 'source',
            descriptionId: 'Suhu maksimum harian tertinggi dalam jendela prakiraan numerik 7 hari.',
            descriptionEn: 'Highest daily maximum temperature across the 7-day numerical forecast window.'
          },
          {
            id: 'heat_historical_peak',
            labelId: 'Puncak Suhu Ekstrem Historis',
            labelEn: 'Historical Peak Extreme Temperature',
            value: heat.historicalPeakTempC !== null ? `${heat.historicalPeakTempC}` : null,
            unit: '°C',
            source: heat.historicalDataSource || 'ERA5-Seamless (Open-Meteo)',
            spatialResolution: '~25km grid',
            status: heat.historicalPeakTempC !== null ? 'available' : 'nodata',
            priority: 2,
            type: 'source',
            dataType: 'source',
            descriptionId: 'Rekor temperatur harian tertinggi yang tercatat pada basis data reanalisis atmosfer ERA5/MERRA-2.',
            descriptionEn: 'Highest daily maximum temperature recorded in the ERA5/MERRA-2 atmospheric reanalysis dataset.'
          },
          {
            id: 'heat_projected_rise_2050',
            labelId: 'Proyeksi Kenaikan Suhu (2050 CMIP6)',
            labelEn: 'Projected Temp Rise (2050 CMIP6)',
            value: heat.projectedTempRise2050C !== null ? `+${heat.projectedTempRise2050C}` : null,
            unit: heat.projectedTempRise2050C !== null ? '°C' : undefined,
            source: 'CMIP6 MRI-AGCM3-2-S (SSP2-4.5)',
            spatialResolution: '~100km climate grid',
            status: heat.projectedTempRise2050C !== null ? 'available' : 'nodata',
            priority: 3,
            type: 'source',
            dataType: 'source',
            descriptionId: 'Proyeksi anomali kenaikan suhu rata-rata tahun 2050 (periode 2041–2060 vs baseline 1995–2014) model iklim global CMIP6 MRI-AGCM3-2-S skenario SSP2-4.5.',
            descriptionEn: 'Projected 2050 temperature rise anomaly (2041–2060 vs 1995–2014 baseline) from CMIP6 MRI-AGCM3-2-S global climate model under SSP2-4.5 scenario.'
          },
          {
            id: 'heat_thinkhazard_class',
            labelId: assessment.worldBankReport?.extremeHeatLevel && !assessment.worldBankReport.strongAdministrativeMatch
              ? 'Baseline Nasional (ThinkHazard)'
              : 'Indikator Regional (ThinkHazard)',
            labelEn: assessment.worldBankReport?.extremeHeatLevel && !assessment.worldBankReport.strongAdministrativeMatch
              ? 'National Baseline (ThinkHazard)'
              : 'Regional Indicator (ThinkHazard)',
            value: (assessment.worldBankReport?.extremeHeatLevel && assessment.worldBankReport.extremeHeatLevel !== 'No Data')
              ? assessment.worldBankReport.extremeHeatLevel
              : (heat.thinkHazardExtremeHeatLevel && heat.thinkHazardExtremeHeatLevel !== 'No Data' ? heat.thinkHazardExtremeHeatLevel : null),
            source: 'World Bank / GFDRR ThinkHazard!',
            spatialResolution: assessment.worldBankReport?.granularity || 'administrative_division',
            status: (assessment.worldBankReport?.extremeHeatLevel && assessment.worldBankReport.extremeHeatLevel !== 'No Data') || (heat.thinkHazardExtremeHeatLevel && heat.thinkHazardExtremeHeatLevel !== 'No Data') ? 'available' : 'nodata',
            priority: 4,
            type: 'source',
            dataType: 'source',
            descriptionId: assessment.worldBankReport?.strongAdministrativeMatch
              ? 'Klasifikasi bahaya panas ekstrem tingkat regional dari World Bank / GFDRR ThinkHazard! (Bukan pengukuran suhu mikro titik tapak).'
              : 'Baseline bahaya panas ekstrem makro tingkat nasional (ADM0) dari World Bank ThinkHazard! (Bukan pengukuran suhu mikro titik tapak).',
            descriptionEn: assessment.worldBankReport?.strongAdministrativeMatch
              ? 'Regional administrative-level extreme heat indicator from World Bank / GFDRR ThinkHazard! (Not a micro-point temperature reading).'
              : 'National macro-level extreme heat hazard baseline (ADM0) from World Bank ThinkHazard! (Not a micro-point temperature reading).'
          },
          {
            id: 'heat_green_space_density',
            labelId: 'Rasio Fitur Hijau OSM (Proxy)',
            labelEn: 'OSM Green-Feature Ratio (Proxy)',
            value: (heat.greenSpaceRatioPct !== null && heat.greenSpaceRatioPct >= 0) ? `${heat.greenSpaceRatioPct}` : null,
            unit: '%',
            source: 'OpenStreetMap Land Cover',
            spatialResolution: 'mapped polygon features',
            status: (heat.greenSpaceRatioPct !== null && heat.greenSpaceRatioPct >= 0) ? 'available' : 'nodata',
            priority: 5,
            type: 'derived',
            dataType: 'derived',
            descriptionId: 'Proporsi jumlah fitur ruang terbuka hijau dan vegetasi terpetakan dalam dataset OpenStreetMap (bukan tutupan kanopi aktual).',
            descriptionEn: 'Proportion of green space parcels mapped within OpenStreetMap dataset (proxy count ratio, not canopy density).'
          },
          {
            id: 'heat_model_level',
            labelId: 'Tingkat Model Beban Termal',
            labelEn: 'Heat Stress Model Level',
            value: heat.heatModelLevel && heat.heatModelLevel !== 'Data Tidak Tersedia' ? heat.heatModelLevel : null,
            source: 'GoTangguh Risk Engine',
            status: heat.heatModelLevel && heat.heatModelLevel !== 'Data Tidak Tersedia' ? 'available' : 'nodata',
            priority: 6,
            type: 'model',
            dataType: 'model',
            descriptionId: 'Tingkat penapisan beban termal tapak berbasis integrasi suhu puncak prakiraan, rekor historis, dan tutupan hijau.',
            descriptionEn: 'Thermal stress screening level based on integration of forecast peak temperature, historical extreme, and green density.'
          },
          {
            id: 'heat_air_quality_pm25',
            labelId: 'Kualitas Udara PM2.5 (24 Jam)',
            labelEn: 'Air Quality PM2.5 (24h Max)',
            value: assessment.airQuality?.maxPm25_24h !== null && assessment.airQuality?.maxPm25_24h !== undefined
              ? `${assessment.airQuality?.maxPm25_24h}`
              : (assessment.airQuality?.currentPm25 !== null && assessment.airQuality?.currentPm25 !== undefined ? `${assessment.airQuality?.currentPm25}` : null),
            unit: 'µg/m³',
            source: 'Open-Meteo Air Quality (CAMS)',
            spatialResolution: '~11km grid',
            status: (assessment.airQuality?.maxPm25_24h !== null || assessment.airQuality?.currentPm25 !== null) ? 'available' : 'nodata',
            priority: 7,
            type: 'source',
            dataType: 'source',
            descriptionId: 'Konsentrasi partikulat halus PM2.5 dari model atmosfer CAMS Eropa sebagai indikator konteks lingkungan (bukan komponen skor panas).',
            descriptionEn: 'Fine particulate matter PM2.5 concentration from European CAMS model as environmental context (not a heat score component).'
          },
          {
            id: 'heat_air_quality_aqi',
            labelId: 'Indeks Kualitas Udara (AQI Eropa)',
            labelEn: 'Air Quality Index (European AQI)',
            value: assessment.airQuality?.currentEuropeanAqi !== null && assessment.airQuality?.currentEuropeanAqi !== undefined
              ? `${assessment.airQuality?.currentEuropeanAqi}`
              : (assessment.airQuality?.currentUsAqi !== null && assessment.airQuality?.currentUsAqi !== undefined ? `${assessment.airQuality?.currentUsAqi} (US)` : null),
            source: 'Open-Meteo Air Quality (CAMS)',
            status: assessment.airQuality?.currentEuropeanAqi !== null || assessment.airQuality?.currentUsAqi !== null ? 'available' : 'nodata',
            priority: 8,
            type: 'source',
            dataType: 'source',
            descriptionId: 'Indeks kualitas udara atmosferik dari model Copernicus CAMS sebagai indikator konteks lingkungan.',
            descriptionEn: 'Atmospheric air quality index from Copernicus CAMS model as environmental context indicator.'
          },
          {
            id: 'heat_uv_index',
            labelId: 'Indeks Radiasi UV',
            labelEn: 'UV Radiation Index',
            value: assessment.airQuality?.currentUvIndex !== null && assessment.airQuality?.currentUvIndex !== undefined
              ? `${assessment.airQuality?.currentUvIndex}`
              : (assessment.airQuality?.maxUvIndex_24h !== null && assessment.airQuality?.maxUvIndex_24h !== undefined ? `${assessment.airQuality?.maxUvIndex_24h}` : null),
            source: 'Open-Meteo Atmospheric Solar Radiation',
            status: assessment.airQuality?.currentUvIndex !== null || assessment.airQuality?.maxUvIndex_24h !== null ? 'available' : 'nodata',
            priority: 9,
            type: 'source',
            dataType: 'source',
            descriptionId: 'Indeks radiasi sinar ultraviolet matahari sebagai indikator paparan lingkungan terpisah.',
            descriptionEn: 'Solar ultraviolet radiation index as a separate environmental exposure indicator.'
          },
          {
            id: 'heat_population_1km',
            labelId: 'Perkiraan Populasi (Radius 1 km)',
            labelEn: 'Population Estimate (1 km Radius)',
            value: assessment.population?.population1km !== null && assessment.population?.population1km !== undefined
              ? `${assessment.population?.population1km.toLocaleString('id-ID')}`
              : null,
            unit: isEn ? 'persons' : 'jiwa',
            source: 'WorldPop Global High Resolution Population',
            spatialResolution: '~100m raster buffer',
            status: assessment.population?.population1km !== null && assessment.population?.population1km !== undefined ? 'available' : 'nodata',
            priority: 10,
            type: 'source',
            dataType: 'source',
            descriptionId: 'Estimasi jumlah penduduk dalam radius buffer 1 km dari basis data demografi spasial WorldPop (bukan penghuni persil).',
            descriptionEn: 'Estimated population count within a 1 km circular buffer from WorldPop spatial demographics dataset (not property occupants).'
          },
          {
            id: 'heat_firms_hotspots',
            labelId: 'Aktivitas Termal Satelit (50 km / 24 Jam)',
            labelEn: 'Satellite Thermal Hotspots (50 km / 24h)',
            value: assessment.wildfire?.activeHotspots24h !== null && assessment.wildfire?.activeHotspots24h !== undefined
              ? `${assessment.wildfire?.activeHotspots24h}`
              : null,
            unit: isEn ? 'detections' : 'titik',
            source: 'NASA FIRMS (VIIRS NRT)',
            spatialResolution: '375m VIIRS sensor',
            status: assessment.wildfire?.activeHotspots24h !== null && assessment.wildfire?.activeHotspots24h !== undefined ? 'available' : 'nodata',
            priority: 11,
            type: 'source',
            dataType: 'source',
            descriptionId: 'Deteksi anomali termal/hotspot aktif oleh sensor satelit NASA VIIRS dalam radius 50 km (indikator termal, bukan kebakaran terverifikasi).',
            descriptionEn: 'Active thermal anomaly/hotspot detections by NASA VIIRS satellite sensor within 50 km radius (thermal indicator, not confirmed wildfire).'
          }
        ];

      case 'transport':
        return [
          {
            id: 'transport_frontage_road',
            labelId: 'Akses Jalan Terdekat (Frontage)',
            labelEn: 'Frontage / Nearest Road Access',
            value: transport.distanceToNearestRoadMeters !== null
              ? `±${transport.distanceToNearestRoadMeters} ${isEn ? 'm' : 'meter'}`
              : (transport.roadBounded && (transport.roadBounded.state === 'AVAILABLE_BOUNDED' || transport.roadBounded.state === 'NODATA_SEARCH_SUCCESS')
                  ? (transport.roadBounded.displayValue || '>500 m')
                  : null),
            unit: transport.distanceToNearestRoadMeters !== null ? (isEn ? 'm' : 'meter') : undefined,
            source: transport.nearestRoadName || 'OSRM Road-Network Street Snapping',
            sourceTitle: transport.nearestRoadName,
            spatialResolution: 'OSRM street snapping',
            status: transport.distanceToNearestRoadMeters !== null
              ? 'available'
              : (transport.roadBounded && (transport.roadBounded.state === 'AVAILABLE_BOUNDED' || transport.roadBounded.state === 'NODATA_SEARCH_SUCCESS'))
              ? 'bounded'
              : transport.roadBounded?.state === 'ERROR_OR_TIMEOUT'
              ? (transport.roadBounded.name?.includes('timed out') ? 'timeout' : 'error')
              : 'nodata',
            spatialState: transport.roadBounded?.state ?? (transport.distanceToNearestRoadMeters !== null ? 'AVAILABLE_EXACT' : 'ERROR_OR_TIMEOUT'),
            relation: transport.roadBounded?.relation ?? (transport.distanceToNearestRoadMeters !== null ? 'exact' : null),
            boundMeters: transport.roadBounded?.lowerBoundMeters ?? null,
            priority: 1,
            type: 'source',
            dataType: 'source',
            descriptionId: transport.distanceToNearestRoadMeters !== null
              ? (transport.nearestRoadName ? `Jalan: ${transport.nearestRoadName}` : 'Jalan akses langsung depan persil properti.')
              : (transport.roadBounded?.state === 'AVAILABLE_BOUNDED' || transport.roadBounded?.state === 'NODATA_SEARCH_SUCCESS'
                  ? 'Tidak terdeteksi jalan akses langsung dalam radius 500 m (Pencarian Berhasil).'
                  : 'Data jalan akses tidak dapat dimuat karena server OSM/OSRM tidak merespon.'),
            descriptionEn: transport.distanceToNearestRoadMeters !== null
              ? (transport.nearestRoadName ? `Road: ${transport.nearestRoadName}` : 'Frontage street connecting directly to site.')
              : (transport.roadBounded?.state === 'AVAILABLE_BOUNDED' || transport.roadBounded?.state === 'NODATA_SEARCH_SUCCESS'
                  ? 'No frontage road detected within 500 m search radius (Search Succeeded).'
                  : 'Frontage road data unavailable due to server error/timeout.')
          },
          {
            id: 'transport_arterial_corridor',
            labelId: 'Jalan Utama Terdekat',
            labelEn: 'Nearest Major Road',
            value: transport.distanceToArterialMeters !== null
              ? (transport.distanceToArterialMeters >= 1000
                  ? `${(transport.distanceToArterialMeters / 1000).toFixed(1)} km`
                  : `±${transport.distanceToArterialMeters} ${isEn ? 'm' : 'meter'}`)
              : (transport.arterialBounded && (transport.arterialBounded.state === 'AVAILABLE_BOUNDED' || transport.arterialBounded.state === 'NODATA_SEARCH_SUCCESS')
                  ? (transport.arterialBounded.displayValue || '>15 km')
                  : null),
            source: transport.nearestArterialName ? `${transport.nearestArterialName} (OSM)` : 'OpenStreetMap Major Roads',
            sourceTitle: transport.nearestArterialName,
            spatialResolution: 'vector polyline geometry',
            status: transport.distanceToArterialMeters !== null
              ? 'available'
              : (transport.arterialBounded && (transport.arterialBounded.state === 'AVAILABLE_BOUNDED' || transport.arterialBounded.state === 'NODATA_SEARCH_SUCCESS'))
              ? 'bounded'
              : transport.arterialBounded?.state === 'ERROR_OR_TIMEOUT'
              ? (transport.arterialBounded.name?.includes('timed out') ? 'timeout' : 'error')
              : 'nodata',
            spatialState: transport.arterialBounded?.state ?? (transport.distanceToArterialMeters !== null ? 'AVAILABLE_EXACT' : 'ERROR_OR_TIMEOUT'),
            relation: transport.arterialBounded?.relation ?? (transport.distanceToArterialMeters !== null ? 'exact' : null),
            boundMeters: transport.arterialBounded?.lowerBoundMeters ?? null,
            priority: 2,
            type: 'source',
            dataType: 'source',
            descriptionId: transport.distanceToArterialMeters !== null
              ? (transport.nearestArterialName ? `Jalan utama: ${transport.nearestArterialName} (OSM)` : 'Jalan kelas utama (motorway/trunk/primary/secondary) terdekat dari OpenStreetMap.')
              : (transport.arterialBounded?.state === 'AVAILABLE_BOUNDED' || transport.arterialBounded?.state === 'NODATA_SEARCH_SUCCESS'
                  ? 'Tidak terdeteksi jalan kelas utama dalam radius 15 km (Pencarian Berhasil).'
                  : 'Data jalan utama tidak dapat dimuat karena server OpenStreetMap tidak merespon.'),
            descriptionEn: transport.distanceToArterialMeters !== null
              ? (transport.nearestArterialName ? `Major road: ${transport.nearestArterialName} (OSM)` : 'Nearest major road (motorway/trunk/primary/secondary) from OpenStreetMap.')
              : (transport.arterialBounded?.state === 'AVAILABLE_BOUNDED' || transport.arterialBounded?.state === 'NODATA_SEARCH_SUCCESS'
                  ? 'No major road detected within 15 km search radius (Search Succeeded).'
                  : 'Major road data unavailable due to server error/timeout.')
          },
          {
            id: 'transport_healthcare_facility',
            labelId: 'Fasilitas Kesehatan Terdekat',
            labelEn: 'Nearest Healthcare Facility',
            value: transport.distanceToHospitalMeters !== null
              ? (transport.distanceToHospitalMeters >= 1000
                  ? `${(transport.distanceToHospitalMeters / 1000).toFixed(1)} km`
                  : `±${transport.distanceToHospitalMeters} ${isEn ? 'm' : 'meter'}`)
              : (transport.hospitalBounded && (transport.hospitalBounded.state === 'AVAILABLE_BOUNDED' || transport.hospitalBounded.state === 'NODATA_SEARCH_SUCCESS')
                  ? (transport.hospitalBounded.displayValue || '>15 km')
                  : null),
            source: transport.nearestHospitalName ? `${transport.nearestHospitalName} (OSM)` : 'OpenStreetMap Healthcare',
            sourceTitle: transport.nearestHospitalName,
            spatialResolution: 'vector point/polygon',
            status: transport.distanceToHospitalMeters !== null
              ? 'available'
              : (transport.hospitalBounded && (transport.hospitalBounded.state === 'AVAILABLE_BOUNDED' || transport.hospitalBounded.state === 'NODATA_SEARCH_SUCCESS'))
              ? 'bounded'
              : transport.hospitalBounded?.state === 'ERROR_OR_TIMEOUT'
              ? (transport.hospitalBounded.name?.includes('timed out') ? 'timeout' : 'error')
              : 'nodata',
            spatialState: transport.hospitalBounded?.state ?? (transport.distanceToHospitalMeters !== null ? 'AVAILABLE_EXACT' : 'ERROR_OR_TIMEOUT'),
            relation: transport.hospitalBounded?.relation ?? (transport.distanceToHospitalMeters !== null ? 'exact' : null),
            boundMeters: transport.hospitalBounded?.lowerBoundMeters ?? null,
            priority: 3,
            type: 'source',
            dataType: 'source',
            descriptionId: transport.distanceToHospitalMeters !== null
              ? (transport.nearestHospitalName ? `Faskes: ${transport.nearestHospitalName}` : 'Fasilitas kesehatan (rumah sakit/klinik/puskesmas) terdekat dari data OpenStreetMap.')
              : (transport.hospitalBounded?.state === 'AVAILABLE_BOUNDED' || transport.hospitalBounded?.state === 'NODATA_SEARCH_SUCCESS'
                  ? 'Tidak terdeteksi fasilitas kesehatan dalam radius 15 km (Pencarian Berhasil).'
                  : 'Data fasilitas kesehatan tidak dapat dimuat karena server OpenStreetMap tidak merespon.'),
            descriptionEn: transport.distanceToHospitalMeters !== null
              ? (transport.nearestHospitalName ? `Facility: ${transport.nearestHospitalName}` : 'Nearest healthcare facility (hospital/clinic) from OpenStreetMap.')
              : (transport.hospitalBounded?.state === 'AVAILABLE_BOUNDED' || transport.hospitalBounded?.state === 'NODATA_SEARCH_SUCCESS'
                  ? 'No healthcare facility detected within 15 km search radius (Search Succeeded).'
                  : 'Healthcare facility data unavailable due to server error/timeout.')
          },
          {
            id: 'transport_transit_hub',
            labelId: 'Simpul Transit Publik',
            labelEn: 'Public Transit Node',
            value: transport.distanceToTransitHubMeters !== null
              ? (transport.distanceToTransitHubMeters >= 1000
                  ? `${(transport.distanceToTransitHubMeters / 1000).toFixed(1)} km`
                  : `±${transport.distanceToTransitHubMeters} ${isEn ? 'm' : 'meter'}`)
              : (transport.transitBounded && (transport.transitBounded.state === 'AVAILABLE_BOUNDED' || transport.transitBounded.state === 'NODATA_SEARCH_SUCCESS')
                  ? (transport.transitBounded.displayValue || '>15 km')
                  : null),
            source: transport.nearestTransitName ? `${transport.nearestTransitName} (OSM)` : 'OpenStreetMap Transit',
            sourceTitle: transport.nearestTransitName,
            spatialResolution: 'vector point/polygon',
            status: transport.distanceToTransitHubMeters !== null
              ? 'available'
              : (transport.transitBounded && (transport.transitBounded.state === 'AVAILABLE_BOUNDED' || transport.transitBounded.state === 'NODATA_SEARCH_SUCCESS'))
              ? 'bounded'
              : transport.transitBounded?.state === 'ERROR_OR_TIMEOUT'
              ? (transport.transitBounded.name?.includes('timed out') ? 'timeout' : 'error')
              : 'nodata',
            spatialState: transport.transitBounded?.state ?? (transport.distanceToTransitHubMeters !== null ? 'AVAILABLE_EXACT' : 'ERROR_OR_TIMEOUT'),
            relation: transport.transitBounded?.relation ?? (transport.distanceToTransitHubMeters !== null ? 'exact' : null),
            boundMeters: transport.transitBounded?.lowerBoundMeters ?? null,
            priority: 4,
            type: 'source',
            dataType: 'source',
            descriptionId: transport.distanceToTransitHubMeters !== null
              ? (transport.nearestTransitName ? `Transit: ${transport.nearestTransitName}` : 'Stasiun kereta, halte komuter, atau simpul transit terdekat dari OpenStreetMap.')
              : (transport.transitBounded?.state === 'AVAILABLE_BOUNDED' || transport.transitBounded?.state === 'NODATA_SEARCH_SUCCESS'
                  ? 'Tidak terdeteksi simpul transit publik dalam radius 15 km (Pencarian Berhasil).'
                  : 'Data transportasi publik tidak dapat dimuat karena server OpenStreetMap tidak merespon.'),
            descriptionEn: transport.distanceToTransitHubMeters !== null
              ? (transport.nearestTransitName ? `Transit: ${transport.nearestTransitName}` : 'Nearest railway station, commuter stop, or transit node from OpenStreetMap.')
              : (transport.transitBounded?.state === 'AVAILABLE_BOUNDED' || transport.transitBounded?.state === 'NODATA_SEARCH_SUCCESS'
                  ? 'No public transit node detected within 15 km search radius (Search Succeeded).'
                  : 'Transit data unavailable due to server error/timeout.')
          },
          {
            id: 'transport_assembly_point',
            labelId: transport.assemblyPointIsOfficial ? 'Assembly Point Resmi' : 'Titik Kumpul Terdekat (OSM)',
            labelEn: transport.assemblyPointIsOfficial ? 'Official Assembly Point' : 'Nearest Assembly Point (OSM)',
            value: (transport.distanceToAssemblyPointMeters !== null && transport.distanceToAssemblyPointMeters !== undefined)
              ? (transport.distanceToAssemblyPointMeters >= 1000
                  ? `${(transport.distanceToAssemblyPointMeters / 1000).toFixed(1)} km`
                  : `±${transport.distanceToAssemblyPointMeters} ${isEn ? 'm' : 'meter'}`)
              : (transport.assemblyPointBounded && (transport.assemblyPointBounded.state === 'AVAILABLE_BOUNDED' || transport.assemblyPointBounded.state === 'NODATA_SEARCH_SUCCESS')
                  ? (transport.assemblyPointBounded.displayValue || '>15 km')
                  : null),
            source: transport.nearestAssemblyPointName
              ? (transport.assemblyPointIsOfficial ? `${transport.nearestAssemblyPointName} (Resmi)` : `${transport.nearestAssemblyPointName} (OSM)`)
              : 'OpenStreetMap Assembly Points',
            sourceTitle: transport.nearestAssemblyPointName,
            spatialResolution: 'vector point/polygon',
            status: transport.distanceToAssemblyPointMeters !== null
              ? 'available'
              : (transport.assemblyPointBounded && (transport.assemblyPointBounded.state === 'AVAILABLE_BOUNDED' || transport.assemblyPointBounded.state === 'NODATA_SEARCH_SUCCESS'))
              ? 'bounded'
              : transport.assemblyPointBounded?.state === 'ERROR_OR_TIMEOUT'
              ? (transport.assemblyPointBounded.name?.includes('timed out') ? 'timeout' : 'error')
              : 'nodata',
            spatialState: transport.assemblyPointBounded?.state ?? (transport.distanceToAssemblyPointMeters !== null ? 'AVAILABLE_EXACT' : 'ERROR_OR_TIMEOUT'),
            relation: transport.assemblyPointBounded?.relation ?? (transport.distanceToAssemblyPointMeters !== null ? 'exact' : null),
            boundMeters: transport.assemblyPointBounded?.lowerBoundMeters ?? null,
            priority: 5,
            type: 'source',
            dataType: 'source',
            descriptionId: transport.distanceToAssemblyPointMeters !== null
              ? (transport.nearestAssemblyPointName ? `Lokasi: ${transport.nearestAssemblyPointName}` : 'Lokasi titik kumpul evakuasi terdekat.')
              : (transport.assemblyPointBounded?.state === 'AVAILABLE_BOUNDED' || transport.assemblyPointBounded?.state === 'NODATA_SEARCH_SUCCESS'
                  ? 'Tidak terdeteksi titik kumpul dalam radius 15 km (Pencarian Berhasil).'
                  : 'Data titik kumpul terverifikasi belum tersedia.'),
            descriptionEn: transport.distanceToAssemblyPointMeters !== null
              ? (transport.nearestAssemblyPointName ? `Location: ${transport.nearestAssemblyPointName}` : 'Nearest assembly/evacuation point.')
              : (transport.assemblyPointBounded?.state === 'AVAILABLE_BOUNDED' || transport.assemblyPointBounded?.state === 'NODATA_SEARCH_SUCCESS'
                  ? 'No assembly point detected within 15 km search radius (Search Succeeded).'
                  : 'Verified assembly point data is currently unavailable.')
          },
          {
            id: 'transport_travel_time_assembly',
            labelId: 'Waktu Tempuh ke Titik Kumpul',
            labelEn: 'Travel Time to Assembly Point',
            value: (transport.travelTimeToAssemblyPointMinutes &&
                    !transport.travelTimeToAssemblyPointMinutes.includes('di luar radius') &&
                    !transport.travelTimeToAssemblyPointMinutes.includes('tidak dapat dimuat') &&
                    !transport.travelTimeToAssemblyPointMinutes.includes('tidak tersedia') &&
                    !transport.travelTimeToAssemblyPointMinutes.includes('tidak terpetakan') &&
                    !transport.travelTimeToAssemblyPointMinutes.includes('gagal dihitung') &&
                    !transport.travelTimeToAssemblyPointMinutes.includes('tidak dapat dihitung'))
              ? transport.travelTimeToAssemblyPointMinutes
              : null,
            source: 'OSRM Egress / Assembly Routing',
            spatialResolution: 'road network driving graph',
            status: (transport.travelTimeToAssemblyPointMinutes &&
                     !transport.travelTimeToAssemblyPointMinutes.includes('di luar radius') &&
                     !transport.travelTimeToAssemblyPointMinutes.includes('tidak dapat dimuat') &&
                     !transport.travelTimeToAssemblyPointMinutes.includes('tidak tersedia') &&
                     !transport.travelTimeToAssemblyPointMinutes.includes('tidak terpetakan') &&
                     !transport.travelTimeToAssemblyPointMinutes.includes('gagal dihitung') &&
                     !transport.travelTimeToAssemblyPointMinutes.includes('tidak dapat dihitung'))
              ? 'available'
              : 'nodata',
            priority: 6,
            type: 'derived',
            dataType: 'derived',
            descriptionId: 'Estimasi waktu tempuh menuju titik kumpul evakuasi terdekat melalui pemodelan jaringan jalan OSRM.',
            descriptionEn: 'Estimated driving/egress duration to nearest assembly/evacuation point calculated via live OSRM road graph.'
          },
          {
            id: 'transport_fire_station',
            labelId: 'Pos Pemadam Kebakaran',
            labelEn: 'Nearest Fire Station',
            value: transport.distanceToFireStationMeters !== null
              ? (transport.distanceToFireStationMeters >= 1000
                  ? `${(transport.distanceToFireStationMeters / 1000).toFixed(1)} km`
                  : `±${transport.distanceToFireStationMeters} ${isEn ? 'm' : 'meter'}`)
              : (transport.fireStationBounded && (transport.fireStationBounded.state === 'AVAILABLE_BOUNDED' || transport.fireStationBounded.state === 'NODATA_SEARCH_SUCCESS')
                  ? (transport.fireStationBounded.displayValue || '>10 km')
                  : null),
            source: transport.nearestFireStationName ? `${transport.nearestFireStationName} (OSM)` : 'OpenStreetMap Fire Stations',
            sourceTitle: transport.nearestFireStationName,
            spatialResolution: 'vector point/polygon',
            status: transport.distanceToFireStationMeters !== null
              ? 'available'
              : (transport.fireStationBounded && (transport.fireStationBounded.state === 'AVAILABLE_BOUNDED' || transport.fireStationBounded.state === 'NODATA_SEARCH_SUCCESS'))
              ? 'bounded'
              : transport.fireStationBounded?.state === 'ERROR_OR_TIMEOUT'
              ? (transport.fireStationBounded.name?.includes('timed out') ? 'timeout' : 'error')
              : 'nodata',
            spatialState: transport.fireStationBounded?.state ?? (transport.distanceToFireStationMeters !== null ? 'AVAILABLE_EXACT' : 'ERROR_OR_TIMEOUT'),
            relation: transport.fireStationBounded?.relation ?? (transport.distanceToFireStationMeters !== null ? 'exact' : null),
            boundMeters: transport.fireStationBounded?.lowerBoundMeters ?? null,
            priority: 7,
            type: 'source',
            dataType: 'source',
            descriptionId: transport.distanceToFireStationMeters !== null
              ? (transport.nearestFireStationName ? `Pos: ${transport.nearestFireStationName}` : 'Pos unit pemadam kebakaran terdekat (metrik kontekstual).')
              : (transport.fireStationBounded?.state === 'AVAILABLE_BOUNDED' || transport.fireStationBounded?.state === 'NODATA_SEARCH_SUCCESS'
                  ? 'Tidak terdeteksi pos pemadam kebakaran dalam radius 10 km (Pencarian Berhasil).'
                  : 'Data pos pemadam tidak dapat dimuat karena server OpenStreetMap tidak merespon.'),
            descriptionEn: transport.distanceToFireStationMeters !== null
              ? (transport.nearestFireStationName ? `Station: ${transport.nearestFireStationName}` : 'Nearest fire station rescue facility (contextual metric).')
              : (transport.fireStationBounded?.state === 'AVAILABLE_BOUNDED' || transport.fireStationBounded?.state === 'NODATA_SEARCH_SUCCESS'
                  ? 'No fire station detected within 10 km search radius (Search Succeeded).'
                  : 'Fire station data unavailable due to server error/timeout.')
          },
          {
            id: 'transport_driving_travel_time',
            labelId: 'Estimasi Waktu Berkendara',
            labelEn: 'Estimated Driving Travel Time',
            value: (transport.estimatedTravelTimeMinutes &&
                    !transport.estimatedTravelTimeMinutes.includes('di luar radius') &&
                    !transport.estimatedTravelTimeMinutes.includes('tidak dapat dimuat') &&
                    !transport.estimatedTravelTimeMinutes.includes('tidak tersedia') &&
                    !transport.estimatedTravelTimeMinutes.includes('tidak terpetakan') &&
                    !transport.estimatedTravelTimeMinutes.includes('gagal dihitung') &&
                    !transport.estimatedTravelTimeMinutes.includes('tidak dapat dihitung'))
              ? transport.estimatedTravelTimeMinutes
              : null,
            source: transport.routingSource || (isEn ? 'Road-network routing engine' : 'Mesin Perutean Jaringan Jalan'),
            spatialResolution: 'road network driving graph',
            status: (transport.estimatedTravelTimeMinutes &&
                     !transport.estimatedTravelTimeMinutes.includes('di luar radius') &&
                     !transport.estimatedTravelTimeMinutes.includes('tidak dapat dimuat') &&
                     !transport.estimatedTravelTimeMinutes.includes('tidak tersedia') &&
                     !transport.estimatedTravelTimeMinutes.includes('tidak terpetakan') &&
                     !transport.estimatedTravelTimeMinutes.includes('gagal dihitung') &&
                     !transport.estimatedTravelTimeMinutes.includes('tidak dapat dihitung'))
              ? 'available'
              : 'nodata',
            priority: 8,
            type: 'derived',
            dataType: 'derived',
            descriptionId: 'Estimasi waktu tempuh berkendara menuju faskes terdekat melalui pemodelan jaringan jalan OSRM (metrik turunan/kontekstual).',
            descriptionEn: 'Estimated driving duration to nearest healthcare facility calculated via live OSRM road network graph (derived/contextual metric).'
          }
        ];

      default:
        return [];
    }
  }

  /**
   * Phase 8.7: Returns the simplified, user-friendly 4-5 Primary Cards for each hazard category.
   * All detailed metrics, raw layers, and technical provenance remain intact in getMetricsForCategory().
   */
  public static getPrimaryMetrics(
    category: HazardCategory,
    assessment: MultiHazardAssessmentResult,
    isEn: boolean
  ): ReportMetric[] {
    const { flood, quake, heat, transport } = assessment;

    switch (category) {
      case 'flood': {
        // Section 3: Bentuk Lahan (Cekungan Lokal, Relatif Datar, Miring, Punggung Lahan)
        let terrainValueId = 'Relatif Datar';
        let terrainValueEn = 'Relatively Flat';
        if (flood.localReliefMeters !== null && flood.localReliefMeters !== undefined && flood.localReliefMeters <= -0.5) {
          terrainValueId = 'Cekungan Lokal';
          terrainValueEn = 'Local Depression';
        } else if (flood.slopeDegrees !== null && flood.slopeDegrees !== undefined && flood.slopeDegrees > 5) {
          terrainValueId = 'Miring';
          terrainValueEn = 'Sloping';
        } else if (flood.localReliefMeters !== null && flood.localReliefMeters !== undefined && flood.localReliefMeters >= 1.5) {
          terrainValueId = 'Punggung Lahan';
          terrainValueEn = 'Ridge / Crest';
        } else if (flood.flowAccumulationPotential && (flood.flowAccumulationPotential.toLowerCase().includes('cekungan') || flood.flowAccumulationPotential.toLowerCase().includes('konvergensi'))) {
          terrainValueId = 'Cekungan Lokal';
          terrainValueEn = 'Local Depression';
        }

        // Section 2: Penilaian Banjir vs Bahaya Banjir Wilayah
        const isOfficialFlood = Boolean(flood.floodClass);
        const floodCardLabelId = isOfficialFlood ? 'Bahaya Banjir Wilayah' : 'Penilaian Banjir';
        const floodCardLabelEn = isOfficialFlood ? 'Regional Flood Hazard' : 'Flood Assessment';
        const floodCardSource = isOfficialFlood
          ? (flood.floodClassSource === 'BNPB' ? 'BNPB InaRISK' : 'World Bank ThinkHazard')
          : 'Model Penapisan GoTangguh';
        const floodCardValue = isOfficialFlood
          ? flood.floodClass
          : (flood.score !== null ? `${flood.score}/100` : null);

        const elevVal = flood.elevationMeters !== null && flood.elevationMeters !== undefined ? `${flood.elevationMeters}` : null;
        const rainVal = flood.max24hRainfallMm !== null && flood.max24hRainfallMm !== undefined ? `${Math.round(flood.max24hRainfallMm)}` : null;

        const waterwayDistNum = flood.distanceToRiverMeters;
        const waterwayVal = waterwayDistNum !== null && waterwayDistNum !== undefined && waterwayDistNum >= 0
          ? `±${Math.round(waterwayDistNum)}`
          : (flood.waterwayBounded && (flood.waterwayBounded.state === 'AVAILABLE_BOUNDED' || flood.waterwayBounded.state === 'NODATA_SEARCH_SUCCESS')
              ? (flood.waterwayBounded.displayValue || '>5 km')
              : null);

        const waterwaySource = flood.nearestRiverName
          ? `OpenStreetMap · ${flood.nearestRiverName}`
          : 'OpenStreetMap';

        return [
          {
            id: 'flood_assessment_summary',
            labelId: floodCardLabelId,
            labelEn: floodCardLabelEn,
            value: floodCardValue,
            source: floodCardSource,
            status: floodCardValue ? 'available' : 'nodata',
            priority: 1,
            type: isOfficialFlood ? 'source' : 'model',
            dataType: isOfficialFlood ? 'source' : 'model',
            descriptionId: isOfficialFlood
              ? `Klasifikasi tingkat bahaya banjir resmi dari ${floodCardSource}.`
              : 'Skor penapisan risiko banjir internal GoTangguh (skala 0–100).',
            descriptionEn: isOfficialFlood
              ? `Official regional flood hazard classification from ${floodCardSource}.`
              : 'Internal GoTangguh flood screening risk score (scale 0–100).'
          },
          {
            id: 'flood_elevation',
            labelId: 'Ketinggian Lokasi',
            labelEn: 'Location Elevation',
            value: elevVal,
            unit: isEn ? 'm MSL' : 'mdpl',
            source: 'Copernicus DEM · ~90 m',
            spatialResolution: '~90m',
            status: elevVal !== null ? 'available' : 'nodata',
            priority: 2,
            type: 'source',
            dataType: 'source',
            descriptionId: 'Ketinggian permukaan tanah terhadap permukaan air laut (Copernicus DEM 90m).',
            descriptionEn: 'Ground surface elevation above mean sea level (Copernicus DEM 90m).'
          },
          {
            id: 'flood_max_rainfall',
            labelId: 'Hujan Terberat',
            labelEn: 'Peak Rainfall',
            value: rainVal,
            unit: isEn ? 'mm/day' : 'mm/hari',
            source: 'Open-Meteo · ERA5 Reanalisis',
            spatialResolution: '~25km',
            status: rainVal !== null ? 'available' : 'nodata',
            priority: 3,
            type: 'source',
            dataType: 'source',
            descriptionId: 'Curah hujan harian tertinggi yang tercatat dalam 5 tahun terakhir.',
            descriptionEn: 'Highest daily precipitation recorded over the past 5 years.'
          },
          {
            id: 'flood_waterway_distance',
            labelId: 'Jarak ke Sungai / Saluran',
            labelEn: 'Distance to River / Waterway',
            value: waterwayVal,
            unit: waterwayDistNum !== null && waterwayDistNum !== undefined && waterwayDistNum >= 0 ? (isEn ? 'm' : 'meter') : undefined,
            source: waterwaySource,
            sourceTitle: flood.nearestRiverName,
            spatialResolution: 'vector',
            status: (waterwayDistNum !== null && waterwayDistNum !== undefined && waterwayDistNum >= 0) ||
                    Boolean(flood.waterwayBounded && (flood.waterwayBounded.state === 'AVAILABLE_BOUNDED' || flood.waterwayBounded.state === 'NODATA_SEARCH_SUCCESS'))
              ? 'available'
              : 'nodata',
            priority: 4,
            type: 'source',
            dataType: 'source',
            descriptionId: flood.nearestRiverName ? `Badan air: ${flood.nearestRiverName}` : 'Jarak ke sungai atau saluran air terdekat dari OpenStreetMap.',
            descriptionEn: flood.nearestRiverName ? `Waterway: ${flood.nearestRiverName}` : 'Distance to nearest river or drainage channel from OpenStreetMap.'
          },
          {
            id: 'flood_terrain_condition',
            labelId: 'Bentuk Lahan',
            labelEn: 'Landform',
            value: isEn ? terrainValueEn : terrainValueId,
            source: 'Copernicus DEM · ~90 m',
            spatialResolution: '~90m stencil',
            status: 'available',
            priority: 5,
            type: 'derived',
            dataType: 'derived',
            descriptionId: 'Karakteristik bentuk lahan (Cekungan Lokal, Relatif Datar, Miring, atau Punggung Lahan) diturunkan dari model elevasi DEM.',
            descriptionEn: 'Landform characteristic (Local Depression, Relatively Flat, Sloping, or Ridge) derived from DEM elevation model.'
          }
        ];
      }

      case 'earthquake': {
        const isOfficialQuake = Boolean(quake.quakeClass);
        const quakeCardLabelId = isOfficialQuake ? 'Tingkat Bahaya Gempa' : 'Penilaian Gempa';
        const quakeCardLabelEn = isOfficialQuake ? 'Regional Seismic Hazard' : 'Earthquake Assessment';
        const quakeCardSource = isOfficialQuake
          ? (quake.quakeClassSource === 'BNPB' ? 'BNPB InaRISK' : 'World Bank ThinkHazard')
          : 'Model Penapisan GoTangguh';
        const quakeCardValue = isOfficialQuake
          ? quake.quakeClass
          : (quake.score !== null ? `${quake.score}/100` : null);

        // Section 6: PGA — Strictly numerical value in g without fixed MMI
        const rawPga = quake.estimatedPgaG ?? quake.pgaBmkg ?? quake.pgaInaRisk;
        const pgaValue = rawPga !== null && rawPga !== undefined
          ? `${rawPga.toFixed(3)} g`
          : null;

        const pgaSource = quake.pgaSourceLayer
          || (quake.pgaInaRisk ? 'BNPB InaRISK' : (quake.pgaBmkg ? 'BMKG' : 'Model Seismik Regional'));

        const quakes150kmVal = (quake.historicalQuakesCount150km ?? quake.quakesCount150km);
        const quakesCountDisplay = quakes150kmVal !== null && quakes150kmVal !== undefined
          ? `${quakes150kmVal}`
          : null;

        const maxMagVal = quake.maxHistoricalMag !== null && quake.maxHistoricalMag !== undefined
          ? `M ${quake.maxHistoricalMag.toFixed(1)}`
          : null;

        // Liquefaction: strictly official BNPB InaRISK risk or null (renders "Data belum tersedia")
        const liquefactionVal = quake.liquefactionRisk || null;
        const liquefactionSource = quake.liquefactionRisk
          ? 'BNPB InaRISK'
          : 'Perlu Penyelidikan Geoteknik';

        return [
          {
            id: 'seismic_hazard_tier',
            labelId: quakeCardLabelId,
            labelEn: quakeCardLabelEn,
            value: quakeCardValue,
            source: quakeCardSource,
            status: quakeCardValue ? 'available' : 'nodata',
            priority: 1,
            type: isOfficialQuake ? 'source' : 'model',
            dataType: isOfficialQuake ? 'source' : 'model',
            descriptionId: isOfficialQuake
              ? `Klasifikasi tingkat bahaya gempa regional resmi dari ${quakeCardSource}.`
              : 'Skor penapisan risiko gempa internal GoTangguh (skala 0–100).',
            descriptionEn: isOfficialQuake
              ? `Official regional seismic hazard classification from ${quakeCardSource}.`
              : 'Internal GoTangguh earthquake screening risk score (scale 0–100).'
          },
          {
            id: 'seismic_pga',
            labelId: 'Perkiraan Guncangan',
            labelEn: 'Estimated Ground Shaking',
            value: pgaValue,
            source: pgaSource,
            status: pgaValue ? 'available' : 'nodata',
            priority: 2,
            type: pgaValue ? 'model' : 'assessment_status',
            dataType: pgaValue ? 'model' : 'status',
            descriptionId: 'Perkiraan percepatan tanah puncak (PGA) periode ulang 100 tahun.',
            descriptionEn: 'Model peak ground acceleration (PGA) under 100-year return period.'
          },
          {
            id: 'seismic_historical_quakes_150km',
            labelId: 'Riwayat Gempa di Sekitar',
            labelEn: 'Nearby Historical Earthquakes',
            value: quakesCountDisplay,
            unit: isEn ? 'events (10 yrs)' : 'kejadian (10 thn)',
            source: 'USGS / BMKG · Radius 150 km',
            status: quakesCountDisplay !== null ? 'available' : 'nodata',
            priority: 3,
            type: 'source',
            dataType: 'source',
            descriptionId: 'Jumlah gempa bumi yang tercatat dalam radius 150 km selama 10 tahun terakhir.',
            descriptionEn: 'Number of recorded earthquakes within 150 km over the past 10 years.'
          },
          {
            id: 'seismic_max_mag',
            labelId: 'Gempa Terkuat',
            labelEn: 'Strongest Recorded Earthquake',
            value: maxMagVal,
            source: 'USGS Earthquake Catalog',
            status: maxMagVal !== null ? 'available' : 'nodata',
            priority: 4,
            type: 'source',
            dataType: 'source',
            descriptionId: 'Magnitudo gempa bumi terbesar yang pernah tercatat di sekitar tapak dalam 10 tahun.',
            descriptionEn: 'Peak earthquake magnitude recorded in the vicinity over the past 10 years.'
          },
          {
            id: 'seismic_liquefaction_status',
            labelId: 'Potensi Likuefaksi',
            labelEn: 'Liquefaction Potential',
            value: liquefactionVal,
            source: liquefactionSource,
            status: liquefactionVal ? 'available' : 'nodata',
            priority: 5,
            type: liquefactionVal ? 'model' : 'assessment_status',
            dataType: liquefactionVal ? 'model' : 'status',
            descriptionId: 'Indikasi kerentanan likuefaksi tanah resmi. Klasifikasi tanah definitif memerlukan uji penetrasi SPT/CPT.',
            descriptionEn: 'Official soil liquefaction susceptibility indication. Definitive site class requires geotechnical testing.'
          }
        ];
      }

      case 'heat': {
        // Section 9: Fix air quality null handling bug! Strictly null if no data.
        let airQualityValue: string | null = null;
        const aq = assessment.airQuality;
        const aqAny = aq as any;
        const pmVal = aq?.currentPm25 ?? aq?.maxPm25_24h ?? aqAny?.pm2_5Ugm3;
        const europeanAqi = aq?.currentEuropeanAqi;
        const usAqi = aq?.currentUsAqi;

        if (europeanAqi !== null && europeanAqi !== undefined) {
          const interp = europeanAqi <= 20 ? (isEn ? 'Good' : 'Baik') : europeanAqi <= 40 ? (isEn ? 'Fair' : 'Cukup') : europeanAqi <= 60 ? (isEn ? 'Moderate' : 'Sedang') : (isEn ? 'Poor' : 'Buruk');
          airQualityValue = `${interp} (AQI Eropa: ${europeanAqi})`;
        } else if (usAqi !== null && usAqi !== undefined) {
          const interp = usAqi <= 50 ? (isEn ? 'Good' : 'Baik') : usAqi <= 100 ? (isEn ? 'Moderate' : 'Sedang') : (isEn ? 'Unhealthy' : 'Tidak Sehat');
          airQualityValue = `${interp} (AQI US: ${usAqi})`;
        } else if (pmVal !== null && pmVal !== undefined) {
          const interpId = pmVal <= 15 ? 'Baik' : pmVal <= 35 ? 'Sedang' : 'Tidak Sehat';
          const interpEn = pmVal <= 15 ? 'Good' : pmVal <= 35 ? 'Moderate' : 'Unhealthy';
          airQualityValue = isEn ? `PM2.5 = ${pmVal} µg/m³ (${interpEn})` : `PM2.5 = ${pmVal} µg/m³ (${interpId})`;
        } else if (aqAny?.airQualityLevel) {
          airQualityValue = aqAny.airQualityLevel;
        }

        // Section 8: Paparan Panas Lokasi (NEVER 'Beban Panas Bangunan')
        const heatExposureValue = heat.heatModelLevel && heat.heatModelLevel !== 'Data Tidak Tersedia'
          ? heat.heatModelLevel
          : (heat.score !== null ? `${heat.score}/100` : null);

        const forecastTempNum = (heat.forecastPeakTempC ?? heat.avgMaxTempC);
        const forecastVal = forecastTempNum !== null && forecastTempNum !== undefined ? `${forecastTempNum}` : null;
        const histPeakNum = heat.historicalPeakTempC;
        const histPeakVal = histPeakNum !== null && histPeakNum !== undefined ? `${histPeakNum}` : null;
        const cmip6Num = heat.projectedTempRise2050C;
        const cmip6Val = cmip6Num !== null && cmip6Num !== undefined ? `+${cmip6Num}` : null;

        return [
          {
            id: 'heat_location_exposure',
            labelId: 'Paparan Panas Lokasi',
            labelEn: 'Location Heat Exposure',
            value: heatExposureValue,
            source: 'Model Penapisan GoTangguh',
            status: heatExposureValue ? 'available' : 'nodata',
            priority: 1,
            type: 'model',
            dataType: 'model',
            descriptionId: 'Tingkat paparan beban termal lingkungan pada tapak lokasi.',
            descriptionEn: 'Ambient thermal stress and heat exposure screening level for the site.'
          },
          {
            id: 'heat_forecast_temp',
            labelId: 'Suhu Prakiraan',
            labelEn: 'Forecast Temperature',
            value: forecastVal,
            unit: '°C',
            source: 'Open-Meteo · Prakiraan 7 hari',
            status: forecastVal !== null ? 'available' : 'nodata',
            priority: 2,
            type: 'source',
            dataType: 'source',
            descriptionId: 'Prakiraan suhu maksimum udara harian untuk periode mendatang.',
            descriptionEn: 'Forecast maximum daily ambient air temperature.'
          },
          {
            id: 'heat_historical_peak',
            labelId: 'Suhu Tertinggi',
            labelEn: 'Historical Peak Temperature',
            value: histPeakVal,
            unit: '°C',
            source: 'ECMWF ERA5 · Reanalisis',
            status: histPeakVal !== null ? 'available' : 'nodata',
            priority: 3,
            type: 'source',
            dataType: 'source',
            descriptionId: 'Suhu tertinggi yang pernah tercatat di area ini dalam reanalisis historis.',
            descriptionEn: 'Peak ambient temperature recorded in this area in historical reanalysis.'
          },
          {
            id: 'heat_cmip6_increase',
            labelId: 'Perubahan Suhu ke Depan',
            labelEn: 'Future Temperature Change',
            value: cmip6Val,
            unit: '°C',
            source: heat.climateProjectionModel || 'NASA NEX-GDDP-CMIP6',
            status: cmip6Val !== null ? 'available' : 'nodata',
            priority: 4,
            type: 'model',
            dataType: 'model',
            descriptionId: 'Estimasi kenaikan suhu jangka panjang tahun 2050 berdasarkan model iklim global CMIP6.',
            descriptionEn: 'Projected long-term warming increase by 2050 under CMIP6 global climate model.'
          },
          {
            id: 'heat_air_quality',
            labelId: 'Kualitas Udara',
            labelEn: 'Air Quality',
            value: airQualityValue,
            source: 'Copernicus CAMS / Open-Meteo',
            status: airQualityValue !== null ? 'available' : 'nodata',
            priority: 5,
            type: 'source',
            dataType: 'source',
            descriptionId: 'Status kualitas udara ambien berdasarkan konsentrasi partikulat PM2.5.',
            descriptionEn: 'Ambient air quality status based on PM2.5 particulate concentration.'
          }
        ];
      }

      case 'transport': {
        // Section 16: Healthcare semantics - hospital vs clinic
        const hospName = (transport.nearestHospitalName || '').toLowerCase();
        const isClinic = hospName.includes('klinik') || hospName.includes('clinic') || hospName.includes('puskesmas');
        const isHospital = hospName.includes('rs') || hospName.includes('rumah sakit') || hospName.includes('hospital');

        const healthcareLabelId = isHospital
          ? 'Rumah Sakit Terdekat'
          : isClinic
          ? 'Fasilitas Kesehatan Terdekat'
          : 'Fasilitas Kesehatan Terdekat';
        const healthcareLabelEn = isHospital
          ? 'Nearest Hospital'
          : isClinic
          ? 'Nearest Healthcare Facility'
          : 'Nearest Healthcare Facility';

        // Assembly point semantics: official vs OSM candidate
        const isOfficialAssembly = Boolean((transport as any)?.isOfficialAssembly);
        const assemblyLabelId = isOfficialAssembly
          ? 'Titik Evakuasi Resmi'
          : 'Titik Kumpul Terdekat (OSM)';
        const assemblyLabelEn = isOfficialAssembly
          ? 'Official Evacuation Point'
          : 'Nearest Assembly Point (OSM)';

        const roadDist = transport.distanceToNearestRoadMeters ?? transport.distanceToRoadMeters;
        const arterialDist = transport.distanceToArterialMeters ?? transport.distanceToMajorRoadMeters;
        const hospDist = transport.distanceToHospitalMeters;
        const transitDist = transport.distanceToTransitHubMeters ?? transport.distanceToTransitMeters;
        const assemblyDist = transport.distanceToAssemblyPointMeters;

        return [
          {
            id: 'transport_road_proximity',
            labelId: 'Jalan Terdekat',
            labelEn: 'Nearest Road',
            value: roadDist !== null && roadDist !== undefined
              ? `±${Math.round(roadDist)}`
              : (transport.roadBounded?.displayValue || (isEn ? 'Data unavailable' : 'Data belum tersedia')),
            unit: roadDist !== null && roadDist !== undefined ? (isEn ? 'm' : 'meter') : undefined,
            source: transport.nearestRoadName ? `OpenStreetMap · ${transport.nearestRoadName}` : 'OpenStreetMap',
            sourceTitle: transport.nearestRoadName,
            status: roadDist !== null || Boolean(transport.roadBounded) ? 'available' : 'nodata',
            priority: 1,
            type: 'source',
            dataType: 'source',
            descriptionId: transport.nearestRoadName ? `Akses: ${transport.nearestRoadName}` : 'Jarak langsung ke jaringan jalan akses terdekat dari OpenStreetMap.',
            descriptionEn: transport.nearestRoadName ? `Access: ${transport.nearestRoadName}` : 'Direct distance to nearest road access from OpenStreetMap.'
          },
          {
            id: 'transport_major_road_distance',
            labelId: 'Jalan Utama Terdekat',
            labelEn: 'Nearest Major Road',
            value: arterialDist !== null && arterialDist !== undefined
              ? `±${Math.round(arterialDist)}`
              : (transport.arterialBounded?.displayValue || (isEn ? 'Data unavailable' : 'Data belum tersedia')),
            unit: arterialDist !== null && arterialDist !== undefined ? (isEn ? 'm' : 'meter') : undefined,
            source: transport.nearestArterialName ? `OpenStreetMap · ${transport.nearestArterialName}` : 'OpenStreetMap',
            sourceTitle: transport.nearestArterialName,
            status: arterialDist !== null || Boolean(transport.arterialBounded) ? 'available' : 'nodata',
            priority: 2,
            type: 'source',
            dataType: 'source',
            descriptionId: transport.nearestArterialName ? `Jalan utama: ${transport.nearestArterialName}` : 'Jarak ke koridor jalan utama terdekat.',
            descriptionEn: transport.nearestArterialName ? `Major road: ${transport.nearestArterialName}` : 'Distance to nearest major road corridor.'
          },
          {
            id: 'transport_hospital_distance',
            labelId: healthcareLabelId,
            labelEn: healthcareLabelEn,
            value: hospDist !== null && hospDist !== undefined
              ? `±${Math.round(hospDist)}`
              : (transport.hospitalBounded?.displayValue || (isEn ? 'Data unavailable' : 'Data belum tersedia')),
            unit: hospDist !== null && hospDist !== undefined ? (isEn ? 'm' : 'meter') : undefined,
            source: transport.nearestHospitalName ? `OpenStreetMap · ${transport.nearestHospitalName}` : 'OpenStreetMap',
            sourceTitle: transport.nearestHospitalName,
            status: hospDist !== null || Boolean(transport.hospitalBounded) ? 'available' : 'nodata',
            priority: 3,
            type: 'source',
            dataType: 'source',
            descriptionId: transport.nearestHospitalName ? `Faskes: ${transport.nearestHospitalName}` : 'Jarak ke fasilitas medis atau layanan kesehatan terdekat.',
            descriptionEn: transport.nearestHospitalName ? `Healthcare: ${transport.nearestHospitalName}` : 'Distance to nearest medical or healthcare facility.'
          },
          {
            id: 'transport_transit_distance',
            labelId: 'Transportasi Umum',
            labelEn: 'Public Transit',
            value: transitDist !== null && transitDist !== undefined
              ? `±${Math.round(transitDist)}`
              : (transport.transitBounded?.displayValue || (isEn ? 'Data unavailable' : 'Data belum tersedia')),
            unit: transitDist !== null && transitDist !== undefined ? (isEn ? 'm' : 'meter') : undefined,
            source: transport.nearestTransitName ? `OpenStreetMap · ${transport.nearestTransitName}` : 'OpenStreetMap',
            sourceTitle: transport.nearestTransitName,
            status: transitDist !== null || Boolean(transport.transitBounded) ? 'available' : 'nodata',
            priority: 4,
            type: 'source',
            dataType: 'source',
            descriptionId: transport.nearestTransitName ? `Transit: ${transport.nearestTransitName}` : 'Jarak ke halte bus, stasiun kereta, atau simpul transportasi umum terdekat.',
            descriptionEn: transport.nearestTransitName ? `Transit: ${transport.nearestTransitName}` : 'Distance to nearest bus stop, train station, or transit node.'
          },
          {
            id: 'transport_assembly_point_distance',
            labelId: assemblyLabelId,
            labelEn: assemblyLabelEn,
            value: assemblyDist !== null && assemblyDist !== undefined
              ? `±${Math.round(assemblyDist)}`
              : (transport.assemblyPointBounded && (transport.assemblyPointBounded.state === 'AVAILABLE_BOUNDED' || transport.assemblyPointBounded.state === 'NODATA_SEARCH_SUCCESS')
                  ? (transport.assemblyPointBounded.displayValue || '>5 km')
                  : null),
            unit: assemblyDist !== null && assemblyDist !== undefined ? (isEn ? 'm' : 'meter') : undefined,
            source: transport.nearestAssemblyPointName ? `OpenStreetMap · ${transport.nearestAssemblyPointName}` : 'OpenStreetMap',
            sourceTitle: transport.nearestAssemblyPointName,
            status: assemblyDist !== null || Boolean(transport.assemblyPointBounded) ? 'available' : 'nodata',
            priority: 5,
            type: 'source',
            dataType: 'source',
            descriptionId: transport.nearestAssemblyPointName ? `Titik Kumpul: ${transport.nearestAssemblyPointName}` : 'Titik kumpul evakuasi terdekat yang terpetakan dalam basis data OpenStreetMap (Bukan penetapan rute evakuasi resmi pemerintah).',
            descriptionEn: transport.nearestAssemblyPointName ? `Assembly Point: ${transport.nearestAssemblyPointName}` : 'Nearest mapped assembly point in OpenStreetMap database (Not an official regulatory evacuation decree).'
          }
        ];
      }

      default:
        return [];
    }
  }

  /**
   * Helper alias for getMetricsForCategory accepting hazard string ('flood', 'earthquake'/'quake', 'heat', 'transport')
   * and language ('id' | 'en').
   */
  public static getMetricsForHazard(
    hazard: string,
    assessment: MultiHazardAssessmentResult,
    lang: 'id' | 'en' | boolean = 'id'
  ): ReportMetric[] {
    const isEn = typeof lang === 'boolean' ? lang : lang === 'en';
    const category: HazardCategory =
      hazard === 'earthquake' || hazard === 'quake'
        ? 'earthquake'
        : hazard === 'flood'
        ? 'flood'
        : hazard === 'heat'
        ? 'heat'
        : 'transport';
    return this.getMetricsForCategory(category, assessment, isEn);
  }

  /**
   * Phase 8.7: Returns the simplified primary cards for dashboard display (maximum 4-5 items).
   * All detailed indicators remain available in getMetricsForCategory().
   */
  public static getDisplayMetrics(
    category: HazardCategory,
    assessment: MultiHazardAssessmentResult,
    isEn: boolean
  ): ReportMetric[] {
    return this.getPrimaryMetrics(category, assessment, isEn);
  }
}
