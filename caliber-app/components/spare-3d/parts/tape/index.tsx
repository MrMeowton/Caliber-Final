import React from "react";
import * as THREE from "three";
import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "tape",
  name: "Tape",
  size: [0.35, 1, 1],
};

export default function Tape({ color, highlight, detail = "high" }: PartProps) {
  const emissive = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;
  const isLow = detail === "low";

  const ptfeColor = color || "#f8fafc";
  const spoolColor = "#0284c7";

  return (
    <group>
      {/* Molded Plastic Inner Spool Hub along X with DoubleSide */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.26, 0.26, 0.34, isLow ? 16 : 40, 1, true]} />
        <meshStandardMaterial
          color={spoolColor}
          metalness={0.2}
          roughness={0.5}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Wrapped PTFE Thread Seal Tape Roll in YZ plane */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.48, 0.48, 0.3, isLow ? 16 : 40, 1, true]} />
        <meshStandardMaterial
          color={ptfeColor}
          metalness={0.05}
          roughness={0.7}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Outer Side Retaining Flanges on Spool with DoubleSide */}
      <mesh position={[-0.16, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.5, 0.5, 0.02, isLow ? 16 : 40, 1, true]} />
        <meshStandardMaterial
          color={spoolColor}
          metalness={0.25}
          roughness={0.45}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0.16, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.5, 0.5, 0.02, isLow ? 16 : 40, 1, true]} />
        <meshStandardMaterial
          color={spoolColor}
          metalness={0.25}
          roughness={0.45}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Loose Tape Leader Tail (high detail) */}
      {!isLow && (
        <mesh position={[0, 0.49, 0.06]} rotation={[0, 0.2, 0]}>
          <boxGeometry args={[0.28, 0.01, 0.12]} />
          <meshStandardMaterial
            color={ptfeColor}
            metalness={0.05}
            roughness={0.7}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
      )}
    </group>
  );
}
