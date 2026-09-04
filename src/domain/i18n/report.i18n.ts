/**
 * Centralized Report Translation Dictionary for Master Client Template ("Simple Report - BangunTangguh")
 * Strictly enforces single-language rendering in Indonesian (id) or English (en).
 */

export interface ReportI18nDictionary {
  metadata: {
    language: 'id' | 'en';
    locale: string;
    platformName: string;
    poweredBy: string;
    confidentialNotice: string;
    pageLabel: string;
    ofLabel: string;
    dataAsOf: string;
    referenceNumberLabel: string;
    assessmentDateLabel: string;
    coordinatesLabel: string;
    propertyTypeLabel: string;
    ownerLabel: string;
    unspecifiedOwner: string;
    dataUnavailable: string;
    sampleWatermark: string;
    sampleNoticeTitle: string;
    sampleNoticeSubtitle: string;
  };
  cover: {
    title: string;
    subtitle: string;
    tagline: string;
    reportType: string;
  };
  executiveSummary: {
    sectionNumber: string;
    title: string;
    overallRiskOverviewTitle: string;
    dominantHazardTitle: string;
    generalOverviewTitle: string;
    topRecommendationsTitle: string;
    dominantHazardIntro: string;
    hazardNames: {
      quake: string;
      flood: string;
      heat: string;
    };
    levels: {
      high: string;
      medium: string;
      low: string;
      insufficient_data: string;
    };
    scoreReliabilityLabel: string;
  };
  propertyProfile: {
    sectionNumber: string;
    title: string;
    overlayMapSubtitle: string;
    locationInfoTitle: string;
    cityRegencyLabel: string;
    areaCharacteristicLabel: string;
    buildingInfoTitle: string;
    buildingTypeLabel: string;
    floorCountLabel: string;
    buildingAgeLabel: string;
    surroundingEnvTitle: string;
    waterwayDistanceLabel: string;
    buildingDensityLabel: string;
    accessibilityRoadLabel: string;
    descriptionTitle: string;
    descriptionBody: string;
  };
  methodology: {
    sectionNumber: string;
    title: string;
    howAssessmentConductedTitle: string;
    introBody: string;
    approachTableTitle: string;
    tableHeaders: {
      aspect: string;
      explanation: string;
    };
    aspects: {
      hazardPotential: {
        name: string;
        explanation: string;
      };
      exposure: {
        name: string;
        explanation: string;
      };
      impact: {
        name: string;
        explanation: string;
      };
    };
    layExplanationTitle: string;
    layExplanationBody: string;
  };
  earthquakeSection: {
    sectionNumber: string;
    title: string;
    hazardLevelTitle: string;
    groundShakingTitle: string;
    historicalTimelineTitle: string;
    timelineSubtitle: string;
    strongestQuakeTitle: string;
    frequencyTitle: string;
    frequencyBody: string;
    potentialImpactTitle: string;
    potentialImpactBody: string;
    recommendationsTitle: string;
    primaryPriorityLabel: string;
    suggestedLabel: string;
    conclusionTitle: string;
    technicalDetailsTitle: string;
  };
  floodSection: {
    sectionNumber: string;
    title: string;
    siteElevationTitle: string;
    peakRainfallTitle: string;
    waterProximityTitle: string;
    terrainFormTitle: string;
    floodAssessmentTitle: string;
    historicalEventsTitle: string;
    inundationDepthTitle: string;
    frequencyTitle: string;
    frequencyBody: string;
    potentialImpactTitle: string;
    potentialImpactBody: string;
    recommendationsTitle: string;
    primaryPriorityLabel: string;
    suggestedLabel: string;
    conclusionTitle: string;
    technicalDetailsTitle: string;
  };
  heatSection: {
    sectionNumber: string;
    title: string;
    forecastTempTitle: string;
    historicalPeakTempTitle: string;
    climateProjectionTitle: string;
    airQualityTitle: string;
    heatExposureTitle: string;
    historicalTrendTitle: string;
    frequencyTitle: string;
    frequencyBody: string;
    potentialImpactTitle: string;
    potentialImpactBody: string;
    recommendationsTitle: string;
    primaryPriorityLabel: string;
    suggestedLabel: string;
    conclusionTitle: string;
    technicalDetailsTitle: string;
  };
  accessibilitySection: {
    sectionNumber: string;
    title: string;
    networkMapSubtitle: string;
    facilityDistanceTitle: string;
    tableHeaders: {
      facilityType: string;
      facilityName: string;
      distance: string;
      travelTime: string;
      category: string;
    };
    facilityTypes: {
      nearestRoad: string;
      mainRoad: string;
      healthcare: string;
      publicTransit: string;
      assemblyPoint: string;
    };
    interpretationTitle: string;
    riskNotesTitle: string;
    recommendationsTitle: string;
    fastestRouteLabel: string;
    alternativeRouteLabel: string;
  };
  riskComparison: {
    sectionNumber: string;
    title: string;
    tableTitle: string;
    tableHeaders: {
      hazardType: string;
      riskLevel: string;
      score: string;
      reliability: string;
    };
    insightTitle: string;
    dominantHazardInsightTemplate: (hazardName: string, levelName: string) => string;
  };
  actionPlan: {
    sectionNumber: string;
    title: string;
    subtitle: string;
    priority1Title: string;
    priority2Title: string;
    priority3Title: string;
    notesTitle: string;
    notesBody: string;
  };
  closing: {
    sectionNumber: string;
    title: string;
    conclusionTitle: string;
    disclaimerTitle: string;
    disclaimerBody: string;
    nextStepsTitle: string;
    nextStepsList: string[];
  };
}

