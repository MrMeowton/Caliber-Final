import type { PartProps, PartMeta } from "../../contract";
import React, { useMemo } from "react";
import * as THREE from "three";

export const META: PartMeta = {
  id: "bearing-journal",
  name: "Hydrodynamic Journal Bearing",
  size: [1.0, 0.8, 0.8]
};

export default function BearingJournal({
  color = "#6b7280",
  highlight = false,
  detail = "high"
}: PartProps) {
  const isHigh = detail === "high";

  // 1. Materials setup (memoized)
  const { shellMat, babbittMat, boltMat } = useMemo(() => {
    const emissive = highlight ? new THREE.Color("#ef4444") : new THREE.Color(0x000000);
    const emissiveIntensity = highlight ? 0.6 : 0;
    
    return {
      shellMat: new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        metalness: 0.6,
        roughness: 0.65,
        emissive,
        emissiveIntensity
      }),
      babbittMat: new THREE.MeshStandardMaterial({
        color: new THREE.Color("#d1d5db"), // Silvery-white babbitt metal
        metalness: 0.85,
        roughness: 0.25,
        emissive,
        emissiveIntensity
      }),
      boltMat: new THREE.MeshStandardMaterial({
        color: new THREE.Color("#374151"), // Dark steel
        metalness: 0.7,
        roughness: 0.5,
        emissive,
        emissiveIntensity
      })
    };
  }, [color, highlight]);

  // 2. Procedural Geometries (memoized)
  const geometries = useMemo(() => {
    const rOut = 0.4;
    const rIn = 0.3;
    const rBabbittIn = 0.28;
    const length = 1.0;
    const oilGrooveGap = 0.1;
    const babbittLength = (length - oilGrooveGap) / 2;

    const createHalfShape = (outerR: number, innerR: number, isTop: boolean) => {
      const shape = new THREE.Shape();
      const start = isTop ? 0 : Math.PI;
      const end = isTop ? Math.PI : Math.PI * 2;
      
      shape.absarc(0, 0, outerR, start, end, false);
      shape.lineTo(Math.cos(end) * innerR, Math.sin(end) * innerR);
      shape.absarc(0, 0, innerR, end, start, true);
      shape.lineTo(Math.cos(start) * outerR, Math.sin(start) * outerR);
      
      return shape;
    };

    const extrudeOpts = {
      depth: length,
      bevelEnabled: false,
      curveSegments: isHigh ? 32 : 12
    };

    const babbittExtrudeOpts = {
      ...extrudeOpts,
      depth: babbittLength
    };

    // Shapes
    const topShellShape = createHalfShape(rOut, rIn, true);
    const bottomShellShape = createHalfShape(rOut, rIn, false);
    const topBabbittShape = createHalfShape(rIn, rBabbittIn, true);
    const bottomBabbittShape = createHalfShape(rIn, rBabbittIn, false);

    // Geometries
    const topShell = new THREE.ExtrudeGeometry(topShellShape, extrudeOpts);
    const bottomShell = new THREE.ExtrudeGeometry(bottomShellShape, extrudeOpts);
    
    const topBabbitt = new THREE.ExtrudeGeometry(topBabbittShape, babbittExtrudeOpts);
    const bottomBabbitt = new THREE.ExtrudeGeometry(bottomBabbittShape, babbittExtrudeOpts);

    const pinGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.05, 12);
    const boltGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.06, 12);
    const holeGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.06, 12);

    // Low detail tube (single continuous shape)
    const lowDetailShell = new THREE.CylinderGeometry(rOut, rOut, length, 16, 1, false);
    const lowDetailBabbitt = new THREE.CylinderGeometry(rBabbittIn, rBabbittIn, length * 1.01, 16, 1, false);

    return {
      topShell, bottomShell,
      topBabbitt, bottomBabbitt,
      pinGeo, boltGeo, holeGeo,
      lowDetailShell, lowDetailBabbitt,
      babbittLength, length
    };
  }, [isHigh]);

  if (!isHigh) {
    return (
      <group rotation={[0, 0, -Math.PI / 2]}>
        <mesh geometry={geometries.lowDetailShell} material={shellMat} />
        <mesh geometry={geometries.lowDetailBabbitt} material={babbittMat} />
      </group>
    );
  }

  // Bolt position config for split line
  const boltPositions = [
    [-0.4, 0, 0.35],
    [-0.2, 0, 0.35],
    [0.2, 0, 0.35],
    [0.4, 0, 0.35],
    [-0.4, 0, -0.35],
    [-0.2, 0, -0.35],
    [0.2, 0, -0.35],
    [0.4, 0, -0.35],
  ];

  return (
    <group>
      {/* 
        ExtrudeGeometry extrudes along +Z. 
        We rotate by [0, Math.PI/2, 0] to map local +Z to global +X.
        We shift by -0.5 along X so the part centers at origin.
      */}
      <group position={[-0.5, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        
        {/* Top Shell */}
        <mesh geometry={geometries.topShell} material={shellMat} />
        
        {/* Bottom Shell */}
        <mesh geometry={geometries.bottomShell} material={shellMat} />

        {/* Babbitt Liners (Front Section) */}
        <mesh geometry={geometries.topBabbitt} material={babbittMat} />
        <mesh geometry={geometries.bottomBabbitt} material={babbittMat} />

        {/* Babbitt Liners (Rear Section, leaving central oil groove) */}
        <mesh 
          geometry={geometries.topBabbitt} 
          material={babbittMat} 
          position={[0, 0, geometries.length - geometries.babbittLength]} 
        />
        <mesh 
          geometry={geometries.bottomBabbitt} 
          material={babbittMat} 
          position={[0, 0, geometries.length - geometries.babbittLength]} 
        />
      </group>

      {/* Anti-rotation Pin (Top Center) */}
      <mesh 
        geometry={geometries.pinGeo} 
        material={boltMat} 
        position={[0, 0.41, 0]} 
      />

      {/* Oil Supply Hole (Top Center Groove Area) */}
      <mesh 
        geometry={geometries.holeGeo} 
        material={new THREE.MeshBasicMaterial({ color: 0x000000 })} // Pure black for hole depth
        position={[0, 0.38, 0]} 
      />

      {/* Split-line hardware (Bolts holding halves together) */}
      {boltPositions.map((pos, idx) => (
        <group key={`bolt-${idx}`} position={[pos[0], pos[1], pos[2]]}>
          {/* Bottom half bolt stud */}
          <mesh geometry={geometries.boltGeo} material={boltMat} position={[0, -0.02, 0]} />
          {/* Top half recess hole representation */}
          <mesh 
            geometry={geometries.holeGeo} 
            material={new THREE.MeshBasicMaterial({ color: 0x111111 })} 
            position={[0, 0.02, 0]} 
          />
        </group>
      ))}
    </group>
  );
}