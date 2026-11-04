import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'

// Node kustom: kotak berwarna sesuai status, dengan port kiri (masuk) & kanan (keluar).
function StatusNode({ data, selected }) {
  const cls = [
    'rc-node',
    `rc-node--${data.kind}`,
    `rc-node--${data.status}`,
    data.dim && 'is-dim',
    data.isRoot && 'is-root',
    selected && 'is-selected',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={cls}>
      <Handle type="target" position={Position.Left} />
      <div className="rc-node__label">{data.label}</div>
      {data.value && <div className="rc-node__value">{data.value}</div>}
      {data.isRoot && <span className="rc-node__badge">AKAR MASALAH</span>}
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

export default memo(StatusNode)
