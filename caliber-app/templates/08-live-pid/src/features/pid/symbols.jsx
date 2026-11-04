// Simbol P&ID (gaya ISA-5.1 yang disederhanakan) — semua SVG murni.
import { equipmentBox, fraction, formatValue, splitTag } from './engine'

/* ---------------------------------------------------------------- peralatan */

function LevelFill({ clipId, shape, x, y, w, h, level, color }) {
  const fh = h * level
  return (
    <>
      <defs>
        <clipPath id={clipId}>{shape}</clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
      {/* y/height lewat style agar transisi CSS bekerja */}
      <rect className="pid-level" x={x} width={w} style={{ fill: color, y: y + h - fh, height: fh }} />
      <rect className="pid-level-top" x={x} width={w} style={{ fill: color, y: y + h - fh - 0.75, height: 1.5 }} />
      </g>
    </>
  )
}

export function Tank({ eq, level, color, uid }) {
  const { x, y, w, h } = eq
  const r = Math.min(14, w / 4)
  const d = `M${x} ${y + h} V${y + r} Q${x} ${y} ${x + r} ${y} H${x + w - r} Q${x + w} ${y} ${x + w} ${y + r} V${y + h} Z`
  return (
    <>
      <path d={d} className="pid-body" />
      {level != null && <LevelFill clipId={`${uid}-clip-${eq.id}`} shape={<path d={d} />} {...{ x, y, w, h, level, color }} />}
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} className="pid-tick" x1={x + w - 8} x2={x + w} y1={y + h * f} y2={y + h * f} />
      ))}
      <path d={d} className="pid-outline" />
    </>
  )
}

export function Vessel({ eq, level, color, uid }) {
  const { x, y, w, h } = eq
  const shape = <rect x={x} y={y} width={w} height={h} rx={w / 2} ry={Math.min(h * 0.14, w / 2)} />
  return (
    <>
      <rect x={x} y={y} width={w} height={h} rx={w / 2} ry={Math.min(h * 0.14, w / 2)} className="pid-body" />
      {level != null && <LevelFill clipId={`${uid}-clip-${eq.id}`} shape={shape} {...{ x, y, w, h, level, color }} />}
      {/* demister di atas & tray sederhana */}
      <rect x={x + 8} y={y + h * 0.16} width={w - 16} height="6" className="pid-internal" />
      <rect x={x} y={y} width={w} height={h} rx={w / 2} ry={Math.min(h * 0.14, w / 2)} className="pid-outline" />
    </>
  )
}

export function Pump({ eq, running }) {
  const { x, y, r = 22 } = eq
  const blade = (a) => {
    const rad = (a * Math.PI) / 180
    return `M${x} ${y} Q${x + Math.cos(rad + 0.6) * r * 0.5} ${y + Math.sin(rad + 0.6) * r * 0.5} ${x + Math.cos(rad) * r * 0.72} ${y + Math.sin(rad) * r * 0.72}`
  }
  return (
    <>
      <path d={`M${x - r * 0.8} ${y + r * 1.25} L${x - r * 0.45} ${y + r * 0.6} M${x + r * 0.8} ${y + r * 1.25} L${x + r * 0.45} ${y + r * 0.6} M${x - r} ${y + r * 1.25} H${x + r}`} className="pid-outline" />
      <circle cx={x} cy={y} r={r} className="pid-body" />
      <g className={'pid-impeller' + (running ? ' is-running' : '')} style={{ transformOrigin: `${x}px ${y}px` }}>
        {[0, 120, 240].map((a) => (
          <path key={a} d={blade(a)} />
        ))}
      </g>
      <circle cx={x} cy={y} r={r} className="pid-outline" />
    </>
  )
}

export function Valve({ eq, position }) {
  const { x, y, size: s = 13, vertical } = eq
  const open = position == null ? 1 : Math.max(0, Math.min(1, position / 100))
  return (
    <g transform={vertical ? `rotate(90 ${x} ${y})` : undefined}>
      <line x1={x} y1={y} x2={x} y2={y - s * 1.5} className="pid-outline" />
      <path d={`M${x - s * 0.8} ${y - s * 1.5} A${s * 0.8} ${s * 0.8} 0 0 1 ${x + s * 0.8} ${y - s * 1.5} Z`} className="pid-actuator" />
      <path
        d={`M${x - s} ${y - s * 0.62} L${x + s} ${y + s * 0.62} V${y - s * 0.62} L${x - s} ${y + s * 0.62} Z`}
        className="pid-valve"
        style={{ fillOpacity: 0.12 + 0.75 * open }}
      />
      {/* indikator bukaan: garis tipis di bawah badan */}
      <line x1={x - s} x2={x + s} y1={y + s + 4} y2={y + s + 4} className="pid-track" />
      <line x1={x - s} x2={x + s} y1={y + s + 4} y2={y + s + 4} className="pid-track-fill" style={{ transform: `scaleX(${open})` }} />
    </g>
  )
}

