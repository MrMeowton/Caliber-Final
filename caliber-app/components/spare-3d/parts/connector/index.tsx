import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "connector",
  name: "Connector",
  size: [1, 0.42, 0.42],
};

export default function Connector({ color, highlight, detail = "high" }: PartProps) {
  const emissive = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;
  const isLow = detail === "low";

  const bodyColor = color || "#cbd5e1"; // Stainless 316 / Brass
  const nutColor = "#94a3b8";

  return (
    <group>
      {/* Central Hex Body at x = 0.0 along X */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.2, 0.2, 0.26, 6]} />
        <meshStandardMaterial
          color={bodyColor}
          metalness={0.85}
          roughness={0.25}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Male NPT Tapered Pipe Thread End extending to -X */}
      <mesh position={[-0.28, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.13, 0.16, 0.32, isLow ? 14 : 28]} />
        <meshStandardMaterial
          color={bodyColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Tube Compression Nut on +X */}
      <mesh position={[0.26, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.19, 0.19, 0.26, 6]} />
        <meshStandardMaterial
          color={nutColor}
          metalness={0.85}
          roughness={0.25}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Tube Entry Port Hole at x = 0.42 */}
      <mesh position={[0.4, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.09, 0.09, 0.05, isLow ? 12 : 24]} />
        <meshStandardMaterial
          color="#0f172a"
          metalness={0.3}
          roughness={0.7}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* High detail: Thread grooves and ferrule collar */}
      {!isLow && (
        <>
          <mesh position={[-0.2, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.155, 0.008, 8, 24]} />
            <meshStandardMaterial
              color="#64748b"
              metalness={0.7}
              roughness={0.4}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
          <mesh position={[-0.32, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.14, 0.008, 8, 24]} />
            <meshStandardMaterial
              color="#64748b"
              metalness={0.7}
              roughness={0.4}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
        </>
      )}
    </group>
  );
}
