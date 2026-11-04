import { findRootCauses } from './graphUtils'

const STATUS_TEXT = { ok: 'Normal', warn: 'Peringatan', alarm: 'Alarm' }

/** Panel ringkas: detail node terpilih + daftar akar masalahnya. */
export default function RootCausePanel({ nodes, edges, selectedId, onSelect }) {
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]))
  const node = byId[selectedId]

  if (!node) {
    return (
      <aside className="rc-panel">
        <h2>Root Cause</h2>
        <p className="rc-muted">Klik sebuah node untuk menelusuri penyebabnya ke hulu.</p>
      </aside>
    )
  }

  const roots = findRootCauses(node.id, nodes, edges).filter((id) => id !== node.id)

  return (
    <aside className="rc-panel">
      <h2>{node.label}</h2>
      <span className={`rc-pill rc-pill--${node.status}`}>{STATUS_TEXT[node.status]}</span>
      {node.value && <p>{node.value}</p>}
      {node.note && <p className="rc-muted">{node.note}</p>}

      <h3>Akar masalah ({roots.length})</h3>
      {roots.length === 0 ? (
        <p className="rc-muted">
          {node.status === 'ok' ? 'Tidak ada masalah.' : 'Node ini sendiri adalah akar masalah.'}
        </p>
      ) : (
        <ul className="rc-list">
          {roots.map((id) => (
            <li key={id}>
              <button onClick={() => onSelect(id)}>
                <span className={`rc-dot rc-dot--${byId[id].status}`} />
                {byId[id].label}
                <small>{byId[id].value}</small>
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
