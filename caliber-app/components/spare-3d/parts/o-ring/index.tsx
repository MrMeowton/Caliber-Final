import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "o-ring",
  name: "O ring",
  size: [0.12, 1, 1],
};

export default function ORing({ color, highlight, detail = "high" }: PartProps) {
  const emissive = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;
  const isLow = detail === "low";

  const rubberColor = color || "#18181b"; // Viton / Nitrile black rubber

  return (
    <group>
      {/* Torus lying in YZ plane facing +X */}
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.44, 0.06, isLow ? 12 : 24, isLow ? 24 : 64]} />
        <meshStandardMaterial
          color={rubberColor}
          metalness={0.1}
          roughness={0.7}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Parting mold line flash ring (high detail) */}
      {!isLow && (
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.5, 0.003, 6, 64]} />
          <meshStandardMaterial
            color="#27272a"
            metalness={0.1}
            roughness={0.8}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
      )}
    </group>
  );
}
