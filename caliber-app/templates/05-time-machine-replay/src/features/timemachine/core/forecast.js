// Forecaster bawaan: pertumbuhan eksponensial, HANYA memakai data sampai `index`.

/** @typedef {import('./types.js').Point} Point */
/** @typedef {import('./types.js').Analysis} Analysis */
/** @typedef {import('./types.js').Forecast} Forecast */

/**
 * Prediksi yang dibuat AI *pada saat* index. Regresi linear pada log(smooth − baseline)
 * di jendela terakhir, lalu diekstrapolasi sampai menyentuh batas.
 * Return null bila belum ada anomali / tren tidak naik.
 *
 * @param {Point[]} series
 * @param {Analysis} analysis
 * @param {number} index
 * @param {{ window?: number, steps?: number, maxAhead?: number }} [options]
 * @returns {Forecast | null}
 */
export function forecastAt(series, analysis, index, { window = 28, steps = 40, maxAhead = 3 } = {}) {
  const { mean, smooth, threshold, detectIndex } = analysis
  if (detectIndex < 0 || index < detectIndex) return null

  const from = Math.max(0, index - window + 1)
  const eps = (analysis.sd || 1) * 0.05
  let sx = 0, sy = 0, sxx = 0, sxy = 0, k = 0
  for (let i = from; i <= index; i++) {
    const x = series[i].t
    const y = Math.log(Math.max(smooth[i] - mean, eps))
    sx += x; sy += y; sxx += x * x; sxy += x * y; k++
  }
  const den = k * sxx - sx * sx
  if (k < 3 || den === 0) return null
  const m = (k * sxy - sx * sy) / den
  const b = (sy - m * sx) / k
  if (m <= 0) return null

  const tNow = series[index].t
  const tCross = (Math.log(threshold - mean) - b) / m
  const domain = series[series.length - 1].t - series[0].t
  if (!(tCross > tNow) || tCross - tNow > domain * maxAhead) return null

  // Lengkung proyeksi, disambung mulus dari nilai smooth saat ini
  const offset = smooth[index] - (mean + Math.exp(b + m * tNow))
  const points = []
  for (let s = 0; s <= steps; s++) {
    const t = tNow + ((tCross - tNow) * s) / steps
    const fade = 1 - s / steps // offset hilang perlahan agar ujungnya tepat di batas
    points.push({ t, v: mean + Math.exp(b + m * t) + offset * fade })
  }
  return { t: tCross, remaining: tCross - tNow, points }
}
