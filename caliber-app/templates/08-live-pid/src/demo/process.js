// DEMO: unit pemanasan umpan → separator (angka ilustratif) + simulator proses sederhana.
// Di project nyata: DIAGRAM & TAGS dari file config, `values` dari API/WebSocket historian.

export const DIAGRAM = {
  width: 1040,
  height: 540,
  equipment: [
    { id: 'TK-101', type: 'tank', label: 'Tangki umpan', x: 70, y: 120, w: 110, h: 200, levelTag: 'LT-101', medium: 'hydrocarbon', labelDx: -12 },
    { id: 'P-101', type: 'pump', label: 'Pompa umpan', x: 250, y: 420, r: 22, runTag: 'P-101' },
    { id: 'FV-101', type: 'valve', label: '', x: 420, y: 360, positionTag: 'FV-101' },
    { id: 'E-101', type: 'exchanger', label: 'Pemanas umpan', x: 520, y: 335, w: 160, h: 50 },
    { id: 'TV-102', type: 'valve', label: '', x: 560, y: 250, vertical: true, positionTag: 'TV-102', labelDx: -38 },
    { id: 'V-102', type: 'vessel', label: 'Separator', x: 800, y: 110, w: 90, h: 290, levelTag: 'LT-103', medium: 'product', labelDx: -62 },
    { id: 'LV-103', type: 'valve', label: '', x: 915, y: 470, positionTag: 'LV-103' },
  ],
  lines: [
    // proses — `flowTag` menentukan laju & arah animasi
    { id: 'L0', kind: 'process', medium: 'hydrocarbon', points: [[100, 40], [100, 120]], flowTag: 'FI-100', fromLabel: 'Umpan dari hulu' },
    { id: 'L1', kind: 'process', medium: 'hydrocarbon', points: [[160, 320], [160, 420], [228, 420]], flowTag: 'FT-101' },
    { id: 'L2', kind: 'process', medium: 'hydrocarbon', points: [[250, 398], [250, 360], [407, 360]], flowTag: 'FT-101', arrow: false },
    { id: 'L3', kind: 'process', medium: 'hydrocarbon', points: [[433, 360], [520, 360]], flowTag: 'FT-101' },
    { id: 'L4', kind: 'process', medium: 'hydrocarbon', points: [[680, 360], [780, 360], [780, 260], [800, 260]], flowTag: 'FT-101', tags: ['TT-102'] },
    { id: 'L7', kind: 'process', medium: 'gas', points: [[845, 110], [845, 60], [960, 60]], flowTag: 'FI-104', toLabel: 'Gas', tags: ['PT-103'] },
    { id: 'L8', kind: 'process', medium: 'product', points: [[845, 400], [845, 470], [902, 470]], flowTag: 'FI-106', arrow: false },
    { id: 'L9', kind: 'process', medium: 'product', points: [[928, 470], [985, 470]], flowTag: 'FI-106', toLabel: 'Produk' },
    // utilitas
    { id: 'L5', kind: 'utility', medium: 'steam', points: [[560, 140], [560, 237]], flowTag: 'FI-105', fromLabel: 'Steam LP', arrow: false },
    { id: 'L6', kind: 'utility', medium: 'steam', points: [[560, 263], [560, 335]], flowTag: 'FI-105' },
    { id: 'L10', kind: 'utility', medium: 'condensate', points: [[658, 385], [658, 470], [710, 470]], flowTag: 'FI-105', toLabel: 'Kondensat' },
    // sinyal kontrol (garis putus-putus) — `tags` = tag yang menyorot jalur ini
    { id: 'S1', kind: 'signal', points: [[330, 284], [330, 262], [404, 262]], tags: ['FT-101', 'FV-101'] },
    { id: 'S2', kind: 'signal', points: [[420, 278], [420, 330]], tags: ['FT-101', 'FV-101'] },
    { id: 'S3', kind: 'signal', points: [[714, 300], [640, 300], [640, 266]], tags: ['TT-102', 'TV-102'] },
    { id: 'S4', kind: 'signal', points: [[624, 250], [590, 250]], tags: ['TT-102', 'TV-102'] },
    { id: 'S5', kind: 'signal', points: [[930, 316], [930, 350], [915, 350], [915, 379]], tags: ['LT-103', 'LV-103'] },
    { id: 'S6', kind: 'signal', points: [[915, 411], [915, 437]], tags: ['LT-103', 'LV-103'] },
  ],
  instruments: [
    // x,y = pusat gelembung · anchor = titik sambung ke proses · chip = posisi nilai live
    { tag: 'LT-101', x: 215, y: 220, anchor: [180, 220], chip: 'right' },
    { tag: 'FT-101', x: 330, y: 300, anchor: [330, 360], chip: 'left', loopTags: ['FV-101'] },
    { tag: 'FIC-101', x: 420, y: 262, mount: 'dcs', valueTag: 'FT-101', chip: false, loopTags: ['FV-101'] },
    { tag: 'FI-105', x: 500, y: 180, anchor: [560, 180], chip: 'left' },
    { tag: 'TT-102', x: 730, y: 300, anchor: [730, 360], chip: 'top', loopTags: ['TV-102'] },
    { tag: 'TIC-102', x: 640, y: 250, mount: 'dcs', valueTag: 'TT-102', chip: false, loopTags: ['TV-102'] },
    { tag: 'PT-103', x: 905, y: 105, anchor: [905, 60], chip: 'right' },
    { tag: 'LT-103', x: 930, y: 300, anchor: [890, 300], chip: 'right', loopTags: ['LV-103'] },
    { tag: 'LIC-103', x: 915, y: 395, mount: 'dcs', valueTag: 'LT-103', chip: false, loopTags: ['LV-103'] },
  ],
}

