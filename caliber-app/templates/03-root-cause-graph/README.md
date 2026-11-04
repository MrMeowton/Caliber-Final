# 03 · Root Cause Graph

Satu fitur: **diagram proses + graf root cause** yang interaktif, dibangun dengan
[`@xyflow/react`](https://github.com/xyflow/xyflow) (React Flow) dan [`@dagrejs/dagre`](https://github.com/dagrejs/dagre) untuk auto-layout.

## Menjalankan

```bash
cd 03-root-cause-graph
npm install
npm run dev      # buka http://localhost:5173
```

## Apa yang bisa dilakukan

| Interaksi | Hasil |
| --- | --- |
| Tombol **Diagram proses** | Hanya alur unit proses (garis animasi = aliran material) |
| Tombol **Graf root cause** | Tambah node faktor penyebab (garis putus-putus = "memengaruhi") |
| Klik node | Jalur ke hulu disorot merah, node lain memudar, akar masalah diberi badge |
| Klik akar masalah di panel | Pindah fokus ke node tersebut |
| Klik area kosong | Hapus sorotan |
| Drag node / scroll / minimap | Atur posisi, zoom, navigasi |

**Aturan akar masalah:** node berstatus `warn`/`alarm` di hulu node terpilih yang *tidak* punya induk bermasalah lagi.

## Struktur

```
src/
├── App.jsx                       state (selectedId, mode tampilan) + layout
├── data/plant.js                 contoh node & edge          ← ganti dengan data asli
└── features/root-cause/          ← MODUL MANDIRI, salin folder ini untuk integrasi
    ├── index.js                  ekspor publik
    ├── RootCauseGraph.jsx        <ReactFlow> + sorotan jalur
    ├── RootCausePanel.jsx        panel detail & daftar akar masalah
    ├── StatusNode.jsx            node kustom berwarna status
    ├── graphUtils.js             fungsi murni: layoutGraph, traceUpstream, findRootCauses
    └── root-cause.css            gaya (prefix rc- agar tidak bentrok)
```

## Integrasi ke project lain

```jsx
import { RootCauseGraph, RootCausePanel } from './features/root-cause'

<div style={{ height: 500 }}>          {/* React Flow wajib punya parent bertinggi */}
  <RootCauseGraph nodes={nodes} edges={edges} selectedId={id} onSelect={setId} />
</div>
```

Format data (posisi tidak perlu, dihitung otomatis):

```js
node: { id, kind: 'process' | 'cause', label, status: 'ok' | 'warn' | 'alarm', value?, note? }
edge: { source, target, kind: 'flow' | 'cause' }
```

Contoh menyambungkan ke project 02: status node bisa diturunkan dari `readings` sensor
(`useSimulatedReadings`), dan `onSelect` di graf bisa memfokuskan komponen di 3D view.
