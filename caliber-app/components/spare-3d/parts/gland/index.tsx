import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "gland",
  name: "Gland",
  size: [1, 0.48, 0.48],
};

export default function Gland({ color, highlight, detail = "high" }: PartProps) {
  const emissive = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;
  const isLow = detail === "low";

  const brassColor = color || "#d97706"; // Nickel-plated brass / Stainless cable gland
  const rubberColor = "#18181b";

  return (
    <group>
      {/* Main Hex Gland Body along X at x = 0.0 */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.22, 0.22, 0.26, 6]} />
        <meshStandardMaterial
          color={brassColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Male Entry Mounting Thread at -X */}
      <mesh position={[-0.28, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.16, 0.16, 0.3, isLow ? 14 : 28]} />
        <meshStandardMaterial
          color={brassColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Compression Dome Cap Nut at +X */}
      <mesh position={[0.24, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.21, 0.21, 0.24, 6]} />
        <meshStandardMaterial
          color={brassColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Rounded Dome Cap End */}
      <mesh position={[0.38, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.13, 0.19, 0.08, isLow ? 16 : 32]} />
        <meshStandardMaterial
          color={brassColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Center Cable Passage Hole & Rubber Grommet */}
      <mesh position={[0.42, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, 0.04, isLow ? 12 : 24]} />
        <meshStandardMaterial
          color={rubberColor}
          metalness={0.1}
          roughness={0.8}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
    </group>
  );
}
