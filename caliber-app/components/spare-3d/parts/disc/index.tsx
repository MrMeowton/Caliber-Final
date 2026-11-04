import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "disc",
  name: "Disc",
  size: [0.4, 1, 1],
};

export default function Disc({ color, highlight, detail = "high" }: PartProps) {
  const emissive = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;
  const isLow = detail === "low";

  const discColor = color || "#cbd5e1";
  const stemColor = "#94a3b8";
  const faceColor = "#f8fafc";

  return (
    <group>
      {/* Main Disc Body Disc along X */}
      <mesh position={[0.06, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.5, 0.5, 0.1, isLow ? 16 : 36]} />
        <meshStandardMaterial
          color={discColor}
          metalness={0.85}
          roughness={0.25}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Precision Lapped Sealing Lip / Ring facing +X */}
      <mesh position={[0.14, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.44, 0.44, 0.06, isLow ? 16 : 36]} />
        <meshStandardMaterial
          color={faceColor}
          metalness={0.95}
          roughness={0.1}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Guide Stem Stub on back at -X */}
      <mesh position={[-0.1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.16, 0.16, 0.24, isLow ? 14 : 28]} />
        <meshStandardMaterial
          color={stemColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* High detail: Deflection skirt and spindle pivot ball socket */}
      {!isLow && (
        <>
          {/* Blowdown deflection skirt rim */}
          <mesh position={[0.1, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.49, 0.015, 8, 36]} />
            <meshStandardMaterial
              color={discColor}
              metalness={0.85}
              roughness={0.2}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
          {/* Central ball pivot cup on back */}
          <mesh position={[-0.19, 0, 0]}>
            <sphereGeometry args={[0.06, 16, 12]} />
            <meshStandardMaterial
              color="#0f172a"
              metalness={0.4}
              roughness={0.6}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
        </>
      )}
    </group>
  );
}
