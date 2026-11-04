// DEMO: log insiden ilustratif 2025–2026 (fiktif). Di produksi: dari CMMS/SAP PM + modul RCA.
// Setiap signature punya pola: kapan kejadian, mana yang di-RCA (dan berapa hari RCA selesai).

const signatures = [
  // asset, failureMode, margin US$/jam, downtime jam, repair US$, hari kejadian (sejak 1 Jan 2025), index yang di-RCA
  ['Kompresor C-301', 'Bearing thrust aus (lube oil kontaminasi)', 42_000, 30, 85_000, [40, 190, 330, 520, 610], [0]],
  ['Pompa P-205B', 'Mechanical seal bocor', 6_500, 14, 18_000, [15, 70, 150, 210, 300, 380, 470, 560, 640], [1]],
  ['Furnace F-11', 'Coil coking dini', 28_000, 48, 60_000, [100, 400, 590], [0]],
  ['HX E-410', 'Fouling (cooling water)', 9_000, 20, 22_000, [55, 160, 280, 420, 545], []],
  ['Ekstruder PE-2', 'Screen pack tersumbat', 11_000, 6, 4_000, [30, 95, 180, 260, 340, 450, 530, 620, 660], [2]],
  ['Valve FV-1203', 'Stuck (positioner drift)', 15_000, 5, 6_000, [120, 350, 500], [0]],
  ['Turbin uap ST-2', 'Trip overspeed palsu', 35_000, 8, 9_000, [210, 470], [0]],
  ['Pompa P-310A', 'Kavitasi saat start-up', 4_000, 10, 12_000, [80, 365], []],
]

const day0 = Date.UTC(2025, 0, 1)
const iso = (d) => new Date(day0 + d * 86_400_000).toISOString().slice(0, 10)

export const incidents = signatures.flatMap(([asset, failureMode, margin, dt, repair, days, rcaIdx], s) =>
  days.map((d, k) => ({
    id: `INC-${s}${k}`,
    date: iso(d),
    asset,
    failureMode,
    downtimeHours: Math.round(dt * (0.7 + ((k * 37 + s * 11) % 7) / 10)), // variasi deterministik
    lostMarginPerHour: margin,
    repairCost: repair,
    rca: rcaIdx.includes(k) ? { date: iso(d + 21), owner: 'Reliability' } : null,
  })),
)

export const range = { start: day0, end: Date.UTC(2026, 10, 3) }
