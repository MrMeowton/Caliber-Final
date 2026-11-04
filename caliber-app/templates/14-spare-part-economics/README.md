# 14 · Spare-Part Economics

Pilar **Reliability** (booklet: *spare-part inventory optimization*; background: *supply-chain readiness*).

Untuk setiap spare part kritis: **biaya menyimpan stok vs biaya downtime jika part tidak ada** →
jumlah stok optimal & **reorder point**, plus dampaknya ke **working capital** (trade-off yang
disukai CFO).

Hanya `react`. Modul mandiri di `src/features/spare-economics`.

## Menjalankan demo

```bash
cd 14-spare-part-economics
npm install
npm run dev
npm test
```

| Interaksi | Hasil |
| --- | --- |
| Slider **Holding rate** | Biaya modal + gudang + asuransi per tahun (% harga part) |
| Slider **Lead time supplier ×** | Simulasi gangguan supply chain → stok optimal naik |
| Slider **Biaya downtime ×** | Margin naik/turun → nilai part kritis berubah |
| Klik baris tabel | Detail part: KPI + kurva biaya (simpan ↑, downtime ↓, total berbentuk U) |

## Model (base-stock Poisson, kebijakan S−1, S)

Setiap part terpakai langsung dipesan ulang satu. Permintaan selama lead time `D ~ Poisson(m)`,
`m = λ · L / 365`.

| Besaran | Rumus |
| --- | --- |
| Rata-rata stok di gudang | `E[(S − D)+]` → biaya simpan = × harga × holding rate |
| Fill rate | `P(D ≤ S − 1)` |
| Rata-rata backorder | `E[(D − S)+] = m − S + E[(S − D)+]` |
| Jam downtime / tahun | `E[BO] × 8760` (hukum Little) — atau, jika `emergencyLeadDays` diisi, `λ × (1 − fill) × emergencyLeadDays × 24` |
| Total biaya | biaya simpan + jam downtime × biaya downtime/jam |
| **S\*** | argmin total biaya; **reorder point = S\* − 1** |

## Struktur

```
src/features/spare-economics/   ← MODUL MANDIRI
├── index.js
├── SpareEconomics.jsx           komponen jadi (+ PortfolioTable, SparePartDetail, CostCurve)
├── economics.js                 logika murni: evaluate, optimize, portfolio, poissonPmf
├── economics.test.js
└── spare-economics.css          prefix se-
```

## Integrasi

```jsx
import { SpareEconomics, SparePartDetail, optimize } from './features/spare-economics'

const parts = [{ id: 'brg-c301', name: 'Bearing thrust DE', asset: 'C-301',
  unitCost: 48_000, annualDemand: 0.25, leadTimeDays: 120, emergencyLeadDays: 18,
  downtimeCostPerHour: 42_000, holdingRate: 0.2, currentStock: 0 }]

<SpareEconomics parts={parts} />                       // portofolio + detail
<SparePartDetail result={optimize(parts[0])} />        // satu part saja (mis. di panel aset)
```

| Prop | Keterangan |
| --- | --- |
| `parts` | daftar part (format di atas; `holdingRate` default 0,2) |
| `selectedId`, `onSelect(id)` | terkontrol (opsional) |
| `showPortfolio` | tampilkan KPI + tabel portofolio |

Cocok dipasangkan dengan **09 Spare-Part Race**: modul ini menentukan berapa stok yang *seharusnya*,
project 09 menunjukkan apakah part *akan tiba tepat waktu*.
