import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "castable",
  name: "Castable",
  size: [0.8, 1, 0.4],
};

export default function Castable({ color, highlight, detail = "high" }: PartProps) {
  const emissive = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;
  const isLow = detail === "low";

  const concreteColor = color || "#94a3b8"; // Refractory concrete lining
  const backupColor = "#64748b";

  return (
    <group>
      {/* Thick Dense Castable Lining Wall Slab Section */}
      <mesh position={[0, 0, 0.05]}>
        <boxGeometry args={[0.78, 0.96, 0.28]} />
        <meshStandardMaterial
          color={concreteColor}
          metalness={0.08}
          roughness={0.9}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Cold-face Backup Insulating Layer on back */}
      <mesh position={[0, 0, -0.12]}>
        <boxGeometry args={[0.78, 0.96, 0.06]} />
        <meshStandardMaterial
          color={backupColor}
          metalness={0.1}
          roughness={0.85}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Expansion control joint slots (high detail) */}
      {!isLow && (
        <>
          <mesh position={[0, 0, 0.192]}>
            <boxGeometry args={[0.78, 0.015, 0.01]} />
            <meshStandardMaterial
              color="#334155"
              metalness={0.2}
              roughness={0.8}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
          <mesh position={[0, 0, 0.192]}>
            <boxGeometry args={[0.015, 0.96, 0.01]} />
            <meshStandardMaterial
              color="#334155"
              metalness={0.2}
              roughness={0.8}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
        </>
      )}
    </group>
  );
}
