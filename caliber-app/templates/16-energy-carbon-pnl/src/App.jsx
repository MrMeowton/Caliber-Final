import { useMemo, useState } from 'react'
import { EnergyCarbonPnL, formatNum, formatUSD } from './features/energy-pnl'
import { carriers as baseCarriers, units } from './demo/plant'
import Slider from './demo/Slider'

export default function App() {
  const [gas, setGas] = useState(7.5)
  const [power, setPower] = useState(85)
  const [carbon, setCarbon] = useState(30)
  const [sel, setSel] = useState(null)

  const carriers = useMemo(
    () => ({
      ...baseCarriers,
      fuelGas: { ...baseCarriers.fuelGas, price: gas },
      // steam dibuat dari fuel gas → harganya ikut (≈ gas / efisiensi boiler 0,85 + O&M)
      steam: { ...baseCarriers.steam, price: gas / 0.85 + 0.7 },
      power: { ...baseCarriers.power, price: power },
    }),
    [gas, power],
  )

  return (
    <main className="page">
      <header className="head">
        <div>
          <p className="eyebrow">Smart Manufacturing & Energy · energy and emissions monitoring</p>
          <h1>Energy & Carbon P&L per Unit</h1>
        </div>
        <div className="controls">
          <Slider label="Harga fuel gas" value={gas} onChange={setGas} min={3} max={14} step={0.5} format={(v) => `$${v}/GJ`} />
          <Slider label="Tarif listrik" value={power} onChange={setPower} min={50} max={140} step={5} format={(v) => `$${v}/MWh`} />
          <Slider label="Harga karbon" value={carbon} onChange={setCarbon} min={0} max={100} step={5} format={(v) => `$${v}/tCO₂e`} />
        </div>
      </header>

      <p className="hint">
        SEC × harga energi → <b>US$ per ton produk</b>, ditambah emisi × harga karbon. Energi dan emisi tidak lagi “overhead”
        — tapi baris biaya yang bisa dibandingkan antar unit dan terhadap benchmark. Naikkan <b>harga karbon</b> untuk melihat
        unit mana yang paling terpapar regulasi.
      </p>

      <EnergyCarbonPnL units={units} carriers={carriers} carbonPrice={carbon} selectedId={sel?.id} onSelect={setSel} />

      {sel && (
        <p className="hint">
          <b>{sel.name}</b>: SEC {formatNum(sel.sec, 2)} GJ/t{sel.benchmarkSec != null && <> vs benchmark {formatNum(sel.benchmarkSec, 2)}</>}, biaya
          energi+karbon <b>{formatUSD(sel.totalPerT, { compact: false, digits: 2 })}/t</b>, intensitas {formatNum(sel.intensity, 3)} tCO₂e/t. Menutup
          gap SEC ke benchmark bernilai <b>{formatUSD(sel.gapCost)}/tahun</b> → kandidat proyek di MACC (project 17).
        </p>
      )}
    </main>
  )
}
