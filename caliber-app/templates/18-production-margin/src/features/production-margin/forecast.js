// Logika murni Production Forecast → Margin — tanpa React.
//
// 1. Forecast produksi per produk dengan Holt linear (level + trend, opsional damped),
//    interval prediksi P10/P90 dari galat one-step.
// 2. Dikali spread (harga − biaya variabel per ton) → margin forecast.
// 3. Dibanding rencana (plan) → margin at risk:
//      ekspektasi  = Σ max(0, plan − P50) × spread
//      downside    = Σ max(0, plan − P10) × spread     (skenario 1-dari-10 terburuk)

export const Z = { 0.8: 1.2816, 0.9: 1.6449, 0.95: 1.96 }

/** Holt linear (damped). Kembalikan { level, trend, sigma, fitted }. */
export function holt(series, { alpha = 0.4, beta = 0.1, phi = 0.95 } = {}) {
  if (series.length < 2) return { level: series[0] ?? 0, trend: 0, sigma: 0, fitted: [...series], alpha, beta, phi }
  let level = series[0]
  let trend = series[1] - series[0]
  const fitted = [series[0]]
  const errs = []
  for (let t = 1; t < series.length; t++) {
    const f = level + phi * trend
    fitted.push(f)
    errs.push(series[t] - f)
    const prev = level
    level = alpha * series[t] + (1 - alpha) * (prev + phi * trend)
    trend = beta * (level - prev) + (1 - beta) * phi * trend
  }
  const sigma = Math.sqrt(errs.reduce((s, e) => s + e * e, 0) / Math.max(1, errs.length - 2))
  return { level, trend, sigma, fitted, alpha, beta, phi }
}

/**
 * Forecast h langkah: [{ h, p50, p10, p90 }]. `capacity` memotong ke kapasitas terpasang.
 * Varians interval Holt: σ² · (1 + Σ_{j<h} (α(1 + j·β))²)  (pendekatan, tanpa damping pada varians)
 */
export function forecast(series, horizon, { capacity = Infinity, coverage = 0.8, ...params } = {}) {
  const m = holt(series, params)
  const z = Z[coverage] ?? 1.2816
  const out = []
  let damp = 0
  let varSum = 1
  for (let h = 1; h <= horizon; h++) {
    damp += m.phi ** h
    if (h > 1) varSum += (m.alpha * (1 + (h - 1) * m.beta)) ** 2
    const mean = m.level + damp * m.trend
    const sd = m.sigma * Math.sqrt(varSum)
    const cap = (v) => Math.max(0, Math.min(capacity, v))
    out.push({ h, p50: cap(mean), p10: cap(mean - z * sd), p90: cap(mean + z * sd) })
  }
  return { model: m, points: out }
}

const at = (v, i) => (Array.isArray(v) ? (v[i] ?? v.at(-1)) : v)

/**
 * product: { id, name, history: [t/periode], capacity?, price, variableCost | spread, plan: angka | [angka] }
 * opsi: { horizon, coverage, spreadShock (fraksi, mis. −0.2) }
 */
export function productMargin(product, { horizon = 6, coverage = 0.8, spreadShock = 0, ...params } = {}) {
  const f = forecast(product.history, horizon, { capacity: product.capacity, coverage, ...params })
  const baseSpread = product.spread ?? (product.price ?? 0) - (product.variableCost ?? 0)
  const months = f.points.map((p, i) => {
    const spread = at(baseSpread, i) * (1 + spreadShock)
    const plan = at(product.plan ?? p.p50, i)
    return {
      ...p,
      spread,
      plan,
      m50: p.p50 * spread,
      m10: p.p10 * spread,
      m90: p.p90 * spread,
      mPlan: plan * spread,
      atRisk: Math.max(0, plan - p.p50) * spread,
      downside: Math.max(0, plan - p.p10) * spread,
    }
  })
  const sum = (k) => months.reduce((s, x) => s + x[k], 0)
  return {
    ...product,
    model: f.model,
    months,
    volume50: sum('p50'),
    volumePlan: sum('plan'),
    margin50: sum('m50'),
    margin10: sum('m10'),
    margin90: sum('m90'),
    marginPlan: sum('mPlan'),
    atRisk: sum('atRisk'),
    downside: sum('downside'),
    avgSpread: months.length ? sum('m50') / Math.max(1e-9, sum('p50')) : 0,
  }
}

/**
 * Agregat semua produk. P10/P90 total: diasumsikan korelasi sempurna antar produk (konservatif,
 * mis. karena semua bergantung pada cracker yang sama).
 */
export function portfolioMargin(products, opts = {}) {
  const rows = products.map((p) => productMargin(p, opts))
  const H = opts.horizon ?? 6
  const months = Array.from({ length: H }, (_, i) => {
    const pick = (k) => rows.reduce((s, r) => s + r.months[i][k], 0)
    return { h: i + 1, m50: pick('m50'), m10: pick('m10'), m90: pick('m90'), mPlan: pick('mPlan'), atRisk: pick('atRisk') }
  })
  const histLen = Math.min(...rows.map((r) => r.history.length))
  const history = Array.from({ length: histLen }, (_, i) =>
    rows.reduce((s, r) => s + r.history[r.history.length - histLen + i] * at(r.spread ?? (r.price ?? 0) - (r.variableCost ?? 0), 0), 0),
  )
  const sum = (k) => rows.reduce((s, r) => s + r[k], 0)
  return {
    rows: rows.sort((a, b) => b.atRisk - a.atRisk),
    months,
    history,
    margin50: sum('margin50'),
    margin10: sum('margin10'),
    margin90: sum('margin90'),
    marginPlan: sum('marginPlan'),
    atRisk: sum('atRisk'),
    downside: sum('downside'),
  }
}

export function formatUSD(v, { compact = true, sign = false } = {}) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', notation: compact ? 'compact' : 'standard', maximumFractionDigits: compact ? 1 : 0,
    signDisplay: sign ? 'exceptZero' : 'auto',
  }).format(v)
}

export const formatKt = (t) => `${(t / 1000).toFixed(t >= 100_000 ? 0 : 1)}k t`

/** Label bulan dari 'YYYY-MM' + offset. */
export const monthLabel = (start, i, locale = 'id-ID') => {
  const [y, m] = start.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1 + i, 1)).toLocaleDateString(locale, { month: 'short', year: '2-digit', timeZone: 'UTC' })
}
