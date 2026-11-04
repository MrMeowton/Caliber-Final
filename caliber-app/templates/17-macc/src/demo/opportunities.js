// DEMO: peluang efisiensi energi/emisi ilustratif kompleks petrokimia (fiktif).
// energySaved per tahun (unit carrier); abatement dihitung dari faktor emisi kecuali diisi langsung.

export const carriers = {
  fuelGas: { price: 7.5, ef: 0.056 }, // US$/GJ, tCO₂e/GJ
  steam: { price: 9.5, ef: 0.07 },
  power: { price: 85, ef: 0.8 }, // US$/MWh, tCO₂e/MWh
}

export const opportunities = [
  { id: 'trap', name: 'Program steam trap', unit: 'Utilitas', capex: 250_000, life: 5, opexDelta: 30_000, energySaved: { steam: 120_000 } },
  { id: 'o2', name: 'Kontrol O₂ excess furnace', unit: 'Cracker', capex: 900_000, life: 10, energySaved: { fuelGas: 420_000 } },
  { id: 'led', name: 'Lampu LED + sensor', unit: 'Seluruh site', capex: 400_000, life: 12, energySaved: { power: 2_600 } },
  { id: 'vfd', name: 'VFD pompa & fan', unit: 'PE / PP', capex: 2_200_000, life: 15, energySaved: { power: 14_000 } },
  { id: 'apc', name: 'APC cracker (MPC)', unit: 'Cracker', capex: 3_000_000, life: 10, opexDelta: 150_000, energySaved: { fuelGas: 650_000 } },
  { id: 'insul', name: 'Perbaikan insulasi', unit: 'Utilitas', capex: 600_000, life: 15, energySaved: { steam: 90_000 } },
  { id: 'flare', name: 'Flare gas recovery', unit: 'Utilitas', capex: 6_500_000, life: 20, opexDelta: 250_000, annualSavings: 1_100_000, abatement: 48_000 },
  { id: 'cogen', name: 'Upgrade kogenerasi (GT + HRSG)', unit: 'Utilitas', capex: 38_000_000, life: 25, opexDelta: 600_000, energySaved: { power: 95_000, fuelGas: -520_000 } },
  { id: 'heatint', name: 'Heat integration (pinch)', unit: 'Butadiene', capex: 4_500_000, life: 20, energySaved: { steam: 310_000 } },
  { id: 'solar', name: 'PLTS atap 15 MWp', unit: 'Gudang & kantor', capex: 11_000_000, life: 25, opexDelta: 150_000, energySaved: { power: 20_000 } },
  { id: 'elec', name: 'Elektrifikasi kompresor', unit: 'Cracker', capex: 55_000_000, life: 25, opexDelta: -400_000, energySaved: { fuelGas: 2_100_000, power: -60_000 } },
  { id: 'ccs', name: 'Pilot CCS flue gas', unit: 'Cracker', capex: 60_000_000, life: 20, opexDelta: 4_500_000, abatement: 120_000 },
]