export const reportI18nId: ReportI18nDictionary = {
  metadata: {
    language: 'id',
    locale: 'id-ID',
    platformName: 'GoTangguh',
    poweredBy: 'Platform Uji Tuntas Risiko Bencana & Ketahanan Iklim Properti',
    confidentialNotice: 'Dokumen Resmi Hasil Penapisan Mandiri Berbasis Data Terverifikasi',
    pageLabel: 'Halaman',
    ofLabel: 'dari',
    dataAsOf: 'Data per',
    referenceNumberLabel: 'Nomor Referensi',
    assessmentDateLabel: 'Tanggal Analisis',
    coordinatesLabel: 'Koordinat Tapak',
    propertyTypeLabel: 'Jenis Properti',
    ownerLabel: 'Pemilik / Pengguna',
    unspecifiedOwner: 'Pengguna Terdaftar / Klien',
    dataUnavailable: 'Data belum tersedia',
    sampleWatermark: '',
    sampleNoticeTitle: 'DOKUMEN SAMPEL PENILAIAN',
    sampleNoticeSubtitle: 'Laporan ini disusun menggunakan parameter simulasi terkalibrasi untuk keperluan peninjauan tata letak.'
  },
  cover: {
    title: 'Laporan Risiko Properti',
    subtitle: 'Property Multi-Hazard Risk & Climate Resilience Screening Dossier',
    tagline: 'Kenali Risiko Properti Anda, Siapkan Solusinya',
    reportType: 'Uji Tuntas Risiko Bencana Multi-Ancaman'
  },
  executiveSummary: {
    sectionNumber: '02',
    title: 'Ringkasan Eksekutif',
    overallRiskOverviewTitle: 'Indeks Risiko Terpadu',
    dominantHazardTitle: 'Risiko Utama di Lokasi',
    generalOverviewTitle: 'Gambaran Umum Kondisi Tapak',
    topRecommendationsTitle: 'Rekomendasi Utama',
    dominantHazardIntro: 'Berdasarkan penapisan terverifikasi, risiko paling dominan di lokasi ini adalah',
    hazardNames: {
      quake: 'Gempa & Sesar Aktif',
      flood: 'Banjir & Genangan',
      heat: 'Kondisi Panas'
    },
    levels: {
      high: 'Risiko Tinggi',
      medium: 'Risiko Sedang',
      low: 'Risiko Rendah',
      insufficient_data: 'Belum dapat dinilai'
    },
    scoreReliabilityLabel: 'Kelengkapan Bukti'
  },
  propertyProfile: {
    sectionNumber: '03',
    title: 'Profil Properti',
    overlayMapSubtitle: 'Peta Overlay Konteks Lingkungan Tapak',
    locationInfoTitle: 'Informasi Lokasi',
    cityRegencyLabel: 'Kota / Kabupaten',
    areaCharacteristicLabel: 'Karakteristik Area',
    buildingInfoTitle: 'Informasi Bangunan',
    buildingTypeLabel: 'Jenis Properti / Bangunan',
    floorCountLabel: 'Jumlah Lantai',
    buildingAgeLabel: 'Perkiraan Usia Bangunan',
    surroundingEnvTitle: 'Kondisi Lingkungan Sekitar',
    waterwayDistanceLabel: 'Jarak ke Sungai / Saluran',
    buildingDensityLabel: 'Kepadatan Bangunan',
    accessibilityRoadLabel: 'Jalan Akses',
    descriptionTitle: 'Deskripsi Karakteristik Lingkungan',
    descriptionBody: 'Kondisi lokasi dan lingkungan sekitar sangat mempengaruhi tingkat risiko yang mungkin terjadi. Karakteristik elevasi tapak, kedekatan badan air, kepadatan lingkungan, serta keterhubungan jaringan jalan membentuk fondasi ketahanan properti.'
  },
  methodology: {
    sectionNumber: '04',
    title: 'Dasar Penilaian',
    howAssessmentConductedTitle: 'Cara Penilaian Dilakukan',
    introBody: 'Skor merupakan indikator penapisan awal berbasis data spasial publik. Tidak menggantikan audit kelayakan teknis profesional. Analisis mempertimbangkan riwayat kejadian bencana 10 tahun terakhir, keterpaparan tapak terhadap jalur bahaya fisik, dan potensi beban risiko pada integritas struktural properti.',
    approachTableTitle: 'Pendekatan yang Digunakan',
    tableHeaders: {
      aspect: 'Aspek',
      explanation: 'Penjelasan'
    },
    aspects: {
      hazardPotential: {
        name: 'Potensi Bahaya',
        explanation: 'Kemungkinan terjadinya peristiwa alam berdasarkan data historis dan wilayah.'
      },
      exposure: {
        name: 'Paparan',
        explanation: 'Seberapa dekat properti dengan sumber risiko (jarak sesar aktif, sungai/saluran, area panas).'
      },
      impact: {
        name: 'Dampak',
        explanation: 'Tingkat gangguan fisik dan operasional yang dapat dialami properti saat bencana terjadi.'
      }
    },
    layExplanationTitle: 'Penjelasan Sederhana',
    layExplanationBody: 'Kami menilai seberapa besar potensi bahaya di wilayah Anda, seberapa dekat lokasinya ke properti, dan apa dampaknya bagi bangunan.'
  },
  earthquakeSection: {
    sectionNumber: '05',
    title: 'Risiko Gempa Bumi',
    hazardLevelTitle: 'Bahaya Gempa Wilayah',
    groundShakingTitle: 'Perkiraan Kekuatan Guncangan',
    historicalTimelineTitle: 'Riwayat Gempa di Sekitar',
    timelineSubtitle: 'Aktivitas Seismik Radius 150 km dalam 10 Tahun Terakhir',
    strongestQuakeTitle: 'Gempa Terkuat',
    frequencyTitle: 'Frekuensi Kejadian',
    frequencyBody: 'Gempa kecil hingga sedang terjadi secara berkala di kawasan tektonik regional. Gempa signifikan berkekuatan sedang-tinggi berpeluang terjadi dalam rentang beberapa tahun sekali.',
    potentialImpactTitle: 'Dampak yang Perlu Diperhatikan',
    potentialImpactBody: 'Dampak dapat berupa retakan non-struktural pada plesteran dinding bata, pergeseran genteng atau plafon, serta risiko perabotan tinggi terguling jika tidak terikat.',
    recommendationsTitle: 'Yang Sebaiknya Dilakukan',
    primaryPriorityLabel: 'Prioritas Utama',
    suggestedLabel: 'Disarankan',
    conclusionTitle: 'Kesimpulan Gempa',
    technicalDetailsTitle: 'Audit Parameter Teknis Gempa'
  },
  floodSection: {
    sectionNumber: '06',
    title: 'Risiko Banjir',
    siteElevationTitle: 'Ketinggian Lokasi',
    peakRainfallTitle: 'Hujan Terberat',
    waterProximityTitle: 'Jarak ke Sungai / Saluran',
    terrainFormTitle: 'Bentuk Lahan',
    floodAssessmentTitle: 'Bahaya Banjir Wilayah',
    historicalEventsTitle: 'Riwayat Genangan Sekitar',
    inundationDepthTitle: 'Kedalaman Genangan Tapak',
    frequencyTitle: 'Frekuensi Kejadian',
    frequencyBody: 'Potensi banjir umumnya terkonsentrasi pada puncak musim hujan dengan intensitas presipitasi tinggi atau limpasan kiriman hulu.',
    potentialImpactTitle: 'Dampak yang Perlu Diperhatikan',
    potentialImpactBody: 'Genangan air berpotensi merendam area halaman, mengganggu lantai dasar, merusak perabotan bawah, serta melumpuhkan jalur akses kendaraan keluar-masuk properti.',
    recommendationsTitle: 'Yang Sebaiknya Dilakukan',
    primaryPriorityLabel: 'Prioritas Utama',
    suggestedLabel: 'Disarankan',
    conclusionTitle: 'Kesimpulan Risiko Banjir',
    technicalDetailsTitle: 'Audit Parameter Hidrologi & Topografi'
  },
  heatSection: {
    sectionNumber: '07',
    title: 'Kondisi Panas',
    forecastTempTitle: 'Suhu Prakiraan Maksimum',
    historicalPeakTempTitle: 'Suhu Tertinggi',
    climateProjectionTitle: 'Perubahan Suhu ke Depan',
    airQualityTitle: 'Kualitas Udara',
    heatExposureTitle: 'Kondisi Panas',
    historicalTrendTitle: 'Tren Suhu',
    frequencyTitle: 'Frekuensi Paparan',
    frequencyBody: 'Suhu panas lingkungan mencapai puncaknya pada musim kemarau dan periode kemarau berkepanjangan dengan kelembapan tinggi.',
    potentialImpactTitle: 'Dampak yang Perlu Diperhatikan',
    potentialImpactBody: 'Peningkatan suhu permukaan dalam ruangan, kenaikan konsumsi daya pendingin udara (AC), serta penurunan kenyamanan bagi penghuni.',
    recommendationsTitle: 'Yang Sebaiknya Dilakukan',
    primaryPriorityLabel: 'Prioritas Utama',
    suggestedLabel: 'Disarankan',
    conclusionTitle: 'Kesimpulan Kondisi Panas',
    technicalDetailsTitle: 'Audit Parameter Mikroklimat & Tutupan Lahan'
  },
  accessibilitySection: {
    sectionNumber: '08',
    title: 'Transportasi & Akses',
    networkMapSubtitle: 'Analisis Jaringan Jalan & Jarak Evakuasi Darurat',
    facilityDistanceTitle: 'Jarak ke Fasilitas Kunci',
    tableHeaders: {
      facilityType: 'Jenis Fasilitas',
      facilityName: 'Nama / Identifikasi',
      shelterDistance: 'Jarak ke Titik Kumpul Evakuasi',
      travelTime: 'Estimasi Jarak Tempuh',
      corridorClearance: 'Lebar Koridor / Akses'
    },
    facilityTypes: {
      nearestRoad: 'Jalan Terdekat',
      mainRoad: 'Jalan Utama',
      healthcare: 'Rumah Sakit Terdekat',
      publicTransit: 'Transportasi Umum',
      assemblyPoint: 'Titik Kumpul'
    },
    interpretationTitle: 'Interpretasi Aksesibilitas',
    riskNotesTitle: 'Catatan Akses Saat Keadaan Darurat',
    recommendationsTitle: 'Rekomendasi Rute Evakuasi',
    fastestRouteLabel: 'Rute Tercepat',
    alternativeRouteLabel: 'Jalur Alternatif'
  },
  riskComparison: {
    sectionNumber: '09',
    title: 'Perbandingan Risiko',
    tableTitle: 'Ringkasan Matriks Multi-Bahaya Fisik',
    tableHeaders: {
      hazardType: 'Jenis Risiko',
      riskLevel: 'Tingkat Bahaya',
      score: 'Skor Penapisan',
      reliability: 'Keandalan Data'
    },
    insightTitle: 'Insight & Kesimpulan Perbandingan',
    dominantHazardInsightTemplate: (hazardName: string, levelName: string) =>
      `Risiko ${hazardName} dengan kategori ${levelName} menjadi perhatian utama dibandingkan risiko lainnya di tapak properti ini.`
  },
  actionPlan: {
    sectionNumber: '10',
    title: 'Rencana Tindakan',
    subtitle: 'Strategi Mitigasi Terarah dan Tindakan Adaptasi Properti',
    priority1Title: 'Prioritas 1 (Segera)',
    priority2Title: 'Prioritas 2 (Jangka Menengah)',
    priority3Title: 'Prioritas 3 (Peningkatan Berkelanjutan)',
    notesTitle: 'Catatan Pelaksanaan',
    notesBody: 'Tidak semua tindakan perlu dilakukan sekaligus—prioritaskan berdasarkan tingkat risiko yang paling dominan serta kesiapan anggaran pemeliharaan properti Anda.'
  },
  closing: {
    sectionNumber: '11',
    title: 'Penutup',
    conclusionTitle: 'Kesimpulan Penilaian',
    disclaimerTitle: 'Pernyataan Batasan & Disclaimer',
    disclaimerBody: 'Analisis ini merupakan indikator penapisan awal berbasis data spasial publik dan tidak menggantikan uji tuntas teknis, penyelidikan tanah, atau audit struktural profesional.',
    nextStepsTitle: 'Langkah Selanjutnya',
    nextStepsList: [
      'Lakukan inspeksi visual mandiri pada titik-titik kerentanan yang teridentifikasi dalam laporan ini.',
      'Konsultasikan dengan tenaga ahli konstruksi atau geoteknik berlisensi untuk modifikasi struktural berbobot besar.',
      'Periksa polis perlindungan asuransi properti untuk memastikan perluasan jaminan bencana alam (gempa bumi dan banjir).'
    ]
  }
};

