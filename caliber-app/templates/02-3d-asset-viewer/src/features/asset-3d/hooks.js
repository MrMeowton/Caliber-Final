'use client'

import { useEffect, useState } from 'react'

// =========================================
// Hook data untuk modul asset-3d
// -----------------------------------------
// Format `readings` yang dipakai seluruh modul:
//   { [partId]: { [sensorKey]: number } }
// =========================================

function baseReadings(parts) {
  const r = {}
  for (const p of parts) {
    r[p.id] = {}
    for (const s of p.sensors ?? []) r[p.id][s.key] = s.base
  }
  return r
}

// Data sensor DUMMY: tiap `intervalMs`, nilai bergeser ±jitter dari `base`.
// Untuk produksi, ganti dengan data dari API (lihat README → "Sumber data").
export function useSimulatedReadings(parts, { running = true, intervalMs = 1200, jitter = 0.04 } = {}) {
  const [readings, setReadings] = useState(() => baseReadings(parts))

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      const next = {}
      for (const p of parts) {
        next[p.id] = {}
        for (const s of p.sensors ?? []) {
          const noise = (Math.random() * 2 - 1) * jitter * s.base
          next[p.id][s.key] = Math.max(0, +(s.base + noise).toFixed(1))
        }
      }
      setReadings(next)
    }, intervalMs)
    return () => clearInterval(id)
  }, [parts, running, intervalMs, jitter])

  return readings
}

// Riwayat nilai sensor (untuk sparkline), dari readings sumber APA PUN.
// Setiap kali objek `readings` berganti, nilai barunya ditambahkan.
export function useSensorHistory(readings, length = 40) {
  const [state, setState] = useState({ source: null, history: {} })

  // Pola "derive state saat render" (bukan useEffect) agar tidak render dua kali
  if (state.source !== readings) {
    const history = {}
    for (const [partId, sensors] of Object.entries(readings ?? {})) {
      history[partId] = {}
      for (const [key, v] of Object.entries(sensors)) {
        history[partId][key] = [...(state.history[partId]?.[key] ?? []), v].slice(-length)
      }
    }
    setState({ source: readings, history })
  }

  return state.history
}
