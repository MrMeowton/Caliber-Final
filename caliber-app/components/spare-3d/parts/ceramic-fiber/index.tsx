import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "ceramic-fiber",
  name: "Ceramic fiber",
  size: [0.9, 0.6, 1],
};

export default function CeramicFiber({ color, highlight, detail = "high" }: PartProps) {
  const emissive = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;
  const isLow = detail === "low";

  const blanketColor = color || "#f1f5f9"; // Soft white ceramic fiber wool
  const seamColor = "#cbd5e1";

  return (
    <group>
      {/* Soft Ceramic Fiber Blanket Main Block Layer */}
      <mesh>
        <boxGeometry args={[0.88, 0.56, 0.96]} />
        <meshStandardMaterial
          color={blanketColor}
          metalness={0.02}
          roughness={0.96}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Layered quilted stitch seams & retention washers (high detail) */}
      {!isLow && (
        <>
          {/* Quilted needle-punched seam lines */}
          <mesh position={[0, 0.282, -0.22]}>
            <boxGeometry args={[0.84, 0.005, 0.02]} />
            <meshStandardMaterial
              color={seamColor}
              metalness={0.05}
              roughness={0.9}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
          <mesh position={[0, 0.282, 0.22]}>
            <boxGeometry args={[0.84, 0.005, 0.02]} />
            <meshStandardMaterial
              color={seamColor}
              metalness={0.05}
              roughness={0.9}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
          {/* Ceramic speed-clip anchor washers */}
          <mesh position={[-0.2, 0.29, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.015, 12]} />
            <meshStandardMaterial
              color="#e2e8f0"
              metalness={0.7}
              roughness={0.3}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
          <mesh position={[0.2, 0.29, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.015, 12]} />
            <meshStandardMaterial
              color="#e2e8f0"
              metalness={0.7}
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
