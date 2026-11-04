# 07 · Plant Heatmap Overlay

Satu fitur saja: **heatmap overlay di layout pabrik**. Setiap unit di denah diwarnai menurut
**intensitas energi, emisi, atau risiko**, dengan **toggle antar layer**. Warna berpindah mulus
saat layer diganti atau data berubah, unit "panas" memancarkan pendaran ke sekitarnya, dan
unit yang melewati ambang (mis. risiko ≥ 70) diberi cincin merah berdenyut.

Hanya `react` — peta digambar dengan SVG murni, skala warna diinterpolasi sendiri di ruang
**OKLab** (tanpa d3 / library chart). Dikemas sebagai **modul mandiri**
(`src/features/heatmap`) yang tinggal disalin ke project hackathon.

## Menjalankan demo

```bash
cd 07-plant-heatmap
npm install
npm run dev      # buka http://localhost:5173
```

| Interaksi | Hasil |
| --- | --- |
| Tombol **Energi / Emisi / Risiko**, kartu KPI, atau tombol `1` `2` `3` | Ganti layer — warna, legenda, dan peringkat ikut berganti |
| Hover / `Tab` ke unit | Tooltip: nilai layer aktif, peringkat, % skala + nilai layer lain |
| Klik unit / `Enter` | Kunci pilihan (dikirim ke host lewat `onSelect`) · `Esc` untuk lepas |
| Panel **Titik panas** | 5 unit tertinggi di layer aktif; hover/klik menyorot unit di peta |
| **● Live** | Data bergerak tiap 0,6 detik (simulasi historian) |
| **Simulasikan anomali C-301** | Fouling kompresor: energi & emisi naik, risiko naik melewati ambang → cincin berdenyut |

Data demo adalah angka ilustratif untuk kompleks petrokimia (tungku cracker, utilitas,
polimer, tank farm). Gudang sengaja tidak punya meter emisi → ditampilkan diarsir "tanpa data".

## Struktur

```
src/
├── App.jsx                     DEMO: KPI, kontrol live/anomali, denah statis (backdrop)
├── demo/plantLayout.js         DEMO: geometri unit + generator data ilustratif
└── features/heatmap/           ← MODUL MANDIRI — salin folder ini
    ├── index.js                pintu masuk (impor HANYA dari sini)
    ├── PlantHeatmap.jsx        siap pakai: toggle + legenda + peta + tooltip + titik panas
    │                           (LayerToggle & HeatLegend juga diekspor terpisah)
    ├── scale.js                logika murni: skala warna OKLab, domain, peringkat, statistik
    ├── layers.js               definisi layer default (energi, emisi, risiko)
    └── heatmap.css             gaya ber-prefix hm-
```

## Integrasi ke project utama

```bash
cp -r 07-plant-heatmap/src/features/heatmap  <project-utama>/src/features/
# tidak ada dependensi tambahan selain react
```

### Cara 1 — pakai komponen jadi

Geometri (statis) dan nilai (live) **dipisah**: geometri dari file config/CAD, nilai dari API.

```jsx
import { PlantHeatmap, DEFAULT_LAYERS, withDomains } from './features/heatmap'

const UNITS = [                                   // koordinat viewBox (default 1000 × 600)
  { id: 'F-101', label: 'Tungku F-101', x: 50, y: 70, w: 56, h: 110 },
  { id: 'TK-1', label: 'Tangki TK-1', x: 575, y: 350, w: 70, h: 70, shape: 'circle' },
]
const LAYERS = withDomains(DEFAULT_LAYERS, { energy: [0, 300], emission: [0, 16] })

// dari API: { [unitId]: { [layerId]: number } } — unit/layer yang tidak ada = "tanpa data"
const data = { 'F-101': { energy: 225, emission: 12.6, risk: 52 }, 'TK-1': { energy: 2, risk: 73 } }

<PlantHeatmap units={UNITS} data={data} layers={LAYERS} onSelect={(u) => openDetail(u)} />
```

