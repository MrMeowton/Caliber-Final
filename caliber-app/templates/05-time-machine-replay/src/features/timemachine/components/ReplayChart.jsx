import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { scoreColor } from '../core/format.js'
import { fill, LABELS_ID } from '../core/labels.js'

function useWidth(fallback = 720) {
  const ref = useRef(null)
  const [width, setWidth] = useState(fallback)
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(280, e.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, width]
}

const PAD = { l: 44, r: 16, t: 34, b: 50 }

/**
 * Grafik SVG mesin waktu — PRESENTASIONAL (hanya props, tanpa context), jadi bisa
 * dipakai terpisah dengan data dari mana saja. Sumbu x & y tetap untuk seluruh rentang waktu, jadi saat
 * slider digeser ke belakang garis "terpotong" dan masa depan tampak kosong.
 */
export function ReplayChart({
  series,
  analysis,
  index,
  forecast = null,
  events = [],
  height = 340,
  unit = '',
  labels = LABELS_ID,
  formatTime = (t) => String(Math.floor(t)),
  formatDuration = (d) => String(Math.round(d)),
  onSeek,
}) {
  const [wrapRef, width] = useWidth()
  const uid = useId().replace(/:/g, '')
  const { threshold, mean, smooth, score, detectIndex, crossIndex } = analysis

  const H = height
  const plotB = H - PAD.b
  const t0 = series[0].t
  const t1 = series[series.length - 1].t

  const { x, y, yTicks, xTicks } = useMemo(() => {
    let lo = Infinity
    let hi = -Infinity
    for (const p of series) {
      lo = Math.min(lo, p.v)
      hi = Math.max(hi, p.v)
    }
    hi = Math.max(hi, threshold)
    const padY = (hi - lo) * 0.08
    lo -= padY
    hi += padY
    const xf = (t) => PAD.l + ((t - t0) / (t1 - t0 || 1)) * (width - PAD.l - PAD.r)
    const yf = (v) => plotB - ((v - lo) / (hi - lo || 1)) * (plotB - PAD.t)
    const yt = Array.from({ length: 5 }, (_, i) => lo + ((hi - lo) * i) / 4)
    const nx = Math.max(2, Math.floor(width / 120))
    const xt = Array.from({ length: nx + 1 }, (_, i) => t0 + ((t1 - t0) * i) / nx)
    return { x: xf, y: yf, yTicks: yt, xTicks: xt }
  }, [series, threshold, width, plotB, t0, t1])

  const path = (vals) => {
    let d = ''
    for (let i = 0; i <= index; i++) d += `${i ? 'L' : 'M'}${x(series[i].t).toFixed(1)},${y(vals(i)).toFixed(1)}`
    return d
  }

  const cx = x(series[index].t)
  const stripY = plotB + 8
  const stripW = (width - PAD.l - PAD.r) / series.length + 0.6
  const reached = (i) => i >= 0 && index >= i

  // Klik / drag di grafik = lompat waktu
  const seekFromEvent = (e) => {
    if (!onSeek) return
    const r = e.currentTarget.getBoundingClientRect()
    const t = t0 + ((e.clientX - r.left - PAD.l) / (width - PAD.l - PAD.r)) * (t1 - t0)
    let best = 0
    for (let i = 0; i < series.length; i++) if (Math.abs(series[i].t - t) < Math.abs(series[best].t - t)) best = i
    onSeek(best)
  }

  return (
    <div ref={wrapRef} className="tm-part tm-chart">
      <svg
        width={width}
        height={H}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          seekFromEvent(e)
        }}
        onPointerMove={(e) => e.buttons === 1 && seekFromEvent(e)}
      >
        <defs>
          <linearGradient id={`g${uid}`} gradientUnits="userSpaceOnUse" x1="0" x2="0" y1={y(mean)} y2={y(threshold)}>
            <stop offset="0" stopColor={scoreColor(0)} />
            <stop offset="0.5" stopColor={scoreColor(0.5)} />
            <stop offset="1" stopColor={scoreColor(1)} />
          </linearGradient>
          <pattern id={`h${uid}`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="8" className="tm-hatch" />
          </pattern>
        </defs>

        {/* grid & sumbu */}
        {yTicks.map((v) => (
          <g key={v}>
            <line className="tm-grid" x1={PAD.l} x2={width - PAD.r} y1={y(v)} y2={y(v)} />
            <text className="tm-axis" x={PAD.l - 6} y={y(v) + 4} textAnchor="end">
              {v.toFixed(v < 10 ? 1 : 0)}
            </text>
          </g>
        ))}
        {xTicks.map((t, i) => (
          <text key={t} className="tm-axis" x={x(t)} y={H - 8} textAnchor={i === xTicks.length - 1 ? 'end' : 'middle'}>
            {formatTime(t)}
          </text>
        ))}

        {/* masa depan: belum terjadi */}
        {index < series.length - 1 && (
          <g>
            <rect x={cx} y={PAD.t} width={width - PAD.r - cx} height={plotB - PAD.t} fill={`url(#h${uid})`} />
            {width - PAD.r - cx > 90 && (
              <text className="tm-future" x={(cx + width - PAD.r) / 2} y={PAD.t + 16} textAnchor="middle">
                {labels.future}
              </text>
            )}
          </g>
        )}

        {/* batas alarm */}
        <line className="tm-threshold" x1={PAD.l} x2={width - PAD.r} y1={y(threshold)} y2={y(threshold)} />
        <text className="tm-threshold-label" x={PAD.l + 6} y={y(threshold) - 6}>
          {fill(labels.threshold, { value: `${threshold} ${unit}`.trim() })}
        </text>

        {/* data: mentah (tipis) + pandangan AI (tebal, berwarna sesuai keparahan) */}
        <path className="tm-raw" d={path((i) => series[i].v)} />
        <path className="tm-smooth" d={path((i) => smooth[i])} stroke={`url(#g${uid})`} />

        {/* proyeksi AI dari titik waktu yang sedang dilihat */}
        {forecast && (
          <g>
            <path
              className="tm-forecast"
              d={forecast.points.map((p, i) => `${i ? 'L' : 'M'}${x(Math.min(p.t, t1)).toFixed(1)},${y(p.v).toFixed(1)}`).join('')}
            />
            {forecast.t <= t1 && (
              <g transform={`translate(${x(forecast.t)},${y(threshold)})`}>
                <circle r="5" className="tm-forecast-dot" />
                <text
                  className="tm-forecast-label"
                  y={-10}
                  textAnchor={width - PAD.r - x(forecast.t) < 60 ? 'end' : 'middle'}
                >
                  {fill(labels.forecast, { time: formatTime(forecast.t) })}
                </text>
              </g>
            )}
          </g>
        )}

        {/* momen penting (muncul hanya setelah "terjadi") */}
        {reached(detectIndex) && (
          <Marker x={x(series[detectIndex].t)} top={PAD.t} bottom={plotB} right={width - PAD.r} className="is-ai" label={labels.aiDetected} />
        )}
        {reached(crossIndex) && (
          <Marker x={x(series[crossIndex].t)} top={PAD.t} bottom={plotB} right={width - PAD.r} className="is-alarm" label={labels.alarm} />
        )}
        {reached(crossIndex) && detectIndex >= 0 && detectIndex < crossIndex && (
          <LeadBracket
            x1={x(series[detectIndex].t)}
            x2={x(series[crossIndex].t)}
            y={PAD.t - 18}
            text={fill(labels.leadTime, { lead: formatDuration(series[crossIndex].t - series[detectIndex].t) })}
          />
        )}
        {events
          .filter((ev) => ev.t <= series[index].t)
          .map((ev) => (
            <g key={ev.t + ev.title} transform={`translate(${x(ev.t)},${plotB})`}>
              <path className="tm-event" d="M0,-7 L5,0 L0,7 L-5,0Z" />
              <title>{ev.title}</title>
            </g>
          ))}

        {/* jalur skor anomali di bawah grafik */}
        {score.slice(0, index + 1).map((s, i) => (
          <rect key={i} x={x(series[i].t)} y={stripY} width={stripW} height={10} fill={scoreColor(s)} opacity={0.35 + 0.65 * s} />
        ))}
        <text className="tm-axis" x={PAD.l - 6} y={stripY + 9} textAnchor="end">
          {labels.scoreStrip}
        </text>

        {/* kursor waktu */}
        <line className="tm-cursor" x1={cx} x2={cx} y1={PAD.t} y2={stripY + 10} />
        <circle cx={cx} cy={y(smooth[index])} r="6" fill={scoreColor(score[index])} className="tm-cursor-dot" />
      </svg>
    </div>
  )
}

function Marker({ x, top, bottom, right, className, label }) {
  const flip = right - x < 130 // dekat tepi kanan → label di kiri garis
  return (
    <g className={`tm-marker ${className}`}>
      <line x1={x} x2={x} y1={top} y2={bottom} />
      <text x={flip ? x - 5 : x + 5} y={flip ? bottom - 22 : bottom - 6} textAnchor={flip ? 'end' : 'start'}>
        {label}
      </text>
    </g>
  )
}

function LeadBracket({ x1, x2, y, text }) {
  return (
    <g className="tm-lead">
      <path d={`M${x1},${y + 6} V${y} H${x2} V${y + 6}`} />
      <text x={(x1 + x2) / 2} y={y - 5} textAnchor="middle">
        {text}
      </text>
    </g>
  )
}
