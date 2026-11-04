import { useState } from 'react'
import { RootCauseGraph, RootCausePanel } from './features/root-cause'
import { plantNodes, plantEdges } from './data/plant'

// App hanya menyimpan state & menyusun layout.
// Semua logika graf ada di src/features/root-cause.
export default function App() {
  const [selectedId, setSelectedId] = useState('qc') // mulai dari gejala: produk off-spec
  const [showCauses, setShowCauses] = useState(true)

  return (
    <div className="layout">
      <RootCausePanel nodes={plantNodes} edges={plantEdges} selectedId={selectedId} onSelect={setSelectedId} />

      <main className="stage">
        <RootCauseGraph
          nodes={plantNodes}
          edges={plantEdges}
          selectedId={selectedId}
          onSelect={setSelectedId}
          showCauses={showCauses}
        />

        <div className="toolbar">
          <button className={showCauses ? 'chip' : 'chip is-active'} onClick={() => setShowCauses(false)}>
            Diagram proses
          </button>
          <button className={showCauses ? 'chip is-active' : 'chip'} onClick={() => setShowCauses(true)}>
            Graf root cause
          </button>
        </div>
      </main>
    </div>
  )
}