export function Exchanger({ eq }) {
  const { x, y, w, h } = eq
  const n = 6
  const step = (w - 30) / n
  let zig = `M${x + 15} ${y + h / 2}`
  for (let i = 0; i < n; i++) zig += ` L${x + 15 + step * (i + 0.5)} ${y + (i % 2 ? h * 0.75 : h * 0.25)}`
  zig += ` L${x + w - 15} ${y + h / 2}`
  return (
    <>
      <rect x={x} y={y} width={w} height={h} rx={h / 2} className="pid-body" />
      <path d={zig} className="pid-coil" />
      <rect x={x} y={y} width={w} height={h} rx={h / 2} className="pid-outline" />
    </>
  )
}

export function Box({ eq }) {
  return <rect x={eq.x} y={eq.y} width={eq.w} height={eq.h} rx="8" className="pid-body pid-outline" />
}

export function Equipment({ eq, values, defsByTag, media, uid = 'pid', symbols = {} }) {
  const Sym = symbols[eq.type] ?? Box
  const level = eq.levelTag != null && values[eq.levelTag] != null ? fraction(defsByTag[eq.levelTag], values[eq.levelTag]) : null
  const running = eq.runTag ? values[eq.runTag] === 1 : true
  const position = eq.positionTag ? values[eq.positionTag] : null
  const color = media[eq.medium]?.color ?? '#38bdf8'
  const b = equipmentBox(eq)
  const lp = eq.labelPos ?? 'below'
  const lx = eq.labelDx != null ? b.x + b.w / 2 + eq.labelDx : b.x + b.w / 2
  const ly = lp === 'above' ? b.y - 22 : b.y + b.h + 16 + (eq.type === 'pump' ? (eq.r ?? 22) * 0.3 : 0)

  return (
    <g className={`pid-eq pid-eq-${eq.type}` + (running ? '' : ' is-stopped')}>
      <Sym eq={eq} uid={uid} level={level} color={color} running={running} position={position} />
      {eq.label !== false && (
        <text x={lx} y={ly} textAnchor="middle" className="pid-eq-label">
          <tspan className="pid-eq-id">{eq.id}</tspan>
          {eq.label && (
            <tspan x={lx} dy="13" className="pid-eq-name">
              {eq.label}
            </tspan>
          )}
        </text>
      )}
    </g>
  )
}

/* -------------------------------------------------------------- instrumen */

const CHIP_H = 20

/** Kotak nilai live di samping gelembung. Posisi: right | left | top | bottom. */
function chipGeom(inst, text) {
  const w = Math.max(44, text.length * 6.6 + 16)
  const R = inst.r ?? 16
  const side = inst.chip ?? 'right'
  const { x, y } = inst
  if (side === 'left') return { x: x - R - 6 - w, y: y - CHIP_H / 2, w }
  if (side === 'top') return { x: x - w / 2, y: y - R - 6 - CHIP_H, w }
  if (side === 'bottom') return { x: x - w / 2, y: y + R + 6, w }
  return { x: x + R + 6, y: y - CHIP_H / 2, w }
}

export function Instrument({ inst, def, value, status, active, dim, onEnter, onLeave, onClick }) {
  const { letters, loop } = splitTag(inst.tag)
  const R = inst.r ?? 16
  const dcs = inst.mount === 'dcs'
  const showChip = inst.chip !== false && def
  const text = showChip ? `${formatValue(def, value)}${def.states ? '' : ' ' + (def.unit ?? '')}`.trim() : ''
  const chip = showChip ? chipGeom(inst, text) : null
  const label = def ? `${inst.tag} ${def.label ?? ''}: ${text || formatValue(def, value)}` : inst.tag

  return (
    <g
      className={`pid-inst is-${status}` + (active ? ' is-active' : '') + (dim ? ' is-dim' : '')}
      tabIndex={0}
      role="button"
      aria-label={label}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
      onClick={onClick}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onClick?.())}
    >
      {inst.anchor && <line x1={inst.x} y1={inst.y} x2={inst.anchor[0]} y2={inst.anchor[1]} className="pid-leader" />}
      {status === 'alarm' && <circle cx={inst.x} cy={inst.y} r={R} className="pid-pulse" />}
      {dcs && <rect x={inst.x - R} y={inst.y - R} width={2 * R} height={2 * R} className="pid-bubble-box" />}
      <circle cx={inst.x} cy={inst.y} r={R} className="pid-bubble" />
      {dcs && <line x1={inst.x - R} x2={inst.x + R} y1={inst.y} y2={inst.y} className="pid-bubble-line" />}
      <text x={inst.x} y={inst.y - 2.5} textAnchor="middle" className="pid-bubble-letters">
        {letters}
      </text>
      <text x={inst.x} y={inst.y + 10} textAnchor="middle" className="pid-bubble-loop">
        {loop}
      </text>
      {chip && (
        <g className="pid-chip">
          <rect x={chip.x} y={chip.y} width={chip.w} height={CHIP_H} rx="5" />
          <text x={chip.x + chip.w / 2} y={chip.y + 14} textAnchor="middle">
            {text}
          </text>
        </g>
      )}
    </g>
  )
}
