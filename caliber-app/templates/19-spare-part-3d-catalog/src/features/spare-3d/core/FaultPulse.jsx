// =========================================
// FaultPulse — membuat komponen bermasalah "berdenyut merah".
// -----------------------------------------
// Bungkus mesh komponen (mis. bearing). Saat `active`:
//   • material anak berpendar merah naik-turun (emissive)
//   • bola halo merah transparan mengembang-mengempis di sekitarnya
//   • (opsional) label HTML berisi nama & nilai sensor
// =========================================

import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useRef } from 'react'
import { AdditiveBlending, Color } from 'three'

const RED = new Color('#ef4444')

export default function FaultPulse({
  active = true,
  position, // posisi komponen [x,y,z] — halo & label ikut di sini
  radius = 0.5, // ukuran halo
  rate = 2.2, // denyut per detik
  label, // { title, value } — tampil bila showLabel
  showLabel = false,
  onClick,
  children,
}) {
  const group = useRef()
  const halo = useRef()
  const mats = useRef([])

  useLayoutEffect(() => {
    const list = []
    group.current.traverse((o) => {
      if (!o.isMesh || o === halo.current || !o.material.emissive) return
      o.material = o.material.clone()
      list.push(o.material)
    })
    mats.current = list
  }, [])

  useFrame(({ clock }) => {
    // gelombang 0..1, dipertajam agar terasa "berdenyut"
    const wave = active ? Math.pow((Math.sin(clock.elapsedTime * rate * Math.PI * 2) + 1) / 2, 2) : 0

    for (const m of mats.current) {
      m.emissive.copy(RED)
      m.emissiveIntensity = active ? 0.4 + wave * 2.2 : 0
    }

    const h = halo.current
    h.visible = active
    h.scale.setScalar(1 + wave * 0.35)
    h.material.opacity = 0.08 + wave * 0.22
  })

  return (
    <group
      ref={group}
      position={position}
      onClick={(e) => {
        if (!onClick) return
        e.stopPropagation()
        onClick(e)
      }}
    >
      {children}

      <mesh ref={halo} raycast={() => null}>
        <sphereGeometry args={[radius, 32, 16]} />
        <meshBasicMaterial color={RED} transparent depthWrite={false} blending={AdditiveBlending} />
      </mesh>

      {active && showLabel && label && (
        <Html position={[0, radius + 0.25, 0]} center distanceFactor={4.5} zIndexRange={[20, 0]}>
          <div className="xr-label">
            <span className="xr-dot" />
            <strong>{label.title}</strong>
            {label.value && <span>{label.value}</span>}
          </div>
        </Html>
      )}
    </group>
  )
}
