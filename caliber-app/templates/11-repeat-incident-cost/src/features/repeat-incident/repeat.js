// Logika murni Repeat-Incident Cost — tanpa React.
//
// Insiden "berulang setelah RCA" = insiden dengan aset + mode kegagalan yang SAMA dengan
// insiden lain yang sudah pernah di-RCA. Biayanya adalah bukti nilai knowledge retention:
// pelajarannya sudah ada, tapi tidak sampai ke orang/shift/plant berikutnya.

export const DAY = 86_400_000

export const KIND = {
  first: { label: 'Pertama', desc: 'kejadian pertama' },
  repeatNoRca: { label: 'Berulang, belum RCA', desc: 'berulang tetapi belum pernah di-RCA' },
  repeatAfterRca: { label: 'Berulang setelah RCA', desc: 'sudah di-RCA, tetap terulang' },
}

export const toMs = (d) => (d instanceof Date ? d.getTime() : typeof d === 'string' ? Date.parse(d) : d)

/** Biaya satu insiden (US$) = jam downtime × lost margin/jam + biaya perbaikan (+ lainnya). */
export function incidentCost(i) {
  return (i.downtimeHours ?? 0) * (i.lostMarginPerHour ?? 0) + (i.repairCost ?? 0) + (i.otherCost ?? 0)
}

const defaultKey = (i) => `${i.asset}|${i.failureMode}`

/**
 * Klasifikasikan semua insiden.
 * opsi: { keyFn = asset|failureMode, until } — `until` (tanggal) = abaikan insiden sesudahnya (replay)
 */
export function classify(incidents, { keyFn = defaultKey, until } = {}) {
  const lim = until == null ? Infinity : toMs(until)
  const list = incidents
    .map((i) => ({ ...i, at: toMs(i.date), rcaAt: i.rca?.date ? toMs(i.rca.date) : null, cost: incidentCost(i), key: keyFn(i) }))
    .filter((i) => i.at <= lim)
    .sort((a, b) => a.at - b.at)

  const seen = new Map() // key → { count, rcaAt (RCA paling awal yang SUDAH selesai sebelum kejadian ini) }
  for (const i of list) {
    const s = seen.get(i.key) ?? { count: 0, rcaAt: null, rcaBy: null }
    if (s.count === 0) i.kind = 'first'
    else if (s.rcaAt != null && s.rcaAt < i.at) {
      i.kind = 'repeatAfterRca'
      i.daysSinceRca = Math.round((i.at - s.rcaAt) / DAY)
      i.rcaRef = s.rcaBy
    } else i.kind = 'repeatNoRca'
    s.count++
    // RCA milik insiden ini berlaku untuk kejadian berikutnya (jika selesai sebelum `until`)
    if (i.rcaAt != null && i.rcaAt <= lim && (s.rcaAt == null || i.rcaAt < s.rcaAt)) {
      s.rcaAt = i.rcaAt
      s.rcaBy = i.id
    }
    seen.set(i.key, s)
  }
  return list
}

/** Ringkasan per signature (aset + mode), diurutkan dari biaya berulang-setelah-RCA terbesar. */
export function groupBySignature(classified) {
  const map = new Map()
  for (const i of classified) {
    const g = map.get(i.key) ?? {
      key: i.key, asset: i.asset, failureMode: i.failureMode, count: 0, repeats: 0, repeatsAfterRca: 0,
      cost: 0, repeatCost: 0, firstAt: i.at, lastAt: i.at, rcaAt: null, incidents: [],
    }
    g.count++
    g.cost += i.cost
    g.lastAt = i.at
    if (i.kind !== 'first') g.repeats++
    if (i.kind === 'repeatAfterRca') {
      g.repeatsAfterRca++
      g.repeatCost += i.cost
    }
    if (i.rcaAt != null && (g.rcaAt == null || i.rcaAt < g.rcaAt)) g.rcaAt = i.rcaAt
    g.incidents.push(i)
    map.set(i.key, g)
  }
  return [...map.values()].sort((a, b) => b.repeatCost - a.repeatCost || b.cost - a.cost)
}

/** KPI utama. `effectiveness` (0..1) = porsi pengulangan yang bisa dicegah bila pelajaran RCA tersebar. */
export function summarize(classified, { effectiveness = 0.6 } = {}) {
  const total = classified.reduce((s, i) => s + i.cost, 0)
  const after = classified.filter((i) => i.kind === 'repeatAfterRca')
  const noRca = classified.filter((i) => i.kind === 'repeatNoRca')
  const repeatCost = after.reduce((s, i) => s + i.cost, 0)
  const gaps = after.map((i) => i.daysSinceRca).sort((a, b) => a - b)
  return {
    incidents: classified.length,
    totalCost: total,
    repeatAfterRca: after.length,
    repeatCost,
    repeatNoRca: noRca.length,
    repeatNoRcaCost: noRca.reduce((s, i) => s + i.cost, 0),
    share: total ? repeatCost / total : 0,
    downtimeHours: after.reduce((s, i) => s + (i.downtimeHours ?? 0), 0),
    medianDaysSinceRca: gaps.length ? gaps[Math.floor((gaps.length - 1) / 2)] : null,
    avoidable: repeatCost * effectiveness,
  }
}

/** Seri kumulatif untuk grafik: [{ at, total, repeat }] satu titik per insiden. */
export function cumulative(classified) {
  let total = 0
  let repeat = 0
  return classified.map((i) => {
    total += i.cost
    if (i.kind === 'repeatAfterRca') repeat += i.cost
    return { at: i.at, total, repeat, kind: i.kind, id: i.id }
  })
}

export function formatUSD(v, { compact = true } = {}) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', notation: compact ? 'compact' : 'standard', maximumFractionDigits: compact ? 1 : 0,
  }).format(v)
}

export const formatDate = (ms, locale = 'id-ID') =>
  new Date(ms).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: '2-digit' })
