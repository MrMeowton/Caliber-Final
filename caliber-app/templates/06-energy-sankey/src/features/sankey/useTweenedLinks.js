import { useEffect, useRef, useState } from 'react'

const easeOutCubic = (t) => 1 - (1 - t) ** 3
const keyOf = (l) => l.id ?? `${l.source}→${l.target}`
const prefersReducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * Menganimasikan perubahan `value` tiap aliran (dicocokkan lewat id / source→target).
 * Hasilnya: lebar pita "mengembang / menyusut" mulus saat skenario atau slider berubah,
 * bukan melompat. Aliran baru tumbuh dari 0, aliran yang hilang menyusut ke 0.
 * `links` harus stabil (useMemo) — setiap identitas baru memulai animasi baru.
 */
export function useTweenedLinks(links, duration = 650) {
  const [reduce] = useState(prefersReducedMotion)
  const [shown, setShown] = useState(links)
  const shownRef = useRef(links) // yang sedang tergambar (untuk aliran yang keluar)
  const current = useRef(new Map(links.map((l) => [keyOf(l), l.value])))
  const off = reduce || duration <= 0

  useEffect(() => {
    if (off) return
    const from = new Map(current.current)
    const targetKeys = new Set(links.map(keyOf))
    const leaving = shownRef.current.filter((l) => !targetKeys.has(keyOf(l)) && (from.get(keyOf(l)) ?? 0) > 0)
    const all = [...links, ...leaving.map((l) => ({ ...l, value: 0 }))]

    const loop = { id: 0 }
    const t0 = performance.now()
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / duration)
      const e = easeOutCubic(p)
      const next =
        p < 1
          ? all.map((l) => {
              const k = keyOf(l)
              const a = from.get(k) ?? 0
              const v = a + (l.value - a) * e
              current.current.set(k, v)
              return { ...l, value: v }
            })
          : links
      if (p >= 1) current.current = new Map(links.map((l) => [keyOf(l), l.value]))
      shownRef.current = next
      setShown(next)
      if (p < 1) loop.id = requestAnimationFrame(tick)
    }
    loop.id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(loop.id)
  }, [links, duration, off])

  return off ? links : shown
}
