import React from "react";
import * as THREE from "three";
import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "valve-globe",
  name: "Valve globe",
  size: [0.8, 1, 0.55],
};

export default function ValveGlobe({ color, highlight, detail = "high" }: PartProps) {
  const emissive = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;
  const isLow = detail === "low";

  const bodyColor = color || "#475569";
  const trimColor = "#d97706";
  const wheelColor = "#0284c7";

  if (isLow) {
    return (
      <group>
        {/* Low-detail: 6 meshes */}
        <mesh position={[0, -0.22, 0]}>
          <sphereGeometry args={[0.24, 16, 12]} />
          <meshStandardMaterial
            color={bodyColor}
            metalness={0.7}
            roughness={0.4}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
        <mesh position={[-0.34, -0.22, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.26, 0.26, 0.08, 16]} />
          <meshStandardMaterial
            color={bodyColor}
            metalness={0.75}
            roughness={0.35}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
        <mesh position={[0.34, -0.22, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.26, 0.26, 0.08, 16]} />
          <meshStandardMaterial
            color={bodyColor}
            metalness={0.75}
            roughness={0.35}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
        <mesh position={[0, 0.04, 0]}>
          <cylinderGeometry args={[0.18, 0.2, 0.16, 16]} />
          <meshStandardMaterial
            color={bodyColor}
            metalness={0.75}
            roughness={0.35}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
        <mesh position={[0, 0.22, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.54, 10]} />
          <meshStandardMaterial
            color="#cbd5e1"
            metalness={0.9}
            roughness={0.15}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
        <mesh position={[0, 0.44, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.2, 0.03, 10, 20]} />
          <meshStandardMaterial
            color={wheelColor}
            metalness={0.5}
            roughness={0.4}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
      </group>
    );
  }

  return (
    <group>
      {/* Spherical Valve Body */}
      <mesh position={[0, -0.22, 0]}>
        <sphereGeometry args={[0.24, 28, 20]} />
        <meshStandardMaterial
          color={bodyColor}
          metalness={0.7}
          roughness={0.4}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Inlet Flange on Left */}
      <mesh position={[-0.34, -0.22, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.26, 0.26, 0.08, 36]} />
        <meshStandardMaterial
          color={bodyColor}
          metalness={0.75}
          roughness={0.35}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Outlet Flange on Right */}
      <mesh position={[0.34, -0.22, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.26, 0.26, 0.08, 36]} />
        <meshStandardMaterial
          color={bodyColor}
          metalness={0.75}
          roughness={0.35}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Bonnet Neck at y = 0.04 */}
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.18, 0.2, 0.16, 32]} />
        <meshStandardMaterial
          color={bodyColor}
          metalness={0.75}
          roughness={0.35}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Gland Flange */}
      <mesh position={[0, 0.14, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.04, 20]} />
        <meshStandardMaterial
          color={bodyColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Rising Stem along Y */}
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.54, 18]} />
        <meshStandardMaterial
          color="#cbd5e1"
          metalness={0.9}
          roughness={0.15}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Handwheel at y = 0.44 */}
      <mesh position={[0, 0.44, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.2, 0.03, 16, 36]} />
        <meshStandardMaterial
          color={wheelColor}
          metalness={0.5}
          roughness={0.4}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      <mesh position={[0, 0.44, 0]}>
        <boxGeometry args={[0.38, 0.02, 0.025]} />
        <meshStandardMaterial
          color={wheelColor}
          metalness={0.5}
          roughness={0.4}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      <mesh position={[0, 0.44, 0]}>
        <boxGeometry args={[0.025, 0.02, 0.38]} />
        <meshStandardMaterial
          color={wheelColor}
          metalness={0.5}
          roughness={0.4}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Internal Globe Plug & Seat */}
      <mesh position={[0, -0.22, 0]}>
        <cylinderGeometry args={[0.08, 0.14, 0.12, 24]} />
        <meshStandardMaterial
          color={trimColor}
          metalness={0.85}
          roughness={0.25}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
    </group>
  );
}
