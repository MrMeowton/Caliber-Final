import { useMemo } from 'react'
import { RoundedBox, useGLTF } from '@react-three/drei'

// =========================================
// Bentuk generik — untuk aset yang belum punya bentuk khusus
// =========================================

// shapeProps: { size: [x, y, z], radius }
export function Box({ mat, part }) {
  const { size = [1, 1, 1], radius = 0.05 } = part.shapeProps ?? {}
  return <RoundedBox args={size} radius={radius} material={mat.body} castShadow receiveShadow />
}

// shapeProps: { radius, height, axis: 'y' | 'x' | 'z' }
export function Cylinder({ mat, part }) {
  const { radius = 0.5, height = 1, axis = 'y' } = part.shapeProps ?? {}
  const rotation = axis === 'x' ? [0, 0, Math.PI / 2] : axis === 'z' ? [Math.PI / 2, 0, 0] : [0, 0, 0]
  return (
    <mesh rotation={rotation} material={mat.body} castShadow receiveShadow>
      <cylinderGeometry args={[radius, radius, height, 40]} />
    </mesh>
  )
}

// Model asli dari file .glb / .gltf
// shapeProps: { url, scale = 1, rotation, keepMaterials = false }
//   keepMaterials=false → semua mesh memakai material modul (efek hover/fokus/status aktif)
//   keepMaterials=true  → warna/tekstur asli model dipertahankan (efek hover tidak berlaku)
export function Gltf({ mat, part }) {
  const { url, scale = 1, rotation = [0, 0, 0], keepMaterials = false } = part.shapeProps ?? {}
  const { scene } = useGLTF(url)

  const object = useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse((o) => {
      if (!o.isMesh) return
      o.castShadow = true
      o.receiveShadow = true
      if (!keepMaterials) o.material = mat.body
    })
    return clone
  }, [scene, mat.body, keepMaterials])

  return <primitive object={object} scale={scale} rotation={rotation} />
}
