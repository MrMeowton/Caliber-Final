import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { useSpin } from './useSpin'

// =========================================
// Bentuk industri bawaan (dari primitif three.js, tanpa file model)
// -----------------------------------------
// Kontrak setiap bentuk:
//   props = { mat, part, reading, running }
//   - mat     : { body, accent } — material yang dikelola modul (hover/fokus/fade)
//   - part    : objek komponen dari config (opsi tambahan di part.shapeProps)
//   - reading : nilai sensor komponen ini, mis. { level: 64 }
//   - running : true jika mesin berjalan (untuk animasi)
// =========================================

const AXIS_X = [0, 0, Math.PI / 2] // rotasi agar silinder memanjang di sumbu X

export function Motor({ mat, running }) {
  const shaft = useSpin(running)
  return (
    <>
      <mesh rotation={AXIS_X} material={mat.body} castShadow>
        <cylinderGeometry args={[0.42, 0.42, 1.2, 40]} />
      </mesh>
      {Array.from({ length: 9 }).map((_, i) => (
        <mesh
          key={i}
          position={[-0.5 + i * 0.125, 0, 0]}
          rotation={[0, Math.PI / 2, 0]}
          material={mat.accent}
          castShadow
        >
          <torusGeometry args={[0.43, 0.025, 8, 40]} />
        </mesh>
      ))}
      <mesh position={[-0.68, 0, 0]} rotation={AXIS_X} material={mat.accent} castShadow>
        <cylinderGeometry args={[0.4, 0.44, 0.16, 40]} />
      </mesh>
      <RoundedBox args={[0.34, 0.2, 0.3]} radius={0.03} position={[0.1, 0.5, 0]} material={mat.accent} castShadow />
      <mesh position={[0, -0.47, 0]} material={mat.accent} castShadow>
        <boxGeometry args={[0.95, 0.15, 0.75]} />
      </mesh>
      <mesh ref={shaft} position={[0.72, 0, 0]} rotation={AXIS_X} material={mat.accent}>
        <cylinderGeometry args={[0.06, 0.06, 0.3, 16]} />
      </mesh>
    </>
  )
}

export function Coupling({ mat, running }) {
  const spin = useSpin(running)
  return (
    <group ref={spin}>
      {[-0.09, 0.09].map((x) => (
        <mesh key={x} position={[x, 0, 0]} rotation={AXIS_X} material={mat.body} castShadow>
          <cylinderGeometry args={[0.24, 0.24, 0.14, 32]} />
        </mesh>
      ))}
      {Array.from({ length: 6 }).map((_, i) => {
        const a = (i / 6) * Math.PI * 2
        return (
          <mesh key={i} position={[0, Math.cos(a) * 0.17, Math.sin(a) * 0.17]} rotation={AXIS_X} material={mat.accent}>
            <cylinderGeometry args={[0.025, 0.025, 0.34, 8]} />
          </mesh>
        )
      })}
    </group>
  )
}

export function CentrifugalPump({ mat }) {
  return (
    <>
      <mesh rotation={AXIS_X} material={mat.body} castShadow>
        <cylinderGeometry args={[0.5, 0.5, 0.42, 48]} />
      </mesh>
      <mesh position={[-0.32, 0, 0]} rotation={AXIS_X} material={mat.accent} castShadow>
        <cylinderGeometry args={[0.22, 0.3, 0.25, 32]} />
      </mesh>
      <mesh position={[0.35, -0.15, 0]} rotation={AXIS_X} material={mat.body} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 0.3, 24]} />
      </mesh>
      <mesh position={[0.5, -0.15, 0]} rotation={AXIS_X} material={mat.accent}>
        <cylinderGeometry args={[0.2, 0.2, 0.05, 24]} />
      </mesh>
      <mesh position={[0, 0.5, 0]} material={mat.body} castShadow>
        <cylinderGeometry args={[0.13, 0.15, 0.25, 24]} />
      </mesh>
      <mesh position={[-0.05, -0.47, 0]} material={mat.accent} castShadow>
        <boxGeometry args={[0.7, 0.15, 0.7]} />
      </mesh>
    </>
  )
}

export function GateValve({ mat }) {
  return (
    <>
      <mesh material={mat.body} castShadow>
        <sphereGeometry args={[0.2, 24, 24]} />
      </mesh>
      {[-0.2, 0.2].map((y) => (
        <mesh key={y} position={[0, y, 0]} material={mat.accent} castShadow>
          <cylinderGeometry args={[0.17, 0.17, 0.05, 24]} />
        </mesh>
      ))}
      <mesh position={[0, 0.18, 0.28]} rotation={[Math.PI / 2, 0, 0]} material={mat.accent}>
        <cylinderGeometry args={[0.03, 0.03, 0.4, 8]} />
      </mesh>
      <mesh position={[0, 0.18, 0.48]} material={mat.body} castShadow>
        <torusGeometry args={[0.14, 0.025, 10, 32]} />
      </mesh>
    </>
  )
}

// Tangki tembus pandang dengan kolom fluida yang tingginya mengikuti sensor.
// shapeProps: { height = 2, radius = 0.62, levelKey = 'level', fluidColor }
// Gunakan bersama `bodyOpacity` < 1 pada part agar fluida terlihat.
export function Tank({ mat, part, reading }) {
  const { height = 2, radius = 0.62, levelKey = 'level', fluidColor = '#38bdf8' } = part.shapeProps ?? {}
  const level = (reading?.[levelKey] ?? 50) / 100
  return (
    <>
      <mesh material={mat.body} castShadow>
        <cylinderGeometry args={[radius, radius, height, 48, 1, true]} />
      </mesh>
      {[-height / 2, height / 2].map((y) => (
        <mesh key={y} position={[0, y, 0]} material={mat.accent} castShadow>
          <cylinderGeometry args={[radius + 0.02, radius + 0.02, 0.06, 48]} />
        </mesh>
      ))}
      <FluidColumn level={level} height={height} radius={radius - 0.04} color={fluidColor} />
    </>
  )
}

function FluidColumn({ level, height, radius, color }) {
  const ref = useRef()
  useFrame((_, dt) => {
    if (!ref.current) return
    const target = THREE.MathUtils.clamp(level, 0.01, 1)
    const s = THREE.MathUtils.lerp(ref.current.scale.y, target, 1 - Math.exp(-dt * 3))
    ref.current.scale.y = s
    ref.current.position.y = -height / 2 + (height * s) / 2
  })
  return (
    <mesh ref={ref} scale={[1, level, 1]}>
      <cylinderGeometry args={[radius, radius, height, 48]} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={0.55}
        roughness={0.1}
        emissive={color}
        emissiveIntensity={0.25}
      />
    </mesh>
  )
}
