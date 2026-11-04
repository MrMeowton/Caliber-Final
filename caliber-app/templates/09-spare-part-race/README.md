# 09 · Spare-Part Race Timeline

Satu fitur saja: **balapan antara kegagalan aset dan kedatangan spare part**. Setiap aset
punya **dua garis waktu** pada sumbu yang sama:

- ⚙ **Aset** — hari ini → perkiraan gagal (✕ = P50) dengan jendela ketidakpastian P10–P90 (arsir kuning)
- 📦 **Part** — dipesan → part tiba (●), dihitung dari lead time / ETA supplier

Kalau part tiba **setelah** aset gagal, celah di antaranya diwarnai **merah berdenyut** —
itulah hari pabrik mati menunggu part (plus eksposur biayanya).

Hanya `react` — tanpa library chart/tanggal. Dikemas sebagai **modul mandiri**
(`src/features/spare-part-race`) yang tinggal disalin ke project hackathon.

## Menjalankan demo

```bash
cd 09-spare-part-race
npm install
npm run dev      # buka http://localhost:5173
npm test         # tes logika (node --test, tanpa dependensi)
```

| Interaksi | Hasil |
| --- | --- |
| Slider **Geser hari ini** | Majukan waktu — part yang belum dipesan ikut mundur; lihat aset berubah dari aman → mepet → terlambat |
| Slider **Buffer instalasi** | Jeda minimum (hari) antara part tiba dan skenario gagal terburuk |
| Klik baris / `Enter` | Pilih aset → panel detail (dikirim ke host lewat `onSelect`) |
| Panel: slider **Lead time**, **Degradasi** | What-if: expedite pengiriman, atau model memprediksi gagal lebih cepat/lambat |
| **Pesan sekarang** / **Expedite −N hari** | Satu klik untuk mengubah status jadi aman (N dihitung otomatis) |

## Status

| Status | Aturan | Warna |
| --- | --- | --- |
| **Terlambat** | part tiba > perkiraan gagal (P50) | merah + celah downtime |
| **Mepet** | part tiba di dalam jendela gagal (> P10 − buffer) | kuning |
| **Aman** | part tiba ≥ buffer hari sebelum P10 | hijau |

Untuk part yang belum dipesan, bendera hijau di garis part = **batas pesan paling lambat**
(P10 − lead time − buffer); berubah merah kalau sudah lewat.

## Struktur

```
src/
├── App.jsx                       DEMO: slider waktu, panel detail + what-if
├── demo/assets.js                DEMO: 6 aset petrokimia ilustratif
└── features/spare-part-race/     ← MODUL MANDIRI — salin folder ini
    ├── index.js                  pintu masuk (impor HANYA dari sini)
    ├── RaceTimeline.jsx          siap pakai: ringkasan + legenda + sumbu + baris
    │                             (RaceRow, RaceAxis, RaceSummary, RaceLegend, StatusBadge juga diekspor)
    ├── race.js                   logika murni: status, slack, batas pesan, expedite, sumbu waktu
    ├── race.test.js              tes logika
    └── race.css                  gaya ber-prefix sr-
```

## Integrasi ke project utama

```bash
cp -r 09-spare-part-race/src/features/spare-part-race  <project-utama>/src/features/
# tidak ada dependensi tambahan selain react
```

### Cara 1 — pakai komponen jadi

```jsx
import { RaceTimeline } from './features/spare-part-race'

// failure: dari model prediktif (RUL). part: dari ERP / SAP MM.
const items = [
  {
    id: 'C-301',
    asset: 'Kompresor C-301',
    failure: { p10: 9, p50: 14, p90: 21 },              // angka = hari dari sekarang, atau tanggal
    part: { name: 'Bearing thrust DE', leadTimeDays: 28 },
    downtimeCostPerDay: 4_200_000_000,
  },
  {
    id: 'P-205B',
    asset: 'Pompa P-205B',
    failure: { p50: '2026-11-25' },                      // P10/P90 opsional (default ±20 % sisa umur)
    part: { name: 'Mechanical seal', orderedAt: '2026-10-31', leadTimeDays: 21 },
  },
]

<RaceTimeline items={items} bufferDays={3} onSelect={(race) => openDetail(race)} />
```

| Prop | Keterangan |
| --- | --- |
| `items` | `[{ id, asset?, failure, part, downtimeCostPerDay? }]` — field lain ikut diteruskan ke `race` |
| `now` | "hari ini" (ms / Date). Default saat komponen dipasang — isi untuk replay / simulasi |
| `bufferDays` | jeda minimum sebelum skenario gagal terburuk (default 3) |
| `range` | `[startMs, endMs]` sumbu waktu; default otomatis memuat semua garis |
| `selectedId`, `onSelect(race \| null)` | mode terkontrol, atau biarkan kosong untuk mode bebas |
| `showSummary`, `showLegend` | nyalakan/matikan bagian tampilan |
| `renderMeta(race)` | slot tambahan di kolom info tiap baris (mis. tombol "Buat PO") |
| `locale`, `emptyText` | format tanggal & teks kosong |

Field `failure`: `p50` wajib; `p10`, `p90` opsional. Field `part` (prioritas atas → bawah):

| Field | Arti |
| --- | --- |
| `inStock` (+ `stockSince`) | part sudah di gudang |
| `eta` | tanggal tiba dari supplier — mengalahkan perhitungan lead time |
| `orderedAt` + `leadTimeDays` | tiba = tanggal pesan + lead time |
| hanya `leadTimeDays` | belum dipesan → disimulasikan "kalau dipesan hari ini" (garis putus-putus) |

Semua tanggal menerima `Date`, string ISO, ms, atau **angka kecil = hari dari `now`**.

### Cara 2 — rakit sendiri

```jsx
import { computeRaces, summarize, raceWindow, RaceRow, RaceAxis } from './features/spare-part-race'

const races = computeRaces(items, { now, bufferDays: 3 })   // urut: terlambat → mepet → aman
const range = raceWindow(races, { now })
// tiap race: status, failAt, arriveAt, slackDays, waitDays, orderBy, expediteDays, exposure, …

<RaceAxis range={range} now={now} />
{races.map((r) => <RaceRow key={r.id} race={r} range={range} />)}
```

Mis. tampilkan satu `RaceRow` saja di panel detail aset 3D, atau kirim `summarize(races)` ke KPI
dashboard. `race.js` tidak bergantung pada React — bisa dipakai di backend Node untuk alert
("part C-301 akan terlambat 14 hari").

## Cara kerjanya

- **Satu sumbu, dua lintasan.** Posisi dihitung sebagai persen rentang waktu (`pct`), jadi layout
  murni CSS — responsif tanpa mengukur DOM. Garis "hari ini" menembus kedua lintasan.
- **Ketidakpastian ditampilkan, bukan disembunyikan.** Status "mepet" memakai P10 (skenario
  terburuk), "terlambat" memakai P50 — sehingga keputusan pemesanan konservatif tapi tidak panik.
- **Angka yang bisa ditindaklanjuti.** `orderBy` (batas pesan), `expediteDays` (berapa hari lead
  time harus dipangkas), `waitDays × downtimeCostPerDay` (eksposur rupiah).
- **Transisi.** `left`/`width` dianimasikan CSS (420 ms) — slider what-if terasa hidup tanpa loop
  JS. Menghormati `prefers-reduced-motion`.
- **Aksesibel.** Tiap baris bisa difokus (`Tab`), dipilih dengan `Enter`, dan punya `aria-label`
  berisi ringkasan kalimat lengkap.
