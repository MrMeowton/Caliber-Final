import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "anchor",
  name: "Anchor",
  size: [0.55, 1, 0.3],
};

export default function Anchor({ color, highlight, detail = "high" }: PartProps) {
  const emissive = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;
  const isLow = detail === "low";

  const steelColor = color || "#cbd5e1"; // Stainless steel 304/310
  const plateColor = "#64748b";

  return (
    <group>
      {/* Welded Base Mounting Plate at y = -0.47 */}
      <mesh position={[0, -0.47, 0]}>
        <boxGeometry args={[0.36, 0.06, 0.24]} />
        <meshStandardMaterial
          color={plateColor}
          metalness={0.8}
          roughness={0.35}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Center base weld bead / stud */}
      <mesh position={[0, -0.4, 0]}>
        <cylinderGeometry args={[0.07, 0.08, 0.08, isLow ? 10 : 20]} />
        <meshStandardMaterial
          color={steelColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Left Diverging V-Prong Leg */}
      <mesh position={[-0.14, 0.02, 0]} rotation={[0, 0, -0.32]}>
        <cylinderGeometry args={[0.035, 0.035, 0.78, isLow ? 8 : 16]} />
        <meshStandardMaterial
          color={steelColor}
          metalness={0.85}
          roughness={0.25}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Right Diverging V-Prong Leg */}
      <mesh position={[0.14, 0.02, 0]} rotation={[0, 0, 0.32]}>
        <cylinderGeometry args={[0.035, 0.035, 0.78, isLow ? 8 : 16]} />
        <meshStandardMaterial
          color={steelColor}
          metalness={0.85}
          roughness={0.25}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Corrugated / Wavy Hooked Tips for gripping castable (high detail) */}
      {!isLow && (
        <>
          {/* Left Tip Hook */}
          <mesh position={[-0.24, 0.42, 0]} rotation={[0, 0, 0.5]}>
            <cylinderGeometry args={[0.035, 0.035, 0.16, 12]} />
            <meshStandardMaterial
              color={steelColor}
              metalness={0.85}
              roughness={0.25}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
          {/* Right Tip Hook */}
          <mesh position={[0.24, 0.42, 0]} rotation={[0, 0, -0.5]}>
            <cylinderGeometry args={[0.035, 0.035, 0.16, 12]} />
            <meshStandardMaterial
              color={steelColor}
              metalness={0.85}
              roughness={0.25}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
        </>
      )}
    </group>
  );
}
