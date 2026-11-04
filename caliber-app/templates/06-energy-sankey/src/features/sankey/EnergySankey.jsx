import { useMemo, useRef, useState } from 'react'
import { computeSankey, sum } from './layout'
import { useTweenedLinks } from './useTweenedLinks'
import { KIND_COLORS, KIND_LABELS } from './colors'
import './sankey.css'

const EMPTY = []
const PERIOD = 26 // jarak antar garis bergerak (px) — harus sama dengan keyframe sk-flow di CSS

const fmt = (v) =>
  v.toLocaleString('id-ID', { maximumFractionDigits: Math.abs(v) < 10 ? 1 : 0, minimumFractionDigits: 0 })
const pct = (a, b) => (b > 0 ? `${((a / b) * 100).toLocaleString('id-ID', { maximumFractionDigits: 1 })}%` : '–')

// Warna aliran = jenis energi yang mengalir. Aliran ke steam/listrik/produk/kerugian ikut
// warna tujuannya (mis. cogen → steam berwarna steam); selain itu ikut warna sumbernya.
function linkKind(l) {
  const t = l.targetNode.kind
  if (t === 'steam' || t === 'power' || t === 'product' || t === 'loss') return t
  return l.sourceNode.kind === 'unit' ? 'unit' : l.sourceNode.kind
}

/**
 * Diagram Sankey energi beranimasi.
 * Lebar aliran ∝ besaran energi; garis-garis bergerak menunjukkan arah aliran.
 * `nodes` & `links` sebaiknya di-memo (useMemo) oleh pemanggil.
 */
