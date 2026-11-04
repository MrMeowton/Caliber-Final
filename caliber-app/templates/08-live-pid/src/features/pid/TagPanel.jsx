// Panel tag sensor live: kartu per tag dengan nilai, status batas, dan sparkline
import { useEffect, useRef } from 'react'
import { STATUS_RANK, formatValue, limitBreached, statusOf } from './engine'

const STATUS_TEXT = { ok: 'Normal', warn: 'Peringatan', alarm: 'ALARM', nodata: 'Tanpa data' }

/** Sparkline kecil + garis batas H/L. `series` = number[] */
export function Sparkline({ series = [], def, sp, width = 120, height = 30 }) {
  const lo = def?.min ?? Math.min(...series, 0)
  const hi = def?.max ?? Math.max(...series, 1)
  const y = (v) => height - 2 - ((v - lo) / (hi - lo || 1)) * (height - 4)
  const pts = series.filter((v) => v != null)
  const x = (i) => (pts.length < 2 ? width : (i / (pts.length - 1)) * width)
  const d = pts.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')
  const l = def?.limits ?? {}
  return (
    <svg className="pid-spark" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      {[l.hi, l.lo].filter((v) => v != null).map((v) => (
        <line key={v} x1="0" x2={width} y1={y(v)} y2={y(v)} className="pid-spark-limit" />
      ))}
      {sp != null && <line x1="0" x2={width} y1={y(sp)} y2={y(sp)} className="pid-spark-sp" />}
      {d && <path d={d} className="pid-spark-line" />}
      {pts.length > 0 && <circle cx={x(pts.length - 1)} cy={y(pts[pts.length - 1])} r="2.2" className="pid-spark-dot" />}
    </svg>
  )
}

export function TagCard({ def, value, sp, series, active, selected, onEnter, onLeave, onClick }) {
  const ref = useRef(null)
  const status = statusOf(def, value)
  const breach = limitBreached(def, value)

  useEffect(() => {
    if (selected) ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selected])

  return (
    <button
      ref={ref}
      type="button"
      className={`pid-card is-${status}` + (active ? ' is-active' : '') + (selected ? ' is-selected' : '')}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
      onClick={onClick}
      aria-pressed={selected}
    >
      <span className="pid-card-head">
        <b className="pid-card-tag">{def.tag}</b>
        <span className={`pid-card-status is-${status}`}>{breach ?? STATUS_TEXT[status]}</span>
      </span>
      <span className="pid-card-label">{def.label}</span>
      <span className="pid-card-row">
        <span className="pid-card-value">
          {formatValue(def, value)}
          {!def.states && def.unit && <small> {def.unit}</small>}
        </span>
        {!def.states && <Sparkline series={series} def={def} sp={sp} />}
      </span>
      {sp != null && (
        <span className="pid-card-sp">
          SP {formatValue(def, sp)} {def.unit}
        </span>
      )}
    </button>
  )
}

/**
 * Daftar kartu tag. `sort`: 'none' (urutan definisi) | 'status' (alarm dulu).
 */
export function TagPanel({
  tags,
  values = {},
  history = {},
  activeTag,
  selectedTag,
  onTagHover,
  onTagSelect,
  sort = 'status',
  title = 'Tag sensor live',
}) {
  const list =
    sort === 'status'
      ? [...tags].sort((a, b) => STATUS_RANK[statusOf(b, values[b.tag])] - STATUS_RANK[statusOf(a, values[a.tag])])
      : tags
  const alarms = tags.filter((d) => statusOf(d, values[d.tag]) === 'alarm').length
  const warns = tags.filter((d) => statusOf(d, values[d.tag]) === 'warn').length

  return (
    <aside className="pid-panel" aria-label={title}>
      <header className="pid-panel-head">
        <span>{title}</span>
        <span className="pid-panel-badges">
          {alarms > 0 && <span className="pid-badge is-alarm">{alarms} alarm</span>}
          {warns > 0 && <span className="pid-badge is-warn">{warns} peringatan</span>}
          {!alarms && !warns && <span className="pid-badge is-ok">semua normal</span>}
        </span>
      </header>
      <div className="pid-panel-list">
        {list.map((def) => (
          <TagCard
            key={def.tag}
            def={def}
            value={values[def.tag]}
            sp={def.spTag ? values[def.spTag] : def.sp}
            series={history[def.tag]}
            active={activeTag === def.tag}
            selected={selectedTag === def.tag}
            onEnter={() => onTagHover?.(def.tag)}
            onLeave={() => onTagHover?.(null)}
            onClick={() => onTagSelect?.(def.tag)}
          />
        ))}
      </div>
    </aside>
  )
}
