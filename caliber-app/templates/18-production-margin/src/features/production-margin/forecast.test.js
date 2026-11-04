// Tes logika murni — jalankan: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { forecast, holt, portfolioMargin, productMargin } from './forecast.js'

const close = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`)

test('deret konstan → forecast konstan, sigma 0', () => {
  const f = forecast([100, 100, 100, 100], 3)
  for (const p of f.points) {
    close(p.p50, 100)
    close(p.p10, 100)
  }
})

test('tren linear tanpa damping tertangkap', () => {
  const s = Array.from({ length: 20 }, (_, i) => 100 + 5 * i)
  const m = holt(s, { phi: 1 })
  close(m.trend, 5, 1e-3)
  close(forecast(s, 2, { phi: 1 }).points[1].p50, 100 + 5 * 21, 1e-2)
})

test('interval melebar dengan horizon & dipotong kapasitas', () => {
  const s = [100, 110, 95, 105, 98, 112, 101, 107]
  const pts = forecast(s, 6).points
  assert.ok(pts[5].p90 - pts[5].p10 > pts[0].p90 - pts[0].p10)
  const capped = forecast(s, 3, { capacity: 100 }).points
  for (const p of capped) assert.ok(p.p90 <= 100)
})

test('margin at risk = (plan − P50)+ × spread; spread shock', () => {
  const p = { id: 'x', history: [80, 80, 80], price: 1000, variableCost: 600, plan: 100 }
  const r = productMargin(p, { horizon: 2 })
  close(r.atRisk, 2 * 20 * 400)
  close(r.margin50, 2 * 80 * 400)
  const shocked = productMargin(p, { horizon: 2, spreadShock: -0.25 })
  close(shocked.margin50, 2 * 80 * 300)
})

test('portofolio menjumlah produk', () => {
  const p = { id: 'x', history: [80, 80, 80], spread: 100, plan: 80 }
  const pf = portfolioMargin([p, { ...p, id: 'y' }], { horizon: 3 })
  close(pf.margin50, 2 * 3 * 8000)
  close(pf.atRisk, 0)
  assert.equal(pf.history.length, 3)
})
