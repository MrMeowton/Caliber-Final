import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "thermowell",
  name: "Thermowell",
  size: [1, 0.55, 0.55],
};

export default function Thermowell({ color, highlight, detail = "high" }: PartProps) {
  const emissive = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;
  const isLow = detail === "low";

  const flangeColor = color || "#64748b"; // Forged 316 / F11 flange
  const stemColor = "#cbd5e1";          // Precision machined bar-stock stem

  return (
    <group>
      {/* Mounting Flange at x = -0.42 along X */}
      <mesh position={[-0.42, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.26, 0.26, 0.12, isLow ? 16 : 36]} />
        <meshStandardMaterial
          color={flangeColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Raised Face Instrument Connection Port at x = -0.485 */}
      <mesh position={[-0.485, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.18, 0.18, 0.03, isLow ? 14 : 28]} />
        <meshStandardMaterial
          color={flangeColor}
          metalness={0.85}
          roughness={0.25}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Heavy Solid Root Shank extending to x = 0.08 */}
      <mesh position={[-0.14, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, 0.44, isLow ? 16 : 32]} />
        <meshStandardMaterial
          color={stemColor}
          metalness={0.85}
          roughness={0.2}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Tapered Immersion Stem extending from x = 0.08 to x = 0.44 */}
      <mesh position={[0.26, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.06, 0.1, 0.36, isLow ? 16 : 32]} />
        <meshStandardMaterial
          color={stemColor}
          metalness={0.85}
          roughness={0.2}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Rounded Closed Tip at x = 0.44 */}
      <mesh position={[0.44, 0, 0]}>
        <sphereGeometry args={[0.06, isLow ? 12 : 20, isLow ? 8 : 16]} />
        <meshStandardMaterial
          color={stemColor}
          metalness={0.85}
          roughness={0.2}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Internal Instrument Bore (high detail) */}
      {!isLow && (
        <mesh position={[-0.485, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.05, 0.05, 0.04, 16]} />
          <meshStandardMaterial
            color="#0f172a"
            metalness={0.3}
            roughness={0.7}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
      )}
    </group>
  );
}
