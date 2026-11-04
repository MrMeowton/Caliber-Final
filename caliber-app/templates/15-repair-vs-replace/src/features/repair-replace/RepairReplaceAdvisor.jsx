import { useMemo } from 'react'
import { analyze, formatUSD } from './finance'
import './repair-replace.css'

const yr = (v) => (v == null ? 'tidak tercapai' : `${v.toFixed(1)} thn`)
const pct = (v) => (v == null ? '—' : `${(v * 100).toFixed(1)}%`)

/**
 * Rekomendasi repair vs replace + KPI keuangan + grafik biaya kumulatif terdiskonto.
 * Props: input = { repair, replace, discountRate, horizonYears, lostMarginPerHour }, assetName, labels
 */
export function RepairReplaceAdvisor({ input, assetName = 'Aset', labels = { repair: 'Repair / overhaul', replace: 'Replace' } }) {
  const r = useMemo(() => analyze(input), [input])
  const isSwap = r.verdict === 'replace'

  return (
    <div className="rr-root">
      <div className={`rr-verdict ${isSwap ? 'is-swap' : 'is-keep'}`}>
        <span className="rr-tag">Rekomendasi · {assetName}</span>
        <b>{isSwap ? labels.replace : labels.repair}</b>
        <p>
          {isSwap
            ? `Mengganti menghemat ${formatUSD(r.npv)} (NPV ${input.horizonYears} thn @ ${pct(input.discountRate)}), balik modal ${yr(r.discountedPayback)} terdiskonto.`
            : `Mengganti justru lebih mahal ${formatUSD(-r.npv)} (NPV). Replace baru layak bila capex ≤ ${formatUSD(r.breakEvenCapex)}.`}
        </p>
      </div>

      <div className="rr-kpis">
        <Kpi label="NPV incremental (replace − repair)" value={formatUSD(r.npv, { sign: true })} tone={isSwap ? 'good' : 'bad'} />
        <Kpi label="IRR penggantian" value={pct(r.irr)} sub={`vs hurdle ${pct(input.discountRate)}`} tone={r.irr != null && r.irr > input.discountRate ? 'good' : ''} />
        <Kpi label="Payback sederhana / terdiskonto" value={yr(r.payback)} sub={yr(r.discountedPayback)} />
        <Kpi label="Capex break-even" value={formatUSD(r.breakEvenCapex)} sub={`capex kini ${formatUSD(input.replace.upfront ?? 0)}`} />
        <Kpi label={`EAC ${labels.repair}`} value={formatUSD(r.eacKeep)} sub="biaya ekuivalen / thn" tone="keep" />
        <Kpi label={`EAC ${labels.replace}`} value={formatUSD(r.eacSwap)} sub="biaya ekuivalen / thn" tone="swap" />
      </div>

      <CumulativeCostChart years={r.years} labels={labels} payback={r.discountedPayback} />
      <AnnualBreakdown years={r.years} labels={labels} />
    </div>
  )
}

function Kpi({ label, value, sub, tone }) {
  return (
    <div className={`rr-kpi ${tone ? `is-${tone}` : ''}`}>
      <span>{label}</span>
      <b>{value}</b>
      {sub && <em>{sub}</em>}
    </div>
  )
}

/** Dua garis biaya kumulatif terdiskonto; titik silang = discounted payback. */
export function CumulativeCostChart({ years, labels, payback, height = 260 }) {
  const W = 800
  const H = height
  const pad = { l: 64, r: 16, t: 30, b: 40 }
  const n = years.length - 1
  const yMax = Math.max(1, ...years.flatMap((y) => [y.cumKeep, y.cumSwap]))
  const yMin = Math.min(0, ...years.flatMap((y) => [y.cumKeep, y.cumSwap]))
  const X = (t) => pad.l + (t / Math.max(1, n)) * (W - pad.l - pad.r)
  const Y = (v) => H - pad.b - ((v - yMin) / (yMax - yMin)) * (H - pad.t - pad.b)
  const line = (k) => years.map((y, i) => `${i ? 'L' : 'M'}${X(y.t)},${Y(y[k])}`).join(' ')
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => yMin + f * (yMax - yMin))
  return (
    <svg className="rr-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Biaya kumulatif terdiskonto">
      {ticks.map((v) => (
        <g key={v}>
          <line x1={pad.l} x2={W - pad.r} y1={Y(v)} y2={Y(v)} className="rr-grid" />
          <text x={pad.l - 8} y={Y(v) + 4} textAnchor="end" className="rr-ax">{formatUSD(v)}</text>
        </g>
      ))}
      {years.map((y) => (
        <text key={y.t} x={X(y.t)} y={H - pad.b + 18} textAnchor="middle" className="rr-ax">{y.t}</text>
      ))}
      <text x={(W + pad.l) / 2} y={H - 4} textAnchor="middle" className="rr-ax">tahun · biaya kumulatif terdiskonto (PV)</text>
      <path d={line('cumKeep')} className="rr-l is-keep" />
      <path d={line('cumSwap')} className="rr-l is-swap" />
      {payback != null && (
        <g className="rr-pb">
          <line x1={X(payback)} x2={X(payback)} y1={pad.t} y2={H - pad.b} />
          <text x={X(payback) + 6} y={pad.t + 12}>balik modal {payback.toFixed(1)} thn</text>
        </g>
      )}
      <g className="rr-lg" transform={`translate(${pad.l}, 14)`}>
        <rect y="-5" width="16" height="3" className="is-keep" /><text x="22" y="0">{labels.repair}</text>
        <rect x="190" y="-5" width="16" height="3" className="is-swap" /><text x="212" y="0">{labels.replace}</text>
      </g>
    </svg>
  )
}

/** Komposisi biaya tahunan (nominal) kedua opsi: O&M, downtime, energi. */
export function AnnualBreakdown({ years, labels }) {
  const rows = years.slice(1)
  const max = Math.max(1, ...rows.flatMap((y) => [y.keep.total + (y.keep.residual ?? 0), y.swap.total + (y.swap.residual ?? 0)]))
  const bar = (c) => (
    <span className="rr-stack">
      <i className="is-opex" style={{ width: `${(c.opex / max) * 100}%` }} />
      <i className="is-down" style={{ width: `${(c.downtime / max) * 100}%` }} />
      <i className="is-energy" style={{ width: `${(c.energy / max) * 100}%` }} />
    </span>
  )
  return (
    <div className="rr-break">
      <h4>Biaya tahunan nominal <small><i className="rr-sw is-opex" /> O&M <i className="rr-sw is-down" /> downtime kegagalan <i className="rr-sw is-energy" /> energi</small></h4>
      {rows.map((y) => (
        <div key={y.t} className="rr-yr">
          <span className="rr-t">Thn {y.t}</span>
          <span className="rr-pair">
            <span className="rr-line"><em>{labels.repair}</em>{bar(y.keep)}<b>{formatUSD(y.keep.total)}</b></span>
            <span className="rr-line"><em>{labels.replace}</em>{bar(y.swap)}<b>{formatUSD(y.swap.opex + y.swap.downtime + y.swap.energy)}</b></span>
          </span>
        </div>
      ))}
    </div>
  )
}
