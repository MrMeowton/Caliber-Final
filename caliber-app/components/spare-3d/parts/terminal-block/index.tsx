import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "terminal-block",
  name: "Terminal block",
  size: [0.8, 1, 0.7],
};

export default function TerminalBlock({ color, highlight, detail = "high" }: PartProps) {
  const emissive = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;
  const isLow = detail === "low";

  const blockColor = color || "#64748b"; // Polyamide modular terminal block grey
  const railColor = "#cbd5e1";          // 35mm DIN rail steel
  const screwColor = "#94a3b8";

  return (
    <group>
      {/* 35mm Slotted Steel DIN Rail Base at y = -0.42 */}
      <mesh position={[0, -0.42, 0]}>
        <boxGeometry args={[0.78, 0.04, 0.48]} />
        <meshStandardMaterial
          color={railColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Stack of 4 Modular Terminal Slices along X */}
      {[-0.24, -0.08, 0.08, 0.24].map((posX) => (
        <group key={posX} position={[posX, 0.04, 0]}>
          {/* Slice body */}
          <mesh>
            <boxGeometry args={[0.14, 0.82, 0.6]} />
            <meshStandardMaterial
              color={blockColor}
              metalness={0.2}
              roughness={0.7}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>

          {/* Top clamping screws */}
          <mesh position={[0, 0.43, -0.16]}>
            <cylinderGeometry args={[0.035, 0.035, 0.03, isLow ? 8 : 16]} />
            <meshStandardMaterial
              color={screwColor}
              metalness={0.85}
              roughness={0.25}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
          <mesh position={[0, 0.43, 0.16]}>
            <cylinderGeometry args={[0.035, 0.035, 0.03, isLow ? 8 : 16]} />
            <meshStandardMaterial
              color={screwColor}
              metalness={0.85}
              roughness={0.25}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
        </group>
      ))}

      {/* End clamp / end plate on right (high detail) */}
      {!isLow && (
        <mesh position={[0.35, -0.1, 0]}>
          <boxGeometry args={[0.06, 0.54, 0.45]} />
          <meshStandardMaterial
            color="#334155"
            metalness={0.3}
            roughness={0.7}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
      )}
    </group>
  );
}
