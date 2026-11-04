import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { DEFAULT_LAYERS } from './layers'
import {
  formatValue,
  gradientCss,
  layerDomain,
  layerStats,
  makeColorScale,
  normalize,
  rankUnits,
  textOn,
  unitCenter,
  valueOf,
} from './scale'
import './heatmap.css'

/* ---------------- toggle layer (bisa dipakai terpisah) ---------------- */

export function LayerToggle({ layers = DEFAULT_LAYERS, value, onChange }) {
  return (
    <div className="hm-toggle" role="tablist" aria-label="Layer heatmap">
      {layers.map((l, i) => (
        <button
          key={l.id}
          role="tab"
          aria-selected={l.id === value}
          className={l.id === value ? 'is-on' : ''}
          onClick={() => onChange?.(l.id)}
          title={`${l.label} (tombol ${i + 1})`}
        >
          <i style={{ background: gradientCss(l.stops) }} />
          {l.short ?? l.label}
        </button>
      ))}
    </div>
  )
}

/* ---------------- legenda gradasi (bisa dipakai terpisah) ---------------- */

export function HeatLegend({ layer, domain }) {
  const [lo, hi] = domain
  const mid = (lo + hi) / 2
  const alertPos = layer.alert != null ? normalize(layer.alert, domain) * 100 : null
  return (
    <div className="hm-legend" aria-label={`Skala ${layer.label}`}>
      <span className="hm-legend-title">
        {layer.label} <small>({layer.unit})</small>
      </span>
      <div className="hm-legend-bar" style={{ background: gradientCss(layer.stops) }}>
        {alertPos != null && (
          <span className="hm-legend-alert" style={{ left: `${alertPos}%` }}>
            <em>{layer.alertLabel ?? 'Ambang'} ≥ {formatValue(layer.alert, layer)}</em>
          </span>
        )}
      </div>
      <div className="hm-legend-ticks">
        <span>{formatValue(lo, layer)}</span>
        <span>{formatValue(mid, layer)}</span>
        <span>{formatValue(hi, layer)}</span>
      </div>
    </div>
  )
}

/* ---------------- komponen utama ---------------- */

/**
 * <PlantHeatmap units data />
 *   units  : [{ id, label, x, y, w, h, shape?: 'rect' | 'circle', tag? }]  — geometri (statis)
 *   data   : { [unitId]: { [layerId]: number } }                        — nilai (live)
 * Lihat README untuk semua prop.
 */
