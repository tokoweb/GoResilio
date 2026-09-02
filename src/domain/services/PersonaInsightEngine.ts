import type { UserPersona } from '../types/hazard.types';
import type { PersonaInsightContent } from '../types/persona.types';

export class PersonaInsightEngine {
  private static readonly INSIGHTS: Record<UserPersona, PersonaInsightContent> = {
    'Home Buyer': {
      persona: 'Home Buyer',
      shortInsightId:
        'Properti ini memerlukan penyesuaian anggaran mitigasi. Gunakan skor risiko ini sebagai instrumen negosiasi penurunan harga beli dengan pemilik/pengembang.',
      shortInsightEn:
        'This property requires adaptive mitigation budgeting. Leverage this risk index to negotiate a favorable acquisition price with the seller/developer.',
      detailedGuidanceId:
        'Sebagai Pembeli Rumah (Home Buyer), asesmen ini memberikan dasar perhitungan biaya renovasi adaptif tahan bencana serta evaluasi nilai wajar sebelum proses akad jual-beli properti disetujui.',
      detailedGuidanceEn:
        'As a Home Buyer, this assessment provides transparent insight into mandatory adaptive renovation outlays and fair valuation before completing closing deeds.',
      actionStepsId: [
        'Lakukan verifikasi riwayat banjir dan gempa lokal kepada pemilik atau tetangga sekitar.',
        'Gunakan temuan laporan risiko tinggi ini sebagai dasar argumentasi negosiasi penurunan harga penawaran.',
        'Pastikan ketersediaan dan syarat polis asuransi properti mencakup klausul perluasan jaminan bencana alam (banjir & gempa).'
      ],
      actionStepsEn: [
        'Cross-verify local historical flood and seismic occurrences with adjacent neighborhood residents.',
        'Utilize this comprehensive risk score to substantiate price discount negotiations during purchase bargaining.',
        'Confirm property insurance underwriting terms include mandatory flood and earthquake policy extensions.'
      ]
    },
    'Home Owner': {
      persona: 'Home Owner',
      shortInsightId:
        'Fokus utama Anda adalah tindakan preventif struktural untuk mencegah penurunan nilai aset dan biaya perbaikan mendadak di masa depan.',
      shortInsightEn:
        'Your priority should focus on structural preventive maintenance to safeguard long-term asset value and avoid unexpected disaster repair bills.',
      detailedGuidanceId:
        'Sebagai Pemilik Rumah (Home Owner), laporan ini memandu skala prioritas pekerjaan renovasi pelindung hunian untuk memastikan keselamatan keluarga dan ketahanan investasi jangka panjang.',
      detailedGuidanceEn:
        'As a Home Owner, this report provides a prioritized retrofit roadmap to enhance family safety and preserve asset equity against extreme climate stressors.',
      actionStepsId: [
        'Prioritaskan peninggian peil lantai dan pemasangan katup cegah-balik (backwater valve) pada drainase.',
        'Lakukan inspeksi integritas struktural balok, kolom, dan sambungan kuda-kuda atap.',
        'Terapkan insulasi atap penolak panas (cool roof) untuk menekan lonjakan tagihan listrik AC.'
      ],
      actionStepsEn: [
        'Prioritize finished floor elevation and installation of non-return backwater valves on sewer exits.',
        'Inspect structural ductility of tie-columns, beams, and roof truss anchor brackets.',
        'Install reflective radiant barriers and cool roof coatings to mitigate rising cooling electricity costs.'
      ]
    },
    'Property Developer': {
      persona: 'Property Developer',
      shortInsightId:
        'Rekomendasi teknis pada laporan ini wajib diintegrasikan ke dalam masterplan site engineering dan studi kelayakan lingkungan kawasan perumahan.',
      shortInsightEn:
        'Technical recommendations from this report should be integrated into site grading plans, civil engineering specs, and environmental due diligence.',
      detailedGuidanceId:
        'Sebagai Pengembang Properti (Property Developer), laporan ini membantu mitigasi kewajiban hukum (liability risk) dan meningkatkan daya jual proyek dengan keunggulan branding "Kawasan Tangguh Bencana".',
      detailedGuidanceEn:
        'As a Property Developer, this assessment mitigates long-term developer liability and creates a strong unique selling proposition around certified disaster resilience.',
      actionStepsId: [
        'Integrasikan elevasi peil banjir 50-tahunan ke dalam elevasi rencana jalan dan kolam retensi kawasan.',
        'Terapkan standar struktur tahan gempa SNI 1726:2019 / NSCP pada seluruh unit tipe hunian.',
        'Alokasikan Koefisien Dasar Hijau (KDH) minimal 30% untuk meredam efek Urban Heat Island.'
      ],
      actionStepsEn: [
        'Incorporate 50-year return period flood levels into master road crown elevations and stormwater detention ponds.',
        'Enforce SNI 1726:2019 / NSCP seismic engineering compliance across all standardized house prototypes.',
        'Allocate at least 30% green canopy coverage (KDH) to counter microclimate heat accumulation.'
      ]
    },
    'Lender / Bank': {
      persona: 'Lender / Bank',
      shortInsightId:
        'Skor risiko tinggi dapat memengaruhi agunan kredit jangka panjang. Disarankan penyesuaian LTV (Loan-to-Value) atau syarat perlindungan asuransi tambahan.',
      shortInsightEn:
        'Elevated hazard scores impact collateral durability. We recommend adjusted Loan-to-Value (LTV) limits and mandatory multi-peril insurance covenants.',
      detailedGuidanceId:
        'Sebagai Institusi Perbankan / Pemberi Kredit (Lender), analisis ini digunakan untuk underwriting risiko agunan kredit pemilikan rumah (KPR) dan proteksi portofolio pembiayaan perbankan.',
      detailedGuidanceEn:
        'As a Lending Institution, this analysis serves mortgage underwriting, default risk mitigation, and climate stress-testing for collateral portfolios.',
      actionStepsId: [
        'Pertimbangkan penyesuaian rasio LTV (Loan-to-Value) atau batas plafon pinjaman agunan berdasarkan skor bahaya.',
        'Wajibkan debitur melampirkan polis asuransi bencana komprehensif dengan klausul Banker’s Clause.',
        'Lakukan evaluasi berkala terhadap ketahanan fisik aset agunan selama masa tenor kredit berlangsung.'
      ],
      actionStepsEn: [
        'Calibrate LTV thresholds and debt covenants according to property-level climate vulnerability.',
        'Require comprehensive hazard insurance with certified Banker’s Clause endorsements.',
        'Implement periodic portfolio physical resilience monitoring throughout the loan tenure.'
      ]
    },
    'Real Estate Agent': {
      persona: 'Real Estate Agent',
      shortInsightId:
        'Sajikan transparansi data risiko untuk membangun kepercayaan calon pembeli sekaligus memberikan solusi mitigasi teknis yang jelas.',
      shortInsightEn:
        'Leverage hazard data transparency to establish client trust while providing pre-evaluated architectural solutions.',
      detailedGuidanceId:
        'Sebagai Agen Properti (Real Estate Agent), laporan ini meningkatkan kredibilitas penjualan dengan menghadirkan transparansi risiko dan solusi adaptasi bangunan kepada calon klien.',
      detailedGuidanceEn:
        'As a Real Estate Professional, this certified assessment builds advisory authority, addresses buyer anxiety, and accelerates transaction velocity.',
      actionStepsId: [
        'Tunjukkan laporan ini kepada calon pembeli sebagai bukti transparansi informasi dan integritas profesional.',
        'Sampaikan rekomendasi langkah perbaikan adaptif yang realistis kepada pihak pembeli dan penjual.',
        'Gunakan daya tahan bencana (resilience) sebagai nilai tambah pembeda properti di pasar.'
      ],
      actionStepsEn: [
        'Present this verified report to prospective buyers as proof of full disclosure and professional advisory.',
        'Provide pragmatic retrofit budget estimates to balance negotiation friction between buyer and seller.',
        'Position verified disaster resilience as a unique value multiplier in premium marketing listings.'
      ]
    }
  };

  public static getInsight(persona: UserPersona): PersonaInsightContent {
    return this.INSIGHTS[persona] || this.INSIGHTS['Home Buyer'];
  }
}
