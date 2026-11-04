import { useMemo, useState } from 'react'
import { STRATEGIES, compareStrategies, formatUSD, plan } from './prioritize'
import './work-prioritizer.css'

/**
 * Daftar alert / work order yang diurutkan menurut US$ at risk dan diisi ke kapasitas crew.
 * Props: orders, capacityHours, strategy?/onStrategyChange?, baseline='fifo', onSelect, selectedId
 */
export function WorkPrioritizer({
  orders,
  capacityHours = 40,
  strategy: strategyProp,
  onStrategyChange,
  baseline = 'fifo',
  onSelect,
  selectedId,
  showCompare = true,
}) {
  const [local, setLocal] = useState('optimal')
  const strategy = strategyProp ?? local
  const setStrategy = (k) => (onStrategyChange ? onStrategyChange(k) : setLocal(k))
  const p = useMemo(() => plan(orders, { capacityHours, strategy }), [orders, capacityHours, strategy])
  const cmp = useMemo(() => compareStrategies(orders, { capacityHours, baseline }), [orders, capacityHours, baseline])
  const max = Math.max(1, ...p.rows.map((r) => r.usdAtRisk))
  const best = cmp.reduce((a, b) => (b.retired > a.retired ? b : a))

  return (
    <div className="wp-root">
      <div className="wp-top">
        <div className="wp-seg" role="tablist" aria-label="Strategi prioritas">
          {Object.entries(STRATEGIES).map(([k, s]) => (
            <button key={k} role="tab" aria-selected={strategy === k} className={strategy === k ? 'is-on' : ''} onClick={() => setStrategy(k)} title={s.desc}>
              {s.label}
            </button>
          ))}
        </div>
        <div className="wp-cap">
          <span>Kapasitas</span>
          <i><em style={{ width: `${Math.min(100, (p.hoursUsed / capacityHours) * 100)}%` }} /></i>
          <b>{Math.round(p.hoursUsed)} / {capacityHours} jam</b>
        </div>
      </div>

      <div className="wp-kpis">
        <div className="wp-kpi is-good"><b>{formatUSD(p.retired)}</b><span>risiko dipensiunkan ({p.scheduledCount} WO)</span></div>
        <div className="wp-kpi is-bad"><b>{formatUSD(p.remainingRisk)}</b><span>risiko tersisa (ditunda)</span></div>
        <div className="wp-kpi"><b>{formatUSD(p.totalRisk)}</b><span>total US$ at risk backlog</span></div>
      </div>

      <ol className="wp-list">
        {p.rows.map((r) => (
          <li key={r.id}>
            <button
              className={`wp-row ${r.scheduled ? 'is-in' : 'is-out'} ${selectedId === r.id ? 'is-sel' : ''}`}
              onClick={() => onSelect?.(r)}
            >
              <span className="wp-rank">{r.rank}</span>
              <span className="wp-name">
                <b>{r.title}</b>
                <small>
                  {r.source && <em className={`wp-src is-${r.source}`}>{r.source}</em>} {r.asset} · P {Math.round(r.p * 100)}% × (
                  {formatUSD(r.lostMarginPerHour ?? 0)}/jam × {r.mttrHours ?? 0} jam + {formatUSD(r.repairCost ?? 0)})
                </small>
              </span>
              <span className="wp-bar" aria-hidden>
                <i style={{ width: `${(r.usdAtRisk / max) * 100}%` }}>
                  <em style={{ width: `${(r.lostMargin / Math.max(1, r.consequence)) * 100}%` }} />
                </i>
              </span>
              <span className="wp-usd">{formatUSD(r.usdAtRisk)}</span>
              <span className="wp-hrs">{r.hours} jam<small>{formatUSD(r.perHour)}/jam</small></span>
              <span className={`wp-state ${r.scheduled ? 'is-in' : 'is-out'}`}>{r.scheduled ? 'Kerjakan' : 'Tunda'}</span>
            </button>
          </li>
        ))}
      </ol>

      <div className="wp-legend">
        <span><i className="wp-sw is-margin" /> lost margin (margin/jam × MTTR)</span>
        <span><i className="wp-sw is-repair" /> biaya repair</span>
        <span>panjang bar = P(failure) × konsekuensi</span>
      </div>

      {showCompare && <StrategyCompare rows={cmp} active={strategy} best={best.key} baseline={baseline} />}
    </div>
  )
}

/** Perbandingan risiko yang dipensiunkan oleh tiap strategi pada kapasitas yang sama. */
export function StrategyCompare({ rows, active, best, baseline }) {
  const max = Math.max(1, ...rows.map((r) => r.retired))
  return (
    <div className="wp-cmp">
      <h4>Kapasitas sama, hasil berbeda <small>US$ risiko dipensiunkan per strategi</small></h4>
      {rows.map((r) => (
        <div key={r.key} className={`wp-cmp-row ${r.key === active ? 'is-on' : ''}`}>
          <span>{r.label}{r.key === best && ' ★'}</span>
          <i><em style={{ width: `${(r.retired / max) * 100}%` }} /></i>
          <b>{formatUSD(r.retired)}</b>
          <small>{r.key === baseline ? 'baseline' : `${r.vsBaseline >= 0 ? '+' : ''}${formatUSD(r.vsBaseline)}`}</small>
        </div>
      ))}
    </div>
  )
}
