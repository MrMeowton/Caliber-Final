// CONTOH 1 — preset: satu komponen, langsung jalan.
import { makeDegradationSeries, TimeMachineReplay } from '../features/timemachine'

const SERIES = makeDegradationSeries({ days: 56 }) // di project utama: data dari API
const EVENTS = [{ t: 20, title: 'Inspeksi rutin', text: 'tidak ada temuan' }]

export function PresetDemo() {
  return (
    <TimeMachineReplay
      title="Reliability · Bearing pompa P-101"
      series={SERIES}
      threshold={7.1}
      unit="mm/s"
      events={EVENTS}
    />
  )
}
