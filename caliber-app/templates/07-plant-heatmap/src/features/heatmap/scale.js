// Logika murni heatmap — TIDAK bergantung pada React (bisa dipakai di backend / tes)

/* ---------- warna: interpolasi di ruang OKLab (gradasi rata secara persepsi) ---------- */

const hexToRgb = (hex) => {
  const h = hex.replace('#', '')
  const f = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16) / 255)
}
const toLin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const toSrgb = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)

function hexToOklab(hex) {
  const [r, g, b] = hexToRgb(hex).map(toLin)
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

function oklabToHex([L, A, B]) {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3
  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
  return (
    '#' +
    rgb
      .map((c) => Math.round(Math.min(1, Math.max(0, toSrgb(c))) * 255).toString(16).padStart(2, '0'))
      .join('')
  )
}

/** makeColorScale(['#hex', ...]) → (t ∈ [0,1]) => '#hex'. Stop dibagi rata. */
export function makeColorScale(stops) {
  const labs = stops.map(hexToOklab)
  const n = labs.length - 1
  return (t) => {
    const x = Math.min(1, Math.max(0, Number.isFinite(t) ? t : 0)) * n
    const i = Math.min(n - 1, Math.floor(x))
    const f = x - i
    return oklabToHex(labs[i].map((v, k) => v + (labs[i + 1][k] - v) * f))
  }
}

/** Warna teks yang terbaca di atas `hex` (gelap / terang). */
export function textOn(hex) {
  const [r, g, b] = hexToRgb(hex).map(toLin)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.22 ? '#0b1120' : '#f8fafc'
}

/** CSS linear-gradient untuk legenda. */
export function gradientCss(stops, dir = 'to right') {
  const scale = makeColorScale(stops)
  const steps = 12
  return `linear-gradient(${dir}, ${Array.from({ length: steps + 1 }, (_, i) => scale(i / steps)).join(', ')})`
}

/* ---------- nilai & domain ---------- */

export const isNum = (v) => typeof v === 'number' && Number.isFinite(v)

/** Ambil nilai unit untuk satu layer dari `data` = { [unitId]: { [layerId]: number } }. */
export const valueOf = (data, unitId, layerId) => {
  const v = data?.[unitId]?.[layerId]
  return isNum(v) ? v : null
}

function niceCeil(v) {
  if (v <= 0) return 1
  const p = 10 ** Math.floor(Math.log10(v))
  const m = v / p
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p
}

/**
 * Domain [min, max] untuk layer. `layer.domain` dipakai bila ada (DISARANKAN — skala
 * terkunci → warna tidak "bergeser" saat data berubah). Kalau tidak: 0 … nilai maks dibulatkan.
 */
export function layerDomain(layer, units, data) {
  if (layer.domain) return layer.domain
  const vals = units.map((u) => valueOf(data, u.id, layer.id)).filter(isNum)
  const lo = Math.min(0, ...vals)
  return [lo, niceCeil(Math.max(lo + 1e-9, ...vals))]
}

export const normalize = (v, [lo, hi]) => (hi === lo ? 0 : Math.min(1, Math.max(0, (v - lo) / (hi - lo))))

/** Unit diurutkan dari nilai tertinggi (unit tanpa data dibuang). */
export function rankUnits(units, data, layerId) {
  return units
    .map((unit) => ({ unit, value: valueOf(data, unit.id, layerId) }))
    .filter((r) => r.value !== null)
    .sort((a, b) => b.value - a.value)
}

/** Ringkasan layer: total, rata-rata, jumlah unit di atas ambang, unit tanpa data. */
export function layerStats(layer, units, data) {
  const ranked = rankUnits(units, data, layer.id)
  const total = ranked.reduce((s, r) => s + r.value, 0)
  const mean = ranked.length ? total / ranked.length : 0
  const agg = layer.aggregate ?? 'sum'
  return {
    total,
    mean,
    // nilai ringkasan sesuai sifat besaran: energi/emisi dijumlah, skor dirata-rata
    summary: agg === 'mean' ? mean : agg === 'max' ? (ranked[0]?.value ?? 0) : total,
    max: ranked[0] ?? null,
    alerts: isNum(layer.alert) ? ranked.filter((r) => r.value >= layer.alert).length : 0,
    missing: units.length - ranked.length,
  }
}

export function formatValue(v, layer) {
  if (!isNum(v)) return '—'
  const d = layer.digits ?? 0
  return v.toLocaleString(layer.locale ?? 'id-ID', { minimumFractionDigits: d, maximumFractionDigits: d })
}

/** Titik tengah unit (koordinat viewBox) — untuk tooltip, glow, label. */
export function unitCenter(u) {
  return [u.x + u.w / 2, u.y + u.h / 2]
}
