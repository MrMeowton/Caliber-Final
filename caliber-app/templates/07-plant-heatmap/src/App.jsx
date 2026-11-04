// DEMO: contoh pemakaian modul heatmap
import { useEffect, useMemo, useState } from 'react'
import { DEFAULT_LAYERS, PlantHeatmap, layerStats, withDomains } from './features/heatmap'
import { AREAS, DOMAINS, UNITS, VIEW, plantData } from './demo/plantLayout'

const LAYERS = withDomains(DEFAULT_LAYERS, DOMAINS) // skala terkunci → warna sebanding antar waktu
const TICK_MS = 600

function Backdrop() {
  return (
    <>
      <rect x="12" y="12" width="976" height="576" rx="14" className="bd-site" />
      {/* jalan utama */}
      <rect x="12" y="294" width="976" height="16" className="bd-road" />
      <rect x="530" y="12" width="16" height="576" className="bd-road" />
      {/* pipe rack: cracker ↔ utilitas, cracker ↔ polimer, utilitas ↔ tank farm */}
      <path d="M505 191 H560 M500 150 H575 M440 285 V345 M770 255 V345" className="bd-pipe" />
      {AREAS.map((a) => (
        <g key={a.label}>
          <rect x={a.x} y={a.y} width={a.w} height={a.h} rx="10" className="bd-area" />
          <text x={a.x + 10} y={a.y + 16} className="bd-label">
            {a.label.toUpperCase()}
          </text>
        </g>
      ))}
      <text x="972" y="584" className="bd-label" textAnchor="end">
        U ↑ · skala ilustratif
      </text>
    </>
  )
}

export default function App() {
  const [t, setT] = useState(0)
  const [live, setLive] = useState(true)
  const [anomalyOn, setAnomalyOn] = useState(false)
  const [anomaly, setAnomaly] = useState(0)
  const [layer, setLayer] = useState('energy')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    if (!live && anomaly === (anomalyOn ? 1 : 0)) return
    const id = setInterval(() => {
      if (live) setT((x) => x + TICK_MS / 1000)
      setAnomaly((a) => (anomalyOn ? Math.min(1, a + 0.08) : Math.max(0, a - 0.15)))
    }, TICK_MS)
    return () => clearInterval(id)
  }, [live, anomalyOn, anomaly])

  const data = useMemo(() => plantData(t, anomaly), [t, anomaly])
  const totals = useMemo(() => Object.fromEntries(LAYERS.map((l) => [l.id, layerStats(l, UNITS, data)])), [data])
  const num = (v, d = 0) => v.toLocaleString('id-ID', { maximumFractionDigits: d, minimumFractionDigits: d })

  return (
    <main className="page">
      <header className="head">
        <div>
          <p className="eyebrow">Heatmap overlay · Layout pabrik</p>
          <h1>Di mana energi, emisi, dan risiko menumpuk?</h1>
        </div>
        <div className="controls">
          <button className={live ? 'is-on' : ''} onClick={() => setLive((v) => !v)}>
            {live ? '● Live' : '❚❚ Dijeda'}
          </button>
          <button className={anomalyOn ? 'is-bad' : ''} onClick={() => setAnomalyOn((v) => !v)}>
            {anomalyOn ? 'Pulihkan C-301' : 'Simulasikan anomali C-301'}
          </button>
        </div>
      </header>

      <section className="kpis">
        <Kpi label="Total energi" value={`${num(totals.energy.total)} GJ/jam`} on={layer === 'energy'} onClick={() => setLayer('energy')} />
        <Kpi label="Total emisi" value={`${num(totals.emission.total, 1)} tCO₂e/jam`} on={layer === 'emission'} onClick={() => setLayer('emission')} />
        <Kpi
          label="Unit risiko kritis"
          value={`${totals.risk.alerts} unit`}
          tone={totals.risk.alerts > 1 ? 'bad' : undefined}
          on={layer === 'risk'}
          onClick={() => setLayer('risk')}
        />
      </section>

      <PlantHeatmap
        units={UNITS}
        data={data}
        layers={LAYERS}
        layer={layer}
        onLayerChange={setLayer}
        width={VIEW.width}
        height={VIEW.height}
        backdrop={<Backdrop />}
        globalHotkeys
        onSelect={setSelected}
      />

      <p className="hint">
        {selected ? (
          <>
            <b>{selected.label}</b> dipilih (diterima host lewat <code>onSelect</code>) — di project utama, buka panel detail
            unit di sini. <kbd>Esc</kbd> untuk lepas.
          </>
        ) : (
          <>
            Toggle layer: klik tombol / kartu KPI, atau tekan <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd>. Hover/klik unit untuk detail;{' '}
            <kbd>Tab</kbd> untuk berpindah unit. Gudang tidak punya meter emisi → diarsir.
          </>
        )}
      </p>
    </main>
  )
}

function Kpi({ label, value, tone, on, onClick }) {
  return (
    <button className={`kpi${tone ? ` is-${tone}` : ''}${on ? ' is-on' : ''}`} onClick={onClick}>
      <span>{label}</span>
      <b>{value}</b>
    </button>
  )
}
