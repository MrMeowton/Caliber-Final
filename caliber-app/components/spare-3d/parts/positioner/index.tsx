import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "positioner",
  name: "Positioner",
  size: [0.8, 1, 0.6],
};

export default function Positioner({ color, highlight, detail = "high" }: PartProps) {
  const emissive = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;
  const isLow = detail === "low";

  const caseColor = color || "#0284c7"; // Industrial blue instrument enclosure
  const faceColor = "#0f172a";
  const leverColor = "#94a3b8";

  return (
    <group>
      {/* Main Die-Cast Aluminum Enclosure Housing */}
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[0.62, 0.74, 0.42]} />
        <meshStandardMaterial
          color={caseColor}
          metalness={0.7}
          roughness={0.35}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Front LCD / Display Window Bezel at z = 0.22 */}
      <mesh position={[0, 0.12, 0.22]}>
        <boxGeometry args={[0.36, 0.28, 0.04]} />
        <meshStandardMaterial
          color={faceColor}
          metalness={0.5}
          roughness={0.2}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Dual Pressure Gauges on Left Side at x = -0.33 */}
      <mesh position={[-0.32, 0.2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, 0.06, isLow ? 12 : 24]} />
        <meshStandardMaterial
          color="#cbd5e1"
          metalness={0.85}
          roughness={0.2}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      <mesh position={[-0.32, -0.06, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, 0.06, isLow ? 12 : 24]} />
        <meshStandardMaterial
          color="#cbd5e1"
          metalness={0.85}
          roughness={0.2}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Feedback Lever Arm at bottom y = -0.42 */}
      <mesh position={[0, -0.42, 0.05]} rotation={[0, 0, 0.2]}>
        <boxGeometry args={[0.48, 0.04, 0.03]} />
        <meshStandardMaterial
          color={leverColor}
          metalness={0.85}
          roughness={0.25}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* High detail: Rotary feedback shaft & cable gland */}
      {!isLow && (
        <>
          <mesh position={[0, -0.35, 0]}>
            <cylinderGeometry args={[0.045, 0.045, 0.1, 16]} />
            <meshStandardMaterial
              color={leverColor}
              metalness={0.85}
              roughness={0.25}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
          <mesh position={[0.22, -0.34, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.08, 12]} />
            <meshStandardMaterial
              color="#64748b"
              metalness={0.8}
              roughness={0.3}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
        </>
      )}
    </group>
  );
}
