import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "valve-governor",
  name: "Valve governor",
  size: [0.7, 1, 0.5],
};

export default function ValveGovernor({ color, highlight, detail = "high" }: PartProps) {
  const emissive = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;
  const isLow = detail === "low";

  const chestColor = color || "#334155";  // Heavy turbine steam chest
  const servoColor = "#475569";          // Hydraulic servo cylinder
  const linkageColor = "#94a3b8";        // Precision mechanical linkage

  return (
    <group>
      {/* Heavy High-Pressure Steam Valve Chest at bottom: y = -0.28 */}
      <mesh position={[0, -0.28, 0]}>
        <boxGeometry args={[0.55, 0.36, 0.38]} />
        <meshStandardMaterial
          color={chestColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Steam inlet/outlet nozzle flanges */}
      <mesh position={[-0.3, -0.28, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.16, 0.16, 0.1, isLow ? 14 : 24]} />
        <meshStandardMaterial
          color={chestColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      <mesh position={[0.3, -0.28, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.16, 0.16, 0.1, isLow ? 14 : 24]} />
        <meshStandardMaterial
          color={chestColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Hydraulic Servo Cylinder Actuator on top at y = 0.32 */}
      <mesh position={[0, 0.32, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.32, isLow ? 16 : 32]} />
        <meshStandardMaterial
          color={servoColor}
          metalness={0.75}
          roughness={0.35}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      {/* Cylinder Top Dome Cap */}
      <mesh position={[0, 0.48, 0]}>
        <cylinderGeometry args={[0.14, 0.2, 0.05, isLow ? 16 : 32]} />
        <meshStandardMaterial
          color={servoColor}
          metalness={0.75}
          roughness={0.35}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Actuator Linkage Levers between chest and servo at y = 0.04 */}
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.26, isLow ? 10 : 20]} />
        <meshStandardMaterial
          color={linkageColor}
          metalness={0.85}
          roughness={0.2}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* High detail: Dual lever arms, pivot clevis and stroke indicator scale */}
      {!isLow && (
        <>
          <mesh position={[0, 0.06, 0.12]}>
            <boxGeometry args={[0.36, 0.04, 0.03]} />
            <meshStandardMaterial
              color={linkageColor}
              metalness={0.85}
              roughness={0.2}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
          <mesh position={[0.16, 0.06, 0.12]}>
            <cylinderGeometry args={[0.025, 0.025, 0.08, 12]} />
            <meshStandardMaterial
              color="#d97706"
              metalness={0.8}
              roughness={0.3}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
          <mesh position={[-0.16, 0.06, 0.12]}>
            <cylinderGeometry args={[0.025, 0.025, 0.08, 12]} />
            <meshStandardMaterial
              color="#d97706"
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
