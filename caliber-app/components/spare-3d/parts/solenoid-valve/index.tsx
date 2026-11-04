import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "solenoid-valve",
  name: "Solenoid valve",
  size: [0.6, 1, 0.45],
};

export default function SolenoidValve({ color, highlight, detail = "high" }: PartProps) {
  const emissive = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;
  const isLow = detail === "low";

  const valveBodyColor = color || "#d97706"; // Brass / stainless valve body
  const coilColor = "#18181b";               // Encapsulated black epoxy coil
  const dinConnectorColor = "#334155";

  return (
    <group>
      {/* Forged Brass Valve Body at bottom: y = -0.28 */}
      <mesh position={[0, -0.28, 0]}>
        <boxGeometry args={[0.54, 0.26, 0.32]} />
        <meshStandardMaterial
          color={valveBodyColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Threaded Inlet and Outlet Ports along X */}
      <mesh position={[-0.26, -0.28, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, 0.08, isLow ? 12 : 20]} />
        <meshStandardMaterial
          color="#0f172a"
          metalness={0.4}
          roughness={0.6}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      <mesh position={[0.26, -0.28, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, 0.08, isLow ? 12 : 20]} />
        <meshStandardMaterial
          color="#0f172a"
          metalness={0.4}
          roughness={0.6}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Solenoid Coil Housing Cylinder on top at y = 0.12 */}
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.42, isLow ? 16 : 32]} />
        <meshStandardMaterial
          color={coilColor}
          metalness={0.3}
          roughness={0.6}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* DIN 43650 Hirschmann Connector Block on side */}
      <mesh position={[0, 0.14, 0.16]}>
        <boxGeometry args={[0.18, 0.18, 0.16]} />
        <meshStandardMaterial
          color={dinConnectorColor}
          metalness={0.2}
          roughness={0.7}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Top Solenoid Retaining Knurled Nut (high detail) */}
      {!isLow && (
        <>
          <mesh position={[0, 0.36, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.06, 16]} />
            <meshStandardMaterial
              color="#cbd5e1"
              metalness={0.85}
              roughness={0.2}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
          <mesh position={[0, 0.14, 0.25]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.06, 12]} />
            <meshStandardMaterial
              color="#0f172a"
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
