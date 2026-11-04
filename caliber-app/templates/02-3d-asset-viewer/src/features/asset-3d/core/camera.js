import * as THREE from 'three'

// Preset kamera bawaan. Override lewat `asset.cameraViews` di config.
// pos = letak kamera, target = titik yang dilihat
export const DEFAULT_CAMERA_VIEWS = {
  iso: { label: 'Isometrik', pos: [6, 5, 8], target: [0, 1, 0] },
  front: { label: 'Depan', pos: [0, 1.4, 8], target: [0, 1, 0] },
  top: { label: 'Atas', pos: [0, 9, 0.01], target: [0, 0, 0] },
  side: { label: 'Samping', pos: [9, 1.6, 0], target: [0, 1, 0] },
}

export function goToView(controls, view, animate = true) {
  if (!controls || !view) return
  controls.setLookAt(...view.pos, ...view.target, animate)
}

// Terbang ke sebuah objek sambil mempertahankan arah pandang saat ini.
// Ada jarak minimum supaya komponen kecil tidak terlalu dekat.
export function focusObject(controls, object, { minDistance = 3.8, radiusFactor = 3.8, animate = true } = {}) {
  if (!controls || !object) return
  const sphere = new THREE.Box3().setFromObject(object).getBoundingSphere(new THREE.Sphere())
  const dir = controls.camera.position.clone().sub(controls.getTarget(new THREE.Vector3())).normalize()
  const pos = sphere.center.clone().addScaledVector(dir, Math.max(sphere.radius * radiusFactor, minDistance))
  controls.setLookAt(pos.x, pos.y, pos.z, sphere.center.x, sphere.center.y, sphere.center.z, animate)
}
