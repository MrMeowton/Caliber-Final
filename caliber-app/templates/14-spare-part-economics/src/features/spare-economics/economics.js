// Logika murni Spare-Part Economics — tanpa React.
//
// Kebijakan base-stock (S−1, S): setiap part terpakai langsung dipesan ulang satu.
// Permintaan selama lead time D ~ Poisson(m), m = λ · L / 365
//   λ = pemakaian per tahun (kegagalan yang butuh part), L = lead time (hari)
//
//   Rata-rata stok di gudang  E[(S − D)+]          → biaya simpan = × harga × holding rate
//   Fill rate                 P(D ≤ S − 1)         → peluang part ada saat dibutuhkan
//   Rata-rata backorder       E[(D − S)+]          → rata-rata mesin yang menunggu part
//   Jam downtime / tahun      E[BO] × 8760         (hukum Little)
//
// Trade-off: stok lebih banyak = working capital & biaya simpan naik, downtime turun.
// S* = titik minimum total biaya; reorder point = S* − 1.

export const HOURS_PER_YEAR = 8760

/** Probabilitas Poisson P(D = 0..n) (stabil numerik, rekursif). */
export function poissonPmf(m, n) {
  const p = new Array(n + 1)
  p[0] = Math.exp(-m)
  for (let k = 1; k <= n; k++) p[k] = (p[k - 1] * m) / k
  return p
}

/** Metrik untuk satu level stok S. */
export function evaluate(part, S) {
  const { unitCost = 0, holdingRate = 0.2, annualDemand: lambda = 0, leadTimeDays = 0, downtimeCostPerHour = 0 } = part
  const m = (lambda * leadTimeDays) / 365
  const n = Math.max(S + 1, Math.ceil(m + 10 * Math.sqrt(m + 1) + 10))
  const p = poissonPmf(m, n)
  let onHand = 0
  let cdfBelowS = 0
  for (let d = 0; d < S; d++) {
    onHand += (S - d) * p[d]
    cdfBelowS += p[d]
  }
  // E[(D−S)+] = E[D] − S + E[(S−D)+]
  const backorders = Math.max(0, m - S + onHand)
  const fillRate = S === 0 ? 0 : cdfBelowS
  let downtimeHours = backorders * HOURS_PER_YEAR
  // Opsi: jika stok habis, part darurat datang dalam `emergencyLeadDays` (lebih cepat dari L)
  if (part.emergencyLeadDays != null) downtimeHours = lambda * (1 - fillRate) * part.emergencyLeadDays * 24
  const holdingCost = onHand * unitCost * holdingRate
  const downtimeCost = downtimeHours * downtimeCostPerHour
  return {
    S,
    meanLeadDemand: m,
    onHand,
    fillRate,
    stockoutsPerYear: lambda * (1 - fillRate),
    backorders,
    downtimeHours,
    holdingCost,
    downtimeCost,
    totalCost: holdingCost + downtimeCost,
    capital: S * unitCost, // modal maksimum terikat (semua slot terisi)
  }
}

/** Kurva biaya S = 0..maxS + titik optimum. */
export function optimize(part, { maxS } = {}) {
  const m = ((part.annualDemand ?? 0) * (part.leadTimeDays ?? 0)) / 365
  const top = maxS ?? Math.max(4, Math.ceil(m + 4 * Math.sqrt(m) + 3))
  const curve = []
  for (let S = 0; S <= top; S++) curve.push(evaluate(part, S))
  const best = curve.reduce((a, b) => (b.totalCost < a.totalCost - 1e-9 ? b : a))
  const current = part.currentStock != null ? evaluate(part, part.currentStock) : null
  return {
    part,
    curve,
    best,
    reorderPoint: Math.max(0, best.S - 1),
    current,
    savingsPerYear: current ? current.totalCost - best.totalCost : null,
    capitalDelta: current ? best.capital - current.capital : null,
  }
}

/** Ringkasan portofolio: semua part, diurutkan dari penghematan terbesar. */
export function portfolio(parts, opts) {
  const rows = parts.map((p) => optimize(p, opts)).sort((a, b) => (b.savingsPerYear ?? 0) - (a.savingsPerYear ?? 0))
  const sum = (f) => rows.reduce((s, r) => s + (f(r) ?? 0), 0)
  return {
    rows,
    savingsPerYear: sum((r) => r.savingsPerYear),
    capitalDelta: sum((r) => r.capitalDelta),
    currentCapital: sum((r) => r.current?.capital),
    optimalCapital: sum((r) => r.best.capital),
  }
}

export function formatUSD(v, { compact = true, sign = false } = {}) {
  const s = new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', notation: compact ? 'compact' : 'standard', maximumFractionDigits: compact ? 1 : 0,
    signDisplay: sign ? 'exceptZero' : 'auto',
  })
  return s.format(v)
}
