import React, { useMemo } from "react";
import * as THREE from "three";
import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "flange",
  name: "Flange",
  size: [0.55, 1, 1],
};

export default function Flange({ color, highlight, detail = "high" }: PartProps) {
  const emissive = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;
  const isLow = detail === "low";

  const numHoles = 8;
  const holeAngles = useMemo(() => {
    return Array.from({ length: numHoles }, (_, i) => (i / numHoles) * Math.PI * 2);
  }, [numHoles]);

  const flangeColor = color || "#64748b";
  const faceColor = "#cbd5e1";

  if (isLow) {
    return (
      <group>
        {/* Low-detail: 3 meshes */}
        <mesh position={[0.1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.5, 0.5, 0.14, 18]} />
          <meshStandardMaterial
            color={flangeColor}
            metalness={0.8}
            roughness={0.3}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
        <mesh position={[0.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.34, 0.34, 0.06, 18]} />
          <meshStandardMaterial
            color={faceColor}
            metalness={0.85}
            roughness={0.2}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
        <mesh position={[-0.1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.34, 0.23, 0.26, 18]} />
          <meshStandardMaterial
            color={flangeColor}
            metalness={0.8}
            roughness={0.3}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
      </group>
    );
  }

  return (
    <group>
      {/* Main Flange Disc along X */}
      <mesh position={[0.1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.5, 0.5, 0.14, 40]} />
        <meshStandardMaterial
          color={flangeColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Raised Face (RF) */}
      <mesh position={[0.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.34, 0.34, 0.06, 40]} />
        <meshStandardMaterial
          color={faceColor}
          metalness={0.85}
          roughness={0.2}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Tapered Weld-Neck Hub */}
      <mesh position={[-0.1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.34, 0.23, 0.26, 36]} />
        <meshStandardMaterial
          color={flangeColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Pipe Weld Prep Hub */}
      <mesh position={[-0.25, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.23, 0.23, 0.05, 36]} />
        <meshStandardMaterial
          color={flangeColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Internal Flow Bore with DoubleSide */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.16, 0.16, 0.56, 32, 1, true]} />
        <meshStandardMaterial
          color="#1e293b"
          metalness={0.4}
          roughness={0.6}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 8 Bolt Holes */}
      {holeAngles.map((a) => (
        <mesh
          key={a}
          position={[0.1, Math.cos(a) * 0.42, Math.sin(a) * 0.42]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.045, 0.045, 0.15, 12]} />
          <meshStandardMaterial
            color="#0f172a"
            metalness={0.3}
            roughness={0.7}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
      ))}
    </group>
  );
}
