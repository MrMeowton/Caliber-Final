import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "screw",
  name: "Screw",
  size: [1, 0.45, 0.45],
};

export default function Screw({ color, highlight, detail = "high" }: PartProps) {
  const emissive = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;
  const isLow = detail === "low";

  const screwColor = color || "#cbd5e1";
  const driveColor = "#0f172a";

  return (
    <group>
      {/* Socket Cap Head at x = -0.34 */}
      <mesh position={[-0.34, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.22, 0.22, 0.24, isLow ? 16 : 32]} />
        <meshStandardMaterial
          color={screwColor}
          metalness={0.85}
          roughness={0.25}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Hex Socket Drive Cutout */}
      <mesh position={[-0.455, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.11, 0.11, 0.06, 6]} />
        <meshStandardMaterial
          color={driveColor}
          metalness={0.5}
          roughness={0.5}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Threaded Shank extending along +X */}
      <mesh position={[0.12, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.12, 0.12, 0.68, isLow ? 14 : 28]} />
        <meshStandardMaterial
          color={screwColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Pointed Lead Chamfer tip & knurl (high detail) */}
      {!isLow && (
        <>
          <mesh position={[0.48, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <coneGeometry args={[0.12, 0.06, 20]} />
            <meshStandardMaterial
              color={screwColor}
              metalness={0.8}
              roughness={0.3}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
          <mesh position={[-0.34, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.222, 0.008, 8, 32]} />
            <meshStandardMaterial
              color="#94a3b8"
              metalness={0.9}
              roughness={0.2}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
        </>
      )}
    </group>
  );
}
