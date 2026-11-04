# 10 · Knowledge-at-Risk Map

Pilar **Knowledge** (booklet: *technical knowledge retention, preserve critical plant knowledge*).

Matriks **aset/prosedur kritis × engineer** yang menunjukkan pengetahuan mana yang hanya dikuasai
1–2 senior. Risiko suksesi SDM jadi **angka**: bus factor, status (Yatim / Kritis / Tipis / Aman),
dan **US$ at risk** — bahasa yang dipahami manajemen dan HR.

Hanya `react` — tanpa library tabel/chart. Modul mandiri di `src/features/knowledge-risk`.

## Menjalankan demo

```bash
cd 10-knowledge-risk-map
npm install
npm run dev      # http://localhost:5173
npm test         # tes logika (node --test)
```

| Interaksi | Hasil |
| --- | --- |
| Klik **nama engineer** | Simulasi "dia resign besok" — sel bergaris merah, bus factor turun, baris naik ke atas |
| Slider **Horizon pensiun** | Orang yang pensiun ≤ N bulan otomatis dianggap pergi (⌛) |
| Slider **Dianggap kompeten mulai** | Ambang level yang dihitung ke bus factor |
| Klik baris | Detail: siapa yang tersisa + **calon penerus** (satu level di bawah) |
| Panel bawah | Ranking orang paling tak tergantikan (tambahan US$ at risk jika dia pergi) |

## Model

| Istilah | Rumus |
| --- | --- |
| Bus factor | jumlah orang dengan level ≥ `minLevel` yang **tidak** pergi dalam horizon |
| Eksposur | `[1, 0.6, 0.25, 0.05]` untuk bus factor 0 / 1 / 2 / ≥3 (bisa ditimpa `exposure`) |
| Risk score | `kritikalitas/5 × eksposur × 100` → urutan baris |
| US$ at risk | `valueAtRisk × eksposur` |
| US$ jika X pergi | selisih total US$ at risk dengan & tanpa X |

## Struktur

```
src/
├── App.jsx                     DEMO: slider horizon/level, panel detail
├── demo/data.js                DEMO: 10 aset/prosedur, 7 engineer (fiktif)
└── features/knowledge-risk/    ← MODUL MANDIRI — salin folder ini
    ├── index.js                pintu masuk
    ├── KnowledgeRiskMap.jsx    komponen jadi (+ KnowledgeSummary, PeopleImpact, StatusBadge)
    ├── risk.js                 logika murni: assessAll, personImpact, summarize
    ├── risk.test.js
    └── knowledge-risk.css      gaya ber-prefix kr-
```

## Integrasi

```bash
cp -r 10-knowledge-risk-map/src/features/knowledge-risk <project-utama>/src/features/
```

```jsx
import { KnowledgeRiskMap } from './features/knowledge-risk'

const people = [{ id: 'har', name: 'Pak Hartono', role: 'Sr. Rotating', retireInMonths: 8 }, …]
const items  = [{ id: 'c301', name: 'Kompresor C-301', area: 'Cracker', criticality: 5,
                  valueAtRisk: 4_800_000, holders: { har: 3, ayu: 1 } }, …]   // dari skill-matrix HR / LMS

<KnowledgeRiskMap items={items} people={people} horizonMonths={12} onSelect={(row) => …} />
```

| Prop | Keterangan |
| --- | --- |
| `items`, `people` | data (lihat di atas); field lain diteruskan ke `row` |
| `minLevel` | level minimal dianggap kompeten (default 2) |
| `horizonMonths` | pensiun dalam N bulan dianggap pergi (default 12) |
| `absent`, `onAbsentChange` | daftar id yang disimulasikan pergi (terkontrol); kosongkan = state internal |
| `selectedId`, `onSelect(row)` | pilih baris |
| `showSummary`, `showPeople` | nyalakan/matikan bagian |

Tanpa UI: `assessAll(items, people, { horizonMonths, absent })` dan `personImpact(...)` bisa
dipakai di backend untuk alert ("SIS trip test hanya dikuasai 1 orang").
