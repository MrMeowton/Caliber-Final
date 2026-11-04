// =========================================
// XRayShell — pembungkus "casing" yang bisa tembus pandang.
// -----------------------------------------
// Bungkus mesh casing apa pun (bentuk sendiri atau GLTF) dengan komponen ini.
// Saat `active` = true:
//   • material casing memudar ke `opacity` dan berwarna cyan (efek x-ray)
//   • grup bergeser sejauh `explode` (efek exploded view)
// Klik casing memanggil `onClick` (dipakai untuk membuka x-ray). Selama x-ray aktif
// casing tidak bisa diklik, sehingga komponen di dalamnya yang menerima klik.
// =========================================

import { useFrame } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useRef } from 'react'
import { Color, MathUtils, Vector3 } from 'three'

const XRAY_TINT = new Color('#38bdf8')

export default function XRayShell({
  active = false,
  opacity = 0.12, // opasitas casing saat x-ray
  explode = [0, 0, 0], // pergeseran [x,y,z] saat x-ray (exploded view)
  speed = 6, // kecepatan transisi
  onClick,
  children,
}) {
  const group = useRef()
  const mats = useRef([]) // { mat, baseColor }
  const t = useRef(0) // 0 = solid, 1 = x-ray penuh
  const offset = useRef(new Vector3())

  // Kumpulkan material milik casing (di-clone agar tidak bocor ke mesh lain)
  useLayoutEffect(() => {
    const list = []
    group.current.traverse((o) => {
      if (!o.isMesh) return
      o.material = o.material.clone()
      o.material.transparent = true
      o.renderOrder = 10 // gambar casing setelah isi dalamnya
      list.push({ mat: o.material, baseColor: o.material.color.clone() })
    })
    mats.current = list
  }, [])

  // Saat x-ray aktif, casing tidak boleh "menangkap" klik → komponen di dalam bisa diklik
  useEffect(() => {
    group.current.traverse((o) => {
      if (!o.isMesh) return
      o.userData.xrRaycast ??= o.raycast
      o.raycast = active ? () => null : o.userData.xrRaycast
    })
  }, [active])

  useFrame((_, dt) => {
    t.current = MathUtils.damp(t.current, active ? 1 : 0, speed, dt)
    const k = t.current

    for (const { mat, baseColor } of mats.current) {
      mat.opacity = MathUtils.lerp(1, opacity, k)
      mat.depthWrite = k < 0.5 // matikan depth agar isi di dalam terlihat
      mat.color.copy(baseColor).lerp(XRAY_TINT, k * 0.6)
      if (mat.emissive) mat.emissive.copy(XRAY_TINT).multiplyScalar(k * 0.25)
    }

    offset.current.set(...explode).multiplyScalar(k)
    group.current.position.copy(offset.current)
  })

  return (
    <group
      ref={group}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.(e)
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        document.body.style.cursor = ''
      }}
    >
      {children}
    </group>
  )
}
