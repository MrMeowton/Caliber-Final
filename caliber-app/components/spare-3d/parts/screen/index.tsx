import React from "react";
import * as THREE from "three";
import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "screen",
  name: "Screen",
  size: [1, 0.5, 0.5],
};

export default function Screen({ color, highlight, detail = "high" }: PartProps) {
  const emissive = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;
  const isLow = detail === "low";

  const screenColor = color || "#cbd5e1";
  const flangeColor = "#64748b";

  return (
    <group>
      {/* Inlet Mounting Flange at x = -0.46 */}
      <mesh position={[-0.46, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.25, 0.25, 0.06, isLow ? 16 : 36]} />
        <meshStandardMaterial
          color={flangeColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      {/* Flange Bore */}
      <mesh position={[-0.46, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.18, 0.18, 0.07, isLow ? 12 : 24, 1, true]} />
        <meshStandardMaterial
          color="#0f172a"
          metalness={0.3}
          roughness={0.7}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Perforated Screen Strainer Basket Cylinder along X with DoubleSide */}
      <mesh position={[0.02, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.2, 0.2, 0.88, isLow ? 16 : 36, 1, true]} />
        <meshStandardMaterial
          color={screenColor}
          metalness={0.75}
          roughness={0.4}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Closed End Cap Disc at x = 0.46 */}
      <mesh position={[0.46, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.2, 0.2, 0.04, isLow ? 16 : 36]} />
        <meshStandardMaterial
          color={flangeColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Longitudinal Stiffener Ribs & End Handle (high detail) */}
      {!isLow && (
        <>
          <mesh position={[0.02, 0.205, 0]}>
            <boxGeometry args={[0.88, 0.02, 0.03]} />
            <meshStandardMaterial
              color={flangeColor}
              metalness={0.8}
              roughness={0.3}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
          <mesh position={[0.02, -0.205, 0]}>
            <boxGeometry args={[0.88, 0.02, 0.03]} />
            <meshStandardMaterial
              color={flangeColor}
              metalness={0.8}
              roughness={0.3}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
          <mesh position={[0.49, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.08, 0.015, 8, 24, Math.PI]} />
            <meshStandardMaterial
              color={flangeColor}
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
