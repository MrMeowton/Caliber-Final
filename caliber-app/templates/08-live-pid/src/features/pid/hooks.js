// Hook React modul P&ID
import { useCallback, useEffect, useRef, useState } from 'react'

/** true bila pengguna meminta animasi dikurangi (OS setting). */
export function useReducedMotion() {
  const query = '(prefers-reduced-motion: reduce)'
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia?.(query).matches)
  useEffect(() => {
    const mq = window.matchMedia?.(query)
    if (!mq) return
    const on = () => setReduced(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduced
}

/**
 * Riwayat nilai tag di sisi klien (untuk sparkline) — dipakai bila host tidak
 * mengirim riwayat sendiri. Satu sampel ditambahkan setiap objek `values` berganti.
 * @returns { [tag]: number[] } panjang maks `size`
 */
export function useTagHistory(values, size = 60) {
  // Pola "turunkan saat render" (tanpa effect): sampel ditambah tepat sekali per objek values baru
  const [st, setSt] = useState({ values: null, history: {} })
  if (values !== st.values) {
    const history = {}
    for (const [tag, v] of Object.entries(values ?? {})) {
      const arr = st.history[tag] ? st.history[tag].slice(-(size - 1)) : []
      arr.push(v)
      history[tag] = arr
    }
    setSt({ values, history })
    return history
  }
  return st.history
}

/**
 * Animasi alir pipa dengan SATU loop requestAnimationFrame untuk semua jalur.
 * Kecepatan dibaca dari ref setiap frame → laju bisa berubah mulus tanpa
 * animasi CSS yang "melompat" saat durasinya diganti.
 *
 * @param speeds  { [lineId]: px per detik } (boleh negatif = arah balik)
 * @returns register(lineId) → ref callback untuk elemen <path> lapisan alir
 */
export function useFlowAnimation(speeds, enabled = true) {
  const speedRef = useRef(speeds)
  const els = useRef(new Map())
  const offsets = useRef(new Map())

  useEffect(() => {
    speedRef.current = speeds
  }, [speeds])

  useEffect(() => {
    if (!enabled) return
    const clock = { last: performance.now(), raf: 0 }
    const step = (now) => {
      const dt = Math.min(0.1, (now - clock.last) / 1000) // batasi lompatan saat tab kembali aktif
      clock.last = now
      for (const [id, el] of els.current) {
        const v = speedRef.current[id] ?? 0
        if (!v) continue
        const o = (offsets.current.get(id) ?? 0) - v * dt
        offsets.current.set(id, o % 1000)
        el.style.strokeDashoffset = String(o % 1000)
      }
      clock.raf = requestAnimationFrame(step)
    }
    clock.raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(clock.raf)
  }, [enabled])

  // ref callback di-cache per id agar identitasnya stabil antar render
  const cache = useRef(new Map())
  return useCallback((id) => {
    if (!cache.current.has(id)) {
      cache.current.set(id, (el) => {
        if (el) els.current.set(id, el)
        else els.current.delete(id)
      })
    }
    return cache.current.get(id)
  }, [])
}
