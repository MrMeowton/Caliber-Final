// DEMO: data ilustratif kompleks petrokimia — BUKAN data nyata.
// Angka hari relatif terhadap hari ini (format yang sama dengan output model RUL).
// Di project utama: failure dari model prediktif, part dari ERP / SAP MM.

export const DEMO_ITEMS = [
  {
    id: 'C-301',
    asset: 'Kompresor C-301',
    area: 'Cracker',
    failure: { p10: 9, p50: 14, p90: 21 },
    part: { name: 'Bearing thrust DE', leadTimeDays: 28, supplier: 'Impor (Jerman)' },
    downtimeCostPerDay: 4_200_000_000,
  },
  {
    id: 'P-205B',
    asset: 'Pompa P-205B',
    area: 'Utilitas',
    failure: { p10: 16, p50: 22, p90: 30 },
    part: { name: 'Mechanical seal', leadTimeDays: 21, orderedAt: -3, supplier: 'Distributor lokal' },
    downtimeCostPerDay: 350_000_000,
  },
  {
    id: 'F-101',
    asset: 'Tungku F-101',
    area: 'Cracker',
    failure: { p10: 35, p50: 48, p90: 62 },
    part: { name: 'Tube coil radiant', leadTimeDays: 45, supplier: 'Impor (Jepang)' },
    downtimeCostPerDay: 6_000_000_000,
  },
  {
    id: 'K-410',
    asset: 'Blower K-410',
    area: 'Polimer',
    failure: { p10: 5, p50: 8, p90: 12 },
    part: { name: 'V-belt set', leadTimeDays: 2, inStock: true, stockSince: -10, supplier: 'Gudang' },
    downtimeCostPerDay: 120_000_000,
  },
  {
    id: 'E-220',
    asset: 'Heat exchanger E-220',
    area: 'Polimer',
    failure: { p10: 25, p50: 33, p90: 44 },
    part: { name: 'Gasket set', leadTimeDays: 14, orderedAt: -6, eta: 20, supplier: 'Distributor lokal' },
    downtimeCostPerDay: 210_000_000,
  },
  {
    id: 'M-115',
    asset: 'Motor M-115',
    area: 'Utilitas',
    failure: { p10: 40, p50: 55, p90: 70 },
    part: { name: 'Bearing NDE', leadTimeDays: 10, supplier: 'Distributor lokal' },
    downtimeCostPerDay: 90_000_000,
  },
]
