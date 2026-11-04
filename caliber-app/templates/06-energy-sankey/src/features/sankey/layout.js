// Tata letak Sankey — logika murni, tanpa React / d3.
//
// Masukan:
//   nodes: [{ id, label, kind, col? }]   kind: fuel | steam | power | unit | product | loss
//   links: [{ source, target, value }]   value dalam GJ (atau satuan energi apa pun)
//
// Keluaran: node & link yang sudah punya koordinat (x0,x1,y0,y1) dan path SVG.
// Lebar aliran = value × ky (px per GJ), jadi besaran energi terbaca langsung dari tebalnya.

const DEFAULTS = {
  width: 1000,
  height: 540,
  nodeWidth: 14,
  nodePadding: 18,
  margin: { top: 16, right: 190, bottom: 16, left: 130 },
  // Nilai (GJ) yang dipetakan ke tinggi penuh kolom. Kunci angka ini agar skala TIDAK
  // berubah antar skenario — kalau tidak, aliran yang mengecil akan "di-zoom" lagi
  // sampai penuh dan penghematannya tak terlihat. null = sesuaikan dengan data.
  maxValue: null,
}

export const sum = (arr, f = (d) => d) => arr.reduce((s, d) => s + f(d), 0)

/** Kolom tiap node: sumber = 0, lainnya = kedalaman terpanjang; node tanpa keluaran → kolom terakhir. */
function assignColumns(nodes, links) {
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const depth = new Map()
  const incoming = new Map(nodes.map((n) => [n.id, []]))
  for (const l of links) incoming.get(l.target)?.push(l.source)

  const visit = (id, stack = new Set()) => {
    if (depth.has(id)) return depth.get(id)
    if (stack.has(id)) throw new Error(`Sankey: siklus terdeteksi di node "${id}"`)
    stack.add(id)
    const srcs = incoming.get(id) ?? []
    const d = srcs.length ? Math.max(...srcs.map((s) => visit(s, stack))) + 1 : 0
    stack.delete(id)
    depth.set(id, d)
    return d
  }
  nodes.forEach((n) => visit(n.id))

  const maxDepth = Math.max(0, ...depth.values())
  const hasOut = new Set(links.map((l) => l.source))
  for (const n of nodes) {
    let c = byId.get(n.id).col
    if (c == null) c = hasOut.has(n.id) ? depth.get(n.id) : maxDepth
    n.depth = c
  }
  return maxDepth
}

/** Pita melengkung (bezier kubik) dengan tebal = lebar aliran. */
export function linkPath(x0, y0, x1, y1) {
  const xm = (x0 + x1) / 2
  return `M${x0},${y0}C${xm},${y0} ${xm},${y1} ${x1},${y1}`
}

export function computeSankey(data, options = {}) {
  const o = { ...DEFAULTS, ...options, margin: { ...DEFAULTS.margin, ...options.margin } }

  // salin agar data pemanggil tidak termutasi; buang aliran ≤ 0
  const links = data.links
    .filter((l) => l.value > 1e-9)
    .map((l, i) => ({ ...l, id: l.id ?? `${l.source}→${l.target}`, index: i }))
  const used = new Set(links.flatMap((l) => [l.source, l.target]))
  const nodes = data.nodes.filter((n) => used.has(n.id)).map((n) => ({ ...n }))
  const byId = new Map(nodes.map((n) => [n.id, n]))

  for (const l of links) {
    l.sourceNode = byId.get(l.source)
    l.targetNode = byId.get(l.target)
    if (!l.sourceNode || !l.targetNode) throw new Error(`Sankey: node tak dikenal di aliran ${l.id}`)
  }
  for (const n of nodes) {
    n.in = links.filter((l) => l.target === n.id)
    n.out = links.filter((l) => l.source === n.id)
    n.valueIn = sum(n.in, (l) => l.value)
    n.valueOut = sum(n.out, (l) => l.value)
    n.value = Math.max(n.valueIn, n.valueOut)
  }

  const maxDepth = assignColumns(nodes, links)
  const cols = Array.from({ length: maxDepth + 1 }, (_, c) => nodes.filter((n) => n.depth === c))

  const innerW = o.width - o.margin.left - o.margin.right
  const innerH = o.height - o.margin.top - o.margin.bottom

  // skala vertikal: px per satuan energi, sama untuk semua kolom
  const ky = Math.min(
    ...cols
      .filter((c) => c.length)
      .map((c) => (innerH - (c.length - 1) * o.nodePadding) / Math.max(sum(c, (n) => n.value), o.maxValue ?? 0)),
  )

  // posisi node: kolom dibagi rata horizontal, ditumpuk & ditengahkan vertikal
  const step = maxDepth ? (innerW - o.nodeWidth) / maxDepth : 0
  for (const col of cols) {
    const colH = sum(col, (n) => n.value * ky) + (col.length - 1) * o.nodePadding
    let y = o.margin.top + (innerH - colH) / 2
    for (const n of col) {
      n.x0 = o.margin.left + n.depth * step
      n.x1 = n.x0 + o.nodeWidth
      n.y0 = y
      n.y1 = y + n.value * ky
      y = n.y1 + o.nodePadding
    }
  }

  // posisi ujung tiap aliran di dalam node: diurutkan menurut posisi node di seberangnya
  // agar pita tidak saling silang tanpa perlu
  for (const n of nodes) {
    n.out.sort((a, b) => a.targetNode.y0 - b.targetNode.y0 || a.index - b.index)
    n.in.sort((a, b) => a.sourceNode.y0 - b.sourceNode.y0 || a.index - b.index)
    let yo = n.y0
    for (const l of n.out) {
      l.width = l.value * ky
      l.y0 = yo + l.width / 2
      yo += l.width
    }
    let yi = n.y0
    for (const l of n.in) {
      l.y1 = yi + l.value * ky / 2
      yi += l.value * ky
    }
  }
  for (const l of links) {
    l.path = linkPath(l.sourceNode.x1, l.y0, l.targetNode.x0, l.y1)
  }

  return { nodes, links, ky, columns: maxDepth + 1, width: o.width, height: o.height, margin: o.margin }
}

/** Ringkasan neraca energi: total masuk, berguna, rugi, efisiensi. */
export function energyBalance(data) {
  const kind = new Map(data.nodes.map((n) => [n.id, n.kind]))
  const targets = new Set(data.links.map((l) => l.target))
  const input = sum(data.links.filter((l) => !targets.has(l.source)), (l) => l.value)
  const useful = sum(data.links.filter((l) => kind.get(l.target) === 'product'), (l) => l.value)
  const loss = sum(data.links.filter((l) => kind.get(l.target) === 'loss'), (l) => l.value)
  return { input, useful, loss, efficiency: input ? useful / input : 0, imbalance: input - useful - loss }
}
