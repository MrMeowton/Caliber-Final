# REFERENCE — Domain & rumus KPI (tetap, tidak diisi)

> Untuk tim saat mengisi `CASE.md` (unggah ke Project Claude chat). Claude Code TIDAK perlu membaca file ini.

## 1. Chandra Asri (dari guidebook)
- Kompleks petrokimia terintegrasi **pertama dan terbesar di Indonesia** (Cilegon, Banten).
- Menyiapkan pabrik **Chlor-Alkali (CA)** dan **Ethylene Dichloride (EDC)**.
- Bisnis infrastruktur: listrik, air, logistik, pelabuhan & penyimpanan. Fasilitas di Pulau Bukom & Jurong, Singapura.
- Grand theme 2026: *Future-Ready Operational Excellence: Knowledge, Reliability, and Energy Intelligence.*
- Kasus preliminary (pasti tidak muncul lagi): Case 1 Knowledge Hub, Case 2 Manufacturing Intelligence.

## 2. Rantai proses
```
Naphtha ─► Naphtha Cracker (furnace → quench → compression → cold section)
             ├─ Ethylene ──► Polyethylene (PE) · (rencana) EDC
             ├─ Propylene ─► Polypropylene (PP)
             ├─ C4 ────────► Butadiene
             └─ Py-gas ────► (aromatics / styrene)
Utilitas: steam, listrik, air pendingin, flare
```

## 3. Aset & isu tipikal
| Aset | Isu yang sering jadi kasus |
|---|---|
| Furnace cracking | Coking → decoking (downtime), fuel gas, CO₂, NOx |
| Cracked gas & refrigeration compressor | Trip = flaring + kehilangan produksi; bearing, seal, surge |
| Pompa, fan, extruder/gearbox | Kegagalan bearing/seal; suku cadang lead time panjang |
| Reaktor & extruder PE/PP | Grade changeover, off-spec, beban listrik |
| Utilitas (boiler, power, air) | Steam balance, intensitas energi, emisi Scope 1/2 |
| Gudang suku cadang (ERP) | Overstock part non-kritis, stockout part kritis (lead time 3–6 bulan) |

## 4. Istilah
| Istilah | Arti |
|---|---|
| COT | Coil Outlet Temperature furnace; makin tinggi = konversi naik, coking naik |
| Steam/HC ratio | Rasio dilution steam : hidrokarbon; menekan coking, menambah energi |
| Decoking / TA | Pembersihan kokas / turnaround (shutdown besar terencana) |
| Flaring | Pembakaran gas saat upset; kerugian produk + emisi |
| SEC / energy intensity | Energi per ton produk (GJ/t) |
| OEE, MTBF, MTTR | Efektivitas aset, waktu rata-rata antar kegagalan, waktu rata-rata perbaikan |
| Criticality A/B/C | Kelas kekritisan aset/part (A = gagal menghentikan produksi) |
| Historian (PI), DCS | Database time-series sensor, sistem kontrol |
| CMMS / ERP (SAP PM/MM) | Work order / stok & pembelian |
| PTW, LOTO, HAZOP, PSM | Izin kerja, isolasi energi, studi bahaya, manajemen keselamatan proses |
| Scope 1/2/3 | Emisi langsung / dari energi dibeli / rantai nilai |
| Purdue model, IEC 62443 | Segregasi jaringan IT/OT, standar keamanan siber industri |
| Digital twin | Representasi virtual aset yang tersinkron dengan data nyata |

## 5. Standar untuk slide Feasibility (sebut yang relevan)
ISO 55000 (manajemen aset) · ISO 14224 (data keandalan) · ISO 50001 (energi) · ISO 14064 / GHG Protocol (emisi) · ISO/IEC 27001 & IEC 62443 (keamanan) · UU PDP No. 27/2022 (data pribadi) · PROPER KLHK.

## 6. Rumus KPI
| Area | KPI | Rumus |
|---|---|---|
| Reliability | Availability | `uptime / (uptime + downtime)` |
| | OEE | `Availability × Performance × Quality` |
| | MTBF / MTTR | `jam operasi / jumlah kegagalan` / `jam perbaikan / jumlah perbaikan` |
| | Biaya unplanned downtime | `jam × rate (t/jam) × margin (USD/t) + biaya perbaikan + biaya flaring` |
| Suku cadang | Nilai persediaan | `Σ stok × harga satuan` |
| | Biaya simpan | `nilai persediaan × carrying rate (15–25%/th)` |
| | Fill rate part kritis | `permintaan class-A terpenuhi dari stok / total permintaan class-A` |
| | Overstock | `stok − (pemakaian/th × lead time/365 + safety stock)` |
| Energi | Intensitas energi | `(fuel GJ + steam t × 2,8 + listrik MWh × 3,6) / produksi t` |
| | CO₂e | `fuel GJ × 0,0561 + steam t × 0,175 + listrik MWh × 0,87` |
| | Hemat energi | `ΔGJ/t × produksi t/th × harga USD/GJ` |
| Produksi | Akurasi forecast | `1 − MAPE` |
| Knowledge | Hemat jam kerja | `menit dihemat × pencarian/hari × user × 250 / 60 × USD/jam` |
| Umum | Payback | `biaya implementasi / manfaat bersih per bulan` |

**Asumsi default** (ganti bila kasus memberi angka; tulis "assumption" di slide): kurs 16.000 IDR/USD · margin 300 USD/t · energi 8 USD/GJ · karbon 10 USD/tCO₂e · carrying rate 20%/th.
