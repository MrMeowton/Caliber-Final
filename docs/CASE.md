# CASE — Analisis kasus final (diisi PERTAMA, 08.45–10.00)

> Dikerjakan tim di Claude chat (Project berisi file ini + `REFERENCE.md`). Claude Code TIDAK membaca file ini.
> Setelah §5 terkunci, jalankan `/spec` di Claude Code untuk menyaringnya ke `docs/SPEC.md`.
> Sumber angka: Supporting Data CALIBER 2026 (dummy, Mei 2025–Sep 2026), dihitung tim. Fakta F1–F24 lengkap di Project doc `reference/03_analysis_fact_base.md` dan Design Document.

## 0. Case at a glance
| | |
|---|---|
| Judul kasus | Spare Part Intelligence & Inventory Optimization: AI-Powered Forecasting & Dynamic Optimization |
| Pertanyaan/task resmi | KQ1 "How can the Company improve demand predictability for spare parts with irregular and uncertain consumption patterns?" · KQ2 "How can the Company dynamically optimize spare part inventory while balancing inventory cost, availability, and operational risk?" |
| "Klien" internal & unit/aset | Materials Management (planner), Maintenance & Reliability, Procurement. Plant PX (cracker: 12 cracking furnace BF-101…112, kompresor/turbin KC-/KT-, pompa PP-, HE-), Plant PY (cold section, fractionation, butadiene, utilities), UT |
| Data yang disediakan / disebut | BoM (20.653 baris; stok, Min/Max, MRP Type) · Movement Material (17.518 issue) · Notif History (5.795) · FuncLoc list (14.484; criticality S/A/B/C) · PR PO (11.609 baris, **5.420 duplikat persis** → 6.189 unik; harga satuan, lead time, supplier) · Mitem & Mplan (10.153 PM item) |
| Pilar tema yang kena | **Reliability** (utama; booklet menyebut "spare-part inventory optimization") + Knowledge (Mplan → BoM menggantikan tacit knowledge) |
| Deliverable final | (1) MVP, **bukan static HTML**, di **Vercel**, database **SQLite**, zip source + DB, screenshot bertimestamp. (2) Deck EN 7 slide + appendix (struktur booklet + tambahan brief). **Deadline Kamis 5 Nov 2026 06.00 WIB**. Submit sekali saja (booklet FAQ 8) |

Teks kasus lengkap (ringkasan setia; teks penuh di Project doc `reference/01_case_brief_FINAL.md`):
```
TRIGGER: When a shutdown happens, the critical part we need is out of stock, while slow-moving
items we don't need sit on the shelf -> rush procurement, higher cost, downtime risk.
CAUSE: Stock is planned reactively (failures, maintenance, shutdowns, lead times), not around
what really drives demand. DILEMMA: too much stock ties up capital; too little = stockouts,
emergency buying, production loss.
OBJECTIVE: AI-powered spare parts optimization to improve forecasting, enable dynamic inventory
decisions, reduce excess inventory and working capital, maintain critical spare-part availability.
PROBLEM: no integrated and predictable approach to forecasting spare part demand and inventory
level setting. WHY: (1) static planning: historical consumption, static Min-Max; (2) suboptimal
balancing: availability vs carrying cost vs downtime; criticality & lead time not considered.
IMPACT: emergency procurement; higher purchasing & carrying cost; excess working capital;
prolonged downtime & production losses.
EXPECTED SOLUTION: (1) Demand Forecasting (consumption, failures, maintenance, operating conditions)
(2) Dynamic Inventory Optimization (Min-Max, Safety Stock, ROP, replenishment qty)
(3) Inventory Health Monitoring (excess, slow-moving, non-moving, obsolete)
(4) AI Recommendation & Cost-Risk Optimization (reorder / maintain / reduce / monitor).
AI CAPABILITIES: Stockout Risk, Overstock Risk, Reorder Recommendation, Slow-Moving Alert,
Dynamic Inventory Parameters, Cost-Risk Optimization Scenarios.
Extra data allowed with business justification; quality data architecture > more data.
```

