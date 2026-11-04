// DEMO — halaman uji untuk modul src/features/spare-part-race.
// Yang perlu disalin ke project utama hanya folder features/spare-part-race.
import { useMemo, useState } from 'react'
import {
  RaceTimeline,
  StatusBadge,
  addDays,
  computeRace,
  formatDate,
  formatDays,
  formatMoney,
  startOfDay,
} from './features/spare-part-race'
import { DEMO_ITEMS } from './demo/assets'

const TODAY = startOfDay(Date.now())

// Data demo memakai "hari dari sekarang"; dikunci ke tanggal absolut sekali saja,
// supaya slider "geser hari ini" benar-benar memajukan waktu (bukan ikut menggeser data).
const absolute = (n) => (n == null ? undefined : addDays(TODAY, n))
const BASE = DEMO_ITEMS.map((it) => ({
  ...it,
  failure: { p10: absolute(it.failure.p10), p50: absolute(it.failure.p50), p90: absolute(it.failure.p90) },
  part: { ...it.part, orderedAt: absolute(it.part.orderedAt), eta: absolute(it.part.eta), stockSince: absolute(it.part.stockSince) },
}))

// Override what-if per aset: { leadTimeDays?, orderedAt?, failShift? }
function applyWhatIf(item, w) {
  if (!w) return item
  const shift = (ms) => (ms == null ? ms : addDays(ms, w.failShift ?? 0))
  return {
    ...item,
    failure: { p10: shift(item.failure.p10), p50: shift(item.failure.p50), p90: shift(item.failure.p90) },
    part: {
      ...item.part,
      leadTimeDays: w.leadTimeDays ?? item.part.leadTimeDays,
      orderedAt: w.orderedAt ?? item.part.orderedAt,
      eta: w.leadTimeDays != null || w.orderedAt != null ? undefined : item.part.eta,
      inStock: w.inStock ?? item.part.inStock,
    },
  }
}

