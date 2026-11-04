import { useMemo } from "react";
import type { EquipmentProps, SlotDef } from "../../contract";
import { XRayShell, FaultPulse } from "../../core";
import Flange from "../../parts/flange";
import Gasket from "../../parts/gasket";
import Studbolt from "../../parts/studbolt";

export const SLOTS: SlotDef[] = [
  {
    id: "gasket",
    part: "gasket",
    name: "Orifice Gaskets",
    position: [0, 0, 0],
    scale: 1.35,
  },
  {
    id: "flange",
    part: "flange",
    name: "Orifice Flanges",
    position: [0, 0, 0],
    scale: 1.65,
  },
  {
    id: "studbolts",
    part: "studbolt",
    name: "Studbolts",
    position: [0, 0, 0],
    scale: 0.12,
  },
];

export default function RestrictionOrifice({
  xray = false,
  explode = 0,
  faults = {},
  onShellClick,
  onPartClick,
  detail = "high",
}: EquipmentProps) {
  const isLow = detail === "low";

  // Main assembly dimensions:
  // Overall length: 4 units
  // Height: 3.6 units
  // Width: 3.6 units
  // Base elevation: y = 0

  const flangeRadius = 1.05;
  const flangeThickness = 0.24;
  const pipeRadius = 0.58;
  const plateRadius = 0.57;

  const boltCount = 8;
  const boltCircleRadius = 0.82;

  const boltPositions = useMemo(
    () =>
      Array.from({ length: boltCount }, (_, i) => {
        const angle = (i / boltCount) * Math.PI * 2;
        return [
          Math.cos(angle) * boltCircleRadius,
          Math.sin(angle) * boltCircleRadius,
          0,
        ] as [number, number, number];
      }),
    [],
  );

  const metal = "#87949C";
  const darkMetal = "#46545E";
  const steelEdge = "#B7C1C8";
  const gasketColor = "#343A40";
  const plateColor = "#AAB4BC";

  const flangeSlot = SLOTS[1];
  const gasketSlot = SLOTS[0];
  const boltSlot = SLOTS[2];

  return (
    <group>
      {/* =====================================================
          PHASE 1 — BASE SUPPORT
          Permanent support structure; never X-ray transparent.
      ====================================================== */}

      <group position={[0, 0.16, 0]}>
        {/* Main support skid */}
        <mesh castShadow receiveShadow position={[0, 0, 0]}>
          <boxGeometry args={[2.8, 0.22, 1.35]} />
          <meshStandardMaterial color="#414B52" metalness={0.7} roughness={0.48} />
        </mesh>

        {/* Support feet */}
        {[-0.95, 0.95].map((x) => (
          <group key={x} position={[x, -0.13, 0]}>
            <mesh castShadow position={[0, 0, 0]}>
              <boxGeometry args={[0.25, 0.26, 0.95]} />
              <meshStandardMaterial color={darkMetal} metalness={0.75} roughness={0.4} />
            </mesh>

            <mesh position={[0, -0.14, 0]}>
              <boxGeometry args={[0.42, 0.06, 1.1]} />
              <meshStandardMaterial color={steelEdge} metalness={0.8} roughness={0.35} />
            </mesh>
          </group>
        ))}
      </group>

      {/* =====================================================
          PHASE 2 — PIPE AND ORIFICE ASSEMBLY
          Axis: X
          The flange pair separates along the pipe axis.
      ====================================================== */}

      {/* Upstream pipe section */}
      <XRayShell
        active={xray}
        explode={[-0.2, 0, 0]}
        onClick={onShellClick}
      >
        <group position={[-1.45, 2.0, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
            <cylinderGeometry args={[pipeRadius, pipeRadius, 1.1, 32]} />
            <meshStandardMaterial
              color={metal}
              metalness={0.78}
              roughness={0.32}
            />
          </mesh>

          <mesh position={[-0.56, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry
              args={[0.72, 0.72, 0.09, 32]}
            />
            <meshStandardMaterial
              color={steelEdge}
              metalness={0.8}
              roughness={0.3}
            />
          </mesh>
        </group>
      </XRayShell>

      {/* Downstream pipe section */}
      <XRayShell
        active={xray}
        explode={[0.2, 0, 0]}
        onClick={onShellClick}
      >
        <group position={[1.45, 2.0, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
            <cylinderGeometry args={[pipeRadius, pipeRadius, 1.1, 32]} />
            <meshStandardMaterial
              color={metal}
              metalness={0.78}
              roughness={0.32}
            />
          </mesh>

          <mesh position={[0.56, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.72, 0.72, 0.09, 32]} />
            <meshStandardMaterial
              color={steelEdge}
              metalness={0.8}
              roughness={0.3}
            />
          </mesh>
        </group>
      </XRayShell>

      {/* =====================================================
          PHASE 3 — FLANGE PAIR
          Flanges are mounted on opposing sides of the plate.
      ====================================================== */}

      <XRayShell
        active={xray}
        explode={[-0.55, 0, 0]}
        onClick={onShellClick}
      >
        <group position={[-0.48, 2.0, 0]}>
          {/* Main upstream flange */}
          <mesh castShadow receiveShadow rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry
              args={[flangeRadius, flangeRadius, flangeThickness, 48]}
            />
            <meshStandardMaterial
              color={metal}
              metalness={0.82}
              roughness={0.3}
            />
          </mesh>

          {/* Raised face */}
          <mesh rotation={[0, 0, Math.PI / 2]} position={[0.13, 0, 0]}>
            <cylinderGeometry args={[0.68, 0.68, 0.08, 48]} />
            <meshStandardMaterial
              color={steelEdge}
              metalness={0.85}
              roughness={0.25}
            />
          </mesh>

          {/* Bore */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry
              args={[pipeRadius, pipeRadius, 0.27, 40]}
            />
            <meshStandardMaterial color={darkMetal} />
          </mesh>
        </group>
      </XRayShell>

      <XRayShell
        active={xray}
        explode={[0.55, 0, 0]}
        onClick={onShellClick}
      >
        <group position={[0.48, 2.0, 0]}>
          {/* Main downstream flange */}
          <mesh castShadow receiveShadow rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry
              args={[flangeRadius, flangeRadius, flangeThickness, 48]}
            />
            <meshStandardMaterial
              color={metal}
              metalness={0.82}
              roughness={0.3}
            />
          </mesh>

          {/* Raised face */}
          <mesh rotation={[0, 0, Math.PI / 2]} position={[-0.13, 0, 0]}>
            <cylinderGeometry args={[0.68, 0.68, 0.08, 48]} />
            <meshStandardMaterial
              color={steelEdge}
              metalness={0.85}
              roughness={0.25}
            />
          </mesh>

          {/* Bore */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry
              args={[pipeRadius, pipeRadius, 0.27, 40]}
            />
            <meshStandardMaterial color={darkMetal} />
          </mesh>
        </group>
      </XRayShell>

      {/* =====================================================
          PHASE 4 — ORIFICE GASKETS
          Two gaskets, one on each plate-facing flange face.
      ====================================================== */}

      <FaultPulse
        active={Boolean(faults[gasketSlot.id])}
        position={gasketSlot.position}
        radius={0.4}
        label={
          faults[gasketSlot.id] && {
            title: gasketSlot.name,
            value: faults[gasketSlot.id].value,
          }
        }
        showLabel={xray}
        onClick={
          xray ? () => onPartClick?.(gasketSlot.id) : undefined
        }
      >
        <group>
          {/* Upstream gasket */}
          <group position={[-0.17 - explode * 0.3, 0, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[0.66, 0.045, 8, 48]} />
              <meshStandardMaterial
                color={gasketColor}
                metalness={0.15}
                roughness={0.85}
              />
            </mesh>
          </group>

          {/* Downstream gasket */}
          <group position={[0.17 + explode * 0.3, 0, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[0.66, 0.045, 8, 48]} />
              <meshStandardMaterial
                color={gasketColor}
                metalness={0.15}
                roughness={0.85}
              />
            </mesh>
          </group>

          {/* Orifice opening visual */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.57, 0.57, 0.035, 40]} />
            <meshBasicMaterial
              color="#171D22"
              transparent
              opacity={0.45}
            />
          </mesh>
        </group>
      </FaultPulse>

      {/* =====================================================
          PHASE 5 — ORIFICE PLATE
          Thin restriction plate between the gasket faces.
      ====================================================== */}

      <XRayShell
        active={xray}
        explode={[0, 0, 0]}
        onClick={onShellClick}
      >
        <group position={[0, 2.0, 0]}>
          {/* Main orifice plate */}
          <mesh
            rotation={[0, 0, Math.PI / 2]}
            castShadow
            receiveShadow
          >
            <cylinderGeometry args={[plateRadius, plateRadius, 0.055, 48]} />
            <meshStandardMaterial
              color={plateColor}
              metalness={0.88}
              roughness={0.25}
            />
          </mesh>

          {/* Central restriction opening */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.24, 0.24, 0.07, 40]} />
            <meshBasicMaterial
              color="#111820"
              transparent
              opacity={0.9}
            />
          </mesh>

          {/* Plate edge identification */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.54, 0.018, 8, 48]} />
            <meshStandardMaterial
              color="#D6DDE1"
              metalness={0.9}
              roughness={0.2}
            />
          </mesh>
        </group>
      </XRayShell>

      {/* =====================================================
          PHASE 6 — STUD BOLTS
          One slot, repeated bolt group around the bolt circle.
      ====================================================== */}

      <FaultPulse
        active={Boolean(faults[boltSlot.id])}
        position={boltSlot.position}
        radius={0.4}
        label={
          faults[boltSlot.id] && {
            title: boltSlot.name,
            value: faults[boltSlot.id].value,
          }
        }
        showLabel={xray}
        onClick={
          xray ? () => onPartClick?.(boltSlot.id) : undefined
        }
      >
        <group>
          {boltPositions.map((p, i) => (
            <group
              key={i}
              position={[
                p[0],
                p[1],
                p[2] + explode * 0.35,
              ]}
            >
              {/* Studbolt shaft */}
              <mesh
                rotation={[0, 0, Math.PI / 2]}
                castShadow
              >
                <cylinderGeometry args={[0.045, 0.045, 1.0, 12]} />
                <meshStandardMaterial
                  color="#68757F"
                  metalness={0.9}
                  roughness={0.28}
                />
              </mesh>

              {/* Nut on upstream side */}
              <mesh position={[-0.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.085, 0.085, 0.12, 6]} />
                <meshStandardMaterial
                  color="#9CA9B1"
                  metalness={0.85}
                  roughness={0.3}
                />
              </mesh>

              {/* Nut on downstream side */}
              <mesh position={[0.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.085, 0.085, 0.12, 6]} />
                <meshStandardMaterial
                  color="#9CA9B1"
                  metalness={0.85}
                  roughness={0.3}
                />
              </mesh>
            </group>
          ))}
        </group>
      </FaultPulse>

      {/* =====================================================
          PHASE 7 — OPTIONAL DETAIL
          Additional low-level mechanical details.
      ====================================================== */}

      {!isLow && (
        <group position={[0, 2.0, 0]}>
          {/* Identification tag support */}
          <mesh position={[0, 0.9, 0.72]} rotation={[0.2, 0, 0]}>
            <boxGeometry args={[0.55, 0.28, 0.025]} />
            <meshStandardMaterial
              color="#AAB4BC"
              metalness={0.7}
              roughness={0.4}
            />
          </mesh>

          {/* Small tag mounting brackets */}
          {[-0.18, 0.18].map((x) => (
            <mesh key={x} position={[x, 0.72, 0.72]}>
              <boxGeometry args={[0.035, 0.16, 0.04]} />
              <meshStandardMaterial color={darkMetal} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}