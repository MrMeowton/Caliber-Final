import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group } from "three";

import type { EquipmentProps, SlotDef } from "../../contract";
import { XRayShell, FaultPulse } from "../../core";

import BearingBall from "../../parts/bearing-ball";
import BearingRoller from "../../parts/bearing-roller";
import Coupling from "../../parts/coupling";
import Fan from "../../parts/fan";
import Gasket from "../../parts/gasket";
import Impeller from "../../parts/impeller";
import Ring from "../../parts/ring";
import SealMechanical from "../../parts/seal-mechanical";
import Sleeve from "../../parts/sleeve";

/**
 * CENTRIFUGAL PUMP + MOTOR (PP)
 * Naphtha Cracker Process Equipment
 *
 * Approximate real dimensions: 3 x 1.5 x 1 m
 * Normalised dimensions: 4 x 2 x 1.33 units
 *
 * X = pump-to-motor axis
 * Y = vertical
 * Z = width
 * Base elevation = 0
 */

const C = {
  casing: "#71869A",
  casingDark: "#465B70",
  casingInner: "#26394B",
  motor: "#315A78",
  motorDark: "#203D56",
  steel: "#B5C2CE",
  shaft: "#D3DCE5",
  accent: "#D69A3A",
  dark: "#182B3A",
  base: "#293B4B",
  bolt: "#D1D9E1",
};

const SCALE = 4 / 3;
const SHAFT_Y = 0.9;
const SHAFT_Z = 0;

export const SLOTS: SlotDef[] = [
  {
    id: "impeller",
    part: "impeller",
    name: "Impeller",
    position: [-1.25, SHAFT_Y, SHAFT_Z],
    rotation: [0, 0, 0],
    scale: 0.8,
  },
  {
    id: "wear-ring",
    part: "ring",
    name: "Wear rings",
    position: [-1.32, SHAFT_Y, SHAFT_Z],
    rotation: [0, 0, 0],
    scale: 0.38,
  },
  {
    id: "shaft-sleeve",
    part: "sleeve",
    name: "Shaft sleeve",
    position: [-0.72, SHAFT_Y, SHAFT_Z],
    rotation: [0, 0, 0],
    scale: 0.52,
  },
  {
    id: "mech-seal",
    part: "seal-mechanical",
    name: "Mechanical seal",
    position: [-0.48, SHAFT_Y, SHAFT_Z],
    rotation: [0, 0, 0],
    scale: 0.48,
  },
  {
    id: "bearing-de",
    part: "bearing-ball",
    name: "Ball bearing",
    position: [0.15, SHAFT_Y, SHAFT_Z],
    rotation: [0, 0, 0],
    scale: 0.48,
  },
  {
    id: "bearing-roller",
    part: "bearing-roller",
    name: "Roller bearing",
    position: [0.72, SHAFT_Y, SHAFT_Z],
    rotation: [0, 0, 0],
    scale: 0.48,
  },
  {
    id: "coupling",
    part: "coupling",
    name: "Coupling",
    position: [1.12, SHAFT_Y, SHAFT_Z],
    rotation: [0, 0, 0],
    scale: 0.5,
  },
  {
    id: "motor-fan",
    part: "fan",
    name: "Motor cooling fan",
    position: [1.72, SHAFT_Y, SHAFT_Z],
    rotation: [0, 0, 0],
    scale: 0.65,
  },
  {
    id: "casing-gasket",
    part: "gasket",
    name: "Casing gasket",
    position: [-1.55, SHAFT_Y, SHAFT_Z],
    rotation: [0, 0, 0],
    scale: 0.95,
  },
];

function Material({
  color,
  metalness = 0.7,
  roughness = 0.35,
}: {
  color: string;
  metalness?: number;
  roughness?: number;
}) {
  return (
    <meshStandardMaterial
      color={color}
      metalness={metalness}
      roughness={roughness}
    />
  );
}

/* ============================================================
   PHASE 1 — BASE SKID
============================================================ */

