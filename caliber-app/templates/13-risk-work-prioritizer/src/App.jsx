import { useState } from 'react'
import { STRATEGIES, WorkPrioritizer, formatUSD } from './features/work-prioritizer'
import { orders } from './demo/orders'
import Slider from './demo/Slider'

export default function App() {
  const [capacity, setCapacity] = useState(40)
  const [strategy, setStrategy] = useState('optimal')
  const [sel, setSel] = useState(null)

  return (
    <main className="page">
      <header className="head">
        <div>
          <p className="eyebrow">Reliability · prioritize alerts</p>
          <h1>Risk-Based Work Prioritizer</h1>
        </div>
        <div className="controls">
          <Slider label="Kapasitas crew minggu ini" value={capacity} onChange={setCapacity} min={8} max={120} step={4} format={(v) => `${v} jam`} />
        </div>
      </header>

      <p className="hint">
        Setiap alert/WO diberi harga: <b>US$ at risk = P(failure) × (lost margin/jam × MTTR + biaya repair)</b>. Crew terbatas →
        pilih paket yang memensiunkan US$ terbanyak. Ganti strategi untuk melihat berapa yang “hilang” jika memakai FIFO atau
        severity alarm saja.
      </p>

      <WorkPrioritizer
        orders={orders}
        capacityHours={capacity}
        strategy={strategy}
        onStrategyChange={setStrategy}
        selectedId={sel?.id}
        onSelect={setSel}
      />

      {sel && (
        <p className="hint">
          <b>{sel.id} · {sel.title}</b> ({sel.asset}) — peringkat #{sel.rank} menurut “{STRATEGIES[strategy].label}”. Jika gagal:
          lost margin {formatUSD(sel.lostMargin)} + repair {formatUSD(sel.repairCost)} = {formatUSD(sel.consequence)}; dikali P{' '}
          {Math.round(sel.p * 100)}% → <b>{formatUSD(sel.usdAtRisk)}</b>. Efisiensi {formatUSD(sel.perHour)} per jam kerja.
        </p>
      )}
    </main>
  )
}
