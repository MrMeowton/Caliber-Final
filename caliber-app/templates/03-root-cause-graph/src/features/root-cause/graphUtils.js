import dagre from '@dagrejs/dagre'

// =========================================
// Fungsi murni (tanpa React) — mudah dites & dipakai ulang
// =========================================

export const NODE_W = 200
export const NODE_H = 64

/** Beri id ke edge yang belum punya. */
export const withEdgeIds = (edges) =>
  edges.map((e) => ({ ...e, id: e.id ?? `${e.source}->${e.target}` }))

/**
 * Hitung posisi node otomatis (kiri → kanan) dengan dagre,
 * lalu ubah ke format node React Flow.
 */
export function layoutGraph(nodes, edges, direction = 'LR') {
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: direction, nodesep: 30, ranksep: 70 })
  g.setDefaultEdgeLabel(() => ({}))

  nodes.forEach((n) => g.setNode(n.id, { width: NODE_W, height: NODE_H }))
  edges.forEach((e) => g.setEdge(e.source, e.target))
  dagre.layout(g)

  return nodes.map((n) => {
    const p = g.node(n.id)
    return {
      id: n.id,
      type: 'status',
      position: { x: p.x - NODE_W / 2, y: p.y - NODE_H / 2 },
      data: n, // seluruh data asli dibawa ke komponen node
    }
  })
}

/** Semua node "di hulu" startId (termasuk dirinya), menelusuri edge ke belakang. */
export function traceUpstream(startId, edges) {
  const seen = new Set([startId])
  const stack = [startId]
  while (stack.length) {
    const id = stack.pop()
    for (const e of edges) {
      if (e.target === id && !seen.has(e.source)) {
        seen.add(e.source)
        stack.push(e.source)
      }
    }
  }
  return seen
}

/**
 * Akar masalah = node bermasalah (status ≠ ok) di hulu startId
 * yang TIDAK punya induk bermasalah lagi.
 */
export function findRootCauses(startId, nodes, edges) {
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]))
  const bad = (id) => byId[id] && byId[id].status !== 'ok'
  const upstream = traceUpstream(startId, edges)

  return [...upstream].filter(
    (id) => bad(id) && !edges.some((e) => e.target === id && bad(e.source)),
  )
}
