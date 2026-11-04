// Tes logika murni — jalankan: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildMacc, crf, evaluateOpp } from './macc.js'

const close = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`)

test('MAC = (capex × CRF + Δopex − saving) / abatement', () => {
  const r = evaluateOpp({ capex: 1000, life: 10, opexDelta: 10, annualSavings: 50, abatement: 4 }, { discountRate: 0.1 })
  close(r.mac, (1000 * crf(0.1, 10) + 10 - 50) / 4)
})

test('energySaved → penghematan & abatement dari carrier', () => {
  const carriers = { gas: { price: 8, ef: 0.056 } }
  const r = evaluateOpp({ capex: 0, life: 5, energySaved: { gas: 1000 } }, { carriers })
  close(r.savings, 8000)
  close(r.abatement, 56)
  assert.ok(r.mac < 0)
})

const opps = [
  { id: 'a', capex: 100, life: 1, abatement: 10, annualSavings: 200 }, // MAC negatif
  { id: 'b', capex: 500, life: 1, abatement: 10 }, // MAC 55 (r=0.1, life 1 → CRF 1.1)
  { id: 'c', capex: 100, life: 1, abatement: 10 }, // MAC 11
]

test('urut MAC naik, sumbu x kumulatif', () => {
  const m = buildMacc(opps, { discountRate: 0.1 })
  assert.deepEqual(m.rows.map((r) => r.id), ['a', 'c', 'b'])
  assert.equal(m.rows[2].x0, 20)
  assert.equal(m.totalAbatement, 30)
})

test('anggaran capex, target, dan hanya-ekonomis', () => {
  assert.equal(buildMacc(opps, { capexBudget: 250 }).selectedAbatement, 20)
  assert.equal(buildMacc(opps, { target: 10 }).selectedAbatement, 10)
  const econ = buildMacc(opps, { carbonPrice: 20, onlyEconomic: true })
  assert.deepEqual(econ.rows.filter((r) => r.selected).map((r) => r.id), ['a', 'c'])
  assert.equal(econ.economicAbatement, 20)
})

test('proyek yang menambah emisi dikeluarkan dari kurva', () => {
  const m = buildMacc([...opps, { id: 'x', capex: 0, life: 1, abatement: -5 }])
  assert.equal(m.rows.length, 3)
  assert.deepEqual(m.excluded.map((o) => o.id), ['x'])
})