## 1. Business lens (kriteria A)
### 1.1 Pain point → dampak
| # | Pain point (kutipan kasus) | Siapa terdampak | Akibat bisnis | Besaran | Sumber angka |
|---|---|---|---|---|---|
| 1 | "the critical part we need is out of stock" | Reliability engineer, operasi | Downtime furnace/kompresor, TA molor | 116 SKU kritikal (S/A) ber-demand stok 0; 472 Stock Item stok 0; 504 < Min | Kasus (BoM+FuncLoc+Movement) |
| 2 | "slow-moving items we don't need sit available on the shelf" | Finance, gudang | Working capital tertahan, carrying cost | 1.376 SKU > Max; 3.527 SKU non-moving 17 bln; excess Rp 440 M (teridentifikasi harga) | Kasus + simulasi tim |
| 3 | "rush procurement, higher cost" | Buyer, planner | Premium harga, pembelian tidak perlu | 463 rush PR (≤7 hari) = Rp 107 M; 34,5% spend 12 bln (Rp 417 M dari Rp 1,21 T) ke SKU yang sudah > Max; 60,3% PO terlambat | Kasus (PR PO setelah dedup) |

### 1.2 Akar masalah (5 Whys pada pain point #1)
1. Mengapa part kritikal kosong? → Min tidak menutup demand selama lead time (134 dari 672 SKU ber-demand: Min < demand×LT).
2. → Min ditetapkan sekali dari rata-rata konsumsi, lead time aktual (median 42 hari, P90 jauh lebih panjang) tidak dipakai.
3. → Rata-rata menyesatkan: 98% demand intermittent/lumpy; rata-rata 12 bln over-forecast +108% (backtest), dan PM/TA mendatang tidak diterjemahkan ke kebutuhan part (Mplan tidak memuat part).
- Akar **teknologi**: MRP deterministik, data MM/PM/PUR terpisah (hanya 16% movement tertaut notifikasi) · akar **proses**: tidak ada review parameter berkala & stock gate di PR · akar **manusia & budaya**: keputusan berbasis pengalaman di Excel; takut stockout → menimbun item non-kritis.

### 1.3 Persona
| Persona | Tugas harian | Frustrasi | Keputusan yang dia ambil |
|---|---|---|---|
| Operator / teknisi (storekeeper) | Issue part ke order, cycle count | Part kosong saat order dirilis; data MRP salah (1.683 Non Stock ber-stok) | Lapor shortage, redeploy stok |
| Engineer / supervisor (Bima, Reliability Engineer, furnace & rotating) | Rencana PM, overhaul, decoking, approve item kritikal | "Burner cleaning BF-112 butuh gate valve 4", stok habis, lead time ±2 bulan" | Approve stok item S/A, kebutuhan part PM/TA |
| Manajer plant (+ **primary user Rina, Materials Planner**) | Planner: Min–Max, PR untuk 3.656 Stock Item. Manajer: budget & working capital | Planner: review Excel tanpa prioritas. Manajer: inventory besar tapi tetap stockout | Planner: reorder / stop-buy / ubah Min–Max. Manajer: target inventory, disposal |

