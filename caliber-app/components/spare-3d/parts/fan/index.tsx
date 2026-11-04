import React, { useMemo } from "react";
import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "fan",
  name: "Fan",
  size: [0.3, 1, 1],
};

export default function Fan({ color, highlight, detail = "high" }: PartProps) {
  const emissive = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;
  const isLow = detail === "low";

  const numBlades = isLow ? 4 : 10;
  const bladeAngles = useMemo(() => {
    return Array.from({ length: numBlades }, (_, i) => (i / numBlades) * Math.PI * 2);
  }, [numBlades]);

  const plasticColor = color || "#1e293b";
  const hubColor = "#334155";
  const ringColor = "#0f172a";

  if (isLow) {
    return (
      <group>
        {/* Low-detail: 1 hub + 4 blades = 5 meshes */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.16, 0.16, 0.28, 16]} />
          <meshStandardMaterial
            color={hubColor}
            metalness={0.5}
            roughness={0.4}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
        {bladeAngles.map((a) => (
          <group key={a} rotation={[a, 0, 0]}>
            <mesh position={[0, 0.32, 0]} rotation={[0.25, 0, 0]}>
              <boxGeometry args={[0.22, 0.3, 0.025]} />
              <meshStandardMaterial
                color={plasticColor}
                metalness={0.3}
                roughness={0.6}
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
      {/* Central Motor Shaft Hub along X */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.16, 0.16, 0.28, 36]} />
        <meshStandardMaterial
          color={hubColor}
          metalness={0.5}
          roughness={0.4}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Shaft Bore Hole */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.07, 0.07, 0.29, 24]} />
        <meshStandardMaterial
          color="#020617"
          metalness={0.2}
          roughness={0.8}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* 10 Radial cooling blades */}
      {bladeAngles.map((a) => (
        <group key={a} rotation={[a, 0, 0]}>
          <mesh position={[0, 0.32, 0]} rotation={[0.25, 0, 0]}>
            <boxGeometry args={[0.22, 0.3, 0.025]} />
            <meshStandardMaterial
              color={plasticColor}
              metalness={0.3}
              roughness={0.6}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
        </group>
      ))}

      {/* Outer Reinforcement Shroud Ring */}
      <mesh position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.49, 0.02, 12, 48]} />
        <meshStandardMaterial
          color={ringColor}
          metalness={0.4}
          roughness={0.5}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
    </group>
  );
}
