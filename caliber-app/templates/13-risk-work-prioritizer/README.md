# 13 · Risk-Based Work Prioritizer

Pilar **Reliability** (booklet: *predictive maintenance, anomaly detection* → "prioritize alerts").

Setiap alert / work order diberi harga dalam US$, lalu backlog diisi ke **kapasitas crew** yang
terbatas. Ini keputusan **alokasi resource**, bukan sekadar daftar alarm.

```
US$ at risk = P(failure) × (lost margin/jam × MTTR + biaya repair)
```

Hanya `react`. Modul mandiri di `src/features/work-prioritizer`.

## Menjalankan demo

```bash
cd 13-risk-work-prioritizer
npm install
npm run dev
npm test
```

| Interaksi | Hasil |
| --- | --- |
| Slider **Kapasitas crew** | Jam kerja tersedia; WO yang tidak muat menjadi "Tunda" |
| Tab strategi | Optimal · US$ per jam · US$ at risk · Severity alarm · FIFO |
| Panel bawah | US$ risiko dipensiunkan tiap strategi pada kapasitas yang sama (+ selisih vs FIFO) |
| Klik baris | Rincian rumus untuk WO itu |

## Strategi

| Kunci | Cara | Catatan |
| --- | --- | --- |
| `optimal` | knapsack 0/1 eksak (DP, resolusi 0,5 jam) | selalu ≥ strategi lain — rekomendasi |
| `ratio` | greedy US$ dipensiunkan ÷ jam | cepat, bisa meleset di kasus WO besar |
| `risk` | US$ at risk terbesar dulu | |
| `severity` | prioritas alarm DCS, lalu umur | cara banyak plant hari ini |
| `fifo` | yang masuk duluan | baseline |

Mengerjakan WO menurunkan P ke `pAfter` (default 0) → *risiko dipensiunkan* = `(P − pAfter) × konsekuensi`.

## Struktur

```
src/features/work-prioritizer/   ← MODUL MANDIRI
├── index.js
├── WorkPrioritizer.jsx           komponen jadi (+ StrategyCompare)
├── prioritize.js                 logika murni: scoreOrder, plan, knapsack, compareStrategies
├── prioritize.test.js
└── work-prioritizer.css          prefix wp-
```

## Integrasi

```jsx
import { WorkPrioritizer } from './features/work-prioritizer'

// pFailure dari model prediktif (mis. modul anomaly/RUL); margin & MTTR dari finance + CMMS
const orders = [{ id: 'A-1182', title: 'Vibrasi naik', asset: 'C-301', source: 'alert', severity: 2,
  pFailure: 0.18, lostMarginPerHour: 42_000, mttrHours: 36, repairCost: 85_000, laborHours: 16,
  createdAt: '2026-10-29' }]

<WorkPrioritizer orders={orders} capacityHours={40} onSelect={(row) => …} />
```

| Prop | Keterangan |
| --- | --- |
| `capacityHours` | jam kerja crew yang tersedia |
| `strategy`, `onStrategyChange` | terkontrol (opsional) |
| `baseline` | strategi pembanding (default `fifo`) |
| `selectedId`, `onSelect(row)` | pilih baris |
| `showCompare` | tampilkan perbandingan strategi |

Backend: `plan(orders, { capacityHours, strategy: 'optimal' }).rows.filter(r => r.scheduled)`
→ daftar WO untuk dikirim ke SAP PM.
