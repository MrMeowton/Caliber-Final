// Definisi layer default — timpa / tambah sesuai kebutuhan project
//
// Field layer:
//   id        kunci di objek data: data[unitId][id]
//   label     nama panjang (tooltip, legenda) · short: nama tombol toggle
//   unit      satuan · digits: angka desimal
//   stops     warna gradasi rendah → tinggi (diinterpolasi di OKLab)
//   domain    [min, max] — KUNCI agar warna sebanding antar waktu. Kosong = otomatis
//   alert     ambang (opsional) — unit ≥ alert diberi cincin berdenyut + dihitung di ringkasan
//   alertLabel teks untuk penanda ambang di legenda
//   aggregate 'sum' (default) | 'mean' | 'max' — cara meringkas layer di panel titik panas

export const DEFAULT_LAYERS = [
  {
    id: 'energy',
    short: 'Energi',
    label: 'Intensitas energi',
    unit: 'GJ/jam',
    digits: 0,
    stops: ['#1e2f63', '#1d4ed8', '#0ea5e9', '#5eead4', '#fef08a'],
  },
  {
    id: 'emission',
    short: 'Emisi',
    label: 'Emisi CO₂e',
    unit: 'tCO₂e/jam',
    digits: 1,
    stops: ['#2a1414', '#7c2d12', '#ea580c', '#fb923c', '#fde68a'],
  },
  {
    id: 'risk',
    short: 'Risiko',
    label: 'Skor risiko',
    unit: 'skor',
    digits: 0,
    domain: [0, 100],
    aggregate: 'mean',
    alert: 70,
    alertLabel: 'Kritis',
    stops: ['#14532d', '#4d7c0f', '#ca8a04', '#ea580c', '#dc2626'],
  },
]

/** Kunci domain beberapa layer sekaligus: withDomains(DEFAULT_LAYERS, { energy: [0, 300] }) */
export const withDomains = (layers, domains) =>
  layers.map((l) => (domains[l.id] ? { ...l, domain: domains[l.id] } : l))
