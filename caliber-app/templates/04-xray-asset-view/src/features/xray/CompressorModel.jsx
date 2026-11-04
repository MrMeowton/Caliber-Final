// =========================================
// CompressorModel — kompresor sederhana (prosedural, tanpa file 3D).
// -----------------------------------------
// Isi dalam : poros, impeller (berputar), 2 bearing (DE & NDE)
// Casing    : badan silinder + 2 tutup ujung → dibungkus XRayShell
// Bearing   : dibungkus FaultPulse, aktif bila id-nya ada di `faults`
//
// Ganti model ini dengan GLTF milik project utama: cukup bungkus mesh casing
// dengan <XRayShell> dan mesh bearing dengan <FaultPulse>.
// =========================================

import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { DoubleSide } from 'three'
import FaultPulse from './FaultPulse'
import { COMPRESSOR_PARTS } from './parts'
import XRayShell from './XRayShell'

const ALONG_X = [0, 0, Math.PI / 2] // putar silinder (sumbu Y) agar sejajar sumbu X

function Bearing() {
  const balls = Array.from({ length: 10 }, (_, i) => (i / 10) * Math.PI * 2)
  return (
    <group rotation={[0, Math.PI / 2, 0]}>
      <mesh>
        <torusGeometry args={[0.3, 0.06, 16, 48]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.25} />
      </mesh>
      <mesh>
        <torusGeometry args={[0.16, 0.045, 16, 48]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.3} />
      </mesh>
      {balls.map((a) => (
        <mesh key={a} position={[Math.cos(a) * 0.23, Math.sin(a) * 0.23, 0]}>
          <sphereGeometry args={[0.045, 16, 12]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.15} />
        </mesh>
      ))}
    </group>
  )
}

function Rotor({ rpm }) {
  const ref = useRef()
  useFrame((_, dt) => {
    ref.current.rotation.x += (rpm / 60) * Math.PI * 2 * dt * 0.15 // diperlambat agar enak dilihat
  })
  const blades = Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2)
  return (
    <group ref={ref}>
      <mesh rotation={ALONG_X}>
        <cylinderGeometry args={[0.07, 0.07, 3.6, 24]} />
        <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh rotation={ALONG_X}>
        <cylinderGeometry args={[0.18, 0.28, 0.5, 32]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.5} roughness={0.4} />
      </mesh>
      {blades.map((a) => (
        <mesh key={a} rotation={[a, 0, 0]} position={[0, Math.cos(a) * 0.4, Math.sin(a) * 0.4]}>
          <boxGeometry args={[0.42, 0.28, 0.04]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.5} roughness={0.4} />
        </mesh>
      ))}
    </group>
  )
}

export default function CompressorModel({ xray = false, onShellClick, faults = {}, onPartClick, rpm = 2950 }) {
  const casingMat = { color: '#64748b', metalness: 0.55, roughness: 0.45, side: DoubleSide }

  return (
    <group>
      {/* ---------- isi dalam ---------- */}
      <Rotor rpm={rpm} />
      {COMPRESSOR_PARTS.map((p) => (
        <FaultPulse
          key={p.id}
          position={[p.x, 0, 0]}
          active={Boolean(faults[p.id])}
          radius={0.42}
          label={faults[p.id] && { title: p.name, value: faults[p.id].value }}
          showLabel={xray}
          onClick={xray ? () => onPartClick?.(p.id) : undefined}
        >
          <Bearing />
        </FaultPulse>
      ))}

      {/* ---------- casing (x-ray + exploded) ---------- */}
      <XRayShell active={xray} explode={[0, 0.25, 0]} onClick={onShellClick}>
        <mesh rotation={ALONG_X}>
          <cylinderGeometry args={[0.72, 0.72, 2.5, 48, 1, true]} />
          <meshStandardMaterial {...casingMat} />
        </mesh>
        <mesh position={[0, 0.85, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.35, 32]} />
          <meshStandardMaterial {...casingMat} />
        </mesh>
      </XRayShell>
      <XRayShell active={xray} explode={[-0.9, 0, 0]} onClick={onShellClick}>
        <mesh position={[-1.3, 0, 0]} rotation={ALONG_X}>
          <cylinderGeometry args={[0.78, 0.78, 0.12, 48]} />
          <meshStandardMaterial {...casingMat} color="#526079" />
        </mesh>
      </XRayShell>
      <XRayShell active={xray} explode={[0.9, 0, 0]} onClick={onShellClick}>
        <mesh position={[1.3, 0, 0]} rotation={ALONG_X}>
          <cylinderGeometry args={[0.78, 0.78, 0.12, 48]} />
          <meshStandardMaterial {...casingMat} color="#526079" />
        </mesh>
      </XRayShell>

      {/* ---------- alas (tidak ikut x-ray) ---------- */}
      <mesh position={[0, -0.95, 0]}>
        <boxGeometry args={[3.4, 0.16, 1.4]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </mesh>
      {[-0.9, 0.9].map((x) => (
        <mesh key={x} position={[x, -0.75, 0]}>
          <boxGeometry args={[0.25, 0.3, 0.9]} />
          <meshStandardMaterial color="#334155" roughness={0.7} />
        </mesh>
      ))}
    </group>
  )
}
