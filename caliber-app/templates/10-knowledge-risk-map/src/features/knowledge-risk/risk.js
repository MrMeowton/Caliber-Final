// Logika murni Knowledge-at-Risk — tanpa React, bisa dipakai di backend Node.
//
// Ide: setiap aset/prosedur kritis butuh orang yang KOMPETEN. Kalau hanya 1–2 senior
// yang menguasai (bus factor rendah) dan salah satunya pensiun/resign, pengetahuan itu hilang.

export const LEVELS = ['—', 'Tahu', 'Kompeten', 'Ahli'] // 0..3

export const STATUS = {
  orphan: { label: 'Yatim', desc: 'tidak ada lagi yang kompeten', rank: 0 },
  single: { label: 'Kritis', desc: 'hanya 1 orang', rank: 1 },
  thin: { label: 'Tipis', desc: '2 orang', rank: 2 },
  ok: { label: 'Aman', desc: '≥ 3 orang', rank: 3 },
}

// Bagian nilai yang dianggap "terancam" menurut jumlah orang kompeten yang tersisa.
// Bisa ditimpa lewat opsi `exposure`.
export const DEFAULT_EXPOSURE = [1, 0.6, 0.25, 0.05]

const statusOf = (n) => (n <= 0 ? 'orphan' : n === 1 ? 'single' : n === 2 ? 'thin' : 'ok')

/** Orang yang dianggap "pergi" dalam horizon: pensiun ≤ horizonMonths, atau ada di daftar `absent`. */
export function departingSet(people, { horizonMonths = 12, absent = [] } = {}) {
  const out = new Set(absent)
  for (const p of people) if (p.retireInMonths != null && p.retireInMonths <= horizonMonths) out.add(p.id)
  return out
}

/**
 * item: { id, name, criticality 1..5, valueAtRisk (US$), holders: { [personId]: level 0..3 } }
 * opsi: { minLevel=2, horizonMonths=12, absent=[], exposure=DEFAULT_EXPOSURE }
 */
export function assessItem(item, people, opts = {}) {
  const { minLevel = 2, exposure = DEFAULT_EXPOSURE } = opts
  const gone = opts.departing ?? departingSet(people, opts)
  const holders = item.holders ?? {}
  const competent = Object.keys(holders).filter((id) => holders[id] >= minLevel)
  const remaining = competent.filter((id) => !gone.has(id))
  const lost = competent.filter((id) => gone.has(id))
  const n = remaining.length
  const exp = exposure[Math.min(n, exposure.length - 1)]
  const crit = Math.max(1, Math.min(5, item.criticality ?? 3))
  // "Calon penerus": orang di level tepat di bawah minLevel yang tidak pergi
  const successors = Object.keys(holders).filter((id) => holders[id] === minLevel - 1 && !gone.has(id))
  return {
    ...item,
    competent,
    remaining,
    lost,
    successors,
    busFactor: n,
    baselineBusFactor: competent.length,
    status: statusOf(n),
    exposure: exp,
    riskScore: Math.round((crit / 5) * exp * 100),
    usdAtRisk: (item.valueAtRisk ?? 0) * exp,
  }
}

/** Semua item, diurutkan dari risiko tertinggi. */
export function assessAll(items, people, opts = {}) {
  const departing = departingSet(people, opts)
  return items
    .map((it) => assessItem(it, people, { ...opts, departing }))
    .sort((a, b) => b.riskScore - a.riskScore || b.usdAtRisk - a.usdAtRisk)
}

/**
 * Konsentrasi pengetahuan per orang: berapa item yang bergantung padanya
 * (dia salah satu dari ≤ 2 orang kompeten) dan US$ yang ikut hilang jika dia pergi.
 */
export function personImpact(items, people, opts = {}) {
  const { minLevel = 2 } = opts
  const base = assessAll(items, people, opts)
  return people
    .map((p) => {
      const sole = base.filter((r) => r.remaining.length === 1 && r.remaining[0] === p.id)
      const shared = base.filter((r) => r.remaining.length === 2 && r.remaining.includes(p.id))
      // what-if: dia pergi sekarang → selisih US$ at risk
      const without = assessAll(items, people, { ...opts, absent: [...(opts.absent ?? []), p.id] })
      const delta = sum(without, 'usdAtRisk') - sum(base, 'usdAtRisk')
      const expertIn = items.filter((it) => (it.holders?.[p.id] ?? 0) >= minLevel).length
      return { ...p, sole: sole.length, shared: shared.length, expertIn, usdIfLeaves: delta }
    })
    .sort((a, b) => b.usdIfLeaves - a.usdIfLeaves)
}

export function summarize(rows) {
  const count = { orphan: 0, single: 0, thin: 0, ok: 0 }
  for (const r of rows) count[r.status]++
  return { ...count, total: rows.length, usdAtRisk: sum(rows, 'usdAtRisk'), atRisk: count.orphan + count.single }
}

const sum = (arr, k) => arr.reduce((s, x) => s + (x[k] ?? 0), 0)

export function formatUSD(v, { compact = true } = {}) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : 0,
  }).format(v)
}
