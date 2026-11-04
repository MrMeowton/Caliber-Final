import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "firebrick",
  name: "Firebrick",
  size: [1, 0.5, 0.33],
};

export default function Firebrick({ color, highlight, detail = "high" }: PartProps) {
  const emissive = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;
  const isLow = detail === "low";

  const brickColor = color || "#fde68a"; // Insulating refractory firebrick buff/cream

  return (
    <group>
      {/* Main Rectangular Insulating Firebrick (230 x 114 x 76 mm normalized) */}
      <mesh>
        <boxGeometry args={[0.96, 0.48, 0.32]} />
        <meshStandardMaterial
          color={brickColor}
          metalness={0.05}
          roughness={0.92}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Porous / chamfered edge accents (high detail) */}
      {!isLow && (
        <>
          <mesh position={[0, 0.242, 0]}>
            <boxGeometry args={[0.92, 0.005, 0.28]} />
            <meshStandardMaterial
              color="#fef3c7"
              metalness={0.02}
              roughness={0.95}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
          <mesh position={[0, -0.242, 0]}>
            <boxGeometry args={[0.92, 0.005, 0.28]} />
            <meshStandardMaterial
              color="#d97706"
              metalness={0.05}
              roughness={0.9}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
        </>
      )}
    </group>
  );
}
