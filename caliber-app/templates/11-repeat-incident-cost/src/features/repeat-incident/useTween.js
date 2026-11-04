import { useEffect, useRef, useState } from 'react'

/** Angka yang "berputar" ke nilai baru (requestAnimationFrame, ease-out kubik). */
export function useTween(target, ms = 700) {
  const [v, setV] = useState(target)
  const from = useRef(target)
  useEffect(() => {
    const start = performance.now()
    const a = from.current
    const raf = { id: 0 }
    const step = (t) => {
      const k = Math.min(1, (t - start) / ms)
      const val = a + (target - a) * (1 - (1 - k) ** 3)
      from.current = val
      setV(val)
      if (k < 1) raf.id = requestAnimationFrame(step)
    }
    raf.id = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf.id)
  }, [target, ms])
  return v
}
