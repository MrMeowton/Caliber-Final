// CONTOH 3 — data & model dari BACKEND: tanggal asli (ISO), skor + prediksi dari model ML.
import { useEffect, useMemo, useState } from 'react'
import { fromPrecomputed, TimeMachineReplay, toSeries } from '../features/timemachine'
import { fetchCompressorHistory } from './mockApi'

export function BackendDemo() {
  const [resp, setResp] = useState(null)
  useEffect(() => {
    let alive = true
    fetchCompressorHistory().then((r) => alive && setResp(r))
    return () => {
      alive = false
    }
  }, [])
  const data = useMemo(() => resp && adapt(resp), [resp])

  if (!data) return <p className="note">Memuat data dari API…</p>
  return (
    <>
      <p className="note">
        Sumber: <code>GET /api/assets/C-201/history</code> (mock) · model: {resp.model.name} · analyzer &amp; forecaster
        bawaan diganti hasil backend lewat <code>fromPrecomputed()</code>
      </p>
      <TimeMachineReplay
        title={resp.asset}
        series={data.series}
        threshold={resp.alarm_limit}
        unit={resp.unit}
        origin={data.origin}
        timeUnit="day"
        analyzer={data.analyzer}
        forecaster={data.forecaster}
      />
    </>
  )
}

/**
 * ADAPTER — satu-satunya tempat yang tahu format API. Backend berubah? Ubah di sini saja.
 * (score & trend sejajar dengan readings yang sudah urut waktu)
 */
function adapt(resp) {
  const { series, origin, toT } = toSeries(resp.readings, { time: 'timestamp', value: 'vibration_rms', unit: 'day' })
  const m = resp.model
  const { analyzer, forecaster } = fromPrecomputed({
    baseline: m.baseline,
    score: m.anomaly_score,
    trend: m.trend,
    detectAt: m.detected_at ? toT(m.detected_at) : null,
    forecasts: m.forecasts.map((f) => ({ at: toT(f.made_at), crossAt: toT(f.failure_eta) })),
  })
  return { series, origin, analyzer, forecaster }
}
