// Simulasi respons backend (mis. FastAPI + model ML). Bentuk JSON-nya sengaja BERBEDA
// dari format modul — untuk menunjukkan bahwa cukup ditulis satu fungsi adapter.
import { analyzeSeries, forecastAt, makeDegradationSeries } from '../features/timemachine'

const START = Date.parse('2026-09-01T00:00:00+07:00')
const DAY = 864e5
const iso = (t) => new Date(START + t * DAY).toISOString()

/** GET /api/assets/C-201/history (mock) */
export async function fetchCompressorHistory() {
  await new Promise((r) => setTimeout(r, 400))
  const threshold = 9
  const raw = makeDegradationSeries({ days: 54, base: 3.1, noise: 0.3, onset: 24, amp: 0.35, growth: 0.11, seed: 11 })

  // "Model di backend" — di sini disimulasikan memakai analyzer bawaan
  const a = analyzeSeries(raw, { threshold })
  const forecasts = []
  for (let i = Math.max(a.detectIndex, 0); a.detectIndex >= 0 && i < raw.length; i += 4) {
    const f = forecastAt(raw, a, i)
    if (f) forecasts.push({ made_at: iso(raw[i].t), failure_eta: iso(f.t) })
  }

  return {
    asset: 'Kompresor C-201',
    unit: 'mm/s',
    alarm_limit: threshold,
    readings: raw.map((p) => ({ timestamp: iso(p.t), vibration_rms: p.v })),
    model: {
      name: 'lstm-autoencoder-v3 (simulasi)',
      baseline: +a.mean.toFixed(3),
      anomaly_score: a.score.map((s) => +s.toFixed(3)), // sejajar dengan readings
      trend: a.smooth.map((v) => +v.toFixed(3)),
      detected_at: a.detectIndex >= 0 ? iso(raw[a.detectIndex].t) : null,
      forecasts, // [{ made_at, failure_eta }]
    },
  }
}
