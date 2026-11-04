# 04 · X-Ray Asset View

Satu fitur saja: **X-ray / exploded view aset**. Klik kompresor di digital twin → casing
memudar jadi transparan (kebiruan) dan tutup ujungnya bergeser keluar → bearing yang
bermasalah terlihat **berdenyut merah** lengkap dengan label nilai sensornya.

Dibangun dengan `@react-three/fiber` + `@react-three/drei`, dikemas sebagai **modul mandiri**
(`src/features/xray`) yang tinggal disalin ke project hackathon. Tidak ada sistem lain
(tanpa dashboard, tanpa backend) — kerusakan masuk lewat props.

## Menjalankan demo

```bash
cd 04-xray-asset-view
npm install
npm run dev      # buka http://localhost:5173
```

| Interaksi | Hasil |
| --- | --- |
| Klik casing / tombol **X-Ray** / tekan `X` | Masuk mode x-ray |
| Klik bearing (saat x-ray) | Memanggil `onPartClick(id)` |
| Klik area kosong / `Esc` / **Tutup X-Ray** | Kembali solid |
| Drag / scroll | Putar & zoom kamera |

## Struktur

```
src/
├── App.jsx                   DEMO: contoh pemakaian (±25 baris)
└── features/xray/            ← MODUL MANDIRI — salin folder ini
    ├── index.js              pintu masuk (impor HANYA dari sini)
    ├── XRayViewer.jsx        siap pakai: kanvas + kompresor + tombol + hint
    ├── XRayShell.jsx         pembungkus casing → transparan + exploded
    ├── FaultPulse.jsx        pembungkus komponen rusak → denyut merah + halo + label
    ├── CompressorModel.jsx   kompresor prosedural (poros, impeller, 2 bearing, casing)
    ├── parts.js              daftar komponen (id bearing)
    └── xray.css              gaya ber-prefix xr-
```

## Integrasi ke project utama

```bash
cp -r 04-xray-asset-view/src/features/xray  <project-utama>/src/features/
npm i three @react-three/fiber @react-three/drei     # butuh React 19
```

### Cara 1 — pakai komponen jadi

```jsx
import { XRayViewer } from './features/xray'

<XRayViewer
  faults={{ 'bearing-nde': { value: 'Vibrasi 7.8 mm/s' } }}   // id dari parts.js
  onPartClick={(id) => console.log(id)}
  height={480}
/>
```

| Prop | Keterangan |
| --- | --- |
| `faults` | `{ [partId]: { value } }` — komponen yang berdenyut merah |
| `xray`, `onXrayChange` | opsional, untuk mode controlled |
| `onPartClick(id)` | dipanggil saat bearing diklik di mode x-ray |
| `rpm` | kecepatan putar impeller (visual) |
| `height`, `showHint` | tampilan |

### Cara 2 — pasang ke model 3D milik sendiri (mis. twin yang sudah ada)

Dua pembungkus ini bisa dipakai di dalam `<Canvas>` mana pun, termasuk untuk mesh GLTF:

```jsx
import { XRayShell, FaultPulse } from './features/xray'

<XRayShell active={xray} explode={[0, 0.3, 0]} onClick={() => setXray(true)}>
  <mesh geometry={nodes.Casing.geometry} material={materials.Steel} />
</XRayShell>

<FaultPulse active={isFaulty} position={[1, 0, 0]} radius={0.4}
            label={{ title: 'Bearing NDE', value: '7.8 mm/s' }} showLabel={xray}>
  <mesh geometry={nodes.Bearing.geometry} material={materials.Steel} />
</FaultPulse>
```

Tips: pisahkan casing menjadi beberapa `XRayShell` dengan arah `explode` berbeda
(badan ke atas, tutup kiri/kanan ke samping) untuk efek exploded view.

## Cara kerjanya

- **X-ray** — `XRayShell` meng-clone material casing, lalu tiap frame melakukan
  `damp` nilai `t` (0 → 1) dan mengatur `opacity`, warna ke cyan, serta mematikan
  `depthWrite` agar isi di dalamnya tetap terlihat. Casing di-render terakhir (`renderOrder`).
- **Klik tembus** — saat x-ray aktif, `raycast` casing dimatikan, sehingga klik jatuh ke bearing.
- **Exploded view** — grup casing digeser sejauh `explode × t`.
- **Denyut merah** — `FaultPulse` mengubah `emissive` anak menjadi merah dengan gelombang
  `sin²`, plus bola halo additive yang membesar-mengecil seirama.
