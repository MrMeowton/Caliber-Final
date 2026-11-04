import { useMemo } from "react";
import * as THREE from "three";
import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "spring",
  name: "Spring",
  size: [1, 0.55, 0.55],
};

export default function Spring({ color, highlight, detail = "high" }: PartProps) {
  const emissive = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;
  const isLow = detail === "low";

  // Create smooth helical compression spring curve along X axis
  const curve = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const coils = 6.5;
    const length = 0.92;
    const radius = 0.22;
    const steps = 120;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = -length / 2 + t * length;
      const angle = t * coils * Math.PI * 2;
      const y = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      points.push(new THREE.Vector3(x, y, z));
    }
    return new THREE.CatmullRomCurve3(points);
  }, []);

  const springColor = color || "#64748b"; // Spring steel
  const groundEndColor = "#94a3b8";

  return (
    <group>
      {/* Helical wire along X */}
      <mesh>
        <tubeGeometry args={[curve, isLow ? 36 : 80, 0.048, isLow ? 8 : 14, false]} />
        <meshStandardMaterial
          color={springColor}
          metalness={0.85}
          roughness={0.25}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Flat Ground Ends at both ends */}
      <mesh position={[-0.47, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.26, 0.26, 0.035, isLow ? 16 : 32, 1, true]} />
        <meshStandardMaterial
          color={groundEndColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      <mesh position={[0.47, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.26, 0.26, 0.035, isLow ? 16 : 32, 1, true]} />
        <meshStandardMaterial
          color={groundEndColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
    </group>
  );
}
