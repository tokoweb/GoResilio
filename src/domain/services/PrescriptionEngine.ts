import type {
  FloodMetrics,
  QuakeMetrics,
  HeatMetrics,
  TransportMetrics,
  PrescriptionItem
} from '../types/hazard.types';
import { RISK_MODEL_CONFIG } from '../config/RiskModelConfig';

/**
 * GoTangguh Mitigation Prescription Engine
 * 
 * Generates indicative spatial risk mitigation recommendations based on GoTangguh model risk scores.
 * 
 * DISCLAIMER & SCIENTIFIC HUMILITY:
 * This engine generates indicative screening recommendations, NOT detailed structural engineering designs,
 * bill of quantities (BOQ), verified cost quotations, evacuation route mapping, or official regulatory compliance certifications.
 * Structural and civil measures require on-site technical investigation by licensed professionals.
 * 
 * THRESHOLD PROVENANCE:
 * The trigger thresholds below are INTERNAL GoTangguh recommendation heuristic thresholds defined in RISK_MODEL_CONFIG.
 * They are NOT official BNPB hazard thresholds, SNI regulatory thresholds, BMKG alert thresholds, or ThinkHazard tiers.
 */
export class PrescriptionEngine {
  public static readonly RECOMMENDATION_TRIGGER_THRESHOLDS = {
    floodHigh: RISK_MODEL_CONFIG.PRESCRIPTION.floodTriggerThreshold,
    quakeHigh: RISK_MODEL_CONFIG.PRESCRIPTION.quakeTriggerThreshold,
    heatHigh: RISK_MODEL_CONFIG.PRESCRIPTION.heatTriggerThreshold,
    transportConstrained: RISK_MODEL_CONFIG.PRESCRIPTION.transportTriggerThreshold
  };

