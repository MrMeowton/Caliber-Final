import { useCallback } from 'react'

/** onKeyDown siap pasang: ←/→ (Shift = jauh), Home/End, Spasi = putar/jeda */
export function useReplayKeyboard(tm) {
  const { player, series } = tm
  return useCallback(
    (e) => {
      if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return
      const big = Math.max(1, Math.round(series.length / 40))
      const actions = {
        ArrowLeft: () => player.step(e.shiftKey ? -big : -1),
        ArrowRight: () => player.step(e.shiftKey ? big : 1),
        Home: () => player.setIndex(0),
        End: () => player.toEnd(),
      }
      if (e.key === ' ') {
        e.preventDefault()
        player.toggle()
      } else if (actions[e.key]) {
        e.preventDefault()
        player.pause()
        actions[e.key]()
      }
    },
    [player, series.length],
  )
}
