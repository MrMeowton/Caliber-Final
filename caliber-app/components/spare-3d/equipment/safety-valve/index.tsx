import type { EquipmentProps, SlotDef } from "../../contract";
import { XRayShell, FaultPulse } from "../../core";

import Disc from "../../parts/disc";
import Gasket from "../../parts/gasket";
import Nozzle from "../../parts/nozzle";
import Spring from "../../parts/spring";
import Studbolt from "../../parts/studbolt";

export const SLOTS: SlotDef[] = [
  {
    id: "spring",
    part: "spring",
    name: "Set-pressure Spring",
    position: [0, 2.85, 0],
    scale: 1.25,
  },
  {
    id: "disc",
    part: "disc",
    name: "Valve Disc",
    position: [0, 1.75, 0],
    scale: 0.72,
  },
  {
    id: "nozzle",
    part: "nozzle",
    name: "Valve Nozzle",
    position: [0, 1.35, 0],
    scale: 0.95,
  },
  {
    id: "gasket",
    part: "gasket",
    name: "Inlet Gasket",
    position: [-0.85, 0.95, 0],
    rotation: [0, 0, Math.PI / 2],
    scale: 0.68,
  },
  {
    id: "studbolts",
    part: "studbolt",
    name: "Flange Studbolts",
    position: [-0.85, 0.95, 0],
    scale: 0.11,
  },
];

