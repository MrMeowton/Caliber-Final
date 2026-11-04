import { useState } from 'react'
import { KnowledgeRiskMap, LEVELS, STATUS, formatUSD } from './features/knowledge-risk'
import { items, people } from './demo/data'
import Slider from './demo/Slider'

export default function App() {
  const [horizon, setHorizon] = useState(12)
  const [minLevel, setMinLevel] = useState(2)
  const [absent, setAbsent] = useState([])
  const [sel, setSel] = useState(null)

  return (
    <main className="page">
      <header className="head">
        <div>
          <p className="eyebrow">Knowledge · technical knowledge retention</p>
          <h1>Knowledge-at-Risk Map</h1>
        </div>
        <div className="controls">
          <Slider label="Horizon pensiun" value={horizon} onChange={setHorizon} min={0} max={36} format={(v) => `${v} bln`} />
          <Slider label="Dianggap kompeten mulai" value={minLevel} onChange={setMinLevel} min={1} max={3} format={(v) => LEVELS[v]} />
          {absent.length > 0 && <button onClick={() => setAbsent([])}>Reset simulasi ({absent.length})</button>}
        </div>
      </header>

      <p className="hint">
        Baris = aset/prosedur kritis, kolom = engineer. <b>Klik nama</b> untuk simulasi “dia resign besok”. Geser horizon untuk
        melihat pensiun yang akan datang. Baris paling atas = paling berisiko (kritikalitas × eksposur).
      </p>

      <KnowledgeRiskMap
        items={items}
        people={people}
        horizonMonths={horizon}
        minLevel={minLevel}
        absent={absent}
        onAbsentChange={setAbsent}
        selectedId={sel?.id}
        onSelect={setSel}
      />

      {sel && (
        <p className="hint">
          <b>{sel.name}</b> — {STATUS[sel.status].desc}. Kompeten tersisa:{' '}
          <b>{sel.remaining.map((id) => people.find((p) => p.id === id).name).join(', ') || 'tidak ada'}</b>. Calon penerus
          (satu level di bawah): <b>{sel.successors.map((id) => people.find((p) => p.id === id).name).join(', ') || 'tidak ada'}</b>.
          Nilai terancam {formatUSD(sel.usdAtRisk)} → prioritaskan dokumentasi & shadowing.
        </p>
      )}
    </main>
  )
}
