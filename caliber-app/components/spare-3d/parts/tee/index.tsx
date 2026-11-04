import React from "react";
import * as THREE from "three";
import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "tee",
  name: "Tee",
  size: [1, 0.65, 0.38],
};

export default function Tee({ color, highlight, detail = "high" }: PartProps) {
  const emissive = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;
  const isLow = detail === "low";

  const teeColor = color || "#64748b";
  const bevelColor = "#cbd5e1";

  // Center tee symmetrically: run pipe is at y = -0.13, branch extends to y = +0.31
  return (
    <group position={[0, -0.13, 0]}>
      {/* Horizontal Run Pipe Cylinder along X */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.18, 0.18, 0.96, isLow ? 16 : 36]} />
        <meshStandardMaterial
          color={teeColor}
          metalness={0.75}
          roughness={0.35}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Vertical Branch Outlet Pipe along Y */}
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.44, isLow ? 16 : 36]} />
        <meshStandardMaterial
          color={teeColor}
          metalness={0.75}
          roughness={0.35}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Forged crotch saddle reinforcement at intersection */}
      <mesh position={[0, 0.08, 0]}>
        <sphereGeometry args={[0.22, isLow ? 12 : 24, isLow ? 8 : 16]} />
        <meshStandardMaterial
          color={teeColor}
          metalness={0.75}
          roughness={0.35}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Beveled weld preps on 3 ports (high detail) */}
      {!isLow && (
        <>
          <mesh position={[-0.485, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.15, 0.18, 0.02, 36, 1, true]} />
            <meshStandardMaterial
              color={bevelColor}
              metalness={0.85}
              roughness={0.2}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh position={[0.485, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <cylinderGeometry args={[0.15, 0.18, 0.02, 36, 1, true]} />
            <meshStandardMaterial
              color={bevelColor}
              metalness={0.85}
              roughness={0.2}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh position={[0, 0.445, 0]}>
            <cylinderGeometry args={[0.15, 0.18, 0.02, 36, 1, true]} />
            <meshStandardMaterial
              color={bevelColor}
              metalness={0.85}
              roughness={0.2}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
              side={THREE.DoubleSide}
            />
          </mesh>
        </>
      )}
    </group>
  );
}