export const reportI18nEn: ReportI18nDictionary = {
  metadata: {
    language: 'en',
    locale: 'en-US',
    platformName: 'GoTangguh',
    poweredBy: 'Property Climate & Multi-Hazard Disaster Due Diligence Platform',
    confidentialNotice: 'Official Screening Dossier Synthesized from Verified Public & Geospatial Data',
    pageLabel: 'Page',
    ofLabel: 'of',
    dataAsOf: 'Data as of',
    referenceNumberLabel: 'Reference Number',
    assessmentDateLabel: 'Assessment Date',
    coordinatesLabel: 'Site Coordinates',
    propertyTypeLabel: 'Property Type',
    ownerLabel: 'Property Owner / Client',
    unspecifiedOwner: 'Registered User / Client',
    dataUnavailable: 'Data unavailable',
    sampleWatermark: '',
    sampleNoticeTitle: 'SAMPLE AUDIT DOSSIER',
    sampleNoticeSubtitle: 'This report was generated using calibrated simulation inputs for layout and architecture review.'
  },
  cover: {
    title: 'Property Risk Assessment Report',
    subtitle: 'Property Multi-Hazard Risk & Climate Resilience Screening Dossier',
    tagline: 'Know Your Property Risk, Prepare Your Solution',
    reportType: 'Multi-Hazard Physical Risk & Climate Due Diligence'
  },
  executiveSummary: {
    sectionNumber: '02',
    title: 'Executive Summary',
    overallRiskOverviewTitle: 'Integrated Risk Index',
    dominantHazardTitle: 'Primary Risk at Location',
    generalOverviewTitle: 'General Site Overview',
    topRecommendationsTitle: 'Key Recommendations',
    dominantHazardIntro: 'Based on verified screening models, the primary risk at this location is',
    hazardNames: {
      quake: 'Earthquake & Active Faults',
      flood: 'Flood & Inundation',
      heat: 'Heat Conditions'
    },
    levels: {
      high: 'High Risk',
      medium: 'Moderate Risk',
      low: 'Low Risk',
      insufficient_data: 'Data unavailable'
    },
    scoreReliabilityLabel: 'Evidence Quality'
  },
  propertyProfile: {
    sectionNumber: '03',
    title: 'Property Profile',
    overlayMapSubtitle: 'Site Environmental Context Overlay Map',
    locationInfoTitle: 'Location Information',
    cityRegencyLabel: 'City / Regency',
    areaCharacteristicLabel: 'Area Characteristic',
    buildingInfoTitle: 'Building Information',
    buildingTypeLabel: 'Building / Property Type',
    floorCountLabel: 'Floor Count',
    buildingAgeLabel: 'Estimated Building Age',
    surroundingEnvTitle: 'Surrounding Environment',
    waterwayDistanceLabel: 'Distance to River / Canal',
    buildingDensityLabel: 'Building Density',
    accessibilityRoadLabel: 'Access Road',
    descriptionTitle: 'Environmental Baseline Description',
    descriptionBody: 'Location conditions and surrounding environment significantly determine potential disaster exposure. Site elevation, proximity to water bodies, building density, and road connectivity define the fundamental resilience baseline.'
  },
  methodology: {
    sectionNumber: '04',
    title: 'Basis of Assessment',
    howAssessmentConductedTitle: 'How the Assessment is Conducted',
    introBody: 'Scores represent an initial screening indicator based on public spatial data and do not replace a professional technical due diligence audit. The assessment systematically evaluates: 10-year historical disaster catalogs, event recurrence frequency, property exposure to physical hazard pathways, and potential consequences on building integrity.',
    approachTableTitle: 'Evaluation Framework',
    tableHeaders: {
      aspect: 'Aspect',
      explanation: 'Explanation'
    },
    aspects: {
      hazardPotential: {
        name: 'Hazard Potential',
        explanation: 'Probability and likelihood of hazard events occurring based on regional historical data.'
      },
      exposure: {
        name: 'Exposure',
        explanation: 'How close the property is to hazard sources (active faults, rivers/canals, heat islands).'
      },
      impact: {
        name: 'Impact',
        explanation: 'Degree of physical and operational disruption the property could experience when a disaster occurs.'
      }
    },
    layExplanationTitle: 'Simple Explanation',
    layExplanationBody: 'We evaluate the magnitude of regional hazards, how close they are to your property, and what tangible impacts could occur on the building.'
  },
  earthquakeSection: {
    sectionNumber: '05',
    title: 'Earthquake Risk',
    hazardLevelTitle: 'Regional Earthquake Hazard',
    groundShakingTitle: 'Estimated Shaking Strength',
    historicalTimelineTitle: 'Nearby Earthquake History',
    timelineSubtitle: '150 km Radius Seismic Catalog in the Past 10 Years',
    strongestQuakeTitle: 'Strongest Recorded Earthquake',
    frequencyTitle: 'Recurrence Frequency',
    frequencyBody: 'Minor to moderate tremors occur periodically within the regional tectonic zone. Significant moderate-high events typically occur once every several years.',
    potentialImpactTitle: 'Potential Impacts to Consider',
    potentialImpactBody: 'Impacts may include non-structural wall plaster cracks, displaced roof tiles or ceilings, and tipping hazards for unrestrained tall furniture.',
    recommendationsTitle: 'Recommended Actions',
    primaryPriorityLabel: 'Top Priority',
    suggestedLabel: 'Recommended',
    conclusionTitle: 'Earthquake Summary',
    technicalDetailsTitle: 'Seismic Technical Audit Parameters'
  },
  floodSection: {
    sectionNumber: '06',
    title: 'Flood Risk',
    siteElevationTitle: 'Site Elevation',
    peakRainfallTitle: 'Heaviest Rainfall',
    waterProximityTitle: 'Distance to River / Canal',
    terrainFormTitle: 'Landform',
    floodAssessmentTitle: 'Regional Flood Hazard',
    historicalEventsTitle: 'Nearby Inundation History',
    inundationDepthTitle: 'Estimated Inundation Depth',
    frequencyTitle: 'Recurrence Frequency',
    frequencyBody: 'Flooding potential is highest during peak monsoon months with heavy precipitation or upstream river overflow.',
    potentialImpactTitle: 'Potential Impacts to Consider',
    potentialImpactBody: 'Standing water may inundate yard areas, enter ground floors, damage lower cabinetry, and disrupt vehicle access in and out of the property.',
    recommendationsTitle: 'Recommended Actions',
    primaryPriorityLabel: 'Top Priority',
    suggestedLabel: 'Recommended',
    conclusionTitle: 'Flood Risk Summary',
    technicalDetailsTitle: 'Hydrological & Topographical Technical Audit'
  },
  heatSection: {
    sectionNumber: '07',
    title: 'Heat Conditions',
    forecastTempTitle: 'Forecast Maximum Temperature',
    historicalPeakTempTitle: 'Highest Temperature',
    climateProjectionTitle: 'Future Temperature Projection',
    airQualityTitle: 'Air Quality',
    heatExposureTitle: 'Heat Conditions',
    historicalTrendTitle: 'Temperature Trend',
    frequencyTitle: 'Exposure Frequency',
    frequencyBody: 'Heat conditions peak during the dry season and extended dry periods with high humidity.',
    potentialImpactTitle: 'Potential Impacts to Consider',
    potentialImpactBody: 'Higher indoor temperatures, increased air conditioning electricity costs, and reduced thermal comfort for residents.',
    recommendationsTitle: 'Recommended Actions',
    primaryPriorityLabel: 'Top Priority',
    suggestedLabel: 'Recommended',
    conclusionTitle: 'Heat Summary',
    technicalDetailsTitle: 'Microclimate & Vegetation Technical Audit'
  },
  accessibilitySection: {
    sectionNumber: '08',
    title: 'Transportation & Access',
    networkMapSubtitle: 'Road Network & Emergency Evacuation Distance Analysis',
    facilityDistanceTitle: 'Distance to Key Facilities',
    tableHeaders: {
      facilityType: 'Facility Type',
      facilityName: 'Name / Identifier',
      shelterDistance: 'Distance to Evacuation Point',
      travelTime: 'Estimated Travel Distance',
      corridorClearance: 'Corridor Clearance / Road Width'
    },
    facilityTypes: {
      nearestRoad: 'Nearest Road',
      mainRoad: 'Main Road',
      healthcare: 'Nearest Hospital',
      publicTransit: 'Public Transportation',
      assemblyPoint: 'Evacuation Point'
    },
    interpretationTitle: 'Accessibility Interpretation',
    riskNotesTitle: 'Emergency Access Notes',
    recommendationsTitle: 'Evacuation Route Recommendations',
    fastestRouteLabel: 'Fastest Route',
    alternativeRouteLabel: 'Alternative Route'
  },
  riskComparison: {
    sectionNumber: '09',
    title: 'Risk Comparison',
    tableTitle: 'Multi-Hazard Risk Summary',
    tableHeaders: {
      hazardType: 'Risk Type',
      riskLevel: 'Hazard Level',
      score: 'Screening Score',
      reliability: 'Evidence Quality'
    },
    insightTitle: 'Comparative Insight & Conclusion',
    dominantHazardInsightTemplate: (hazardName: string, levelName: string) =>
      `Risk of ${hazardName} at ${levelName} level is the primary concern compared to other hazards for this property.`
  },
  actionPlan: {
    sectionNumber: '10',
    title: 'Action Plan',
    subtitle: 'Targeted Mitigation Strategies and Property Adaptation Steps',
    priority1Title: 'Priority 1 (Immediate)',
    priority2Title: 'Priority 2 (Medium-Term)',
    priority3Title: 'Priority 3 (Continuous Resilience)',
    notesTitle: 'Implementation Notes',
    notesBody: 'Not all actions need to be done at once—prioritize based on the dominant risk level and your property maintenance budget.'
  },
  closing: {
    sectionNumber: '11',
    title: 'Closing & Next Steps',
    conclusionTitle: 'Assessment Summary',
    disclaimerTitle: 'Scope & Disclaimer',
    disclaimerBody: 'This analysis is an initial screening indicator based on public spatial data and does not replace technical due diligence, soil investigation, or professional structural audit.',
    nextStepsTitle: 'Recommended Next Steps',
    nextStepsList: [
      'Perform a visual walk-through at the vulnerability points identified in this report.',
      'Consult a licensed structural or geotechnical engineer for major structural modifications.',
      'Review your property insurance policy to ensure adequate coverage for natural disasters (earthquake and flood).'
    ]
  }
};

export function getReportI18n(lang: 'id' | 'en' = 'id'): ReportI18nDictionary {
  return lang === 'en' ? reportI18nEn : reportI18nId;
}
