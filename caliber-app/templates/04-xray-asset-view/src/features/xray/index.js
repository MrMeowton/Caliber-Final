// =========================================
// Pintu masuk modul xray — HANYA impor dari file ini.
// -----------------------------------------
// Integrasi ke project lain:
//   1. salin folder src/features/xray
//   2. npm i three @react-three/fiber @react-three/drei
//   3. import { XRayViewer } from './features/xray'
// =========================================

import './xray.css'

// Siap pakai: kanvas + kompresor demo + tombol x-ray
export { default as XRayViewer } from './XRayViewer'

// Blok penyusun: pakai di dalam <Canvas> / model 3D milik sendiri
export { default as XRayShell } from './XRayShell'
export { default as FaultPulse } from './FaultPulse'
export { default as CompressorModel } from './CompressorModel'
export { COMPRESSOR_PARTS } from './parts'
