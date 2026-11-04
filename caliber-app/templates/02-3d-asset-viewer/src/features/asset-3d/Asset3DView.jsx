'use client'

import { useEffect, useImperativeHandle, useRef, useState } from 'react'
import AssetCanvas from './core/AssetCanvas'
import { DEFAULT_CAMERA_VIEWS, goToView } from './core/camera'
import { STATUS } from './status'

// =========================================
// <Asset3DView> — komponen siap pakai: kanvas 3D + toolbar + legenda
// -----------------------------------------
// Pemakaian minimal:
//   <Asset3DView asset={config} readings={readings} />
//
// selectedId bisa "uncontrolled" (diurus sendiri) atau "controlled"
// (kirim selectedId + onSelect) — pakai controlled bila komponen lain di
// halaman (tabel, graf, panel) perlu sinkron dengan pilihan di 3D.
//
// ref → { goToView(key), focus(id), reset() } untuk kontrol dari luar.
// =========================================

function useControllable(value, onChange, initial) {
  const [inner, setInner] = useState(initial)
  const isControlled = value !== undefined
  const current = isControlled ? value : inner
  const set = (v) => {
    if (!isControlled) setInner(v)
    onChange?.(v)
  }
  return [current, set]
}

export default function Asset3DView({
  ref,
  asset,
  readings,
  selectedId: selectedIdProp,
  onSelect,
  running = true,
  onRunningChange, // jika diisi, tombol Run/Stop muncul di toolbar
  shapes,
  height = '100%',
  className = '',
  style,
  toolbar = true,
  legend = true,
  defaultExplode = 0,
  defaultShowLabels = true,
  escapeToDeselect = true,
  background,
}) {
  const controlsRef = useRef(null)
  const [selectedId, setSelectedId] = useControllable(selectedIdProp, onSelect, null)
  const [explode, setExplode] = useState(defaultExplode)
  const [showLabels, setShowLabels] = useState(defaultShowLabels)
  const views = asset.cameraViews ?? DEFAULT_CAMERA_VIEWS

  useImperativeHandle(ref, () => ({
    goToView: (key) => {
      setSelectedId(null)
      goToView(controlsRef.current, views[key])
    },
    focus: (id) => setSelectedId(id),
    reset: () => {
      setSelectedId(null)
      setExplode(0)
    },
    get controls() {
      return controlsRef.current
    },
  }))

  useEffect(() => {
    if (!escapeToDeselect) return
    const onKey = (e) => e.key === 'Escape' && setSelectedId(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className={`a3d-root ${className}`} style={{ height, ...style }}>
      <AssetCanvas
        asset={asset}
        readings={readings}
        selectedId={selectedId}
        onSelect={setSelectedId}
        explode={explode}
        showLabels={showLabels}
        running={running}
        shapes={shapes}
        controlsRef={controlsRef}
        background={background}
      />

      {toolbar && (
        <div className="a3d-toolbar">
          <div className="a3d-toolbar__group">
            {Object.entries(views).map(([key, v]) => (
              <button
                key={key}
                className="a3d-chip"
                onClick={() => {
                  setSelectedId(null)
                  goToView(controlsRef.current, v)
                }}
              >
                {v.label ?? key}
              </button>
            ))}
          </div>

          <label className="a3d-toolbar__group a3d-slider">
            <span>Explode</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={explode}
              onChange={(e) => setExplode(+e.target.value)}
            />
          </label>

          <div className="a3d-toolbar__group">
            <button className={`a3d-chip ${showLabels ? 'a3d-chip--on' : ''}`} onClick={() => setShowLabels((v) => !v)}>
              Label
            </button>
            {onRunningChange && (
              <button className={`a3d-chip ${running ? 'a3d-chip--on' : ''}`} onClick={() => onRunningChange(!running)}>
                {running ? '❚❚ Stop' : '▶ Run'}
              </button>
            )}
          </div>
        </div>
      )}

      {legend && (
        <div className="a3d-legend">
          {Object.values(STATUS).map((s) => (
            <span key={s.label}>
              <i className="a3d-dot" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
          <span className="a3d-legend__hint">Drag putar · Scroll zoom · Klik kanan geser · Esc batal</span>
          <span className={`a3d-live ${running ? 'a3d-live--on' : ''}`}>{running ? 'LIVE' : 'PAUSED'}</span>
        </div>
      )}
    </div>
  )
}
