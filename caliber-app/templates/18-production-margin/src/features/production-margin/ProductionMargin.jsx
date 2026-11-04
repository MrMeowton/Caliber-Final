import { useMemo } from 'react'
import { formatKt, formatUSD, monthLabel, portfolioMargin } from './forecast'
import './production-margin.css'

/**
 * Forecast produksi → margin, dengan fan chart & margin at risk per produk.
 * Props: products, horizon, coverage (0.8|0.9|0.95), spreadShock, startMonth ('YYYY-MM' periode data pertama),
 *        historyShown, onSelect, selectedId
 */
export function ProductionMargin({ products, horizon = 6, coverage = 0.8, spreadShock = 0, startMonth, historyShown = 12, onSelect, selectedId, locale = 'id-ID' }) {
  const pf = useMemo(() => portfolioMargin(products, { horizon, coverage, spreadShock }), [products, horizon, coverage, spreadShock])
  const histLen = Math.min(...products.map((p) => p.history.length))
  const lbl = (i) => (startMonth ? monthLabel(startMonth, i, locale) : `${i + 1}`)
  const q = Math.round((1 - coverage) * 50)

  return (
    <div className="pm-root">
      <div className="pm-kpis">
        <Kpi value={formatUSD(pf.margin50)} label={`margin forecast P50 · ${horizon} bln`} sub={`P${q}–P${100 - q}: ${formatUSD(pf.margin10)} – ${formatUSD(pf.margin90)}`} />
        <Kpi value={formatUSD(pf.marginPlan)} label="margin sesuai rencana produksi" sub={`selisih ${formatUSD(pf.margin50 - pf.marginPlan, { sign: true })}`} />
        <Kpi tone="bad" value={formatUSD(pf.atRisk)} label="margin at risk (ekspektasi)" sub="Σ (rencana − P50)⁺ × spread" />
        <Kpi tone="warn" value={formatUSD(pf.downside)} label={`downside P${q}`} sub={`Σ (rencana − P${q})⁺ × spread`} />
      </div>

      <MarginFan history={pf.history.slice(-historyShown)} months={pf.months} labelAt={(i) => lbl(histLen - Math.min(historyShown, pf.history.length) + i)} q={q} />

      <div className="pm-scroll">
        <table className="pm-table">
          <thead>
            <tr>
              <th>Produk</th>
              <th>Volume P50 vs rencana</th>
              <th>Spread</th>
              <th>Margin P50</th>
              <th>At risk</th>
              <th aria-label="porsi at risk" />
            </tr>
          </thead>
          <tbody>
            {pf.rows.map((r) => (
              <tr key={r.id} className={selectedId === r.id ? 'is-sel' : ''} onClick={() => onSelect?.(r)} tabIndex={onSelect ? 0 : undefined} onKeyDown={(e) => e.key === 'Enter' && onSelect?.(r)}>
                <td><b>{r.name}</b><small>{r.unit}</small></td>
                <td>
                  {formatKt(r.volume50)} <small>/ {formatKt(r.volumePlan)} ({Math.round((r.volume50 / r.volumePlan - 1) * 100)}%)</small>
                </td>
                <td>{formatUSD(r.avgSpread, { compact: false })}/t</td>
                <td>{formatUSD(r.margin50)}</td>
                <td className={r.atRisk > 0 ? 'is-bad' : ''}>{r.atRisk > 0 ? formatUSD(r.atRisk) : '—'}</td>
                <td className="pm-bar"><i style={{ width: `${(r.atRisk / Math.max(1, pf.rows[0].atRisk)) * 100}%` }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Kpi({ value, label, sub, tone }) {
  return (
    <div className={`pm-kpi ${tone ? `is-${tone}` : ''}`}>
      <span>{label}</span>
      <b>{value}</b>
      {sub && <em>{sub}</em>}
    </div>
  )
}

/** Fan chart: margin aktual (riwayat) → forecast P50 dengan pita P10–P90, garis rencana, celah at risk. */
export function MarginFan({ history, months, labelAt = (i) => i + 1, q = 10, height = 280 }) {
  const W = 900
  const H = height
  const pad = { l: 64, r: 16, t: 30, b: 34 }
  const n = history.length + months.length
  const vals = [...history, ...months.flatMap((m) => [m.m10, m.m90, m.mPlan])]
  const yMax = Math.max(1, ...vals) * 1.05
  const yMin = Math.min(...vals) * 0.9
  const X = (i) => pad.l + (i / Math.max(1, n - 1)) * (W - pad.l - pad.r)
  const Y = (v) => H - pad.b - ((v - yMin) / (yMax - yMin)) * (H - pad.t - pad.b)
  const h0 = history.length - 1
  const fx = (j) => X(history.length + j)
  const path = (pts) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ')
  const anchor = [X(h0), Y(history.at(-1) ?? 0)]
  const band = `${path([anchor, ...months.map((m, j) => [fx(j), Y(m.m90)])])} ${months
    .map((m, j) => [fx(j), Y(m.m10)])
    .reverse()
    .map(([x, y]) => `L${x},${y}`)
    .join(' ')} L${anchor[0]},${anchor[1]} Z`
  // area at risk: antara garis rencana (atas) dan P50 (bawah) di bulan-bulan forecast
  const gapTop = months.map((m, j) => [fx(j), Y(Math.max(m.mPlan, m.m50))])
  const gapBot = months.map((m, j) => [fx(j), Y(m.m50)]).reverse()
  const gapArea = months.length ? `${path(gapTop)} ${gapBot.map(([x, y]) => `L${x},${y}`).join(' ')} Z` : ''
  const ticks = Array.from({ length: n }, (_, i) => i).filter((i) => i % Math.ceil(n / 9) === 0)
  const yt = [0, 0.25, 0.5, 0.75, 1].map((f) => yMin + f * (yMax - yMin))
  return (
    <svg className="pm-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Fan chart margin">
      {yt.map((v) => (
        <g key={v}>
          <line x1={pad.l} x2={W - pad.r} y1={Y(v)} y2={Y(v)} className="pm-grid" />
          <text x={pad.l - 8} y={Y(v) + 4} textAnchor="end" className="pm-ax">{formatUSD(v)}</text>
        </g>
      ))}
      {ticks.map((i) => (
        <text key={i} x={X(i)} y={H - 10} textAnchor="middle" className="pm-ax">{labelAt(i)}</text>
      ))}
      <rect x={X(h0)} y={pad.t} width={W - pad.r - X(h0)} height={H - pad.t - pad.b} className="pm-fzone" />
      <path d={band} className="pm-band" />
      <path d={gapArea} className="pm-gap" />
      <path d={path(months.map((m, j) => [fx(j), Y(m.mPlan)]))} className="pm-plan" />
      <path d={path(history.map((v, i) => [X(i), Y(v)]))} className="pm-hist" />
      <path d={path([anchor, ...months.map((m, j) => [fx(j), Y(m.m50)])])} className="pm-p50" />
      {months.map((m, j) => <circle key={m.h} cx={fx(j)} cy={Y(m.m50)} r="3.5" className="pm-dot" />)}
      <text x={X(h0) + 6} y={pad.t + 14} className="pm-tag">forecast →</text>
      <g className="pm-lg" transform={`translate(${pad.l}, 14)`}>
        <rect y="-5" width="16" height="3" className="is-hist" /><text x="22" y="0">aktual (spread kini)</text>
        <rect x="150" y="-5" width="16" height="3" className="is-p50" /><text x="172" y="0">forecast P50</text>
        <rect x="274" y="-8" width="16" height="10" className="is-band" /><text x="296" y="0">P{q}–P{100 - q}</text>
        <rect x="370" y="-5" width="16" height="2" className="is-plan" /><text x="392" y="0">rencana</text>
        <rect x="460" y="-8" width="16" height="10" className="is-gap" /><text x="482" y="0">margin at risk</text>
      </g>
    </svg>
  )
}
