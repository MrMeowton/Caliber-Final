// Tes logika murni — jalankan: npm test  (node --test, tanpa dependensi)
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { DAY, axisTicks, computeRace, computeRaces, summarize } from './race.js'

const now = Date.UTC(2026, 10, 3)

test('part tiba setelah aset gagal → late, waitDays = selisihnya', () => {
  const r = computeRace({ id: 'a', failure: { p50: 10 }, part: { leadTimeDays: 14 } }, { now })
  assert.equal(r.status, 'late')
  assert.equal(r.waitDays, 4)
  assert.equal(r.mode, 'not-ordered')
})

test('part tiba di dalam jendela P10 → tight', () => {
  const r = computeRace({ id: 'b', failure: { p50: 20, p10: 12 }, part: { leadTimeDays: 14 } }, { now })
  assert.equal(r.status, 'tight')
  assert.equal(r.expediteDays, 5) // butuh tiba ≥3 hari sebelum P10 (hari 9) → pangkas 5 hari
})

test('part jauh lebih cepat → safe', () => {
  const r = computeRace({ id: 'c', failure: { p50: 60, p10: 45 }, part: { leadTimeDays: 7 } }, { now })
  assert.equal(r.status, 'safe')
  assert.equal(r.expediteDays, 0)
})

test('inStock → tiba hari ini', () => {
  const r = computeRace({ id: 'd', failure: { p50: 2 }, part: { inStock: true, leadTimeDays: 30 } }, { now })
  assert.equal(r.arriveAt, now)
  assert.notEqual(r.status, 'late')
})

test('eta mengalahkan lead time; tanggal ISO diterima', () => {
  const r = computeRace(
    { id: 'e', failure: { p50: '2026-11-20T00:00:00Z' }, part: { leadTimeDays: 3, eta: '2026-11-25T00:00:00Z' } },
    { now },
  )
  assert.equal(r.status, 'late')
  assert.equal(r.waitDays, 5)
})

test('orderedAt + lead time; eksposur biaya', () => {
  const r = computeRace(
    { id: 'f', failure: { p50: 10 }, part: { orderedAt: -5, leadTimeDays: 20 }, downtimeCostPerDay: 1000 },
    { now },
  )
  assert.equal(r.arriveAt, now + 15 * DAY)
  assert.equal(r.exposure, 5000)
})

test('urutan & ringkasan', () => {
  const races = computeRaces(
    [
      { id: 's', failure: { p50: 90 }, part: { leadTimeDays: 5 } },
      { id: 'l', failure: { p50: 5 }, part: { leadTimeDays: 30 } },
    ],
    { now },
  )
  assert.deepEqual(races.map((r) => r.id), ['l', 's'])
  const s = summarize(races)
  assert.equal(s.late, 1)
  assert.equal(s.safe, 1)
})

test('failure.p50 wajib', () => {
  assert.throws(() => computeRace({ id: 'x', part: {} }, { now }))
})

test('axisTicks menghasilkan titik di dalam rentang', () => {
  const t = axisTicks([now, now + 60 * DAY])
  assert.ok(t.length > 2 && t.length <= 11)
  assert.ok(t.every((x) => x >= now && x <= now + 60 * DAY))
})
