// Tes logika murni — jalankan: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { compareStrategies, plan, scoreOrder } from './prioritize.js'

test('US$ at risk = P × (margin × MTTR + repair)', () => {
  const r = scoreOrder({ pFailure: 0.2, lostMarginPerHour: 1000, mttrHours: 10, repairCost: 5000, laborHours: 5 })
  assert.equal(r.usdAtRisk, 3000)
  assert.equal(r.retired, 3000)
  assert.equal(r.perHour, 600)
})

test('pAfter mengurangi risiko yang dipensiunkan', () => {
  const r = scoreOrder({ pFailure: 0.5, pAfter: 0.1, lostMarginPerHour: 0, mttrHours: 0, repairCost: 1000 })
  assert.equal(r.retired, 400)
})

const orders = [
  { id: 'big', pFailure: 1, repairCost: 1000, laborHours: 10, createdAt: 1 }, // 100/jam
  { id: 's1', pFailure: 1, repairCost: 600, laborHours: 4, createdAt: 2 }, // 150/jam
  { id: 's2', pFailure: 1, repairCost: 600, laborHours: 4, createdAt: 3 },
]

test('kapasitas: lewati yang tidak muat, isi yang muat', () => {
  const p = plan(orders, { capacityHours: 8, strategy: 'risk' })
  assert.equal(p.rows[0].id, 'big')
  assert.equal(p.rows[0].scheduled, false)
  assert.equal(p.retired, 1200)
})

test('optimal ≥ semua strategi greedy pada kapasitas terbatas', () => {
  const cmp = compareStrategies(orders, { capacityHours: 10 })
  const get = (k) => cmp.find((s) => s.key === k)
  assert.equal(get('fifo').retired, 1000)
  assert.equal(get('optimal').retired, 1200)
  assert.equal(get('optimal').vsBaseline, 200)
  for (const s of cmp) assert.ok(get('optimal').retired >= s.retired)
})

test('optimal mengalahkan greedy ratio pada kasus klasik', () => {
  // ratio memilih a (rasio tertinggi) lalu tidak muat b → optimal pilih b saja
  const os = [
    { id: 'a', pFailure: 1, repairCost: 60, laborHours: 1 },
    { id: 'b', pFailure: 1, repairCost: 100, laborHours: 2 },
  ]
  assert.equal(plan(os, { capacityHours: 2, strategy: 'ratio' }).retired, 60)
  assert.equal(plan(os, { capacityHours: 2, strategy: 'optimal' }).retired, 100)
})
