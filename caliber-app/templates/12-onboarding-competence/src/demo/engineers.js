// DEMO: data ilustratif (fiktif). Di produksi: dari LMS / matriks kompetensi HR.
// "before" = rekrutan 2023–2024 (belajar dari senior & dokumen tersebar)
// "after"  = rekrutan 2025–2026 (dengan knowledge base + AI assistant)

export const skills = [
  { id: 'hse', name: 'HSE & permit to work', weight: 1 },
  { id: 'pfd', name: 'Membaca PFD/P&ID unit', weight: 1 },
  { id: 'dcs', name: 'Navigasi DCS & alarm', weight: 1 },
  { id: 'su', name: 'Start-up / shutdown normal', weight: 2 },
  { id: 'trb', name: 'Troubleshoot deviasi proses', weight: 2 },
  { id: 'loto', name: 'Isolasi & LOTO peralatan', weight: 1 },
  { id: 'rca', name: 'Memimpin RCA sederhana', weight: 1 },
  { id: 'emg', name: 'Respons emergency unit', weight: 2 },
]

// rata-rata hari mencapai tiap skill per cohort
const base = { hse: 20, pfd: 60, dcs: 75, su: 170, trb: 260, loto: 90, rca: 300, emg: 230 }
const speedup = { hse: 1, pfd: 0.7, dcs: 0.8, su: 0.62, trb: 0.55, loto: 0.85, rca: 0.6, emg: 0.65 }

// RNG deterministik agar demo selalu sama
let seed = 7
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
const names = ['Fadli', 'Nina', 'Raka', 'Sinta', 'Bayu', 'Dimas', 'Laras', 'Yoga', 'Putri', 'Rizky', 'Gita', 'Arif', 'Mega', 'Tegar']

function make(cohort, n, start, spacingDays, factor) {
  return Array.from({ length: n }, (_, i) => {
    const hired = new Date(start + i * spacingDays * 86_400_000)
    const achieved = {}
    for (const k of skills) achieved[k.id] = Math.round(base[k.id] * factor(k.id) * (0.75 + rnd() * 0.55))
    return { id: `${cohort}-${i}`, name: names[i % names.length], cohort, hiredAt: hired.toISOString().slice(0, 10), achieved }
  })
}

export const engineers = [
  ...make('before', 14, Date.UTC(2023, 0, 9), 50, () => 1),
  ...make('after', 12, Date.UTC(2025, 0, 6), 55, (id) => speedup[id]),
]

export const asOf = '2026-11-04'
