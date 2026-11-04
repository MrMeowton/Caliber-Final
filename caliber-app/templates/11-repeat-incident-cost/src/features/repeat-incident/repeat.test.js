// Tes logika murni — jalankan: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { classify, cumulative, groupBySignature, incidentCost, summarize } from './repeat.js'

const base = { asset: 'P-101', failureMode: 'Seal bocor', downtimeHours: 10, lostMarginPerHour: 100, repairCost: 500 }
const incidents = [
  { ...base, id: 'a', date: '2026-01-01', rca: { date: '2026-01-20' } },
  { ...base, id: 'b', date: '2026-01-10' }, // sebelum RCA selesai
  { ...base, id: 'c', date: '2026-03-01' }, // setelah RCA
  { ...base, id: 'd', date: '2026-02-01', asset: 'K-201' },
]

test('biaya = downtime × margin + repair', () => {
  assert.equal(incidentCost(base), 1500)
})

test('klasifikasi first / repeatNoRca / repeatAfterRca', () => {
  const c = classify(incidents)
  const kind = Object.fromEntries(c.map((i) => [i.id, i.kind]))
  assert.deepEqual(kind, { a: 'first', b: 'repeatNoRca', c: 'repeatAfterRca', d: 'first' })
  assert.equal(c.find((i) => i.id === 'c').daysSinceRca, 40)
})

test('until (replay) mengabaikan insiden & RCA sesudahnya', () => {
  const c = classify(incidents, { until: '2026-01-15' })
  assert.equal(c.length, 2)
  assert.equal(summarize(c).repeatAfterRca, 0)
})

test('summarize & group', () => {
  const c = classify(incidents)
  const s = summarize(c, { effectiveness: 0.5 })
  assert.equal(s.repeatCost, 1500)
  assert.equal(s.avoidable, 750)
  assert.equal(s.share, 0.25)
  const g = groupBySignature(c)
  assert.equal(g[0].key, 'P-101|Seal bocor')
  assert.equal(g[0].repeatsAfterRca, 1)
  assert.equal(cumulative(c).at(-1).repeat, 1500)
})
