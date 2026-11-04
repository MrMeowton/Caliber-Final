import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { analyzeSeries } from '../core/analyze.js'
import { forecastAt } from '../core/forecast.js'
import { createTimeFormat, formatValue } from '../core/format.js'
import { LABELS_ID, mergeLabels } from '../core/labels.js'
import { stageAt, summarize } from '../core/stage.js'
import { useReplay } from './useReplay.js'

/**
 * HOOK HEADLESS — seluruh otak mesin waktu tanpa UI. Pakai ini bila ingin membuat
 * tampilan sendiri, atau oper hasilnya ke <TimeMachineProvider value={tm}>.
 *
 * @param {object} config
 * @param {import('../core/types.js').Point[]} config.series   data historis (stabil / di-memo)
 * @param {number} config.threshold                           batas alarm konvensional
 * @param {string} [config.unit]                              satuan nilai, mis. 'mm/s'
 * @param {{ t: number, title: string, text?: string }[]} [config.events]
 * @param {import('../core/types.js').Analyzer} [config.analyzer]      default: analyzeSeries
 * @param {import('../core/types.js').Forecaster} [config.forecaster]  default: forecastAt
 * @param {object} [config.analysisOptions]
 * @param {object} [config.forecastOptions]
 * @param {'end' | 'start' | number} [config.start='end']
 * @param {number} [config.index]                              mode controlled
 * @param {(i: number, point: {t:number,v:number}) => void} [config.onIndexChange]
 * @param {number} [config.pointsPerSecond=24]
 * @param {'second'|'minute'|'hour'|'day'} [config.timeUnit='day']
 * @param {number | null} [config.origin]                      epoch ms t=0 → sumbu jadi tanggal
 * @param {string} [config.locale]
 * @param {(t: number) => string} [config.formatTime]
 * @param {(d: number) => string} [config.formatDuration]
 * @param {Partial<typeof LABELS_ID>} [config.labels]
 * @param {(stage: string, prev: string, point: object) => void} [config.onStageChange]
 * @param {(info: object) => void} [config.onDetect]   saat masuk tahap 'warning'
 * @param {(info: object) => void} [config.onAlarm]    saat masuk tahap 'alarm'
 */
export function useTimeMachine(config) {
  const {
    series,
    threshold,
    unit = '',
    events = [],
    analyzer = analyzeSeries,
    forecaster = forecastAt,
    analysisOptions,
    forecastOptions,
    start = 'end',
    index: controlledIndex,
    pointsPerSecond = 24,
    timeUnit = 'day',
    origin = null,
    locale,
    labels: labelsOverride,
  } = config

  const analysis = useMemo(
    () => analyzer(series, { threshold, ...analysisOptions }),
    [analyzer, series, threshold, analysisOptions],
  )
  const labels = useMemo(() => mergeLabels(LABELS_ID, labelsOverride), [labelsOverride])
  const fmt = useMemo(() => {
    const base = createTimeFormat({ origin, unit: timeUnit, locale, labels })
    return {
      time: config.formatTime ?? base.formatTime,
      duration: config.formatDuration ?? base.formatDuration,
      value: (v) => formatValue(v, unit),
    }
  }, [origin, timeUnit, locale, labels, unit, config.formatTime, config.formatDuration])

  // Callback pengguna disimpan di ref → tidak perlu di-memo oleh pemakai
  const cb = useRef(config)
  useLayoutEffect(() => {
    cb.current = config
  })

  const startIndex = start === 'end' ? series.length - 1 : start === 'start' ? 0 : start
  const player = useReplay(series.length, {
    start: startIndex,
    pointsPerSecond,
    index: controlledIndex,
    onIndexChange: (i) => cb.current.onIndexChange?.(i, series[i]),
  })
  const { index } = player

  const stage = stageAt(analysis, index)
  const forecast = useMemo(
    () => (stage === 'warning' ? forecaster(series, analysis, index, forecastOptions) : null),
    [stage, forecaster, series, analysis, index, forecastOptions],
  )
  const summary = useMemo(
    () => summarize(series, analysis, forecaster, forecastOptions),
    [series, analysis, forecaster, forecastOptions],
  )

  // Event transisi tahap (tidak dipicu saat mount)
  const prevStage = useRef(stage)
  useEffect(() => {
    const prev = prevStage.current
    if (prev === stage) return
    prevStage.current = stage
    const info = { stage, prev, index, point: series[index], time: fmt.time(series[index].t), forecast, summary }
    const c = cb.current
    c.onStageChange?.(stage, prev, info)
    if (stage === 'warning') c.onDetect?.(info)
    if (stage === 'alarm') c.onAlarm?.(info)
  }, [stage, index, series, forecast, summary, fmt])

  return {
    // data
    series,
    analysis,
    threshold,
    unit,
    events,
    labels,
    fmt,
    summary,
    // keadaan pada waktu yang dilihat
    index,
    point: series[index],
    stage,
    score: analysis.score[index] ?? 0,
    trend: analysis.smooth[index] ?? series[index]?.v,
    forecast,
    // kendali
    player,
    seek: player.setIndex,
  }
}
