import { useState } from 'react'
import { Macc } from './features/macc'
import { carriers, opportunities } from './demo/opportunities'
import Slider from './demo/Slider'

export default function App() {
  const [carbon, setCarbon] = useState(30)
  const [rate, setRate] = useState(10)
  const [budget, setBudget] = useState(60)
  const [target, setTarget] = useState(150)
  const [onlyEcon, setOnlyEcon] = useState(true)

  return (
    <main className="page">
      <header className="head">
        <div>
          <p className="eyebrow">Smart Manufacturing & Energy · efficient resource utilization</p>
          <h1>MACC — Marginal Abatement Cost Curve</h1>
        </div>
        <div className="controls">
          <Slider label="Harga karbon" value={carbon} onChange={setCarbon} min={0} max={150} step={5} format={(v) => `$${v}/t`} />
          <Slider label="Discount rate" value={rate} onChange={setRate} min={4} max={16} format={(v) => `${v}%`} />
          <Slider label="Anggaran capex" value={budget} onChange={setBudget} min={5} max={200} step={5} format={(v) => `$${v}M`} />
          <Slider label="Target abatement" value={target} onChange={setTarget} min={10} max={400} step={10} format={(v) => `${v}k t/thn`} />
          <button className={onlyEcon ? 'is-on' : ''} onClick={() => setOnlyEcon((v) => !v)}>
            {onlyEcon ? '✓ ' : ''}Hanya yang ≤ harga karbon
          </button>
        </div>
      </header>

      <p className="hint">
        Setiap batang = satu proyek. <b>Lebar</b> = tCO₂e yang dikurangi per tahun, <b>tinggi</b> = biaya per tCO₂e (anualisasi
        capex + opex − penghematan energi). Batang <b>di bawah nol</b> menghasilkan uang; batang di bawah garis merah layak pada
        harga karbon itu. Proyek dipilih dari kiri sampai anggaran atau target terpenuhi.
      </p>

      <Macc
        opportunities={opportunities}
        carriers={carriers}
        discountRate={rate / 100}
        carbonPrice={carbon}
        capexBudget={budget * 1e6}
        target={target * 1000}
        onlyEconomic={onlyEcon}
      />
    </main>
  )
}
