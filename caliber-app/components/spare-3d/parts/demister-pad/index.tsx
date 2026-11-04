import React from "react";
import * as THREE from "three";
import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "demister-pad",
  name: "Demister pad",
  size: [0.2, 1, 1],
};

export default function DemisterPad({ color, highlight, detail = "high" }: PartProps) {
  const emissive = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;
  const isLow = detail === "low";

  const meshColor = color || "#94a3b8";
  const gridColor = "#64748b";

  return (
    <group>
      {/* Knitted Wire Mesh Pad Core Slab: lying in YZ, facing +X */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.49, 0.49, 0.14, isLow ? 24 : 48]} />
        <meshStandardMaterial
          color={meshColor}
          metalness={0.7}
          roughness={0.5}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Outer Circumference Retaining Band */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.5, 0.5, 0.16, isLow ? 24 : 48, 1, true]} />
        <meshStandardMaterial
          color={gridColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Top Support Grid Bars at non-coplanar offsets to prevent Z-fighting */}
      <mesh position={[0.078, 0, 0]}>
        <boxGeometry args={[0.02, 0.94, 0.03]} />
        <meshStandardMaterial
          color={gridColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      <mesh position={[0.082, 0, 0]}>
        <boxGeometry args={[0.02, 0.03, 0.94]} />
        <meshStandardMaterial
          color={gridColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* High detail: Additional crossing support grid bars on top and bottom */}
      {!isLow && (
        <>
          <mesh position={[0.08, 0.22, 0]}>
            <boxGeometry args={[0.02, 0.02, 0.82]} />
            <meshStandardMaterial
              color={gridColor}
              metalness={0.8}
              roughness={0.3}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
          <mesh position={[0.08, -0.22, 0]}>
            <boxGeometry args={[0.02, 0.02, 0.82]} />
            <meshStandardMaterial
              color={gridColor}
              metalness={0.8}
              roughness={0.3}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>

          {/* Bottom Support Grid at x = -0.08 */}
          <mesh position={[-0.078, 0, 0]}>
            <boxGeometry args={[0.02, 0.94, 0.03]} />
            <meshStandardMaterial
              color={gridColor}
              metalness={0.8}
              roughness={0.3}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
          <mesh position={[-0.082, 0, 0]}>
            <boxGeometry args={[0.02, 0.03, 0.94]} />
            <meshStandardMaterial
              color={gridColor}
              metalness={0.8}
              roughness={0.3}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
        </>
      )}
    </group>
  );
}
