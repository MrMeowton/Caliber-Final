// CONTOH 2 — dashboard komposisi: hook di induk, komponen TM* disusun bebas,
// plus komponen MILIK SENDIRI yang membaca state lewat useTimeMachineContext().
import { useState } from 'react'
import {
  LABELS_EN,
  makeDegradationSeries,
  TimeMachineProvider,
  TMChart,
  TMControls,
  TMHeader,
  TMRoot,
  TMStatus,
  TMStory,
  useTimeMachine,
  useTimeMachineContext,
} from '../features/timemachine'

const SERIES = makeDegradationSeries({ days: 60, base: 68, noise: 1.2, onset: 25, amp: 1.1, growth: 0.1, seed: 3 })
const EVENTS = [{ t: 24, title: 'Beban puncak', text: 'penambahan lini produksi' }]

export function ComposedDemo() {
  const [log, setLog] = useState([])
  const [lang, setLang] = useState('id')
  const push = (msg) => setLog((l) => [{ id: Math.random(), msg }, ...l].slice(0, 5))

  const tm = useTimeMachine({
    series: SERIES,
    threshold: 95,
    unit: '°C',
    events: EVENTS,
    labels: lang === 'en' ? LABELS_EN : undefined,
    // Kait integrasi: kirim notifikasi, nyalakan FaultPulse di twin 3D, dll.
    onDetect: (info) => push(`🔔 onDetect · ${info.time} → kirim notifikasi ke teknisi`),
    onAlarm: (info) => push(`🚨 onAlarm · ${info.time} → buka work order darurat`),
    onStageChange: (stage, prev) => push(`onStageChange · ${prev} → ${stage}`),
  })

  return (
    <TimeMachineProvider value={tm}>
      <div className="toolbar">
        {/* induk mengendalikan waktu dari luar */}
        <button onClick={() => tm.seek(Math.max(0, tm.analysis.detectIndex - 12))}>⏪ Sebelum AI mendeteksi</button>
        <button onClick={() => tm.player.play()}>▶ Putar dari luar</button>
        <button onClick={() => setLang(lang === 'id' ? 'en' : 'id')}>🌐 {lang === 'id' ? 'English' : 'Indonesia'}</button>
      </div>

      <div className="dash">
        <TMRoot className="dash-main">
          <TMHeader title="Energy · Trafo TR-03" />
          <TMChart height={300} />
          <TMControls speeds={[1, 4]} />
        </TMRoot>

        <aside className="dash-side">
          <TMStatus />
          <WorkOrderCard />
          <TMStory />
          <EventLog log={log} />
        </aside>
      </div>
    </TimeMachineProvider>
  )
}

/** Komponen milik sistem hackathon — bereaksi terhadap waktu yang sedang diputar. */
function WorkOrderCard() {
  const { stage, forecast, fmt, summary } = useTimeMachineContext()
  const view = {
    normal: { title: 'Tidak ada tindakan', text: 'Trafo beroperasi normal.' },
    warning: {
      title: 'Rekomendasi: jadwalkan inspeksi',
      text: forecast ? `Sebelum ${fmt.time(forecast.t)} (sisa ${fmt.duration(forecast.remaining)})` : 'Menunggu proyeksi…',
    },
    alarm: { title: 'Darurat: turunkan beban', text: `Alarm sejak ${fmt.time(summary.alarmAt)}` },
  }[stage]

  return (
    <div className={`card is-${stage}`}>
      <small>Komponen sendiri · useTimeMachineContext()</small>
      <strong>{view.title}</strong>
      <span>{view.text}</span>
      <button disabled={stage === 'normal'}>Buat work order</button>
    </div>
  )
}

function EventLog({ log }) {
  return (
    <div className="card log">
      <small>Callback (onDetect / onAlarm / onStageChange)</small>
      {log.length ? log.map((l) => <code key={l.id}>{l.msg}</code>) : <span>Putar untuk melihat event…</span>}
    </div>
  )
}