export function PlantHeatmap({
  units,
  data,
  layers = DEFAULT_LAYERS,
  layer: layerProp,
  defaultLayer,
  onLayerChange,
  width = 1000,
  height = 600,
  backdrop = null,
  showGlow = true,
  showLabels = true,
  showValues = true,
  showRanking = true,
  rankingSize = 5,
  globalHotkeys = false,
  onSelect,
}) {
  const uid = useId().replace(/:/g, '')
  const wrapRef = useRef(null)
  const svgRef = useRef(null)

  const [innerLayer, setInnerLayer] = useState(defaultLayer ?? layers[0].id)
  const layerId = layerProp ?? innerLayer
  const layer = layers.find((l) => l.id === layerId) ?? layers[0]
  const setLayer = (id) => {
    if (layerProp === undefined) setInnerLayer(id)
    onLayerChange?.(id)
  }

  const [hoverId, setHoverId] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [tip, setTip] = useState(null) // { x, y, below }

  const scale = useMemo(() => makeColorScale(layer.stops), [layer])
  const domain = useMemo(() => layerDomain(layer, units, data), [layer, units, data])
  const ranked = useMemo(() => rankUnits(units, data, layer.id), [units, data, layer])
  const stats = useMemo(() => layerStats(layer, units, data), [layer, units, data])
  const rankOf = useMemo(() => new Map(ranked.map((r, i) => [r.unit.id, i + 1])), [ranked])

  const focusId = hoverId ?? selectedId
  const focusUnit = units.find((u) => u.id === focusId)

  // tooltip ditambatkan ke unit (bukan kursor) → stabil untuk mouse & keyboard
  const anchorTip = (u) => {
    const svg = svgRef.current?.getBoundingClientRect()
    const wrap = wrapRef.current?.getBoundingClientRect()
    if (!svg || !wrap) return
    const k = svg.width / width
    const [cx] = unitCenter(u)
    const below = u.y * k < 120
    setTip({
      x: svg.left - wrap.left + cx * k,
      y: svg.top - wrap.top + (below ? u.y + u.h : u.y) * k,
      below,
    })
  }
  const enter = (u) => {
    setHoverId(u.id)
    anchorTip(u)
  }
  const leave = () => {
    setHoverId(null)
    if (selectedId) {
      const u = units.find((x) => x.id === selectedId)
      if (u) anchorTip(u)
    } else setTip(null)
  }
  const toggleSelect = (u) => {
    const next = selectedId === u.id ? null : u.id
    setSelectedId(next)
    onSelect?.(next ? u : null)
    if (next) anchorTip(u)
  }

  const onKeyDown = (e) => {
    const n = Number(e.key)
    if (n >= 1 && n <= layers.length) setLayer(layers[n - 1].id)
    if (e.key === 'Escape' && selectedId) {
      setSelectedId(null)
      onSelect?.(null)
      if (!hoverId) setTip(null)
    }
  }

  // tombol 1…n di mana saja di halaman (opsional — matikan bila ada >1 heatmap di halaman)
  const keyRef = useRef(onKeyDown)
  useEffect(() => {
    keyRef.current = onKeyDown
  })
  useEffect(() => {
    if (!globalHotkeys) return
    const h = (e) => {
      if (e.target.closest?.('input, textarea, select, [contenteditable], .hm-root')) return
      keyRef.current(e)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [globalHotkeys])

  return (
    <div className="hm-root" onKeyDown={onKeyDown}>
      <div className="hm-bar">
        <LayerToggle layers={layers} value={layer.id} onChange={setLayer} />
        <HeatLegend layer={layer} domain={domain} />
      </div>

      <div className={`hm-body${showRanking ? '' : ' no-rank'}`}>
        <div className="hm-map" ref={wrapRef}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`}
            className="hm-svg"
            role="group"
            aria-label={`Layout pabrik — ${layer.label}`}
          >
            <defs>
              <pattern id={`${uid}-nodata`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="8" height="8" fill="#1e293b" />
                <line x1="0" y1="0" x2="0" y2="8" stroke="#475569" strokeWidth="3" />
              </pattern>
              {showGlow &&
                units.map((u) => {
                  const v = valueOf(data, u.id, layer.id)
                  return (
                    <radialGradient key={u.id} id={`${uid}-g-${u.id}`}>
                      <stop offset="0%" stopColor={v === null ? '#000' : scale(normalize(v, domain))} stopOpacity="0.85" />
                      <stop offset="100%" stopColor={v === null ? '#000' : scale(normalize(v, domain))} stopOpacity="0" />
                    </radialGradient>
                  )
                })}
            </defs>

            {/* lapis 1: denah statis milik host (jalan, pipe rack, batas area) */}
            <g className="hm-backdrop">{typeof backdrop === 'function' ? backdrop({ width, height }) : backdrop}</g>

            {/* lapis 2: pendaran panas — memberi kesan "medan panas" yang merembes ke sekitar unit */}
            {showGlow && (
              <g className="hm-glow" aria-hidden="true">
                {units.map((u) => {
                  const v = valueOf(data, u.id, layer.id)
                  const t = v === null ? 0 : normalize(v, domain)
                  const [cx, cy] = unitCenter(u)
                  const r = Math.max(u.w, u.h) * 0.9 + 26
                  return (
                    <circle
                      key={u.id}
                      cx={cx}
                      cy={cy}
                      r={r}
                      fill={`url(#${uid}-g-${u.id})`}
                      style={{ opacity: t ** 1.6 * 0.95, transform: `scale(${0.5 + t * 0.65})` }}
                    />
                  )
                })}
              </g>
            )}

            {/* lapis 3: unit berwarna */}
            <g className="hm-units">
              {units.map((u) => {
                const v = valueOf(data, u.id, layer.id)
                const fill = v === null ? `url(#${uid}-nodata)` : scale(normalize(v, domain))
                const ink = v === null ? '#94a3b8' : textOn(fill)
                const alert = layer.alert != null && v !== null && v >= layer.alert
                const [cx, cy] = unitCenter(u)
                const cls = [
                  'hm-unit',
                  alert && 'is-alert',
                  u.id === selectedId && 'is-selected',
                  u.id === hoverId && 'is-hover',
                  focusId && u.id !== focusId && 'is-dim',
                ]
                  .filter(Boolean)
                  .join(' ')
                const small = Math.min(u.w, u.h) < 34
                return (
                  <g
                    key={u.id}
                    className={cls}
                    tabIndex={0}
                    role="button"
                    aria-pressed={u.id === selectedId}
                    aria-label={`${u.label}: ${v === null ? 'tanpa data' : `${formatValue(v, layer)} ${layer.unit}`}`}
                    onPointerEnter={() => enter(u)}
                    onPointerLeave={leave}
                    onFocus={() => enter(u)}
                    onBlur={leave}
                    onClick={() => toggleSelect(u)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        toggleSelect(u)
                      }
                    }}
                  >
                    {alert && <Shape u={u} className="hm-ring" pad={5} />}
                    <Shape u={u} className="hm-shape" style={{ fill }} />
                    {showLabels && (
                      <text x={cx} y={showValues && !small ? cy - 3 : cy + 4} className="hm-label" style={{ fill: ink }}>
                        {u.tag ?? u.label}
                      </text>
                    )}
                    {showValues && !small && (
                      <text x={cx} y={cy + 12} className="hm-value" style={{ fill: ink }}>
                        {formatValue(v, layer)}
                      </text>
                    )}
                  </g>
                )
              })}
            </g>
          </svg>

          {tip && focusUnit && (
            <Tooltip tip={tip} unit={focusUnit} layers={layers} layer={layer} data={data} rank={rankOf.get(focusUnit.id)} of={ranked.length} domain={domain} />
          )}
        </div>

        {showRanking && (
          <aside className="hm-rank" aria-label={`Titik panas — ${layer.label}`}>
            <h4>Titik panas · {layer.short ?? layer.label}</h4>
            <ol>
              {ranked.slice(0, rankingSize).map(({ unit, value }) => {
                const t = normalize(value, domain)
                return (
                  <li
                    key={unit.id}
                    className={unit.id === focusId ? 'is-on' : ''}
                    onPointerEnter={() => enter(unit)}
                    onPointerLeave={leave}
                    onClick={() => toggleSelect(unit)}
                  >
                    <span className="hm-rank-name">{unit.label}</span>
                    <b>{formatValue(value, layer)}</b>
                    <span className="hm-rank-bar">
                      <i style={{ width: `${Math.max(2, t * 100)}%`, background: scale(t) }} />
                    </span>
                  </li>
                )
              })}
            </ol>
            <dl className="hm-stats">
              <div>
                <dt>{{ mean: 'Rata-rata', max: 'Maksimum' }[layer.aggregate] ?? 'Total'}</dt>
                <dd>
                  {formatValue(stats.summary, layer)} <small>{layer.unit}</small>
                </dd>
              </div>
              {layer.alert != null && (
                <div className={stats.alerts ? 'is-bad' : ''}>
                  <dt>{layer.alertLabel ?? 'Di atas ambang'}</dt>
                  <dd>{stats.alerts} unit</dd>
                </div>
              )}
              {stats.missing > 0 && (
                <div>
                  <dt>Tanpa data</dt>
                  <dd>{stats.missing} unit</dd>
                </div>
              )}
            </dl>
          </aside>
        )}
      </div>
    </div>
  )
}

