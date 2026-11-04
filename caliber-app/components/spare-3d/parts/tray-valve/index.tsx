import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "tray-valve",
  name: "Tray valve",
  size: [0.35, 1, 1],
};

export default function TrayValve({ color, highlight, detail = "high" }: PartProps) {
  const emissive = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;
  const isLow = detail === "low";

  const capColor = color || "#cbd5e1"; // Stamped stainless steel valve cap
  const legColor = "#94a3b8";

  return (
    <group>
      {/* Floating Stamped Cap Disc lying in YZ, facing +X */}
      <mesh position={[0.1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.48, 0.48, 0.035, isLow ? 16 : 36]} />
        <meshStandardMaterial
          color={capColor}
          metalness={0.85}
          roughness={0.2}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Stamped Center Dimple / Venturi Profile */}
      <mesh position={[0.12, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.18, 0.18, 0.02, isLow ? 12 : 24]} />
        <meshStandardMaterial
          color={capColor}
          metalness={0.9}
          roughness={0.15}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* 3 Bent Guide Legs spaced at 120 degrees extending along -X */}
      {/* Leg 1: Top */}
      <mesh position={[-0.04, 0.38, 0]}>
        <boxGeometry args={[0.26, 0.04, 0.06]} />
        <meshStandardMaterial
          color={legColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      {/* Leg 2: Bottom-Left (120 deg) */}
      <mesh position={[-0.04, -0.19, 0.33]} rotation={[0, -Math.PI / 3, 0]}>
        <boxGeometry args={[0.26, 0.04, 0.06]} />
        <meshStandardMaterial
          color={legColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      {/* Leg 3: Bottom-Right (-120 deg) */}
      <mesh position={[-0.04, -0.19, -0.33]} rotation={[0, Math.PI / 3, 0]}>
        <boxGeometry args={[0.26, 0.04, 0.06]} />
        <meshStandardMaterial
          color={legColor}
          metalness={0.8}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Outward bent retaining locking feet on leg ends (high detail) */}
      {!isLow && (
        <>
          <mesh position={[-0.16, 0.42, 0]}>
            <boxGeometry args={[0.03, 0.06, 0.06]} />
            <meshStandardMaterial
              color={legColor}
              metalness={0.8}
              roughness={0.3}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
          <mesh position={[-0.16, -0.21, 0.36]} rotation={[0, -Math.PI / 3, 0]}>
            <boxGeometry args={[0.03, 0.06, 0.06]} />
            <meshStandardMaterial
              color={legColor}
              metalness={0.8}
              roughness={0.3}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
          <mesh position={[-0.16, -0.21, -0.36]} rotation={[0, Math.PI / 3, 0]}>
            <boxGeometry args={[0.03, 0.06, 0.06]} />
            <meshStandardMaterial
              color={legColor}
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
