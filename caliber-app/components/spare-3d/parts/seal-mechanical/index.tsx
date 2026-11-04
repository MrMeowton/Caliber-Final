import { useMemo } from "react";
import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "seal-mechanical",
  name: "Seal mechanical",
  size: [0.7, 1, 1],
};

export default function SealMechanical({ color, highlight, detail = "high" }: PartProps) {
  const emissive = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;
  const isLow = detail === "low";

  const numSprings = isLow ? 0 : 8;
  const springAngles = useMemo(() => {
    return Array.from({ length: numSprings }, (_, i) => (i / numSprings) * Math.PI * 2);
  }, [numSprings]);

  const glandColor = color || "#94a3b8";
  const sleeveColor = "#cbd5e1";
  const faceCarbon = "#1e293b";
  const faceSic = "#475569";
  const springColor = "#f59e0b";

  return (
    <group>
      {/* Gland Plate: square/diamond flange at x = -0.15 */}
      <mesh position={[-0.15, 0, 0]}>
        <boxGeometry args={[0.08, 0.85, 0.85]} />
        <meshStandardMaterial
          color={glandColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Central Shaft Sleeve along X */}
      <mesh position={[0.05, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.22, 0.22, 0.6, isLow ? 16 : 36]} />
        <meshStandardMaterial
          color={sleeveColor}
          metalness={0.85}
          roughness={0.2}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      {/* Shaft Bore Cutout */}
      <mesh position={[0.05, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.16, 0.16, 0.62, isLow ? 12 : 24]} />
        <meshStandardMaterial
          color="#0f172a"
          metalness={0.3}
          roughness={0.7}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Stationary Seal Face (carbon) inside gland */}
      <mesh position={[-0.05, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.34, 0.34, 0.06, isLow ? 16 : 36]} />
        <meshStandardMaterial
          color={faceCarbon}
          metalness={0.2}
          roughness={0.6}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Rotating Seal Face (silicon carbide) */}
      <mesh position={[0.03, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.34, 0.34, 0.06, isLow ? 16 : 36]} />
        <meshStandardMaterial
          color={faceSic}
          metalness={0.9}
          roughness={0.15}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Drive Collar at outer shaft end */}
      <mesh position={[0.26, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.28, 0.28, 0.1, isLow ? 16 : 36]} />
        <meshStandardMaterial
          color={glandColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Multi-spring ring array around sleeve (high detail) */}
      {!isLow &&
        springAngles.map((a) => (
          <mesh
            key={a}
            position={[0.14, Math.cos(a) * 0.27, Math.sin(a) * 0.27]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.018, 0.018, 0.1, 10]} />
            <meshStandardMaterial
              color={springColor}
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
