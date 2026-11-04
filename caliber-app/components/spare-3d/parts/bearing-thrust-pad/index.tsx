import React, { useMemo } from "react";
import * as THREE from "three";
import type { PartProps, PartMeta } from "../../contract";

export const META: PartMeta = {
  id: "bearing-thrust-pad",
  name: "Tilting-Pad Thrust Bearing Assembly",
  size: [0.35, 1, 1],
};

export default function BearingThrustPad({
  color = "#c0c4c8",
  highlight = false,
  detail = "high",
}: PartProps) {
  const isHigh = detail === "high";
  const numPads = 8;
  const segments = isHigh ? 32 : 16;

  // Geometry dimensions
  const carrierOuterRadius = 0.48;
  const carrierInnerRadius = 0.22;
  const carrierThickness = 0.08;

  const padInnerRadius = 0.26;
  const padOuterRadius = 0.45;
  const padThickness = 0.05;
  const padArcAngle = (Math.PI * 2 * 0.72) / numPads;
  const babbittThickness = 0.008;

  const collarOuterRadius = 0.48;
  const collarInnerRadius = 0.18;
  const collarThickness = 0.09;

  const carrierX = -0.135;
  const padPivotX = carrierX + carrierThickness / 2 + padThickness / 2;
  const babbittX = padPivotX + padThickness / 2 + babbittThickness / 2;
  const collarX = 0.13;

  const emissiveColor = highlight ? "#ef4444" : "#000000";
  const emissiveIntensity = highlight ? 0.6 : 0;

  // Memoized carrier ring shape
  const carrierShape = useMemo(() => {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, carrierOuterRadius, 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    hole.absarc(0, 0, carrierInnerRadius, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    return shape;
  }, []);

  // Memoized thrust collar shape
  const collarShape = useMemo(() => {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, collarOuterRadius, 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    hole.absarc(0, 0, collarInnerRadius, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    return shape;
  }, []);

  // Memoized kidney-shaped pad geometry
  const padGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    const halfAngle = padArcAngle / 2;
    const rIn = padInnerRadius;
    const rOut = padOuterRadius;

    shape.absarc(0, 0, rOut, -halfAngle, halfAngle, false);
    shape.lineTo(rIn * Math.cos(halfAngle), rIn * Math.sin(halfAngle));
    shape.absarc(0, 0, rIn, halfAngle, -halfAngle, true);
    shape.closePath();

    return new THREE.ExtrudeGeometry(shape, {
      depth: padThickness,
      bevelEnabled: isHigh,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.003,
      bevelThickness: 0.003,
      curveSegments: isHigh ? 16 : 8,
    });
  }, [padArcAngle, padThickness, isHigh]);

  const babbittGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    const halfAngle = padArcAngle / 2;
    shape.absarc(0, 0, padOuterRadius, -halfAngle, halfAngle, false);
    shape.lineTo(
      padInnerRadius * Math.cos(halfAngle),
      padInnerRadius * Math.sin(halfAngle)
    );
    shape.absarc(0, 0, padInnerRadius, halfAngle, -halfAngle, true);
    shape.closePath();

    return new THREE.ExtrudeGeometry(shape, {
      depth: babbittThickness,
      bevelEnabled: false,
      curveSegments: isHigh ? 16 : 8,
    });
  }, [padArcAngle, babbittThickness, isHigh]);

  const padAngles = useMemo(() => {
    const angles = [];
    for (let i = 0; i < numPads; i++) {
      angles.push((i * Math.PI * 2) / numPads);
    }
    return angles;
  }, [numPads]);

  const carrierExtrudeSettings = useMemo(
    () => ({
      depth: carrierThickness,
      bevelEnabled: isHigh,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.004,
      bevelThickness: 0.004,
      curveSegments: segments,
    }),
    [carrierThickness, isHigh, segments]
  );

  const collarExtrudeSettings = useMemo(
    () => ({
      depth: collarThickness,
      bevelEnabled: isHigh,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.005,
      bevelThickness: 0.005,
      curveSegments: segments,
    }),
    [collarThickness, isHigh, segments]
  );

  // Low detail early return: <= 6 meshes
  if (!isHigh) {
    return (
      <group>
        <mesh rotation={[0, Math.PI / 2, 0]} position={[carrierX, 0, 0]}>
          <cylinderGeometry args={[carrierOuterRadius, carrierOuterRadius, carrierThickness, 16]} />
          <meshStandardMaterial
            color="#4a5056"
            metalness={0.7}
            roughness={0.5}
            emissive={emissiveColor}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
        <mesh rotation={[0, Math.PI / 2, 0]} position={[collarX, 0, 0]}>
          <cylinderGeometry args={[collarOuterRadius, collarOuterRadius, collarThickness, 16]} />
          <meshStandardMaterial
            color="#94a3b8"
            metalness={0.85}
            roughness={0.2}
            emissive={emissiveColor}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
        {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, i) => (
          <mesh
            key={i}
            position={[padPivotX, Math.cos(angle) * 0.35, Math.sin(angle) * 0.35]}
            rotation={[angle, 0, 0]}
          >
            <boxGeometry args={[padThickness, 0.16, 0.16]} />
            <meshStandardMaterial
              color={color}
              metalness={0.8}
              roughness={0.3}
              emissive={emissiveColor}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
        ))}
      </group>
    );
  }

  return (
    <group>
      {/* Carrier Base Ring */}
      <mesh
        rotation={[0, Math.PI / 2, 0]}
        position={[carrierX - carrierThickness / 2, 0, 0]}
      >
        <extrudeGeometry args={[carrierShape, carrierExtrudeSettings]} />
        <meshStandardMaterial
          color="#4a5056"
          metalness={0.7}
          roughness={0.5}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Array of Tilting Thrust Pads */}
      <group>
        {padAngles.map((angle, index) => {
          const tiltAngle = 0.035;
          const padMidRadius = (padInnerRadius + padOuterRadius) / 2;

          return (
            <group key={`pad-group-${index}`} rotation={[angle, 0, 0]}>
              <group
                position={[padPivotX - padThickness / 2, 0, 0]}
                rotation={[0, 0, tiltAngle]}
              >
                <mesh rotation={[0, Math.PI / 2, 0]}>
                  <primitive object={padGeometry} attach="geometry" />
                  <meshStandardMaterial
                    color={color}
                    metalness={0.8}
                    roughness={0.3}
                    emissive={emissiveColor}
                    emissiveIntensity={emissiveIntensity}
                  />
                </mesh>

                <mesh
                  rotation={[0, Math.PI / 2, 0]}
                  position={[padThickness / 2 + babbittThickness / 2, 0, 0]}
                >
                  <primitive object={babbittGeometry} attach="geometry" />
                  <meshStandardMaterial
                    color="#e2e8f0"
                    metalness={0.9}
                    roughness={0.15}
                    emissive={emissiveColor}
                    emissiveIntensity={emissiveIntensity}
                  />
                </mesh>
              </group>

              {/* Spherical Pivot Buttons underneath */}
              <mesh position={[carrierX + carrierThickness / 2, 0, padMidRadius]}>
                <sphereGeometry args={[0.015, 16, 16]} />
                <meshStandardMaterial
                  color="#d1d5db"
                  metalness={0.95}
                  roughness={0.1}
                  emissive={emissiveColor}
                  emissiveIntensity={emissiveIntensity}
                />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* Rotating Thrust Collar Disc */}
      <mesh
        rotation={[0, Math.PI / 2, 0]}
        position={[collarX - collarThickness / 2, 0, 0]}
      >
        <extrudeGeometry args={[collarShape, collarExtrudeSettings]} />
        <meshStandardMaterial
          color="#94a3b8"
          metalness={0.85}
          roughness={0.2}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Shaft Passage Keyway Detail on Thrust Collar Inner Diameter */}
      <mesh position={[collarX, collarInnerRadius + 0.012, 0]}>
        <boxGeometry args={[collarThickness, 0.02, 0.025]} />
        <meshStandardMaterial
          color="#334155"
          metalness={0.6}
          roughness={0.6}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Lubrication Oil Nozzles between Pads */}
      {padAngles.map((angle, index) => {
        const nozzleAngle = angle + Math.PI / numPads;
        const rNozzle = (padInnerRadius + padOuterRadius) / 2;
        const ny = Math.cos(nozzleAngle) * rNozzle;
        const nz = Math.sin(nozzleAngle) * rNozzle;

        return (
          <mesh
            key={`nozzle-${index}`}
            position={[carrierX + carrierThickness / 2, ny, nz]}
            rotation={[0, Math.PI / 2, 0]}
          >
            <cylinderGeometry args={[0.008, 0.008, 0.02, 8]} />
            <meshStandardMaterial
              color="#b45309"
              metalness={0.7}
              roughness={0.3}
              emissive={emissiveColor}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
        );
      })}
    </group>
  );
}
