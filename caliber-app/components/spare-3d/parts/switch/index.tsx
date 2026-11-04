import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "switch",
  name: "Switch",
  size: [0.65, 1, 0.45],
};

export default function Switch({ color, highlight, detail = "high" }: PartProps) {
  const emissive = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;
  const isLow = detail === "low";

  const bodyColor = color || "#475569"; // Die-cast industrial limit switch enclosure
  const armColor = "#94a3b8";
  const rollerColor = "#ca8a04";       // Brass / steel roller wheel

  return (
    <group>
      {/* Main Rectangular Die-Cast Enclosure Body at y = -0.1 */}
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[0.46, 0.54, 0.32]} />
        <meshStandardMaterial
          color={bodyColor}
          metalness={0.7}
          roughness={0.35}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Rotary Operating Head Turret on top at y = 0.24 */}
      <mesh position={[0, 0.24, 0]}>
        <boxGeometry args={[0.34, 0.16, 0.26]} />
        <meshStandardMaterial
          color={bodyColor}
          metalness={0.75}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Operating Roller Lever Arm extending up at an angle */}
      <mesh position={[0.08, 0.36, 0.16]} rotation={[0, 0, -0.3]}>
        <boxGeometry args={[0.04, 0.24, 0.03]} />
        <meshStandardMaterial
          color={armColor}
          metalness={0.85}
          roughness={0.2}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Roller Wheel on lever tip at y = 0.45 */}
      <mesh position={[0.13, 0.45, 0.16]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.065, 0.065, 0.04, isLow ? 12 : 24]} />
        <meshStandardMaterial
          color={rollerColor}
          metalness={0.8}
          roughness={0.25}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Conduit Entry Boss at bottom at y = -0.42 */}
      <mesh position={[0, -0.42, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.1, isLow ? 10 : 20]} />
        <meshStandardMaterial
          color={bodyColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
    </group>
  );
}
