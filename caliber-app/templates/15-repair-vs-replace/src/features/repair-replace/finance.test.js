// Tes logika murni — jalankan: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { analyze, crf, irr, npv, payback } from './finance.js'

const close = (a, b, eps = 1e-4) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`)

test('NPV & IRR dasar', () => {
  const f = [-100, 60, 60]
  close(npv(0.1, f), -100 + 60 / 1.1 + 60 / 1.21)
  close(npv(irr(f), f), 0)
  close(irr(f), 0.130662, 1e-5)
})

test('payback sederhana dengan interpolasi', () => {
  assert.equal(payback([-100, 40, 40, 40]), 2.5)
  assert.equal(payback([-100, 10]), null)
})

test('CRF', () => {
  close(crf(0.1, 10), 0.162745)
  close(crf(0, 4), 0.25)
})

const base = {
  discountRate: 0.1,
  horizonYears: 5,
  lostMarginPerHour: 1000,
  repair: { upfront: 0, opex: 100 },
  replace: { upfront: 300, opex: 0 },
}

test('analyze: replace menghemat 100/thn, capex 300 → NPV = PV anuitas − 300', () => {
  const r = analyze(base)
  close(r.npv, 100 * (1 - 1.1 ** -5) / 0.1 - 300)
  close(r.payback, 3)
  assert.equal(r.verdict, 'replace')
  // pada capex break-even, NPV = 0
  close(analyze({ ...base, replace: { ...base.replace, upfront: r.breakEvenCapex } }).npv, 0)
})

test('nilai sisa & downtime instalasi masuk ke arus kas; break-even tetap konsisten', () => {
  const inp = { ...base, replace: { upfront: 300, opex: 0, life: 10, installDowntimeHours: 0.05 } }
  const r = analyze(inp)
  assert.equal(r.years[0].swap.total, 300 + 50)
  close(analyze({ ...inp, replace: { ...inp.replace, upfront: r.breakEvenCapex } }).npv, 0)
})
