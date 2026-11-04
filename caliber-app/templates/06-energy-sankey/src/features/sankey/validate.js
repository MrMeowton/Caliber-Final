// Pemeriksaan kualitas data sebelum digambar: neraca per node, id tak dikenal, nilai negatif.
// Selisih neraca yang besar biasanya = meter hilang / salah kalibrasi — layak ditampilkan
// sebagai peringatan di dashboard, bukan disembunyikan.

export function validateGraph({ nodes, links }, { tolerance = 0.02 } = {}) {
  const ids = new Set(nodes.map((n) => n.id))
  const issues = []
  const io = new Map(nodes.map((n) => [n.id, { in: 0, out: 0 }]))

  for (const l of links) {
    for (const end of [l.source, l.target])
      if (!ids.has(end)) issues.push({ type: 'unknown-node', id: end, message: `Node "${end}" tidak ada di daftar node` })
    if (l.value < 0) issues.push({ type: 'negative', id: `${l.source}→${l.target}`, message: `Aliran negatif (${l.value})` })
    if (io.has(l.source)) io.get(l.source).out += Math.max(0, l.value)
    if (io.has(l.target)) io.get(l.target).in += Math.max(0, l.value)
  }
  for (const n of nodes) {
    const { in: i, out: o } = io.get(n.id)
    if (i > 0 && o > 0 && Math.abs(i - o) / Math.max(i, o) > tolerance) {
      issues.push({
        type: 'imbalance',
        id: n.id,
        diff: i - o,
        message: `${n.label ?? n.id}: masuk ${i.toFixed(1)} ≠ keluar ${o.toFixed(1)} (selisih ${(i - o).toFixed(1)})`,
      })
    }
  }
  return { ok: issues.length === 0, issues }
}
