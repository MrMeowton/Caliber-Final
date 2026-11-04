import React from "react";
import * as THREE from "three";
import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "packing-set",
  name: "Packing set",
  size: [0.8, 1, 1],
};

export default function PackingSet({ color, highlight, detail = "high" }: PartProps) {
  const emissive = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;
  const isLow = detail === "low";

  const graphiteColor = color || "#334155";
  const lanternColor = "#d97706";

  return (
    <group>
      {/* Ring 1 - Bottom End Ring */}
      <mesh position={[-0.3, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.5, 0.5, 0.12, isLow ? 16 : 36, 1, true]} />
        <meshStandardMaterial
          color={graphiteColor}
          metalness={0.4}
          roughness={0.6}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Ring 2 - Intermediate Ring */}
      <mesh position={[-0.15, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.5, 0.5, 0.12, isLow ? 16 : 36, 1, true]} />
        <meshStandardMaterial
          color={graphiteColor}
          metalness={0.4}
          roughness={0.6}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Lantern Ring (Brass / SS fluid distribution spacer) in middle */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.48, 0.48, 0.14, isLow ? 16 : 36, 1, true]} />
        <meshStandardMaterial
          color={lanternColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Ring 3 - Intermediate Ring */}
      <mesh position={[0.15, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.5, 0.5, 0.12, isLow ? 16 : 36, 1, true]} />
        <meshStandardMaterial
          color={graphiteColor}
          metalness={0.4}
          roughness={0.6}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Ring 4 - Top End Ring */}
      <mesh position={[0.3, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.5, 0.5, 0.12, isLow ? 16 : 36, 1, true]} />
        <meshStandardMaterial
          color={graphiteColor}
          metalness={0.4}
          roughness={0.6}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Central Stem Passage Bore along X */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.32, 0.32, 0.76, isLow ? 14 : 32, 1, true]} />
        <meshStandardMaterial
          color="#1e293b"
          metalness={0.3}
          roughness={0.7}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Lantern Ring port grooves (high detail) */}
      {!isLow && (
        <mesh position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.485, 0.012, 10, 40]} />
          <meshStandardMaterial
            color="#92400e"
            metalness={0.85}
            roughness={0.25}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
      )}
    </group>
  );
}
