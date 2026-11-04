import React, { useMemo } from "react";
import * as THREE from "three";
import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "bearing-roller",
  name: "Bearing roller",
  size: [0.35, 1, 1],
};

export default function BearingRoller({ color, highlight, detail = "high" }: PartProps) {
  const emissive = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;
  const isLow = detail === "low";

  const numRollers = isLow ? 4 : 12;
  const rollerAngles = useMemo(() => {
    return Array.from({ length: numRollers }, (_, i) => (i / numRollers) * Math.PI * 2);
  }, [numRollers]);

  const mainColor = color || "#cbd5e1";
  const innerColor = "#94a3b8";
  const rollerColor = "#f8fafc";
  const cageColor = "#b45309";

  if (isLow) {
    return (
      <group>
        {/* Low-detail: 1 outer ring + 1 inner ring + 4 rollers = 6 meshes */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.5, 0.5, 0.35, 16, 1, true]} />
          <meshStandardMaterial
            color={mainColor}
            metalness={0.85}
            roughness={0.25}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.26, 0.26, 0.35, 16, 1, true]} />
          <meshStandardMaterial
            color={innerColor}
            metalness={0.85}
            roughness={0.25}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
            side={THREE.DoubleSide}
          />
        </mesh>
        {rollerAngles.map((a) => (
          <mesh
            key={a}
            position={[0, Math.cos(a) * 0.35, Math.sin(a) * 0.35]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.06, 0.06, 0.26, 10]} />
            <meshStandardMaterial
              color={rollerColor}
              metalness={0.95}
              roughness={0.12}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
        ))}
      </group>
    );
  }

  return (
    <group>
      {/* Outer Race Ring */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.5, 0.5, 0.35, 40, 1, true]} />
        <meshStandardMaterial
          color={mainColor}
          metalness={0.85}
          roughness={0.25}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Outer ring inner ground raceway */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.43, 0.43, 0.35, 40, 1, true]} />
        <meshStandardMaterial
          color={mainColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Inner Race Ring */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.26, 0.26, 0.35, 40, 1, true]} />
        <meshStandardMaterial
          color={innerColor}
          metalness={0.85}
          roughness={0.25}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Inner bore */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.18, 0.18, 0.35, 40, 1, true]} />
        <meshStandardMaterial
          color={innerColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Cage rings */}
      <mesh position={[-0.12, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.345, 0.02, 12, 40]} />
        <meshStandardMaterial
          color={cageColor}
          metalness={0.65}
          roughness={0.4}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      <mesh position={[0.12, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.345, 0.02, 12, 40]} />
        <meshStandardMaterial
          color={cageColor}
          metalness={0.65}
          roughness={0.4}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* 12 Cylindrical Rollers */}
      {rollerAngles.map((a) => (
        <mesh
          key={a}
          position={[0, Math.cos(a) * 0.345, Math.sin(a) * 0.345]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.06, 0.06, 0.26, 20]} />
          <meshStandardMaterial
            color={rollerColor}
            metalness={0.95}
            roughness={0.12}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
      ))}
    </group>
  );
}
