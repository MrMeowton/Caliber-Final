'use client'

import { STATUS, partStatus, readValue, sensorStatus, summarize } from './status'

// =========================================
// <AssetPanel> — panel ringkasan & detail sensor (opsional)
// -----------------------------------------
// Tanpa pilihan : ringkasan status + daftar komponen
// Ada pilihan   : detail komponen + nilai sensor + sparkline (jika `history` diberikan)
// Tidak bergantung pada three.js — bisa dipakai juga tanpa kanvas 3D.
// =========================================

function Sparkline({ values, sensor }) {
  if (!values || values.length < 2) return <div className="a3d-spark" />
  const w = 120
  const h = 32
  const lo = Math.min(...values, (sensor.warn ?? values[0]) * 0.85)
  const hi = Math.max(...values, (sensor.warn ?? values[0]) * 1.05)
  const x = (i) => (i / (values.length - 1)) * w
  const y = (v) => h - ((v - lo) / (hi - lo || 1)) * h
  const pts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const color = STATUS[sensorStatus(sensor, values.at(-1))].color
  return (
    <svg className="a3d-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      {sensor.warn != null && (
        <line x1="0" x2={w} y1={y(sensor.warn)} y2={y(sensor.warn)} className="a3d-spark__warn" />
      )}
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export default function AssetPanel({
  asset,
  readings,
  history,
  selectedId,
  onSelect,
  title,
  subtitle,
  className = '',
}) {
  const parts = asset.parts
  const part = parts.find((p) => p.id === selectedId)
  const counts = summarize(parts, readings)

  return (
    <aside className={`a3d-panel ${className}`}>
      <header className="a3d-panel__header">
        {(subtitle ?? asset.subtitle) && <p className="a3d-eyebrow">{subtitle ?? asset.subtitle}</p>}
        <h1>{title ?? asset.name ?? 'Asset 3D View'}</h1>
        <div className="a3d-summary">
          {Object.entries(STATUS).map(([key, s]) => (
            <div key={key} className="a3d-summary__item">
              <span className="a3d-dot" style={{ background: s.color }} />
              <strong>{counts[key]}</strong>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </header>

      {!part && (
        <section className="a3d-panel__body">
          <p className="a3d-hint">Klik komponen di model 3D atau pilih dari daftar.</p>
          <ul className="a3d-part-list">
            {parts.map((p) => (
              <li key={p.id}>
                <button className="a3d-part-row" onClick={() => onSelect(p.id)}>
                  <span className="a3d-dot" style={{ background: STATUS[partStatus(p, readings)].color }} />
                  <span className="a3d-part-row__name">{p.name}</span>
                  {p.code && <span className="a3d-part-row__code">{p.code}</span>}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {part && (
        <section className="a3d-panel__body">
          <button className="a3d-back" onClick={() => onSelect(null)}>
            ← Semua komponen
          </button>
          <div className="a3d-detail__head">
            <div>
              {part.code && <p className="a3d-eyebrow">{part.code}</p>}
              <h2>{part.name}</h2>
            </div>
            <span className={`a3d-badge a3d-badge--${partStatus(part, readings)}`}>
              {STATUS[partStatus(part, readings)].label}
            </span>
          </div>
          {part.description && <p className="a3d-detail__desc">{part.description}</p>}

          <div className="a3d-sensors">
            {(part.sensors ?? []).map((s) => {
              const v = readValue(readings, part.id, s)
              const color = STATUS[sensorStatus(s, v)].color
              return (
                <div key={s.key} className="a3d-sensor">
                  <div className="a3d-sensor__top">
                    <span className="a3d-sensor__label">{s.label}</span>
                    <span className="a3d-sensor__value" style={{ color }}>
                      {v ?? '–'}
                      <small>{s.unit}</small>
                    </span>
                  </div>
                  {history && <Sparkline values={history[part.id]?.[s.key]} sensor={s} />}
                  <div className="a3d-sensor__limits">
                    {s.warn != null && <span>Warning ≥ {s.warn}</span>}
                    {s.crit != null && <span>Critical ≥ {s.crit}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </aside>
  )
}
