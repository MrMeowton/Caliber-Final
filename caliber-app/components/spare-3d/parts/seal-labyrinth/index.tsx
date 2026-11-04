import React, { useMemo } from "react";
import * as THREE from "three";
import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "seal-labyrinth",
  name: "Labyrinth Seal Sleeve",
  size: [1, 0.9, 0.9],
};

export default function SealLabyrinth({
  color = "#a1a5aa",
  highlight = false,
  detail = "high",
}: PartProps) {
  const isHigh = detail === "high";

  // Dimensions (normalised max dimension = 1.0 along X-axis, outer diameter = 0.9 along Y/Z)
  const length = 1.0;
  const sleeveOuterRadius = 0.45;
  const sleeveInnerRadius = 0.38;
  const toothHeight = 0.04;
  const toothOuterRadius = sleeveOuterRadius + toothHeight; // Total OD = 0.98 (~0.9-1.0)
  
  const numTeeth = isHigh ? 8 : 4;
  const segments = isHigh ? 64 : 32;

  // X positions for knife-edge teeth evenly spaced along the length
  const teethPositions = useMemo(() => {
    const positions = [];
    const margin = 0.1;
    const availableLength = length - 2 * margin;
    const step = availableLength / (numTeeth - 1);
    
    for (let i = 0; i < numTeeth; i++) {
      positions.push(-length / 2 + margin + i * step);
    }
    return positions;
  }, [numTeeth, length]);

  // Main sleeve geometry (Extruded ring along X axis)
  const sleeveShape = useMemo(() => {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, sleeveOuterRadius, 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    hole.absarc(0, 0, sleeveInnerRadius, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    return shape;
  }, [sleeveOuterRadius, sleeveInnerRadius]);

  const sleeveExtrudeSettings = useMemo(
    () => ({
      depth: length,
      bevelEnabled: isHigh,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.005,
      bevelThickness: 0.005,
      curveSegments: segments,
    }),
    [length, isHigh, segments]
  );

  // Individual knife-edge tooth geometry (tapered thin ring profile)
  const toothGeometry = useMemo(() => {
    const toothShape = new THREE.Shape();
    const toothBaseWidth = 0.015;
    const toothTipWidth = 0.003;

    // Cross-section profile along (X, Y) where Y is radius
    toothShape.moveTo(-toothBaseWidth / 2, sleeveOuterRadius - 0.001);
    toothShape.lineTo(-toothTipWidth / 2, toothOuterRadius);
    toothShape.lineTo(toothTipWidth / 2, toothOuterRadius);
    toothShape.lineTo(toothBaseWidth / 2, sleeveOuterRadius - 0.001);
    toothShape.closePath();

    // Revolve around local Z (which aligns to X axis after rotation)
    return new THREE.LatheGeometry(
      toothShape.extractPoints(6).shape,
      segments
    );
  }, [sleeveOuterRadius, toothOuterRadius, segments]);

  // High detail anti-rotation keyway / flange slot profiles
  const keywayPositions = useMemo(() => {
    if (!isHigh) return [];
    return [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
  }, [isHigh]);

  const emissiveColor = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;

  return (
    <group>
      {/* Main Base Sleeve */}
      <mesh
        rotation={[0, Math.PI / 2, 0]}
        position={[-length / 2, 0, 0]}
      >
        <extrudeGeometry args={[sleeveShape, sleeveExtrudeSettings]} />
        <meshStandardMaterial
          color={color}
          metalness={0.8}
          roughness={0.35}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Circumferential Knife-Edge Teeth Stack */}
      {teethPositions.map((xPos, index) => (
        <mesh
          key={`tooth-${index}`}
          position={[xPos, 0, 0]}
          rotation={[0, 0, 0]}
        >
          <primitive object={toothGeometry} attach="geometry" />
          <meshStandardMaterial
            color="#d1d5db"
            metalness={0.9}
            roughness={0.2}
            emissive={emissiveColor}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
      ))}

      {/* High Detail Features: Alignment Pin Holes & Anti-Rotation Slots */}
      {isHigh && (
        <>
          {/* Internal Shaft Clearance Grooves / Land Intersections */}
          <mesh rotation={[0, Math.PI / 2, 0]} position={[-length / 2 + 0.02, 0, 0]}>
            <torusGeometry args={[sleeveInnerRadius + 0.005, 0.004, 16, segments]} />
            <meshStandardMaterial
              color="#334155"
              metalness={0.7}
              roughness={0.5}
              emissive={emissiveColor}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
          <mesh rotation={[0, Math.PI / 2, 0]} position={[length / 2 - 0.02, 0, 0]}>
            <torusGeometry args={[sleeveInnerRadius + 0.005, 0.004, 16, segments]} />
            <meshStandardMaterial
              color="#334155"
              metalness={0.7}
              roughness={0.5}
              emissive={emissiveColor}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>

          {/* Exterior Radial Pin Locking Sockets */}
          {keywayPositions.map((angle, idx) => {
            const rad = sleeveOuterRadius + 0.01;
            const y = Math.cos(angle) * rad;
            const z = Math.sin(angle) * rad;

            return (
              <mesh
                key={`keyway-${idx}`}
                position={[0, y, z]}
                rotation={[angle, 0, 0]}
              >
                <boxGeometry args={[0.04, 0.02, 0.025]} />
                <meshStandardMaterial
                  color="#4b5563"
                  metalness={0.75}
                  roughness={0.4}
                  emissive={emissiveColor}
                  emissiveIntensity={emissiveIntensity}
                />
              </mesh>
            );
          })}
        </>
      )}
    </group>
  );
}