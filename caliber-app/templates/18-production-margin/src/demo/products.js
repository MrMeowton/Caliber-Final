// DEMO: produksi bulanan ilustratif (ton) Nov 2024 – Okt 2026 + harga & biaya variabel (fiktif).
// Di produksi: history dari MES/historian, harga dari market (ICIS/Platts), plan dari S&OP.

let seed = 11
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5)

// base t/bln, tren t/bln, noise, dip (bulan ke-i: faktor) — mis. turnaround / gangguan
function series(base, trend, noise, dips = {}) {
  return Array.from({ length: 24 }, (_, i) => Math.round((base + trend * i) * (dips[i] ?? 1) + noise * rnd() * 2))
}

export const startMonth = '2024-11'

export const products = [
  { id: 'eth', name: 'Etilena (merchant)', unit: 'Cracker', price: 920, variableCost: 640, capacity: 26_000, plan: 24_000,
    history: series(23_500, -60, 900, { 9: 0.7, 10: 0.85, 21: 0.92, 22: 0.9 }) },
  { id: 'pe', name: 'Polyethylene', unit: 'PE plant', price: 1_120, variableCost: 960, capacity: 64_000, plan: 61_000,
    history: series(60_000, 40, 1_800, { 15: 0.88 }) },
  { id: 'pp', name: 'Polypropylene', unit: 'PP plant', price: 1_060, variableCost: 900, capacity: 50_000, plan: 48_500,
    history: series(46_500, -90, 1_500, { 20: 0.9, 23: 0.93 }) },
  { id: 'bd', name: 'Butadiena', unit: 'BD plant', price: 1_350, variableCost: 980, capacity: 11_800, plan: 11_000,
    history: series(10_800, -25, 450, { 18: 0.82 }) },
  { id: 'py', name: 'Pygas', unit: 'Cracker', price: 760, variableCost: 610, capacity: 36_000, plan: 33_000,
    history: series(32_000, 15, 1_200) },
]
