// Formatter waktu & nilai. Pakai `origin` dari toSeries agar sumbu tampil sebagai tanggal.

import { LABELS_ID } from './labels.js'
import { UNIT_MS } from './series.js'

/**
 * @param {object} [opts]
 * @param {number | null} [opts.origin]  epoch ms untuk t = 0. null → "Hari 12"
 * @param {'second'|'minute'|'hour'|'day'} [opts.unit='day']
 * @param {string} [opts.locale='id-ID']
 * @param {typeof LABELS_ID} [opts.labels]
 */
export function createTimeFormat({ origin = null, unit = 'day', locale = 'id-ID', labels = LABELS_ID } = {}) {
  const u = labels.units?.[unit] ?? LABELS_ID.units.day
  const ms = UNIT_MS[unit] ?? UNIT_MS.day
  const dateOpts = unit === 'day' ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }

  const formatTime = origin == null ? (t) => `${u.point} ${Math.floor(t)}` : (t) => new Date(origin + t * ms).toLocaleString(locale, dateOpts)
  const formatDuration = (d) => {
    const r = Math.round(d)
    return r < 1 ? labels.lessThan.replace('{value}', `1 ${u.duration}`) : `${r} ${u.duration}`
  }
  return { formatTime, formatDuration }
}

export const formatValue = (v, unit = '') => `${Number(v).toFixed(Math.abs(v) < 100 ? 1 : 0)} ${unit}`.trim()

/** Warna skor anomali: hijau (0) → kuning → merah (1) */
export function scoreColor(s) {
  const hue = 145 - 145 * Math.min(1, Math.max(0, s))
  return `hsl(${hue} 80% 52%)`
}
