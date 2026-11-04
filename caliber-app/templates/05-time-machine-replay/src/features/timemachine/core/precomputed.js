// Adapter untuk model AI di BACKEND (mis. FastAPI + scikit-learn / LSTM).
// Backend cukup mengirim skor & prediksinya; modul ini yang menggambar ceritanya.

import { clamp } from './analyze.js'

/** @typedef {import('./types.js').Analyzer} Analyzer */
/** @typedef {import('./types.js').Forecaster} Forecaster */

/**
 * Bungkus hasil model backend menjadi { analyzer, forecaster } yang bisa langsung
 * dipasang ke useTimeMachine / <TimeMachineReplay>. Semua waktu dalam satuan `t`
 * yang sama dengan series (pakai `toT` dari toSeries untuk mengonversi tanggal ISO).
 *
 * @param {object} model
 * @param {number} model.baseline                     nilai normal
 * @param {number[]} [model.score]                    0..1 sejajar series (default: dihitung dari trend)
 * @param {number[]} [model.trend]                    nilai halus sejajar series (default: nilai mentah)
 * @param {number | null} [model.detectAt]            waktu model mendeteksi anomali
 * @param {{ at: number, crossAt: number }[]} [model.forecasts]  prediksi yang dibuat pada waktu `at`
 * @param {number} [model.sd]
 * @returns {{ analyzer: Analyzer, forecaster: Forecaster }}
 */
export function fromPrecomputed(model) {
  const forecasts = [...(model.forecasts ?? [])].sort((a, b) => a.at - b.at)

  /** @type {Analyzer} */
  const analyzer = (series, { threshold }) => {
    const trend = model.trend ?? series.map((p) => p.v)
    const span = threshold - model.baseline || 1e-6
    const score = model.score ?? trend.map((v) => clamp((v - model.baseline) / span, 0, 1))
    const detectIndex = model.detectAt == null ? -1 : series.findIndex((p) => p.t >= model.detectAt)
    const crossIndex = series.findIndex((p) => p.v >= threshold)
    return { mean: model.baseline, sd: model.sd ?? 1, smooth: trend, score, detectIndex, crossIndex, threshold }
  }

  /** @type {Forecaster} */
  const forecaster = (series, analysis, index, { steps = 30 } = {}) => {
    const now = series[index].t
    let f = null
    for (const x of forecasts) if (x.at <= now) f = x // prediksi terbaru yang SUDAH dibuat
    if (!f || f.crossAt <= now) return null

    // Lengkung eksponensial dari tren sekarang ke batas pada crossAt
    const { mean, threshold } = analysis
    const v0 = analysis.smooth[index]
    const ratio = v0 > mean ? (threshold - mean) / (v0 - mean) : null
    const points = []
    for (let s = 0; s <= steps; s++) {
      const k = s / steps
      const v = ratio ? mean + (v0 - mean) * ratio ** k : v0 + (threshold - v0) * k
      points.push({ t: now + (f.crossAt - now) * k, v })
    }
    return { t: f.crossAt, remaining: f.crossAt - now, points }
  }

  return { analyzer, forecaster }
}
