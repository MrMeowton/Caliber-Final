import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "lamp",
  name: "Lamp",
  size: [0.58, 1, 0.58],
};

export default function Lamp({ color, highlight, detail = "high" }: PartProps) {
  const emissive = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;
  const isLow = detail === "low";

  const bulbColor = color || "#f8fafc"; // Translucent frosted diffuser globe
  const baseColor = "#cbd5e1";         // E27 threaded aluminum screw base
  const heatsinkColor = "#f1f5f9";

  return (
    <group>
      {/* E27 Threaded Screw Base at bottom: y = -0.32 */}
      <mesh position={[0, -0.32, 0]}>
        <cylinderGeometry args={[0.14, 0.14, 0.22, isLow ? 16 : 32]} />
        <meshStandardMaterial
          color={baseColor}
          metalness={0.85}
          roughness={0.25}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Bottom electrical contact pin at y = -0.46 */}
      <mesh position={[0, -0.46, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.06, isLow ? 12 : 20]} />
        <meshStandardMaterial
          color="#334155"
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Thermoplastic / Aluminum Heatsink Transition Neck at y = -0.1 */}
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[0.26, 0.16, 0.22, isLow ? 16 : 32]} />
        <meshStandardMaterial
          color={heatsinkColor}
          metalness={0.3}
          roughness={0.5}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Frosted Polycarbonate Dome Diffuser Bulb at y = 0.2 */}
      <mesh position={[0, 0.2, 0]}>
        <sphereGeometry args={[0.28, isLow ? 16 : 32, isLow ? 12 : 24]} />
        <meshStandardMaterial
          color={bulbColor}
          metalness={0.05}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Thread ridge rings on E27 base (high detail) */}
      {!isLow && (
        <>
          <mesh position={[0, -0.26, 0]}>
            <torusGeometry args={[0.142, 0.012, 8, 28]} />
            <meshStandardMaterial
              color={baseColor}
              metalness={0.9}
              roughness={0.2}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
          <mesh position={[0, -0.34, 0]}>
            <torusGeometry args={[0.142, 0.012, 8, 28]} />
            <meshStandardMaterial
              color={baseColor}
              metalness={0.9}
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
