import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "gauge",
  name: "Gauge",
  size: [0.75, 1, 0.35],
};

export default function Gauge({ color, highlight, detail = "high" }: PartProps) {
  const emissive = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;
  const isLow = detail === "low";

  const caseColor = color || "#94a3b8"; // Stainless steel casing
  const dialFaceColor = "#f8fafc";
  const needleColor = "#dc2626";       // Red indicator pointer
  const stemColor = "#d97706";         // Brass stem connector

  return (
    <group>
      {/* Round Gauge Case Bezel at y = 0.14 along Z */}
      <mesh position={[0, 0.14, 0]}>
        <cylinderGeometry args={[0.36, 0.36, 0.18, isLow ? 18 : 36]} />
        <meshStandardMaterial
          color={caseColor}
          metalness={0.85}
          roughness={0.25}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Dial Face Plate at z = 0.08 */}
      <mesh position={[0, 0.14, 0.08]}>
        <cylinderGeometry args={[0.33, 0.33, 0.02, isLow ? 16 : 36]} />
        <meshStandardMaterial
          color={dialFaceColor}
          metalness={0.1}
          roughness={0.8}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Pointer Needle pointing toward upper-right */}
      <mesh position={[0.06, 0.2, 0.095]} rotation={[0, 0, -0.6]}>
        <boxGeometry args={[0.02, 0.22, 0.008]} />
        <meshStandardMaterial
          color={needleColor}
          metalness={0.3}
          roughness={0.5}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      {/* Needle Center Pivot Cap */}
      <mesh position={[0, 0.14, 0.1]}>
        <cylinderGeometry args={[0.03, 0.03, 0.015, 12]} />
        <meshStandardMaterial
          color="#18181b"
          metalness={0.5}
          roughness={0.5}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Brass Bottom Connection Stem extending down to y = -0.48 */}
      <mesh position={[0, -0.32, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.32, isLow ? 12 : 24]} />
        <meshStandardMaterial
          color={stemColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* High detail: Stem wrench flat hex & glass rim */}
      {!isLow && (
        <>
          <mesh position={[0, -0.26, 0]}>
            <cylinderGeometry args={[0.09, 0.09, 0.08, 6]} />
            <meshStandardMaterial
              color={stemColor}
              metalness={0.85}
              roughness={0.25}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
          <mesh position={[0, 0.14, 0.09]}>
            <torusGeometry args={[0.34, 0.012, 10, 36]} />
            <meshStandardMaterial
              color={caseColor}
              metalness={0.9}
              roughness={0.15}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
        </>
      )}
    </group>
  );
}
