// Adapter data: baris mentah dari API / CSV → series [{ t, v }]

/** @typedef {import('./types.js').Point} Point */

export const UNIT_MS = { second: 1e3, minute: 6e4, hour: 36e5, day: 864e5 }

/**
 * Ubah baris apa pun menjadi series terurut. Waktu boleh angka, Date, atau string ISO.
 *
 * @example
 * const { series, origin, toT } = toSeries(rows, { time: 'timestamp', value: 'vibration_rms', unit: 'day' })
 *
 * @param {object[]} rows
 * @param {object} [opts]
 * @param {string | ((row: any) => any)} [opts.time='t']   nama kolom / fungsi pengambil waktu
 * @param {string | ((row: any) => any)} [opts.value='v']  nama kolom / fungsi pengambil nilai
 * @param {'second'|'minute'|'hour'|'day'} [opts.unit='day']  satuan t bila waktu berupa tanggal
 * @param {number | string | Date} [opts.origin]  t = 0 (default: tanggal paling awal)
 * @returns {{ series: Point[], origin: number | null, unit: string, toT: (time: any) => number }}
 */
export function toSeries(rows, { time = 't', value = 'v', unit = 'day', origin } = {}) {
  const get = (row, key) => (typeof key === 'function' ? key(row) : row[key])
  const ms = UNIT_MS[unit] ?? UNIT_MS.day
  const raw = rows.map((r) => ({ time: get(r, time), v: Number(get(r, value)) })).filter((p) => p.time != null && Number.isFinite(p.v))
  const isDate = raw.length > 0 && (raw[0].time instanceof Date || typeof raw[0].time === 'string')

  let o = null
  if (isDate) {
    o = origin != null ? new Date(origin).getTime() : raw.reduce((m, p) => Math.min(m, new Date(p.time).getTime()), Infinity)
  }
  const toT = (x) => (isDate ? (new Date(x).getTime() - o) / ms : Number(x))

  const series = raw
    .map((p) => ({ t: toT(p.time), v: p.v }))
    .filter((p) => Number.isFinite(p.t))
    .sort((a, b) => a.t - b.t)
  return { series, origin: o, unit, toT }
}

/** PRNG kecil ber-seed agar data demo selalu sama */
function mulberry32(seed) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let r = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Deret sintetis untuk demo/testing: sehat + noise, lalu mulai `onset` anomali tumbuh
 * eksponensial. Di project utama ganti dengan data historis dari API.
 * @returns {Point[]}
 */
export function makeDegradationSeries({
  days = 60,
  perDay = 4,
  base = 2.3,
  noise = 0.25,
  onset = 28,
  amp = 0.29,
  growth = 0.12,
  seed = 7,
} = {}) {
  const rand = mulberry32(seed)
  const gauss = () => {
    const u = 1 - rand()
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand())
  }
  const out = []
  for (let i = 0; i <= days * perDay; i++) {
    const t = i / perDay
    const fault = t > onset ? amp * (Math.exp(growth * (t - onset)) - 1) : 0
    out.push({ t, v: +(base + fault + noise * gauss()).toFixed(3) })
  }
  return out
}
