// Diagram P&ID: pipa beranimasi + peralatan + gelembung instrumen dengan nilai live
import { useId, useMemo } from 'react'
import { DEFAULT_MEDIA, evaluateTags, flowNorm, indexTags, pointsToPath } from './engine'
import { useFlowAnimation, useReducedMotion } from './hooks'
import { EQUIPMENT_SYMBOLS } from './registry'
import { Equipment, Instrument } from './symbols'

const DASH_PERIOD = 20 // "7 13" — harus membagi 1000 agar loop offset mulus

function PipeLabel({ line }) {
  const p = line.points
  const out = []
  const put = (pt, prev, text, key) => {
    const dx = pt[0] - prev[0]
    const dy = pt[1] - prev[1]
    const horiz = Math.abs(dx) >= Math.abs(dy)
    const x = horiz ? pt[0] + Math.sign(dx) * 8 : pt[0]
    const y = horiz ? pt[1] + 4 : pt[1] + Math.sign(dy) * 14
    const anchor = horiz ? (dx >= 0 ? 'start' : 'end') : 'middle'
    out.push(
      <text key={key} x={x} y={y} textAnchor={anchor} className="pid-line-label">
        {text}
      </text>,
    )
  }
  if (line.toLabel) put(p[p.length - 1], p[p.length - 2], line.toLabel, 'to')
  if (line.fromLabel) put(p[0], p[1], line.fromLabel, 'from')
  return out
}

/**
 * Diagram saja (tanpa panel). Pakai ini bila host ingin menata panel tag sendiri.
 */
export function PidDiagram({
  diagram,
  tags = [],
  values = {},
  media = DEFAULT_MEDIA,
  activeTag = null,
  selectedTag = null,
  onTagHover,
  onTagSelect,
  animate = true,
  flowSpeed = 90,
  showChips = true,
  backdrop,
  symbols = EQUIPMENT_SYMBOLS,
  className = '',
}) {
  const uid = 'pid' + useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const reduced = useReducedMotion()
  const { width = 1000, height = 560, equipment = [], lines = [], instruments = [] } = diagram
  const defsByTag = useMemo(() => indexTags(tags), [tags])
  const statuses = useMemo(() => evaluateTags(tags, values), [tags, values])

  const norms = useMemo(
    () => Object.fromEntries(lines.map((l) => [l.id, flowNorm(l, values, defsByTag)])),
    [lines, values, defsByTag],
  )
  const speeds = useMemo(
    () => Object.fromEntries(lines.map((l) => [l.id, (norms[l.id] ?? 0) * flowSpeed])),
    [lines, norms, flowSpeed],
  )
  const register = useFlowAnimation(speeds, animate && !reduced)
  const usedMedia = [...new Set(lines.map((l) => l.medium).filter(Boolean))]

  const lineActive = (l) => activeTag && (l.flowTag === activeTag || l.tags?.includes(activeTag))

  return (
    <svg
      className={'pid-svg ' + className}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Diagram P&ID proses"
      onPointerLeave={() => onTagHover?.(null)}
    >
      <defs>
        {usedMedia.map((m) => (
          <marker key={m} id={`${uid}-arr-${m}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 Z" style={{ fill: media[m]?.color ?? '#94a3b8' }} />
          </marker>
        ))}
      </defs>

      {typeof backdrop === 'function' ? backdrop({ width, height }) : backdrop}

      {/* 1. jalur sinyal (di bawah pipa) */}
      <g className="pid-signals">
        {lines
          .filter((l) => l.kind === 'signal')
          .map((l) => (
            <path key={l.id} d={pointsToPath(l.points, 0)} className={'pid-signal' + (lineActive(l) ? ' is-active' : '')} />
          ))}
      </g>

      {/* 2. pipa proses & utilitas */}
      <g className="pid-pipes">
        {lines
          .filter((l) => l.kind !== 'signal')
          .map((l) => {
            const d = pointsToPath(l.points, l.radius ?? 10)
            const color = media[l.medium]?.color ?? '#94a3b8'
            const n = norms[l.id]
            const flowing = n != null && Math.abs(n) > 0.02
            return (
              <g
                key={l.id}
                className={`pid-line pid-line-${l.kind ?? 'process'}` + (flowing ? ' is-flowing' : ' is-idle') + (lineActive(l) ? ' is-active' : '')}
                style={{ '--pid-c': color }}
              >
                <path d={d} className="pid-pipe" />
                <path d={d} className="pid-fluid" markerEnd={l.arrow === false ? undefined : `url(#${uid}-arr-${l.medium})`} />
                <path
                  ref={register(l.id)}
                  d={d}
                  className="pid-flow"
                  style={{ strokeDasharray: `7 ${DASH_PERIOD - 7}`, opacity: flowing ? 0.35 + 0.65 * Math.abs(n) : 0 }}
                />
                <PipeLabel line={l} />
              </g>
            )
          })}
      </g>

      {/* 3. peralatan */}
      <g className="pid-equipment">
        {equipment.map((eq) => (
          <Equipment key={eq.id} eq={eq} uid={uid} values={values} defsByTag={defsByTag} media={media} symbols={symbols} />
        ))}
      </g>

      {/* 4. instrumen + nilai live */}
      <g className="pid-instruments">
        {instruments.map((inst) => {
          const key = inst.valueTag ?? inst.tag // tag yang dihubungkan ke panel
          return (
            <Instrument
              key={inst.tag}
              inst={showChips ? inst : { ...inst, chip: false }}
              def={defsByTag[key]}
              value={values[key]}
              status={statuses[key] ?? 'ok'}
              active={activeTag === key || selectedTag === key}
              dim={activeTag != null && activeTag !== key && !inst.loopTags?.includes(activeTag)}
              onEnter={() => onTagHover?.(key)}
              onLeave={() => onTagHover?.(null)}
              onClick={() => onTagSelect?.(key)}
            />
          )
        })}
      </g>
    </svg>
  )
}
