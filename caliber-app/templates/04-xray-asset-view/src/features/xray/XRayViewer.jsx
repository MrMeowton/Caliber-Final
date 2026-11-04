// =========================================
// XRayViewer — komponen siap pakai: kanvas + kompresor + kontrol x-ray.
// -----------------------------------------
// Bisa uncontrolled (state x-ray diurus sendiri) atau controlled
// lewat props `xray` + `onXrayChange`.
//
//   <XRayViewer faults={{ 'bearing-nde': { value: '7.8 mm/s' } }} />
// =========================================

import { ContactShadows, OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useEffect, useState } from 'react'
import CompressorModel from './CompressorModel'

export default function XRayViewer({
  faults = {},
  xray: xrayProp,
  onXrayChange,
  onPartClick,
  rpm,
  height = '100%',
  showHint = true,
}) {
  const [xrayLocal, setXrayLocal] = useState(false)
  const controlled = xrayProp !== undefined
  const xray = controlled ? xrayProp : xrayLocal
  const setXray = (v) => {
    if (!controlled) setXrayLocal(v)
    onXrayChange?.(v)
  }

  // Shortcut: X = toggle, Esc = tutup
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.('input, textarea')) return
      if (e.key === 'x' || e.key === 'X') setXray(!xray)
      if (e.key === 'Escape') setXray(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const faultCount = Object.keys(faults).length

  return (
    <div className="xr-root" style={{ height }}>
      <Canvas camera={{ position: [3.6, 2.2, 4.2], fov: 40 }} dpr={[1, 2]} onPointerMissed={() => setXray(false)}>
        <color attach="background" args={['#0b1120']} />
        <ambientLight intensity={0.8} />
        <directionalLight position={[4, 6, 3]} intensity={1.6} />
        <directionalLight position={[-4, 2, -3]} intensity={0.9} color="#93c5fd" />

        <CompressorModel
          xray={xray}
          onShellClick={() => setXray(true)}
          faults={faults}
          onPartClick={onPartClick}
          rpm={rpm}
        />

        <ContactShadows position={[0, -1.04, 0]} opacity={0.5} scale={8} blur={2.5} far={3} />
        <OrbitControls makeDefault enablePan={false} minDistance={3} maxDistance={10} target={[0, -0.1, 0]} />
      </Canvas>

      <div className="xr-toolbar">
        <button type="button" className={xray ? 'xr-btn is-on' : 'xr-btn'} onClick={() => setXray(!xray)}>
          {xray ? 'Tutup X-Ray' : 'X-Ray'}
        </button>
        {faultCount > 0 && <span className="xr-badge">{faultCount} komponen bermasalah</span>}
      </div>

      {showHint && (
        <div className="xr-hint">
          {xray ? 'Klik bearing untuk detail · klik area kosong / Esc untuk menutup' : 'Klik casing kompresor (atau tekan X) untuk melihat ke dalam'}
        </div>
      )}
    </div>
  )
}
