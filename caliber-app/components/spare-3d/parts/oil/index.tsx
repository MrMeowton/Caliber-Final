import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "oil",
  name: "Oil",
  size: [0.75, 1, 0.75],
};

export default function Oil({ color, highlight, detail = "high" }: PartProps) {
  const emissive = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;
  const isLow = detail === "low";

  const pailColor = color || "#0284c7"; // Blue industrial lubricant pail
  const lidColor = "#f8fafc";
  const labelColor = "#f59e0b";

  return (
    <group>
      {/* Tapered 20L Lubricant Pail Body at y = -0.06 */}
      <mesh position={[0, -0.06, 0]}>
        <cylinderGeometry args={[0.34, 0.28, 0.76, isLow ? 16 : 36]} />
        <meshStandardMaterial
          color={pailColor}
          metalness={0.2}
          roughness={0.6}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Pail Snap-On Lid at y = 0.35 */}
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.36, 0.36, 0.06, isLow ? 16 : 36]} />
        <meshStandardMaterial
          color={lidColor}
          metalness={0.2}
          roughness={0.5}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Retractable Pour Spout / Cap on lid */}
      <mesh position={[0.16, 0.4, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.06, isLow ? 12 : 20]} />
        <meshStandardMaterial
          color="#ef4444"
          metalness={0.3}
          roughness={0.5}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Wire Bail Handle Arched over top */}
      <mesh position={[0, 0.44, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.34, 0.015, 8, 28, Math.PI]} />
        <meshStandardMaterial
          color="#94a3b8"
          metalness={0.85}
          roughness={0.25}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Lubricant Specification Brand Label Band (high detail) */}
      {!isLow && (
        <mesh position={[0, -0.06, 0]}>
          <cylinderGeometry args={[0.315, 0.315, 0.32, 36, 1, true]} />
          <meshStandardMaterial
            color={labelColor}
            metalness={0.1}
            roughness={0.7}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
      )}
    </group>
  );
}
