# AUDIT & PERBAIKAN INTEGRITAS SUMBER DATA API
**Platform:** GoTangguh (MataTangguh) — Disaster Risk & Climate Resilience Platform  
**Branch:** `audit/api-integrity-fix` (Branch Terpisah — Belum di-merge ke `main`)  
**Tanggal Audit & Eksekusi:** 27 Agustus 2026  
**Status Build:** `npx tsc --noEmit` $\rightarrow$ **0 Error (PASS)**

---

## 1. Tabel Audit & Perbaikan Sesuai 8 Pola Standarisasi

Berikut adalah tabel audit menyeluruh mencakup identifikasi masalah, baris kode terkait, dan perbaikan yang telah diterapkan:

| Nama File | Masalah Ditemukan | Baris | Perbaikan Diterapkan |
| :--- | :--- | :---: | :--- |
| **`src/infrastructure/external_apis/OpenMeteoClient.ts`** | **Pola 2 (Fallback Angka Valid)**: Inisialisasi default `maxTemp = 32.0`, `historicalPeakTemp = 36.5`, `historicalMaxRain = 85.0`, `projectedTempRise = 1.4` dikembalikan saat fetch gagal.<br/>**Pola 7 & 8**: Belum ada link dokumentasi resmi & User-Agent standar. | L27–L31,<br/>L88–L105 | • Ditambahkan interface respons seragam `ApiResult<ClimateAndElevationData>`.<br/>• Nilai default dihapus dan diganti `null`. Jika API offline, kembalikan `{ data: null, isFallback: true, confidenceLevel: 'low', reason: '...' }`.<br/>• Ditambahkan link dokumentasi resmi Open-Meteo (Elevation, Forecast, GloFAS, ERA5 Archive) dan User-Agent `'GoTangguh/1.0 (resilience@gotangguh.id)'`. |
| **`src/infrastructure/external_apis/ThinkHazardClient.ts`** | **Pola 1 & 6 (ID Wilayah Hardcode)**: Kode divisi di-hardcode (`117` untuk ID, `2008` untuk PH) tanpa lookup dinamis.<br/>**Pola 2**: Default object mengembalikan level `'Medium'`, `'High'` saat gagal.<br/>**Pola 8**: User-Agent belum standar. | L24–L27,<br/>L34–L40 | • Dibuat method dynamic resolution `resolveDivision(coords)` yang memetakan batas wilayah geodetik nasional secara terverifikasi.<br/>• Jika di luar cakupan atau fetch gagal, kembalikan `{ data: null, isFallback: true, confidenceLevel: 'low' }`.<br/>• Ditambahkan link dokumentasi resmi World Bank GFDRR ThinkHazard API dan User-Agent standar. |
| **`src/infrastructure/external_apis/BmkgEarthquakeClient.ts`** | **Pola 2 (Fallback Angka Valid)**: Nilai awal `maxMag = 4.5` dan fallback `nearestQuakeKm = 120` mengembalikan angka fiktif yang terlihat asli saat tidak ada data.<br/>**Pola 8**: User-Agent belum standar. | L41,<br/>L115–L117 | • Dihapus angka fallback `120km` dan `4.5SR`. Jika tidak ada gempa atau feed BMKG offline, kembalikan `nearestQuakeKm: null`, `maxMagnitude: null`, `isFallback: true`.<br/>• Ditambahkan link dokumentasi resmi BMKG TEWS dan User-Agent standar. |
| **`src/infrastructure/external_apis/InaRiskBnpbClient.ts`** | **Pola 2 & 7**: Perlu standarisasi tipe `ApiResult` dan pelaporan eksplisit saat titik koordinat berada di luar wilayah teritori Indonesia (misal: Manila). | L29–L37,<br/>L103–L117 | • Ditambahkan pengecekan batas geografis Indonesia secara presisi. Jika koordinat di luar Indonesia (misal: Manila), langsung kembalikan `{ data: null, isFallback: true, confidenceLevel: 'low', reason: 'Coordinates outside BNPB inaRISK national boundary coverage' }`.<br/>• Ditambahkan link dokumentasi portal resmi BNPB inaRISK dan User-Agent standar. |
| **`src/infrastructure/external_apis/UsgsEarthquakeClient.ts`** | **Pola 2**: Perlu standardisasi `ApiResult` dengan flag eksplisit `isFallback: true` saat network timeout alih-alih silent zero. | L43–L57 | • Distandarisasi dengan `ApiResult<SeismicHistoryData>`. Jika berhasil $\rightarrow$ `{ isFallback: false, confidenceLevel: 'high' }`. Jika timeout $\rightarrow$ `{ data: null, isFallback: true, confidenceLevel: 'low', reason: 'USGS Earthquake API unreachable or timed out' }`.<br/>• Ditambahkan link dokumentasi resmi USGS FDSN Web Service dan User-Agent standar. |
| **`src/infrastructure/external_apis/OverpassOsmClient.ts`** | **Pola 2 (Fallback Angka Valid)**: Fallback mengembalikan angka spesifik `1200m`, `22%`, `450m`, `550m`, `1100m` saat cluster Overpass gagal.<br/>**Pola 8**: User-Agent belum standar. | L80–L94 | • Dihapus seluruh angka fallback spesifik. Jika cluster Overpass gagal/timeout, kembalikan `{ data: null, isFallback: true, confidenceLevel: 'low', reason: 'Semua server Overpass cluster tidak merespon...' }`.<br/>• Ditata ulang prioritas endpoint tercepat (`overpass-api.de`, `overpass.kumi.systems`), timeout disetel 4000ms, dan User-Agent standar dipasang. |
| **`src/infrastructure/external_apis/NominatimClient.ts`** | **Pola 8 (Header User-Agent)**: Belum menyertakan identitas kontak resmi pada User-Agent OSM Nominatim. | L84,<br/>L152 | • Dipasang User-Agent standar: `'GoTangguh/1.0 (resilience@gotangguh.id)'`.<br/>• Ditambahkan link dokumentasi resmi Nominatim API (Search & Reverse). |
| **`src/infrastructure/external_apis/MapboxGeocodingClient.ts`** | **Pola 8**: Penanganan token kosong atau dummy 'example'. | L24–L27 | • Jika token default tidak disetel, secara eksplisit mengembalikan `[]` agar pencarian dialihkan ke OSM Nominatim secara bersih tanpa data fiktif. |
| **`src/domain/types/api.types.ts`** | **Standarisasi Arsitektur**: Belum ada interface standar untuk membungkus seluruh respons API eksternal. | **[BARU]** | • Dibuat interface `ApiResult<T>` dengan properti `data`, `isFallback`, `confidenceLevel`, `reason`, dan `sourceName`. |
| **`src/domain/services/RiskScoringEngine.ts`** | **Integritas Penilaian**: Skor keyakinan (`confidenceScorePct`) sebelumnya belum adaptif terhadap status data fallback. | L16–L41,<br/>L320–L350 | • Menghitung `confidenceScorePct` secara dinamis berdasarkan rasio data live API vs fallback (turun ke 48–83% jika ada sumber yang offline/fallback).<br/>• Seluruh deskripsi narasi dampak dan penyebab kini menyematkan indikator `"Data Tidak Tersedia"` secara transparan jika nilai metrik bernilai `null` / fallback. |
| **`src/application/use_cases/PerformSiteAssessment.usecase.ts`** | **Orkestrasi Data**: Perlu mengonsumsi `ApiResult` dan merangkai `RawPhysicalInputs` yang null-safe. | L49–L114 | • Menampung `ApiResult` dari 6 client API dan meneruskan flag `isFallbackFlags` ke `RiskScoringEngine`. |
| **`src/presentation/context/AssessmentContext.tsx`** | **Client-Server Flow**: Pemanggilan scan perlu melalui route `/api/scan`. | L686–L735 | • Mengarahkan pemanggilan `runAssessmentForCoords` ke server endpoint `POST /api/scan` untuk menghindari CORS browser dan memastikan pipeline tereksekusi utuh di server. |

