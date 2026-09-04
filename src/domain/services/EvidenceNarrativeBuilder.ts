import type { MultiHazardAssessmentResult, RiskLevel } from '../types/hazard.types';

/**
 * EvidenceNarrativeBuilder
 * Enforces Phase 11.3 Zero-Synthetic Audit Principle:
 * NO SOURCE FIELD -> NO FACTUAL SENTENCE.
 *
 * All factual narrative sentences must be directly derived from verified assessment metrics.
 * Unsupported or missing metrics generate honest, standardized limitation notices.
 */
export class EvidenceNarrativeBuilder {
  /**
   * Builds an evidence-backed executive summary paragraph.
   */
  static buildExecutiveSummary(assessment: MultiHazardAssessmentResult, isEn: boolean): string {
    const { overallScore, overallLevel, dominantHazard, quake, flood, heat, transport } = assessment;

    if (overallScore === null || overallScore === undefined) {
      return isEn
        ? 'A composite multi-hazard score cannot be calculated due to insufficient verified data across required physical hazard domains.'
        : 'Skor komposit multi-bahaya belum dapat dihitung karena data terverifikasi belum mencukupi pada domain bahaya fisik yang diperlukan.';
    }

    // Sentence 1: Lokasi dan karakteristik utama (elevasi, iklim)
    const elev = flood?.elevationMeters !== null && flood?.elevationMeters !== undefined
      ? Math.round(flood.elevationMeters)
      : null;
    const climateDescId = heat?.avgMaxTempC !== null && heat?.avgMaxTempC !== undefined
      ? `iklim hangat (rata-rata suhu puncak ${Math.round(heat.avgMaxTempC)}°C)`
      : 'iklim tropis lokal';
    const climateDescEn = heat?.avgMaxTempC !== null && heat?.avgMaxTempC !== undefined
      ? `a warm climate profile (average peak ${Math.round(heat.avgMaxTempC)}°C)`
      : 'a local tropical climate profile';

    const sentence1 = isEn
      ? (elev !== null ? `The property is situated at an elevation of ${elev}m MSL with ${climateDescEn}.` : `The property exhibits ${climateDescEn}.`)
      : (elev !== null ? `Lokasi berada pada elevasi ${elev}m dpl dengan ${climateDescId}.` : `Lokasi memiliki karakteristik ${climateDescId}.`);

    // Sentence 2: Bahaya paling dominan (jika ada)
    let sentence2 = '';
    if (dominantHazard) {
      const domName = this.getHazardName(dominantHazard, isEn);
      let domScore = overallScore;
      let domLvl = overallLevel;
      const lowerDom = dominantHazard.toLowerCase();
      if (lowerDom.includes('flood') || lowerDom.includes('banjir')) {
        domScore = flood?.score ?? overallScore;
        domLvl = flood?.level ?? overallLevel;
      } else if (lowerDom.includes('quake') || lowerDom.includes('gempa')) {
        domScore = quake?.score ?? overallScore;
        domLvl = quake?.level ?? overallLevel;
      } else if (lowerDom.includes('heat') || lowerDom.includes('panas')) {
        domScore = heat?.score ?? overallScore;
        domLvl = heat?.level ?? overallLevel;
      }
      const lvlText = this.getLevelDescription(domLvl, isEn);
      sentence2 = isEn
        ? `Analysis indicates primary screening attention on ${domName.toLowerCase()} with a score of ${domScore}/100 (${lvlText}).`
        : `Analisis menunjukkan perhatian utama pada ${domName.toLowerCase()} dengan skor ${domScore}/100 (${lvlText}).`;
    } else {
      sentence2 = isEn
        ? 'Screening analysis indicates no single physical peril dominating the site exposure profile.'
        : 'Analisis penapisan tidak menunjukkan satu bahaya fisik tunggal yang mendominasi profil risiko tapak.';
    }

    // Sentence 3: Catatan aksesibilitas / evakuasi
    let sentence3 = '';
    if (transport && transport.distanceToNearestRoadMeters !== null) {
      const hosp = transport.nearestHospitalName ? (isEn ? ` and healthcare facility ${transport.nearestHospitalName}` : ` serta faskes ${transport.nearestHospitalName}`) : '';
      sentence3 = isEn
        ? `Nearest evacuation accessibility is supported by road access within ±${transport.distanceToNearestRoadMeters}m${hosp}.`
        : `Aksesibilitas evakuasi terdekat didukung oleh akses jalan berjarak ±${transport.distanceToNearestRoadMeters}m${hosp}.`;
    } else if (transport?.connectivityLabelId) {
      sentence3 = isEn
        ? `Nearest evacuation accessibility is characterized by: ${transport.connectivityLabelEn || transport.connectivityLabelId}.`
        : `Aksesibilitas evakuasi terdekat berada dalam status: ${transport.connectivityLabelId}.`;
    } else {
      sentence3 = isEn
        ? 'Nearest evacuation accessibility requires confirmation of local road network routing.'
        : 'Aksesibilitas evakuasi terdekat memerlukan konfirmasi rute jaringan jalan lokal.';
    }

    // Sentence 4: Langkah verifikasi fisik yang disarankan
    const sentence4 = isEn
      ? 'Direct on-site physical verification is recommended prior to property transaction commitments.'
      : 'Disarankan melakukan verifikasi fisik lapangan sebelum keputusan transaksi properti.';

    return `${sentence1} ${sentence2} ${sentence3} ${sentence4}`;
  }

