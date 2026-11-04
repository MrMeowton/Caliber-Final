// Logika murni Onboarding Time-to-Competence — tanpa React.
//
// Engineer baru dianggap KOMPETEN pada hari pertama porsi skill wajib (berbobot) yang sudah
// tersertifikasi ≥ threshold. Engineer yang belum mencapai itu per `asOf` = data tersensor
// (masih berjalan) → kurva memakai estimator Kaplan–Meier agar rekrutan baru tidak menipu rata-rata.

export const DAY = 86_400_000
const toMs = (d) => (d instanceof Date ? d.getTime() : typeof d === 'string' ? Date.parse(d) : d)

/** Hari ke-berapa engineer mencapai kompeten (null jika belum) + hari pengamatan. */
export function timeToCompetence(eng, skills, { threshold = 0.8, asOf } = {}) {
  const totalW = skills.reduce((s, k) => s + (k.weight ?? 1), 0)
  const observed = Math.max(0, Math.floor((toMs(asOf ?? Date.now()) - toMs(eng.hiredAt)) / DAY))
  const events = skills
    .map((k) => ({ day: eng.achieved?.[k.id], w: k.weight ?? 1 }))
    .filter((e) => e.day != null && e.day <= observed)
    .sort((a, b) => a.day - b.day)
  let acc = 0
  for (const e of events) {
    acc += e.w
    if (acc / totalW >= threshold - 1e-9) return { day: e.day, observed, reached: true, progress: acc / totalW }
  }
  return { day: null, observed, reached: false, progress: acc / totalW }
}

/**
 * Kurva Kaplan–Meier "proporsi sudah kompeten" per hari: [{ day, pct }] (step function).
 * records: [{ day|null, observed, reached }]
 */
export function competenceCurve(records) {
  const times = [...new Set(records.filter((r) => r.reached).map((r) => r.day))].sort((a, b) => a - b)
  let surv = 1
  const out = [{ day: 0, pct: 0 }]
  for (const t of times) {
    const atRisk = records.filter((r) => (r.reached ? r.day : r.observed) >= t).length
    const events = records.filter((r) => r.reached && r.day === t).length
    if (atRisk > 0) surv *= 1 - events / atRisk
    out.push({ day: t, pct: 1 - surv })
  }
  return out
}

/** Hari ketika kurva pertama kali mencapai `q` (0.5 = median). null jika tidak tercapai. */
export function quantileDay(curve, q = 0.5) {
  const hit = curve.find((p) => p.pct >= q - 1e-9)
  return hit ? hit.day : null
}

/**
 * Ringkasan per cohort + perbandingan baseline vs compare.
 * opsi: { threshold, asOf, baseline='before', compare='after', valuePerDay (US$), hiresPerYear }
 */
export function analyze(engineers, skills, opts = {}) {
  const { baseline = 'before', compare = 'after', valuePerDay = 0, hiresPerYear = 0 } = opts
  const cohorts = {}
  for (const e of engineers) {
    const rec = { ...e, ...timeToCompetence(e, skills, opts) }
    ;(cohorts[e.cohort] ??= []).push(rec)
  }
  const stats = Object.fromEntries(
    Object.entries(cohorts).map(([k, recs]) => {
      const curve = competenceCurve(recs)
      return [k, {
        key: k, n: recs.length, reached: recs.filter((r) => r.reached).length, records: recs, curve,
        median: quantileDay(curve, 0.5), p80: quantileDay(curve, 0.8),
      }]
    }),
  )
  const b = stats[baseline]?.median
  const c = stats[compare]?.median
  const daysSaved = b != null && c != null ? b - c : null
  return {
    cohorts: stats,
    daysSaved,
    reduction: daysSaved != null && b ? daysSaved / b : null,
    valuePerHire: daysSaved != null ? daysSaved * valuePerDay : null,
    valuePerYear: daysSaved != null ? daysSaved * valuePerDay * hiresPerYear : null,
    skills: skillBreakdown(engineers, skills, baseline, compare),
  }
}

/** Rata-rata hari mencapai tiap skill (hanya yang sudah mencapai) per cohort. */
export function skillBreakdown(engineers, skills, baseline = 'before', compare = 'after') {
  const avg = (cohort, id) => {
    const xs = engineers.filter((e) => e.cohort === cohort && e.achieved?.[id] != null).map((e) => e.achieved[id])
    return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null
  }
  return skills
    .map((k) => {
      const before = avg(baseline, k.id)
      const after = avg(compare, k.id)
      return { ...k, before, after, delta: before != null && after != null ? before - after : null }
    })
    .sort((a, b) => (b.delta ?? -Infinity) - (a.delta ?? -Infinity))
}

export function formatUSD(v) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(v)
}
