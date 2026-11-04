// DEMO: model neraca energi pabrik petrokimia (sederhana, angka ilustratif) dalam GJ/jam.
// Di project utama, `links` datang dari historian / API meter energi.
//
// Model ini selalu SEIMBANG (masuk = produk + kerugian): permintaan proses tetap, lalu
// tiga "tuas" efisiensi menentukan berapa fuel gas & listrik PLN yang dibutuhkan.

export const NODES = [
  // kolom 0 — sumber
  { id: 'fuel', label: 'Fuel gas', kind: 'fuel' },
  { id: 'grid', label: 'Listrik PLN', kind: 'power' },
  // kolom 1 — unit konversi
  { id: 'furnace', label: 'Cracking furnace', kind: 'unit' },
  { id: 'cogen', label: 'Cogen (GTG + HRSG)', kind: 'unit' },
  // kolom 2 — pembawa energi
  { id: 'steam', label: 'Header steam', kind: 'steam' },
  { id: 'power', label: 'Jaringan listrik', kind: 'power' },
  // kolom 3 — unit pemakai
  { id: 'comp', label: 'Kompresor gas', kind: 'unit' },
  { id: 'column', label: 'Kolom distilasi', kind: 'unit' },
  { id: 'pump', label: 'Pompa & utilitas', kind: 'unit' },
  // kolom 4 — tujuan akhir
  { id: 'product', label: 'Energi ke produk', kind: 'product' },
  { id: 'stack', label: 'Gas buang cerobong', kind: 'loss' },
  { id: 'cw', label: 'Air pendingin', kind: 'loss' },
  { id: 'vent', label: 'Steam venting & trap', kind: 'loss' },
  { id: 'misc', label: 'Rugi listrik & mekanik', kind: 'loss' },
]

export const LEVERS = {
  flueLoss: { label: 'Kerugian gas buang furnace', min: 0.08, max: 0.2, step: 0.005, unit: '%', hint: 'excess O₂ tinggi → panas terbuang ke cerobong' },
  steamLeak: { label: 'Kebocoran steam (trap & venting)', min: 0.01, max: 0.15, step: 0.005, unit: '%', hint: 'steam trap gagal terbuka' },
  pumpVsd: { label: 'Penghematan pompa (VSD)', min: 0, max: 0.4, step: 0.01, unit: '%', hint: 'ganti throttling valve dengan variable speed drive' },
}

export const PRESETS = {
  actual: { label: 'Kondisi aktual', flueLoss: 0.16, steamLeak: 0.085, pumpVsd: 0 },
  optimized: { label: 'Setelah optimasi', flueLoss: 0.1, steamLeak: 0.02, pumpVsd: 0.3 },
}

// konstanta proses (GJ/jam) & rasio konversi
const Q_PROCESS = 400 // panas reaksi cracking yang wajib masuk ke produk
const TLE = 0.19 // fraksi fuel furnace yang dipulihkan jadi steam (transfer-line exchanger)
const STEAM_COMP = 200 // turbin uap penggerak kompresor
const STEAM_COLUMN = 120 // reboiler kolom
const POWER_COMP = 55 // motor kompresor
const POWER_PUMP = 85 // pompa & utilitas tanpa VSD
const GRID_LOSS = 0.065 // rugi distribusi + trafo
const COGEN = { steam: 0.6, power: 0.24 } // sisanya (0.16) keluar lewat cerobong

export function plantLinks({ flueLoss, steamLeak, pumpVsd }) {
  // furnace: bahan bakar yang dibutuhkan agar Q_PROCESS terpenuhi
  const fFuel = Q_PROCESS / (1 - flueLoss - TLE)
  const fFlue = fFuel * flueLoss
  const fSteam = fFuel * TLE

  // steam: produksi = kebutuhan / (1 − bocor); kekurangan dari TLE ditutup cogen
  const steamGen = (STEAM_COMP + STEAM_COLUMN) / (1 - steamLeak)
  const cSteam = Math.max(0, steamGen - fSteam)
  const cFuel = cSteam / COGEN.steam
  const cPower = cFuel * COGEN.power
  const cStack = cFuel - cSteam - cPower

  // listrik: kekurangan dari cogen dibeli dari PLN
  const pPump = POWER_PUMP * (1 - pumpVsd)
  const powerNeed = (POWER_COMP + pPump) / (1 - GRID_LOSS)
  const grid = Math.max(0, powerNeed - cPower)
  const powerTotal = cPower + grid

  // pemakai akhir: pembagian ke produk vs kerugian
  const comp = STEAM_COMP + POWER_COMP
  return [
    { source: 'fuel', target: 'furnace', value: fFuel },
    { source: 'fuel', target: 'cogen', value: cFuel },
    { source: 'grid', target: 'power', value: grid },

    { source: 'furnace', target: 'product', value: Q_PROCESS },
    { source: 'furnace', target: 'steam', value: fSteam },
    { source: 'furnace', target: 'stack', value: fFlue },
    { source: 'cogen', target: 'steam', value: cSteam },
    { source: 'cogen', target: 'power', value: cPower },
    { source: 'cogen', target: 'stack', value: cStack },

    { source: 'steam', target: 'comp', value: STEAM_COMP },
    { source: 'steam', target: 'column', value: STEAM_COLUMN },
    { source: 'steam', target: 'vent', value: fSteam + cSteam - STEAM_COMP - STEAM_COLUMN },
    { source: 'power', target: 'comp', value: POWER_COMP },
    { source: 'power', target: 'pump', value: pPump },
    { source: 'power', target: 'misc', value: powerTotal - POWER_COMP - pPump },

    { source: 'comp', target: 'product', value: comp * 0.6 },
    { source: 'comp', target: 'cw', value: comp * 0.36 },
    { source: 'comp', target: 'misc', value: comp * 0.04 },
    { source: 'column', target: 'product', value: STEAM_COLUMN * 0.2 },
    { source: 'column', target: 'cw', value: STEAM_COLUMN * 0.8 },
    { source: 'pump', target: 'product', value: pPump * 0.35 },
    { source: 'pump', target: 'misc', value: pPump * 0.65 },
  ]
}

/** Total masukan pada kondisi terburuk → dipakai untuk mengunci skala lebar aliran. */
export function worstCaseInput() {
  const worst = { flueLoss: LEVERS.flueLoss.max, steamLeak: LEVERS.steamLeak.max, pumpVsd: LEVERS.pumpVsd.min }
  return plantLinks(worst)
    .filter((l) => l.source === 'fuel' || l.source === 'grid')
    .reduce((s, l) => s + l.value, 0)
}
