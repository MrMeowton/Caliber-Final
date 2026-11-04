import { useState } from 'react'
import { ProductionMargin, formatKt, formatUSD } from './features/production-margin'
import { products, startMonth } from './demo/products'
import Slider from './demo/Slider'

const COVER = [0.8, 0.9, 0.95]

export default function App() {
  const [horizon, setHorizon] = useState(6)
  const [shock, setShock] = useState(0)
  const [cov, setCov] = useState(0)
  const [sel, setSel] = useState(null)

  return (
    <main className="page">
      <header className="head">
        <div>
          <p className="eyebrow">Smart Manufacturing & Energy · production forecasting</p>
          <h1>Production Forecast → Margin View</h1>
        </div>
        <div className="controls">
          <Slider label="Horizon" value={horizon} onChange={setHorizon} min={1} max={12} format={(v) => `${v} bln`} />
          <Slider label="Shock spread produk" value={shock} onChange={setShock} min={-40} max={30} step={5} format={(v) => `${v > 0 ? '+' : ''}${v}%`} />
          <Slider label="Interval keyakinan" value={cov} onChange={setCov} min={0} max={2} format={(v) => `${COVER[v] * 100}%`} />
        </div>
      </header>

      <p className="hint">
        Forecast produksi (Holt + interval prediksi) langsung dikali <b>spread produk</b> (harga − biaya variabel) → forecast
        margin. Bandingkan dengan rencana produksi: celah merah = <b>margin at risk</b>. Turunkan spread untuk mensimulasikan
        pelemahan harga polimer.
      </p>

      <ProductionMargin
        products={products}
        startMonth={startMonth}
        horizon={horizon}
        spreadShock={shock / 100}
        coverage={COVER[cov]}
        selectedId={sel?.id}
        onSelect={setSel}
      />

      {sel && (
        <p className="hint">
          <b>{sel.name}</b>: forecast {formatKt(sel.volume50)} vs rencana {formatKt(sel.volumePlan)} dalam {horizon} bulan; spread rata-rata{' '}
          {formatUSD(sel.avgSpread, { compact: false })}/t → margin at risk <b>{formatUSD(sel.atRisk)}</b> (downside {formatUSD(sel.downside)}). Tren model:{' '}
          {sel.model.trend >= 0 ? '+' : ''}{Math.round(sel.model.trend)} t/bln.
        </p>
      )}
    </main>
  )
}
