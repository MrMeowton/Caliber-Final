import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

/**
 * State waktu + pemutar. Bisa uncontrolled (default) atau controlled:
 * berikan `index` + `onIndexChange` agar waktu dikendalikan sistem lain
 * (mis. slider global dashboard atau timeline digital twin).
 *
 * @param {number} length jumlah titik data
 * @param {{ start?: number, pointsPerSecond?: number, index?: number, onIndexChange?: (i: number) => void }} [opts]
 */
export function useReplay(length, { start, pointsPerSecond = 24, index: controlled, onIndexChange } = {}) {
  const last = Math.max(0, length - 1)
  const clampI = useCallback((i) => Math.min(Math.max(Math.round(i), 0), last), [last])
  const isControlled = controlled != null

  const [inner, setInner] = useState(() => Math.min(Math.max(start ?? last, 0), last))
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const index = clampI(isControlled ? controlled : inner)

  // Ref agar loop animasi & updater fungsi selalu membaca nilai terbaru
  const live = useRef({ index, onIndexChange, acc: 0 })
  useLayoutEffect(() => {
    live.current.index = index
    live.current.onIndexChange = onIndexChange
  })

  const setIndex = useCallback(
    (next) => {
      const v = clampI(typeof next === 'function' ? next(live.current.index) : next)
      if (v === live.current.index) return
      live.current.index = v
      if (!isControlled) setInner(v)
      live.current.onIndexChange?.(v)
    },
    [clampI, isControlled],
  )

  // Di ujung, pemutar otomatis dianggap berhenti (diturunkan, bukan state baru)
  const isPlaying = playing && index < last

  useEffect(() => {
    if (!isPlaying) return undefined
    const clock = { prev: performance.now(), raf: 0 }
    const tick = (now) => {
      const l = live.current
      l.acc += ((now - clock.prev) / 1000) * pointsPerSecond * speed
      clock.prev = now
      if (l.acc >= 1) {
        const step = Math.floor(l.acc)
        l.acc -= step
        setIndex((i) => i + step)
      }
      clock.raf = requestAnimationFrame(tick)
    }
    clock.raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(clock.raf)
  }, [isPlaying, speed, pointsPerSecond, setIndex])

  const play = useCallback(() => {
    live.current.acc = 0
    if (live.current.index >= last) setIndex(0) // di ujung? mulai lagi dari awal
    setPlaying(true)
  }, [last, setIndex])
  const pause = useCallback(() => setPlaying(false), [])
  const toggle = useCallback(() => (isPlaying ? pause() : play()), [isPlaying, pause, play])
  const step = useCallback((n) => setIndex((i) => i + n), [setIndex])
  const toEnd = useCallback(() => setIndex(last), [setIndex, last])

  return { index, setIndex, playing: isPlaying, play, pause, toggle, step, toEnd, speed, setSpeed, isAtEnd: index >= last, last }
}
