// DEMO: data ilustratif pabrik petrokimia (nama & angka fiktif)
// level: 1 = tahu, 2 = kompeten (bisa kerjakan mandiri), 3 = ahli (bisa troubleshoot & mengajar)
// valueAtRisk = perkiraan biaya jika pengetahuan hilang (salah operasi / outage lebih lama), US$

export const people = [
  { id: 'har', name: 'Pak Hartono', role: 'Sr. Rotating Eng.', retireInMonths: 8 },
  { id: 'sup', name: 'Pak Suparman', role: 'Sr. Process Eng.', retireInMonths: 14 },
  { id: 'dew', name: 'Bu Dewi', role: 'Instrument Lead' },
  { id: 'rik', name: 'Riko', role: 'Process Eng.' },
  { id: 'ayu', name: 'Ayu', role: 'Reliability Eng.' },
  { id: 'fad', name: 'Fadli', role: 'Jr. Engineer' },
  { id: 'nin', name: 'Nina', role: 'Jr. Engineer' },
]

export const items = [
  { id: 'c301', name: 'Kompresor gas cracker C-301', area: 'Cracker', criticality: 5, valueAtRisk: 4_800_000,
    holders: { har: 3, ayu: 1, fad: 1 } },
  { id: 'decoke', name: 'Prosedur decoking furnace', area: 'Cracker', criticality: 5, valueAtRisk: 2_600_000,
    holders: { sup: 3, rik: 2, nin: 1 } },
  { id: 'coldbox', name: 'Start-up cold box', area: 'Cracker', criticality: 5, valueAtRisk: 3_900_000,
    holders: { sup: 3, har: 2 } },
  { id: 'ccs', name: 'Anti-surge control tuning', area: 'Instrument', criticality: 4, valueAtRisk: 1_700_000,
    holders: { dew: 3, har: 2, fad: 1 } },
  { id: 'pe-ext', name: 'Ekstruder PE — ganti screen', area: 'Polyethylene', criticality: 3, valueAtRisk: 450_000,
    holders: { rik: 2, ayu: 2, fad: 2, nin: 1 } },
  { id: 'pp-cat', name: 'Injeksi katalis PP', area: 'Polypropylene', criticality: 4, valueAtRisk: 1_200_000,
    holders: { sup: 2, rik: 3, nin: 1 } },
  { id: 'sis', name: 'Bypass & test SIS trip', area: 'Instrument', criticality: 5, valueAtRisk: 2_200_000,
    holders: { dew: 3 } },
  { id: 'boiler', name: 'Black-start boiler utilitas', area: 'Utilitas', criticality: 4, valueAtRisk: 1_500_000,
    holders: { har: 3, sup: 2, ayu: 1 } },
  { id: 'vib', name: 'Analisis vibrasi pompa', area: 'Reliability', criticality: 3, valueAtRisk: 380_000,
    holders: { ayu: 3, har: 3, fad: 2, nin: 2 } },
  { id: 'flare', name: 'Prosedur flare emergency', area: 'Utilitas', criticality: 4, valueAtRisk: 900_000,
    holders: { sup: 3, dew: 2, rik: 2 } },
]
