// Analyzer bawaan — logika murni (tanpa React), bisa dijalankan di browser maupun Node.
// Ganti dengan model sendiri lewat prop `analyzer` (lihat precomputed.js).

/** @typedef {import('./types.js').Point} Point */
/** @typedef {import('./types.js').Analysis} Analysis */

export const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x))

/**
 * Analisis satu deret sensor:
 * - baseline (mean, sd) dari bagian awal yang dianggap sehat
 * - smooth  : EWMA, "pandangan" model yang tidak tertipu noise
 * - score   : skor anomali 0..1 (0 = sehat, 1 = sudah di batas alarm)
 * - detectIndex : titik pertama AI yakin ada anomali (beberapa titik berturut-turut)
 * - crossIndex  : titik pertama nilai mentah melewati batas (= alarm konvensional)
 *
 * @param {Point[]} series
 * @param {{ threshold: number, warmup?: number, alpha?: number, detectZ?: number, hold?: number }} options
 * @returns {Analysis}
 */
export function analyzeSeries(series, { threshold, warmup = 0.3, alpha = 0.15, detectZ = 1.5, hold = 4 } = {}) {
  const n = series.length
  const w = clamp(Math.floor(n * warmup), 2, n)

  let mean = 0
  for (let i = 0; i < w; i++) mean += series[i].v
  mean /= w
  let sd = 0
  for (let i = 0; i < w; i++) sd += (series[i].v - mean) ** 2
  sd = Math.sqrt(sd / w) || 1e-6

  const smooth = new Array(n)
  const score = new Array(n)
  const span = threshold - mean || 1e-6
  let detectIndex = -1
  let crossIndex = -1
  let streak = 0

  for (let i = 0; i < n; i++) {
    const v = series[i].v
    smooth[i] = i === 0 ? v : alpha * v + (1 - alpha) * smooth[i - 1]
    score[i] = clamp((smooth[i] - mean) / span, 0, 1)

    if (i >= w && detectIndex < 0) {
      streak = (smooth[i] - mean) / sd > detectZ ? streak + 1 : 0
      if (streak >= hold) detectIndex = i
    }
    if (crossIndex < 0 && v >= threshold) crossIndex = i
  }

  return { mean, sd, smooth, score, detectIndex, crossIndex, threshold }
}
