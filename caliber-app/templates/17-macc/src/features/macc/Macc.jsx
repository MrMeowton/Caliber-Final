import { useMemo, useState } from 'react'
import { buildMacc, formatT, formatUSD } from './macc'
import './macc.css'

/**
 * MACC lengkap: KPI + kurva + daftar proyek.
 * Props: opportunities, carriers?, discountRate, carbonPrice, capexBudget, target, onlyEconomic, onSelect
 */
export function Macc({ opportunities, carriers, discountRate = 0.1, carbonPrice = 0, capexBudget = Infinity, target = Infinity, onlyEconomic = false, onSelect }) {
  const m = useMemo(
    () => buildMacc(opportunities, { discountRate, carriers, carbonPrice, capexBudget, target, onlyEconomic }),
    [opportunities, discountRate, carriers, carbonPrice, capexBudget, target, onlyEconomic],
  )
  const [focus, setFocus] = useState(null)
  const f = m.rows.find((r) => r.id === focus)
  const pick = (r) => {
    setFocus(r.id)
    onSelect?.(r)
  }

  return (
    <div className="mc-root">
      <div className="mc-kpis">
        <Kpi tone="good" value={`${formatT(m.selectedAbatement)} t`} label={`CO₂e/thn dari ${m.rows.filter((r) => r.selected).length} proyek terpilih`} />
        <Kpi value={formatUSD(m.selectedCapex)} label={Number.isFinite(capexBudget) ? `capex dari anggaran ${formatUSD(capexBudget)}` : 'capex terpilih'} />
        <Kpi tone={m.selectedNetCost <= 0 ? 'good' : 'bad'} value={formatUSD(-m.selectedNetCost, { sign: true })} label="nilai bersih / thn (tanpa karbon)" />
        <Kpi value={`${formatT(m.negativeCostAbatement)} t`} label={`abatement berbiaya negatif · ${formatT(m.economicAbatement)} t ≤ harga karbon`} />
      </div>

      <MaccChart macc={m} carbonPrice={carbonPrice} target={target} focusId={focus} onPick={pick} />

      {f && (
        <div className="mc-detail">
          <b>{f.name}</b> <small>{f.unit}</small>
          <span>
            MAC <strong className={f.mac < 0 ? 'is-neg' : ''}>{formatUSD(f.mac, { compact: false })}/tCO₂e</strong> · abatement {formatT(f.abatement)} t/thn ·
            capex {formatUSD(f.capex)} ({f.life} thn → {formatUSD(f.annualCapex)}/thn) · hemat energi {formatUSD(f.savings)}/thn
            {f.opexDelta ? ` · Δopex ${formatUSD(f.opexDelta)}/thn` : ''} · {f.selected ? '✓ terpilih' : 'tidak terpilih'}
          </span>
        </div>
      )}

      {m.excluded.length > 0 && (
        <p className="mc-note">
          Tidak masuk kurva (abatement ≤ 0 — justru menambah emisi pada faktor emisi saat ini): {m.excluded.map((o) => o.name).join(', ')}.
        </p>
      )}

      <ol className="mc-list">
        {m.rows.map((r, i) => (
          <li key={r.id}>
            <button className={`${r.selected ? 'is-sel' : ''} ${focus === r.id ? 'is-focus' : ''}`} onClick={() => pick(r)}>
              <span className="mc-n">{i + 1}</span>
              <span className="mc-name">{r.name}<small>{r.unit}</small></span>
              <span className={`mc-mac ${r.mac < 0 ? 'is-neg' : r.mac > carbonPrice ? 'is-high' : ''}`}>{formatUSD(r.mac, { compact: false })}</span>
              <span className="mc-ab">{formatT(r.abatement)} t</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}

function Kpi({ value, label, tone }) {
  return (
    <div className={`mc-kpi ${tone ? `is-${tone}` : ''}`}>
      <b>{value}</b>
      <span>{label}</span>
    </div>
  )
}

/** Kurva MACC: lebar = abatement (t/thn), tinggi = MAC (US$/t). */
export function MaccChart({ macc, carbonPrice = 0, target = Infinity, focusId, onPick, height = 320 }) {
  const W = 900
  const H = height
  const pad = { l: 60, r: 16, t: 20, b: 40 }
  const xMax = Math.max(1, macc.totalAbatement)
  const macs = macc.rows.map((r) => r.mac)
  const yHi = Math.max(carbonPrice * 1.2, ...macs, 10)
  const yLo = Math.min(0, ...macs) * 1.1
  const X = (t) => pad.l + (t / xMax) * (W - pad.l - pad.r)
  const Y = (v) => pad.t + ((yHi - v) / (yHi - yLo)) * (H - pad.t - pad.b)
  const step = niceStep((yHi - yLo) / 5)
  const yt = []
  for (let v = Math.ceil(yLo / step) * step; v <= yHi; v += step) yt.push(v)
  const xstep = niceStep(xMax / 6)
  const xt = []
  for (let v = 0; v <= xMax; v += xstep) xt.push(v)

  return (
    <svg className="mc-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Marginal abatement cost curve">
      {yt.map((v) => (
        <g key={v}>
          <line x1={pad.l} x2={W - pad.r} y1={Y(v)} y2={Y(v)} className={v === 0 ? 'mc-zero' : 'mc-grid'} />
          <text x={pad.l - 8} y={Y(v) + 4} textAnchor="end" className="mc-ax">{formatUSD(v)}</text>
        </g>
      ))}
      {xt.map((v) => (
        <text key={v} x={X(v)} y={H - pad.b + 18} textAnchor="middle" className="mc-ax">{formatT(v)}</text>
      ))}
      <text x={(W + pad.l) / 2} y={H - 4} textAnchor="middle" className="mc-ax">abatement kumulatif (tCO₂e / thn)</text>
      <text x={14} y={pad.t + (H - pad.t - pad.b) / 2} transform={`rotate(-90 14 ${pad.t + (H - pad.t - pad.b) / 2})`} textAnchor="middle" className="mc-ax">US$ / tCO₂e</text>

      {macc.rows.map((r, i) => {
        const y0 = Y(0)
        const y1 = Y(r.mac)
        return (
          <g key={r.id} className={`mc-bar ${r.selected ? 'is-sel' : ''} ${r.mac < 0 ? 'is-neg' : ''} ${focusId === r.id ? 'is-focus' : ''}`}
            onClick={() => onPick?.(r)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onPick?.(r)} role="button" aria-label={`${r.name}: ${Math.round(r.mac)} US$/t`}>
            <rect x={X(r.x0) + 0.5} y={Math.min(y0, y1)} width={Math.max(1, X(r.x1) - X(r.x0) - 1)} height={Math.max(1, Math.abs(y1 - y0))} rx="2" />
            {X(r.x1) - X(r.x0) > 18 && (
              <text x={(X(r.x0) + X(r.x1)) / 2} y={r.mac < 0 ? y1 + 14 : y1 - 5} textAnchor="middle" className="mc-lbl">{i + 1}</text>
            )}
          </g>
        )
      })}

      <g className="mc-price">
        <line x1={pad.l} x2={W - pad.r} y1={Y(carbonPrice)} y2={Y(carbonPrice)} />
        <text x={W - pad.r - 4} y={Y(carbonPrice) - 6} textAnchor="end">harga karbon {formatUSD(carbonPrice, { compact: false })}/t</text>
      </g>
      {Number.isFinite(target) && target <= xMax && (
        <g className="mc-target">
          <line x1={X(target)} x2={X(target)} y1={pad.t} y2={H - pad.b} />
          <text x={X(target) + 6} y={pad.t + 12}>target {formatT(target)} t</text>
        </g>
      )}
    </svg>
  )
}

function niceStep(raw) {
  const p = 10 ** Math.floor(Math.log10(Math.max(raw, 1e-9)))
  const n = raw / p
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p
}
