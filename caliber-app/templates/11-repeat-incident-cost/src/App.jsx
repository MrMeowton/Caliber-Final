import { useEffect, useState } from 'react'
import { DAY, RepeatIncidentCounter, formatDate, formatUSD } from './features/repeat-incident'
import { incidents, range } from './demo/incidents'
import Slider from './demo/Slider'

const totalDays = Math.round((range.end - range.start) / DAY)

export default function App() {
  const [day, setDay] = useState(totalDays)
  const [eff, setEff] = useState(60)
  const [playing, setPlaying] = useState(false)
  const [sel, setSel] = useState(null)

  // Replay: majukan waktu 10 hari per tick
  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => setDay((d) => (d >= totalDays ? (setPlaying(false), d) : Math.min(totalDays, d + 10))), 80)
    return () => clearInterval(id)
  }, [playing])

  const until = range.start + day * DAY

  return (
    <main className="page">
      <header className="head">
        <div>
          <p className="eyebrow">Knowledge · preserve critical plant knowledge</p>
          <h1>Repeat-Incident Cost Counter</h1>
        </div>
        <div className="controls">
          <Slider label="Lihat sampai" value={day} onChange={setDay} min={0} max={totalDays} format={() => formatDate(until)} />
          <Slider label="Efektivitas knowledge retention" value={eff} onChange={setEff} min={0} max={100} step={5} format={(v) => `${v}%`} />
          <button className={playing ? 'is-on' : ''} onClick={() => (playing ? setPlaying(false) : (setDay(0), setPlaying(true)))}>
            {playing ? '❚❚ Jeda' : '▶ Replay'}
          </button>
        </div>
      </header>

      <p className="hint">
        Setiap insiden dengan <b>aset + mode kegagalan yang sama</b> dengan insiden yang sudah di-RCA dihitung sebagai biaya
        “pelajaran yang hilang”. Tekan <b>Replay</b> untuk melihat counter bertambah sepanjang 2025–2026.
      </p>

      <RepeatIncidentCounter incidents={incidents} until={until} effectiveness={eff / 100} selectedKey={sel?.key} onSelect={setSel} />

      {sel && (
        <p className="hint">
          <b>{sel.asset} — {sel.failureMode}</b>: {sel.count} kejadian, RCA pertama selesai{' '}
          <b>{sel.rcaAt ? formatDate(sel.rcaAt) : 'belum pernah'}</b>, lalu terulang <b>{sel.repeatsAfterRca}×</b> senilai{' '}
          <b>{formatUSD(sel.repeatCost)}</b>. Pastikan rekomendasi RCA masuk SOP, checklist PM, dan materi onboarding.
        </p>
      )}
    </main>
  )
}