function BaseSkid() {
  return (
    <group>
      {/* Longitudinal beams */}
      {[-0.4, 0.4].map((z) => (
        <mesh key={z} position={[0, 0.12, z]}>
          <boxGeometry args={[3.95, 0.2, 0.13]} />
          <Material color={C.base} />
        </mesh>
      ))}

      {/* Cross members */}
      {[-1.65, -0.8, 0, 0.8, 1.65].map((x) => (
        <mesh key={x} position={[x, 0.12, 0]}>
          <boxGeometry args={[0.13, 0.2, 0.95]} />
          <Material color={C.steel} />
        </mesh>
      ))}

      {/* Foundation mounting pads */}
      {[-1.7, 1.7].map((x) =>
        [-0.4, 0.4].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.035, z]}>
            <boxGeometry args={[0.38, 0.07, 0.3]} />
            <Material color={C.dark} />
          </mesh>
        )),
      )}

      {/* Pump mounting plate */}
      <mesh position={[-1.0, 0.26, 0]}>
        <boxGeometry args={[1.25, 0.1, 0.9]} />
        <Material color={C.steel} />
      </mesh>

      {/* Motor mounting plate */}
      <mesh position={[0.9, 0.26, 0]}>
        <boxGeometry args={[1.8, 0.1, 0.9]} />
        <Material color={C.steel} />
      </mesh>

      {/* Anchor bolts */}
      {[-1.6, -0.5, 0.5, 1.6].map((x) =>
        [-0.38, 0.38].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.33, z]}>
            <cylinderGeometry args={[0.035, 0.035, 0.12, 8]} />
            <Material color={C.bolt} metalness={0.9} />
          </mesh>
        )),
      )}
    </group>
  );
}

/* ============================================================
   PHASE 2 — VOLUTE CASING
============================================================ */

