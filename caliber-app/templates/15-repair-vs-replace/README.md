# 15 · Repair vs Replace Advisor

Pilar **Reliability** — keputusan **capex** untuk aset yang menua, dalam bahasa manajemen:
**NPV, IRR, payback (sederhana & terdiskonto), EAC, dan capex break-even**.

Hanya `react`. Modul mandiri di `src/features/repair-replace`.

## Menjalankan demo

```bash
cd 15-repair-vs-replace
npm install
npm run dev
npm test
```

Slider: capex pengganti, discount rate (WACC), horizon, lost margin/jam, laju kenaikan kegagalan.
Kartu rekomendasi berubah otomatis; garis kumulatif menunjukkan titik **balik modal**.

## Model

Kedua opsi dihitung sebagai arus kas **biaya** (tahun 0..H):

| Komponen | Repair / overhaul | Replace |
| --- | --- | --- |
| Tahun 0 | `upfront` (overhaul) | `upfront` (capex) − `salvageNow` + `installDowntimeHours × margin` |
| Tahun t | O&M + kegagalan × jam downtime × margin + energi (tumbuh per `…Growth`) | sama, dengan parameter aset baru |
| Akhir horizon | — | − nilai sisa garis lurus `capex × (1 − H/life)` |

Selisih `repair − replace` = penghematan karena mengganti:

| KPI | Arti |
| --- | --- |
| NPV incremental | > 0 → **ganti** |
| IRR | dibandingkan dengan hurdle (discount rate) |
| Payback / discounted payback | tahun (interpolasi) sampai kumulatif ≥ 0 |
| EAC | `PV biaya × CRF(r, H)` — biaya ekuivalen per tahun tiap opsi |
| Capex break-even | capex maksimum agar NPV = 0 (memperhitungkan nilai sisa) |

## Struktur

```
src/features/repair-replace/    ← MODUL MANDIRI
├── index.js
├── RepairReplaceAdvisor.jsx     komponen jadi (+ CumulativeCostChart, AnnualBreakdown)
├── finance.js                   logika murni: analyze, npv, irr, payback, crf, costStream
├── finance.test.js
└── repair-replace.css           prefix rr-
```

## Integrasi

```jsx
import { RepairReplaceAdvisor, analyze } from './features/repair-replace'

const input = {
  discountRate: 0.1, horizonYears: 10, lostMarginPerHour: 6_000,
  repair:  { upfront: 380_000, opex: 120_000, opexGrowth: 0.08, failuresPerYear: 1.6,
             failureGrowth: 0.12, downtimeHoursPerFailure: 14, energyCost: 640_000, energyGrowth: 0.03 },
  replace: { upfront: 2_400_000, salvageNow: 60_000, installDowntimeHours: 36, life: 25, opex: 45_000,
             failuresPerYear: 0.3, downtimeHoursPerFailure: 10, energyCost: 470_000, energyGrowth: 0.03 },
}

<RepairReplaceAdvisor input={input} assetName="P-501" labels={{ repair: 'Overhaul', replace: 'Ganti baru' }} />
```

`failuresPerYear` & `failureGrowth` bisa diisi dari model reliabilitas (mis. Weibull / RUL) di modul lain.
Tanpa UI: `analyze(input)` → `{ npv, irr, payback, discountedPayback, eacKeep, eacSwap, breakEvenCapex, verdict, years }`.
