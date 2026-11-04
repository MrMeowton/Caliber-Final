import { useMemo } from "react";
import * as THREE from "three";
import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "tubing",
  name: "Tubing",
  size: [1, 0.55, 0.3],
};

export default function Tubing({ color, highlight, detail = "high" }: PartProps) {
  const emissive = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;
  const isLow = detail === "low";

  // Create smooth instrument tube curve with two 90-degree bends
  const curve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.48, -0.22, 0.1),
      new THREE.Vector3(-0.25, -0.22, 0.1),
      new THREE.Vector3(-0.15, -0.15, 0.05),
      new THREE.Vector3(-0.1, 0.12, 0.0),
      new THREE.Vector3(0.05, 0.22, -0.05),
      new THREE.Vector3(0.25, 0.22, -0.08),
      new THREE.Vector3(0.48, 0.22, -0.08),
    ]);
  }, []);

  const tubeColor = color || "#cbd5e1"; // Seamless stainless steel tubing
  const nutColor = "#94a3b8";

  return (
    <group>
      {/* Bent instrument tube along curve */}
      <mesh>
        <tubeGeometry args={[curve, isLow ? 24 : 48, 0.035, isLow ? 8 : 16, false]} />
        <meshStandardMaterial
          color={tubeColor}
          metalness={0.85}
          roughness={0.2}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Inlet Swagelok / compression nut on left */}
      <mesh position={[-0.45, -0.22, 0.1]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.065, 0.065, 0.07, 6]} />
        <meshStandardMaterial
          color={nutColor}
          metalness={0.85}
          roughness={0.25}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Outlet Swagelok / compression nut on right */}
      <mesh position={[0.45, 0.22, -0.08]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.065, 0.065, 0.07, 6]} />
        <meshStandardMaterial
          color={nutColor}
          metalness={0.85}
          roughness={0.25}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
    </group>
  );
}
