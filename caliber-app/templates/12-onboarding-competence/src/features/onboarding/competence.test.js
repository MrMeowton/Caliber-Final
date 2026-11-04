// Tes logika murni — jalankan: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { analyze, competenceCurve, quantileDay, timeToCompetence } from './competence.js'

const skills = [{ id: 'a' }, { id: 'b' }, { id: 'c', weight: 2 }]
const asOf = '2026-11-01'

test('kompeten saat porsi berbobot ≥ threshold', () => {
  const e = { hiredAt: '2025-01-01', achieved: { a: 30, b: 60, c: 90 } }
  assert.equal(timeToCompetence(e, skills, { threshold: 0.75, asOf }).day, 90) // a+b = 2/4 < .75
  assert.equal(timeToCompetence(e, skills, { threshold: 0.5, asOf }).day, 60)
})

test('skill setelah asOf belum dihitung → tersensor', () => {
  const e = { hiredAt: '2026-10-01', achieved: { a: 10, b: 20, c: 300 } }
  const r = timeToCompetence(e, skills, { threshold: 1, asOf })
  assert.equal(r.reached, false)
  assert.equal(r.observed, 31)
})

test('Kaplan–Meier: data tersensor tidak dihitung sebagai gagal', () => {
  const recs = [
    { reached: true, day: 10, observed: 100 },
    { reached: false, day: null, observed: 15 }, // keluar dari risk set setelah hari 15
    { reached: true, day: 20, observed: 100 },
  ]
  const c = competenceCurve(recs)
  assert.deepEqual(c.map((p) => p.day), [0, 10, 20])
  assert.ok(Math.abs(c[1].pct - 1 / 3) < 1e-9)
  assert.equal(c[2].pct, 1) // hari 20: tersisa 1 orang berisiko, dan dia kompeten
  assert.equal(quantileDay(c, 0.5), 20)
})

test('analyze: hari dihemat & nilai US$', () => {
  const engs = [
    { cohort: 'before', hiredAt: '2024-01-01', achieved: { a: 100, b: 150, c: 200 } },
    { cohort: 'after', hiredAt: '2025-01-01', achieved: { a: 50, b: 80, c: 120 } },
  ]
  const r = analyze(engs, skills, { threshold: 1, asOf, valuePerDay: 100, hiresPerYear: 10 })
  assert.equal(r.daysSaved, 80)
  assert.equal(r.valuePerYear, 80_000)
  assert.equal(r.skills[0].id, 'c')
})