### 1.4 Kalkulator dampak (konservatif; kurs Rp 16.300/USD, assumption)
| # | KPI | Baseline | Target | Perhitungan (angka masuk rumus) | USD/th | Asumsi |
|---|---|---|---|---|---|---|
| 1 | Pembelian ke SKU > Max (stock gate) | 34,5% spend = Rp 417 M/th | −5% dari nilai itu | 417 × 5% = Rp 20,9 M | 1,28 jt | Hanya 5% benar-benar bisa dihindari |
| 2 | Rush premium + carrying cost excess | Rush Rp 107 M; excess Rp 440 M | Rush −30%; excess −10% | 107×15%×30% = Rp 4,8 M + 440×10%×20% = Rp 8,8 M | 0,83 jt | Premium rush 15%; carrying 20%/th |
| 3 | Production loss karena part tidak tersedia | ≈95 notif Emergency/th | −5 kejadian/th | 5 × 1 hari × US$ 50k = Rp 4,1 M | 0,25 jt | Margin furnace-day US$ 50k (validasi) |
| | **Total** | | | Rp 38,6 M/th | **≈ 2,37 jt** | Investasi Rp 15 M, opex Rp 4 M/th → payback ±12 bln (dalam tahun 1); + working capital dilepas Rp 44 M (sekali). Base Rp 79,6 M, optimis Rp 170 M |

**Headline dampak (EN):** "MIND Spares keeps critical parts on the shelf before the job starts and frees idle capital: a conservative IDR 38.6 billion (≈ US$2.4 million) a year, paid back within the first year."
Metrik non-finansial: fill rate item S (safety/SIL) target 99%; lebih sedikit trip/flaring tak terencana; pengetahuan "part apa untuk PM/TA" tersimpan di sistem; disposal dead stock bertanggung jawab.

## 2. Technical lens (kriteria B, D, E)
### 2.1 As-is → to-be
| | As-is | To-be |
|---|---|---|
| Data pabrik (sensor, historian) | Tidak dipakai untuk stok | Tidak diperlukan di fase 1 (justifikasi: data case cukup); fase 4: sinyal predictive maintenance |
| Data enterprise (CMMS, ERP, procurement, dokumen) | SAP MM/PM/PUR terpisah; Mplan tanpa link part; harga hanya di PO | Satu model data SQLite: FuncLoc ↔ BoM ↔ movement ↔ notif ↔ PM ↔ PO; batch harian read-only |
| Siapa mengolah, berapa lama | Planner di Excel, ±2 jam/SKU kritikal + 1–3 hari approval (asumsi) | Otomatis tiap malam; planner ±10 menit + approval < 1 jam |
| Cara keputusan diambil | Stok ≤ Min → PR; pengalaman; email | Action Queue ter-ranking risk × cost; Approve/Reject + alasan; audit trail |

### 2.2 Teknologi yang diusulkan
| Lapisan | Teknologi | Kenapa ini (vs alternatif) | Tampil di prototype? |
|---|---|---|---|
| Akuisisi & integrasi data | Python/pandas ETL → SQLite (prod: extract SAP batch) | Brief mewajibkan SQLite; read-only = aman | Ya (DB dari 6 file case) |
| Analitik / AI | Syntetos–Boylan ADI/CV² · tournament Croston-SBA / TSB / adaptive MA · planned demand Mplan→BoM · lead time P50/P90 · ROP = μ·LT + z·σ·√LT (z per criticality) · cost–risk scoring · Claude untuk penjelasan (fallback template) | Model transparan & bisa diaudit; deep learning tidak cocok untuk 17 bln data intermittent | Ya |
| Interaksi (twin, UI) | Next.js control-room UI: Time-machine, Action Queue, SKU detail, Cost–Risk simulator | Juri melihat cerita BF-112, bukan tabel | Ya |
| Keamanan & governance | Read-only, tanpa koneksi OT; RBAC planner/engineer/manager; decision_log; data quality gate | Booklet: transparent, traceable, human oversight, security | Ya (role switch + log) |

