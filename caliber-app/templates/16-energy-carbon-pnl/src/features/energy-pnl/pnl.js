// Logika murni Energy & Carbon P&L — tanpa React.
//
// Per unit proses:
//   SEC (GJ/t)          = Σ energi (GJ) / produksi (t)
//   Biaya energi (US$/t)= Σ (kuantitas × harga carrier) / produksi
//   Intensitas (tCO₂e/t)= Σ (kuantitas × faktor emisi) / produksi
//   Biaya karbon (US$/t)= intensitas × harga karbon
//   Gap vs benchmark    = (SEC − SEC benchmark) × produksi × harga energi rata-rata unit (US$/thn)
// Hasilnya: energi & emisi menjadi baris biaya yang bisa dibandingkan antar unit.

export const GJ_PER = { GJ: 1, MWh: 3.6, MMBtu: 1.055056, t: 1 }

/** Konversi kuantitas carrier ke GJ. */
export const toGJ = (qty, unit = 'GJ') => qty * (GJ_PER[unit] ?? 1)

/**
 * carriers: { [key]: { label, unit: 'GJ'|'MWh'|'MMBtu', price (US$/unit), ef (tCO₂e/unit), scope } }
 * unit: { id, name, product, production (t), energy: { [carrierKey]: qty }, benchmarkSec? (GJ/t) }
 */
export function unitPnl(unit, carriers, { carbonPrice = 0 } = {}) {
  const t = Math.max(1e-9, unit.production ?? 0)
  const lines = Object.entries(carriers).map(([key, c]) => {
    const qty = unit.energy?.[key] ?? 0
    const gj = toGJ(qty, c.unit)
    const cost = qty * (c.price ?? 0)
    const co2 = qty * (c.ef ?? 0)
    return { key, label: c.label, qty, gj, cost, co2, costPerT: cost / t, gjPerT: gj / t, co2PerT: co2 / t, carbonPerT: (co2 * carbonPrice) / t }
  })
  const sum = (k) => lines.reduce((s, l) => s + l[k], 0)
  const gj = sum('gj')
  const energyCost = sum('cost')
  const co2 = sum('co2')
  const sec = gj / t
  const avgPricePerGJ = gj ? energyCost / gj : 0
  const gapGJ = unit.benchmarkSec != null ? Math.max(0, sec - unit.benchmarkSec) * t : 0
  const gapEnergyCost = gapGJ * avgPricePerGJ
  const gapCarbon = gj ? (gapGJ / gj) * co2 * carbonPrice : 0
  return {
    ...unit,
    lines,
    gj,
    sec,
    energyCost,
    energyPerT: energyCost / t,
    co2,
    intensity: co2 / t,
    carbonCost: co2 * carbonPrice,
    carbonPerT: (co2 * carbonPrice) / t,
    totalPerT: (energyCost + co2 * carbonPrice) / t,
    total: energyCost + co2 * carbonPrice,
    avgPricePerGJ,
    secGapPct: unit.benchmarkSec ? sec / unit.benchmarkSec - 1 : null,
    gapCost: gapEnergyCost + gapCarbon, // US$ yang "bocor" karena SEC di atas benchmark
  }
}

export function plantPnl(units, carriers, opts = {}) {
  const rows = units.map((u) => unitPnl(u, carriers, opts))
  const sum = (k) => rows.reduce((s, r) => s + (r[k] ?? 0), 0)
  return {
    rows,
    energyCost: sum('energyCost'),
    carbonCost: sum('carbonCost'),
    co2: sum('co2'),
    gapCost: sum('gapCost'),
    total: sum('total'),
  }
}

export function formatUSD(v, { compact = true, digits } = {}) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: digits ?? (compact ? 1 : 0), minimumFractionDigits: digits ?? 0,
  }).format(v)
}

export const formatNum = (v, d = 1) => new Intl.NumberFormat('en-US', { maximumFractionDigits: d, minimumFractionDigits: d }).format(v)
