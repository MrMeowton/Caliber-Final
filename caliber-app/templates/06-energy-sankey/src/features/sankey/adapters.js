// Adapter: ubah data mentah dari API / CSV / historian → { nodes, links } untuk EnergySankey.
// Tujuannya: backend cukup kirim tabel aliran, frontend tak perlu menyusun node manual.

const KIND_HINTS = [
  [/fuel|gas alam|natural gas|bahan bakar/i, 'fuel'],
  [/steam|uap/i, 'steam'],
  [/listrik|power|pln|grid|electric/i, 'power'],
  [/produk|product/i, 'product'],
  [/rugi|loss|buang|stack|vent|cooling|pendingin|waste/i, 'loss'],
]
export const guessKind = (name) => KIND_HINTS.find(([re]) => re.test(name))?.[1] ?? 'unit'

/**
 * rows: [{ from, to, value, fromKind?, toKind? }]  (nama kolom bisa dipetakan lewat `keys`)
 * kinds: { [namaNode]: kind } untuk menimpa tebakan otomatis.
 * Baris dengan from→to sama dijumlahkan (mis. beberapa meter pada satu pipa).
 */
export function graphFromRows(rows, { keys = {}, kinds = {}, labels = {} } = {}) {
  const k = { from: 'from', to: 'to', value: 'value', fromKind: 'fromKind', toKind: 'toKind', ...keys }
  const nodes = new Map()
  const links = new Map()
  const addNode = (id, kind) => {
    if (!nodes.has(id)) nodes.set(id, { id, label: labels[id] ?? id, kind: kinds[id] ?? kind ?? guessKind(id) })
  }
  for (const r of rows) {
    const from = String(r[k.from])
    const to = String(r[k.to])
    const value = Number(r[k.value])
    if (!Number.isFinite(value)) continue
    addNode(from, r[k.fromKind])
    addNode(to, r[k.toKind])
    const id = `${from}→${to}`
    const prev = links.get(id)
    links.set(id, { id, source: from, target: to, value: (prev?.value ?? 0) + value })
  }
  return { nodes: [...nodes.values()], links: [...links.values()] }
}

/** Ubah satuan semua aliran (mis. MW → GJ/jam: factor 3.6; kWh/jam → GJ/jam: 0.0036). */
export const scaleGraph = (graph, factor) => ({
  nodes: graph.nodes,
  links: graph.links.map((l) => ({ ...l, value: l.value * factor })),
})

export const UNIT_TO_GJ_PER_H = { 'GJ/jam': 1, MW: 3.6, kW: 0.0036, 'MMBtu/jam': 1.055 }