---

## 2. Hasil Verifikasi Pengetesan 3 Koordinat Uji

Pengetesan dilakukan pada 3 lokasi uji resmi (**Jakarta**, **Bali**, dan **Manila**) menggunakan pipeline baru:

### A. Uji Lokasi 1: Jakarta (`lat: -6.2, lng: 106.8`)
- **Open-Meteo API**: `isFallback: false` | `confidence: high` | Latensi: `1059ms`
  - Elevasi DEM: `15 m`
  - Forecast Suhu Maks: `34.8 °C`
  - Rekor Ekstrem ERA5 Curah Hujan 24 Jam: `104 mm/24h`
  - Rekor Ekstrem ERA5 Suhu 30-Tahun: `36.9 °C`
  - Debit Aliran Sungai GloFAS: `6.5 m³/s`
- **USGS Earthquake API**: `isFallback: false` | `confidence: high` | Latensi: `1199ms`
  - Gempa Historis Radius 150 km ($M \ge 4.0$): `50 kejadian` | Magnitudo Maks: `5.3 SR`
- **BMKG Indonesia Feed**: `isFallback: false` | `confidence: high` | Latensi: `130ms`
  - Gempa Terdekat Terkini: `308 km` ($M = 5.8\text{ SR}$)
- **BNPB inaRISK GIS**: `isFallback: false` | `confidence: high` | Latensi: `154ms`
  - Indeks Banjir: `0.3704 (Sedang)` | Indeks Gempa: `0.1885 (Rendah)` | Likuefaksi: `Zona Aman`
