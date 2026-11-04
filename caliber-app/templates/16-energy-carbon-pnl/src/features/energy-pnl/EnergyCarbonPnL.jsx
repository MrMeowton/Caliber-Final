import { useMemo } from 'react'
import { formatNum, formatUSD, plantPnl } from './pnl'
import './energy-pnl.css'

const COLORS = ['#f97316', '#a78bfa', '#38bdf8', '#facc15', '#2dd4bf']

/**
 * Laporan "laba-rugi" energi & karbon per unit: baris = pos biaya, kolom = unit.
 * Props: units, carriers, carbonPrice, selectedId, onSelect
 */
export function EnergyCarbonPnL({ units, carriers, carbonPrice = 0, selectedId, onSelect }) {
  const p = useMemo(() => plantPnl(units, carriers, { carbonPrice }), [units, carriers, carbonPrice])
  const color = Object.fromEntries(Object.keys(carriers).map((k, i) => [k, carriers[k].color ?? COLORS[i % COLORS.length]]))

  return (
    <div className="ep-root">
      <div className="ep-kpis">
        <Kpi value={formatUSD(p.energyCost)} label="biaya energi / thn" />
        <Kpi value={formatUSD(p.carbonCost)} label={`biaya karbon @ ${formatUSD(carbonPrice, { compact: false })}/tCO₂e`} tone="co2" />
        <Kpi value={`${formatNum(p.co2 / 1000, 0)}k t`} label="emisi CO₂e / thn (scope 1+2)" />
        <Kpi value={formatUSD(p.gapCost)} label="bocor vs benchmark SEC / thn" tone="bad" />
      </div>

      <PerTonBars rows={p.rows} carriers={carriers} color={color} selectedId={selectedId} onSelect={onSelect} />

      <div className="ep-scroll">
        <table className="ep-table">
          <thead>
            <tr>
              <th>Pos (per ton produk)</th>
              {p.rows.map((r) => (
                <th key={r.id} className={selectedId === r.id ? 'is-sel' : ''} onClick={() => onSelect?.(r)}>
                  {r.name}<small>{r.product}</small>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <Row label="Produksi" fmt={(r) => `${formatNum(r.production / 1000, 0)}k t`} rows={p.rows} muted />
            <Row label="SEC (GJ/t)" fmt={(r) => formatNum(r.sec, 2)} rows={p.rows} sub={(r) => r.benchmarkSec != null && `bench ${formatNum(r.benchmarkSec, 2)} · ${r.secGapPct > 0 ? '+' : ''}${Math.round(r.secGapPct * 100)}%`} />
            {Object.entries(carriers).map(([k, c]) => (
              <Row key={k} label={<><i className="ep-sw" style={{ background: color[k] }} />{c.label}</>} rows={p.rows} indent
                fmt={(r) => formatUSD(r.lines.find((l) => l.key === k).costPerT, { compact: false, digits: 2 })} />
            ))}
            <Row label="Biaya energi" fmt={(r) => formatUSD(r.energyPerT, { compact: false, digits: 2 })} rows={p.rows} strong />
            <Row label="Intensitas (tCO₂e/t)" fmt={(r) => formatNum(r.intensity, 3)} rows={p.rows} />
            <Row label={<><i className="ep-sw is-co2" />Biaya karbon</>} fmt={(r) => formatUSD(r.carbonPerT, { compact: false, digits: 2 })} rows={p.rows} indent />
            <Row label="Total energi + karbon" fmt={(r) => formatUSD(r.totalPerT, { compact: false, digits: 2 })} rows={p.rows} strong total />
            <Row label="Bocor vs benchmark / thn" fmt={(r) => (r.gapCost ? formatUSD(r.gapCost) : '—')} rows={p.rows} bad />
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Kpi({ value, label, tone }) {
  return (
    <div className={`ep-kpi ${tone ? `is-${tone}` : ''}`}>
      <b>{value}</b>
      <span>{label}</span>
    </div>
  )
}

function Row({ label, rows, fmt, sub, strong, total, bad, muted, indent }) {
  return (
    <tr className={`${strong ? 'is-strong' : ''} ${total ? 'is-total' : ''} ${bad ? 'is-bad' : ''} ${muted ? 'is-muted' : ''}`}>
      <td className={indent ? 'is-indent' : ''}>{label}</td>
      {rows.map((r) => (
        <td key={r.id}>
          {fmt(r)}
          {sub?.(r) && <small>{sub(r)}</small>}
        </td>
      ))}
    </tr>
  )
}

/** Bar bertumpuk US$/t per unit: tiap carrier + karbon. */
export function PerTonBars({ rows, carriers, color, selectedId, onSelect }) {
  const max = Math.max(1, ...rows.map((r) => r.totalPerT))
  return (
    <div className="ep-bars">
      {rows.map((r) => (
        <button key={r.id} className={`ep-bar ${selectedId === r.id ? 'is-sel' : ''}`} onClick={() => onSelect?.(r)}>
          <span className="ep-bar-name">{r.name}</span>
          <span className="ep-bar-track">
            {r.lines.map((l) => (
              <i key={l.key} style={{ width: `${(l.costPerT / max) * 100}%`, background: color[l.key] }} title={`${carriers[l.key].label}: ${formatUSD(l.costPerT, { compact: false, digits: 2 })}/t`} />
            ))}
            <i className="is-co2" style={{ width: `${(r.carbonPerT / max) * 100}%` }} title={`Karbon: ${formatUSD(r.carbonPerT, { compact: false, digits: 2 })}/t`} />
          </span>
          <b>{formatUSD(r.totalPerT, { compact: false, digits: 0 })}/t</b>
        </button>
      ))}
    </div>
  )
}