function VoluteLower() {
  return (
    <group>
      {/* Main volute body */}
      <mesh position={[-1.3, 0.94, 0]}>
        <cylinderGeometry args={[0.72, 0.72, 0.55, 48]} />
        <meshStandardMaterial
          color={C.casing}
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>

      {/* Lower casing transition */}
      <mesh position={[-1.3, 0.78, 0]}>
        <cylinderGeometry args={[0.65, 0.7, 0.25, 48]} />
        <Material color={C.casingDark} />
      </mesh>

      {/* Discharge nozzle */}
      <mesh position={[-1.3, 1.42, 0]}>
        <cylinderGeometry args={[0.22, 0.28, 0.42, 32]} />
        <Material color={C.casing} />
      </mesh>

      {/* Discharge flange */}
      <mesh position={[-1.3, 1.65, 0]}>
        <cylinderGeometry args={[0.32, 0.32, 0.09, 32]} />
        <Material color={C.steel} />
      </mesh>

      {/* Axial suction nozzle */}
      <mesh
        position={[-1.73, 0.94, 0]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <cylinderGeometry args={[0.3, 0.3, 0.48, 32]} />
        <Material color={C.casing} />
      </mesh>

      {/* Suction flange */}
      <mesh
        position={[-1.99, 0.94, 0]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <cylinderGeometry args={[0.38, 0.38, 0.09, 32]} />
        <Material color={C.steel} />
      </mesh>

      {/* Casing support feet */}
      {[-1.65, -0.85].map((x) => (
        <mesh key={x} position={[x, 0.55, 0]}>
          <boxGeometry args={[0.24, 0.3, 0.7]} />
          <Material color={C.casingDark} />
        </mesh>
      ))}
    </group>
  );
}

function VoluteFrontCover() {
  return (
    <group>
      {/* Front cover */}
      <mesh
        position={[-1.3, 0.94, 0.39]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[0.73, 0.73, 0.13, 48]} />
        <Material color={C.casing} metalness={0.8} />
      </mesh>

      {/* Central eye flange */}
      <mesh
        position={[-1.3, 0.94, 0.48]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[0.34, 0.34, 0.1, 32]} />
        <Material color={C.steel} />
      </mesh>

      {/* Cover bolts */}
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;

        return (
          <mesh
            key={i}
            position={[
              -1.3 + Math.cos(a) * 0.62,
              0.94 + Math.sin(a) * 0.62,
              0.48,
            ]}
          >
            <cylinderGeometry args={[0.035, 0.035, 0.08, 8]} />
            <Material color={C.bolt} metalness={0.9} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ============================================================
   PHASE 3 — BEARING HOUSING
============================================================ */

function BearingHousing() {
  return (
    <group>
      {/* Main bearing housing */}
      <mesh position={[0.25, 0.91, 0]}>
        <boxGeometry args={[1.0, 0.68, 0.65]} />
        <Material color={C.casingDark} metalness={0.8} />
      </mesh>

      {/* Upper bearing cover */}
      <mesh position={[0.25, 1.29, 0]}>
        <boxGeometry args={[0.85, 0.12, 0.58]} />
        <Material color={C.steel} />
      </mesh>

      {/* Housing end caps */}
      {[-0.27, 0.77].map((x) => (
        <mesh key={x} position={[x, 0.91, 0]}>
          <cylinderGeometry args={[0.29, 0.29, 0.12, 32]} />
          <Material color={C.casing} metalness={0.85} />
        </mesh>
      ))}

      {/* Oil inspection plug */}
      <mesh position={[0.25, 1.37, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.07, 16]} />
        <Material color={C.accent} />
      </mesh>

      {/* Housing feet */}
      {[-0.12, 0.62].map((x) => (
        <mesh key={x} position={[x, 0.51, 0]}>
          <boxGeometry args={[0.25, 0.18, 0.72]} />
          <Material color={C.steel} />
        </mesh>
      ))}
    </group>
  );
}

/* ============================================================
   PHASE 4 — ELECTRIC MOTOR
============================================================ */

function MotorShell() {
  return (
    <group>
      {/* Stator housing */}
      <mesh position={[1.13, 0.94, 0]}>
        <cylinderGeometry args={[0.52, 0.52, 1.42, 40]} />
        <meshStandardMaterial
          color={C.motor}
          metalness={0.65}
          roughness={0.35}
        />
      </mesh>

      {/* Motor cooling fins */}
      {Array.from({ length: 13 }, (_, i) => (
        <mesh key={i} position={[0.48 + i * 0.105, 0.94, 0]}>
          <cylinderGeometry args={[0.55, 0.55, 0.035, 32]} />
          <Material color={C.motorDark} />
        </mesh>
      ))}

      {/* Terminal box */}
      <mesh position={[1.15, 1.53, 0]}>
        <boxGeometry args={[0.65, 0.2, 0.48]} />
        <Material color={C.motorDark} />
      </mesh>

      {/* Terminal box lid */}
      <mesh position={[1.15, 1.65, 0]}>
        <boxGeometry args={[0.68, 0.05, 0.51]} />
        <Material color={C.steel} />
      </mesh>

      {/* Motor feet */}
      {[-0.1, 0.95].map((x) => (
        <mesh key={x} position={[x, 0.52, 0]}>
          <boxGeometry args={[0.34, 0.2, 0.85]} />
          <Material color={C.motorDark} />
        </mesh>
      ))}
    </group>
  );
}

function MotorFanCover() {
  return (
    <group>
      {/* Fan protection cover */}
      <mesh
        position={[1.91, 0.94, 0]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <cylinderGeometry args={[0.48, 0.48, 0.19, 32]} />
        <Material color={C.motorDark} metalness={0.8} />
      </mesh>

      {/* Ventilation grille */}
      <mesh
        position={[2.02, 0.94, 0]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <cylinderGeometry args={[0.38, 0.38, 0.035, 32]} />
        <Material color={C.steel} metalness={0.85} />
      </mesh>

      {/* Radial grille supports */}
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;

        return (
          <mesh
            key={i}
            position={[
              2.045,
              0.94 + Math.cos(a) * 0.22,
              Math.sin(a) * 0.22,
            ]}
            rotation={[a, 0, 0]}
          >
            <boxGeometry args={[0.035, 0.4, 0.025]} />
            <Material color={C.motorDark} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ============================================================
   PHASE 5 — MAIN SHAFT
============================================================ */

function Shaft({ rotatingRef }: { rotatingRef: React.RefObject<Group | null> }) {
  return (
    <group ref={rotatingRef} position={[0, SHAFT_Y, SHAFT_Z]}>
      {/* Main shaft */}
      <mesh
        position={[0.05, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <cylinderGeometry args={[0.085, 0.085, 3.65, 24]} />
        <Material color={C.shaft} metalness={0.95} roughness={0.2} />
      </mesh>

      {/* Shaft collars */}
      {[-1.45, -0.85, 0.15, 0.75, 1.35].map((x) => (
        <mesh
          key={x}
          position={[x, 0, 0]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.13, 0.13, 0.08, 24]} />
          <Material color={C.steel} metalness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

/* ============================================================
   PHASE 6 — AUXILIARY DETAILS
============================================================ */

function AuxiliaryDetails() {
  return (
    <group>
      {/* Lubrication pipe */}
      <mesh position={[0.25, 0.48, 0.42]}>
        <cylinderGeometry args={[0.025, 0.025, 0.48, 12]} />
        <Material color={C.accent} />
      </mesh>

      {/* Bearing drain plug */}
      <mesh position={[0.25, 0.53, 0.36]}>
        <cylinderGeometry args={[0.055, 0.055, 0.09, 12]} />
        <Material color={C.steel} />
      </mesh>

      {/* Motor nameplate */}
      <mesh position={[1.12, 1.1, 0.51]}>
        <boxGeometry args={[0.38, 0.2, 0.025]} />
        <Material color={C.steel} metalness={0.6} />
      </mesh>
    </group>
  );
}

/* ============================================================
   PHASE 7 — MAIN EQUIPMENT ASSEMBLY
============================================================ */

export default function CentrifugalPump({
  xray = false,
  explode = 0,
  faults = {},
  onShellClick,
  onPartClick,
  detail = "high",
}: EquipmentProps) {
  // One rotating group for the shaft and impeller.
  const rotatingRef = useRef<Group>(null);

  useFrame((_, delta) => {
    if (detail === "high" && rotatingRef.current) {
      rotatingRef.current.rotation.x += delta * 0.2;
    }
  });

  const partProps = (id: string) => ({
    highlight: Boolean(faults[id]),
    detail,
  });

  const s = SLOTS;

  return (
    <group scale={SCALE}>
      {/* =====================================================
          7.1 BASE SKID — ALWAYS SOLID
      ===================================================== */}

      <BaseSkid />

      {/* =====================================================
          7.2 VOLUTE CASING
      ===================================================== */}

      <XRayShell
        active={xray}
        explode={[0, 0, 0]}
        onClick={onShellClick}
      >
        <VoluteLower />
      </XRayShell>

      {/* Front cover moves forward along Z */}
      {detail !== "low" && (
        <XRayShell
          active={xray}
          explode={[0, 0, 1.2]}
          onClick={onShellClick}
        >
          <VoluteFrontCover />
        </XRayShell>
      )}

      {/* =====================================================
          7.3 BEARING HOUSING
      ===================================================== */}

      <XRayShell
        active={xray}
        explode={[0, 0.3, 0]}
        onClick={onShellClick}
      >
        <BearingHousing />
      </XRayShell>

      {/* =====================================================
          7.4 ELECTRIC MOTOR
      ===================================================== */}

      <XRayShell
        active={xray}
        explode={[0, 0, 0]}
        onClick={onShellClick}
      >
        <MotorShell />
      </XRayShell>

      <XRayShell
        active={xray}
        explode={[0.35, 0, 0]}
        onClick={onShellClick}
      >
        <MotorFanCover />
      </XRayShell>

      {/* =====================================================
          7.5 MAIN SHAFT
      ===================================================== */}

      {detail !== "low" && <Shaft rotatingRef={rotatingRef} />}

      {/* =====================================================
          7.6 IMPELLER
      ===================================================== */}

      <FaultPulse
        active={Boolean(faults[s[0].id])}
        position={s[0].position}
        radius={0.48}
        label={
          faults[s[0].id] && {
            title: s[0].name,
            value: faults[s[0].id].value,
          }
        }
        showLabel={xray}
        onClick={xray ? () => onPartClick?.(s[0].id) : undefined}
      >
        <group
          position={[-explode * 0.3, 0, 0]}
          rotation={s[0].rotation}
          scale={s[0].scale}
          ref={detail === "high" ? rotatingRef : undefined}
        >
          <Impeller {...partProps(s[0].id)} />
        </group>
      </FaultPulse>

      {/* =====================================================
          7.7 WEAR RINGS — TWO REPEATED COMPONENTS
      ===================================================== */}

      {detail !== "low" && (
        <FaultPulse
          active={Boolean(faults[s[1].id])}
          position={s[1].position}
          radius={0.35}
          label={
            faults[s[1].id] && {
              title: s[1].name,
              value: faults[s[1].id].value,
            }
          }
          showLabel={xray}
          onClick={xray ? () => onPartClick?.(s[1].id) : undefined}
        >
          {[-0.23, 0.23].map((offset, i) => (
            <group
              key={i}
              position={[offset + (offset < 0 ? -explode : explode) * 0.18, 0, 0]}
              rotation={s[1].rotation}
              scale={s[1].scale}
            >
              <Ring {...partProps(s[1].id)} />
            </group>
          ))}
        </FaultPulse>
      )}

      {/* =====================================================
          7.8 SHAFT SLEEVE
      ===================================================== */}

      {detail !== "low" && (
        <FaultPulse
          active={Boolean(faults[s[2].id])}
          position={s[2].position}
          radius={0.3}
          label={
            faults[s[2].id] && {
              title: s[2].name,
              value: faults[s[2].id].value,
            }
          }
          showLabel={xray}
          onClick={xray ? () => onPartClick?.(s[2].id) : undefined}
        >
          <group
            position={[-explode * 0.15, 0, 0]}
            rotation={s[2].rotation}
            scale={s[2].scale}
          >
            <Sleeve {...partProps(s[2].id)} />
          </group>
        </FaultPulse>
      )}

      {/* =====================================================
          7.9 MECHANICAL SEAL
      ===================================================== */}

      {detail !== "low" && (
        <FaultPulse
          active={Boolean(faults[s[3].id])}
          position={s[3].position}
          radius={0.35}
          label={
            faults[s[3].id] && {
              title: s[3].name,
              value: faults[s[3].id].value,
            }
          }
          showLabel={xray}
          onClick={xray ? () => onPartClick?.(s[3].id) : undefined}
        >
          <group
            position={[-explode * 0.2, 0, 0]}
            rotation={s[3].rotation}
            scale={s[3].scale}
          >
            <SealMechanical {...partProps(s[3].id)} />
          </group>
        </FaultPulse>
      )}

      {/* =====================================================
          7.10 BALL BEARING — DE
      ===================================================== */}

      {detail !== "low" && (
        <FaultPulse
          active={Boolean(faults[s[4].id])}
          position={s[4].position}
          radius={0.35}
          label={
            faults[s[4].id] && {
              title: s[4].name,
              value: faults[s[4].id].value,
            }
          }
          showLabel={xray}
          onClick={xray ? () => onPartClick?.(s[4].id) : undefined}
        >
          <group
            position={[explode * 0.18, 0, 0]}
            rotation={s[4].rotation}
            scale={s[4].scale}
          >
            <BearingBall {...partProps(s[4].id)} />
          </group>
        </FaultPulse>
      )}

      {/* =====================================================
          7.11 ROLLER BEARING
      ===================================================== */}

      {detail !== "low" && (
        <FaultPulse
          active={Boolean(faults[s[5].id])}
          position={s[5].position}
          radius={0.35}
          label={
            faults[s[5].id] && {
              title: s[5].name,
              value: faults[s[5].id].value,
            }
          }
          showLabel={xray}
          onClick={xray ? () => onPartClick?.(s[5].id) : undefined}
        >
          <group
            position={[explode * 0.18, 0, 0]}
            rotation={s[5].rotation}
            scale={s[5].scale}
          >
            <BearingRoller {...partProps(s[5].id)} />
          </group>
        </FaultPulse>
      )}

      {/* =====================================================
          7.12 COUPLING
      ===================================================== */}

      {detail !== "low" && (
        <FaultPulse
          active={Boolean(faults[s[6].id])}
          position={s[6].position}
          radius={0.4}
          label={
            faults[s[6].id] && {
              title: s[6].name,
              value: faults[s[6].id].value,
            }
          }
          showLabel={xray}
          onClick={xray ? () => onPartClick?.(s[6].id) : undefined}
        >
          <group
            position={[explode * 0.25, 0, 0]}
            rotation={s[6].rotation}
            scale={s[6].scale}
          >
            <Coupling {...partProps(s[6].id)} />
          </group>
        </FaultPulse>
      )}

      {/* =====================================================
          7.13 MOTOR COOLING FAN
      ===================================================== */}

      {detail !== "low" && (
        <FaultPulse
          active={Boolean(faults[s[7].id])}
          position={s[7].position}
          radius={0.42}
          label={
            faults[s[7].id] && {
              title: s[7].name,
              value: faults[s[7].id].value,
            }
          }
          showLabel={xray}
          onClick={xray ? () => onPartClick?.(s[7].id) : undefined}
        >
          <group
            position={[explode * 0.35, 0, 0]}
            rotation={s[7].rotation}
            scale={s[7].scale}
          >
            <Fan {...partProps(s[7].id)} />
          </group>
        </FaultPulse>
      )}

      {/* =====================================================
          7.14 CASING GASKET
      ===================================================== */}

      {detail !== "low" && (
        <FaultPulse
          active={Boolean(faults[s[8].id])}
          position={s[8].position}
          radius={0.75}
          label={
            faults[s[8].id] && {
              title: s[8].name,
              value: faults[s[8].id].value,
            }
          }
          showLabel={xray}
          onClick={xray ? () => onPartClick?.(s[8].id) : undefined}
        >
          <group
            position={[0, 0, 0.65 + explode * 0.5]}
            rotation={s[8].rotation}
            scale={s[8].scale}
          >
            <Gasket {...partProps(s[8].id)} />
          </group>
        </FaultPulse>
      )}

      {/* =====================================================
          7.15 LOW DETAIL — KEY COMPONENTS
      ===================================================== */}

      {detail === "low" && (
        <>
          <FaultPulse
            active={Boolean(faults[s[0].id])}
            position={s[0].position}
            radius={0.48}
            label={
              faults[s[0].id] && {
                title: s[0].name,
                value: faults[s[0].id].value,
              }
            }
            showLabel={xray}
            onClick={xray ? () => onPartClick?.(s[0].id) : undefined}
          >
            <group scale={s[0].scale}>
              <Impeller {...partProps(s[0].id)} />
            </group>
          </FaultPulse>

          <FaultPulse
            active={Boolean(faults[s[6].id])}
            position={s[6].position}
            radius={0.4}
            label={
              faults[s[6].id] && {
                title: s[6].name,
                value: faults[s[6].id].value,
              }
            }
            showLabel={xray}
            onClick={xray ? () => onPartClick?.(s[6].id) : undefined}
          >
            <group scale={s[6].scale}>
              <Coupling {...partProps(s[6].id)} />
            </group>
          </FaultPulse>
        </>
      )}

      {/* =====================================================
          7.16 AUXILIARY DETAILS
      ===================================================== */}

      {detail === "high" && <AuxiliaryDetails />}
    </group>
  );
}