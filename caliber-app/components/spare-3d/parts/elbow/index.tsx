import type { PartProps, PartMeta } from "../../contract";
import React, { useMemo } from "react";
import * as THREE from "three";

export const META: PartMeta = {
  id: "elbow",
  name: "90-Degree Pipe Elbow",
  size: [0.92, 0.92, 0.42] // Bounding box calculated for normalized 1-unit max dimension
};

export default function Elbow({
  color = "#8a929e",
  highlight = false,
  detail = "high"
}: PartProps) {
  const isHigh = detail === "high";

  // 1. Materials setup (memoized)
  const { outerMaterial, innerMaterial } = useMemo(() => {
    const emissive = highlight ? new THREE.Color("#ef4444") : new THREE.Color("#000000");
    const emissiveIntensity = highlight ? 0.6 : 0;
    const baseColor = new THREE.Color(color);

    const outer = new THREE.MeshStandardMaterial({
      color: baseColor,
      metalness: 0.85,
      roughness: 0.35,
      emissive,
      emissiveIntensity,
    });

    const inner = new THREE.MeshStandardMaterial({
      color: baseColor.clone().multiplyScalar(0.6), // Darker interior simulating ambient occlusion
      metalness: 0.6,
      roughness: 0.7,
      emissive,
      emissiveIntensity,
      side: THREE.BackSide,
    });

    return { outerMaterial: outer, innerMaterial: inner };
  }, [color, highlight]);

  // 2. Procedural Geometries (memoized)
  const { outerGeo, innerGeo, ringGeo, plaqueGeo } = useMemo(() => {
    const radial = isHigh ? 32 : 10;
    const tubular = isHigh ? 64 : 16;
    
    // R=0.5 bend radius, r=0.21 pipe radius.
    // An elbow is a quarter of a torus (Math.PI / 2).
    const outer = new THREE.TorusGeometry(0.5, 0.21, radial, tubular, Math.PI / 2);
    
    // For high detail, we model the physical thickness of the pipe metal.
    const inner = isHigh ? new THREE.TorusGeometry(0.5, 0.17, radial, tubular, Math.PI / 2) : null;
    
    // Rings to seal the ends between the outer and inner torus
    const ring = isHigh ? new THREE.RingGeometry(0.17, 0.21, radial) : null;
    
    // A small raised casting mark/plaque on the outside of the bend
    const plaque = isHigh ? new THREE.BoxGeometry(0.015, 0.15, 0.08) : null;

    return { outerGeo: outer, innerGeo: inner, ringGeo: ring, plaqueGeo: plaque };
  }, [isHigh]);

  return (
    <group>
      {/* 
        Main Torus Body
        By centering at [-0.25, 0.25, 0] and rotating by -90 degrees around Z, 
        the inlet perfectly aligns at [-0.25, -0.25, 0] facing -X (flow travels +X),
        and the outlet aligns at [0.25, 0.25, 0] facing +Y (flow travels +Y).
      */}
      <group position={[-0.25, 0.25, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <mesh geometry={outerGeo} material={outerMaterial} />
        
        {isHigh && innerGeo && (
          <mesh geometry={innerGeo} material={innerMaterial} />
        )}
        
        {/* Manufacturing Stamped Plaque on the outer 45-degree bend */}
        {isHigh && plaqueGeo && (
          <mesh
            geometry={plaqueGeo}
            material={outerMaterial}
            position={[0.71 * Math.cos(Math.PI / 4), 0.71 * Math.sin(Math.PI / 4), 0]}
            rotation={[0, 0, Math.PI / 4]}
          />
        )}
      </group>

      {/* End Caps (Solid metal thickness profile for the bevel joints) */}
      {isHigh && ringGeo && (
        <>
          {/* Inlet End (facing -X) */}
          <mesh
            geometry={ringGeo}
            material={outerMaterial}
            position={[-0.25, -0.25, 0]}
            rotation={[0, -Math.PI / 2, 0]}
          />
          {/* Outlet End (facing +Y) */}
          <mesh
            geometry={ringGeo}
            material={outerMaterial}
            position={[0.25, 0.25, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
          />
        </>
      )}
    </group>
  );
}