| Prop | Keterangan |
| --- | --- |
| `units` | `[{ id, label, x, y, w, h, shape?, tag?, r? }]` — `shape`: `rect` (default) / `circle`; `tag` = teks singkat di peta (default `label`); `r` = radius sudut |
| `data` | `{ [unitId]: { [layerId]: number } }` — nilai `null`/hilang digambar diarsir |
| `layers` | definisi layer (default `DEFAULT_LAYERS`) — lihat tabel di bawah |
| `layer`, `onLayerChange` | mode terkontrol (host memegang layer aktif, mis. disinkronkan dengan KPI). Atau `defaultLayer` untuk mode bebas |
| `width`, `height` | ukuran koordinat viewBox (SVG tetap responsif) |
| `backdrop` | elemen SVG (atau `({width,height}) => …`) yang digambar **di bawah** unit: batas area, jalan, pipe rack |
| `showGlow`, `showLabels`, `showValues`, `showRanking`, `rankingSize` | nyalakan/matikan bagian tampilan |
| `globalHotkeys` | `1…n` mengganti layer dari mana saja di halaman (default: hanya saat fokus di dalam komponen) |
| `onSelect(unit \| null)` | dipanggil saat unit dikunci/dilepas — mis. buka panel detail, kamera 3D ke unit |

Field layer:

| Field | Keterangan |
| --- | --- |
| `id` | kunci di `data[unitId]` |
| `label`, `short`, `unit`, `digits` | teks & format angka |
| `stops` | warna gradasi rendah → tinggi (2+ warna, diinterpolasi di OKLab) |
| `domain` | `[min, max]`. **Kunci** agar warna sebanding antar waktu — kosong = 0 … maks data |
| `alert`, `alertLabel` | ambang opsional: unit ≥ ambang diberi cincin berdenyut + dihitung di panel |
| `aggregate` | ringkasan di panel: `sum` (energi, emisi) · `mean` (skor risiko) · `max` |

Menambah layer baru (mis. getaran, suhu) cukup menambah objek ke array `layers` dan field
yang sama di `data` — tidak perlu menyentuh komponen.

### Cara 2 — rakit sendiri

Pakai potongan-potongannya di UI sendiri (mis. overlay di atas gambar denah PNG atau di
atas scene 3D):

```jsx
import { LayerToggle, HeatLegend, makeColorScale, layerDomain, normalize, rankUnits } from './features/heatmap'

const scale = makeColorScale(layer.stops)            // (t ∈ 0…1) => '#hex'
const domain = layerDomain(layer, units, data)       // [min, max]
const color = scale(normalize(data[id][layer.id], domain))
const hotspots = rankUnits(units, data, layer.id)    // [{ unit, value }] urut menurun

<LayerToggle layers={layers} value={layerId} onChange={setLayerId} />
<HeatLegend layer={layer} domain={domain} />
```

`scale.js` tidak bergantung pada React — bisa dipakai di backend, laporan PDF, atau tes.

## Cara kerjanya

- **Tiga lapis SVG.** (1) `backdrop` milik host — denah statis. (2) Pendaran: lingkaran
  `radialGradient` per unit dengan `mix-blend-mode: screen`; opasitas ∝ t^1,6 sehingga hanya
  unit benar-benar panas yang "merembes" ke sekitar dan pendaran yang bertumpuk saling
  menguatkan — klaster panas terlihat sebagai satu zona. (3) Unit berwarna + label.
- **Warna.** Interpolasi di **OKLab**, bukan RGB, supaya langkah nilai yang sama terlihat
  sebagai langkah warna yang sama (gradasi RGB cenderung keruh di tengah). Warna teks di dalam
  unit dipilih otomatis dari luminans latar agar selalu terbaca.
- **Skala terkunci.** `domain` tetap per layer → unit yang memburuk benar-benar *berubah
  warna*, bukan seluruh peta disetel ulang relatif terhadap data saat ini.
- **Transisi.** Fill, `stop-color`, opasitas & skala pendaran memakai transisi CSS (480 ms),
  jadi ganti layer maupun data live beranimasi tanpa loop JS. Menghormati
  `prefers-reduced-motion`.
- **Tooltip ditambatkan ke unit** (dihitung dari koordinat viewBox × skala SVG), bukan ke
  kursor — tetap stabil untuk mouse maupun keyboard.
