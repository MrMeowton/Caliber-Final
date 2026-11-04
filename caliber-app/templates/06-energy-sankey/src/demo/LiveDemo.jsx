// DEMO: jalur integrasi lengkap — API → adapter → validasi → Sankey (polling 3 detik)
import { EnergySankey, graphFromRows, useEnergyFlows } from '../features/sankey'
import { fetchEnergyRows, KINDS, LABELS } from './mockApi'

const fetchGraph = async () =>
  graphFromRows(await fetchEnergyRows(), { keys: { value: 'value_gj_h' }, kinds: KINDS, labels: LABELS })

export default function LiveDemo({ maxValue }) {
  const { data, loading, error, issues, updatedAt } = useEnergyFlows(fetchGraph, { intervalMs: 3000 })

  if (error) return <p className="hint">Gagal memuat: {String(error.message ?? error)}</p>
  if (loading || !data) return <p className="hint">Memuat data meter…</p>
  return (
    <>
      <p className="hint">
        Diperbarui {updatedAt.toLocaleTimeString('id-ID')} · {issues.length ? `${issues.length} peringatan neraca` : 'neraca OK'}
      </p>
      <EnergySankey data={data} maxValue={maxValue} />
      {issues.length > 0 && (
        <ul className="issues">
          {issues.slice(0, 4).map((i) => (
            <li key={i.type + i.id}>⚠ {i.message}</li>
          ))}
        </ul>
      )}
    </>
  )
}
