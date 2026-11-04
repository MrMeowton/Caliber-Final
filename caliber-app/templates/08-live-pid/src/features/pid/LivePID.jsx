// Komponen siap pakai: diagram P&ID hidup + panel tag sensor live di sampingnya
import { useState } from 'react'
import { DEFAULT_MEDIA } from './engine'
import { useTagHistory } from './hooks'
import { PidDiagram } from './PidDiagram'
import { TagPanel } from './TagPanel'

/** Legenda medium proses (warna pipa). */
export function MediaLegend({ lines, media = DEFAULT_MEDIA }) {
  const used = [...new Set(lines.map((l) => l.medium).filter(Boolean))]
  return (
    <ul className="pid-legend">
      {used.map((m) => (
        <li key={m}>
          <i style={{ background: media[m]?.color }} />
          {media[m]?.label ?? m}
        </li>
      ))}
      {lines.some((l) => l.kind === 'signal') && (
        <li>
          <i className="is-signal" />
          Sinyal kontrol
        </li>
      )}
    </ul>
  )
}

/**
 * @param diagram   { width, height, equipment[], lines[], instruments[] } — geometri statis
 * @param tags      definisi tag [{ tag, label, unit, digits, min, max, limits, spTag, states }]
 * @param values    { [tag]: number } — nilai live dari API / WebSocket
 * @param history   opsional { [tag]: number[] } — jika kosong, riwayat dikumpulkan di klien
 * @param selectedTag, onSelect  mode terkontrol (opsional)
 */
export function LivePID({
  diagram,
  tags,
  values,
  history: historyProp,
  historySize = 60,
  media = DEFAULT_MEDIA,
  selectedTag: selectedProp,
  onSelect,
  panelTags,
  sort = 'status',
  showLegend = true,
  panelTitle,
  ...diagramProps
}) {
  const [hover, setHover] = useState(null)
  const [selectedLocal, setSelectedLocal] = useState(null)
  const selected = selectedProp !== undefined ? selectedProp : selectedLocal
  const localHistory = useTagHistory(values, historySize)
  const history = historyProp ?? localHistory

  const select = (tag) => {
    const next = tag === selected ? null : tag
    setSelectedLocal(next)
    onSelect?.(next)
  }

  return (
    <div
      className="pid-root"
      onKeyDown={(e) => {
        if (e.key === 'Escape') select(null)
      }}
    >
      <div className="pid-stage">
        <PidDiagram
          diagram={diagram}
          tags={tags}
          values={values}
          media={media}
          activeTag={hover ?? selected}
          selectedTag={selected}
          onTagHover={setHover}
          onTagSelect={select}
          {...diagramProps}
        />
        {showLegend && <MediaLegend lines={diagram.lines ?? []} media={media} />}
      </div>
      <TagPanel
        tags={panelTags ?? tags}
        values={values}
        history={history}
        activeTag={hover ?? selected}
        selectedTag={selected}
        onTagHover={setHover}
        onTagSelect={select}
        sort={sort}
        title={panelTitle}
      />
    </div>
  )
}
