import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "tube-plug",
  name: "Tube plug",
  size: [1, 0.4, 0.4],
};

export default function TubePlug({ color, highlight, detail = "high" }: PartProps) {
  const emissive = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;
  const isLow = detail === "low";

  const alloyColor = color || "#cbd5e1"; // Brass / Carbon steel / Monel
  const hexHeadColor = "#94a3b8";

  return (
    <group>
      {/* Driving Hex Head at x = -0.42 */}
      <mesh position={[-0.42, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.18, 0.18, 0.14, 6]} />
        <meshStandardMaterial
          color={hexHeadColor}
          metalness={0.85}
          roughness={0.25}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Main Tapered Sealing Pin Body along X */}
      <mesh position={[0.02, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.14, 0.17, 0.66, isLow ? 14 : 32]} />
        <meshStandardMaterial
          color={alloyColor}
          metalness={0.85}
          roughness={0.25}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Bullet-Nose Lead-in Tip at x = 0.42 */}
      <mesh position={[0.42, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.14, 0.14, isLow ? 14 : 32]} />
        <meshStandardMaterial
          color={alloyColor}
          metalness={0.85}
          roughness={0.25}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Circumferential grip serrations & hex hollow socket (high detail) */}
      {!isLow && (
        <>
          <mesh position={[-0.1, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.165, 0.008, 8, 32]} />
            <meshStandardMaterial
              color="#64748b"
              metalness={0.8}
              roughness={0.35}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
          <mesh position={[0.06, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.155, 0.008, 8, 32]} />
            <meshStandardMaterial
              color="#64748b"
              metalness={0.8}
              roughness={0.35}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
          <mesh position={[0.22, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.145, 0.008, 8, 32]} />
            <meshStandardMaterial
              color="#64748b"
              metalness={0.8}
              roughness={0.35}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
        </>
      )}
    </group>
  );
}