  public static generatePrescriptions(
    flood: FloodMetrics,
    quake: QuakeMetrics,
    heat: HeatMetrics,
    transport: TransportMetrics
  ): PrescriptionItem[] {
    const items: PrescriptionItem[] = [];

    // 1. Flood Mitigations (Triggered when GoTangguh Flood Risk Score > 60)
    if (flood.score !== null && flood.score > this.RECOMMENDATION_TRIGGER_THRESHOLDS.floodHigh) {
      items.push({
        id: 'RX-FLD-01',
        category: 'flood',
        titleId: 'Evaluasi Elevasi Peil Lantai & Katup Pencegah Arus Balik',
        titleEn: 'Finished Floor Elevation Review & Backflow Prevention',
        descriptionId:
          'Evaluasi peninggian peil lantai bangunan relatif terhadap potensi genangan muka jalan setempat, pertimbangkan penyediaan tanggul ambang pintu sementara (removable flood barrier), dan pasang katup pencegah arus balik (backwater check valve) pada saluran pembuangan utama.',
        descriptionEn:
          'Evaluate finished floor levels relative to localized street ponding potential, consider removable flood barrier gates at thresholds, and install mechanical backwater check valves on primary stormwater outlets.',
        actionType: 'Civil / Site',
        estimatedCostIdr: null, // Strictly null: Requires site-specific survey and contractor Bill of Quantities (BOQ)
        estimatedCostUsd: null,
        costBasis: 'unavailable',
        priority: 'High',
        basis: 'engineering_review_required',
        trigger: 'GoTangguh flood risk score > 60'
      });

      items.push({
        id: 'RX-FLD-02',
        category: 'flood',
        titleId: 'Sistem Pompa Otomatis & Saluran Drainase Perimeter',
        titleEn: 'Automated Sump Pump & Perimeter Drainage Channels',
        descriptionId:
          'Pertimbangkan pemasangan pompa celup (sump pump) otomatis dengan daya cadangan mandiri serta pembuatan saluran drainase perimeter dan sumur resapan yang disesuaikan dengan kapasitas daya serap tanah tapak.',
        descriptionEn:
          'Consider automated submersible sump pump installation with backup power and construct perimeter drainage channels with recharge drywells scaled to site soil percolation capacity.',
        actionType: 'MEP',
        estimatedCostIdr: null,
        estimatedCostUsd: null,
        costBasis: 'unavailable',
        priority: 'Medium',
        basis: 'engineering_review_required',
        trigger: 'GoTangguh flood risk score > 60'
      });
    }

    // 2. Earthquake Mitigations (Triggered when GoTangguh Earthquake Risk Score > 55)
    if (quake.score !== null && quake.score > this.RECOMMENDATION_TRIGGER_THRESHOLDS.quakeHigh) {
      items.push({
        id: 'RX-QKE-01',
        category: 'earthquake',
        titleId: 'Evaluasi Sambungan Balok-Kolom & Penjangkaran Fondasi',
        titleEn: 'Structural Joint Review & Foundation Tie Anchorage',
        descriptionId:
          'Lakukan evaluasi teknis terhadap kekakuan sambungan balok-kolom utama dan sistem penjangkaran sloof fondasi melalui peninjauan ahli teknik struktur berizin dengan mengacu pada standar desain ketahanan gempa yang berlaku.',
        descriptionEn:
          'Perform technical structural assessment of beam-column joint ductile detailing and foundation tie-beam anchorage through a qualified structural engineer referencing applicable structural seismic design standards.',
        actionType: 'Structural',
        estimatedCostIdr: null,
        estimatedCostUsd: null,
        costBasis: 'unavailable',
        priority: 'High',
        basis: 'engineering_review_required',
        trigger: 'GoTangguh earthquake risk score > 55'
      });

      items.push({
        id: 'RX-QKE-02',
        category: 'earthquake',
        titleId: 'Pengikatan Dinding Non-Struktural & Partisi Fleksibel',
        titleEn: 'Non-Structural Wall Anchoring & Flexible Partitions',
        descriptionId:
          'Pertimbangkan peninjauan pengikatan kolom praktis dengan pasangan dinding bata serta penggunaan bahan partisi fleksibel untuk meredam pergeseran lateral dan meminimalkan risiko keretakan getas saat terjadi getaran seismik.',
        descriptionEn:
          'Review masonry wall anchoring and consider lightweight flexible partitions to absorb inter-story drift and mitigate brittle cracking risks during seismic shaking.',
        actionType: 'Architectural',
        estimatedCostIdr: null,
        estimatedCostUsd: null,
        costBasis: 'unavailable',
        priority: 'Medium',
        basis: 'engineering_review_required',
        trigger: 'GoTangguh earthquake risk score > 55'
      });
    }

    // 3. Heat Stress Mitigations (Triggered when GoTangguh Heat Risk Score > 50)
    if (heat.score !== null && heat.score > this.RECOMMENDATION_TRIGGER_THRESHOLDS.heatHigh) {
      items.push({
        id: 'RX-HT-01',
        category: 'heat',
        titleId: 'Pelapis Atap Reflektif (Cool Roof) & Insulasi Termal Plafon',
        titleEn: 'High-Reflectance Roof Coating & Ceiling Thermal Insulation',
        descriptionId:
          'Pertimbangkan aplikasi cat pelapis atap berdaya pantul surya tinggi (Cool Roof coating) serta pemasangan insulasi aluminium foil atau penahan radiasi termal di bawah rangka atap sesuai dengan karakteristik konstruksi bangunan.',
        descriptionEn:
          'Consider applying high-reflectance cool roof coatings and installing radiant barrier insulation beneath roof rafters suited to existing building envelope characteristics.',
        actionType: 'Architectural',
        estimatedCostIdr: null,
        estimatedCostUsd: null,
        costBasis: 'unavailable',
        priority: 'High',
        basis: 'risk_model',
        trigger: 'GoTangguh heat risk score > 50'
      });
    }

    // 4. Transportation & Egress (Triggered when GoTangguh Accessibility Score > 45 = Constrained Access)
    if (transport.score !== null && transport.score > this.RECOMMENDATION_TRIGGER_THRESHOLDS.transportConstrained) {
      items.push({
        id: 'RX-TRN-01',
        category: 'transport',
        titleId: 'Penetapan Penanda Evakuasi Internal & Sterilisasi Akses Darurat',
        titleEn: 'Internal Evacuation Signage & Emergency Access Clearance',
        descriptionId:
          'Pertimbangkan pemasangan penanda evakuasi internal menuju area terbuka yang telah ditetapkan melalui asesmen keselamatan setempat serta pastikan lebar jalan akses frontage tapak bebas dari parkir liar atau hambatan kendaraan darurat.',
        descriptionEn:
          'Consider installing internal evacuation wayfinding signs toward open assembly areas established through local safety assessment and ensure site frontage road clearance remains unobstructed for emergency vehicle access.',
        actionType: 'Civil / Site',
        estimatedCostIdr: null,
        estimatedCostUsd: null,
        costBasis: 'unavailable',
        priority: 'Medium',
        basis: 'risk_model',
        trigger: 'GoTangguh transport accessibility score > 45 (constrained access)'
      });
    }

    return items;
  }
}
