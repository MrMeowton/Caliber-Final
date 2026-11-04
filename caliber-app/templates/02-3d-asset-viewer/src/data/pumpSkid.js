// =========================================
// CONFIG ASET: unit pompa (contoh)
// -----------------------------------------
// Ini SATU-SATUNYA tempat yang menjelaskan "aset apa yang ditampilkan".
// Modul src/features/asset-3d tidak tahu apa-apa soal pompa — semuanya dari sini.
// Untuk aset lain, buat file config baru dengan bentuk yang sama.
//
// part:
//   id, name, code?, description?
//   shape         : kunci registry bentuk ('motor','pump','valve','tank','coupling','box','cylinder','gltf', atau kustom)
//   shapeProps?   : opsi tambahan untuk bentuk tsb
//   position      : [x, y, z]       rotation?: [x, y, z]
//   explode?      : arah geser saat slider Explode = 1
//   labelOffset?  : posisi label relatif terhadap komponen
//   color?, accent?, bodyOpacity?
//   sensors       : [{ key, label, unit, base, warn, crit }]
// =========================================

export const pumpSkid = {
  name: 'Asset 3D View',
  subtitle: 'Unit Pompa · Line A',

  parts: [
    {
      id: 'motor',
      name: 'Motor Listrik',
      code: 'M-101',
      description: 'Motor induksi 3 fasa penggerak pompa melalui kopling.',
      shape: 'motor',
      position: [-1.6, 0.75, 0],
      explode: [-1.2, 0.4, 0],
      labelOffset: [-0.2, 0.95, 0],
      color: '#2563eb',
      accent: '#1e3a8a',
      sensors: [
        { key: 'temp', label: 'Suhu belitan', unit: '°C', base: 68, warn: 80, crit: 95 },
        { key: 'current', label: 'Arus', unit: 'A', base: 42, warn: 48, crit: 55 },
      ],
    },
    {
      id: 'coupling',
      name: 'Kopling',
      code: 'C-101',
      description: 'Menyambung poros motor ke poros pompa dan meredam getaran.',
      shape: 'coupling',
      position: [-0.35, 0.75, 0],
      explode: [0, 1.0, 0],
      labelOffset: [-0.15, -0.35, 0.95],
      color: '#e2e8f0',
      accent: '#64748b',
      sensors: [{ key: 'vib', label: 'Getaran', unit: 'mm/s', base: 5.1, warn: 4.5, crit: 7.1 }],
    },
    {
      id: 'pump',
      name: 'Pompa Sentrifugal',
      code: 'P-101',
      description: 'Memompa fluida dari tangki menuju jalur distribusi.',
      shape: 'pump',
      position: [0.75, 0.75, 0],
      explode: [0.6, 0.6, 0.6],
      labelOffset: [0.35, 0.15, 0.75],
      color: '#dc6b19',
      accent: '#7c2d12',
      sensors: [
        { key: 'pressure', label: 'Tekanan keluar', unit: 'bar', base: 6.2, warn: 7.5, crit: 8.5 },
        { key: 'flow', label: 'Debit', unit: 'm³/h', base: 118, warn: 140, crit: 160 },
      ],
    },
    {
      id: 'valve',
      name: 'Katup Keluaran',
      code: 'V-101',
      description: 'Gate valve untuk mengatur aliran pada pipa keluaran.',
      shape: 'valve',
      position: [0.75, 2.05, 0],
      explode: [0, 1.0, 0],
      labelOffset: [-0.75, 0.25, 0],
      color: '#0d9488',
      accent: '#134e4a',
      sensors: [{ key: 'open', label: 'Bukaan', unit: '%', base: 75, warn: 95, crit: 100 }],
    },
    {
      id: 'tank',
      name: 'Tangki Penampung',
      code: 'T-101',
      description: 'Tangki sumber fluida yang menyuplai sisi hisap pompa.',
      shape: 'tank',
      shapeProps: { height: 2, radius: 0.62, levelKey: 'level' }, // tinggi fluida mengikuti sensor 'level'
      position: [2.9, 1.15, 0],
      explode: [0.8, 0, 0],
      labelOffset: [0, 1.45, 0],
      color: '#cbd5e1',
      accent: '#475569',
      bodyOpacity: 0.28,
      sensors: [
        { key: 'level', label: 'Level', unit: '%', base: 64, warn: 85, crit: 95 },
        { key: 'temp', label: 'Suhu fluida', unit: '°C', base: 41, warn: 60, crit: 75 },
      ],
    },
  ],

  // Alas / rangka (tidak bisa diklik)
  statics: [
    { size: [4.4, 0.2, 1.7], position: [-0.4, 0.1, 0] },
    { size: [1.7, 0.15, 1.7], position: [2.9, 0.075, 0] },
  ],

  // Pipa sebagai polyline — siku dibuat otomatis di titik belok
  pipes: [
    {
      points: [
        [1.2, 0.6, 0],
        [2.35, 0.6, 0],
      ],
    }, // hisap: tangki → pompa
    {
      points: [
        [0.75, 1.2, 0],
        [0.75, 1.82, 0],
      ],
    }, // pompa → katup
    {
      points: [
        [0.75, 2.28, 0],
        [0.75, 2.75, 0],
        [2.9, 2.75, 0],
        [2.9, 2.15, 0],
      ],
    }, // katup → tangki
  ],

  // Preset kamera (kunci pertama / homeView = tampilan awal)
  homeView: 'iso',
  cameraViews: {
    iso: { label: 'Isometrik', pos: [5.6, 5, 8.6], target: [0.9, 1.25, 0] },
    front: { label: 'Depan', pos: [0.6, 1.4, 8], target: [0.6, 1.1, 0] },
    top: { label: 'Atas', pos: [0.6, 9, 0.01], target: [0.6, 0, 0] },
    side: { label: 'Samping', pos: [9, 1.6, 0], target: [0.6, 1.1, 0] },
  },
}
