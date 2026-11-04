import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "studbolt",
  name: "Studbolt",
  size: [1, 0.35, 0.35],
};

export default function Studbolt({ color, highlight, detail = "high" }: PartProps) {
  const emissive = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;
  const isLow = detail === "low";

  const alloyColor = color || "#64748b"; // B7 / alloy steel
  const nutColor = "#cbd5e1";           // 2H heavy hex nut

  return (
    <group>
      {/* Continuous Threaded Stud Rod along X */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.075, 0.075, 0.98, isLow ? 12 : 24]} />
        <meshStandardMaterial
          color={alloyColor}
          metalness={0.85}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Left Heavy Hex Nut */}
      <mesh position={[-0.34, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.15, 0.15, 0.14, 6]} />
        <meshStandardMaterial
          color={nutColor}
          metalness={0.85}
          roughness={0.25}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Right Heavy Hex Nut */}
      <mesh position={[0.34, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.15, 0.15, 0.14, 6]} />
        <meshStandardMaterial
          color={nutColor}
          metalness={0.85}
          roughness={0.25}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Washers and beveled ends (high detail) */}
      {!isLow && (
        <>
          <mesh position={[-0.24, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.16, 0.16, 0.025, 24]} />
            <meshStandardMaterial
              color={alloyColor}
              metalness={0.8}
              roughness={0.35}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
          <mesh position={[0.24, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.16, 0.16, 0.025, 24]} />
            <meshStandardMaterial
              color={alloyColor}
              metalness={0.8}
              roughness={0.35}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
          <mesh position={[-0.495, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <coneGeometry args={[0.075, 0.03, 16]} />
            <meshStandardMaterial
              color={alloyColor}
              metalness={0.8}
              roughness={0.3}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
          <mesh position={[0.495, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <coneGeometry args={[0.075, 0.03, 16]} />
            <meshStandardMaterial
              color={alloyColor}
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
