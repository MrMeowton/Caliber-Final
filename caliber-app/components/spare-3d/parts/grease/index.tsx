import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "grease",
  name: "Grease",
  size: [1, 0.36, 0.36],
};

export default function Grease({ color, highlight, detail = "high" }: PartProps) {
  const emissive = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;
  const isLow = detail === "low";

  const cartridgeColor = color || "#0284c7"; // Industrial 400g grease gun cartridge
  const capColor = "#cbd5e1";
  const labelColor = "#f59e0b";

  return (
    <group>
      {/* Cylindrical Grease Cartridge Body along X */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.16, 0.16, 0.88, isLow ? 16 : 36]} />
        <meshStandardMaterial
          color={cartridgeColor}
          metalness={0.2}
          roughness={0.5}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Metal Pull-Ring End Cap at -X */}
      <mesh position={[-0.45, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.17, 0.17, 0.04, isLow ? 16 : 32]} />
        <meshStandardMaterial
          color={capColor}
          metalness={0.85}
          roughness={0.25}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Removable Plastic Cap at +X */}
      <mesh position={[0.45, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.17, 0.17, 0.05, isLow ? 16 : 32]} />
        <meshStandardMaterial
          color="#dc2626"
          metalness={0.3}
          roughness={0.5}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* High detail: Pull-ring tab and specification label */}
      {!isLow && (
        <>
          <mesh position={[-0.48, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.045, 0.01, 8, 20]} />
            <meshStandardMaterial
              color={capColor}
              metalness={0.9}
              roughness={0.2}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
          <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.162, 0.162, 0.44, 36, 1, true]} />
            <meshStandardMaterial
              color={labelColor}
              metalness={0.15}
              roughness={0.65}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
        </>
      )}
    </group>
  );
}