### 2.3 Relevansi domain (kriteria E)
| Unit/aset di kasus | Posisi di rantai proses | Istilah teknis yang dipakai |
|---|---|---|
| Cracking furnace BF-101…112 (notif terbanyak: BF-105 114, BF-106 82, BF-112 73) | Hulu cracker | burner cleaning, decoking, refractory, peep door, thermocouple |
| Kompresor/turbin KC-/KT- (thrust pad, rotor blade, journal bearing) | Compression & refrigeration | insurance (capital) spare, OEM single-source, lead time 4–7 bulan |
| Pompa PP-, HE-, control valve | Quench, utilities | seal, gasket, trim set, SIL sensor test, RBI |
| Gudang suku cadang | Enterprise (SAP MM) | Min–Max, MRP Type, safety stock, ROP, service level, turnaround |
Kalimat relevansi (EN): "Every recommendation is tied to a real cracker asset, from the burner-cleaning job on furnace BF-112 to the insurance spares of turbine KT-4, and to the turnaround that tripled parts issues in Nov 2025–Jan 2026."

### 2.4 Kelayakan & risiko (kriteria D)
| Aspek | Risiko | Mitigasi | Standar terkait |
|---|---|---|---|
| Teknis / integrasi | Integrasi SAP lambat | Mulai ekspor batch (sama dengan 6 tabel case), API menyusul | ISO 14224 (data keandalan) |
| Operasional & adopsi SDM | Planner tidak percaya / reduksi stok terlalu agresif | Co-design, champion per plant; stop-buy dulu (bukan disposal); insurance floor untuk S/A | ISO 55000 |
| Legal & regulasi | Harga supplier rahasia; data approver | Akses terbatas; data pribadi minimal | UU PDP No. 27/2022 |
| Cybersecurity & data governance | Kebocoran data; master data buruk (harga hilang 6.231 SKU, MRP Type salah 1.683) | Tanpa OT, RBAC + MFA, harga tidak dikirim ke LLM; data quality gate + data owner per tabel | ISO/IEC 27001, IEC 62443, NIST AI RMF |
| Biaya & payback | Benefit lebih kecil dari estimasi | Konservatif; bila hanya setengah (Rp 19 M/th) payback ±2 tahun, NPV 5 th tetap positif | — |

Roadmap: Discovery & data governance M1 → Pilot M2–M6 (Plant PX, kampanye PM/decoking furnace; gate: WAPE ≤ 80%, SKU kritikal stok 0 ≤ 30, ≥ 70% rekomendasi diputuskan < 48 jam) → Scale M7–M12 (PY & UT, upload parameter ke SAP MM, stock gate di PR) → Enterprise M12+ (pooling antar plant/site, supplier collaboration, integrasi MIND insiden)

## 3. Pelajaran dari pemenang sebelumnya
| Tahun & tema | Pemenang | Pola yang menang |
|---|---|---|
| 2025 · Zero-carbon building (EDGE) | **KonsultanITS** (Juara 1 + Best Presentation): *Housing Strategy*, 3 pilar: Energy Management · Technology Infrastructure (real-time monitoring) · People & Culture. Tim Teknik Kimia + Manajemen Bisnis | Menjawab 3 masalah inti (gap konsumsi energi, tidak ada peta jalan digital, kesadaran karyawan rendah) yang dipetakan ke kriteria standar sertifikasi. Solusi utuh: teknis + manajerial + budaya. Nama strategi + 3 pilar mudah diingat |
| 2024 · Komersialisasi CIRCLO® (plastik untuk aspal) | **Juara 1 Smansasiers UI**: *ACE Strategy* (rantai pasok HDPE, kolaborasi stakeholder, B2B). **Juara 2 Glance UI**: *Hydropave* (produk baru 10% CIRCLO®). **Juara 3 ITB**: sertifikasi, kemitraan, revenue sharing | Model bisnis & ekosistem jelas; produk konkret yang bisa dibayangkan; akronim strategi |

