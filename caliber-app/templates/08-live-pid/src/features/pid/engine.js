// Logika murni modul P&ID — TANPA React. Bisa dipakai di backend, tes, atau laporan.

/** Warna default per medium proses. Host bisa menimpa lewat prop `media`. */
export const DEFAULT_MEDIA = {
  hydrocarbon: { label: 'Hidrokarbon', color: '#38bdf8' },
  steam: { label: 'Steam', color: '#f472b6' },
  condensate: { label: 'Kondensat', color: '#a78bfa' },
  gas: { label: 'Gas', color: '#facc15' },
  water: { label: 'Air pendingin', color: '#2dd4bf' },
  product: { label: 'Produk', color: '#4ade80' },
}

/** Urutan keparahan status — dipakai untuk mencari status terburuk. */
export const STATUS_RANK = { nodata: 0, ok: 1, warn: 2, alarm: 3 }

/**
 * Status satu tag terhadap batasnya.
 * limits: { lolo?, lo?, hi?, hihi? } untuk analog; tag diskret memakai `alarmStates: [nilai…]`.
 * @returns 'ok' | 'warn' | 'alarm' | 'nodata'
 */
export function statusOf(def, value) {
  if (value == null || Number.isNaN(value)) return 'nodata'
  if (def?.states) return def.alarmStates?.includes(value) ? 'alarm' : 'ok'
  const l = def?.limits
  if (!l) return 'ok'
  if ((l.lolo != null && value <= l.lolo) || (l.hihi != null && value >= l.hihi)) return 'alarm'
  if ((l.lo != null && value <= l.lo) || (l.hi != null && value >= l.hi)) return 'warn'
  return 'ok'
}

/** Teks batas yang dilanggar, mis. "HI ≥ 80" — untuk tooltip/kartu. */
export function limitBreached(def, value) {
  const l = def?.limits
  if (!l || value == null) return null
  if (l.hihi != null && value >= l.hihi) return `HH ≥ ${formatValue(def, l.hihi)}`
  if (l.lolo != null && value <= l.lolo) return `LL ≤ ${formatValue(def, l.lolo)}`
  if (l.hi != null && value >= l.hi) return `H ≥ ${formatValue(def, l.hi)}`
  if (l.lo != null && value <= l.lo) return `L ≤ ${formatValue(def, l.lo)}`
  return null
}

/** Format angka sesuai definisi tag (locale id-ID, digit dari `digits`). */
export function formatValue(def, value, locale = 'id-ID') {
  if (value == null || Number.isNaN(value)) return '—'
  if (def?.states) return def.states[value] ?? String(value)
  const d = def?.digits ?? 1
  return value.toLocaleString(locale, { minimumFractionDigits: d, maximumFractionDigits: d })
}

/** Status terburuk dari daftar tag — untuk ringkasan / badge. */
export function worstStatus(tags, values) {
  let worst = 'nodata'
  for (const def of tags) {
    const s = statusOf(def, values[def.tag])
    if (STATUS_RANK[s] > STATUS_RANK[worst]) worst = s
  }
  return worst
}

/** Hitung status semua tag sekaligus: { [tag]: status }. */
export function evaluateTags(tags, values) {
  return Object.fromEntries(tags.map((d) => [d.tag, statusOf(d, values[d.tag])]))
}

/** "FIC-101" → { letters: 'FIC', loop: '101' } — isi gelembung instrumen ISA-5.1. */
export function splitTag(tag) {
  const m = /^([A-Za-z]+)[-\s]?(.*)$/.exec(tag)
  return m ? { letters: m[1].toUpperCase(), loop: m[2] } : { letters: tag, loop: '' }
}

/** Polyline [[x,y],…] → atribut `d` SVG. Sudut dibulatkan dengan radius `r` (0 = tajam). */
export function pointsToPath(points, r = 8) {
  if (!points?.length) return ''
  if (points.length < 3 || r <= 0) return 'M' + points.map((p) => p.join(' ')).join(' L')
  let d = `M${points[0][0]} ${points[0][1]}`
  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = points[i - 1]
    const [x, y] = points[i]
    const [nx, ny] = points[i + 1]
    const a = Math.min(r, Math.hypot(x - px, y - py) / 2, Math.hypot(nx - x, ny - y) / 2)
    const ux = Math.sign(x - px) * a
    const uy = Math.sign(y - py) * a
    const vx = Math.sign(nx - x) * a
    const vy = Math.sign(ny - y) * a
    d += ` L${x - ux} ${y - uy} Q${x} ${y} ${x + vx} ${y + vy}`
  }
  const last = points[points.length - 1]
  return d + ` L${last[0]} ${last[1]}`
}

/** Titik di tengah panjang polyline — jangkar label jalur. */
export function midpoint(points) {
  const segs = []
  let total = 0
  for (let i = 1; i < points.length; i++) {
    const len = Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1])
    segs.push(len)
    total += len
  }
  let half = total / 2
  for (let i = 0; i < segs.length; i++) {
    if (half <= segs[i]) {
      const t = segs[i] ? half / segs[i] : 0
      const [ax, ay] = points[i]
      const [bx, by] = points[i + 1]
      return [ax + (bx - ax) * t, ay + (by - ay) * t]
    }
    half -= segs[i]
  }
  return points[0]
}

/**
 * Laju alir ternormalisasi untuk animasi jalur: −1 … 1 (tanda = arah).
 * line.flowTag menunjuk tag mana pun; skala dari line.flowMax, atau def.max tag tsb.
 */
export function flowNorm(line, values, defsByTag) {
  if (!line.flowTag) return line.kind === 'signal' ? 0 : null // null = tanpa info alir
  const v = values[line.flowTag]
  if (v == null) return null
  const max = line.flowMax ?? defsByTag[line.flowTag]?.max ?? 100
  return Math.max(-1, Math.min(1, v / max))
}

/** Rasio 0…1 sebuah nilai di rentang tag (untuk bar/level). */
export function fraction(def, value) {
  if (value == null) return 0
  const lo = def?.min ?? 0
  const hi = def?.max ?? 100
  return Math.max(0, Math.min(1, (value - lo) / (hi - lo || 1)))
}

/** Index tag: { [tag]: def } */
export const indexTags = (tags) => Object.fromEntries(tags.map((d) => [d.tag, d]))

/** Kotak pembatas peralatan (untuk label/tooltip) — sesuai tipe simbol. */
export function equipmentBox(eq) {
  if (eq.type === 'pump') {
    const r = eq.r ?? 22
    return { x: eq.x - r, y: eq.y - r, w: 2 * r, h: 2 * r }
  }
  if (eq.type === 'valve') {
    const s = eq.size ?? 13
    return { x: eq.x - s, y: eq.y - s * 2.2, w: 2 * s, h: s * 3.4 }
  }
  return { x: eq.x, y: eq.y, w: eq.w, h: eq.h }
}
