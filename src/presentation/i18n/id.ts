export const idDictionary = {
  nav: {
    riskScan: 'Asesmen Risiko',
    pricing: 'Paket & Biaya',
    reportStructure: 'Standar Laporan',
    bookDemo: 'Konsultasi',
    sampleReportBtn: 'Contoh Laporan',
    scheduleDemoBtn: 'Jadwalkan Konsultasi',
    loginBtn: 'Masuk'
  },
  hero: {
    title: 'Platform Asesmen Risiko Bencana & Iklim Properti',
    subtitle:
      'Cari lokasi atau klik/geser marker langsung pada peta di bawah ini untuk analisis risiko banjir, gempa bumi, heat stress, serta aksesibilitas & konektivitas transportasi tingkat tapak secara presisi.',
    searchPlaceholder: 'Ketik kota, kecamatan, atau alamat (misal: Jakarta Selatan, Denpasar, Quezon City)...',
    propertyTypeLabel: 'Tipe Properti',
    targetUserLabel: 'Target Pengguna',
    scanBtn: 'Cari & Scan',
    quickPresetsLabel: 'Pilihan Cepat:',
    scoreOverrideLabel: 'Timpa Skor Manual (Simulasi Demo):',
    scoreHigh: 'Tinggi (85)',
    scoreMed: 'Sedang (55)',
    scoreLow: 'Rendah (20)',
    types: {
      residential: 'Residential (Rumah / Tanah)',
      commercial: 'Commercial (Ruko / Kawasan / Mall)'
    },
    personas: {
      buyer: 'Home Buyer (Pembeli)',
      owner: 'Home Owner (Pemilik)',
      developer: 'Property Developer',
      lender: 'Lender / Perbankan',
      agent: 'Real Estate Agent'
    }
  },
  dashboard: {
    mapTitle: 'Visualisasi Tapak & Zonasi Hazard',
    perspectiveBadge: 'Perspektif',
    mapHint:
      'Peta Interaktif Saling Tersinkronisasi: Mengetik alamat, mengeklik peta, atau menggeser pin marker secara otomatis memperbarui analisis risiko di seluruh platform!',
    indicatorsTitle: 'Detail Analisis Multi-Hazard & Aksesibilitas Site',
    indicatorsSubtitle: '4 Indikator Penilaian Utama',
    overallScoreTitle: 'Skor Risiko Gabungan',
    propertyTypeLabel: 'Tipe Properti',
    downloadPdfBtn: 'Unduh Full Report (PDF)',
    roleInsightTitle: 'Rekomendasi',
    cards: {
      floodTitle: 'Banjir & Genangan',
      quakeTitle: 'Gempa & Sesar Aktif',
      heatTitle: 'Heat Stress & Iklim',
      transportTitle: 'Transportasi & Akses',
      causeLabel: 'Penyebab Utama:',
      impactLabel: 'Potensi Dampak:',
      recomLabel: 'Rekomendasi:',
      accessRecomLabel: 'Rekomendasi Akses:'
    }
  },
  pricing: {
    title: 'Pilihan Layanan & Biaya Asesmen',
    subtitle: 'Model layanan berjenjang untuk individu hingga pengembang properti & perbankan.',
    free: {
      title: 'Skrining Mandiri',
      desc: 'Screening awal multi-hazard berbasis dashboard interaktif untuk identifikasi risiko tapak.',
      price: '',
      period: '',
      btn: 'Cek di Dashboard',
      features: [
        'Multi-Hazard Scan (Banjir, Gempa, Heat Stress)',
        'Visualisasi Peta Spasial CARTO',
        'Ringkasan Skor Risiko 0–100',
        'Wawasan ringkas bahasa awam'
      ]
    },
    instant: {
      title: 'Instant (1 Properti)',
      badge: 'Paling Populer',
      desc: 'Laporan PDF otomatis berisi profil risiko dasar (Banjir, Cuaca Panas, Gempa) dan rekomendasi umum ±10 halaman.',
      price: '',
      period: '',
      btn: 'Buat laporan instan',
      features: [
        'Cakupan 1 lokasi properti',
        'Profil risiko dasar 3 hazard (Banjir, Panas, Gempa)',
        'Rekomendasi umum & mitigasi risiko',
        'Dokumen resmi format PDF (±10 halaman)',
        'Ringkasan aksesibilitas & evakuasi'
      ]
    },
    lite: {
      title: 'Bundling 1 (Bandingkan 3 Properti)',
      badge: 'Hemat & Komparasi',
      desc: 'Laporan komparasi side-by-side untuk pembeli yang biasa mengecek 3–5 properti sebelum menawar.',
      price: '',
      period: '',
      btn: 'Bandingkan properti',
      features: [
        'Cakupan 1–3 lokasi properti',
        'Laporan komparasi risiko side-by-side',
        '3 Laporan PDF lengkap (@±10 halaman)',
        'Rekomendasi perbandingan properti teraman',
        'Ideal untuk shortlist sebelum menawar properti'
      ]
    },
    gold: {
      title: 'Konsultasi Ahli & Verifikasi Lapangan',
      desc: 'Review mendalam oleh tim ahli BGP Consultant atau verifikasi lapangan langsung oleh Arsitek & Ahli Teknik Sipil.',
      price: '',
      period: '',
      btn: 'Book a demo',
      features: [
        'Sesi konsultasi daring dengan Ahli Kebencanaan',
        'Verifikasi lapangan oleh Arsitek / Teknik Sipil',
        'Studi kelayakan lahan skala kawasan (Developer)',
        'Katalog desain Rumah Tangguh Bencana',
        'Rujukan eksekusi kontraktor bersertifikat'
      ]
    }
  },
  demo: {
    title: 'Konsultasi ahli & verifikasi lapangan',
    subtitle:
      'Dapatkan penilaian risiko dan kondisi properti dari tim ahli, dilengkapi verifikasi lapangan oleh Arsitek dan Ahli Struktur untuk mendukung keputusan properti yang lebih aman dan tepat.',
    pillar1Title: 'Analisis Risiko bencana & Geospasial',
    pillar1Desc: 'Evaluasi risiko properti berbasis data geospasial dan analisis teknis untuk mengidentifikasi potensi bahaya, kerentanan, serta kebutuhan mitigasi bersama tim ahli.',
    pillar2Title: 'Verifikasi teknis lapangan',
    pillar2Desc: 'Verifikasi kondisi aktual properti melalui pemeriksaan tapak, elevasi, daya dukung tanah (sondir), serta kondisi dan integritas struktur bangunan eksisting.',
    pillar3Title: 'Panduan Desain & Kontraktor',
    pillar3Desc: 'Rekomendasi desain Rumah Tangguh Bencana dan referensi kontraktor untuk konstruksi atau renovasi.',
    credibilityTitle: 'Kredibilitas Didukung Oleh:',
    credibilityText: 'Tim Peneliti & Ahli Kebencanaan dari Baresi Global Prime (BGP) Consultant',
    highlights: [
      'Analisis Risiko bencana & Geospasial',
      'Verifikasi teknis lapangan oleh Arsitek & Ahli Struktur',
      'Panduan Desain Rumah Tangguh & Rekomendasi Kontraktor'
    ],
    formTitle: 'Formulir Permohonan Konsultasi & Verifikasi',
    nameLabel: 'Nama Lengkap',
    namePlaceholder: 'Contoh: Budi Santoso',
    emailLabel: 'Email & Kontak WhatsApp',
    emailPlaceholder: 'nama@email.com / 0812xxxx',
    companyLabel: 'Institusi / Perusahaan (Opsional)',
    companyPlaceholder: 'Contoh: PT Developer Maju / Pribadi',
    roleLabel: 'Profil / Peran Anda',
    packageLabel: 'Pilihan Paket Layanan',
    locationLabel: 'Titik Lokasi Properti / Lahan',
    dateLabel: 'Pilih Tanggal Rencana Konsultasi',
    notesLabel: 'Catatan Spesifikasi Kebutuhan (Opsional)',
    notesPlaceholder: 'Tuliskan detail pertanyaan atau kebutuhan khusus Anda...',
    submitBtn: 'Kirim Permohonan Konsultasi',
    successMsg: 'Permohonan Konsultasi Berhasil Terkirim!',
    successSub: 'Tim ahli akan menghubungi Anda melalui WhatsApp atau Email dalam 1x24 jam untuk konfirmasi jadwal.'
  },
  reportSteps: {
    title: "See What's Inside the Report",
    subtitle: 'Unduh contoh format laporan lengkap untuk melihat struktur analisis risiko, peta kedalaman, dan rekomendasi teknis.',
    downloadBtn: 'Download Sample Report',
    step1: {
      badge: 'BAGIAN 1',
      title: 'Cover & Executive Summary',
      desc: 'Identitas lokasi, koordinat, skor risiko utama (0-100), serta rangkuman kesimpulan 1-2 paragraf.'
    },
    step2: {
      badge: 'BAGIAN 2',
      title: 'Analisis Deep-Dive Hazard',
      desc: 'Penyebab, dampak, peta kedalaman/mikrozonasi, serta tren historis untuk Gempa, Banjir, & Heat stress.'
    },
    step3: {
      badge: 'BAGIAN 3',
      title: 'Diagnosis & Rekomendasi',
      desc: 'Diagnosis kerentanan elemen bangunan, langkah mitigasi teknis, dan estimasi biaya pekerjaan adaptasi.'
    },
    step4: {
      badge: 'BAGIAN 4',
      title: 'Aksesibilitas & Finansial',
      desc: 'Analisis infrastruktur evakuasi, jaringan transportasi publik, serta dampak nilai properti & asuransi.'
    }
  },
  modal: {
    title: 'GoResilio Sample Report PDF',
    subtitle: 'Format dokumen laporan lingkungan & risiko bencana properti terstruktur resmi dari GoResilio.',
    brandSubtitle: 'LOCATION INTELLIGENCE & CLIMATE RISK REPORT',
    addressLabel: 'Alamat Tapak:',
    propTypeLabel: 'Tipe Properti:',
    perspectiveLabel: 'Perspektif Klien:',
    opinionHeader: 'Professional Opinion & Key Results',
    opinionHigh: 'Significant environmental & climate risks have been identified. Action is recommended before transaction completion.',
    opinionMed: 'Moderate environmental & climate risks identified. Preventive mitigation recommended.',
    opinionLow: 'Low environmental & climate risks. Standard maintenance sufficient.',
    tableHeader: {
      hazard: 'Kategori Hazard',
      status: 'Status / Rating',
      cause: 'Penyebab Utama / Kondisi Tapak',
      mitigation: 'Langkah Mitigasi & Akses Direkomendasikan'
    },
    nextStepsTitle: "Consultant's Guidance & Next Steps",
    downloadBtn: 'Unduh / Cetak Laporan PDF',
    closeBtn: 'Tutup'
  },
  footer: {
    copyright: '© 2026 GoResilio. Climate & Disaster Risk Property Assessment Platform.'
  },
  auth: {
    portalTitle: 'Portal Klien & Institusi GoTangguh',
    portalSubtitle: 'Akses dasbor portofolio risiko tapak, arsip laporan PDF terverifikasi, dan integrasi data feed.',
    buyerTab: 'Individu / Pembeli',
    developerTab: 'Developer Properti',
    bankTab: 'Perbankan & Asuransi',
    emailLabel: 'Email / ID Institusi',
    emailPlaceholder: 'nama@perusahaan.com / ID Klien',
    passLabel: 'Kata Sandi / Kode Akses Laporan',
    passPlaceholder: '••••••••••••',
    submitBtn: 'Masuk ke Dasbor Portofolio',
    demoInstantBtn: 'Masuk Otomatis (Demo Mode)',
    loginSuccess: 'Berhasil Masuk! Selamat datang di Dasbor Portofolio GoTangguh.',
    securityNote: 'Privasi & data Anda terjamin aman.'
  }
};
