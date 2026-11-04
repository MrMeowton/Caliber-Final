import React, { useMemo } from "react";
import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "impeller",
  name: "Impeller",
  size: [0.35, 1, 1],
};

export default function Impeller({ color, highlight, detail = "high" }: PartProps) {
  const emissive = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;
  const isLow = detail === "low";

  const numVanes = isLow ? 3 : 6;
  const vaneAngles = useMemo(() => {
    return Array.from({ length: numVanes }, (_, i) => (i / numVanes) * Math.PI * 2);
  }, [numVanes]);

  const bronzeColor = color || "#d97706";
  const hubColor = "#b45309";

  if (isLow) {
    return (
      <group>
        {/* Low-detail: Hub (1) + Back Shroud (1) + Front Shroud (1) + 3 Vanes (3) = 6 meshes */}
        <mesh position={[-0.05, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.16, 0.19, 0.25, 16]} />
          <meshStandardMaterial
            color={hubColor}
            metalness={0.75}
            roughness={0.3}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
        <mesh position={[-0.1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.5, 0.5, 0.04, 20]} />
          <meshStandardMaterial
            color={bronzeColor}
            metalness={0.7}
            roughness={0.35}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
        <mesh position={[0.1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.5, 0.5, 0.04, 20]} />
          <meshStandardMaterial
            color={bronzeColor}
            metalness={0.7}
            roughness={0.35}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
        {vaneAngles.map((a) => (
          <group key={a} rotation={[a, 0, 0]}>
            <mesh position={[0, 0.32, 0.08]} rotation={[0.4, 0, 0]}>
              <boxGeometry args={[0.16, 0.24, 0.03]} />
              <meshStandardMaterial
                color={bronzeColor}
                metalness={0.75}
                roughness={0.3}
                emissive={emissive}
                emissiveIntensity={emissiveIntensity}
              />
            </mesh>
          </group>
        ))}
      </group>
    );
  }

  return (
    <group>
      {/* Central Hub with shaft bore */}
      <mesh position={[-0.05, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.16, 0.19, 0.25, 36]} />
        <meshStandardMaterial
          color={hubColor}
          metalness={0.75}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      {/* Shaft Bore Cutout */}
      <mesh position={[-0.05, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 0.26, 24]} />
        <meshStandardMaterial
          color="#0f172a"
          metalness={0.3}
          roughness={0.7}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Back Shroud Disc */}
      <mesh position={[-0.1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.5, 0.5, 0.04, 40]} />
        <meshStandardMaterial
          color={bronzeColor}
          metalness={0.7}
          roughness={0.35}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Front Shroud Disc with Suction Eye */}
      <mesh position={[0.1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.5, 0.5, 0.04, 40]} />
        <meshStandardMaterial
          color={bronzeColor}
          metalness={0.7}
          roughness={0.35}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      {/* Suction Eye Opening */}
      <mesh position={[0.1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.22, 0.22, 0.05, 36]} />
        <meshStandardMaterial
          color="#0f172a"
          metalness={0.3}
          roughness={0.7}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* 6 Curved backward vanes */}
      {vaneAngles.map((a) => (
        <group key={a} rotation={[a, 0, 0]}>
          <mesh position={[0, 0.32, 0.08]} rotation={[0.4, 0, 0]}>
            <boxGeometry args={[0.16, 0.24, 0.03]} />
            <meshStandardMaterial
              color={bronzeColor}
              metalness={0.75}
              roughness={0.3}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
        </group>
      ))}

      {/* Suction Eye Bell Mouth Ring */}
      <mesh position={[0.14, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.23, 0.02, 14, 48]} />
        <meshStandardMaterial
          color={hubColor}
          metalness={0.8}
          roughness={0.25}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
    </group>
  );
}
