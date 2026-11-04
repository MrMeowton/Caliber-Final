// Logika murni "balapan" spare part vs kegagalan aset — tanpa React, tanpa DOM.
// Bisa dipakai di frontend, backend (Node), laporan, atau tes.
//
// Konsep:
//   Garis 1 (aset): hari ini ───────────► perkiraan gagal (P50), dengan jendela P10…P90
//   Garis 2 (part): dipesan ──(lead time)──► part tiba
//   Part tiba SETELAH aset gagal  → TERLAMBAT (merah) — selisihnya = hari downtime menunggu part
//   Part tiba di dalam jendela gagal / tanpa buffer → MEPET (kuning)
//   Selain itu → AMAN (hijau)

export const DAY = 86_400_000

export const STATUS = {
  late: { id: 'late', label: 'Terlambat', rank: 0 },
  tight: { id: 'tight', label: 'Mepet', rank: 1 },
  safe: { id: 'safe', label: 'Aman', rank: 2 },
}

/** Tanggal (Date | ISO string | ms) → ms. Angka kecil (< 1e11) dianggap "hari dari `now`". */
export function toMs(value, now) {
  if (value == null || value === '') return null
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'number') return Math.abs(value) < 1e11 ? now + value * DAY : value
  const t = Date.parse(value)
  return Number.isNaN(t) ? null : t
}

export const daysBetween = (a, b) => (b - a) / DAY
export const addDays = (ms, days) => ms + days * DAY

