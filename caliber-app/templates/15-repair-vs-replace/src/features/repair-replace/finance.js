// Logika murni Repair vs Replace — tanpa React.
//
// Dua opsi untuk aset yang menua, dihitung sebagai arus kas BIAYA tahunan (positif = biaya):
//   Repair  : overhaul sekarang, lalu O&M + kegagalan (lost margin) + energi yang makin naik
//   Replace : capex − nilai jual aset lama + downtime instalasi, lalu biaya tahunan yang lebih rendah,
//             dikurangi nilai sisa aset baru di akhir horizon
// Selisih (repair − replace) = penghematan karena mengganti → NPV, IRR, payback, EAC.

/** Biaya tahunan tahun ke-t (t ≥ 1) untuk satu opsi. */
export function annualCost(o, t, margin) {
  const g = (rate) => (1 + (rate ?? 0)) ** (t - 1)
  const opex = (o.opex ?? 0) * g(o.opexGrowth)
  const failures = (o.failuresPerYear ?? 0) * g(o.failureGrowth)
  const downtime = failures * (o.downtimeHoursPerFailure ?? 0) * margin
  const energy = (o.energyCost ?? 0) * g(o.energyGrowth)
  return { opex, failures, downtime, energy, total: opex + downtime + energy }
}

/** Arus kas biaya per tahun 0..H untuk satu opsi. */
export function costStream(o, { horizonYears, lostMarginPerHour }) {
  const out = []
  const t0 = (o.upfront ?? 0) - (o.salvageNow ?? 0) + (o.installDowntimeHours ?? 0) * lostMarginPerHour
  out.push({ t: 0, total: t0, upfront: t0 })
  for (let t = 1; t <= horizonYears; t++) out.push({ t, ...annualCost(o, t, lostMarginPerHour) })
  // nilai sisa garis lurus di akhir horizon (mengurangi biaya)
  if (o.life && o.upfront) {
    const residual = Math.max(0, o.upfront * (1 - horizonYears / o.life))
    out[horizonYears].residual = residual
    out[horizonYears].total -= residual
  }
  return out
}

export const discount = (r, t) => 1 / (1 + r) ** t
export const npv = (r, flows) => flows.reduce((s, f, t) => s + f * discount(r, t), 0)

/** IRR dengan bisection (null jika tidak ada perubahan tanda). */
export function irr(flows, lo = -0.99, hi = 10) {
  let flo = npv(lo, flows)
  const fhi = npv(hi, flows)
  if (flo * fhi > 0) return null
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2
    const f = npv(mid, flows)
    if (Math.abs(f) < 1e-7) return mid
    if (f * flo < 0) hi = mid
    else {
      lo = mid
      flo = f
    }
  }
  return (lo + hi) / 2
}

/** Tahun (interpolasi) ketika kumulatif ≥ 0. null jika tidak tercapai dalam horizon. */
export function payback(flows, r = 0) {
  let cum = 0
  for (let t = 0; t < flows.length; t++) {
    const v = flows[t] * (r ? discount(r, t) : 1)
    if (cum < 0 && cum + v >= 0) return t - 1 + -cum / v
    cum += v
    if (t === 0 && cum >= 0) return 0
  }
  return null
}

/** Capital recovery factor → Equivalent Annual Cost. */
export const crf = (r, n) => (r === 0 ? 1 / n : (r * (1 + r) ** n) / ((1 + r) ** n - 1))

/**
 * Analisis lengkap.
 * input: { repair, replace, discountRate, horizonYears, lostMarginPerHour }
 */
export function analyze({ repair, replace, discountRate: r = 0.1, horizonYears: H = 10, lostMarginPerHour = 0 }) {
  const ctx = { horizonYears: H, lostMarginPerHour }
  const keep = costStream(repair, ctx)
  const swap = costStream(replace, ctx)
  const savings = keep.map((k, t) => k.total - swap[t].total) // + = replace lebih hemat
  const pvKeep = npv(r, keep.map((x) => x.total))
  const pvSwap = npv(r, swap.map((x) => x.total))
  const incNpv = pvKeep - pvSwap
  // NPV linear terhadap capex: koefisien −1 + (1 − H/life)·DF_H (karena nilai sisa ikut capex)
  const resFrac = replace.life ? Math.max(0, 1 - H / replace.life) : 0
  const capexCoef = 1 - resFrac * discount(r, H)
  let cumKeep = 0
  let cumSwap = 0
  const years = keep.map((k, t) => {
    cumKeep += k.total * discount(r, t)
    cumSwap += swap[t].total * discount(r, t)
    return { t, keep: k, swap: swap[t], saving: savings[t], cumKeep, cumSwap }
  })
  return {
    years,
    savings,
    pvKeep,
    pvSwap,
    npv: incNpv,
    irr: irr(savings),
    payback: payback(savings),
    discountedPayback: payback(savings, r),
    eacKeep: pvKeep * crf(r, H),
    eacSwap: pvSwap * crf(r, H),
    breakEvenCapex: (replace.upfront ?? 0) + incNpv / capexCoef,
    verdict: incNpv > 0 ? 'replace' : 'repair',
  }
}

export function formatUSD(v, { compact = true, sign = false } = {}) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', notation: compact ? 'compact' : 'standard', maximumFractionDigits: compact ? 1 : 0,
    signDisplay: sign ? 'exceptZero' : 'auto',
  }).format(v)
}
