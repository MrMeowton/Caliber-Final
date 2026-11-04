// =========================================
// Pintu masuk modul asset-3d — HANYA impor dari file ini.
// -----------------------------------------
// Integrasi ke project lain:
//   1. salin folder src/features/asset-3d
//   2. npm i three @react-three/fiber @react-three/drei
//   3. import { Asset3DView } from './features/asset-3d'
//
// Lihat README project 02 untuk format config & contoh lengkap.
// =========================================

import './asset-3d.css'

// Komponen siap pakai
export { default as Asset3DView } from './Asset3DView'
export { default as AssetPanel } from './AssetPanel'

// Blok penyusun (untuk UI kontrol buatan sendiri)
export { default as AssetCanvas } from './core/AssetCanvas'
export { DEFAULT_CAMERA_VIEWS, goToView, focusObject } from './core/camera'

// Bentuk 3D: registry bawaan + hook animasi untuk bentuk kustom
export { BUILTIN_SHAPES, useSpin } from './shapes'

// Data & status (fungsi murni)
export { useSimulatedReadings, useSensorHistory } from './hooks'
export { STATUS, sensorStatus, partStatus, summarize, readValue, rowsToReadings } from './status'
