import { useEffect, useRef, useState } from 'react'
import { validateGraph } from './validate'

/**
 * Ambil data aliran dari sumber mana pun (fetch API, WebSocket snapshot, mock) secara berkala.
 *   fetcher: async () => { nodes, links }   ← biasanya fetch(...).then(r => r.json()).then(graphFromRows)
 * Mengembalikan objek graph yang identitasnya stabil antar render → aman untuk EnergySankey
 * (animasi pita hanya berjalan saat data benar-benar baru).
 */
export function useEnergyFlows(fetcher, { intervalMs = 0, validate = true } = {}) {
  const [state, setState] = useState({ data: null, error: null, loading: true, issues: [], updatedAt: null })
  const fetchRef = useRef(fetcher)
  useEffect(() => {
    fetchRef.current = fetcher
  })

  useEffect(() => {
    const run = { alive: true, id: 0 }
    const load = async () => {
      try {
        const data = await fetchRef.current()
        if (!run.alive) return
        const issues = validate ? validateGraph(data).issues : []
        setState({ data, error: null, loading: false, issues, updatedAt: new Date() })
      } catch (error) {
        if (run.alive) setState((s) => ({ ...s, error, loading: false }))
      }
      if (run.alive && intervalMs > 0) run.id = setTimeout(load, intervalMs)
    }
    load()
    return () => {
      run.alive = false
      clearTimeout(run.id)
    }
  }, [intervalMs, validate])

  return state
}
