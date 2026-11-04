import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "transmitter",
  name: "Transmitter",
  size: [0.65, 1, 0.5],
};

export default function Transmitter({ color, highlight, detail = "high" }: PartProps) {
  const emissive = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;
  const isLow = detail === "low";

  const housingColor = color || "#0284c7"; // Blue explosion-proof electronics housing
  const flangeColor = "#64748b";          // Forged stainless process flange
  const displayColor = "#0f172a";

  return (
    <group>
      {/* Dual Coplanar Process Flange at bottom: y = -0.32 */}
      <mesh position={[0, -0.32, 0]}>
        <boxGeometry args={[0.48, 0.22, 0.36]} />
        <meshStandardMaterial
          color={flangeColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Isolator Capsule Neck at y = -0.1 */}
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[0.12, 0.14, 0.22, isLow ? 14 : 28]} />
        <meshStandardMaterial
          color={flangeColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Dual-Compartment Electronics Housing Cylinder at y = 0.2 along Z */}
      <mesh position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.24, 0.24, 0.44, isLow ? 16 : 36]} />
        <meshStandardMaterial
          color={housingColor}
          metalness={0.7}
          roughness={0.35}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Front Round Display Window Cover at z = 0.22 */}
      <mesh position={[0, 0.2, 0.22]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 0.05, isLow ? 16 : 32]} />
        <meshStandardMaterial
          color={housingColor}
          metalness={0.75}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      {/* LCD Display Glass in window */}
      <mesh position={[0, 0.2, 0.246]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.01, isLow ? 14 : 28]} />
        <meshStandardMaterial
          color={displayColor}
          metalness={0.3}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Drain/Vent valve plugs on process flange (high detail) */}
      {!isLow && (
        <>
          <mesh position={[-0.14, -0.42, 0.12]}>
            <cylinderGeometry args={[0.03, 0.03, 0.08, 10]} />
            <meshStandardMaterial
              color="#cbd5e1"
              metalness={0.85}
              roughness={0.25}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
          <mesh position={[0.14, -0.42, 0.12]}>
            <cylinderGeometry args={[0.03, 0.03, 0.08, 10]} />
            <meshStandardMaterial
              color="#cbd5e1"
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
