// =========================================
// Logika status — fungsi murni, tanpa React / three.js
// -----------------------------------------
// Bisa dipakai di mana saja (panel, tabel, notifikasi, backend Node)
// =========================================

export const STATUS = {
  normal: { label: 'Normal', color: '#22c55e', rank: 0 },
  warning: { label: 'Warning', color: '#f59e0b', rank: 1 },
  critical: { label: 'Critical', color: '#ef4444', rank: 2 },
}

// Status satu nilai sensor berdasarkan ambang batasnya.
// sensor: { warn, crit } — nilai >= warn → warning, >= crit → critical
export function sensorStatus(sensor, value) {
  if (value == null || Number.isNaN(value)) return 'normal'
  if (sensor.crit != null && value >= sensor.crit) return 'critical'
  if (sensor.warn != null && value >= sensor.warn) return 'warning'
  return 'normal'
}

// Nilai terkini satu sensor (fallback ke `base` bila belum ada data)
export function readValue(readings, partId, sensor) {
  return readings?.[partId]?.[sensor.key] ?? sensor.base ?? null
}

// Status komponen = status sensor terburuk di komponen tersebut
export function partStatus(part, readings) {
  return (part.sensors ?? []).reduce((worst, s) => {
    const st = sensorStatus(s, readValue(readings, part.id, s))
    return STATUS[st].rank > STATUS[worst].rank ? st : worst
  }, 'normal')
}

// Jumlah komponen per status: { normal: 3, warning: 1, critical: 1 }
export function summarize(parts, readings) {
  const out = { normal: 0, warning: 0, critical: 0 }
  for (const p of parts) out[partStatus(p, readings)]++
  return out
}

// Ubah data "baris" (dari API / CSV / database) ke format readings modul.
// rows: [{ partId: 'pump', sensor: 'pressure', value: 6.2 }, ...]
// hasil: { pump: { pressure: 6.2 }, ... }
export function rowsToReadings(rows, { partKey = 'partId', sensorKey = 'sensor', valueKey = 'value' } = {}) {
  const out = {}
  for (const r of rows) {
    const p = r[partKey]
    ;(out[p] ??= {})[r[sensorKey]] = Number(r[valueKey])
  }
  return out
}
