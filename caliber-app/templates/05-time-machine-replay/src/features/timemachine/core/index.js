// CORE — tanpa React. Aman diimpor di Node / backend JS:
//   import { analyzeSeries, forecastAt } from './features/timemachine/core/index.js'
export { analyzeSeries, clamp } from './analyze.js'
export { forecastAt } from './forecast.js'
export { fromPrecomputed } from './precomputed.js'
export { stageAt, summarize } from './stage.js'
export { toSeries, makeDegradationSeries, UNIT_MS } from './series.js'
export { createTimeFormat, formatValue, scoreColor } from './format.js'
export { LABELS_ID, LABELS_EN, mergeLabels, fill } from './labels.js'
