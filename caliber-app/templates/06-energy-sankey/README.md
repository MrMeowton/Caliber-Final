# 06 · Energy Sankey

Satu fitur saja: **diagram Sankey energi beranimasi**. Aliran **fuel gas, steam, listrik →
unit → produk & kerugian**, dengan **lebar aliran = besaran energi (GJ/jam)**. Garis-garis
bergerak menunjukkan arah aliran, dan saat data berubah (skenario / slider) setiap pita
**mengembang atau menyusut mulus** — penghematan energi terlihat sebagai pita merah yang
mengecil, bukan sekadar angka.

Hanya `react` — Sankey digambar dengan SVG murni + algoritma tata letak sendiri (tanpa
d3 / library chart). Dikemas sebagai **modul mandiri** (`src/features/sankey`) yang tinggal
disalin ke project hackathon.

## Menjalankan demo

```bash
cd 06-energy-sankey
npm install
npm run dev      # buka http://localhost:5173
```

| Interaksi | Hasil |
| --- | --- |
| Hover aliran | Tooltip: besaran, % dari keluaran sumber, % dari total masukan |
| Hover node | Sorot semua aliran masuk/keluar + tooltip masuk/keluar, kerugian, efisiensi unit |
| Klik node / `Enter` | Kunci sorotan (klik lagi atau `Esc` untuk lepas) · `Tab` untuk berpindah node |
| **Kondisi aktual / Setelah optimasi** | Pita beranimasi ke skenario baru |
| 3 slider tuas efisiensi | Neraca dihitung ulang langsung (selalu seimbang) |
| **❚❚ / ▶**, `0.5× 1× 2×` | Jeda / kecepatan animasi aliran |

Data demo (angka ilustratif): 1.060 GJ/jam masuk, efisiensi 57,2%. Dengan optimasi
(O₂ trim furnace, perbaikan steam trap, VSD pompa) masukan turun ke ±964 GJ/jam
(**hemat ±96 GJ/jam ≈ 770 TJ/tahun**), efisiensi naik ke 62%.

## Struktur

```
src/
├── App.jsx                   DEMO: tab "Simulator skenario" & "Live (mock API)"
├── demo/plantModel.js        DEMO: model neraca energi pabrik (selalu seimbang)
├── demo/mockApi.js           DEMO: pura-pura API meter (tabel baris + derau)
├── demo/LiveDemo.jsx         DEMO: jalur integrasi API → adapter → validasi → Sankey
└── features/sankey/          ← MODUL MANDIRI — salin folder ini
    ├── index.js              pintu masuk (impor HANYA dari sini)
    │   — lapisan UI —
    ├── EnergySankey.jsx      komponen siap pakai (legenda, diagram, tooltip, sorotan)
    ├── colors.js             warna & label per jenis energi
    ├── sankey.css            gaya ber-prefix sk- (tema via CSS variable)
    │   — lapisan data —
    ├── adapters.js           tabel baris API/CSV → { nodes, links }, konversi satuan
    ├── validate.js           cek neraca per node, id tak dikenal, nilai negatif
    ├── useEnergyFlows.js     hook ambil data + polling + validasi otomatis
    │   — inti (tanpa React) —
    ├── layout.js             kolom, posisi node/aliran, path, neraca total
    └── useTweenedLinks.js    animasi perubahan nilai
```

Tiap lapisan bisa dipakai terpisah: hanya UI (data sudah rapi), hanya data (gambar
dengan library lain), atau hanya `layout.js` (render sendiri / di backend).

## Integrasi ke project utama

```bash
cp -r 06-energy-sankey/src/features/sankey  <project-utama>/src/features/
# tidak ada dependensi tambahan selain react
```

### Resep hackathon (3 baris)

Backend cukup kirim tabel aliran; node dibuat otomatis, jenisnya ditebak dari nama:

```jsx
import { EnergySankey, graphFromRows, useEnergyFlows } from './features/sankey'

const fetchGraph = async () => graphFromRows(await fetch('/api/energy/flows').then((r) => r.json()))
const { data, issues } = useEnergyFlows(fetchGraph, { intervalMs: 5000 })   // di dalam komponen
{data && <EnergySankey data={data} onSelect={(n) => bukaDetailUnit(n?.id)} />}
```

| Lapisan data | Keterangan |
| --- | --- |
| `graphFromRows(rows, { keys, kinds, labels })` | `rows`: `[{ from, to, value }]`. `keys` memetakan nama kolom (mis. `{ value: 'value_gj_h' }`), `kinds`/`labels` menimpa tebakan per id. Baris from→to yang sama dijumlahkan |
| `guessKind(nama)` | `fuel` / `steam` / `power` / `product` / `loss` dari kata kunci (fuel, uap, PLN, produk, buang, vent, …), selain itu `unit` |
| `scaleGraph(graph, faktor)` + `UNIT_TO_GJ_PER_H` | konversi satuan, mis. data dalam MW → `scaleGraph(g, 3.6)` |
| `validateGraph(graph, { tolerance })` | `{ ok, issues[] }` — `imbalance` per node (default > 2%), `unknown-node`, `negative`. Tampilkan sebagai peringatan kualitas data |
| `useEnergyFlows(fetcher, { intervalMs, validate })` | `{ data, issues, loading, error, updatedAt }`; identitas `data` stabil → animasi hanya saat data baru |

