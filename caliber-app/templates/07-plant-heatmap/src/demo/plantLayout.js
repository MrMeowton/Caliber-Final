// DEMO: denah pabrik petrokimia & data ilustratif (bukan data riil)
// Koordinat dalam viewBox 1000 × 600. Di project utama: geometri dari file config /
// hasil gambar CAD, nilai dari API historian/meter.

export const VIEW = { width: 1000, height: 600 }

const furnaces = [50, 120, 190, 260, 330].map((x, i) => ({
  id: `F-10${i + 1}`,
  label: `Tungku cracker F-10${i + 1}`,
  tag: `F-10${i + 1}`,
  x,
  y: 70,
  w: 56,
  h: 110,
  area: 'cracker',
}))

const tanks = [
  [575, 350],
  [665, 350],
  [575, 450],
  [665, 450],
].map(([x, y], i) => ({
  id: `TK-${i + 1}`,
  label: `Tangki produk TK-${i + 1}`,
  tag: `TK-${i + 1}`,
  x,
  y,
  w: 70,
  h: 70,
  shape: 'circle',
  area: 'tank',
}))

export const UNITS = [
  ...furnaces,
  { id: 'Q-201', label: 'Quench tower Q-201', tag: 'Q-201', x: 412, y: 66, w: 70, h: 70, shape: 'circle' },
  { id: 'C-301', label: 'Kompresor gas C-301', tag: 'C-301', x: 400, y: 160, w: 105, h: 62 },
  { id: 'T-401', label: 'Cold box & fraksinasi', tag: 'T-401', x: 50, y: 205, w: 150, h: 60 },
  { id: 'BD-500', label: 'Unit butadiena', tag: 'BD-500', x: 220, y: 205, w: 166, h: 60 },

  { id: 'B-01', label: 'Boiler utilitas B-01', tag: 'B-01', x: 575, y: 70, w: 90, h: 72 },
  { id: 'B-02', label: 'Boiler utilitas B-02', tag: 'B-02', x: 680, y: 70, w: 90, h: 72 },
  { id: 'GTG', label: 'Turbin gas kogenerasi', tag: 'GTG', x: 785, y: 70, w: 160, h: 72 },
  { id: 'CT-1', label: 'Menara pendingin CT-1', tag: 'CT-1', x: 575, y: 170, w: 195, h: 62 },
  { id: 'WWTP', label: 'Pengolahan air limbah', tag: 'WWTP', x: 785, y: 170, w: 160, h: 62 },

  { id: 'PE-1', label: 'Pabrik polietilena PE-1', tag: 'PE-1', x: 50, y: 345, w: 205, h: 92 },
  { id: 'PP-1', label: 'Pabrik polipropilena PP-1', tag: 'PP-1', x: 275, y: 345, w: 205, h: 92 },
  { id: 'WH', label: 'Gudang produk', tag: 'Gudang', x: 50, y: 462, w: 265, h: 72 },
  { id: 'CCR', label: 'Ruang kontrol pusat', tag: 'CCR', x: 335, y: 462, w: 145, h: 72 },

  ...tanks,
  { id: 'JTY', label: 'Dermaga muat', tag: 'Dermaga', x: 765, y: 345, w: 80, h: 180 },
  { id: 'FL', label: 'Flare FL-1', tag: 'Flare', x: 880, y: 395, w: 62, h: 62, shape: 'circle' },
]

// [energi GJ/jam, emisi tCO₂e/jam, skor risiko]. null = meter tidak ada
const BASE = {
  'F-101': [225, 12.6, 52],
  'F-102': [238, 13.3, 55],
  'F-103': [262, 14.8, 63],
  'F-104': [220, 12.3, 50],
  'F-105': [205, 11.5, 48],
  'Q-201': [18, 0.6, 38],
  'C-301': [135, 2.4, 58],
  'T-401': [42, 0.9, 44],
  'BD-500': [58, 1.8, 66],
  'B-01': [190, 10.6, 46],
  'B-02': [176, 9.9, 42],
  GTG: [245, 13.0, 49],
  'CT-1': [16, 0.5, 22],
  WWTP: [9, 0.3, 28],
  'PE-1': [82, 3.1, 40],
  'PP-1': [68, 2.6, 37],
  WH: [3, null, 12],
  CCR: [1.2, 0.1, 8],
  'TK-1': [2, 0.1, 35],
  'TK-2': [2.4, 0.1, 41],
  'TK-3': [2.1, 0.1, 73],
  'TK-4': [1.8, 0.1, 38],
  JTY: [6, 0.4, 45],
  FL: [34, 6.8, 57],
}

export const DOMAINS = { energy: [0, 300], emission: [0, 16] }

/**
 * Data pada waktu t (detik). `anomaly` 0…1 = seberapa jauh gangguan kompresor C-301
 * berkembang (fouling → konsumsi steam naik, getaran & risiko naik).
 */
export function plantData(t, anomaly = 0) {
  const out = {}
  Object.entries(BASE).forEach(([id, [e, em, r]], i) => {
    const w = Math.sin(t * 0.55 + i * 1.7) * 0.5 + Math.sin(t * 0.21 + i) * 0.5 // −1…1
    let energy = e * (1 + 0.05 * w)
    let emission = em === null ? null : em * (1 + 0.05 * w)
    let risk = r + 3 * w
    if (id === 'C-301') {
      energy *= 1 + 0.6 * anomaly
      emission *= 1 + 0.7 * anomaly
      risk += 34 * anomaly
    }
    if (id === 'B-01' || id === 'B-02') energy *= 1 + 0.12 * anomaly // boiler ikut menanggung steam ekstra
    out[id] = { energy, emission, risk: Math.min(100, Math.max(0, risk)) }
  })
  return out
}

/** Denah statis — digambar di bawah unit (prop `backdrop`). */
export const AREAS = [
  { label: 'Area cracker', x: 30, y: 30, w: 490, h: 255 },
  { label: 'Utilitas', x: 555, y: 30, w: 410, h: 225 },
  { label: 'Polimer & gudang', x: 30, y: 318, w: 470, h: 236 },
  { label: 'Tank farm & dermaga', x: 555, y: 318, w: 410, h: 236 },
]
