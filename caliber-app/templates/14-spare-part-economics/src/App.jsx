import { useMemo, useState } from 'react'
import { SpareEconomics } from './features/spare-economics'
import { parts as baseParts } from './demo/parts'
import Slider from './demo/Slider'

export default function App() {
  const [holding, setHolding] = useState(20)
  const [leadX, setLeadX] = useState(1)
  const [downX, setDownX] = useState(1)

  // Skenario: biaya modal naik, gangguan supply chain (lead time ×), margin naik (downtime ×)
  const parts = useMemo(
    () => baseParts.map((p) => ({ ...p, holdingRate: holding / 100, leadTimeDays: Math.round(p.leadTimeDays * leadX), emergencyLeadDays: p.emergencyLeadDays == null ? null : p.emergencyLeadDays * leadX, downtimeCostPerHour: p.downtimeCostPerHour * downX })),
    [holding, leadX, downX],
  )

  return (
    <main className="page">
      <header className="head">
        <div>
          <p className="eyebrow">Reliability · spare-part optimization · supply-chain readiness</p>
          <h1>Spare-Part Economics</h1>
        </div>
        <div className="controls">
          <Slider label="Holding rate / thn" value={holding} onChange={setHolding} min={5} max={40} format={(v) => `${v}%`} />
          <Slider label="Lead time supplier" value={leadX} onChange={setLeadX} min={0.5} max={3} step={0.25} format={(v) => `×${v}`} />
          <Slider label="Biaya downtime" value={downX} onChange={setDownX} min={0.25} max={3} step={0.25} format={(v) => `×${v}`} />
        </div>
      </header>

      <p className="hint">
        Menyimpan stok = <b>working capital & biaya simpan</b>. Tidak menyimpan = <b>downtime menunggu part</b>. Modul ini
        mencari jumlah stok dengan total biaya terendah per part (model Poisson base-stock), lalu menunjukkan dampaknya ke
        modal kerja — bahasa CFO. Coba geser <b>lead time ×2</b> untuk mensimulasikan gangguan supply chain.
      </p>

      <SpareEconomics parts={parts} />
    </main>
  )
}
