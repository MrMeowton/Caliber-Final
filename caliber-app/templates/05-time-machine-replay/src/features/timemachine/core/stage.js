// Turunan dari analysis: tahap cerita & ringkasan pembuktian.

/** @typedef {import('./types.js').Point} Point */
/** @typedef {import('./types.js').Analysis} Analysis */
/** @typedef {import('./types.js').Forecaster} Forecaster */
/** @typedef {import('./types.js').Stage} Stage */

/**
 * Tahap pada index: normal → warning (AI sudah tahu) → alarm (semua orang tahu).
 * @param {Analysis} analysis
 * @param {number} index
 * @returns {Stage}
 */
export function stageAt({ detectIndex, crossIndex }, index) {
  if (crossIndex >= 0 && index >= crossIndex) return 'alarm'
  if (detectIndex >= 0 && index >= detectIndex) return 'warning'
  return 'normal'
}

/**
 * Angka "pembuktian" untuk pitch: berapa lama AI lebih awal & seberapa tepat prediksinya.
 * @param {Point[]} series
 * @param {Analysis} analysis
 * @param {Forecaster} forecaster
 * @param {object} [forecastOptions]
 */
export function summarize(series, analysis, forecaster, forecastOptions) {
  const { detectIndex, crossIndex } = analysis
  const detectAt = detectIndex >= 0 ? series[detectIndex].t : null
  const alarmAt = crossIndex >= 0 ? series[crossIndex].t : null
  const leadTime = detectAt != null && alarmAt != null && alarmAt > detectAt ? alarmAt - detectAt : null
  const lastForecast = crossIndex > 0 ? forecaster(series, analysis, crossIndex - 1, forecastOptions) : null
  const forecastError = lastForecast && alarmAt != null ? Math.abs(lastForecast.t - alarmAt) : null
  return { detectAt, alarmAt, leadTime, lastForecast, forecastError }
}
