// Tes logika murni — jalankan: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { evaluate, optimize, poissonPmf, portfolio } from './economics.js'

const close = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`)

test('Poisson pmf menjumlah ≈ 1', () => {
  close(poissonPmf(3, 60).reduce((s, x) => s + x, 0), 1)
})

const part = { unitCost: 100_000, holdingRate: 0.2, annualDemand: 2, leadTimeDays: 182.5, downtimeCostPerHour: 1_000 }

test('S = 0: semua permintaan menunggu → E[BO] = m', () => {
  const r = evaluate(part, 0)
  close(r.meanLeadDemand, 1)
  close(r.backorders, 1)
  assert.equal(r.fillRate, 0)
  assert.equal(r.holdingCost, 0)
})

test('S = 1: fill rate = P(D=0) = e^-1, on-hand = P(D=0)', () => {
  const r = evaluate(part, 1)
  close(r.fillRate, Math.exp(-1))
  close(r.onHand, Math.exp(-1))
  close(r.backorders, Math.exp(-1)) // m − S + onHand = 1 − 1 + e^-1
})

test('optimum adalah minimum kurva; part mahal & downtime murah → stok kecil', () => {
  const o = optimize(part)
  for (const p of o.curve) assert.ok(o.best.totalCost <= p.totalCost + 1e-9)
  const cheapDowntime = optimize({ ...part, downtimeCostPerHour: 1 })
  assert.equal(cheapDowntime.best.S, 0)
  const pricey = optimize({ ...part, downtimeCostPerHour: 50_000 })
  assert.ok(pricey.best.S > o.best.S)
})

test('portofolio: penghematan vs stok saat ini tidak negatif', () => {
  const pf = portfolio([{ ...part, currentStock: 6 }, { ...part, currentStock: 0 }])
  for (const r of pf.rows) assert.ok(r.savingsPerYear >= -1e-9)
})
