import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "valve-needle",
  name: "Valve needle",
  size: [0.7, 1, 0.45],
};

export default function ValveNeedle({ color, highlight, detail = "high" }: PartProps) {
  const emissive = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;
  const isLow = detail === "low";

  const bodyColor = color || "#94a3b8"; // SS316 Hex Bar-stock
  const stemColor = "#cbd5e1";
  const handleColor = "#334155";        // Black/steel T-bar handle

  return (
    <group>
      {/* Hexagonal Bar-Stock Valve Body at y = -0.22 along X */}
      <mesh position={[0, -0.22, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.16, 0.16, 0.54, 6]} />
        <meshStandardMaterial
          color={bodyColor}
          metalness={0.85}
          roughness={0.25}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Female NPT Process Ports at both ends */}
      <mesh position={[-0.28, -0.22, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.09, 0.09, 0.06, isLow ? 10 : 20]} />
        <meshStandardMaterial
          color="#0f172a"
          metalness={0.3}
          roughness={0.7}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      <mesh position={[0.28, -0.22, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.09, 0.09, 0.06, isLow ? 10 : 20]} />
        <meshStandardMaterial
          color="#0f172a"
          metalness={0.3}
          roughness={0.7}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Threaded Bonnet Hex Nut at y = 0.02 */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.12, 6]} />
        <meshStandardMaterial
          color={bodyColor}
          metalness={0.85}
          roughness={0.25}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Rising Needle Stem along Y */}
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.36, isLow ? 10 : 20]} />
        <meshStandardMaterial
          color={stemColor}
          metalness={0.9}
          roughness={0.15}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* T-Bar Handle on Top at y = 0.44 */}
      <mesh position={[0, 0.44, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.42, isLow ? 10 : 20]} />
        <meshStandardMaterial
          color={handleColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* High detail: Needle stem tip inside body & handle knurled end caps */}
      {!isLow && (
        <>
          {/* Tapered needle tip */}
          <mesh position={[0, -0.22, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.04, 0.12, 16]} />
            <meshStandardMaterial
              color="#f8fafc"
              metalness={0.95}
              roughness={0.1}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
          {/* Handle End Caps */}
          <mesh position={[0, 0.44, 0.21]}>
            <sphereGeometry args={[0.045, 12, 10]} />
            <meshStandardMaterial
              color={handleColor}
              metalness={0.8}
              roughness={0.3}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
          <mesh position={[0, 0.44, -0.21]}>
            <sphereGeometry args={[0.045, 12, 10]} />
            <meshStandardMaterial
              color={handleColor}
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
