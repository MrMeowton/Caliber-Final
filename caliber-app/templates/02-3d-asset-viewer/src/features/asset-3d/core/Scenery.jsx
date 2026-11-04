import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

// =========================================
// Elemen statis (tidak bisa diklik): alas/rangka dan pipa
// -----------------------------------------
// config:
//   statics: [{ size: [x, y, z], position: [x, y, z], color? }]
//   pipes:   [{ points: [[x,y,z], [x,y,z], ...], radius? }]   ← polyline, siku otomatis
// Pipa memudar saat mode explode / saat ada komponen yang difokuskan.
// =========================================

function Segment({ a, b, r, material }) {
  const { pos, len, quat } = useMemo(() => {
    const va = new THREE.Vector3(...a)
    const vb = new THREE.Vector3(...b)
    const dir = vb.clone().sub(va)
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize())
    return { pos: va.add(vb).multiplyScalar(0.5), len: dir.length(), quat: q }
  }, [a, b])
  return (
    <mesh position={pos} quaternion={quat} material={material} castShadow>
      <cylinderGeometry args={[r, r, len, 20]} />
    </mesh>
  )
}

export default function Scenery({
  statics = [],
  pipes = [],
  explode,
  selectedId,
  pipeColor = '#7c8a9e',
  frameColor = '#334155',
}) {
  const pipeMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: pipeColor, metalness: 0.75, roughness: 0.3, transparent: true }),
    [pipeColor],
  )
  const frameMats = useMemo(() => {
    const cache = {}
    return (c = frameColor) =>
      (cache[c] ??= new THREE.MeshStandardMaterial({ color: c, metalness: 0.4, roughness: 0.6 }))
  }, [frameColor])

  useFrame((_, dt) => {
    const target = selectedId != null ? 0.15 : 1 - explode * 0.85
    pipeMat.opacity = THREE.MathUtils.lerp(pipeMat.opacity, target, 1 - Math.exp(-dt * 8))
    pipeMat.depthWrite = pipeMat.opacity > 0.6
  })

  return (
    <group>
      {statics.map((s, i) => (
        <RoundedBox
          key={`s${i}`}
          args={s.size}
          radius={s.radius ?? 0.04}
          position={s.position}
          material={frameMats(s.color)}
          castShadow
          receiveShadow
        />
      ))}

      {pipes.map((p, i) => {
        const r = p.radius ?? 0.08
        return (
          <group key={`p${i}`}>
            {p.points.slice(1).map((pt, j) => (
              <Segment key={j} a={p.points[j]} b={pt} r={r} material={pipeMat} />
            ))}
            {/* siku di setiap titik belok */}
            {p.points.slice(1, -1).map((pt, j) => (
              <mesh key={`e${j}`} position={pt} material={pipeMat} castShadow>
                <sphereGeometry args={[r * 1.25, 20, 20]} />
              </mesh>
            ))}
          </group>
        )
      })}
    </group>
  )
}
