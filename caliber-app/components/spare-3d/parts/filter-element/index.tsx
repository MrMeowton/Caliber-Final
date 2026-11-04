import React, { useMemo } from "react";
import * as THREE from "three";
import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "filter-element",
  name: "Filter element",
  size: [1, 0.6, 0.6],
};

export default function FilterElement({ color, highlight, detail = "high" }: PartProps) {
  const emissive = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;
  const isLow = detail === "low";

  const numPleats = 16;
  const pleatAngles = useMemo(() => {
    return Array.from({ length: numPleats }, (_, i) => (i / numPleats) * Math.PI * 2);
  }, [numPleats]);

  const mediaColor = color || "#fed7aa";
  const capColor = "#475569";
  const gasketColor = "#18181b";

  if (isLow) {
    return (
      <group>
        {/* Low-detail: 3 meshes */}
        <mesh position={[-0.46, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.29, 0.29, 0.07, 16]} />
          <meshStandardMaterial
            color={capColor}
            metalness={0.8}
            roughness={0.3}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
        <mesh position={[0.46, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.29, 0.29, 0.07, 16]} />
          <meshStandardMaterial
            color={capColor}
            metalness={0.8}
            roughness={0.3}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
        <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.27, 0.27, 0.85, 20]} />
          <meshStandardMaterial
            color={mediaColor}
            metalness={0.15}
            roughness={0.8}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
      </group>
    );
  }

  return (
    <group>
      {/* Bottom Closed End Cap at x = -0.46 */}
      <mesh position={[-0.46, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.29, 0.29, 0.07, 36]} />
        <meshStandardMaterial
          color={capColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Top Open End Cap at x = 0.46 */}
      <mesh position={[0.46, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.29, 0.29, 0.07, 36]} />
        <meshStandardMaterial
          color={capColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      {/* Gasket Seal on top end cap */}
      <mesh position={[0.495, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.18, 0.02, 12, 32]} />
        <meshStandardMaterial
          color={gasketColor}
          metalness={0.1}
          roughness={0.8}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Main Filter Pleated Media Cylinder Core */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.25, 0.25, 0.85, 36, 1, true]} />
        <meshStandardMaterial
          color={mediaColor}
          metalness={0.15}
          roughness={0.8}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Center perforated tube core with DoubleSide */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.14, 0.14, 0.9, 28, 1, true]} />
        <meshStandardMaterial
          color="#94a3b8"
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Longitudinal Pleat Fin Ribs */}
      {pleatAngles.map((a) => (
        <mesh
          key={a}
          position={[0, Math.cos(a) * 0.265, Math.sin(a) * 0.265]}
          rotation={[a, 0, 0]}
        >
          <boxGeometry args={[0.85, 0.04, 0.015]} />
          <meshStandardMaterial
            color={mediaColor}
            metalness={0.2}
            roughness={0.75}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
      ))}
    </group>
  );
}
