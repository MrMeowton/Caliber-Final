import { useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { STATUS } from '../status'

// =========================================
// <InteractivePart> — satu komponen aset yang bisa di-hover, diklik, difokuskan
// -----------------------------------------
// Bentuknya diambil dari registry `shapes[part.shape]`.
// Semua efek visual (hover, fokus, fade, explode, label) diurus di sini,
// sehingga bentuk-bentuk di folder shapes/ cukup menggambar geometri saja.
// =========================================

const ZERO = [0, 0, 0]
const tmp = new THREE.Vector3()

export default function InteractivePart({
  part,
  status,
  reading,
  shapes,
  selectedId,
  explode,
  showLabels,
  running,
  onSelect,
  labelPortal,
  groupRef,
}) {
  const [hovered, setHovered] = useState(false)
  const isSelected = selectedId === part.id
  const isDimmed = selectedId != null && !isSelected

  const { color = '#94a3b8', accent = '#475569', bodyOpacity = 1 } = part
  const position = part.position ?? ZERO
  const explodeDir = part.explode ?? ZERO

  const mat = useMemo(
    () => ({
      body: new THREE.MeshStandardMaterial({
        color,
        metalness: 0.55,
        roughness: 0.38,
        transparent: true,
        side: bodyOpacity < 1 ? THREE.DoubleSide : THREE.FrontSide,
      }),
      accent: new THREE.MeshStandardMaterial({ color: accent, metalness: 0.7, roughness: 0.3, transparent: true }),
    }),
    [color, accent, bodyOpacity],
  )

  const statusColor = STATUS[status].color
  const glow = useMemo(() => new THREE.Color(), [])

  useFrame((_, dt) => {
    const g = groupRef.current
    if (!g) return
    const k = 1 - Math.exp(-dt * 8) // lerp yang tidak bergantung FPS

    tmp.set(
      position[0] + explodeDir[0] * explode,
      position[1] + explodeDir[1] * explode,
      position[2] + explodeDir[2] * explode,
    )
    g.position.lerp(tmp, k)

    const targetOpacity = isDimmed ? 0.18 : 1
    glow.set(isSelected || hovered ? statusColor : '#000000')
    const targetGlow = isSelected ? 0.35 : hovered ? 0.22 : 0

    for (const m of [mat.body, mat.accent]) {
      const t = m === mat.body ? Math.min(targetOpacity, bodyOpacity) : targetOpacity
      m.opacity = THREE.MathUtils.lerp(m.opacity, t, k)
      m.depthWrite = m.opacity > 0.6
      m.emissive.lerp(glow, k)
      m.emissiveIntensity = THREE.MathUtils.lerp(m.emissiveIntensity, targetGlow, k)
    }
  })

  const Shape = shapes[part.shape]
  if (!Shape) {
    console.warn(`[asset-3d] bentuk "${part.shape}" untuk part "${part.id}" tidak ada di registry shapes`)
    return null
  }

  const labelVisible = (showLabels || hovered || isSelected) && !isDimmed

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={part.rotation ?? ZERO}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHovered(false)
        document.body.style.cursor = 'auto'
      }}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(isSelected ? null : part.id)
      }}
    >
      <Shape mat={mat} part={part} reading={reading} running={running} />

      {/* Label selalu di-mount lalu disembunyikan via CSS:
          mount/unmount berulang pada <Html> bisa memicu error DOM di React 19 */}
      <Html position={part.labelOffset ?? [0, 1, 0]} center zIndexRange={[10, 0]} portal={labelPortal}>
        <button
          className={`a3d-tag ${isSelected ? 'a3d-tag--active' : ''}`}
          style={{ display: labelVisible ? 'flex' : 'none' }}
          onClick={() => onSelect(isSelected ? null : part.id)}
        >
          <span className="a3d-tag__dot" style={{ background: statusColor }} />
          {part.code && <span className="a3d-tag__code">{part.code}</span>}
          <span className="a3d-tag__name">{part.name}</span>
        </button>
      </Html>
    </group>
  )
}
