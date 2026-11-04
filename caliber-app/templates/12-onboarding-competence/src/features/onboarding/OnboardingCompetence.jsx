import { useMemo } from 'react'
import { analyze, formatUSD } from './competence'
import './onboarding.css'

const DEFAULT_LABELS = { before: 'Sebelum', after: 'Sesudah' }

/**
 * KPI + kurva "% engineer baru yang sudah kompeten" sebelum vs sesudah + rincian per skill.
 * Props: engineers, skills, threshold, asOf, valuePerDay, hiresPerYear, baseline, compare, labels
 */
export function OnboardingCompetence({
  engineers,
  skills,
  threshold = 0.8,
  asOf,
  valuePerDay = 0,
  hiresPerYear = 0,
  baseline = 'before',
  compare = 'after',
  labels = DEFAULT_LABELS,
  maxDay,
  showSkills = true,
}) {
  const r = useMemo(
    () => analyze(engineers, skills, { threshold, asOf, valuePerDay, hiresPerYear, baseline, compare }),
    [engineers, skills, threshold, asOf, valuePerDay, hiresPerYear, baseline, compare],
  )
  const B = r.cohorts[baseline]
  const C = r.cohorts[compare]
  const lb = labels[baseline] ?? baseline
  const lc = labels[compare] ?? compare

  return (
    <div className="ob-root">
      <div className="ob-kpis">
        <div className="ob-kpi">
          <span>{lb}</span>
          <b className="is-base">{B?.median ?? '—'} <small>hari</small></b>
          <em>median · n={B?.n ?? 0}</em>
        </div>
        <div className="ob-kpi">
          <span>{lc}</span>
          <b className="is-cmp">{C?.median ?? '—'} <small>hari</small></b>
          <em>median · n={C?.n ?? 0} ({C ? C.n - C.reached : 0} masih berjalan)</em>
        </div>
        <div className="ob-kpi is-hero">
          <span>Lebih cepat kompeten</span>
          <b>{r.daysSaved == null ? '—' : `${r.daysSaved} hari`}</b>
          <em>{r.reduction == null ? 'median belum tercapai' : `−${Math.round(r.reduction * 100)}% time-to-competence`}</em>
        </div>
        {valuePerDay > 0 && (
          <div className="ob-kpi is-usd">
            <span>Nilai per tahun</span>
            <b>{r.valuePerYear == null ? '—' : formatUSD(r.valuePerYear)}</b>
            <em>{formatUSD(r.valuePerHire ?? 0)}/engineer × {hiresPerYear} rekrutan</em>
          </div>
        )}
      </div>

      <CompetenceChart series={[{ ...B, label: lb, cls: 'is-base' }, { ...C, label: lc, cls: 'is-cmp' }].filter((s) => s.curve)} maxDay={maxDay} />

      {showSkills && <SkillDumbbell rows={r.skills} labels={[lb, lc]} />}
    </div>
  )
}

/** Kurva step "% sudah kompeten" per hari sejak masuk + garis median. */
export function CompetenceChart({ series, maxDay, height = 240 }) {
  const W = 800
  const H = height
  const pad = { l: 40, r: 12, t: 12, b: 44 }
  const xMax = maxDay ?? Math.max(30, ...series.flatMap((s) => s.records.map((x) => x.day ?? x.observed))) * 1.05
  const X = (d) => pad.l + (Math.min(d, xMax) / xMax) * (W - pad.l - pad.r)
  const Y = (p) => H - pad.b - p * (H - pad.t - pad.b)
  const path = (curve) => {
    let d = `M${X(0)},${Y(0)}`
    let prev = 0
    for (const p of curve) {
      d += ` L${X(p.day)},${Y(prev)} L${X(p.day)},${Y(p.pct)}`
      prev = p.pct
    }
    return `${d} L${X(xMax)},${Y(prev)}`
  }
  const ticks = niceTicks(xMax)
  return (
    <svg className="ob-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Kurva time-to-competence">
      {[0, 0.25, 0.5, 0.75, 1].map((p) => (
        <g key={p}>
          <line x1={pad.l} x2={W - pad.r} y1={Y(p)} y2={Y(p)} className={p === 0.5 ? 'ob-mid' : 'ob-grid'} />
          <text x={pad.l - 6} y={Y(p) + 4} textAnchor="end" className="ob-ax">{p * 100}%</text>
        </g>
      ))}
      {ticks.map((t) => (
        <text key={t} x={X(t)} y={H - pad.b + 18} textAnchor="middle" className="ob-ax">{t}</text>
      ))}
      <text x={(W + pad.l) / 2} y={H - 4} textAnchor="middle" className="ob-ax">hari sejak masuk</text>
      {series.map((s, si) => (
        <g key={s.key} className={s.cls}>
          <path d={path(s.curve)} className="ob-line" />
          {s.median != null && (
            <>
              <line x1={X(s.median)} x2={X(s.median)} y1={Y(0)} y2={Y(0.5)} className="ob-drop" />
              <circle cx={X(s.median)} cy={Y(0.5)} r="5" className="ob-dot" />
              <text x={X(s.median) + (X(s.median) > W * 0.7 ? -8 : 8)} y={Y(0.5) + (si === 0 ? -10 : 20)} textAnchor={X(s.median) > W * 0.7 ? 'end' : 'start'} className="ob-lbl">{s.label}: {s.median} hr</text>
            </>
          )}
        </g>
      ))}
    </svg>
  )
}

function niceTicks(max) {
  const step = [30, 60, 90, 180].find((s) => max / s <= 8) ?? 365
  const out = []
  for (let t = 0; t <= max; t += step) out.push(t)
  return out
}

/** Dumbbell per skill: rata-rata hari mencapai skill, sebelum ● → ● sesudah. */
export function SkillDumbbell({ rows, labels }) {
  const max = Math.max(1, ...rows.flatMap((r) => [r.before ?? 0, r.after ?? 0]))
  const pct = (v) => `${(v / max) * 100}%`
  return (
    <div className="ob-skills">
      <h4>Rata-rata hari menguasai tiap skill <small>{labels[0]} ● → ● {labels[1]}</small></h4>
      {rows.map((r) => (
        <div key={r.id} className="ob-sk">
          <span className="ob-sk-name">{r.name}</span>
          <span className="ob-sk-track">
            {r.before != null && r.after != null && (
              <i className="ob-sk-bar" style={{ left: pct(Math.min(r.before, r.after)), width: pct(Math.abs(r.before - r.after)) }} />
            )}
            {r.before != null && <i className="ob-sk-dot is-base" style={{ left: pct(r.before) }} />}
            {r.after != null && <i className="ob-sk-dot is-cmp" style={{ left: pct(r.after) }} />}
          </span>
          <b className={r.delta > 0 ? 'is-good' : ''}>{r.delta == null ? '—' : `${r.delta > 0 ? '−' : '+'}${Math.abs(Math.round(r.delta))} hr`}</b>
        </div>
      ))}
    </div>
  )
}