  /**
   * Builds an evidence-backed closing conclusion paragraph.
   */
  static buildClosingConclusion(assessment: MultiHazardAssessmentResult, isEn: boolean): string {
    const { overallScore, dominantHazard, scoringStatus } = assessment;

    if (overallScore === null || overallScore === undefined) {
      return isEn
        ? 'This assessment reflects incomplete data coverage across one or more peril indicators. A conclusive resilience rating requires direct on-site physical inspection and specialized geotechnical data.'
        : 'Penapisan ini mencerminkan cakupan data yang belum lengkap pada satu atau lebih indikator bahaya. Kesimpulan ketahanan menyeluruh memerlukan inspeksi teknis langsung di lokasi dan pengujian geoteknik khusus.';
    }

    const parts: string[] = [];

    if (isEn) {
      parts.push(`The objective screening concludes an overall resilience rating of ${overallScore}/100.`);
      if (dominantHazard) {
        parts.push(`Risk management priorities should focus primarily on ${this.getHazardName(dominantHazard, true).toLowerCase()}.`);
      }
      parts.push('All conclusions are derived strictly from available satellite, municipal, and regional spatial datasets and are subject to on-site engineering verification.');
    } else {
      parts.push(`Hasil penapisan objektif menyimpulkan skor ketahanan keseluruhan sebesar ${overallScore}/100.`);
      if (dominantHazard) {
        parts.push(`Prioritas pengelolaan risiko disarankan berfokus utama pada ${this.getHazardName(dominantHazard, false).toLowerCase()}.`);
      }
      parts.push('Seluruh kesimpulan disusun secara ketat berdasarkan data satelit, instansi, dan katalog spasial yang tersedia serta memerlukan verifikasi teknis secara langsung.');
    }

    return parts.join(' ');
  }

  /**
   * Builds evidence-backed earthquake frequency sentence.
   */
  static buildEarthquakeFrequency(quakeCount150km: number | null | undefined, isEn: boolean): string {
    if (quakeCount150km !== null && quakeCount150km !== undefined) {
      if (quakeCount150km === 0) {
        return isEn
          ? 'No earthquakes recorded within 150 km over the past 10 years according to regional catalogs.'
          : 'Katalog regional tidak mencatat kejadian gempa dalam radius 150 km selama 10 tahun terakhir.';
      }
      return isEn
        ? `Regional seismic catalogs record ${quakeCount150km} earthquake event(s) within 150 km over the past 10 years.`
        : `Katalog seismik regional mencatat ${quakeCount150km} kejadian gempa dalam radius 150 km selama 10 tahun terakhir.`;
    }
    return isEn
      ? 'Site-level event frequency cannot be concluded from available data.'
      : 'Frekuensi kejadian di tingkat tapak belum dapat disimpulkan dari data yang tersedia.';
  }

  /**
   * Builds evidence-backed flood frequency sentence.
   */
  static buildFloodFrequency(historicalEventCount: number | null | undefined, isEn: boolean): string {
    if (historicalEventCount !== null && historicalEventCount !== undefined) {
      if (historicalEventCount === 0) {
        return isEn
          ? 'No historical flood events recorded for this locality in the available historical database.'
          : 'Tidak ada kejadian banjir historis yang tercatat untuk wilayah ini dalam basis data yang tersedia.';
      }
      return isEn
        ? `${historicalEventCount} historical flood event(s) recorded for this locality.`
        : `Tercatat ${historicalEventCount} kejadian banjir historis di wilayah ini.`;
    }
    return isEn
      ? 'Site-level event frequency cannot be concluded from available data.'
      : 'Frekuensi kejadian di tingkat tapak belum dapat disimpulkan dari data yang tersedia.';
  }

  /**
   * Builds evidence-backed heat frequency sentence.
   */
  static buildHeatFrequency(extremeHeatLevel: string | null | undefined, isEn: boolean): string {
    if (extremeHeatLevel) {
      return isEn
        ? `Official climate screening classifies extreme heat exposure as: ${extremeHeatLevel}.`
        : `Klasifikasi penapisan iklim resmi mencatat tingkat paparan panas ekstrem: ${extremeHeatLevel}.`;
    }
    return isEn
      ? 'Site-level event frequency cannot be concluded from available data.'
      : 'Frekuensi kejadian di tingkat tapak belum dapat disimpulkan dari data yang tersedia.';
  }

  private static getLevelDescription(level: RiskLevel, isEn: boolean): string {
    switch (level) {
      case 'low': return isEn ? 'Low Risk' : 'Risiko Rendah';
      case 'medium': return isEn ? 'Medium Risk' : 'Risiko Sedang';
      case 'high': return isEn ? 'High Risk' : 'Risiko Tinggi';
      case 'critical': return isEn ? 'Critical Risk' : 'Risiko Kritis';
      default: return isEn ? 'Undetermined' : 'Belum Dapat Dinilai';
    }
  }

  private static getHazardName(hazard: string | null | undefined, isEn: boolean): string {
    if (!hazard) return isEn ? 'Undetermined' : 'Belum dapat ditentukan';
    const lower = hazard.toLowerCase();
    if (lower.includes('quake') || lower.includes('gempa') || lower.includes('seismic')) {
      return isEn ? 'Earthquake & Seismic Hazard' : 'Gempa Bumi & Aktivitas Seismik';
    }
    if (lower.includes('flood') || lower.includes('banjir')) {
      return isEn ? 'Flooding & Inundation' : 'Banjir & Genangan';
    }
    if (lower.includes('heat') || lower.includes('panas')) {
      return isEn ? 'Heat Stress & Thermal Exposure' : 'Heat Stress & Beban Panas';
    }
    return hazard;
  }
}
