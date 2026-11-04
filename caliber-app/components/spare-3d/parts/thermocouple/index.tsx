import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "thermocouple",
  name: "Thermocouple",
  size: [1, 0.35, 0.35],
};

export default function Thermocouple({ color, highlight, detail = "high" }: PartProps) {
  const emissive = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;
  const isLow = detail === "low";

  const headColor = color || "#0284c7"; // Blue explosion-proof aluminum connection head
  const sheathColor = "#cbd5e1";        // Stainless steel probe sheath
  const hexColor = "#94a3b8";

  return (
    <group>
      {/* Explosion-Proof Connection Head Cylinder at x = -0.32 along X */}
      <mesh position={[-0.32, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.16, 0.16, 0.22, isLow ? 16 : 32]} />
        <meshStandardMaterial
          color={headColor}
          metalness={0.7}
          roughness={0.35}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Screw-on Dome Head Cover at x = -0.44 */}
      <mesh position={[-0.44, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.13, 0.16, 0.06, isLow ? 16 : 32]} />
        <meshStandardMaterial
          color={headColor}
          metalness={0.75}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Side Cable Gland Conduit Entry extending up along Y */}
      <mesh position={[-0.32, 0.16, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.1, isLow ? 10 : 20]} />
        <meshStandardMaterial
          color={hexColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Process Mounting Hex Compression Fitting at x = -0.16 */}
      <mesh position={[-0.16, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 0.08, 6]} />
        <meshStandardMaterial
          color={hexColor}
          metalness={0.85}
          roughness={0.25}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Long Thin Stainless Steel Protection Sheath Probe extending to +X */}
      <mesh position={[0.18, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, 0.62, isLow ? 10 : 20]} />
        <meshStandardMaterial
          color={sheathColor}
          metalness={0.9}
          roughness={0.15}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Sealed Sheath Tip (high detail) */}
      {!isLow && (
        <mesh position={[0.49, 0, 0]}>
          <sphereGeometry args={[0.03, 16, 12]} />
          <meshStandardMaterial
            color={sheathColor}
            metalness={0.9}
            roughness={0.15}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
      )}
    </group>
  );
}