export const TAGS = [
  { tag: 'FT-101', label: 'Laju umpan ke E-101', unit: 'm³/h', digits: 1, min: 0, max: 80, limits: { lolo: 10, lo: 25 }, spTag: 'FIC-101.SP' },
  { tag: 'P-101', label: 'Status pompa umpan', states: ['Mati', 'Jalan'], alarmStates: [0] },
  { tag: 'LT-101', label: 'Level tangki umpan', unit: '%', digits: 1, min: 0, max: 100, limits: { lolo: 10, lo: 20, hi: 80, hihi: 90 } },
  { tag: 'FV-101', label: 'Bukaan valve umpan (output FIC)', unit: '%', digits: 0, min: 0, max: 100, limits: { hi: 90, hihi: 98 } },
  { tag: 'TT-102', label: 'Suhu keluar E-101', unit: '°C', digits: 1, min: 20, max: 140, limits: { lolo: 65, lo: 75, hi: 95, hihi: 105 }, spTag: 'TIC-102.SP' },
  { tag: 'TV-102', label: 'Bukaan valve steam (output TIC)', unit: '%', digits: 0, min: 0, max: 100, limits: { hi: 90, hihi: 98 } },
  { tag: 'FI-105', label: 'Laju steam LP', unit: 't/h', digits: 2, min: 0, max: 6 },
  { tag: 'PT-103', label: 'Tekanan separator', unit: 'barg', digits: 2, min: 0, max: 6, limits: { lo: 2.5, hi: 4, hihi: 4.5 } },
  { tag: 'LT-103', label: 'Level separator', unit: '%', digits: 1, min: 0, max: 100, limits: { lolo: 15, lo: 25, hi: 75, hihi: 85 }, spTag: 'LIC-103.SP' },
  { tag: 'LV-103', label: 'Bukaan valve produk (output LIC)', unit: '%', digits: 0, min: 0, max: 100 },
  { tag: 'FI-100', label: 'Umpan masuk tangki', unit: 'm³/h', digits: 1, min: 0, max: 80 },
  { tag: 'FI-104', label: 'Gas keluar separator', unit: 't/h', digits: 2, min: 0, max: 10 },
  { tag: 'FI-106', label: 'Produk cair', unit: 'm³/h', digits: 1, min: 0, max: 80 },
]

/* ---------------------------------------------------------- simulator demo */

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
const noise = (a) => (Math.random() - 0.5) * a

export const INITIAL_STATE = { t: 0, F: 40, fvI: 52.6, LT1: 50, T: 85, tvI: 59, LT3: 50, lvI: 42.5 }

/**
 * Satu langkah simulasi (dinamika orde-1 + kontroler PI sederhana).
 * inputs: { pumpOn, fouling 0…1, spFlow, spTemp, spLevel }
 * @returns { state, values }
 */
export function step(s, dt, inputs) {
  const { pumpOn, fouling, spFlow, spTemp, spLevel } = inputs
  const t = s.t + dt
  const Fin = 40 + 2 * Math.sin(t / 7) + noise(0.6)

  // FIC-101 → FV-101 → laju umpan (pompa mati → laju 0, kontroler wind-up ke 100 %)
  const eF = spFlow - s.F
  const fvI = clamp(s.fvI + eF * 0.9 * dt, 0, 100)
  const fv = clamp(fvI + eF * 0.6, 0, 100)
  const Ftarget = pumpOn ? 80 * (fv / 100) * 0.95 : 0
  const F = Math.max(0, s.F + ((Ftarget - s.F) * dt) / 1.2)

  const LT1 = clamp(s.LT1 + (Fin - F) * dt * 0.06, 0, 99)

  // TIC-102 → TV-102 → steam → suhu (fouling menurunkan koefisien perpindahan panas)
  const eT = spTemp - s.T
  const tvI = clamp(s.tvI + eT * 1.1 * dt, 0, 100)
  const tv = clamp(tvI + eT * 1.5, 0, 100)
  const steam = (6 * tv) / 100
  const k = 17 * (1 - 0.6 * fouling)
  const Ttarget = Math.min(140, 30 + (k * steam * 40) / (F + 4))
  const T = s.T + ((Ttarget - s.T) * dt) / 3

  // LIC-103 → LV-103 → produk cair (aksi terbalik: level naik → buka valve)
  const eL = s.LT3 - spLevel
  const lvI = clamp(s.lvI + eL * 0.8 * dt, 0, 100)
  const lv = clamp(lvI + eL * 1.2, 0, 100)
  const Fprod = s.LT3 > 1 ? (80 * lv) / 100 : 0
  const LT3 = clamp(s.LT3 + (F * 0.85 - Fprod) * dt * 0.08, 0, 100)

  const state = { t, F, fvI, LT1, T, tvI, LT3, lvI }
  const values = {
    'FI-100': Fin,
    'LT-101': LT1,
    'P-101': pumpOn ? 1 : 0,
    'FT-101': F + noise(0.4) * (F > 0.5),
    'FV-101': fv,
    'FIC-101.SP': spFlow,
    'TT-102': T + noise(0.3),
    'TV-102': tv,
    'TIC-102.SP': spTemp,
    'FI-105': steam,
    'PT-103': 3.2 + 0.35 * (F / 40 - 1) + noise(0.04),
    'FI-104': F * 0.12 + noise(0.05) * (F > 0.5),
    'LT-103': LT3,
    'LV-103': lv,
    'LIC-103.SP': spLevel,
    'FI-106': Fprod,
  }
  return { state, values }
}
