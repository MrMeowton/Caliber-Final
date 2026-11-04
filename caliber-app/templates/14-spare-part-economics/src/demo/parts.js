// DEMO: spare part kritis ilustratif (fiktif). Di produksi: SAP MM (harga, stok, lead time)
// + CMMS (pemakaian/tahun) + finance (lost margin per jam unit terdampak).
// emergencyLeadDays = waktu pengadaan darurat jika stok habis (air freight / pinjam plant lain)
// annualDemand = berapa kali/tahun part ini dibutuhkan; holdingRate = biaya simpan/tahun sbg % harga

export const parts = [
  { id: 'brg-c301', name: 'Bearing thrust DE', asset: 'Kompresor C-301', unitCost: 48_000, annualDemand: 0.25,
    leadTimeDays: 120, emergencyLeadDays: 18, downtimeCostPerHour: 42_000, currentStock: 0 },
  { id: 'seal-p205', name: 'Mechanical seal', asset: 'Pompa P-205A/B', unitCost: 9_500, annualDemand: 4,
    leadTimeDays: 45, emergencyLeadDays: 10, downtimeCostPerHour: 1_200, currentStock: 8 },
  { id: 'rotor-st2', name: 'Rotor cadangan', asset: 'Turbin uap ST-2', unitCost: 1_800_000, annualDemand: 0.05,
    leadTimeDays: 300, emergencyLeadDays: 120, downtimeCostPerHour: 35_000, currentStock: 1 },
  { id: 'scr-pe2', name: 'Screen pack', asset: 'Ekstruder PE-2', unitCost: 1_200, annualDemand: 24,
    leadTimeDays: 30, emergencyLeadDays: 3, downtimeCostPerHour: 11_000, currentStock: 6 },
  { id: 'pos-fv', name: 'Smart positioner', asset: 'Control valve (fleet)', unitCost: 6_000, annualDemand: 6,
    leadTimeDays: 60, downtimeCostPerHour: 3_000, currentStock: 3 },
  { id: 'cpl-p310', name: 'Kopling fleksibel', asset: 'Pompa P-310A/B', unitCost: 3_500, annualDemand: 1,
    leadTimeDays: 40, downtimeCostPerHour: 150, currentStock: 4 },
]
