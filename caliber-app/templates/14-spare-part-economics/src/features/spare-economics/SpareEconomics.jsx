import { useMemo, useState } from 'react'
import { formatUSD, portfolio } from './economics'
import './spare-economics.css'

/**
 * Portofolio spare part (tabel) + detail part terpilih (kurva biaya & KPI).
 * Props: parts, selectedId?/onSelect?, showPortfolio
 */
export function SpareEconomics({ parts, selectedId: selProp, onSelect, showPortfolio = true }) {
  const [selLocal, setSelLocal] = useState(parts[0]?.id)
  const selectedId = selProp ?? selLocal
  const select = (id) => (onSelect ? onSelect(id) : setSelLocal(id))
  const pf = useMemo(() => portfolio(parts), [parts])
  const sel = pf.rows.find((r) => r.part.id === selectedId) ?? pf.rows[0]

  return (
    <div className="se-root">
      {showPortfolio && (
        <>
          <div className="se-kpis">
            <Kpi tone="good" value={formatUSD(pf.savingsPerYear)} label="penghematan biaya total / tahun" />
            <Kpi tone={pf.capitalDelta <= 0 ? 'good' : 'warn'} value={formatUSD(pf.capitalDelta, { sign: true })} label="perubahan working capital" />
            <Kpi value={`${formatUSD(pf.currentCapital)} → ${formatUSD(pf.optimalCapital)}`} label="nilai stok saat ini → optimal" />
          </div>
          <PortfolioTable rows={pf.rows} selectedId={sel?.part.id} onSelect={select} />
        </>
      )}
      {sel && <SparePartDetail result={sel} />}
    </div>
  )
}

const pctFmt = (f) => `${(f * 100).toFixed(f > 0.99 && f < 1 ? 1 : 0)}%`

function Kpi({ value, label, tone }) {
  return (
    <div className={`se-kpi ${tone ? `is-${tone}` : ''}`}>
      <b>{value}</b>
      <span>{label}</span>
    </div>
  )
}

