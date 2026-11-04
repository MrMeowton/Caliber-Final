import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "blade",
  name: "Blade",
  size: [0.25, 1, 0.35],
};

export default function Blade({ color, highlight, detail = "high" }: PartProps) {
  const emissive = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;
  const isLow = detail === "low";

  const bladeColor = color || "#94a3b8";
  const rootColor = "#64748b";

  return (
    <group>
      {/* Fir-tree root base (slotted into turbine rotor disc) */}
      <mesh position={[0, -0.38, 0]}>
        <boxGeometry args={[0.18, 0.22, 0.26]} />
        <meshStandardMaterial
          color={rootColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Fir-tree root serrations / side teeth (high detail) */}
      {!isLow && (
        <>
          <mesh position={[0, -0.44, 0.14]}>
            <boxGeometry args={[0.16, 0.04, 0.05]} />
            <meshStandardMaterial
              color={rootColor}
              metalness={0.8}
              roughness={0.3}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
          <mesh position={[0, -0.44, -0.14]}>
            <boxGeometry args={[0.16, 0.04, 0.05]} />
            <meshStandardMaterial
              color={rootColor}
              metalness={0.8}
              roughness={0.3}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
          <mesh position={[0, -0.36, 0.15]}>
            <boxGeometry args={[0.16, 0.04, 0.06]} />
            <meshStandardMaterial
              color={rootColor}
              metalness={0.8}
              roughness={0.3}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
          <mesh position={[0, -0.36, -0.15]}>
            <boxGeometry args={[0.16, 0.04, 0.06]} />
            <meshStandardMaterial
              color={rootColor}
              metalness={0.8}
              roughness={0.3}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
        </>
      )}

      {/* Platform transition shelf */}
      <mesh position={[0, -0.26, 0]}>
        <boxGeometry args={[0.22, 0.04, 0.32]} />
        <meshStandardMaterial
          color={rootColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Twisted Aerofoil Airfoil Section - stacked curved boxes with progressive twist */}
      <mesh position={[0.01, -0.1, 0.02]} rotation={[0, 0.15, 0]}>
        <boxGeometry args={[0.08, 0.28, 0.28]} />
        <meshStandardMaterial
          color={bladeColor}
          metalness={0.85}
          roughness={0.2}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      <mesh position={[-0.01, 0.18, -0.01]} rotation={[0, 0.35, 0]}>
        <boxGeometry args={[0.06, 0.3, 0.24]} />
        <meshStandardMaterial
          color={bladeColor}
          metalness={0.85}
          roughness={0.2}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Blade Tip / Shroud Interlock (high detail) */}
      {!isLow && (
        <mesh position={[0, 0.44, 0]} rotation={[0, 0.45, 0]}>
          <boxGeometry args={[0.14, 0.06, 0.22]} />
          <meshStandardMaterial
            color={rootColor}
            metalness={0.8}
            roughness={0.3}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
      )}
    </group>
  );
}
