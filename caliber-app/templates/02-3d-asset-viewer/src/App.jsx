import { useState } from 'react'
import { Asset3DView, AssetPanel, useSimulatedReadings, useSensorHistory } from './features/asset-3d'
import { pumpSkid } from './data/pumpSkid'

// =========================================
// Demo: contoh cara project utama memakai modul asset-3d
// -----------------------------------------
// App hanya memegang 3 hal:
//   1. config aset            → src/data/pumpSkid.js
//   2. sumber data sensor     → useSimulatedReadings (ganti dengan API)
//   3. state yang dibagi      → selectedId (panel ↔ 3D), running
// Semua logika 3D ada di dalam src/features/asset-3d.
// =========================================

export default function App() {
  const [selectedId, setSelectedId] = useState(null)
  const [running, setRunning] = useState(true)

  const readings = useSimulatedReadings(pumpSkid.parts, { running })
  const history = useSensorHistory(readings)

  return (
    <div className="layout">
      <AssetPanel
        asset={pumpSkid}
        readings={readings}
        history={history}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />

      <Asset3DView
        asset={pumpSkid}
        readings={readings}
        selectedId={selectedId}
        onSelect={setSelectedId}
        running={running}
        onRunningChange={setRunning}
      />
    </div>
  )
}
