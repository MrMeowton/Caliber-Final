import { useMemo } from "react";
import * as THREE from "three";
import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "cable",
  name: "Cable",
  size: [1, 0.6, 0.3],
};

export default function Cable({ color, highlight, detail = "high" }: PartProps) {
  const emissive = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;
  const isLow = detail === "low";

  // Smooth curved industrial cable trajectory
  const jacketCurve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.48, -0.22, 0.08),
      new THREE.Vector3(-0.25, -0.18, 0.04),
      new THREE.Vector3(-0.05, 0.05, -0.02),
      new THREE.Vector3(0.12, 0.18, -0.05),
      new THREE.Vector3(0.3, 0.22, -0.06),
    ]);
  }, []);

  const jacketColor = color || "#18181b"; // Heavy-duty black PVC outer jacket
  const copperColor = "#b45309";

  return (
    <group>
      {/* Outer Protective Jacket along curve */}
      <mesh>
        <tubeGeometry args={[jacketCurve, isLow ? 24 : 48, 0.08, isLow ? 8 : 16, false]} />
        <meshStandardMaterial
          color={jacketColor}
          metalness={0.15}
          roughness={0.75}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Stripped Section at end with 3 colored insulated cores extending to +X */}
      <mesh position={[0.38, 0.24, -0.04]} rotation={[0, 0, -0.2]}>
        <cylinderGeometry args={[0.028, 0.028, 0.16, isLow ? 8 : 16]} />
        <meshStandardMaterial
          color="#dc2626"
          metalness={0.2}
          roughness={0.6}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      <mesh position={[0.38, 0.2, -0.08]} rotation={[0, 0, -0.2]}>
        <cylinderGeometry args={[0.028, 0.028, 0.16, isLow ? 8 : 16]} />
        <meshStandardMaterial
          color="#2563eb"
          metalness={0.2}
          roughness={0.6}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Exposed bare copper stranded conductor wire tips (high detail) */}
      {!isLow && (
        <>
          <mesh position={[0.46, 0.255, -0.04]} rotation={[0, 0, -0.2]}>
            <cylinderGeometry args={[0.016, 0.016, 0.06, 10]} />
            <meshStandardMaterial
              color={copperColor}
              metalness={0.9}
              roughness={0.2}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
          <mesh position={[0.46, 0.215, -0.08]} rotation={[0, 0, -0.2]}>
            <cylinderGeometry args={[0.016, 0.016, 0.06, 10]} />
            <meshStandardMaterial
              color={copperColor}
              metalness={0.9}
              roughness={0.2}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
        </>
      )}
    </group>
  );
}
