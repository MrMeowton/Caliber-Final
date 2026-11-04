# 02 · Asset 3D View

Satu fitur: **tampilan 3D interaktif sebuah aset/mesin** yang terhubung dengan data sensor,
dibangun dengan [`@react-three/fiber`](https://github.com/pmndrs/react-three-fiber) +
[`@react-three/drei`](https://github.com/pmndrs/drei). Dikemas sebagai **modul mandiri**
(`src/features/asset-3d`) yang tinggal disalin ke project utama.

## Menjalankan demo

```bash
cd 02-3d-asset-viewer
npm install
npm run dev      # buka http://localhost:5173
```

| Interaksi | Hasil |
| --- | --- |
| Drag / scroll / klik kanan | Putar, zoom, geser kamera |
| Hover komponen | Komponen menyala sesuai warna status |
| Klik komponen (3D, label, atau daftar) | Kamera terbang ke komponen, lainnya memudar, panel menampilkan sensor |
| Klik area kosong / `Esc` | Batal pilih |
| Preset kamera, slider **Explode**, **Label**, **Run/Stop** | Lewat toolbar |

## Struktur

```
src/
├── App.jsx                     DEMO: contoh pemakaian modul (±40 baris)
├── data/pumpSkid.js            DEMO: config aset unit pompa   ← ganti untuk aset lain
└── features/asset-3d/          ← MODUL MANDIRI — salin folder ini
    ├── index.js                pintu masuk (impor HANYA dari sini)
    ├── Asset3DView.jsx         komponen siap pakai: kanvas + toolbar + legenda
    ├── AssetPanel.jsx          panel ringkasan & detail sensor (opsional)
    ├── status.js               logika status (fungsi murni, tanpa React)
    ├── hooks.js                useSimulatedReadings, useSensorHistory
    ├── asset-3d.css            gaya ber-prefix a3d- (tanpa reset global)
    ├── core/
    │   ├── AssetCanvas.jsx     kanvas 3D saja (untuk UI kontrol buatan sendiri)
    │   ├── InteractivePart.jsx hover / klik / fokus / explode / label
    │   ├── Scenery.jsx         alas & pipa dari config
    │   └── camera.js           preset & animasi kamera
    └── shapes/                 registry bentuk 3D (motor, pump, valve, tank, coupling, box, cylinder, gltf)
```

**Aturan dependensi:** modul tidak mengimpor apa pun dari luar foldernya, dan project utama
hanya mengimpor dari `features/asset-3d` (index.js). Data aset selalu masuk lewat props.

---

## Integrasi ke project utama

### 1. Salin & pasang dependensi

```bash
cp -r 02-3d-asset-viewer/src/features/asset-3d  <project-utama>/src/features/
cd <project-utama>
npm i three @react-three/fiber @react-three/drei
```

Butuh React 19 (`@react-three/fiber` v9). CSS ikut terimpor otomatis lewat `index.js`.

### 2. Pakai

```jsx
import { Asset3DView, useSimulatedReadings } from './features/asset-3d'
import { myAsset } from './data/myAsset'

export default function MachinePage() {
  const readings = useSimulatedReadings(myAsset.parts) // nanti ganti dengan data API
  return <Asset3DView asset={myAsset} readings={readings} height={480} />
}
```

Itu saja sudah jalan. Tambahkan `<AssetPanel>` bila ingin panel detail; sinkronkan keduanya
dengan `selectedId` + `onSelect` (lihat `src/App.jsx`).

**Next.js (App Router):** file modul yang memakai hook sudah diberi `'use client'`. Impor dari
komponen client, atau pakai `dynamic(() => import(...), { ssr: false })` jika halaman di-render
di server.

### 3. Config aset

```js
export const myAsset = {
  name: 'Judul panel', subtitle: 'Sub judul',          // opsional (dipakai AssetPanel)
  parts: [
    {
      id: 'pump', name: 'Pompa', code: 'P-101', description: '...',
      shape: 'pump',                 // kunci registry bentuk
      shapeProps: {},                // opsi khusus bentuk (mis. tank: { height, radius, levelKey })
      position: [0, 0.75, 0], rotation: [0, 0, 0],
      explode: [0, 1, 0],            // arah geser saat Explode = 1
      labelOffset: [0, 1, 0],
      color: '#dc6b19', accent: '#7c2d12', bodyOpacity: 1,
      sensors: [{ key: 'pressure', label: 'Tekanan', unit: 'bar', base: 6.2, warn: 7.5, crit: 8.5 }],
    },
  ],
  statics: [{ size: [4, 0.2, 1.6], position: [0, 0.1, 0] }],          // alas (opsional)
  pipes: [{ points: [[0, 1, 0], [0, 2, 0], [2, 2, 0]], radius: 0.08 }], // pipa polyline (opsional)
  homeView: 'iso',
  cameraViews: { iso: { label: 'Isometrik', pos: [6, 5, 8], target: [0, 1, 0] } }, // opsional
}
```

Hanya `id`, `name`, `shape`, `position`, `sensors` yang wajib. Contoh lengkap: `src/data/pumpSkid.js`.

### 4. Sumber data

Format `readings` di seluruh modul: `{ [partId]: { [sensorKey]: number } }`.

```js
// Dari API yang mengembalikan baris-baris:
const rows = await fetch('/api/sensors').then((r) => r.json())
// [{ partId: 'pump', sensor: 'pressure', value: 6.4 }, ...]
setReadings(rowsToReadings(rows))

// Riwayat untuk sparkline, dari sumber data apa pun:
const history = useSensorHistory(readings)
```

### 5. Bentuk 3D kustom

Bentuk adalah komponen biasa yang menerima `{ mat, part, reading, running }`. Pakai `mat.body` /
`mat.accent` agar efek hover, fokus, dan warna status tetap jalan.

```jsx
import { Asset3DView, useSpin } from './features/asset-3d'

function Reactor({ mat, running }) {
  const agitator = useSpin(running, { axis: 'y', speed: 4 })
  return (
    <>
      <mesh material={mat.body}><cylinderGeometry args={[0.7, 0.7, 1.6, 40]} /></mesh>
      <mesh ref={agitator} position={[0, 1, 0]} material={mat.accent}><boxGeometry args={[0.9, 0.08, 0.15]} /></mesh>
    </>
  )
}

<Asset3DView asset={asset} readings={readings} shapes={{ reactor: Reactor }} />  // part.shape: 'reactor'
```

Model asli `.glb`: `shape: 'gltf', shapeProps: { url: '/models/pump.glb', scale: 1 }`
(file diletakkan di `public/models/`).

---

## Referensi API

### `<Asset3DView>`

| Prop | Default | Keterangan |
| --- | --- | --- |
| `asset` | — | config aset (wajib) |
| `readings` | — | data sensor (wajib) |
| `selectedId` / `onSelect` | uncontrolled | isi keduanya untuk sinkron dengan komponen lain |
| `running` / `onRunningChange` | `true` / — | animasi; tombol Run/Stop muncul jika `onRunningChange` diisi |
| `shapes` | — | bentuk tambahan `{ nama: Komponen }` |
| `height` | `'100%'` | tinggi kotak (angka = px) |
| `toolbar`, `legend` | `true` | tampilkan overlay |
| `defaultExplode`, `defaultShowLabels` | `0`, `true` | nilai awal |
| `escapeToDeselect` | `true` | tombol Esc membatalkan pilihan |
| `background`, `className`, `style` | | tampilan |
| `ref` | | `{ goToView(key), focus(id), reset(), controls }` |

### Ekspor lain

| Ekspor | Untuk |
| --- | --- |
| `AssetPanel` | panel ringkasan/detail (`asset, readings, history?, selectedId, onSelect`) |
| `AssetCanvas` | kanvas 3D saja, semua state lewat props (`explode`, `showLabels`, `controlsRef`, …) |
| `useSimulatedReadings(parts, { running, intervalMs, jitter })` | data dummy |
| `useSensorHistory(readings, length)` | riwayat nilai untuk grafik |
| `rowsToReadings(rows)` | ubah data baris API → format readings |
| `STATUS`, `sensorStatus`, `partStatus`, `summarize` | logika status, bisa dipakai di tabel/notifikasi |
| `BUILTIN_SHAPES`, `useSpin` | registry bentuk & hook animasi putar |
| `goToView`, `focusObject`, `DEFAULT_CAMERA_VIEWS` | kontrol kamera manual |

### Tema

Semua warna adalah variabel CSS, bisa di-override dari project utama:

```css
.a3d-root, .a3d-panel { --a3d-primary: #e11d48; --a3d-bg: #000; }
```

Font mengikuti font project utama (`font-family: inherit`). Tata letak responsif modul memakai
*container query*, jadi menyesuaikan ukuran kotak tempat ia ditaruh, bukan ukuran layar.

## Catatan teknis

- Pencahayaan reflektif dari `<Lightformer>` (bukan file HDR), sehingga tetap jalan offline.
- Label `<Html>` dirender ke satu layer DOM (`portal`) dan disembunyikan via CSS, bukan
  di-unmount. Ini menghindari label hilang/error DOM pada React 19.
- Animasi memakai `useFrame` + lerp `1 - exp(-dt·k)` supaya kecepatannya sama di semua FPS.
- Sambungan ke project 03 (Root Cause Graph): kirim `selectedId` yang sama ke kedua modul, maka
  klik node di graf akan memfokuskan komponen di 3D.
