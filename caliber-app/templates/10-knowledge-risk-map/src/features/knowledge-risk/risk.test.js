// Tes logika murni — jalankan: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { assessAll, assessItem, personImpact, summarize } from './risk.js'

const people = [
  { id: 'budi', retireInMonths: 6 },
  { id: 'sari' },
  { id: 'andi' },
  { id: 'rina' },
]
const item = { id: 'x', criticality: 5, valueAtRisk: 1000, holders: { budi: 3, sari: 2, andi: 1 } }

test('bus factor menghitung orang ≥ minLevel yang tidak pergi', () => {
  const r = assessItem(item, people, { horizonMonths: 3 })
  assert.equal(r.busFactor, 2)
  assert.equal(r.status, 'thin')
})

test('pensiun dalam horizon mengurangi bus factor', () => {
  const r = assessItem(item, people, { horizonMonths: 12 })
  assert.deepEqual(r.lost, ['budi'])
  assert.equal(r.busFactor, 1)
  assert.equal(r.status, 'single')
  assert.equal(r.usdAtRisk, 600)
  assert.deepEqual(r.successors, ['andi'])
})

test('what-if absent → yatim, eksposur penuh', () => {
  const r = assessItem(item, people, { horizonMonths: 12, absent: ['sari'] })
  assert.equal(r.status, 'orphan')
  assert.equal(r.riskScore, 100)
  assert.equal(r.usdAtRisk, 1000)
})

test('urutan & ringkasan', () => {
  const items = [item, { id: 'y', criticality: 1, valueAtRisk: 10, holders: { sari: 2, andi: 2, rina: 3 } }]
  const rows = assessAll(items, people, { horizonMonths: 0 })
  assert.equal(rows[0].id, 'x')
  const s = summarize(rows)
  assert.equal(s.total, 2)
  assert.equal(s.ok, 1)
})

test('personImpact: orang yang tak tergantikan di urutan teratas', () => {
  const rows = personImpact([item], people, { horizonMonths: 0 })
  // budi & sari sama-sama 1 dari 2 → kepergian masing-masing menaikkan risiko 600 − 250
  assert.equal(rows[0].usdIfLeaves, 350)
  assert.equal(rows.find((p) => p.id === 'rina').usdIfLeaves, 0)
})