/** Awal hari lokal — supaya "hari ini" tidak bergeser tiap detik. */
export function startOfDay(ms) {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/**
 * Hitung satu balapan.
 *
 * @param {object} item
 *   failure: { p50, p10?, p90? }   — tanggal atau angka = hari dari now (mis. RUL dari model)
 *   part:    { leadTimeDays, orderedAt?, eta?, inStock? }
 *            eta     → tanggal tiba pasti (dari supplier) — mengalahkan perhitungan lead time
 *            orderedAt → tiba = orderedAt + leadTimeDays
 *            (keduanya kosong) → dianggap "dipesan hari ini"
 *            inStock → tiba = now (part sudah di gudang)
 *   downtimeCostPerDay? — opsional, untuk eksposur biaya
 * @param {object} opt  { now, bufferDays = 3 }  bufferDays = jeda minimum untuk persiapan/instalasi
 */
export function computeRace(item, { now = Date.now(), bufferDays = 3 } = {}) {
  const f = item.failure ?? {}
  const p = item.part ?? {}

  const failAt = toMs(f.p50, now)
  if (failAt == null) throw new Error(`[spare-part-race] ${item.id}: failure.p50 wajib diisi`)
  // Jendela ketidakpastian; jika model tidak memberi, pakai ±20 % dari sisa umur (min 1 hari)
  const spread = Math.max(DAY, Math.abs(failAt - now) * 0.2)
  const failEarly = Math.min(failAt, toMs(f.p10, now) ?? failAt - spread)
  const failLate = Math.max(failAt, toMs(f.p90, now) ?? failAt + spread)

  const leadTimeDays = Math.max(0, Number(p.leadTimeDays) || 0)
  let orderAt, arriveAt, mode
  if (p.inStock) {
    // stockSince = sejak kapan part ada di gudang (default: hari ini)
    arriveAt = Math.min(now, toMs(p.stockSince, now) ?? now)
    orderAt = arriveAt
    mode = 'stock'
  } else if (p.eta != null) {
    arriveAt = toMs(p.eta, now)
    orderAt = toMs(p.orderedAt, now) ?? addDays(arriveAt, -leadTimeDays)
    mode = 'eta'
  } else if (p.orderedAt != null) {
    orderAt = toMs(p.orderedAt, now)
    arriveAt = addDays(orderAt, leadTimeDays)
    mode = 'ordered'
  } else {
    orderAt = now
    arriveAt = addDays(now, leadTimeDays)
    mode = 'not-ordered' // simulasi: kalau dipesan hari ini
  }

  // Slack = berapa hari part tiba LEBIH DULU dari gagal (P50). Negatif = terlambat.
  const slackDays = daysBetween(arriveAt, failAt)
  // Terhadap skenario terburuk (aset gagal lebih cepat, P10)
  const slackEarlyDays = daysBetween(arriveAt, failEarly)

  let status
  if (slackDays < 0) status = 'late'
  else if (slackEarlyDays < bufferDays) status = 'tight'
  else status = 'safe'

  const waitDays = Math.max(0, -slackDays) // hari aset mati menunggu part (skenario P50)
  // Batas pesan agar part tiba ≥ buffer hari sebelum skenario terburuk
  const orderBy = addDays(failEarly, -(leadTimeDays + bufferDays))
  const orderOverdueDays = mode === 'not-ordered' ? Math.max(0, daysBetween(orderBy, now)) : 0
  // Berapa hari lead time harus dipangkas (expedite) supaya statusnya aman
  const expediteDays = Math.max(0, bufferDays - slackEarlyDays)

  const costPerDay = Number(item.downtimeCostPerDay) || 0
  return {
    ...item,
    now,
    failAt,
    failEarly,
    failLate,
    orderAt,
    arriveAt,
    leadTimeDays,
    mode,
    slackDays,
    slackEarlyDays,
    status,
    waitDays,
    orderBy,
    orderOverdueDays,
    expediteDays,
    exposure: waitDays * costPerDay,
  }
}

/** Hitung banyak item sekaligus, diurutkan: terlambat → mepet → aman, lalu slack terkecil. */
export function computeRaces(items, opt = {}) {
  const now = opt.now ?? Date.now()
  return items
    .map((it) => computeRace(it, { ...opt, now }))
    .sort((a, b) => STATUS[a.status].rank - STATUS[b.status].rank || a.slackDays - b.slackDays)
}

/** Ringkasan untuk KPI. */
export function summarize(races) {
  const out = { total: races.length, late: 0, tight: 0, safe: 0, waitDays: 0, exposure: 0, overdueOrders: 0 }
  for (const r of races) {
    out[r.status]++
    out.waitDays += r.waitDays
    out.exposure += r.exposure
    if (r.orderOverdueDays > 0) out.overdueOrders++
  }
  return out
}

/** Rentang sumbu waktu yang memuat semua garis + sedikit margin. */
export function raceWindow(races, { now = Date.now(), padDays = 5, minDays = 30 } = {}) {
  let lo = now
  let hi = now + minDays * DAY
  for (const r of races) {
    lo = Math.min(lo, r.orderAt, r.failEarly)
    hi = Math.max(hi, r.arriveAt, r.failLate)
  }
  return [startOfDay(lo - padDays * DAY), startOfDay(hi + padDays * DAY) + DAY]
}

/** Titik-titik sumbu: harian / mingguan / bulanan, dipilih otomatis dari panjang rentang. */
export function axisTicks([start, end], maxTicks = 10) {
  const spanDays = (end - start) / DAY
  const steps = [1, 2, 7, 14, 30, 60, 90]
  const step = steps.find((s) => spanDays / s <= maxTicks) ?? 180
  const ticks = []
  const d = new Date(start)
  d.setHours(0, 0, 0, 0)
  if (step >= 30) d.setDate(1) // awal bulan
  else if (step >= 7) d.setDate(d.getDate() + ((8 - d.getDay()) % 7)) // Senin berikutnya
  while (d.getTime() <= end) {
    if (d.getTime() >= start) ticks.push(d.getTime())
    if (step >= 30) d.setMonth(d.getMonth() + step / 30)
    else d.setDate(d.getDate() + step)
  }
  return ticks
}

/** Posisi ms → persen di dalam rentang (dibatasi 0…100). */
export const pct = (ms, [start, end]) => Math.min(100, Math.max(0, ((ms - start) / (end - start)) * 100))

const fmtCache = new Map()
export function formatDate(ms, opts = { day: 'numeric', month: 'short' }, locale = 'id-ID') {
  const key = locale + JSON.stringify(opts)
  if (!fmtCache.has(key)) fmtCache.set(key, new Intl.DateTimeFormat(locale, opts))
  return fmtCache.get(key).format(ms)
}

export function formatDays(days) {
  const d = Math.round(Math.abs(days))
  return `${d} hari`
}

export function formatMoney(value, currency = 'IDR', locale = 'id-ID') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    notation: value >= 1e9 ? 'compact' : 'standard',
    maximumFractionDigits: value >= 1e9 ? 1 : 0,
  }).format(value)
}
