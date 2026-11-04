// DEMO: backlog alert & work order ilustratif (fiktif).
// pFailure = peluang gagal dalam 30 hari (dari model prediktif / FMEA), severity = prioritas alarm DCS (1–4)
// source: alert (anomali), pm (preventive), wo (permintaan operasi)

export const orders = [
  { id: 'A-1182', title: 'Vibrasi naik bearing DE', asset: 'Kompresor C-301', source: 'alert', severity: 2,
    pFailure: 0.18, lostMarginPerHour: 42_000, mttrHours: 36, repairCost: 85_000, laborHours: 16, createdAt: '2026-10-29' },
  { id: 'A-1190', title: 'Suhu seal naik', asset: 'Pompa P-205B', source: 'alert', severity: 3,
    pFailure: 0.45, lostMarginPerHour: 6_500, mttrHours: 12, repairCost: 18_000, laborHours: 6, createdAt: '2026-10-30' },
  { id: 'WO-3307', title: 'Kalibrasi transmitter level', asset: 'Drum D-120', source: 'wo', severity: 1,
    pFailure: 0.05, lostMarginPerHour: 9_000, mttrHours: 4, repairCost: 1_500, laborHours: 3, createdAt: '2026-10-20' },
  { id: 'A-1195', title: 'TMT coil mendekati batas', asset: 'Furnace F-11', source: 'alert', severity: 4,
    pFailure: 0.12, lostMarginPerHour: 28_000, mttrHours: 60, repairCost: 60_000, laborHours: 24, createdAt: '2026-11-01' },
  { id: 'PM-552', title: 'Ganti oli & filter', asset: 'Turbin ST-2', source: 'pm', severity: 1,
    pFailure: 0.06, lostMarginPerHour: 35_000, mttrHours: 10, repairCost: 9_000, laborHours: 5, createdAt: '2026-10-15' },
  { id: 'A-1201', title: 'Positioner drift', asset: 'Valve FV-1203', source: 'alert', severity: 3,
    pFailure: 0.3, lostMarginPerHour: 15_000, mttrHours: 5, repairCost: 6_000, laborHours: 4, createdAt: '2026-11-02' },
  { id: 'WO-3311', title: 'Perbaikan insulasi pipa steam', asset: 'Header LP', source: 'wo', severity: 1,
    pFailure: 0.02, lostMarginPerHour: 2_000, mttrHours: 8, repairCost: 4_000, laborHours: 12, createdAt: '2026-10-10' },
  { id: 'A-1204', title: 'ΔP strainer naik', asset: 'Ekstruder PE-2', source: 'alert', severity: 2,
    pFailure: 0.55, lostMarginPerHour: 11_000, mttrHours: 6, repairCost: 4_000, laborHours: 3, createdAt: '2026-11-03' },
  { id: 'PM-560', title: 'Inspeksi kopling', asset: 'Pompa P-310A', source: 'pm', severity: 1,
    pFailure: 0.08, lostMarginPerHour: 4_000, mttrHours: 10, repairCost: 12_000, laborHours: 4, createdAt: '2026-10-18' },
  { id: 'A-1208', title: 'Fouling naik (approach temp)', asset: 'HX E-410', source: 'alert', severity: 2,
    pFailure: 0.25, lostMarginPerHour: 9_000, mttrHours: 20, repairCost: 22_000, laborHours: 14, createdAt: '2026-10-25' },
  { id: 'WO-3320', title: 'Ganti lampu area tangki', asset: 'Tank farm', source: 'wo', severity: 1,
    pFailure: 0.01, lostMarginPerHour: 0, mttrHours: 0, repairCost: 800, laborHours: 2, createdAt: '2026-10-05' },
  { id: 'A-1211', title: 'Arus motor fluktuatif', asset: 'Fan FD-02', source: 'alert', severity: 3,
    pFailure: 0.2, lostMarginPerHour: 18_000, mttrHours: 8, repairCost: 14_000, laborHours: 6, createdAt: '2026-10-31' },
]
