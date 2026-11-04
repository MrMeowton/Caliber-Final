// Logika murni Risk-Based Work Prioritizer — tanpa React.
//
//   US$ at risk = P(failure) × (lost margin/jam × MTTR + biaya repair)
//
// Strategi `optimal` menyelesaikan knapsack 0/1 secara eksak (DP per 0,5 jam) — greedy
// "US$ per jam" atau "US$ terbesar dulu" bisa meleset ketika satu WO besar memakan kapasitas.
//
// Mengerjakan sebuah work order menurunkan P(failure) ke `pAfter` (default 0), sehingga
// "risiko yang dipensiunkan" = (P − pAfter) × konsekuensi. Kapasitas crew (jam kerja) terbatas
// → pilih paket work order yang memensiunkan US$ terbanyak.

export const STRATEGIES = {
  optimal: { label: 'Optimal (US$ maks)', desc: 'knapsack eksak: paket WO dengan risiko dipensiunkan terbesar' },
  ratio: { label: 'US$ per jam', desc: 'risiko dipensiunkan ÷ jam kerja (greedy)' },
  risk: { label: 'US$ at risk', desc: 'risiko terbesar dulu' },
  severity: { label: 'Severity alarm', desc: 'prioritas alarm/DCS, lalu yang paling lama' },
  fifo: { label: 'FIFO', desc: 'yang masuk duluan dikerjakan duluan' },
}

const toMs = (d) => (d instanceof Date ? d.getTime() : typeof d === 'string' ? Date.parse(d) : (d ?? 0))

/** Hitung angka risiko satu work order. */
export function scoreOrder(o) {
  const p = clamp01(o.pFailure ?? 0)
  const pAfter = clamp01(o.pAfter ?? 0)
  const lostMargin = (o.lostMarginPerHour ?? 0) * (o.mttrHours ?? 0)
  const consequence = lostMargin + (o.repairCost ?? 0)
  const usdAtRisk = p * consequence
  const retired = Math.max(0, p - pAfter) * consequence
  const hours = Math.max(0.1, o.laborHours ?? 1)
  return { ...o, p, lostMargin, consequence, usdAtRisk, retired, hours, perHour: retired / hours }
}

const sorters = {
  ratio: (a, b) => b.perHour - a.perHour,
  risk: (a, b) => b.usdAtRisk - a.usdAtRisk,
  severity: (a, b) => (b.severity ?? 0) - (a.severity ?? 0) || toMs(a.createdAt) - toMs(b.createdAt),
  fifo: (a, b) => toMs(a.createdAt) - toMs(b.createdAt),
}

/**
 * Susun rencana kerja: urutkan menurut strategi, isi kapasitas (lewati yang tidak muat, lanjut
 * ke berikutnya yang muat). Hasil: { rows (dengan rank, scheduled, cumHours), retired, deferredRisk, … }
 */
export function plan(orders, { capacityHours = Infinity, strategy = 'optimal' } = {}) {
  let rows
  let used = 0
  if (strategy === 'optimal' && Number.isFinite(capacityHours)) {
    const pick = knapsack(orders.map(scoreOrder), capacityHours)
    rows = [...pick.in.sort(sorters.risk), ...pick.out.sort(sorters.risk)]
    for (const r of pick.in) r.scheduled = true
    for (const r of pick.out) r.scheduled = false
    for (const r of rows) r.cumHours = used += r.scheduled ? r.hours : 0
  } else {
    rows = orders.map(scoreOrder).sort(sorters[strategy] ?? sorters.risk)
    for (const r of rows) {
      r.scheduled = used + r.hours <= capacityHours + 1e-9
      if (r.scheduled) used += r.hours
      r.cumHours = used
    }
  }
  rows.forEach((r, i) => (r.rank = i + 1))
  const total = rows.reduce((s, r) => s + r.usdAtRisk, 0)
  const retired = rows.filter((r) => r.scheduled).reduce((s, r) => s + r.retired, 0)
  return {
    strategy,
    rows,
    hoursUsed: used,
    capacityHours,
    totalRisk: total,
    retired,
    remainingRisk: total - retired,
    scheduledCount: rows.filter((r) => r.scheduled).length,
  }
}

/** Bandingkan semua strategi pada kapasitas yang sama. */
export function compareStrategies(orders, { capacityHours, baseline = 'fifo' } = {}) {
  const out = Object.keys(STRATEGIES).map((k) => {
    const p = plan(orders, { capacityHours, strategy: k })
    return { key: k, ...STRATEGIES[k], retired: p.retired, remainingRisk: p.remainingRisk }
  })
  const base = out.find((s) => s.key === baseline)?.retired ?? 0
  return out.map((s) => ({ ...s, vsBaseline: s.retired - base }))
}

/** Knapsack 0/1 eksak: maksimalkan Σ retired dengan Σ jam ≤ kapasitas (resolusi 0,5 jam). */
export function knapsack(rows, capacityHours, step = 0.5) {
  const W = Math.max(0, Math.floor(capacityHours / step + 1e-9))
  const w = rows.map((r) => Math.ceil(r.hours / step - 1e-9))
  const best = new Float64Array(W + 1)
  const take = rows.map(() => new Uint8Array(W + 1))
  rows.forEach((r, i) => {
    for (let c = W; c >= w[i]; c--) {
      const v = best[c - w[i]] + r.retired
      if (v > best[c] + 1e-9) {
        best[c] = v
        take[i][c] = 1
      }
    }
  })
  const chosen = new Set()
  for (let i = rows.length - 1, c = W; i >= 0; i--) {
    if (take[i][c]) {
      chosen.add(i)
      c -= w[i]
    }
  }
  return { in: rows.filter((_, i) => chosen.has(i)), out: rows.filter((_, i) => !chosen.has(i)) }
}

function clamp01(x) {
  return Math.max(0, Math.min(1, x))
}

export function formatUSD(v, { compact = true } = {}) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', notation: compact ? 'compact' : 'standard', maximumFractionDigits: compact ? 1 : 0,
  }).format(v)
}
