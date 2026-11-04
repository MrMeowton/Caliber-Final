import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "nozzle",
  name: "Nozzle",
  size: [1, 0.85, 0.85],
};

export default function Nozzle({ color, highlight, detail = "high" }: PartProps) {
  const emissive = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;
  const isLow = detail === "low";

  const flangeColor = color || "#64748b";
  const bodyColor = "#94a3b8";
  const seatColor = "#f1f5f9";

  return (
    <group>
      {/* Inlet Mounting Flange at x = -0.42 */}
      <mesh position={[-0.42, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.425, 0.425, 0.14, isLow ? 16 : 36]} />
        <meshStandardMaterial
          color={flangeColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Converging Venturi Body Tube along X */}
      <mesh position={[0.02, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.26, 0.35, 0.72, isLow ? 16 : 36]} />
        <meshStandardMaterial
          color={bodyColor}
          metalness={0.75}
          roughness={0.35}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Internal Flow Bore along X */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.16, 0.22, 1.02, isLow ? 12 : 24]} />
        <meshStandardMaterial
          color="#0f172a"
          metalness={0.3}
          roughness={0.7}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Raised Seat Ring Face on Top at x = 0.44 */}
      <mesh position={[0.44, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.26, 0.26, 0.08, isLow ? 16 : 36]} />
        <meshStandardMaterial
          color={seatColor}
          metalness={0.9}
          roughness={0.15}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Adjusting Ring Threads & Raised Face (high detail) */}
      {!isLow && (
        <>
          <mesh position={[-0.48, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.26, 0.26, 0.02, 32]} />
            <meshStandardMaterial
              color={bodyColor}
              metalness={0.85}
              roughness={0.2}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
          <mesh position={[0.3, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.265, 0.01, 8, 32]} />
            <meshStandardMaterial
              color="#475569"
              metalness={0.7}
              roughness={0.4}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
          <mesh position={[0.36, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.265, 0.01, 8, 32]} />
            <meshStandardMaterial
              color="#475569"
              metalness={0.7}
              roughness={0.4}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
        </>
      )}
    </group>
  );
}
