# 18 · Production Forecast → Margin View

Pilar **Smart Manufacturing & Energy Intelligence** (booklet: *production forecasting*).

Forecast produksi yang **langsung terlihat dampak finansialnya**: volume forecast × spread produk
→ margin forecast, dibandingkan dengan rencana → **margin at risk**.

```
margin            = volume × spread          (spread = harga − biaya variabel per ton)
margin at risk    = Σ (rencana − P50)⁺ × spread
downside          = Σ (rencana − P10)⁺ × spread
```

Hanya `react` — SVG murni, forecast dihitung di browser. Modul mandiri di `src/features/production-margin`.

## Menjalankan demo

```bash
cd 18-production-margin
npm install
npm run dev
npm test
```

| Slider | Efek |
| --- | --- |
| Horizon | 1–12 bulan ke depan |
| Shock spread produk | simulasi pelemahan/penguatan harga (mis. −20 % spread polimer) |
| Interval keyakinan | 80 / 90 / 95 % → lebar pita fan chart & definisi downside |

Klik baris produk untuk ringkasan (volume vs rencana, tren model).

## Model forecast

- **Holt linear dengan damping** (`alpha=0.4, beta=0.1, phi=0.95`, bisa diubah) per produk.
- Interval prediksi dari σ galat one-step: `σ_h = σ · √(1 + Σ_{j<h} (α(1 + jβ))²)`, lalu dipotong ke
  `[0, capacity]`.
- Total plant: P10/P90 dijumlah langsung (asumsi korelasi sempurna antar produk — konservatif,
  karena semuanya bergantung pada cracker yang sama).
- Margin at risk dihitung **per produk** lalu dijumlah, sehingga produk yang melebihi rencana
  tidak menutupi kekurangan produk lain (berbeda dengan garis total di grafik).

Ganti dengan model sendiri (Prophet, LSTM, dll.)? Cukup kirim angka P10/P50/P90 ke `productMargin`
— atau langsung pakai `MarginFan` dengan data `months` milik sendiri.

## Struktur

```
src/features/production-margin/   ← MODUL MANDIRI
├── index.js
├── ProductionMargin.jsx           komponen jadi (+ MarginFan)
├── forecast.js                    logika murni: holt, forecast, productMargin, portfolioMargin, monthLabel
├── forecast.test.js
└── production-margin.css          prefix pm-
```

## Integrasi

```jsx
import { ProductionMargin } from './features/production-margin'

const products = [{ id: 'pp', name: 'Polypropylene', unit: 'PP plant',
  history: [46_500, 46_100, …],        // t/bulan dari MES / historian
  capacity: 50_000, plan: 48_500,      // plan: angka atau array per bulan (S&OP)
  price: 1_060, variableCost: 900 }]   // atau langsung `spread` (angka / array per bulan)

<ProductionMargin products={products} startMonth="2024-11" horizon={6}
  spreadShock={-0.1} coverage={0.8} onSelect={(row) => …} />
```

| Prop | Keterangan |
| --- | --- |
| `startMonth` | bulan data pertama (`YYYY-MM`) untuk label sumbu |
| `horizon` | jumlah periode forecast |
| `coverage` | 0.8 / 0.9 / 0.95 |
| `spreadShock` | fraksi perubahan spread (−0.2 = −20 %) |
| `historyShown` | jumlah periode riwayat di grafik (default 12) |
| `selectedId`, `onSelect(row)` | pilih produk |