export default function App() {
  const [dayOffset, setDayOffset] = useState(0)
  const [bufferDays, setBufferDays] = useState(3)
  const [whatIf, setWhatIf] = useState({})
  const [selectedId, setSelectedId] = useState('C-301')

  const now = addDays(TODAY, dayOffset)
  const items = useMemo(() => BASE.map((it) => applyWhatIf(it, whatIf[it.id])), [whatIf])
  const selected = items.find((it) => it.id === selectedId)
  const race = selected ? computeRace(selected, { now, bufferDays }) : null
  const original = BASE.find((it) => it.id === selectedId)

  const patch = (id, change) => setWhatIf((w) => ({ ...w, [id]: { ...w[id], ...change } }))
  const reset = (id) => setWhatIf(({ [id]: _drop, ...rest }) => rest)

  return (
    <div className="page">
      <header className="head">
        <div>
          <p className="eyebrow">Manufacturing Intelligence · Predictive Maintenance</p>
          <h1>Spare-part race: part datang duluan, atau aset gagal duluan?</h1>
        </div>
        <div className="controls">
          <label className="ctl">
            <span>Geser hari ini <b>{dayOffset >= 0 ? '+' : ''}{dayOffset} hari</b></span>
            <input type="range" min={0} max={21} value={dayOffset} onChange={(e) => setDayOffset(+e.target.value)} />
          </label>
          <label className="ctl">
            <span>Buffer instalasi <b>{bufferDays} hari</b></span>
            <input type="range" min={0} max={10} value={bufferDays} onChange={(e) => setBufferDays(+e.target.value)} />
          </label>
        </div>
      </header>

      <p className="hint">
        Setiap aset punya <b>dua garis waktu</b>: ⚙ kapan aset diperkirakan gagal (✕, dengan jendela P10–P90) dan
        📦 kapan spare part-nya tiba (●, dari lead time). Kalau part tiba setelah aset gagal, celahnya{' '}
        <b className="red">merah</b> = hari pabrik menunggu part. Geser <b>hari ini</b> untuk melihat biaya menunda
        pemesanan; klik baris untuk simulasi what-if.
      </p>

      <div className="layout">
        <RaceTimeline
          items={items}
          now={now}
          bufferDays={bufferDays}
          selectedId={selectedId}
          onSelect={(r) => setSelectedId(r?.id ?? null)}
        />

        <aside className="panel">
          {!race ? (
            <p className="muted">Pilih aset di timeline untuk melihat detail & simulasi.</p>
          ) : (
            <>
              <div className="panel-head">
                <StatusBadge status={race.status} />
                <h2>{race.asset}</h2>
                <p className="muted">{race.area} · {race.part.name} · {race.part.supplier}</p>
              </div>

              <dl className="facts">
                <dt>Perkiraan gagal</dt>
                <dd>{formatDate(race.failAt)} <small>({formatDate(race.failEarly)}–{formatDate(race.failLate)})</small></dd>
                <dt>Part tiba</dt>
                <dd className={race.status === 'late' ? 'red' : ''}>{formatDate(race.arriveAt)}</dd>
                <dt>Selisih (P50)</dt>
                <dd className={race.slackDays < 0 ? 'red' : ''}>
                  {race.slackDays < 0 ? `terlambat ${formatDays(race.slackDays)}` : `unggul ${formatDays(race.slackDays)}`}
                </dd>
                {race.mode === 'not-ordered' && (
                  <>
                    <dt>Pesan paling lambat</dt>
                    <dd className={race.orderOverdueDays > 0 ? 'red' : ''}>
                      {formatDate(race.orderBy)}
                      {race.orderOverdueDays > 0 && <small> (lewat {formatDays(race.orderOverdueDays)})</small>}
                    </dd>
                  </>
                )}
                <dt>Eksposur downtime</dt>
                <dd className={race.exposure > 0 ? 'red' : ''}>{race.exposure > 0 ? formatMoney(race.exposure) : '—'}</dd>
              </dl>

              <p className={`advice is-${race.status}`}>{advice(race, bufferDays)}</p>

              <h3>Simulasi what-if</h3>
              <label className="ctl">
                <span>Lead time <b>{race.leadTimeDays} hari</b> <small>(awal {original.part.leadTimeDays})</small></span>
                <input
                  type="range"
                  min={0}
                  max={60}
                  value={race.leadTimeDays}
                  disabled={race.mode === 'stock'}
                  onChange={(e) => patch(race.id, { leadTimeDays: +e.target.value })}
                />
              </label>
              <label className="ctl">
                <span>Degradasi <b>{fmtShift(whatIf[race.id]?.failShift ?? 0)}</b></span>
                <input
                  type="range"
                  min={-10}
                  max={10}
                  value={whatIf[race.id]?.failShift ?? 0}
                  onChange={(e) => patch(race.id, { failShift: +e.target.value })}
                />
              </label>
              <div className="actions">
                {race.mode === 'not-ordered' && (
                  <button onClick={() => patch(race.id, { orderedAt: now })}>Pesan sekarang</button>
                )}
                {race.status !== 'safe' && race.expediteDays > 0 && race.mode !== 'stock' && (
                  <button onClick={() => patch(race.id, { leadTimeDays: Math.max(0, race.leadTimeDays - Math.ceil(race.expediteDays)) })}>
                    Expedite −{Math.ceil(race.expediteDays)} hari
                  </button>
                )}
                {whatIf[race.id] && <button className="ghost" onClick={() => reset(race.id)}>Reset</button>}
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  )
}

const fmtShift = (d) => (d === 0 ? 'sesuai model' : d < 0 ? `${-d} hari lebih cepat` : `${d} hari lebih lambat`)

function advice(r, buffer) {
  if (r.mode === 'stock') return 'Part sudah di gudang — jadwalkan penggantian sebelum jendela gagal.'
  if (r.status === 'late') {
    const fix = Math.ceil(r.expediteDays)
    return `Part tiba ${formatDays(r.waitDays)} setelah perkiraan gagal. Pangkas lead time ≥ ${fix} hari (air freight / supplier lokal), cari part interchangeable, atau turunkan beban aset untuk memperlambat degradasi.`
  }
  if (r.status === 'tight')
    return `Part tiba di dalam jendela gagal atau kurang dari ${buffer} hari buffer. Expedite ${Math.ceil(r.expediteDays)} hari agar aman di skenario terburuk.`
  if (r.mode === 'not-ordered')
    return `Masih aman, tapi part belum dipesan — pesan paling lambat ${formatDate(r.orderBy)}.`
  return `Part tiba ${formatDays(r.slackEarlyDays)} sebelum skenario gagal terburuk.`
}
