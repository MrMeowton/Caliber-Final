# 17 · MACC — Marginal Abatement Cost Curve

Pilar **Smart Manufacturing & Energy Intelligence** (booklet: *efficient resource utilization,
energy and emissions*).

Alat standar manajemen untuk memilih investasi efisiensi: semua peluang hemat energi/emisi
diurutkan dari **biaya per tCO₂e** termurah. Lebar batang = tCO₂e yang dikurangi per tahun,
tinggi = US$/tCO₂e. Batang di bawah nol **menghasilkan uang**.

```
MAC = (capex × CRF(r, umur) + Δopex − penghematan energi) / abatement tahunan
```

Hanya `react` — SVG murni. Modul mandiri di `src/features/macc`.

## Menjalankan demo

```bash
cd 17-macc
npm install
npm run dev
npm test
```

| Kontrol | Efek |
| --- | --- |
| Harga karbon | garis merah — proyek di bawahnya layak |
| Discount rate | anualisasi capex (proyek capex besar paling sensitif) |
| Anggaran capex | proyek dipilih dari kiri sampai anggaran habis |
| Target abatement | garis kuning — berhenti memilih setelah target tercapai |
| Hanya yang ≤ harga karbon | jangan pilih proyek yang lebih mahal dari harga karbon |
| Klik batang / kartu | rincian MAC, capex anualisasi, penghematan energi |

Proyek dengan abatement ≤ 0 (mis. elektrifikasi pada grid berfaktor emisi tinggi) dikeluarkan dari
kurva dan disebutkan di bawah grafik.

## Struktur

```
src/features/macc/      ← MODUL MANDIRI
├── index.js
├── Macc.jsx             komponen jadi (+ MaccChart)
├── macc.js              logika murni: evaluateOpp, buildMacc, crf
├── macc.test.js
└── macc.css             prefix mc-
```

## Integrasi

```jsx
import { Macc } from './features/macc'

const carriers = { fuelGas: { price: 7.5, ef: 0.056 }, power: { price: 85, ef: 0.8 } }
const opportunities = [
  { id: 'o2', name: 'Kontrol O₂ furnace', unit: 'Cracker', capex: 900_000, life: 10,
    energySaved: { fuelGas: 420_000 } },                         // abatement dihitung dari ef
  { id: 'flare', name: 'Flare gas recovery', capex: 6_500_000, life: 20, opexDelta: 250_000,
    annualSavings: 1_100_000, abatement: 48_000 },              // atau isi langsung
]

<Macc opportunities={opportunities} carriers={carriers} discountRate={0.1}
  carbonPrice={30} capexBudget={60e6} target={150_000} onlyEconomic onSelect={(opp) => …} />
```

Pasangan alami **16 Energy & Carbon P&L**: pakai `carriers` yang sama, sehingga perubahan harga
energi di satu tempat menggeser P&L dan MACC sekaligus.
