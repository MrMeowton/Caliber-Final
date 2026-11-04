import React, { useMemo } from "react";
import * as THREE from "three";
import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "bearing-ball",
  name: "Bearing ball",
  size: [0.3, 1, 1],
};

export default function BearingBall({ color, highlight, detail = "high" }: PartProps) {
  const emissive = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;
  const isLow = detail === "low";

  const numBalls = isLow ? 4 : 10;
  const ballAngles = useMemo(() => {
    return Array.from({ length: numBalls }, (_, i) => (i / numBalls) * Math.PI * 2);
  }, [numBalls]);

  const mainColor = color || "#cbd5e1";
  const innerColor = "#94a3b8";
  const ballColor = "#f1f5f9";
  const cageColor = "#d97706";

  if (isLow) {
    return (
      <group>
        {/* Low-detail: 1 outer race + 1 inner race + 4 balls = 6 meshes */}
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.42, 0.08, 12, 24]} />
          <meshStandardMaterial
            color={mainColor}
            metalness={0.85}
            roughness={0.2}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.22, 0.06, 12, 24]} />
          <meshStandardMaterial
            color={innerColor}
            metalness={0.85}
            roughness={0.2}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
        {ballAngles.map((a) => (
          <mesh key={a} position={[0, Math.cos(a) * 0.32, Math.sin(a) * 0.32]}>
            <sphereGeometry args={[0.065, 10, 8]} />
            <meshStandardMaterial
              color={ballColor}
              metalness={0.95}
              roughness={0.1}
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
      {/* Outer Race Torus */}
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.42, 0.08, 24, 48]} />
        <meshStandardMaterial
          color={mainColor}
          metalness={0.85}
          roughness={0.2}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      {/* Outer Race Shell Cylinder */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.5, 0.5, 0.28, 36, 1, true]} />
        <meshStandardMaterial
          color={mainColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Inner Race Torus */}
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.22, 0.06, 24, 48]} />
        <meshStandardMaterial
          color={innerColor}
          metalness={0.85}
          roughness={0.2}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      {/* Inner Bore Sleeve */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.16, 0.16, 0.28, 36, 1, true]} />
        <meshStandardMaterial
          color={innerColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Brass Cage Ring */}
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.32, 0.025, 14, 48]} />
        <meshStandardMaterial
          color={cageColor}
          metalness={0.7}
          roughness={0.35}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* 10 Precision Chrome Steel Balls */}
      {ballAngles.map((a) => (
        <mesh key={a} position={[0, Math.cos(a) * 0.32, Math.sin(a) * 0.32]}>
          <sphereGeometry args={[0.065, 20, 16]} />
          <meshStandardMaterial
            color={ballColor}
            metalness={0.95}
            roughness={0.1}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
      ))}
    </group>
  );
}
