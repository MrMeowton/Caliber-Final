import React, { useMemo } from "react";
import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "burner-tip",
  name: "Burner tip",
  size: [1, 0.65, 0.65],
};

export default function BurnerTip({ color, highlight, detail = "high" }: PartProps) {
  const emissive = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;
  const isLow = detail === "low";

  const numPorts = 8;
  const portAngles = useMemo(() => {
    return Array.from({ length: numPorts }, (_, i) => (i / numPorts) * Math.PI * 2);
  }, [numPorts]);

  const alloyColor = color || "#94a3b8";
  const portHoleColor = "#0f172a";

  if (isLow) {
    return (
      <group>
        {/* Low-detail: 3 meshes */}
        <mesh position={[-0.32, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.2, 0.2, 0.36, 16]} />
          <meshStandardMaterial
            color={alloyColor}
            metalness={0.8}
            roughness={0.3}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
        <mesh position={[0.04, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.3, 0.3, 0.44, 20]} />
          <meshStandardMaterial
            color={alloyColor}
            metalness={0.85}
            roughness={0.25}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
        <mesh position={[0.26, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <sphereGeometry args={[0.3, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial
            color={alloyColor}
            metalness={0.85}
            roughness={0.25}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
      </group>
    );
  }

  return (
    <group>
      {/* Inlet Mounting / Threaded Pipe Shank along X */}
      <mesh position={[-0.32, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.2, 0.2, 0.36, 32]} />
        <meshStandardMaterial
          color={alloyColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Main Burner Nozzle Head Cylinder along X */}
      <mesh position={[0.04, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.3, 0.3, 0.44, 40]} />
        <meshStandardMaterial
          color={alloyColor}
          metalness={0.85}
          roughness={0.25}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Discharge Hemisphere Dome Tip facing +X */}
      <mesh position={[0.26, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <sphereGeometry args={[0.3, 28, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color={alloyColor}
          metalness={0.85}
          roughness={0.25}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Central Axial Pilot Orifice on dome tip */}
      <mesh position={[0.49, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, 0.06, 16]} />
        <meshStandardMaterial
          color={portHoleColor}
          metalness={0.3}
          roughness={0.7}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* 8 Drilled Gas Port Orifices around the dome */}
      {portAngles.map((a) => (
        <mesh
          key={a}
          position={[0.38, Math.cos(a) * 0.2, Math.sin(a) * 0.2]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.03, 0.03, 0.05, 10]} />
          <meshStandardMaterial
            color={portHoleColor}
            metalness={0.3}
            roughness={0.7}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
      ))}

      {/* Wrench flats collar */}
      <mesh position={[-0.14, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.32, 0.32, 0.08, 6]} />
        <meshStandardMaterial
          color={alloyColor}
          metalness={0.8}
          roughness={0.35}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
    </group>
  );
}