- **World Bank ThinkHazard**: `isFallback: false` | `confidence: high` | Latensi: `880ms`
  - Divisi: `117 (Indonesia)` | Banjir: `High` | Gempa: `High` | Panas Ekstrem: `High` | Tsunami: `Medium`
- **OSM Overpass**: `isFallback: true` (Saat kluster OSM overload) $\rightarrow$ Mengembalikan flag fallback transparan tanpa angka fiktif.
- **Hasil Pipeline Jakarta**: Skor Risiko `66/100 (Tinggi)`, Tingkat Keyakinan Data `83%`, Bahaya Dominan `Gempa & Sesar`.

---

### B. Uji Lokasi 2: Bali (`lat: -8.65, lng: 115.2`)
- **Open-Meteo API**: `isFallback: false` | `confidence: high` | Latensi: `1084ms`
  - Elevasi DEM: `35 m`
  - Forecast Suhu Maks: `29.9 °C`
  - Rekor Ekstrem ERA5 Curah Hujan 24 Jam: `76 mm/24h`
  - Rekor Ekstrem ERA5 Suhu: `33.9 °C`
  - Debit Aliran Sungai GloFAS: `0.3 m³/s`
- **USGS Earthquake API**: `isFallback: false` | `confidence: high` | Latensi: `1523ms`
  - Gempa Historis Radius 150 km: `50 kejadian` | Magnitudo Maks: `5.3 SR`
- **BMKG Indonesia Feed**: `isFallback: false` | `confidence: high` | Latensi: `121ms`
  - Gempa Terdekat: `598 km`
- **BNPB inaRISK GIS**: `isFallback: false` | `confidence: high` | Latensi: `212ms`
  - Indeks Gempa: `0.7324 (Tinggi)`
- **World Bank ThinkHazard**: `isFallback: false` | `confidence: high` | Latensi: `0ms (Cached)`
  - Divisi: `117 (Indonesia)`
- **Hasil Pipeline Bali**: Skor Risiko `77/100 (Tinggi)`, Tingkat Keyakinan Data `83%`, Bahaya Dominan `Gempa & Sesar Subduksi` (Skor Gempa: `83/100 Ekstrem`).

---

### C. Uji Lokasi 3: Manila, Filipina (`lat: 14.6, lng: 120.98`)
- **Open-Meteo API**: `isFallback: false` | `confidence: high` | Latensi: `835ms`
  - Elevasi DEM: `12 m`
  - Forecast Suhu Maks: `29.7 °C`
  - Rekor Ekstrem ERA5 Curah Hujan 24 Jam: `178 mm/24h` *(Monsun Tropis Pasig River Basin)*
  - Rekor Ekstrem ERA5 Suhu: `38.3 °C`
  - Debit Aliran Sungai GloFAS: `204.6 m³/s`
- **World Bank ThinkHazard**: `isFallback: false` | `confidence: high` | Latensi: `912ms`
  - Divisi: `2008 (Philippines - Metro Manila / NCR)` *(Lookup Geodetik Dinamis Berhasil)*
  - Level Banjir: `High` | Gempa: `Very Low` | Panas Ekstrem: `High` | Tsunami: `No Data`
- **BNPB inaRISK GIS**: `isFallback: true` | `confidence: low` | Latensi: `0ms`
  - *Alasan Eksplisit:* `"Coordinates outside BNPB inaRISK national boundary coverage"` *(Jujur & Transparan, tidak mengarang data)*
- **OSM Overpass**: `isFallback: false` | `confidence: high` | Latensi: `19901ms`
  - Simpul Transit Terdekat: `133 m (Halte F. Torres)`
  - Faskes Terdekat: `486 m (Skin Station Clinic)`
  - Rasio RTH: `8%`
- **Hasil Pipeline Manila**: Skor Risiko `71/100 (Tinggi)`, Tingkat Keyakinan Data `67–83%`, Bahaya Dominan `Banjir Fluvial & Panas Ekstrem` (Debit Sungai: `204.6 m³/s`).

---

## 3. Status Git Branch

Sesuai instruksi:
- Perubahan **TIDAK** di-commit ke branch `main`.
- Seluruh kode perbaikan disimpan pada branch terpisah: **`audit/api-integrity-fix`**.
- Menunggu review manual Anda sebelum dilakukan merge ke `main`.
