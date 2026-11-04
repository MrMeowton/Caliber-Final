import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "terminal",
  name: "Terminal",
  size: [1, 0.55, 0.2],
};

export default function Terminal({ color, highlight, detail = "high" }: PartProps) {
  const emissive = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;
  const isLow = detail === "low";

  const copperColor = color || "#b45309"; // Electro-tin plated copper tongue
  const sleeveColor = "#0284c7";         // Color-coded vinyl insulating sleeve (blue)

  return (
    <group>
      {/* Flat Ring Tongue at x = 0.24 in YZ plane */}
      <mesh position={[0.24, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.26, 0.26, 0.025, isLow ? 16 : 36]} />
        <meshStandardMaterial
          color={copperColor}
          metalness={0.85}
          roughness={0.25}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Central Bolt Mounting Hole through ring tongue */}
      <mesh position={[0.24, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.13, 0.13, 0.03, isLow ? 12 : 24]} />
        <meshStandardMaterial
          color="#0f172a"
          metalness={0.3}
          roughness={0.7}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Transition Neck from tongue to barrel */}
      <mesh position={[0.02, 0, 0]}>
        <boxGeometry args={[0.18, 0.16, 0.025]} />
        <meshStandardMaterial
          color={copperColor}
          metalness={0.85}
          roughness={0.25}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Insulated Color-Coded Vinyl Sleeve Barrel at -X */}
      <mesh position={[-0.26, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.09, 0.09, 0.38, isLow ? 14 : 28]} />
        <meshStandardMaterial
          color={sleeveColor}
          metalness={0.2}
          roughness={0.6}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Flared wire entry funnel at x = -0.45 */}
      <mesh position={[-0.45, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.09, 0.12, 0.06, isLow ? 14 : 28]} />
        <meshStandardMaterial
          color={sleeveColor}
          metalness={0.2}
          roughness={0.6}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
    </group>
  );
}
