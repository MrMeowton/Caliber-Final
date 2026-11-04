import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "bolt",
  name: "Bolt",
  size: [0.18, 1, 0.35],
};

export default function Bolt({ color, highlight, detail = "high" }: PartProps) {
  const emissive = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;
  const isLow = detail === "low";

  const steelColor = color || "#94a3b8";
  const nutColor = "#cbd5e1";

  return (
    <group>
      {/* Anchor Bolt Main Straight Shank */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.68, isLow ? 10 : 20]} />
        <meshStandardMaterial
          color={steelColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Anchor L-bend hook at bottom */}
      <mesh position={[0, -0.32, 0.08]} rotation={[Math.PI / 4, 0, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.16, isLow ? 10 : 20]} />
        <meshStandardMaterial
          color={steelColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      <mesh position={[0, -0.38, 0.18]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.16, isLow ? 10 : 20]} />
        <meshStandardMaterial
          color={steelColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Heavy Hex Nut on top threaded section */}
      <mesh position={[0, 0.34, 0]}>
        <cylinderGeometry args={[0.085, 0.085, 0.1, 6]} />
        <meshStandardMaterial
          color={nutColor}
          metalness={0.85}
          roughness={0.25}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Anchor Washer below nut */}
      <mesh position={[0, 0.27, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.025, isLow ? 12 : 24]} />
        <meshStandardMaterial
          color={steelColor}
          metalness={0.75}
          roughness={0.35}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Threaded stud top extension (high detail) */}
      {!isLow && (
        <mesh position={[0, 0.44, 0]}>
          <cylinderGeometry args={[0.043, 0.043, 0.1, 16]} />
          <meshStandardMaterial
            color={nutColor}
            metalness={0.8}
            roughness={0.35}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
      )}
    </group>
  );
}
