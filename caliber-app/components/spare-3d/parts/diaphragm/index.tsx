import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "diaphragm",
  name: "Diaphragm",
  size: [0.18, 1, 1],
};

export default function Diaphragm({ color, highlight, detail = "high" }: PartProps) {
  const emissive = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;
  const isLow = detail === "low";

  const rubberColor = color || "#1e293b"; // Molded elastomer
  const metalPlateColor = "#94a3b8";

  return (
    <group>
      {/* Molded Convolution Ring Ridge in YZ plane */}
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.32, 0.08, isLow ? 12 : 24, isLow ? 24 : 48]} />
        <meshStandardMaterial
          color={rubberColor}
          metalness={0.1}
          roughness={0.7}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Outer Bolt-Clamping Flange Rim in YZ plane */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.5, 0.5, 0.03, isLow ? 20 : 40, 1, true]} />
        <meshStandardMaterial
          color={rubberColor}
          metalness={0.1}
          roughness={0.8}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Center Stud Clamping Plate */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.2, 0.2, 0.06, isLow ? 16 : 32]} />
        <meshStandardMaterial
          color={metalPlateColor}
          metalness={0.8}
          roughness={0.25}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Center Stem Stud & Nut (high detail) */}
      {!isLow && (
        <>
          <mesh position={[0.06, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.045, 0.045, 0.07, 16]} />
            <meshStandardMaterial
              color="#cbd5e1"
              metalness={0.85}
              roughness={0.2}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
          <mesh position={[0.075, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.075, 0.075, 0.04, 6]} />
            <meshStandardMaterial
              color="#cbd5e1"
              metalness={0.85}
              roughness={0.2}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
        </>
      )}
    </group>
  );
}
