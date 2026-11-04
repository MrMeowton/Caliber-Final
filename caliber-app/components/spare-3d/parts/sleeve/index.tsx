import React from "react";
import * as THREE from "three";
import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "sleeve",
  name: "Sleeve",
  size: [1, 0.4, 0.4],
};

export default function Sleeve({ color, highlight, detail = "high" }: PartProps) {
  const emissive = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;
  const isLow = detail === "low";

  const metalColor = color || "#cbd5e1";
  const innerColor = "#64748b";

  return (
    <group>
      {/* Main Ground Sleeve Cylinder along X */}
      <mesh position={[-0.05, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.18, 0.18, 0.82, isLow ? 16 : 40]} />
        <meshStandardMaterial
          color={metalColor}
          metalness={0.85}
          roughness={0.2}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Bore Inner Tube with DoubleSide */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.12, 0.12, 1.01, isLow ? 14 : 32, 1, true]} />
        <meshStandardMaterial
          color={innerColor}
          metalness={0.6}
          roughness={0.5}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Locating Collar / Stop Shoulder at Drive End */}
      <mesh position={[0.42, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.2, 0.2, 0.14, isLow ? 16 : 40]} />
        <meshStandardMaterial
          color={metalColor}
          metalness={0.8}
          roughness={0.25}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Keyway slot & internal O-ring recess ring (high detail) */}
      {!isLow && (
        <>
          <mesh position={[0, 0.13, 0]}>
            <boxGeometry args={[0.6, 0.03, 0.04]} />
            <meshStandardMaterial
              color="#0f172a"
              metalness={0.4}
              roughness={0.6}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
          <mesh position={[-0.38, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.125, 0.01, 10, 32]} />
            <meshStandardMaterial
              color="#1e293b"
              metalness={0.2}
              roughness={0.8}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
        </>
      )}
    </group>
  );
}
