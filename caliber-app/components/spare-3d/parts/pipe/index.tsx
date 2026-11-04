import React from "react";
import * as THREE from "three";
import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "pipe",
  name: "Pipe",
  size: [1, 0.4, 0.4],
};

export default function Pipe({ color, highlight, detail = "high" }: PartProps) {
  const emissive = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;
  const isLow = detail === "low";

  const pipeColor = color || "#64748b"; // Seamless carbon steel
  const boreColor = "#1e293b";

  return (
    <group>
      {/* Main Pipe Outer Shell along X */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.2, 0.2, 0.94, isLow ? 16 : 40, 1, true]} />
        <meshStandardMaterial
          color={pipeColor}
          metalness={0.75}
          roughness={0.35}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Internal Flow Bore along X */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.16, 0.16, 0.96, isLow ? 14 : 36, 1, true]} />
        <meshStandardMaterial
          color={boreColor}
          metalness={0.4}
          roughness={0.6}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 37.5-degree Beveled Welding Prep End Rings (high detail) */}
      {!isLow && (
        <>
          <mesh position={[-0.485, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.16, 0.2, 0.03, 40, 1, true]} />
            <meshStandardMaterial
              color="#cbd5e1"
              metalness={0.85}
              roughness={0.2}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh position={[0.485, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <cylinderGeometry args={[0.16, 0.2, 0.03, 40, 1, true]} />
            <meshStandardMaterial
              color="#cbd5e1"
              metalness={0.85}
              roughness={0.2}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* Heat Number Specification Stenciling Band */}
          <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.202, 0.202, 0.12, 36, 1, true]} />
            <meshStandardMaterial
              color="#475569"
              metalness={0.3}
              roughness={0.7}
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
