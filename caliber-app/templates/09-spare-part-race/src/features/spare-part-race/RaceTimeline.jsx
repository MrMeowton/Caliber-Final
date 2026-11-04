import { useMemo, useState } from 'react'
import {
  STATUS,
  axisTicks,
  computeRaces,
  formatDate,
  formatDays,
  pct,
  raceWindow,
  startOfDay,
  summarize,
} from './race'
import './race.css'

/* ---------------------------------------------------------------------------
 * <RaceTimeline> — komponen siap pakai: ringkasan + sumbu waktu + satu baris per aset.
 * Tiap baris punya DUA garis waktu pada sumbu yang sama:
 *   ⚙ aset  : hari ini ─────► jendela gagal (P10…P90), ✕ = perkiraan gagal (P50)
 *   📦 part  : dipesan ──────► ● part tiba
 * Celah merah = part datang setelah aset gagal (hari downtime menunggu part).
 * ------------------------------------------------------------------------- */
export function RaceTimeline({
  items,
  now: nowProp,
  bufferDays = 3,
  range,
  selectedId: selectedProp,
  onSelect,
  showSummary = true,
  showLegend = true,
  locale = 'id-ID',
  renderMeta,
  emptyText = 'Belum ada aset yang dipantau.',
}) {
  // "Hari ini" dibulatkan ke awal hari agar posisi garis stabil
  const [mountedAt] = useState(() => Date.now())
  const now = useMemo(() => startOfDay(nowProp ?? mountedAt), [nowProp, mountedAt])
  const races = useMemo(() => computeRaces(items, { now, bufferDays }), [items, now, bufferDays])
  const win = useMemo(() => range ?? raceWindow(races, { now }), [range, races, now])
  const summary = useMemo(() => summarize(races), [races])

  // Mode terkontrol (host memegang selectedId) atau bebas
  const [selectedLocal, setSelectedLocal] = useState(null)
  const selectedId = selectedProp !== undefined ? selectedProp : selectedLocal
  const select = (race) => {
    const next = race && race.id !== selectedId ? race : null
    setSelectedLocal(next?.id ?? null)
    onSelect?.(next)
  }

  return (
    <section className="sr-root" aria-label="Balapan spare part vs kegagalan aset">
      {showSummary && <RaceSummary summary={summary} />}
      {showLegend && <RaceLegend />}

      <div className="sr-board">
        <RaceAxis range={win} now={now} locale={locale} />
        {races.length === 0 && <p className="sr-empty">{emptyText}</p>}
        {races.map((race) => (
          <RaceRow
            key={race.id}
            race={race}
            range={win}
            selected={race.id === selectedId}
            onSelect={() => select(race)}
            locale={locale}
            renderMeta={renderMeta}
          />
        ))}
      </div>
    </section>
  )
}

/* ---------- ringkasan ---------- */
export function RaceSummary({ summary }) {
  const cells = [
    { id: 'late', n: summary.late, text: 'part datang terlambat' },
    { id: 'tight', n: summary.tight, text: 'mepet / di jendela gagal' },
    { id: 'safe', n: summary.safe, text: 'aman' },
  ]
  return (
    <div className="sr-summary">
      {cells.map((c) => (
        <div key={c.id} className={`sr-sum is-${c.id}`}>
          <b>{c.n}</b>
          <span>{c.text}</span>
        </div>
      ))}
      <div className={`sr-sum ${summary.waitDays > 0 ? 'is-late' : ''}`}>
        <b>{Math.round(summary.waitDays)}</b>
        <span>hari downtime menunggu part</span>
      </div>
    </div>
  )
}

/* ---------- legenda ---------- */
export function RaceLegend() {
  return (
    <div className="sr-legend" aria-hidden="true">
      <span><i className="sr-lg-asset" /> Aset berjalan</span>
      <span><i className="sr-lg-band" /> Jendela gagal P10–P90</span>
      <span><i className="sr-lg-fail">✕</i> Perkiraan gagal</span>
      <span><i className="sr-lg-part" /> Part dalam perjalanan</span>
      <span><i className="sr-lg-arrive" /> Part tiba</span>
      <span><i className="sr-lg-gap" /> Downtime menunggu part</span>
    </div>
  )
}

/* ---------- sumbu waktu ---------- */
export function RaceAxis({ range, now, locale = 'id-ID' }) {
  const ticks = useMemo(() => axisTicks(range), [range])
  return (
    <div className="sr-row sr-axis" aria-hidden="true">
      <div className="sr-info" />
      <div className="sr-track">
        {ticks.map((t) => (
          <span key={t} className="sr-tick" style={{ left: `${pct(t, range)}%` }}>
            {formatDate(t, { day: 'numeric', month: 'short' }, locale)}
          </span>
        ))}
        <span className="sr-today-label" style={{ left: `${pct(now, range)}%` }}>Hari ini</span>
      </div>
    </div>
  )
}

