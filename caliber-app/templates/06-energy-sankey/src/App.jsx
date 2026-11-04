// DEMO: contoh pemakaian modul sankey
import { useMemo, useState } from 'react'
import { EnergySankey, energyBalance } from './features/sankey'
import { LEVERS, NODES, PRESETS, plantLinks, worstCaseInput } from './demo/plantModel'
import LiveDemo from './demo/LiveDemo'

const HOURS_PER_YEAR = 8000
const MAX_VALUE = worstCaseInput() * 1.02 // skala lebar dikunci → penghematan terlihat menyusut
const num = (v, d = 0) => v.toLocaleString('id-ID', { maximumFractionDigits: d, minimumFractionDigits: d })

const BASELINE = energyBalance({ nodes: NODES, links: plantLinks(PRESETS.actual) })

export default function App() {
  const [levers, setLevers] = useState(() => {
    const { label: _, ...p } = PRESETS.actual
    return p
  })
  const [mode, setMode] = useState('sim') // sim | live
  const [animate, setAnimate] = useState(true)
  const [speed, setSpeed] = useState(1)

  const links = useMemo(() => plantLinks(levers), [levers])
  const bal = useMemo(() => energyBalance({ nodes: NODES, links }), [links])
  const saved = BASELINE.input - bal.input

  const applyPreset = (key) => {
    const { label: _, ...p } = PRESETS[key]
    setLevers(p)
  }
  const activePreset = Object.entries(PRESETS).find(([, p]) =>
    Object.keys(LEVERS).every((k) => Math.abs(p[k] - levers[k]) < 1e-9),
  )?.[0]

  if (mode === 'live')
    return (
      <main className="page">
        <ModeTabs mode={mode} setMode={setMode} />
        <LiveDemo maxValue={MAX_VALUE} />
      </main>
    )

  return (
    <main className="page">
      <ModeTabs mode={mode} setMode={setMode} />
      <header className="head">
        <div>
          <p className="eyebrow">Energy · Neraca energi pabrik</p>
          <h1>Ke mana perginya setiap GJ?</h1>
        </div>
        <nav className="tabs">
          {Object.entries(PRESETS).map(([k, p]) => (
            <button key={k} className={k === activePreset ? 'is-on' : ''} onClick={() => applyPreset(k)}>
              {p.label}
            </button>
          ))}
        </nav>
      </header>

      <section className="kpis">
        <Kpi label="Total masukan" value={`${num(bal.input)} GJ/jam`} />
        <Kpi label="Energi ke produk" value={`${num(bal.useful)} GJ/jam`} tone="ok" />
        <Kpi label="Total kerugian" value={`${num(bal.loss)} GJ/jam`} tone="bad" />
        <Kpi label="Efisiensi pabrik" value={`${num(bal.efficiency * 100, 1)}%`} />
        <Kpi
          label="Hemat vs aktual"
          value={saved > 0.5 ? `${num(saved)} GJ/jam` : '—'}
          sub={saved > 0.5 ? `≈ ${num((saved * HOURS_PER_YEAR) / 1000)} TJ/tahun` : 'geser tuas di bawah'}
          tone={saved > 0.5 ? 'ok' : undefined}
        />
      </section>

      <EnergySankey nodes={NODES} links={links} maxValue={MAX_VALUE} animate={animate} speed={speed} />

      <section className="levers">
        {Object.entries(LEVERS).map(([k, l]) => (
          <label key={k} className="lever">
            <span className="lever-top">
              <span>{l.label}</span>
              <b>{num(levers[k] * 100, 1)}%</b>
            </span>
            <input
              type="range"
              min={l.min}
              max={l.max}
              step={l.step}
              value={levers[k]}
              onChange={(e) => setLevers((s) => ({ ...s, [k]: Number(e.target.value) }))}
            />
            <small>{l.hint}</small>
          </label>
        ))}
        <div className="lever playback">
          <button onClick={() => setAnimate((a) => !a)}>{animate ? '❚❚ Jeda aliran' : '▶ Putar aliran'}</button>
          <span className="tabs">
            {[0.5, 1, 2].map((s) => (
              <button key={s} className={s === speed ? 'is-on' : ''} onClick={() => setSpeed(s)}>
                {s}×
              </button>
            ))}
          </span>
        </div>
      </section>

      <p className="hint">
        Arahkan kursor ke aliran / node untuk detail · klik node untuk mengunci sorotan (Esc untuk lepas) · angka ilustratif
      </p>
    </main>
  )
}

function ModeTabs({ mode, setMode }) {
  return (
    <nav className="tabs">
      <button className={mode === 'sim' ? 'is-on' : ''} onClick={() => setMode('sim')}>Simulator skenario</button>
      <button className={mode === 'live' ? 'is-on' : ''} onClick={() => setMode('live')}>Live (mock API)</button>
    </nav>
  )
}

function Kpi({ label, value, sub, tone }) {
  return (
    <div className={`kpi${tone ? ` is-${tone}` : ''}`}>
      <span>{label}</span>
      <b>{value}</b>
      {sub && <small>{sub}</small>}
    </div>
  )
}
