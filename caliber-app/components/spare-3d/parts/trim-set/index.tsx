import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "trim-set",
  name: "Trim set",
  size: [0.5, 1, 0.5],
};

export default function TrimSet({ color, highlight, detail = "high" }: PartProps) {
  const emissive = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;
  const isLow = detail === "low";

  const stemColor = color || "#cbd5e1";
  const cageColor = "#94a3b8";
  const plugColor = "#e2e8f0";
  const seatColor = "#64748b";

  return (
    <group>
      {/* Seat Ring at bottom: y = -0.42 */}
      <mesh position={[0, -0.42, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.08, isLow ? 16 : 36, 1, true]} />
        <meshStandardMaterial
          color={seatColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      {/* Chamfered Seating Surface */}
      <mesh position={[0, -0.38, 0]}>
        <cylinderGeometry args={[0.18, 0.14, 0.04, isLow ? 16 : 32]} />
        <meshStandardMaterial
          color={seatColor}
          metalness={0.85}
          roughness={0.2}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Perforated Guide Cage around plug: y = -0.16 */}
      <mesh position={[0, -0.16, 0]}>
        <cylinderGeometry args={[0.24, 0.24, 0.42, isLow ? 16 : 36, 1, true]} />
        <meshStandardMaterial
          color={cageColor}
          metalness={0.75}
          roughness={0.35}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Throttling Plug inside cage */}
      <mesh position={[0, -0.18, 0]}>
        <cylinderGeometry args={[0.19, 0.13, 0.24, isLow ? 16 : 32]} />
        <meshStandardMaterial
          color={plugColor}
          metalness={0.85}
          roughness={0.2}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Valve Stem Rod extending upward along Y */}
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.62, isLow ? 12 : 24]} />
        <meshStandardMaterial
          color={stemColor}
          metalness={0.9}
          roughness={0.15}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Cage flow window cutouts & top lock nut (high detail) */}
      {!isLow && (
        <>
          {/* Cage flow port simulation rings */}
          <mesh position={[0, -0.1, 0]}>
            <torusGeometry args={[0.242, 0.01, 8, 32]} />
            <meshStandardMaterial
              color="#0f172a"
              metalness={0.3}
              roughness={0.7}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
          <mesh position={[0, -0.22, 0]}>
            <torusGeometry args={[0.242, 0.01, 8, 32]} />
            <meshStandardMaterial
              color="#0f172a"
              metalness={0.3}
              roughness={0.7}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
          {/* Bonnet guide bushing collar */}
          <mesh position={[0, 0.06, 0]}>
            <cylinderGeometry args={[0.25, 0.25, 0.06, 32]} />
            <meshStandardMaterial
              color={cageColor}
              metalness={0.8}
              roughness={0.3}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
          {/* Stem top connector thread / nut */}
          <mesh position={[0, 0.46, 0]}>
            <cylinderGeometry args={[0.055, 0.055, 0.06, 6]} />
            <meshStandardMaterial
              color={stemColor}
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