export function PortfolioTable({ rows, selectedId, onSelect }) {
  return (
    <div className="se-scroll">
      <table className="se-table">
        <thead>
          <tr>
            <th>Part</th>
            <th>Pakai/thn</th>
            <th>Lead time</th>
            <th>Stok kini → optimal</th>
            <th>Fill rate</th>
            <th>Δ modal</th>
            <th>Hemat/thn</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const dir = r.current ? Math.sign(r.best.S - r.current.S) : 0
            return (
              <tr key={r.part.id} className={selectedId === r.part.id ? 'is-sel' : ''} onClick={() => onSelect(r.part.id)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onSelect(r.part.id)}>
                <td><b>{r.part.name}</b><small>{r.part.asset}</small></td>
                <td>{r.part.annualDemand}</td>
                <td>{r.part.leadTimeDays} hr</td>
                <td>
                  {r.current?.S ?? '—'} → <b className={dir > 0 ? 'is-up' : dir < 0 ? 'is-down' : ''}>{r.best.S}</b>
                  {dir !== 0 && <em className={dir > 0 ? 'is-up' : 'is-down'}>{dir > 0 ? '▲ tambah' : '▼ kurangi'}</em>}
                </td>
                <td>{pctFmt(r.best.fillRate)}</td>
                <td className={r.capitalDelta > 0 ? 'is-up' : r.capitalDelta < 0 ? 'is-down' : ''}>{r.capitalDelta == null ? '—' : formatUSD(r.capitalDelta, { sign: true })}</td>
                <td className="is-save">{r.savingsPerYear == null ? '—' : formatUSD(r.savingsPerYear)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/** Detail satu part: KPI + kurva biaya. `result` = optimize(part). */
export function SparePartDetail({ result }) {
  const { part, best, current, reorderPoint } = result
  return (
    <div className="se-detail">
      <div className="se-dh">
        <div>
          <h3>{part.name}</h3>
          <small>{part.asset} · harga {formatUSD(part.unitCost)} · downtime {formatUSD(part.downtimeCostPerHour)}/jam · lead time {part.leadTimeDays} hari</small>
        </div>
        <div className="se-verdict">
          Simpan <b>{best.S}</b> unit · pesan ulang saat stok turun ke <b>{reorderPoint}</b>
        </div>
      </div>
      <div className="se-dk">
        <Kpi value={pctFmt(best.fillRate)} label="fill rate (part ada saat dibutuhkan)" />
        <Kpi value={`${best.downtimeHours.toFixed(best.downtimeHours < 1 ? 2 : 1)} jam`} label="ekspektasi downtime menunggu part / thn" />
        <Kpi value={formatUSD(best.capital)} label="working capital terikat" />
        <Kpi tone="good" value={formatUSD(best.totalCost)} label={current ? `biaya/thn (kini ${formatUSD(current.totalCost)})` : 'biaya total / thn'} />
      </div>
      <CostCurve result={result} />
    </div>
  )
}

/** Kurva biaya simpan ↑, biaya downtime ↓, total (U) terhadap jumlah stok S. */
export function CostCurve({ result, height = 260 }) {
  const { curve, best, current } = result
  const W = 800
  const H = height
  const pad = { l: 64, r: 16, t: 36, b: 40 }
  const xMax = curve.length - 1
  const yMax = Math.max(best.totalCost * 3, curve.at(-1).holdingCost * 1.1, 1)
  const X = (s) => pad.l + (s / Math.max(1, xMax)) * (W - pad.l - pad.r)
  const Y = (v) => H - pad.b - (Math.min(v, yMax * 1.05) / yMax) * (H - pad.t - pad.b)
  const line = (k) => curve.map((p, i) => `${i ? 'L' : 'M'}${X(p.S)},${Y(p[k])}`).join(' ')
  const yt = [0, 0.25, 0.5, 0.75, 1].map((f) => f * yMax)
  return (
    <svg className="se-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Kurva biaya vs jumlah stok">
      {yt.map((v) => (
        <g key={v}>
          <line x1={pad.l} x2={W - pad.r} y1={Y(v)} y2={Y(v)} className="se-grid" />
          <text x={pad.l - 8} y={Y(v) + 4} textAnchor="end" className="se-ax">{formatUSD(v)}</text>
        </g>
      ))}
      {curve.map((p) => (
        <text key={p.S} x={X(p.S)} y={H - pad.b + 18} textAnchor="middle" className="se-ax">{p.S}</text>
      ))}
      <text x={(W + pad.l) / 2} y={H - 4} textAnchor="middle" className="se-ax">jumlah stok (S)</text>
      <rect x={X(best.S) - 14} y={pad.t} width="28" height={H - pad.t - pad.b} className="se-best-band" />
      <path d={line('holdingCost')} className="se-l is-hold" />
      <path d={line('downtimeCost')} className="se-l is-down" />
      <path d={line('totalCost')} className="se-l is-total" />
      {current && (
        <g className="se-cur">
          <circle cx={X(current.S)} cy={Y(current.totalCost)} r="6" />
          <text x={X(current.S) + 10} y={Y(current.totalCost) + 20}>kini {formatUSD(current.totalCost)}{current.totalCost > yMax ? ' ↑' : ''}</text>
        </g>
      )}
      <g className="se-opt">
        <circle cx={X(best.S)} cy={Y(best.totalCost)} r="7" />
        <text x={X(best.S)} y={Y(best.totalCost) - 14} textAnchor="middle">optimal S={best.S}</text>
      </g>
      <g className="se-lg" transform={`translate(${W - pad.r - 300}, 14)`}>
        <rect x="0" y="-5" width="16" height="3" className="is-hold" /><text x="22" y="0">biaya simpan</text>
        <rect x="110" y="-5" width="16" height="3" className="is-down" /><text x="132" y="0">biaya downtime</text>
        <rect x="236" y="-5" width="16" height="3" className="is-total" /><text x="258" y="0">total</text>
      </g>
    </svg>
  )
}
