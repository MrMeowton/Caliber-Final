// Test lapisan core (tanpa React, tanpa dependensi): npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  analyzeSeries,
  createTimeFormat,
  fill,
  forecastAt,
  fromPrecomputed,
  LABELS_EN,
  makeDegradationSeries,
  mergeLabels,
  stageAt,
  summarize,
  toSeries,
} from '../src/features/timemachine/core/index.js'

const series = makeDegradationSeries({ days: 56 })
const threshold = 7.1
const a = analyzeSeries(series, { threshold })

test('AI mendeteksi lebih awal dari alarm konvensional', () => {
  assert.ok(a.detectIndex > 0 && a.crossIndex > a.detectIndex)
  assert.ok(series[a.crossIndex].t - series[a.detectIndex].t >= 7)
  assert.ok(a.score.every((s) => s >= 0 && s <= 1))
})

test('prediksi tidak mengintip masa depan', () => {
  const i = a.detectIndex + 20
  const before = forecastAt(series, a, i)
  const tampered = series.map((p, k) => (k > i ? { ...p, v: p.v * 10 } : p))
  const after = forecastAt(tampered, analyzeSeries(tampered, { threshold }), i)
  assert.ok(before && after)
  assert.ok(Math.abs(before.t - after.t) < 1e-9)
})

test('prediksi makin akurat mendekati alarm', () => {
  const actual = series[a.crossIndex].t
  const early = forecastAt(series, a, a.detectIndex + 4)
  const late = forecastAt(series, a, a.crossIndex - 1)
  assert.ok(Math.abs(late.t - actual) < Math.abs(early.t - actual))
  assert.equal(forecastAt(series, a, a.detectIndex - 1), null)
})

test('stageAt & summarize', () => {
  assert.equal(stageAt(a, 0), 'normal')
  assert.equal(stageAt(a, a.detectIndex), 'warning')
  assert.equal(stageAt(a, a.crossIndex), 'alarm')
  const s = summarize(series, a, forecastAt)
  assert.equal(s.leadTime, s.alarmAt - s.detectAt)
  assert.ok(s.forecastError < 3)
})

test('toSeries: tanggal ISO → t (hari), terurut, toT konsisten', () => {
  const rows = [
    { ts: '2026-09-03T00:00:00Z', val: '3' },
    { ts: '2026-09-01T00:00:00Z', val: 1 },
    { ts: '2026-09-02T12:00:00Z', val: 2 },
    { ts: null, val: 9 },
    { ts: '2026-09-04T00:00:00Z', val: 'x' },
  ]
  const { series: s, origin, toT } = toSeries(rows, { time: 'ts', value: 'val', unit: 'day' })
  assert.deepEqual(s, [{ t: 0, v: 1 }, { t: 1.5, v: 2 }, { t: 2, v: 3 }])
  assert.equal(origin, Date.parse('2026-09-01T00:00:00Z'))
  assert.equal(toT('2026-09-02T00:00:00Z'), 1)
  assert.deepEqual(toSeries([{ t: 2, v: 1 }, { t: 1, v: 0 }]).series, [{ t: 1, v: 0 }, { t: 2, v: 1 }])
})

test('fromPrecomputed: model backend dipetakan ke analysis & forecast', () => {
  const { analyzer, forecaster } = fromPrecomputed({
    baseline: 2,
    detectAt: 3,
    forecasts: [{ at: 4, crossAt: 9 }, { at: 3, crossAt: 10 }],
  })
  const s = [0, 1, 2, 3, 4, 5].map((t) => ({ t, v: 2 + t * 0.5 }))
  const an = analyzer(s, { threshold: 4 })
  assert.equal(an.detectIndex, 3)
  assert.equal(an.crossIndex, 4)
  assert.equal(forecaster(s, an, 2), null) // belum ada prediksi dibuat
  assert.equal(forecaster(s, an, 3).t, 10) // prediksi yang dibuat pada t=3
  const f = forecaster(s, an, 4)
  assert.equal(f.t, 9)
  assert.ok(Math.abs(f.points.at(-1).v - 4) < 1e-9) // berakhir tepat di batas
})

test('label & format', () => {
  assert.equal(fill('Hai {a}, {b}', { a: 'Azka' }), 'Hai Azka, {b}')
  const en = mergeLabels(undefined, { story: { end: '!' } })
  assert.equal(en.story.end, '!')
  assert.ok(en.story.normal.includes('sehat'))
  assert.equal(createTimeFormat().formatTime(12.7), 'Hari 12')
  assert.equal(createTimeFormat({ labels: LABELS_EN }).formatDuration(0.3), 'less than 1 days')
  assert.equal(createTimeFormat({ unit: 'hour' }).formatDuration(5.2), '5 jam')
})