export function EnergySankey({
  data, // alternatif: { nodes, links } sekaligus (mis. hasil graphFromRows / useEnergyFlows)
  nodes = data?.nodes ?? EMPTY,
  links = data?.links ?? EMPTY,
  unit = 'GJ/jam',
  maxValue = null,
  width = 1000,
  height = 540,
  animate = true,
  speed = 1,
  colors = KIND_COLORS,
  kindLabels = KIND_LABELS,
  title = 'Neraca energi',
  legend = true,
  className = '',
  renderTooltip, // (target, ctx) => ReactNode — ganti isi tooltip; return undefined = bawaan
  onSelect, // (node | null) saat node dikunci/dilepas
  onHover, // ({ type, node | link } | null) — sinkronkan panel lain (3D, tabel, dll.)
}) {
  const tweened = useTweenedLinks(links)
  const layout = useMemo(
    () => computeSankey({ nodes, links: tweened }, { width, height, maxValue }),
    [nodes, tweened, width, height, maxValue],
  )
  const totalIn = useMemo(() => sum(layout.nodes.filter((n) => !n.in.length), (n) => n.value), [layout])

  const [hover, setHover] = useState(null) // { type: 'node'|'link', id }
  const [pinned, setPinned] = useState(null) // id node yang dikunci (klik)
  const [tip, setTip] = useState(null) // { x, y } relatif terhadap root
  const rootRef = useRef(null)
  const svgRef = useRef(null)

  const active = hover ?? (pinned ? { type: 'node', id: pinned } : null)
  const nodeById = useMemo(() => new Map(layout.nodes.map((n) => [n.id, n])), [layout])
  const linkById = useMemo(() => new Map(layout.links.map((l) => [l.id, l])), [layout])
  const setHoverAndNotify = (h) => {
    setHover(h)
    onHover?.(h && (h.type === 'node' ? { type: 'node', node: nodeById.get(h.id) } : { type: 'link', link: linkById.get(h.id) }))
  }

  const isLit = (l) => {
    if (!active) return true
    if (active.type === 'link') return l.id === active.id
    return l.source === active.id || l.target === active.id
  }
  const nodeLit = (n) => {
    if (!active) return true
    if (active.type === 'node') return n.id === active.id || n.in.some(isLit) || n.out.some(isLit)
    const l = linkById.get(active.id)
    return l && (l.source === n.id || l.target === n.id)
  }

  const placeTip = (e) => {
    const r = rootRef.current.getBoundingClientRect()
    setTip({ x: e.clientX - r.left, y: e.clientY - r.top, w: r.width })
  }
  // posisi tooltip saat node difokus lewat keyboard (tanpa mouse)
  const tipAtNode = (n) => {
    const r = rootRef.current.getBoundingClientRect()
    const s = svgRef.current.getBoundingClientRect()
    const k = s.width / width
    setTip({ x: s.left - r.left + n.x1 * k + 8, y: s.top - r.top + ((n.y0 + n.y1) / 2) * k, w: r.width })
  }
  const togglePin = (id) => {
    const next = pinned === id ? null : id
    setPinned(next)
    onSelect?.(next ? nodeById.get(next) : null)
  }

  const pxPerSec = 46 * speed

  return (
    <div
      ref={rootRef}
      className={`sk-root${animate ? '' : ' is-paused'} ${className}`.trim()}
      onKeyDown={(e) => e.key === 'Escape' && (setPinned(null), setHover(null), onSelect?.(null))}
    >
      {legend && (
      <ul className="sk-legend" aria-label="Jenis energi">
        {Object.entries(kindLabels).map(([k, label]) => (
          <li key={k}>
            <span className="sk-swatch" style={{ background: colors[k] }} />
            {label}
          </li>
        ))}
        <li className="sk-legend-note">lebar aliran = besaran ({unit})</li>
      </ul>
      )}

      <div className="sk-scroll">
        <svg
          ref={svgRef}
          className="sk-svg"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={`${title}: total masukan ${fmt(totalIn)} ${unit}`}
          onMouseMove={placeTip}
          onMouseLeave={() => setHoverAndNotify(null)}
          onClick={(e) => e.target === e.currentTarget && pinned && togglePin(pinned)}
        >
          <g className="sk-links">
            {layout.links.map((l) => {
              const kind = linkKind(l)
              const w = Math.max(1, l.width)
              const lit = isLit(l)
              const delay = `${l.sourceNode.depth * 0.28}s`
              const dash = Math.min(9, 3 + w * 0.1) // garis lebih tebal untuk pita lebar
              return (
                <g
                  key={l.id}
                  className={`sk-link${lit ? '' : ' is-dim'}${active && lit ? ' is-lit' : ''}`}
                  onMouseEnter={() => setHoverAndNotify({ type: 'link', id: l.id })}
                  onMouseLeave={() => setHoverAndNotify(null)}
                >
                  <path
                    className="sk-ribbon"
                    d={l.path}
                    stroke={colors[kind]}
                    strokeWidth={w}
                    pathLength={1}
                    style={{ animationDelay: delay }}
                  />
                  {/* garis-garis bergerak = arah & "denyut" aliran */}
                  <path
                    className="sk-flow"
                    d={l.path}
                    strokeWidth={w}
                    strokeDasharray={`${dash} ${PERIOD - dash}`}
                    style={{
                      animationDuration: `${PERIOD / pxPerSec}s, 0.6s`,
                      animationDelay: `0s, calc(${delay} + 0.7s)`,
                    }}
                  />
                </g>
              )
            })}
          </g>

          <g className="sk-nodes">
            {layout.nodes.map((n) => {
              const left = n.depth === 0
              const tx = left ? n.x0 - 8 : n.x1 + 7
              const cy = (n.y0 + n.y1) / 2
              const lit = nodeLit(n)
              return (
                <g
                  key={n.id}
                  className={`sk-node${lit ? '' : ' is-dim'}${pinned === n.id ? ' is-pinned' : ''}`}
                  style={{ animationDelay: `${n.depth * 0.28}s` }}
                  tabIndex={0}
                  role="button"
                  aria-pressed={pinned === n.id}
                  aria-label={`${n.label}: ${fmt(n.value)} ${unit}`}
                  onMouseEnter={() => setHoverAndNotify({ type: 'node', id: n.id })}
                  onMouseLeave={() => setHoverAndNotify(null)}
                  onFocus={() => (setHoverAndNotify({ type: 'node', id: n.id }), tipAtNode(n))}
                  onBlur={() => setHoverAndNotify(null)}
                  onClick={() => togglePin(n.id)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), togglePin(n.id))}
                >
                  <rect
                    x={n.x0}
                    y={n.y0}
                    width={n.x1 - n.x0}
                    height={Math.max(2, n.y1 - n.y0)}
                    rx={3}
                    fill={colors[n.kind] ?? colors.unit}
                  />
                  <rect className="sk-hit" x={n.x0 - 4} y={n.y0 - 4} width={n.x1 - n.x0 + 8} height={n.y1 - n.y0 + 8} />
                  <text
                    className="sk-label"
                    x={tx}
                    y={cy}
                    textAnchor={left ? 'end' : 'start'}
                    dy="-0.15em"
                  >
                    {n.label}
                  </text>
                  <text className="sk-value" x={tx} y={cy} dy="1.05em" textAnchor={left ? 'end' : 'start'}>
                    {fmt(n.value)} <tspan className="sk-unit">{unit}</tspan>
                  </text>
                </g>
              )
            })}
          </g>
        </svg>
      </div>

      {active && tip && (
        <Tooltip
          active={active}
          tip={tip}
          nodeById={nodeById}
          linkById={linkById}
          totalIn={totalIn}
          unit={unit}
          render={renderTooltip}
        />
      )}
    </div>
  )
}

