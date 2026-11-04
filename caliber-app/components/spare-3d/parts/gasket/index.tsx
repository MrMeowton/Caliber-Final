import React, { useMemo } from "react";
import * as THREE from "three";
import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "gasket",
  name: "Spiral-Wound Ring Gasket",
  size: [0.02, 1, 1],
};

export default function Gasket({
  color = "#b0b4b8",
  highlight = false,
  detail = "high",
}: PartProps) {
  const isHigh = detail === "high";
  const segments = isHigh ? 64 : 32;

  // Real gasket proportions scaled to max OD = 1.0
  const R_OUTER_OD = 0.5;
  const R_OUTER_ID = 0.43;
  const R_SPIRAL_ID = 0.37;
  const R_INNER_ID = 0.34;

  const DEPTH_RINGS = 0.015;
  const DEPTH_SPIRAL = 0.02;

  // Memoize shapes for the three main rings
  const { outerShape, spiralShape, innerShape } = useMemo(() => {
    const createRingShape = (outerRadius: number, innerRadius: number) => {
      const shape = new THREE.Shape();
      shape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);
      const hole = new THREE.Path();
      hole.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
      shape.holes.push(hole);
      return shape;
    };

    return {
      outerShape: createRingShape(R_OUTER_OD, R_OUTER_ID),
      spiralShape: createRingShape(R_OUTER_ID, R_SPIRAL_ID),
      innerShape: createRingShape(R_SPIRAL_ID, R_INNER_ID),
    };
  }, []);

  // Extrusion settings
  const ringExtrudeSettings = useMemo(
    () => ({
      depth: DEPTH_RINGS,
      bevelEnabled: false,
      curveSegments: segments,
    }),
    [segments]
  );

  const spiralExtrudeSettings = useMemo(
    () => ({
      depth: DEPTH_SPIRAL,
      bevelEnabled: false,
      curveSegments: segments,
    }),
    [segments]
  );

  // High detail spiral windings
  const spiralRidges = useMemo(() => {
    if (!isHigh) return null;
    const ridges = [];
    const numRidges = 7;
    // Distribute small metal rings across the spiral filler's radius
    for (let i = 0; i < numRidges; i++) {
      const radius = R_SPIRAL_ID + 0.005 + (i * (R_OUTER_ID - R_SPIRAL_ID - 0.01)) / (numRidges - 1);
      ridges.push(radius);
    }
    return ridges;
  }, [isHigh]);

  // Shared material properties
  const emissiveColor = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;

  return (
    <group>
      {/* Outer Guide Ring (Carbon/Stainless Steel) */}
      <mesh
        rotation={[0, Math.PI / 2, 0]}
        position={[-DEPTH_RINGS / 2, 0, 0]}
      >
        <extrudeGeometry args={[outerShape, ringExtrudeSettings]} />
        <meshStandardMaterial
          color={color}
          metalness={0.8}
          roughness={0.4}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Spiral Wound Element Filler (e.g. Graphite/PTFE) */}
      <mesh
        rotation={[0, Math.PI / 2, 0]}
        position={[-DEPTH_SPIRAL / 2, 0, 0]}
      >
        <extrudeGeometry args={[spiralShape, spiralExtrudeSettings]} />
        <meshStandardMaterial
          color="#2a2c2e"
          metalness={0.2}
          roughness={0.8}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Inner Ring (Stainless Steel) */}
      <mesh
        rotation={[0, Math.PI / 2, 0]}
        position={[-DEPTH_RINGS / 2, 0, 0]}
      >
        <extrudeGeometry args={[innerShape, ringExtrudeSettings]} />
        <meshStandardMaterial
          color={color}
          metalness={0.9}
          roughness={0.3}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* High Detail Windings (Metal strips within the filler) */}
      {isHigh && spiralRidges && (
        <>
          {/* Front Face Windings (+X) */}
          <group rotation={[0, Math.PI / 2, 0]} position={[DEPTH_SPIRAL / 2, 0, 0]}>
            {spiralRidges.map((radius, i) => (
              <mesh key={`front-${i}`}>
                <torusGeometry args={[radius, 0.001, 3, segments]} />
                <meshStandardMaterial
                  color="#d0d4d8"
                  metalness={0.9}
                  roughness={0.2}
                  emissive={emissiveColor}
                  emissiveIntensity={emissiveIntensity}
                />
              </mesh>
            ))}
          </group>
          {/* Back Face Windings (-X) */}
          <group rotation={[0, Math.PI / 2, 0]} position={[-DEPTH_SPIRAL / 2, 0, 0]}>
            {spiralRidges.map((radius, i) => (
              <mesh key={`back-${i}`}>
                <torusGeometry args={[radius, 0.001, 3, segments]} />
                <meshStandardMaterial
                  color="#d0d4d8"
                  metalness={0.9}
                  roughness={0.2}
                  emissive={emissiveColor}
                  emissiveIntensity={emissiveIntensity}
                />
              </mesh>
            ))}
          </group>
        </>
      )}
    </group>
  );
}