| Titik kustomisasi UI | Keterangan |
| --- | --- |
| `data` | `{ nodes, links }` sekaligus (alternatif prop `nodes` + `links`) |
| `onHover({ type, node \| link } \| null)` | sinkronkan komponen lain — mis. sorot unit di digital twin 3D (project 02/04) |
| `onSelect(node \| null)` | node dikunci/dilepas → buka panel detail, filter tabel, dll. |
| `renderTooltip(target, { unit, totalIn, fmt, pct })` | ganti isi tooltip; kembalikan `undefined` untuk tooltip bawaan |
| `legend`, `className` | sembunyikan legenda / tambah class pembungkus |
| CSS variable `--sk-bg --sk-line --sk-text --sk-muted` | samakan tema: `.sk-root { --sk-bg: #fff; … }` |

### Cara 1 — pakai komponen jadi

```jsx
import { EnergySankey } from './features/sankey'

const nodes = [
  { id: 'fuel', label: 'Fuel gas', kind: 'fuel' },
  { id: 'boiler', label: 'Boiler B-1', kind: 'unit' },
  { id: 'steam', label: 'Header steam', kind: 'steam' },
  { id: 'proses', label: 'Proses', kind: 'product' },
  { id: 'stack', label: 'Gas buang', kind: 'loss' },
]
const links = useMemo(() => [            // dari API meter energi; WAJIB di-memo
  { source: 'fuel', target: 'boiler', value: 120 },
  { source: 'boiler', target: 'steam', value: 102 },
  { source: 'boiler', target: 'stack', value: 18 },
  { source: 'steam', target: 'proses', value: 102 },
], [data])

<EnergySankey nodes={nodes} links={links} unit="GJ/jam" maxValue={150} />
```

| Prop | Keterangan |
| --- | --- |
| `nodes` | `[{ id, label, kind, col? }]` — `kind`: `fuel` `steam` `power` `unit` `product` `loss`. `col` opsional untuk memaksa kolom |
| `links` | `[{ source, target, value }]` — aliran bernilai ≤ 0 otomatis disembunyikan |
| `maxValue` | nilai yang dipetakan ke tinggi penuh. **Kunci** (mis. masukan kondisi terburuk) agar skala tidak berubah antar skenario. Kosong = menyesuaikan data |
| `unit` | label satuan (default `GJ/jam`) |
| `animate`, `speed` | jalankan/jeda garis bergerak, kecepatan (1 = 46 px/detik) |
| `width`, `height` | ukuran koordinat viewBox (SVG tetap responsif) |
| `colors`, `kindLabels` | ganti warna/label jenis energi (default dari `colors.js`) |
| `onSelect(node \| null)` | dipanggil saat node dikunci/dilepas — mis. buka panel detail unit |

Warna aliran = jenis energi yang mengalir: aliran ke steam/listrik/produk/kerugian ikut
warna tujuannya (cogen → steam berwarna biru), selain itu ikut warna sumbernya.

### Cara 2 — rakit sendiri

```jsx
import { computeSankey, energyBalance, useTweenedLinks } from './features/sankey'

const shown = useTweenedLinks(links)            // nilai beranimasi
const layout = computeSankey({ nodes, links: shown }, { width: 1000, height: 540, maxValue })
// layout.nodes[i]: x0 x1 y0 y1 value valueIn valueOut depth
// layout.links[i]: path width y0 y1 → <path d={path} strokeWidth={width} />
const { input, useful, loss, efficiency, imbalance } = energyBalance({ nodes, links })
```

`layout.js` tidak bergantung pada React — bisa dipakai di backend / tes. `imbalance`
≠ 0 berarti data meter tidak menutup neraca (meter hilang / salah kalibrasi) — berguna
sebagai pemeriksaan kualitas data.

## Cara kerjanya

- **Kolom otomatis.** Sumber (tanpa aliran masuk) di kolom 0, node lain di kedalaman
  jalur terpanjang dari sumber; node tanpa keluaran (produk, kerugian) dirapatkan ke
  kolom terakhir. Siklus ditolak dengan pesan error.
- **Lebar = energi.** Satu skala `ky` (px per GJ) untuk semua kolom; nilai node =
  max(masuk, keluar). Node ditumpuk & ditengahkan per kolom, ujung aliran di dalam node
  diurutkan menurut posisi node di seberangnya supaya pita tidak silang tanpa perlu.
  Pita = bezier kubik dengan `stroke-width` = lebar aliran.
- **Animasi.** (1) Intro: pita "digambar" dari kiri ke kanan per kolom
  (`pathLength=1` + `stroke-dashoffset`). (2) Aliran: lapisan garis putus-putus yang
  `stroke-dashoffset`-nya bergeser terus — kecepatannya px/detik sama di semua pita.
  (3) Perubahan data: `useTweenedLinks` menginterpolasi nilai tiap aliran (ease-out,
  650 ms) dan tata letak dihitung ulang tiap frame — murah karena hanya puluhan aliran.
  Menghormati `prefers-reduced-motion`.
- **Model demo** (`plantModel.js`) dibalik dari permintaan: panas proses, steam turbin
  & reboiler, serta listrik motor/pompa tetap → tuas efisiensi menentukan berapa fuel
  gas & listrik PLN yang dibutuhkan. Karena itu neraca selalu tutup (`imbalance = 0`).
