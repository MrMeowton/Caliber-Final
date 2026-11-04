import { useMemo } from 'react'
import { classify, cumulative, formatDate, formatUSD, groupBySignature, summarize } from './repeat'
import { useTween } from './useTween'
import './repeat-incident.css'

/**
 * Counter biaya insiden berulang + grafik kumulatif + daftar signature.
 * Props: incidents, until?, effectiveness?, keyFn?, onSelect(group), selectedKey
 */
export function RepeatIncidentCounter({ incidents, until, effectiveness = 0.6, keyFn, onSelect, selectedKey, locale = 'id-ID' }) {
  const classified = useMemo(() => classify(incidents, { until, keyFn }), [incidents, until, keyFn])
  const sum = summarize(classified, { effectiveness })
  const groups = useMemo(() => groupBySignature(classified), [classified])
  const shown = useTween(sum.repeatCost)

  return (
    <div className="ri-root">
      <div className="ri-hero">
        <div className="ri-counter" aria-live="polite">
          <span className="ri-label">Biaya insiden yang terulang padahal sudah di-RCA</span>
          <b>{formatUSD(shown, { compact: false })}</b>
          <span className="ri-sub">
            {sum.repeatAfterRca} dari {sum.incidents} insiden · {Math.round(sum.share * 100)}% total biaya insiden ·{' '}
            {Math.round(sum.downtimeHours)} jam downtime
          </span>
        </div>
        <div className="ri-kpis">
          <Kpi value={formatUSD(sum.avoidable)} label={`bisa dicegah (${Math.round(effectiveness * 100)}% efektif)`} tone="good" />
          <Kpi value={sum.medianDaysSinceRca == null ? '—' : `${sum.medianDaysSinceRca} hari`} label="median jeda RCA → terulang" />
          <Kpi value={formatUSD(sum.repeatNoRcaCost)} label={`${sum.repeatNoRca} berulang tanpa RCA`} tone="warn" />
        </div>
      </div>

      <CumulativeChart points={cumulative(classified)} locale={locale} />

      <div className="ri-groups">
        <div className="ri-gh">
          <span>Aset · mode kegagalan</span>
          <span>Riwayat</span>
          <span>Biaya berulang</span>
        </div>
        {groups.map((g) => (
          <button
            key={g.key}
            className={`ri-g ${selectedKey === g.key ? 'is-sel' : ''} ${g.repeatsAfterRca ? 'is-bad' : ''}`}
            onClick={() => onSelect?.(g)}
          >
            <span className="ri-g-name">
              <b>{g.asset}</b>
              <small>{g.failureMode}</small>
            </span>
            <span className="ri-dots" aria-label={`${g.count} kejadian`}>
              {g.incidents.map((i) => (
                <i key={i.id} className={`ri-dot is-${i.kind}`} title={`${formatDate(i.at, locale)} · ${formatUSD(i.cost)}${i.rca ? ' · RCA' : ''}`}>
                  {i.rcaAt != null && <em />}
                </i>
              ))}
            </span>
            <span className="ri-g-cost">{g.repeatCost ? formatUSD(g.repeatCost) : '—'}</span>
          </button>
        ))}
      </div>

      <div className="ri-legend">
        <span><i className="ri-dot is-first" /> pertama</span>
        <span><i className="ri-dot is-repeatNoRca" /> berulang, belum RCA</span>
        <span><i className="ri-dot is-repeatAfterRca" /> berulang setelah RCA</span>
        <span><i className="ri-dot is-first"><em /></i> insiden yang di-RCA</span>
      </div>
    </div>
  )
}

function Kpi({ value, label, tone }) {
  return (
    <div className={`ri-kpi ${tone ? `is-${tone}` : ''}`}>
      <b>{value}</b>
      <span>{label}</span>
    </div>
  )
}

/** Garis kumulatif: total biaya insiden vs biaya berulang-setelah-RCA. SVG murni. */
export function CumulativeChart({ points, height = 200, locale = 'id-ID' }) {
  const W = 800
  const H = height
  const pad = { l: 8, r: 8, t: 28, b: 22 }
  if (!points.length) return <div className="ri-empty">Belum ada insiden pada periode ini.</div>
  const x0 = points[0].at
  const x1 = Math.max(points.at(-1).at, x0 + 1)
  const yMax = points.at(-1).total || 1
  const X = (t) => pad.l + ((t - x0) / (x1 - x0)) * (W - pad.l - pad.r)
  const Y = (v) => H - pad.b - (v / yMax) * (H - pad.t - pad.b)
  const stepPath = (k) => {
    let d = `M${X(x0)},${Y(0)}`
    let prev = 0
    for (const p of points) {
      d += ` L${X(p.at)},${Y(prev)} L${X(p.at)},${Y(p[k])}`
      prev = p[k]
    }
    return d
  }
  const repeatLine = stepPath('repeat')
  const area = `${repeatLine} L${X(x1)},${Y(points.at(-1).repeat)} L${X(x1)},${Y(0)} Z`
  return (
    <svg className="ri-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Biaya kumulatif insiden">
      <path d={stepPath('total')} className="ri-total" />
      <path d={area} className="ri-area" />
      <path d={repeatLine} className="ri-repeat" />
      {points.filter((p) => p.kind === 'repeatAfterRca').map((p) => (
        <circle key={p.id} cx={X(p.at)} cy={Y(p.repeat)} r="4" className="ri-pt" />
      ))}
      <text x={pad.l} y={H - 6} className="ri-ax">{formatDate(x0, locale)}</text>
      <text x={W - pad.r} y={H - 6} className="ri-ax" textAnchor="end">{formatDate(x1, locale)}</text>
      <text x={W - pad.r} y={Y(points.at(-1).total) - 6} className="ri-ax" textAnchor="end">total {formatUSD(points.at(-1).total)}</text>
    </svg>
  )
}
