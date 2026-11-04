// Komponen KOMPOSABEL — masing-masing membaca state dari <TimeMachineProvider>,
// jadi bisa disusun bebas di layout dashboard mana pun.
import { Fragment } from 'react'
import { fill } from '../core/labels.js'
import { scoreColor } from '../core/format.js'
import { useTimeMachineContext } from '../react/context.js'
import { useReplayKeyboard } from '../react/useReplayKeyboard.js'
import { ReplayChart } from './ReplayChart.jsx'
import '../styles/timemachine.css'

const cx = (...c) => c.filter(Boolean).join(' ')

/** Wadah berbingkai + navigasi keyboard + class `is-{stage}`. Opsional. */
export function TMRoot({ children, className, as: Tag = 'section' }) {
  const tm = useTimeMachineContext()
  const onKeyDown = useReplayKeyboard(tm)
  return (
    <Tag className={cx('tm-part tm-root', `is-${tm.stage}`, className)} tabIndex={0} onKeyDown={onKeyDown}>
      {children}
    </Tag>
  )
}

/** Judul, waktu yang sedang dilihat, dan skor anomali. */
export function TMHeader({ title, className }) {
  const { labels, fmt, point, player, score } = useTimeMachineContext()
  return (
    <header className={cx('tm-part tm-head', className)}>
      <div>
        <p className="tm-title">{title ?? labels.title}</p>
        <p className="tm-now">
          {fmt.time(point.t)}
          {player.isAtEnd && <span className="tm-tag">{labels.now}</span>}
        </p>
      </div>
      <div className="tm-score" style={{ '--c': scoreColor(score) }}>
        <span>{labels.anomalyScore}</span>
        <strong>{Math.round(score * 100)}%</strong>
      </div>
    </header>
  )
}

/** Grafik yang tersambung ke state (klik/drag = lompat waktu). */
export function TMChart({ height = 340 }) {
  const tm = useTimeMachineContext()
  return (
    <ReplayChart
      series={tm.series}
      analysis={tm.analysis}
      index={tm.index}
      forecast={tm.forecast}
      events={tm.events}
      height={height}
      unit={tm.unit}
      labels={tm.labels}
      formatTime={tm.fmt.time}
      formatDuration={tm.fmt.duration}
      onSeek={(i) => {
        tm.player.pause()
        tm.seek(i)
      }}
    />
  )
}

/** Tombol putar, slider waktu, kecepatan, dan "Sekarang". */
export function TMControls({ speeds = [1, 2, 4], showNow = true, className }) {
  const { player, labels, seek } = useTimeMachineContext()
  return (
    <div className={cx('tm-part tm-controls', className)}>
      <button type="button" className="tm-btn tm-play" onClick={player.toggle} aria-label={player.playing ? labels.pause : labels.play}>
        {player.playing ? '❚❚' : '▶'}
      </button>
      <input
        className="tm-slider"
        type="range"
        min={0}
        max={player.last}
        value={player.index}
        aria-label={labels.seek}
        style={{ '--p': `${(player.index / (player.last || 1)) * 100}%` }}
        onChange={(e) => {
          player.pause()
          seek(+e.target.value)
        }}
      />
      {speeds.length > 1 && (
        <div className="tm-speed" role="group" aria-label={labels.speed}>
          {speeds.map((s) => (
            <button key={s} type="button" className={cx('tm-chip', player.speed === s && 'is-on')} onClick={() => player.setSpeed(s)}>
              {s}×
            </button>
          ))}
        </div>
      )}
      {showNow && (
        <button
          type="button"
          className="tm-btn"
          disabled={player.isAtEnd}
          onClick={() => {
            player.pause()
            player.toEnd()
          }}
        >
          {labels.toNow}
        </button>
      )}
    </div>
  )
}

/** Dua kartu status berdampingan: dashboard konvensional vs AI. */
export function TMStatus({ className }) {
  const { stage, labels, fmt, point, threshold, trend } = useTimeMachineContext()
  const conv = stage === 'alarm' ? 'alarm' : 'normal'
  return (
    <div className={cx('tm-part tm-statuses', className)}>
      <StatusCard
        label={labels.conventional}
        state={conv}
        value={labels.conventionalState[conv]}
        detail={fill(labels.limit, { value: fmt.value(point.v), op: point.v >= threshold ? '≥' : '<', threshold: fmt.value(threshold) })}
      />
      <StatusCard label={labels.ai} state={stage} value={labels.aiState[stage]} detail={fill(labels.trend, { value: fmt.value(trend) })} />
    </div>
  )
}

export function StatusCard({ label, state, value, detail }) {
  return (
    <div className={`tm-status is-${state}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  )
}

/** Narasi yang berubah sesuai tahap — inti "membuktikan prediksi dengan cerita". */
export function TMStory({ className }) {
  const tm = useTimeMachineContext()
  const { stage, labels, fmt, analysis, forecast, summary, events, point } = tm
  const L = labels.story
  let text
  if (stage === 'normal') {
    text = fill(L.normal, { baseline: fmt.value(analysis.mean) }) + (analysis.detectIndex >= 0 ? L.normalHint : '')
  } else if (stage === 'warning') {
    text =
      L.warning +
      (forecast ? fill(L.warningForecast, { forecastAt: fmt.time(forecast.t), remaining: fmt.duration(forecast.remaining) }) : L.warningPending)
  } else {
    text = fill(L.alarm, { alarmAt: fmt.time(summary.alarmAt) })
    if (summary.leadTime != null) {
      text += fill(L.alarmLead, { lead: fmt.duration(summary.leadTime) })
      if (summary.forecastError != null) text += fill(L.alarmError, { error: fmt.duration(summary.forecastError) })
      text += L.end
    }
  }
  const ev = [...events].reverse().find((e) => e.t <= point.t)

  return (
    <p className={cx('tm-part tm-narrative', className)}>
      <Rich text={text} />
      {ev && (
        <span className="tm-event-note">
          ◆ {fmt.time(ev.t)} — <b>{ev.title}</b>
          {ev.text ? `: ${ev.text}` : ''}
        </span>
      )}
    </p>
  )
}

/** Render teks label: **tebal** → <b> */
export function Rich({ text }) {
  return String(text)
    .split(/\*\*(.+?)\*\*/g)
    .map((part, i) => (i % 2 ? <b key={i}>{part}</b> : <Fragment key={i}>{part}</Fragment>))
}
