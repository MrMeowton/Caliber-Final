import { useEffect, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  useNodesState,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import './root-cause.css'
import StatusNode from './StatusNode'
import { layoutGraph, traceUpstream, findRootCauses, withEdgeIds } from './graphUtils'

const nodeTypes = { status: StatusNode } // di luar komponen agar tidak dibuat ulang

const STATUS_COLOR = { ok: '#22c55e', warn: '#f59e0b', alarm: '#ef4444' }

/**
 * <RootCauseGraph> — komponen mandiri, cukup diberi data.
 *
 * Props:
 *  - nodes, edges   : data mentah (lihat src/data/plant.js)
 *  - selectedId     : node yang ditelusuri akar masalahnya (null = tidak ada)
 *  - onSelect(id)   : dipanggil saat node / area kosong diklik
 *  - showCauses     : false = hanya diagram proses (sembunyikan node & edge 'cause')
 */
export default function RootCauseGraph({ nodes, edges, selectedId, onSelect, showCauses = true }) {
  // 1. Saring data sesuai mode tampilan
  const visible = useMemo(() => {
    const ns = showCauses ? nodes : nodes.filter((n) => n.kind !== 'cause')
    const ids = new Set(ns.map((n) => n.id))
    const es = withEdgeIds(edges).filter((e) => ids.has(e.source) && ids.has(e.target))
    return { ns, es }
  }, [nodes, edges, showCauses])

  // 2. Layout otomatis; node tetap bisa di-drag (state lokal)
  const laidOut = useMemo(() => layoutGraph(visible.ns, visible.es), [visible])
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState(laidOut)
  useEffect(() => setRfNodes(laidOut), [laidOut, setRfNodes])

  // 3. Jalur hulu + akar masalah dari node terpilih
  const trace = useMemo(
    () => (selectedId ? traceUpstream(selectedId, visible.es) : null),
    [selectedId, visible.es],
  )
  const roots = useMemo(
    () => new Set(selectedId ? findRootCauses(selectedId, visible.ns, visible.es) : []),
    [selectedId, visible],
  )

  // 4. Tempelkan status sorot ke node & edge (tanpa mengubah state asli)
  const viewNodes = rfNodes.map((n) => ({
    ...n,
    selected: n.id === selectedId,
    data: { ...n.data, dim: trace && !trace.has(n.id), isRoot: roots.has(n.id) },
  }))

  const viewEdges = visible.es.map((e) => {
    const onPath = trace?.has(e.source) && trace?.has(e.target)
    const isCause = e.kind === 'cause'
    const color = onPath ? STATUS_COLOR.alarm : isCause ? '#64748b' : '#94a3b8'
    return {
      ...e,
      animated: e.kind === 'flow',
      style: {
        stroke: color,
        strokeWidth: onPath ? 2.5 : 1.5,
        strokeDasharray: isCause ? '6 4' : undefined,
        opacity: trace && !onPath ? 0.2 : 1,
      },
      markerEnd: { type: MarkerType.ArrowClosed, color },
    }
  })

  return (
    <ReactFlow
      nodes={viewNodes}
      edges={viewEdges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onNodeClick={(_, n) => onSelect?.(n.id)}
      onPaneClick={() => onSelect?.(null)}
      nodesConnectable={false}
      fitView
      colorMode="dark"
      proOptions={{ hideAttribution: true }}
    >
      <Background gap={20} />
      <Controls showInteractive={false} />
      <MiniMap pannable zoomable nodeColor={(n) => STATUS_COLOR[n.data.status]} />
    </ReactFlow>
  )
}
