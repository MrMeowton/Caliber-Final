# 02 — KPI Library + Kalkulator Dampak Bisnis

> Atas = rumus referensi (tetap). Bawah = **kalkulator yang diisi hari H** → angka KPI yang ditampilkan di prototype.

## Rumus referensi
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
| | Schedule adherence | `aktual / rencana` |
| Knowledge | Hemat jam kerja | `menit dihemat × pencarian/hari × user × 250 / 60 × USD/jam` |
| Umum | Payback | `biaya implementasi / manfaat bersih per bulan` |

## Asumsi (ganti dengan angka dari kasus bila ada)
| Parameter | Nilai | Sumber |
|---|---|---|
| Kurs | 16.000 IDR/USD | [ISI: cek kurs hari H] |
| Margin produk | 300 USD/t | [ISI: dari kasus, atau tulis "assumption"] |
| Rate produksi unit | [ISI] t/jam | [ISI] |
| Harga energi | 8 USD/GJ | asumsi |
| Harga karbon | 10 USD/tCO₂e | asumsi |
| Carrying rate | 20%/th | asumsi |
| [ISI: parameter lain dari kasus] | [ISI] | [ISI] |

## Kalkulator dampak (diisi hari H, maks. 3 KPI)
| # | KPI | Baseline | Target | Δ | Rumus | Nilai/th (USD) | Asumsi kunci |
|---|---|---|---|---|---|---|---|
| 1 | [ISI] | [ISI] | [ISI] | [ISI] | [ISI] | [ISI] | [ISI] |
| 2 | [ISI] | [ISI] | [ISI] | [ISI] | [ISI] | [ISI] | [ISI] |
| 3 | [ISI] | [ISI] | [ISI] | [ISI] | [ISI] | [ISI] | [ISI] |
| | **Total manfaat/th** | | | | | **[ISI]** | |

Perhitungan lengkap (tunjukkan angka masuk ke rumus):
```
KPI 1: [ISI]
KPI 2: [ISI]
KPI 3: [ISI]
```
Success metrics non-finansial (keselamatan, emisi, SDM): [ISI]