function Tooltip({ active, tip, nodeById, linkById, totalIn, unit, render }) {
  let head
  let rows = []
  if (active.type === 'link') {
    const l = linkById.get(active.id)
    if (!l) return null
    head = `${l.sourceNode.label} → ${l.targetNode.label}`
    rows = [
      ['Aliran', `${fmt(l.value)} ${unit}`],
      [`dari keluaran ${l.sourceNode.label}`, pct(l.value, l.sourceNode.valueOut)],
      ['dari total masukan', pct(l.value, totalIn)],
    ]
  } else {
    const n = nodeById.get(active.id)
    if (!n) return null
    head = n.label
    const lossOut = sum(n.out.filter((l) => l.targetNode.kind === 'loss'), (l) => l.value)
    if (n.in.length) rows.push(['Masuk', `${fmt(n.valueIn)} ${unit}`])
    if (n.out.length) rows.push(['Keluar', `${fmt(n.valueOut)} ${unit}`])
    if (!n.in.length || !n.out.length) rows.push(['Porsi total', pct(n.value, totalIn)])
    if (n.in.length && n.out.length && lossOut > 0) {
      rows.push(['Langsung jadi kerugian', `${fmt(lossOut)} ${unit} (${pct(lossOut, n.valueIn)})`])
      if (n.kind === 'unit') rows.push(['Efisiensi unit', pct(n.valueIn - lossOut, n.valueIn)])
    }
    const big = [...(n.out.length ? n.out : n.in)].sort((a, b) => b.value - a.value).slice(0, 3)
    for (const l of big) {
      const other = n.out.length ? l.targetNode.label : l.sourceNode.label
      rows.push([`${n.out.length ? '→' : '←'} ${other}`, `${fmt(l.value)}`])
    }
  }
  const target =
    active.type === 'node' ? { type: 'node', node: nodeById.get(active.id) } : { type: 'link', link: linkById.get(active.id) }
  const custom = render?.(target, { unit, totalIn, fmt, pct })
  const flip = tip.x > tip.w - 260
  return (
    <div
      className="sk-tip"
      style={{ left: tip.x, top: tip.y, transform: `translate(${flip ? 'calc(-100% - 14px)' : '14px'}, -50%)` }}
      role="status"
    >
      {custom !== undefined ? custom : (
      <>
      <strong>{head}</strong>
      <dl>
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      </>
      )}
    </div>
  )
}