/* ---------------- bagian kecil ---------------- */

function Shape({ u, pad = 0, ...rest }) {
  if (u.shape === 'circle') {
    const [cx, cy] = unitCenter(u)
    return <circle cx={cx} cy={cy} r={Math.min(u.w, u.h) / 2 + pad} {...rest} />
  }
  return <rect x={u.x - pad} y={u.y - pad} width={u.w + pad * 2} height={u.h + pad * 2} rx={(u.r ?? 6) + pad} {...rest} />
}

function Tooltip({ tip, unit, layers, layer, data, rank, of, domain }) {
  const v = valueOf(data, unit.id, layer.id)
  const pct = v === null ? null : Math.round(normalize(v, domain) * 100)
  return (
    <div className={`hm-tip${tip.below ? ' is-below' : ''}`} style={{ left: tip.x, top: tip.y }} role="status">
      <strong>{unit.label}</strong>
      {v === null ? (
        <p className="hm-tip-main">Tanpa data {layer.short?.toLowerCase() ?? ''}</p>
      ) : (
        <p className="hm-tip-main">
          <b>{formatValue(v, layer)}</b> {layer.unit}
          <small>
            peringkat {rank}/{of} · {pct}% skala
          </small>
        </p>
      )}
      <ul>
        {layers
          .filter((l) => l.id !== layer.id)
          .map((l) => (
            <li key={l.id}>
              <span>{l.short ?? l.label}</span>
              <span>
                {formatValue(valueOf(data, unit.id, l.id), l)} {l.unit}
              </span>
            </li>
          ))}
      </ul>
    </div>
  )
}
