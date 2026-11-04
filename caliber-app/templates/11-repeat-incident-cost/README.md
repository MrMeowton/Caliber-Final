# 11 · Repeat-Incident Cost Counter

Pilar **Knowledge** (booklet: *preserve critical plant knowledge*).

Counter US$ untuk **insiden yang terulang padahal sudah pernah di-RCA** — bukti finansial bahwa
pelajaran ada tetapi tidak tersebar. Inilah angka yang membuktikan nilai *knowledge retention*.

Hanya `react` — grafik SVG murni. Modul mandiri di `src/features/repeat-incident`.

## Menjalankan demo

```bash
cd 11-repeat-incident-cost
npm install
npm run dev
npm test
```

| Interaksi | Hasil |
| --- | --- |
| **▶ Replay** | Waktu maju dari Jan 2025 → counter berputar naik tiap ada pengulangan |
| Slider **Lihat sampai** | Potong data di tanggal tertentu (RCA yang belum selesai belum dihitung) |
| Slider **Efektivitas** | Porsi biaya berulang yang bisa dicegah → KPI "bisa dicegah" |
| Klik baris signature | Detail: kapan RCA selesai, terulang berapa kali, berapa US$ |

## Aturan klasifikasi

Insiden dikelompokkan per **signature** = `aset | mode kegagalan` (bisa diganti `keyFn`), lalu
diurutkan menurut waktu:

| Jenis | Aturan |
| --- | --- |
| `first` | kejadian pertama signature itu |
| `repeatNoRca` | berulang, tapi belum ada RCA yang **selesai** sebelum tanggal kejadian |
| `repeatAfterRca` | berulang **setelah** RCA selesai → dihitung ke counter |

Biaya insiden = `downtimeHours × lostMarginPerHour + repairCost (+ otherCost)`.

## Struktur

```
src/features/repeat-incident/    ← MODUL MANDIRI
├── index.js
├── RepeatIncidentCounter.jsx     komponen jadi (+ CumulativeChart)
├── useTween.js                   hook angka berputar (rAF)
├── repeat.js                     logika murni: classify, groupBySignature, summarize, cumulative
├── repeat.test.js
└── repeat-incident.css           prefix ri-
```

## Integrasi

```jsx
import { RepeatIncidentCounter } from './features/repeat-incident'

// dari CMMS / SAP PM (notifikasi) + register RCA
const incidents = [
  { id: 'INC-1', date: '2025-02-10', asset: 'C-301', failureMode: 'Bearing aus',
    downtimeHours: 30, lostMarginPerHour: 42_000, repairCost: 85_000,
    rca: { date: '2025-03-03' } },            // null jika tidak di-RCA
]

<RepeatIncidentCounter incidents={incidents} effectiveness={0.6} onSelect={(group) => …} />
```

| Prop | Keterangan |
| --- | --- |
| `incidents` | daftar insiden (format di atas) |
| `until` | tanggal batas (replay / filter periode) |
| `effectiveness` | 0..1, porsi pengulangan yang bisa dicegah |
| `keyFn(incident)` | cara membentuk signature (mis. `i => i.failureMode` lintas aset) |
| `selectedKey`, `onSelect(group)` | pilih signature |

Hanya butuh angkanya? `summarize(classify(incidents))` → `{ repeatCost, avoidable, share, … }` untuk
kartu KPI di dashboard utama.
