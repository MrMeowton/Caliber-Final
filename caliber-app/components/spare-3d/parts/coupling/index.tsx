import React, { useMemo } from "react";
import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "coupling",
  name: "Coupling",
  size: [1, 0.65, 0.65],
};

export default function Coupling({ color, highlight, detail = "high" }: PartProps) {
  const emissive = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;
  const isLow = detail === "low";

  const numBolts = 8;
  const boltAngles = useMemo(() => {
    return Array.from({ length: numBolts }, (_, i) => (i / numBolts) * Math.PI * 2);
  }, [numBolts]);

  const metalColor = color || "#475569";
  const spacerColor = "#64748b";
  const discPackColor = "#cbd5e1";
  const boltColor = "#94a3b8";

  if (isLow) {
    return (
      <group>
        {/* Low-detail: 5 meshes */}
        <mesh position={[-0.34, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.325, 0.22, 0.28, 16]} />
          <meshStandardMaterial
            color={metalColor}
            metalness={0.75}
            roughness={0.35}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
        <mesh position={[0.34, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.22, 0.325, 0.28, 16]} />
          <meshStandardMaterial
            color={metalColor}
            metalness={0.75}
            roughness={0.35}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
        <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.2, 0.2, 0.38, 16]} />
          <meshStandardMaterial
            color={spacerColor}
            metalness={0.7}
            roughness={0.4}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
        <mesh position={[-0.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.31, 0.31, 0.04, 16]} />
          <meshStandardMaterial
            color={discPackColor}
            metalness={0.9}
            roughness={0.15}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
        <mesh position={[0.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.31, 0.31, 0.04, 16]} />
          <meshStandardMaterial
            color={discPackColor}
            metalness={0.9}
            roughness={0.15}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
      </group>
    );
  }

  return (
    <group>
      {/* Driving Hub Left */}
      <mesh position={[-0.38, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.22, 0.22, 0.24, 32]} />
        <meshStandardMaterial
          color={metalColor}
          metalness={0.75}
          roughness={0.35}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      {/* Driver Flange */}
      <mesh position={[-0.24, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.325, 0.325, 0.05, 32]} />
        <meshStandardMaterial
          color={metalColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Driven Hub Right */}
      <mesh position={[0.38, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.22, 0.22, 0.24, 32]} />
        <meshStandardMaterial
          color={metalColor}
          metalness={0.75}
          roughness={0.35}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      {/* Driven Flange */}
      <mesh position={[0.24, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.325, 0.325, 0.05, 32]} />
        <meshStandardMaterial
          color={metalColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Center Spacer Spool */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.18, 0.18, 0.38, 32]} />
        <meshStandardMaterial
          color={spacerColor}
          metalness={0.7}
          roughness={0.4}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      {/* Center Spacer Flanges */}
      <mesh position={[-0.17, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.325, 0.325, 0.04, 32]} />
        <meshStandardMaterial
          color={spacerColor}
          metalness={0.75}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      <mesh position={[0.17, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.325, 0.325, 0.04, 32]} />
        <meshStandardMaterial
          color={spacerColor}
          metalness={0.75}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Flexible Disc Packs */}
      <mesh position={[-0.205, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.31, 0.31, 0.03, 32]} />
        <meshStandardMaterial
          color={discPackColor}
          metalness={0.9}
          roughness={0.15}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      <mesh position={[0.205, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.31, 0.31, 0.03, 32]} />
        <meshStandardMaterial
          color={discPackColor}
          metalness={0.9}
          roughness={0.15}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* 8 Coupling Bolts */}
      {boltAngles.map((a) => (
        <group key={a}>
          <mesh
            position={[-0.2, Math.cos(a) * 0.26, Math.sin(a) * 0.26]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.02, 0.02, 0.12, 10]} />
            <meshStandardMaterial
              color={boltColor}
              metalness={0.85}
              roughness={0.25}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
          <mesh
            position={[0.2, Math.cos(a) * 0.26, Math.sin(a) * 0.26]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.02, 0.02, 0.12, 10]} />
            <meshStandardMaterial
              color={boltColor}
              metalness={0.85}
              roughness={0.25}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
