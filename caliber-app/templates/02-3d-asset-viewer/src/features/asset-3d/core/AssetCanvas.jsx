'use client'

import { Suspense, createRef, useEffect, useMemo, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { CameraControls, ContactShadows, Environment, Grid, Lightformer } from '@react-three/drei'
import InteractivePart from './InteractivePart'
import Scenery from './Scenery'
import { DEFAULT_CAMERA_VIEWS, focusObject, goToView } from './camera'
import { BUILTIN_SHAPES } from '../shapes'
import { partStatus } from '../status'

// =========================================
// <AssetCanvas> — hanya kanvas 3D, tanpa toolbar/panel
// -----------------------------------------
// Pakai ini bila project utama ingin membuat UI kontrolnya sendiri.
// Komponen ini sepenuhnya "controlled": semua state datang dari props.
// =========================================

export default function AssetCanvas({
  asset,
  readings = {},
  selectedId = null,
  onSelect = () => {},
  explode = 0,
  showLabels = true,
  running = true,
  shapes,
  controlsRef: externalControlsRef,
  background = '#0b1120',
  showGrid = true,
}) {
  const internalControlsRef = useRef(null)
  const controlsRef = externalControlsRef ?? internalControlsRef
  const labelLayer = useRef(null)

  const parts = asset.parts
  const registry = useMemo(() => ({ ...BUILTIN_SHAPES, ...shapes }), [shapes])
  const views = asset.cameraViews ?? DEFAULT_CAMERA_VIEWS
  const homeView = views[asset.homeView ?? Object.keys(views)[0]]

  // Satu ref per komponen, dipakai kamera untuk terbang ke komponen terpilih
  const partRefs = useMemo(() => Object.fromEntries(parts.map((p) => [p.id, createRef()])), [parts])

  useEffect(() => {
    const controls = controlsRef.current
    const obj = selectedId != null ? partRefs[selectedId]?.current : null
    if (obj) focusObject(controls, obj)
    else goToView(controls, homeView)
  }, [selectedId, partRefs, controlsRef, homeView])

  return (
    <div className="a3d-canvas">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: homeView.pos, fov: 40, near: 0.1, far: 100 }}
        onPointerMissed={() => onSelect(null)}
      >
        <color attach="background" args={[background]} />
        <fog attach="fog" args={[background, 14, 30]} />

        <ambientLight intensity={0.35} />
        <directionalLight
          position={[5, 8, 4]}
          intensity={1.6}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-8}
          shadow-camera-right={8}
          shadow-camera-top={8}
          shadow-camera-bottom={-8}
        />
        {/* Pencahayaan reflektif dari Lightformer — tidak perlu unduh file HDR */}
        <Environment resolution={256}>
          <Lightformer form="rect" intensity={2} position={[0, 5, -6]} scale={[12, 4, 1]} />
          <Lightformer form="rect" intensity={1} position={[-6, 2, 2]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} />
          <Lightformer form="ring" intensity={1.5} color="#60a5fa" position={[6, 3, 4]} scale={3} />
        </Environment>

        <Suspense fallback={null}>
          <Scenery statics={asset.statics} pipes={asset.pipes} explode={explode} selectedId={selectedId} />
          {parts.map((part) => (
            <InteractivePart
              key={part.id}
              part={part}
              status={partStatus(part, readings)}
              reading={readings[part.id]}
              shapes={registry}
              selectedId={selectedId}
              explode={explode}
              showLabels={showLabels}
              running={running}
              onSelect={onSelect}
              labelPortal={labelLayer}
              groupRef={partRefs[part.id]}
            />
          ))}
        </Suspense>

        <ContactShadows position={[0, 0.001, 0]} opacity={0.6} scale={20} blur={2.4} far={4} />
        {showGrid && (
          <Grid
            position={[0, -0.001, 0]}
            args={[30, 30]}
            cellSize={0.5}
            cellThickness={0.6}
            cellColor="#1e293b"
            sectionSize={2.5}
            sectionThickness={1}
            sectionColor="#334155"
            fadeDistance={22}
            infiniteGrid
          />
        )}

        <CameraControls
          ref={controlsRef}
          makeDefault
          minDistance={2}
          maxDistance={20}
          maxPolarAngle={Math.PI / 2 - 0.05}
        />
      </Canvas>

      {/* Semua label <Html> dirender ke layer ini (lewat prop portal) */}
      <div ref={labelLayer} className="a3d-label-layer" />
    </div>
  )
}
