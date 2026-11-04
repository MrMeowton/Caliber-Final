import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Putar sebuah objek pada sumbu tertentu, dengan percepatan/perlambatan halus.
// const ref = useSpin(running)  →  <mesh ref={ref} ... />
export function useSpin(running, { speed = 14, axis = 'x', ramp = 1.5 } = {}) {
  const ref = useRef()
  const current = useRef(0)
  useFrame((_, dt) => {
    current.current = THREE.MathUtils.lerp(current.current, running ? speed : 0, 1 - Math.exp(-dt * ramp))
    if (ref.current) ref.current.rotation[axis] += current.current * dt
  })
  return ref
}
