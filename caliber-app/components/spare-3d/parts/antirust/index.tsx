import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "antirust",
  name: "Antirust",
  size: [0.45, 1, 0.45],
};

export default function Antirust({ color, highlight, detail = "high" }: PartProps) {
  const emissive = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;
  const isLow = detail === "low";

  const canColor = color || "#0284c7"; // Aerosol antirust spray can
  const domeColor = "#cbd5e1";
  const nozzleColor = "#dc2626";

  return (
    <group>
      {/* Cylindrical Aerosol Can Body at y = -0.1 */}
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.64, isLow ? 16 : 36]} />
        <meshStandardMaterial
          color={canColor}
          metalness={0.4}
          roughness={0.45}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Inverted Concave Bottom Rim at y = -0.44 */}
      <mesh position={[0, -0.44, 0]}>
        <cylinderGeometry args={[0.2, 0.18, 0.04, isLow ? 16 : 32]} />
        <meshStandardMaterial
          color={domeColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Tapered Top Dome Shoulder at y = 0.25 */}
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.12, 0.2, 0.08, isLow ? 16 : 32]} />
        <meshStandardMaterial
          color={domeColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Aerosol Valve Mounting Cup at y = 0.3 */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.11, 0.11, 0.04, isLow ? 14 : 28]} />
        <meshStandardMaterial
          color={domeColor}
          metalness={0.85}
          roughness={0.25}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Spray Actuator Nozzle Cap on top at y = 0.38 */}
      <mesh position={[0, 0.38, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.12, isLow ? 12 : 24]} />
        <meshStandardMaterial
          color={nozzleColor}
          metalness={0.3}
          roughness={0.5}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Extension Straw tube clipped to side (high detail) */}
      {!isLow && (
        <mesh position={[0.21, -0.1, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.54, 8]} />
          <meshStandardMaterial
            color="#ef4444"
            metalness={0.1}
            roughness={0.6}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
      )}
    </group>
  );
}
