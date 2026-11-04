// DEMO: angka tahunan ilustratif kompleks petrokimia (fiktif, orde besaran saja).
// ef = faktor emisi (tCO₂e per unit carrier). Fuel gas ≈ 0,056 tCO₂/GJ; listrik grid Jawa-Bali ≈ 0,8 tCO₂/MWh;
// steam internal ≈ fuel boiler / efisiensi → ≈ 0,07 tCO₂/GJ.

export const carriers = {
  fuelGas: { label: 'Fuel gas', unit: 'GJ', price: 7.5, ef: 0.056, scope: 1, color: '#f97316' },
  steam: { label: 'Steam', unit: 'GJ', price: 9.5, ef: 0.07, scope: 1, color: '#a78bfa' },
  power: { label: 'Listrik', unit: 'MWh', price: 85, ef: 0.8, scope: 2, color: '#38bdf8' },
}

export const units = [
  { id: 'crk', name: 'Naphtha Cracker', product: 'Etilena', production: 900_000, benchmarkSec: 22,
    energy: { fuelGas: 19_800_000, steam: 2_400_000, power: 260_000 } },
  { id: 'bd', name: 'Butadiene', product: 'Butadiena', production: 137_000, benchmarkSec: 6.5,
    energy: { fuelGas: 120_000, steam: 980_000, power: 22_000 } },
  { id: 'pe', name: 'Polyethylene', product: 'PE', production: 736_000, benchmarkSec: 2.6,
    energy: { fuelGas: 0, steam: 520_000, power: 470_000 } },
  { id: 'pp', name: 'Polypropylene', product: 'PP', production: 590_000, benchmarkSec: 2.2,
    energy: { fuelGas: 0, steam: 300_000, power: 330_000 } },
  { id: 'mtbe', name: 'MTBE / Butene-1', product: 'MTBE', production: 127_000, benchmarkSec: 4.2,
    energy: { fuelGas: 60_000, steam: 520_000, power: 14_000 } },
]
