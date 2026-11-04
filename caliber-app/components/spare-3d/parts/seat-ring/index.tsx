import React, { useMemo } from "react";
import * as THREE from "three";
import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "seat-ring",
  name: "Seat ring",
  size: [0.35, 1, 1],
};

export default function SeatRing({
  color,
  highlight,
  detail = "high",
}: PartProps) {
  const isHigh = detail === "high";
  const emissive = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;

  const ringColor = color || "#94a3b8";
  const seatFaceColor = "#f8fafc"; // Stellite hardened precision seating face
  const threadColor = "#64748b";

  if (!isHigh) {
    return (
      <group rotation={[0, 0, Math.PI / 2]}>
        {/* Low-detail: 3 meshes */}
        <mesh>
          <cylinderGeometry args={[0.5, 0.5, 0.35, 16, 1, true]} />
          <meshStandardMaterial
            color={ringColor}
            metalness={0.8}
            roughness={0.3}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.34, 0.34, 0.35, 16, 1, true]} />
          <meshStandardMaterial
            color={ringColor}
            metalness={0.75}
            roughness={0.35}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh position={[0, 0.13, 0]}>
          <cylinderGeometry args={[0.42, 0.35, 0.08, 16, 1, true]} />
          <meshStandardMaterial
            color={seatFaceColor}
            metalness={0.9}
            roughness={0.15}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    );
  }

  return (
    <group>
      {/* Main Seat Ring Outer Body Cylinder along X */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.5, 0.5, 0.35, 48, 1, true]} />
        <meshStandardMaterial
          color={ringColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Internal Flow Port Bore */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.34, 0.34, 0.35, 48, 1, true]} />
        <meshStandardMaterial
          color={ringColor}
          metalness={0.75}
          roughness={0.35}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Chamfered Seating Edge (facing +X) */}
      <mesh position={[0.13, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.43, 0.35, 0.08, 48, 1, true]} />
        <meshStandardMaterial
          color={seatFaceColor}
          metalness={0.92}
          roughness={0.12}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Precision Lapping Face Ring */}
      <mesh position={[0.17, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.39, 0.012, 10, 48]} />
        <meshStandardMaterial
          color={seatFaceColor}
          metalness={0.95}
          roughness={0.1}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* External Mounting Threads */}
      <mesh position={[-0.06, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.495, 0.01, 8, 48]} />
        <meshStandardMaterial
          color={threadColor}
          metalness={0.75}
          roughness={0.4}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      <mesh position={[0.02, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.495, 0.01, 8, 48]} />
        <meshStandardMaterial
          color={threadColor}
          metalness={0.75}
          roughness={0.4}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Installation Wrench Notches on Rim (4 notches) */}
      {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, i) => (
        <mesh
          key={i}
          position={[0.16, Math.cos(angle) * 0.47, Math.sin(angle) * 0.47]}
          rotation={[angle, 0, 0]}
        >
          <boxGeometry args={[0.035, 0.04, 0.03]} />
          <meshStandardMaterial
            color={threadColor}
            metalness={0.8}
            roughness={0.3}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
      ))}
    </group>
  );
}
