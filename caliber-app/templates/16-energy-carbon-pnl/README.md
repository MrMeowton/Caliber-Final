# 16 · Energy & Carbon P&L per Unit

Pilar **Smart Manufacturing & Energy Intelligence** (booklet: *energy and emissions monitoring*).

Mengubah energi dan emisi menjadi **baris biaya per ton produk** yang bisa dibandingkan antar unit:

```
SEC (GJ/t) × harga energi  →  US$/t produk
emisi (tCO₂e/t) × harga karbon  →  US$/t produk
(SEC − SEC benchmark) × produksi × US$/GJ  →  "bocor" US$/tahun
```

Hanya `react`. Modul mandiri di `src/features/energy-pnl`.

## Menjalankan demo

```bash
cd 16-energy-carbon-pnl
npm install
npm run dev
npm test
```

| Slider | Efek |
| --- | --- |
| Harga fuel gas | ikut menggerakkan harga steam internal (boiler) |
| Tarif listrik | unit polimer (PE/PP) paling sensitif |
| Harga karbon | biaya karbon per unit — siapa paling terpapar regulasi |

Klik bar / judul kolom untuk ringkasan unit.

## Tampilan

1. **KPI plant**: biaya energi, biaya karbon, emisi CO₂e (scope 1+2), bocor vs benchmark.
2. **Bar bertumpuk US$/t**: komposisi per carrier + karbon (arsir).
3. **Laporan P&L**: baris = pos biaya per ton, kolom = unit (format laporan keuangan).

## Struktur

```
src/features/energy-pnl/        ← MODUL MANDIRI
├── index.js
├── EnergyCarbonPnL.jsx          komponen jadi (+ PerTonBars)
├── pnl.js                       logika murni: unitPnl, plantPnl, toGJ
├── pnl.test.js
└── energy-pnl.css               prefix ep-
```

## Integrasi

```jsx
import { EnergyCarbonPnL } from './features/energy-pnl'

const carriers = {
  fuelGas: { label: 'Fuel gas', unit: 'GJ',  price: 7.5, ef: 0.056 },  // tCO₂e per unit
  power:   { label: 'Listrik',  unit: 'MWh', price: 85,  ef: 0.8, color: '#38bdf8' },
}
// energi dari historian/meter (PI, IP.21), produksi dari MES/ERP — periode apa pun (bulan/tahun)
const units = [{ id: 'crk', name: 'Cracker', product: 'Etilena', production: 900_000,
  benchmarkSec: 22, energy: { fuelGas: 19_800_000, power: 260_000 } }]

<EnergyCarbonPnL units={units} carriers={carriers} carbonPrice={30} onSelect={(row) => …} />
```

Unit carrier yang didukung: `GJ`, `MWh`, `MMBtu` (tambahkan di `GJ_PER`). Untuk heatmap pabrik
(project 07) cukup ambil `unitPnl(...).totalPerT` atau `.intensity` sebagai nilai layer.
