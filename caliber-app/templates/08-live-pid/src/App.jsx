// DEMO: contoh pemakaian modul P&ID hidup
import { useEffect, useRef, useState } from 'react'
import { LivePID } from './features/pid'
import { DIAGRAM, INITIAL_STATE, TAGS, step } from './demo/process'

const TICK_MS = 400

export default function App() {
  const [live, setLive] = useState(true)
  const [pumpOn, setPumpOn] = useState(true)
  const [fouling, setFouling] = useState(false)
  const [spFlow, setSpFlow] = useState(40)
  const [spTemp, setSpTemp] = useState(85)
  const [selected, setSelected] = useState(null)

  const sim = useRef(INITIAL_STATE)
  const foul = useRef(0) // fouling naik/turun bertahap, bukan seketika
  const [values, setValues] = useState(() => step(INITIAL_STATE, 0, { pumpOn: true, fouling: 0, spFlow: 40, spTemp: 85, spLevel: 50 }).values)

  useEffect(() => {
    if (!live) return
    const id = setInterval(() => {
      foul.current = fouling ? Math.min(1, foul.current + 0.04) : Math.max(0, foul.current - 0.08)
      const r = step(sim.current, TICK_MS / 1000, { pumpOn, fouling: foul.current, spFlow, spTemp, spLevel: 50 })
      sim.current = r.state
      setValues(r.values)
    }, TICK_MS)
    return () => clearInterval(id)
  }, [live, pumpOn, fouling, spFlow, spTemp])

  const reset = () => {
    sim.current = INITIAL_STATE
    foul.current = 0
    setPumpOn(true)
    setFouling(false)
    setSpFlow(40)
    setSpTemp(85)
  }

  return (
    <main className="page">
      <header className="head">
        <div>
          <p className="eyebrow">P&amp;ID hidup · Unit pemanasan umpan</p>
          <h1>Pipa yang mengalir, tag yang bicara</h1>
        </div>
        <div className="controls">
          <button className={live ? 'is-on' : ''} onClick={() => setLive((v) => !v)}>
            {live ? '● Live' : '❚❚ Jeda'}
          </button>
          <button className={pumpOn ? '' : 'is-bad'} onClick={() => setPumpOn((v) => !v)}>
            {pumpOn ? 'Trip pompa P-101' : 'Jalankan lagi P-101'}
          </button>
          <button className={fouling ? 'is-bad' : ''} onClick={() => setFouling((v) => !v)}>
            {fouling ? 'Bersihkan E-101' : 'Simulasikan fouling E-101'}
          </button>
          <button onClick={reset}>Reset</button>
        </div>
      </header>

      <div className="sliders">
        <label>
          SP FIC-101
          <input type="range" min="15" max="70" step="1" value={spFlow} onChange={(e) => setSpFlow(+e.target.value)} />
          <b>{spFlow} m³/h</b>
        </label>
        <label>
          SP TIC-102
          <input type="range" min="70" max="100" step="1" value={spTemp} onChange={(e) => setSpTemp(+e.target.value)} />
          <b>{spTemp} °C</b>
        </label>
      </div>

      <LivePID diagram={DIAGRAM} tags={TAGS} values={values} selectedTag={selected} onSelect={setSelected} />

      <p className="hint">
        Kecepatan aliran pada pipa sebanding dengan tag di <code>flowTag</code>; pipa berhenti saat laju 0. Hover/klik gelembung
        instrumen atau kartu untuk menyorot loop kontrolnya · <kbd>Esc</kbd> lepas pilihan.{' '}
        {selected ? (
          <>
            Dipilih: <b>{selected}</b> (dikirim ke host lewat <code>onSelect</code>).
          </>
        ) : (
          'Coba trip pompa: laju umpan jatuh, FV-101 wind-up ke 100 %, level tangki naik ke alarm.'
        )}
      </p>
    </main>
  )
}
