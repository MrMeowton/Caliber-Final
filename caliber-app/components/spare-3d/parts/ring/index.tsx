import React from "react";
import * as THREE from "three";
import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "ring",
  name: "Ring",
  size: [0.3, 1, 1],
};

export default function Ring({ color, highlight, detail = "high" }: PartProps) {
  const emissive = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;
  const isLow = detail === "low";

  const metalColor = color || "#94a3b8";
  const boreColor = "#cbd5e1";

  return (
    <group>
      {/* Main Wear Ring Cylinder along X */}
      <mesh position={[0.04, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.46, 0.46, 0.22, isLow ? 16 : 40, 1, true]} />
        <meshStandardMaterial
          color={metalColor}
          metalness={0.8}
          roughness={0.25}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* L-section Flange Lip on End */}
      <mesh position={[-0.1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.5, 0.5, 0.08, isLow ? 16 : 40, 1, true]} />
        <meshStandardMaterial
          color={metalColor}
          metalness={0.8}
          roughness={0.25}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Precision Inner Sealing Surface */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.41, 0.41, 0.29, isLow ? 16 : 40, 1, true]} />
        <meshStandardMaterial
          color={boreColor}
          metalness={0.85}
          roughness={0.15}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Front Face Chamfer / Ring Edge (high detail) */}
      {!isLow && (
        <>
          <mesh position={[-0.14, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.45, 0.015, 10, 48]} />
            <meshStandardMaterial
              color={metalColor}
              metalness={0.85}
              roughness={0.2}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
          <mesh position={[0.14, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.435, 0.015, 10, 48]} />
            <meshStandardMaterial
              color={metalColor}
              metalness={0.85}
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
