import React from "react";
import * as THREE from "three";
import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "valve-gate",
  name: "Valve gate",
  size: [0.8, 1, 0.55],
};

export default function ValveGate({ color, highlight, detail = "high" }: PartProps) {
  const emissive = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;
  const isLow = detail === "low";

  const castBodyColor = color || "#475569";
  const trimColor = "#d97706";
  const wheelColor = "#ef4444";

  if (isLow) {
    return (
      <group>
        {/* Low-detail: 6 meshes */}
        <mesh position={[0, -0.22, 0]}>
          <boxGeometry args={[0.5, 0.34, 0.34]} />
          <meshStandardMaterial
            color={castBodyColor}
            metalness={0.7}
            roughness={0.4}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
        <mesh position={[-0.32, -0.22, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.26, 0.26, 0.08, 16]} />
          <meshStandardMaterial
            color={castBodyColor}
            metalness={0.75}
            roughness={0.35}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
        <mesh position={[0.32, -0.22, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.26, 0.26, 0.08, 16]} />
          <meshStandardMaterial
            color={castBodyColor}
            metalness={0.75}
            roughness={0.35}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
        <mesh position={[0, 0.04, 0]}>
          <cylinderGeometry args={[0.18, 0.2, 0.18, 16]} />
          <meshStandardMaterial
            color={castBodyColor}
            metalness={0.75}
            roughness={0.35}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
        <mesh position={[0, 0.24, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.5, 10]} />
          <meshStandardMaterial
            color="#cbd5e1"
            metalness={0.9}
            roughness={0.15}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
        <mesh position={[0, 0.44, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.22, 0.03, 10, 20]} />
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
      {/* Central Valve Body Bulb */}
      <mesh position={[0, -0.22, 0]}>
        <sphereGeometry args={[0.22, 24, 18]} />
        <meshStandardMaterial
          color={castBodyColor}
          metalness={0.7}
          roughness={0.4}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Flanged Inlet Pipe Hub on Left */}
      <mesh position={[-0.32, -0.22, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.26, 0.26, 0.08, 36]} />
        <meshStandardMaterial
          color={castBodyColor}
          metalness={0.75}
          roughness={0.35}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      <mesh position={[-0.16, -0.22, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.15, 0.15, 0.24, 30]} />
        <meshStandardMaterial
          color={castBodyColor}
          metalness={0.75}
          roughness={0.35}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Flanged Outlet Pipe Hub on Right */}
      <mesh position={[0.32, -0.22, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.26, 0.26, 0.08, 36]} />
        <meshStandardMaterial
          color={castBodyColor}
          metalness={0.75}
          roughness={0.35}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      <mesh position={[0.16, -0.22, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.15, 0.15, 0.24, 30]} />
        <meshStandardMaterial
          color={castBodyColor}
          metalness={0.75}
          roughness={0.35}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Bolted Bonnet at y = 0.02 */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.2, 0.22, 0.12, 32]} />
        <meshStandardMaterial
          color={castBodyColor}
          metalness={0.75}
          roughness={0.35}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Yoke Columns */}
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.07, 0.09, 0.28, 20]} />
        <meshStandardMaterial
          color={castBodyColor}
          metalness={0.75}
          roughness={0.35}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Rising Threaded Stem along Y */}
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

      {/* Handwheel on top at y = 0.44 */}
      <mesh position={[0, 0.44, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.22, 0.03, 16, 36]} />
        <meshStandardMaterial
          color={wheelColor}
          metalness={0.5}
          roughness={0.4}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Internal Wedge Gate Disc */}
      <mesh position={[0, -0.22, 0]}>
        <boxGeometry args={[0.07, 0.22, 0.22]} />
        <meshStandardMaterial
          color={trimColor}
          metalness={0.85}
          roughness={0.25}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Handwheel spokes */}
      <mesh position={[0, 0.44, 0]}>
        <boxGeometry args={[0.42, 0.02, 0.025]} />
        <meshStandardMaterial
          color={wheelColor}
          metalness={0.5}
          roughness={0.4}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      <mesh position={[0, 0.44, 0]}>
        <boxGeometry args={[0.025, 0.02, 0.42]} />
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
