// Tes logika murni — jalankan: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { plantPnl, unitPnl } from './pnl.js'

const close = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`)

const carriers = {
  gas: { label: 'Fuel gas', unit: 'GJ', price: 8, ef: 0.056 },
  power: { label: 'Listrik', unit: 'MWh', price: 90, ef: 0.8 },
}
const u = { id: 'x', production: 1000, energy: { gas: 10_000, power: 1000 }, benchmarkSec: 10 }

test('SEC memakai konversi MWh → GJ', () => {
  const r = unitPnl(u, carriers)
  close(r.gj, 10_000 + 3_600)
  close(r.sec, 13.6)
})

test('biaya energi & intensitas per ton', () => {
  const r = unitPnl(u, carriers, { carbonPrice: 10 })
  close(r.energyPerT, (80_000 + 90_000) / 1000)
  close(r.intensity, (560 + 800) / 1000)
  close(r.carbonPerT, 13.6)
  close(r.totalPerT, 170 + 13.6)
})

test('gap vs benchmark = kelebihan GJ × harga rata-rata (+ karbon proporsional)', () => {
  const r = unitPnl(u, carriers, { carbonPrice: 0 })
  close(r.gapCost, 3600 * (170_000 / 13_600))
  const noBench = unitPnl({ ...u, benchmarkSec: 20 }, carriers)
  assert.equal(noBench.gapCost, 0)
})

test('total plant', () => {
  const p = plantPnl([u, u], carriers, { carbonPrice: 10 })
  close(p.co2, 2 * 1360)
  close(p.carbonCost, 27_200)
})