/* ---------- satu baris: dua garis waktu ---------- */
export function RaceRow({ race, range, selected = false, onSelect, locale = 'id-ID', renderMeta }) {
  const r = race
  const x = (ms) => pct(ms, range)
  const span = (a, b) => ({ left: `${x(a)}%`, width: `${Math.max(0, x(b) - x(a))}%` })
  const d = (ms) => formatDate(ms, { day: 'numeric', month: 'short' }, locale)

  const verdict =
    r.status === 'late'
      ? `Part terlambat ${formatDays(r.waitDays)}`
      : r.status === 'tight'
        ? r.slackEarlyDays < 0
          ? 'Tiba di dalam jendela gagal'
          : `Selisih tipis ${formatDays(r.slackEarlyDays)}`
        : `Unggul ${formatDays(r.slackDays)}`

  const partState = {
    stock: 'tersedia di gudang',
    eta: `ETA supplier ${d(r.arriveAt)}`,
    ordered: `dipesan ${d(r.orderAt)} · lead ${r.leadTimeDays} hr`,
    'not-ordered': `belum dipesan · lead ${r.leadTimeDays} hr`,
  }[r.mode]

  const describe =
    `${r.asset ?? r.id}: perkiraan gagal ${d(r.failAt)} (rentang ${d(r.failEarly)}–${d(r.failLate)}). ` +
    `Part ${r.part?.name ?? ''} tiba ${d(r.arriveAt)}. Status ${STATUS[r.status].label}: ${verdict}.`

  return (
    <div
      className={`sr-row sr-race is-${r.status}${selected ? ' is-selected' : ''}`}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={describe}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect?.()
        }
      }}
    >
      <div className="sr-info">
        <div className="sr-title">
          <StatusBadge status={r.status} />
          <b>{r.asset ?? r.id}</b>
        </div>
        <div className="sr-sub">{r.part?.name ?? 'Spare part'} · {partState}</div>
        <div className={`sr-verdict is-${r.status}`}>{verdict}</div>
        {renderMeta?.(r)}
      </div>

      <div className="sr-track">
        <span className="sr-now" style={{ left: `${x(r.now)}%` }} />

        {/* celah merah: aset sudah mati, part belum datang */}
        {r.status === 'late' && (
          <span className="sr-gap" style={span(r.failAt, r.arriveAt)}>
            <em>+{Math.round(r.waitDays)} hr</em>
          </span>
        )}

        {/* garis 1 — aset */}
        <div className="sr-lane sr-lane-asset" title={`Aset: gagal ~${d(r.failAt)}`}>
          <span className="sr-lane-tag">⚙</span>
          <span className="sr-bar sr-bar-asset" style={span(r.now, r.failEarly)} />
          <span className="sr-band" style={span(r.failEarly, r.failLate)} />
          <span className="sr-mark sr-fail" style={{ left: `${x(r.failAt)}%` }}>✕</span>
          <span className="sr-date sr-date-fail" style={{ left: `${x(r.failAt)}%` }}>{d(r.failAt)}</span>
        </div>

        {/* garis 2 — part */}
        <div className="sr-lane sr-lane-part" title={`Part: tiba ${d(r.arriveAt)}`}>
          <span className="sr-lane-tag">📦</span>
          <span
            className={`sr-bar sr-bar-part${r.mode === 'not-ordered' ? ' is-planned' : ''}`}
            style={span(r.orderAt, r.arriveAt)}
          />
          {r.mode === 'not-ordered' && r.orderBy >= range[0] && (
            <span
              className={`sr-orderby${r.orderOverdueDays > 0 ? ' is-overdue' : ''}`}
              style={{ left: `${x(r.orderBy)}%` }}
              title={`Pesan paling lambat ${d(r.orderBy)}`}
            />
          )}
          <span className="sr-mark sr-arrive" style={{ left: `${x(r.arriveAt)}%` }} />
          <span className="sr-date sr-date-arrive" style={{ left: `${x(r.arriveAt)}%` }}>{d(r.arriveAt)}</span>
        </div>
      </div>
    </div>
  )
}

export function StatusBadge({ status }) {
  return <span className={`sr-badge is-${status}`}>{STATUS[status]?.label ?? status}</span>
}