**Terapkan ke solusi kita:**
| Pola juara | Versi kita |
|---|---|
| Nama solusi + akronim / 3 pilar | **MIND Spares** (modul MIND). Pilar: **Predict** (demand intelligence) · **Optimize** (dynamic stock & cost–risk) · **People & Governance** (approval, adopsi, data quality). Alur: Forecast → Optimize → Monitor → Recommend & Act |
| Pilar People & Culture | Planner approve antrian tiap pagi; champion per plant; training 2 jam; KPI tim = fill rate kritikal; badge "zero critical stockout" |
| Dipetakan ke standar/regulasi nyata | ISO 55000, ISO 14224, ISO/IEC 27001, IEC 62443, UU PDP, NIST AI RMF |
| Satu angka dampak besar yang diulang | "116 critical parts at zero stock → IDR 38.6 bn a year (conservative)" |
| Hal yang bisa "dilihat" juri (fitur gong) | **Time-machine replay** ("MIND Spares flagged this 54+ days before the BF-112 job") + **closed loop** (Approve → PR draft → counter) + **what-if** cost–risk slider |

## 4. Opsi solusi
| Opsi | Inti ide | Pilar | Dampak 1–5 | Bisa jadi ≤10 jam 1–5 | Wow 1–5 | Total |
|---|---|---|---|---|---|---|
| A | MIND Spares end-to-end: forecast per kelas + planned demand PM, dynamic Min–Max per criticality, health monitor, action queue + cost–risk + time-machine | Reliability | 5 | 4 | 5 | **14** |
| B | Dashboard inventory health + alert Min–Max saja | Reliability | 3 | 5 | 2 | 10 |
| C | 3D twin furnace dengan status kesiapan part + chatbot LLM | Reliability, Knowledge | 3 | 2 | 5 | 10 |

Dipilih: **A**. 3D twin dari C hanya opsi "Could" bila waktu tersisa.

## 5. Keputusan terkunci (input untuk `/spec`)
- Nama + tagline (EN): **MIND Spares** — "Right part, right place, right time, at the right cost."
- One-liner: "MIND Spares helps materials planners to reorder, keep, reduce or watch each spare part before the job needs it, so that critical SKUs at zero stock fall from 116 to ≤ 30 and excess inventory drops 10% in a 6-month pilot."
- 3 pilar: Predict · Optimize · People & Governance
- Fitur gong: Time-machine replay + closed loop human-in-the-loop (pendukung: what-if cost–risk simulator)
- 2–3 fitur inti: (1) Action Queue + SKU detail (forecast, dynamic Min/Max/SS/ROP, "Why?", Approve → PR draft) · (2) Inventory Health (stockout/overstock/slow/non-moving/insurance/data-quality) · (3) Cost–Risk simulator (slider service level per criticality)
- Alur demo (5 langkah): normal (Control Tower, 1 Jul 2026, tampilan Min–Max statis terlihat rutin) → masalah muncul (geser ke 1 Agu 2026: stok VALVE,GATE,4IN,800# 4100034704 (crit S) ±4 < Min 7 dan terus turun ke 0 akhir Sep; burner cleaning BF-112 7 Okt & BF-111 14 Okt butuh part ini; PO terbuka baru tiba 31 Okt, setelah job; LT median 62 hari → merah, 67 hari sebelum job. Kenyataannya PR baru dibuat 11 Agu dan tiba 4 Okt, hanya 3 hari sebelum job) → AI menjelaskan (Why?: PM due, LT P90, kelas demand, service level 99%) → manusia approve (Rina approve, Bima sign-off S → PR draft) → dampak (counter + simulator: thrust pad KT-4 862 unit vs butuh 2 → stop-buy; total konservatif Rp 38,6 M/th)
- Asumsi & pertanyaan terbuka: PO-Item Amount = harga satuan · criticality S tertinggi · order 203/209 = TA/kampanye · stok BoM = snapshot 30 Sep 2026 (stok historis direkonstruksi mundur dari issue & PO delivery) · PR PO berisi 5.420 baris duplikat persis → selalu dedup sebelum menghitung spend/lead time · furnace-day loss US$ 50–100k · SQLite di Vercel: bundel read-only + Turso/`/tmp` untuk decision_log · konfirmasi slide 6 Conclusion & batas 7 slide ke panitia