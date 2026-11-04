import { useMemo, useState } from 'react'
import { LEVELS, STATUS, assessAll, formatUSD, personImpact, summarize } from './risk'
import './knowledge-risk.css'

/**
 * Matriks item (baris) × orang (kolom). Klik nama orang = simulasi "orang ini pergi".
 * Mode terkontrol: berikan `absent` + `onAbsentChange`; jika tidak, state internal.
 */
export function KnowledgeRiskMap({
  items,
  people,
  minLevel = 2,
  horizonMonths = 12,
  absent: absentProp,
  onAbsentChange,
  onSelect,
  selectedId,
  showSummary = true,
  showPeople = true,
}) {
  const [absentLocal, setAbsentLocal] = useState([])
  const absent = absentProp ?? absentLocal
  const setAbsent = (next) => (onAbsentChange ? onAbsentChange(next) : setAbsentLocal(next))
  const toggle = (id) => setAbsent(absent.includes(id) ? absent.filter((x) => x !== id) : [...absent, id])

  const opts = useMemo(() => ({ minLevel, horizonMonths, absent }), [minLevel, horizonMonths, absent])
  const rows = useMemo(() => assessAll(items, people, opts), [items, people, opts])
  const impact = useMemo(() => personImpact(items, people, opts), [items, people, opts])
  const sum = summarize(rows)
  const retiring = (p) => p.retireInMonths != null && p.retireInMonths <= horizonMonths

  return (
    <div className="kr-root">
      {showSummary && <KnowledgeSummary summary={sum} />}

      <div className="kr-scroll">
        <table className="kr-grid">
          <thead>
            <tr>
              <th className="kr-item-h">Aset / prosedur</th>
              {people.map((p) => {
                const off = absent.includes(p.id)
                return (
                  <th key={p.id} className="kr-person-h">
                    <button
                      className={`kr-person ${off ? 'is-off' : ''} ${retiring(p) ? 'is-retiring' : ''}`}
                      onClick={() => toggle(p.id)}
                      aria-pressed={off}
                      title={`${p.name}${p.role ? ` · ${p.role}` : ''}${p.retireInMonths != null ? ` · pensiun ${p.retireInMonths} bln lagi` : ''}\nKlik: simulasikan ${off ? 'kembali' : 'pergi'}`}
                    >
                      <span>{p.name}</span>
                      {retiring(p) && <i aria-label="pensiun dalam horizon">⌛</i>}
                    </button>
                  </th>
                )
              })}
              <th>Bus factor</th>
              <th>US$ at risk</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className={`kr-row is-${r.status} ${selectedId === r.id ? 'is-sel' : ''}`}
                onClick={() => onSelect?.(r)}
                tabIndex={onSelect ? 0 : undefined}
                onKeyDown={(e) => e.key === 'Enter' && onSelect?.(r)}
              >
                <td className="kr-item">
                  <b>{r.name}</b>
                  <small>
                    {r.area ?? ''} · kritikalitas {r.criticality}/5
                  </small>
                </td>
                {people.map((p) => {
                  const lvl = r.holders?.[p.id] ?? 0
                  const lost = r.lost.includes(p.id)
                  return (
                    <td key={p.id} className={`kr-cell lv-${lvl} ${lost ? 'is-lost' : ''}`} title={`${p.name}: ${LEVELS[lvl]}${lost ? ' (pergi)' : ''}`}>
                      {lvl > 0 ? lvl : ''}
                    </td>
                  )
                })}
                <td className="kr-bf">
                  <StatusBadge status={r.status} />
                  <span>
                    {r.busFactor}
                    {r.busFactor !== r.baselineBusFactor && <s title="sebelum ada yang pergi">{r.baselineBusFactor}</s>}
                  </span>
                </td>
                <td className="kr-usd">{formatUSD(r.usdAtRisk)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="kr-legend">
        <span><i className="kr-sw lv-1" /> 1 Tahu</span>
        <span><i className="kr-sw lv-2" /> 2 Kompeten</span>
        <span><i className="kr-sw lv-3" /> 3 Ahli</span>
        <span><i className="kr-sw is-lost" /> pergi (pensiun / simulasi)</span>
        <span>⌛ pensiun dalam {horizonMonths} bln</span>
      </div>

      {showPeople && <PeopleImpact impact={impact.slice(0, 5)} />}
    </div>
  )
}

export function StatusBadge({ status }) {
  return <span className={`kr-badge is-${status}`}>{STATUS[status].label}</span>
}

export function KnowledgeSummary({ summary }) {
  return (
    <div className="kr-summary">
      <div className="kr-sum is-orphan"><b>{summary.orphan}</b><span>yatim — tak ada yang kompeten</span></div>
      <div className="kr-sum is-single"><b>{summary.single}</b><span>kritis — hanya 1 orang</span></div>
      <div className="kr-sum is-thin"><b>{summary.thin}</b><span>tipis — 2 orang</span></div>
      <div className="kr-sum is-usd"><b>{formatUSD(summary.usdAtRisk)}</b><span>nilai pengetahuan terancam</span></div>
    </div>
  )
}

export function PeopleImpact({ impact }) {
  const max = Math.max(1, ...impact.map((p) => p.usdIfLeaves))
  return (
    <div className="kr-people">
      <h4>Siapa yang paling tak tergantikan? <small>tambahan US$ at risk jika dia pergi</small></h4>
      {impact.map((p) => (
        <div key={p.id} className="kr-pi">
          <span className="kr-pi-name">
            {p.name}
            <small>{p.sole} item hanya dia · {p.shared} berdua</small>
          </span>
          <span className="kr-pi-bar"><i style={{ width: `${(p.usdIfLeaves / max) * 100}%` }} /></span>
          <b>+{formatUSD(p.usdIfLeaves)}</b>
        </div>
      ))}
    </div>
  )
}