export default function SafetyValve({
  xray = false,
  explode = 0,
  faults = {},
  onShellClick,
  onPartClick,
  detail = "high",
}: EquipmentProps) {
  const low = detail === "low";

  const bodyColor = "#87949E";
  const bonnetColor = "#A4AFB7";
  const darkMetal = "#46535D";
  const polishedMetal = "#C3CDD3";
  const internalMetal = "#788791";

  const springSlot = SLOTS[0];
  const discSlot = SLOTS[1];
  const nozzleSlot = SLOTS[2];
  const gasketSlot = SLOTS[3];
  const boltSlot = SLOTS[4];

  const boltCount = 8;
  const boltRadius = 0.56;

  const boltPositions = Array.from({ length: boltCount }, (_, i) => {
    const angle = (i / boltCount) * Math.PI * 2;

    return [
      Math.cos(angle) * boltRadius,
      Math.sin(angle) * boltRadius,
      0,
    ] as [number, number, number];
  });

  return (
    <group>
      {/* =====================================================
          PHASE 1 — BASE AND SUPPORT
          Overall assembly height: 4 units.
          Base elevation: y = 0.
      ====================================================== */}

      <group position={[0, 0.12, 0]}>
        {/* Foundation plate */}
        <mesh castShadow receiveShadow position={[0, 0, 0]}>
          <boxGeometry args={[1.55, 0.2, 1.25]} />
          <meshStandardMaterial
            color={darkMetal}
            metalness={0.8}
            roughness={0.4}
          />
        </mesh>

        {/* Mounting feet */}
        {[-0.48, 0.48].map((x) => (
          <group key={x} position={[x, -0.14, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.2, 0.28, 0.85]} />
              <meshStandardMaterial
                color={bodyColor}
                metalness={0.75}
                roughness={0.4}
              />
            </mesh>

            <mesh position={[0, -0.16, 0]}>
              <boxGeometry args={[0.36, 0.06, 0.95]} />
              <meshStandardMaterial
                color={polishedMetal}
                metalness={0.85}
                roughness={0.3}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* =====================================================
          PHASE 2 — ANGLE VALVE BODY
          Inlet axis: +X.
          Outlet axis: +Y.
      ====================================================== */}

      <XRayShell
        active={xray}
        explode={[-0.25, 0, 0]}
        onClick={onShellClick}
      >
        <group position={[0, 1.05, 0]}>
          {/* Main pressure-containing body */}
          <mesh
            castShadow
            receiveShadow
            position={[0, 0.12, 0]}
            rotation={[0, 0, Math.PI / 4]}
          >
            <cylinderGeometry args={[0.48, 0.58, 1.05, 40]} />
            <meshStandardMaterial
              color={bodyColor}
              metalness={0.78}
              roughness={0.32}
            />
          </mesh>

          {/* Inlet horizontal connection */}
          <mesh
            castShadow
            position={[-0.48, -0.1, 0]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.36, 0.36, 0.75, 40]} />
            <meshStandardMaterial
              color={bodyColor}
              metalness={0.8}
              roughness={0.3}
            />
          </mesh>

          {/* Outlet vertical connection */}
          <mesh castShadow position={[0, 0.78, 0]}>
            <cylinderGeometry args={[0.34, 0.4, 0.8, 40]} />
            <meshStandardMaterial
              color={bodyColor}
              metalness={0.8}
              roughness={0.3}
            />
          </mesh>

          {/* Outlet flange */}
          <mesh position={[0, 1.2, 0]}>
            <cylinderGeometry args={[0.53, 0.53, 0.17, 40]} />
            <meshStandardMaterial
              color={polishedMetal}
              metalness={0.85}
              roughness={0.27}
            />
          </mesh>

          {/* Inlet flange */}
          <mesh
            position={[-0.92, -0.1, 0]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.62, 0.62, 0.17, 40]} />
            <meshStandardMaterial
              color={polishedMetal}
              metalness={0.85}
              roughness={0.27}
            />
          </mesh>

          {/* Inlet bore */}
          <mesh
            position={[-0.9, -0.1, 0]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.29, 0.29, 0.2, 32]} />
            <meshStandardMaterial color={darkMetal} />
          </mesh>
        </group>
      </XRayShell>

      {/* =====================================================
          PHASE 3 — BONNET
          Bonnet separates vertically to reveal the spring.
      ====================================================== */}

      <XRayShell
        active={xray}
        explode={[0, 0.65, 0]}
        onClick={onShellClick}
      >
        <group position={[0, 2.25, 0]}>
          {/* Bonnet lower collar */}
          <mesh castShadow receiveShadow position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.48, 0.48, 0.25, 40]} />
            <meshStandardMaterial
              color={bodyColor}
              metalness={0.82}
              roughness={0.3}
              transparent={xray}
              opacity={xray ? 0.18 : 1}
              depthWrite={!xray}
            />
          </mesh>

          {/* Main bonnet casing */}
          <mesh
            castShadow
            receiveShadow
            position={[0, 0.55, 0]}
          >
            <cylinderGeometry args={[0.39, 0.46, 0.9, 40]} />
            <meshStandardMaterial
              color={bonnetColor}
              metalness={0.78}
              roughness={0.32}
              transparent={xray}
              opacity={xray ? 0.12 : 1}
              depthWrite={!xray}
            />
          </mesh>

          {/* Bonnet top shoulder */}
          <mesh position={[0, 1.03, 0]}>
            <cylinderGeometry args={[0.45, 0.39, 0.15, 40]} />
            <meshStandardMaterial
              color={polishedMetal}
              metalness={0.85}
              roughness={0.28}
              transparent={xray}
              opacity={xray ? 0.15 : 1}
              depthWrite={!xray}
            />
          </mesh>

          {/* Bonnet perimeter bolts */}
          {!low &&
            Array.from({ length: 8 }, (_, i) => {
              const a = (i / 8) * Math.PI * 2;

              return (
                <mesh
                  key={i}
                  position={[
                    Math.cos(a) * 0.45,
                    0.12,
                    Math.sin(a) * 0.45,
                  ]}
                >
                  <cylinderGeometry args={[0.045, 0.045, 0.12, 6]} />
                  <meshStandardMaterial
                    color={darkMetal}
                    metalness={0.9}
                    roughness={0.25}
                  />
                </mesh>
              );
            })}
        </group>
      </XRayShell>

      {/* =====================================================
          PHASE 4 — ADJUSTING CAP
          Top cap protects spring adjustment mechanism.
      ====================================================== */}

      <XRayShell
        active={xray}
        explode={[0, 1.0, 0]}
        onClick={onShellClick}
      >
        <group position={[0, 3.38, 0]}>
          {/* Cap lower ring */}
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.31, 0.36, 0.18, 32]} />
            <meshStandardMaterial
              color={darkMetal}
              metalness={0.85}
              roughness={0.3}
            />
          </mesh>

          {/* Protective cap */}
          <mesh castShadow position={[0, 0.28, 0]}>
            <cylinderGeometry args={[0.29, 0.31, 0.36, 32]} />
            <meshStandardMaterial
              color={bodyColor}
              metalness={0.8}
              roughness={0.3}
            />
          </mesh>

          {/* Top cap surface */}
          <mesh position={[0, 0.47, 0]}>
            <cylinderGeometry args={[0.29, 0.29, 0.06, 32]} />
            <meshStandardMaterial
              color={polishedMetal}
              metalness={0.9}
              roughness={0.24}
            />
          </mesh>
        </group>
      </XRayShell>

      {/* =====================================================
          PHASE 5 — SET-PRESSURE SPRING
          Spring is located inside the bonnet.
      ====================================================== */}

      <FaultPulse
        active={Boolean(faults[springSlot.id])}
        position={springSlot.position}
        radius={0.45}
        label={
          faults[springSlot.id] && {
            title: springSlot.name,
            value: faults[springSlot.id].value,
          }
        }
        showLabel={xray}
        onClick={
          xray ? () => onPartClick?.(springSlot.id) : undefined
        }
      >
        <group
          position={[0, explode * 0.35, 0]}
          rotation={springSlot.rotation}
          scale={springSlot.scale}
        >
          <Spring
            highlight={Boolean(faults[springSlot.id])}
            detail={detail}
          />
        </group>
      </FaultPulse>

      {/* =====================================================
          PHASE 6 — VALVE DISC
          Disc sits directly above the nozzle seat.
      ====================================================== */}

      {!low && (
        <FaultPulse
          active={Boolean(faults[discSlot.id])}
          position={discSlot.position}
          radius={0.4}
          label={
            faults[discSlot.id] && {
              title: discSlot.name,
              value: faults[discSlot.id].value,
            }
          }
          showLabel={xray}
          onClick={
            xray ? () => onPartClick?.(discSlot.id) : undefined
          }
        >
          <group
            position={[0, explode * 0.5, 0]}
            rotation={discSlot.rotation}
            scale={discSlot.scale}
          >
            <Disc
              highlight={Boolean(faults[discSlot.id])}
              detail={detail}
            />
          </group>
        </FaultPulse>
      )}

      {/* =====================================================
          PHASE 7 — VALVE NOZZLE
          Inlet nozzle and seating surface.
      ====================================================== */}

      <FaultPulse
        active={Boolean(faults[nozzleSlot.id])}
        position={nozzleSlot.position}
        radius={0.4}
        label={
          faults[nozzleSlot.id] && {
            title: nozzleSlot.name,
            value: faults[nozzleSlot.id].value,
          }
        }
        showLabel={xray}
        onClick={
          xray ? () => onPartClick?.(nozzleSlot.id) : undefined
        }
      >
        <group
          position={[-explode * 0.25, 0, 0]}
          rotation={nozzleSlot.rotation}
          scale={nozzleSlot.scale}
        >
          <Nozzle
            highlight={Boolean(faults[nozzleSlot.id])}
            detail={detail}
          />
        </group>
      </FaultPulse>

      {/* =====================================================
          PHASE 8 — INLET GASKET
          Gasket seals the inlet flange connection.
      ====================================================== */}

      {!low && (
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
          <group
            position={[-explode * 0.3, 0, 0]}
            rotation={gasketSlot.rotation}
            scale={gasketSlot.scale}
          >
            <Gasket
              highlight={Boolean(faults[gasketSlot.id])}
              detail={detail}
            />
          </group>
        </FaultPulse>
      )}

      {/* =====================================================
          PHASE 9 — FLANGE STUD BOLTS
          Repeated fasteners around the inlet flange.
      ====================================================== */}

      {!low && (
        <FaultPulse
          active={Boolean(faults[boltSlot.id])}
          position={boltSlot.position}
          radius={0.55}
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
                  p[2] + explode * 0.3,
                ]}
              >
                <group
                  rotation={[0, 0, Math.PI / 2]}
                  scale={0.11}
                >
                  <Studbolt
                    highlight={Boolean(faults[boltSlot.id])}
                    detail={detail}
                  />
                </group>
              </group>
            ))}
          </group>
        </FaultPulse>
      )}

      {/* =====================================================
          PHASE 10 — EXTERNAL IDENTIFICATION DETAILS
      ====================================================== */}

      {!low && (
        <group position={[0, 1.0, 0.55]}>
          {/* Equipment identification plate */}
          <mesh position={[0, 0.15, 0]}>
            <boxGeometry args={[0.42, 0.28, 0.035]} />
            <meshStandardMaterial
              color="#C4CDD2"
              metalness={0.7}
              roughness={0.35}
            />
          </mesh>

          {/* Identification plate fasteners */}
          {[-0.16, 0.16].map((x) => (
            <mesh key={x} position={[x, 0.15, 0.025]}>
              <cylinderGeometry args={[0.018, 0.018, 0.015, 8]} />
              <meshStandardMaterial color={darkMetal} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}