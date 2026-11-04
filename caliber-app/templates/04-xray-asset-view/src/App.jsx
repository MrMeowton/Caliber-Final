// DEMO: contoh pemakaian modul xray
import { useState } from 'react'
import { COMPRESSOR_PARTS, XRayViewer } from './features/xray'

// Data kerusakan — di project utama ini datang dari sensor / API
const FAULTS = {
  'bearing-nde': { value: 'Vibrasi 7.8 mm/s' },
}

export default function App() {
  const [picked, setPicked] = useState(null)
  const part = COMPRESSOR_PARTS.find((p) => p.id === picked)

  return (
    <main className="page">
      <XRayViewer faults={FAULTS} onPartClick={setPicked} onXrayChange={(on) => !on && setPicked(null)} />

      {part && (
        <aside className="info">
          <strong>{part.name}</strong>
          <span>{FAULTS[part.id] ? FAULTS[part.id].value + ' — di atas batas' : 'Normal'}</span>
        </aside>
      )}
    </main>
  )
}
