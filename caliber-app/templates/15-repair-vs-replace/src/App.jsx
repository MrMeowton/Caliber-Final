import { useMemo, useState } from 'react'
import { RepairReplaceAdvisor } from './features/repair-replace'
import Slider from './demo/Slider'

// DEMO: pompa umpan boiler (BFW) umur 27 tahun, angka ilustratif.
// Repair = overhaul besar; Replace = pompa baru efisiensi tinggi + motor IE4.
const base = {
  repair: { upfront: 380_000, opex: 120_000, opexGrowth: 0.08, failuresPerYear: 1.6, downtimeHoursPerFailure: 14, energyCost: 640_000, energyGrowth: 0.03 },
  replace: { upfront: 2_100_000, salvageNow: 60_000, installDowntimeHours: 36, life: 25, opex: 45_000, opexGrowth: 0.03, failuresPerYear: 0.3, downtimeHoursPerFailure: 10, energyCost: 470_000, energyGrowth: 0.03 },
}

export default function App() {
  const [capex, setCapex] = useState(2.4)
  const [rate, setRate] = useState(10)
  const [horizon, setHorizon] = useState(10)
  const [margin, setMargin] = useState(6)
  const [aging, setAging] = useState(12)

  const input = useMemo(
    () => ({
      repair: { ...base.repair, failureGrowth: aging / 100 },
      replace: { ...base.replace, upfront: capex * 1e6 },
      discountRate: rate / 100,
      horizonYears: horizon,
      lostMarginPerHour: margin * 1000,
    }),
    [capex, rate, horizon, margin, aging],
  )

  return (
    <main className="page">
      <header className="head">
        <div>
          <p className="eyebrow">Reliability · keputusan capex aset menua</p>
          <h1>Repair vs Replace Advisor</h1>
        </div>
        <div className="controls">
          <Slider label="Capex pengganti" value={capex} onChange={setCapex} min={0.8} max={4} step={0.1} format={(v) => `$${v.toFixed(1)}M`} />
          <Slider label="Discount rate (WACC)" value={rate} onChange={setRate} min={4} max={18} format={(v) => `${v}%`} />
          <Slider label="Horizon" value={horizon} onChange={setHorizon} min={3} max={20} format={(v) => `${v} thn`} />
          <Slider label="Lost margin / jam" value={margin} onChange={setMargin} min={2} max={50} format={(v) => `$${v}K`} />
          <Slider label="Laju kenaikan kegagalan (aging)" value={aging} onChange={setAging} min={0} max={30} format={(v) => `${v}%/thn`} />
        </div>
      </header>

      <p className="hint">
        <b>Pompa umpan boiler P-501</b> — umur 27 tahun, 1,6 kegagalan/tahun dan terus naik. Overhaul $380K vs pompa baru ±$2,4M
        yang 27% lebih hemat energi. Geser asumsi untuk melihat kapan keputusan berbalik — itu bahasa komite capex.
      </p>

      <RepairReplaceAdvisor input={input} assetName="Pompa BFW P-501" labels={{ repair: 'Overhaul', replace: 'Ganti baru' }} />
    </main>
  )
}
