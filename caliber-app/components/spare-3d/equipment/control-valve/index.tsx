import type { EquipmentProps, SlotDef } from "../../contract";
import { XRayShell, FaultPulse } from "../../core";

import Diaphragm from "../../parts/diaphragm";
import Gasket from "../../parts/gasket";
import PackingSet from "../../parts/packing-set";
import Positioner from "../../parts/positioner";
import SeatRing from "../../parts/seat-ring";
import Spring from "../../parts/spring";
import Studbolt from "../../parts/studbolt";
import TrimSet from "../../parts/trim-set";

/**
 * CONTROL VALVE (FCV / LCV / PCV / TCV)
 * Naphtha Cracker Process Equipment
 *
 * Approximate real dimensions: 0.8 x 1.4 x 0.6 m
 * Normalised dimensions: 2.29 x 4 x 1.71 units
 *
 * X = pipeline axis
 * Y = vertical axis / actuator stem
 * Z = valve body depth
 * Base elevation = 0
 *
 * Main assembly:
 * - Globe valve body
 * - Bonnet and stem
 * - Diaphragm actuator
 * - Spring and positioner
 */

const C = {
  body: "#71869A",
  bodyDark: "#465B70",
  bodyInner: "#293C4E",
  bonnet: "#899BAA",
  actuator: "#315A78",
  actuatorDark: "#203D56",
  steel: "#B8C5D0",
  stem: "#D3DCE5",
  accent: "#D6A04B",
  gasket: "#343B43",
  bolt: "#D6DEE6",
  base: "#293B4B",
  nozzle: "#8197AA",
};

const PIPE_AXIS = 0;
const BODY_Y = 0.85;
const ACTUATOR_Y = 2.85;

export const SLOTS: SlotDef[] = [
  {
    id: "trim",
    part: "trim-set",
    name: "Trim set (cage/plug)",
    position: [0, 0.85, 0],
    rotation: [0, 0, 0],
    scale: 0.85,
  },
  {
    id: "seat",
    part: "seat-ring",
    name: "Seat ring",
    position: [0, 0.68, 0],
    rotation: [0, 0, 0],
    scale: 0.48,
  },
  {
    id: "packing",
    part: "packing-set",
    name: "Stem packing",
    position: [0, 1.48, 0],
    rotation: [0, 0, 0],
    scale: 0.4,
  },
  {
    id: "diaphragm",
    part: "diaphragm",
    name: "Actuator diaphragm",
    position: [0, 2.85, 0],
    rotation: [0, 0, 0],
    scale: 0.9,
  },
  {
    id: "spring",
    part: "spring",
    name: "Actuator spring",
    position: [0, 3.25, 0],
    rotation: [0, 0, 0],
    scale: 0.62,
  },
  {
    id: "positioner",
    part: "positioner",
    name: "Positioner",
    position: [0.58, 2.55, 0],
    rotation: [0, 0, 0],
    scale: 0.55,
  },
  {
    id: "gasket",
    part: "gasket",
    name: "Body gasket",
    position: [0, 1.35, 0],
    rotation: [0, 0, 0],
    scale: 0.5,
  },
  {
    id: "studbolts",
    part: "studbolt",
    name: "Body studbolts",
    position: [0, 1.35, 0],
    rotation: [0, 0, 0],
    scale: 0.16,
  },
];

/* ============================================================
   PHASE 1 — MATERIALS
============================================================ */

function Metal({
  color,
  metalness = 0.72,
  roughness = 0.34,
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
   PHASE 2 — BASE AND PIPE SUPPORTS
============================================================ */

function BaseStructure() {
  return (
    <group>
      {/* Valve support base */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[1.2, 0.16, 0.85]} />
        <Metal color={C.base} />
      </mesh>

      {/* Mounting plate */}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[1.0, 0.08, 0.72]} />
        <Metal color={C.steel} />
      </mesh>

      {/* Support ribs */}
      {[-0.35, 0.35].map((x) => (
        <mesh key={x} position={[x, 0.38, 0]}>
          <boxGeometry args={[0.09, 0.32, 0.5]} />
          <Metal color={C.bodyDark} />
        </mesh>
      ))}

      {/* Foundation bolts */}
      {[-0.45, 0.45].map((x) =>
        [-0.28, 0.28].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.23, z]}>
            <cylinderGeometry args={[0.025, 0.025, 0.1, 8]} />
            <Metal color={C.bolt} metalness={0.9} />
          </mesh>
        )),
      )}
    </group>
  );
}

/* ============================================================
   PHASE 3 — GLOBE VALVE BODY
============================================================ */

function GlobeBody() {
  return (
    <group>
      {/* Main spherical globe chamber */}
      <mesh position={[0, BODY_Y, 0]}>
        <sphereGeometry args={[0.66, 40, 32]} />
        <Metal color={C.body} metalness={0.8} />
      </mesh>

      {/* Lower body transition */}
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.35, 0.43, 0.48, 32]} />
        <Metal color={C.bodyDark} />
      </mesh>

      {/* Left pipeline connection */}
      <mesh
        position={[-0.75, BODY_Y, 0]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <cylinderGeometry args={[0.27, 0.27, 0.72, 32]} />
        <Metal color={C.body} />
      </mesh>

      {/* Right pipeline connection */}
      <mesh
        position={[0.75, BODY_Y, 0]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <cylinderGeometry args={[0.27, 0.27, 0.72, 32]} />
        <Metal color={C.body} />
      </mesh>

      {/* Left flange */}
      <mesh
        position={[-1.13, BODY_Y, 0]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <cylinderGeometry args={[0.38, 0.38, 0.12, 32]} />
        <Metal color={C.steel} />
      </mesh>

      {/* Right flange */}
      <mesh
        position={[1.13, BODY_Y, 0]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <cylinderGeometry args={[0.38, 0.38, 0.12, 32]} />
        <Metal color={C.steel} />
      </mesh>

      {/* Body lower flange */}
      <mesh position={[0, 1.34, 0]}>
        <cylinderGeometry args={[0.37, 0.37, 0.12, 32]} />
        <Metal color={C.steel} />
      </mesh>

      {/* Body reinforcing ribs */}
      {[-0.45, 0.45].map((x) => (
        <mesh key={x} position={[x, 0.85, 0.52]}>
          <boxGeometry args={[0.09, 0.5, 0.07]} />
          <Metal color={C.bodyDark} />
        </mesh>
      ))}
    </group>
  );
}

/* ============================================================
   PHASE 4 — BONNET AND STEM HOUSING
============================================================ */

function Bonnet() {
  return (
    <group>
      {/* Bonnet neck */}
      <mesh position={[0, 1.53, 0]}>
        <cylinderGeometry args={[0.25, 0.32, 0.42, 32]} />
        <Metal color={C.bonnet} />
      </mesh>

      {/* Bonnet flange */}
      <mesh position={[0, 1.35, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.12, 32]} />
        <Metal color={C.steel} />
      </mesh>

      {/* Packing chamber */}
      <mesh position={[0, 1.76, 0]}>
        <cylinderGeometry args={[0.19, 0.19, 0.24, 24]} />
        <Metal color={C.bodyDark} />
      </mesh>

      {/* Stem guide */}
      <mesh position={[0, 1.95, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.22, 24]} />
        <Metal color={C.steel} />
      </mesh>

      {/* Exposed valve stem */}
      <mesh position={[0, 2.25, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.55, 16]} />
        <Metal color={C.stem} metalness={0.95} roughness={0.2} />
      </mesh>

      {/* Bonnet cap */}
      <mesh position={[0, 2.0, 0]}>
        <cylinderGeometry args={[0.23, 0.23, 0.08, 24]} />
        <Metal color={C.bonnet} />
      </mesh>
    </group>
  );
}

/* ============================================================
   PHASE 5 — DIAPHRAGM ACTUATOR HOUSING
============================================================ */

function ActuatorLowerHousing() {
  return (
    <group>
      {/* Actuator yoke */}
      <mesh position={[0, 2.38, 0]}>
        <boxGeometry args={[0.22, 0.52, 0.22]} />
        <Metal color={C.actuatorDark} />
      </mesh>

      {/* Yoke side arms */}
      {[-0.32, 0.32].map((x) => (
        <mesh key={x} position={[x, 2.55, 0]}>
          <boxGeometry args={[0.1, 0.5, 0.12]} />
          <Metal color={C.actuator} />
        </mesh>
      ))}

      {/* Lower actuator diaphragm chamber */}
      <mesh position={[0, 2.72, 0]}>
        <cylinderGeometry args={[0.56, 0.56, 0.22, 40]} />
        <Metal color={C.actuator} />
      </mesh>

      {/* Lower housing rim */}
      <mesh position={[0, 2.82, 0]}>
        <torusGeometry args={[0.54, 0.035, 8, 48]} />
        <Metal color={C.steel} />
      </mesh>

      {/* Air supply connection */}
      <mesh position={[0.53, 2.72, 0]}>
        <cylinderGeometry args={[0.065, 0.065, 0.18, 16]} />
        <Metal color={C.nozzle} />
      </mesh>
    </group>
  );
}

function ActuatorUpperHousing() {
  return (
    <group>
      {/* Upper diaphragm chamber */}
      <mesh position={[0, 3.02, 0]}>
        <cylinderGeometry args={[0.56, 0.56, 0.22, 40]} />
        <Metal color={C.actuator} />
      </mesh>

      {/* Upper chamber dome */}
      <mesh position={[0, 3.14, 0]}>
        <sphereGeometry
          args={[0.56, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2]}
        />
        <Metal color={C.actuator} />
      </mesh>

      {/* Upper chamber reinforcement rim */}
      <mesh position={[0, 2.92, 0]}>
        <torusGeometry args={[0.56, 0.035, 8, 48]} />
        <Metal color={C.steel} />
      </mesh>

      {/* Actuator top vent */}
      <mesh position={[0, 3.58, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.12, 16]} />
        <Metal color={C.steel} />
      </mesh>

      {/* Actuator top cap */}
      <mesh position={[0, 3.66, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.06, 24]} />
        <Metal color={C.steel} />
      </mesh>

      {/* Housing perimeter bolts */}
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;

        return (
          <mesh
            key={i}
            position={[
              Math.cos(a) * 0.55,
              2.92,
              Math.sin(a) * 0.55,
            ]}
          >
            <cylinderGeometry args={[0.025, 0.025, 0.08, 8]} />
            <Metal color={C.bolt} metalness={0.9} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ============================================================
   PHASE 6 — POSITIONER SUPPORT AND CONNECTIONS
============================================================ */

function PositionerMount() {
  return (
    <group>
      {/* Positioner mounting bracket */}
      <mesh position={[0.56, 2.53, 0]}>
        <boxGeometry args={[0.12, 0.45, 0.12]} />
        <Metal color={C.steel} />
      </mesh>

      {/* Positioner linkage */}
      <mesh position={[0.35, 2.55, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.35, 12]} />
        <Metal color={C.stem} />
      </mesh>

      {/* Pneumatic tubing */}
      <mesh
        position={[0.42, 2.78, 0.08]}
        rotation={[0, 0, Math.PI / 4]}
      >
        <cylinderGeometry args={[0.018, 0.018, 0.32, 10]} />
        <Metal color={C.accent} />
      </mesh>
    </group>
  );
}

/* ============================================================
   PHASE 7 — FLANGE BOLTS AND EXTERNAL DETAILS
============================================================ */

function ExternalDetails() {
  return (
    <group>
      {/* Pipeline flange bolts */}
      {[-1, 1].map((side) =>
        Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;

          return (
            <mesh
              key={`${side}-${i}`}
              position={[
                side * 1.13,
                BODY_Y + Math.cos(a) * 0.31,
                Math.sin(a) * 0.31,
              ]}
              rotation={[0, 0, Math.PI / 2]}
            >
              <cylinderGeometry args={[0.025, 0.025, 0.16, 8]} />
              <Metal color={C.bolt} metalness={0.9} />
            </mesh>
          );
        }),
      )}

      {/* Valve identification plate */}
      <mesh position={[0.2, 0.82, 0.62]}>
        <boxGeometry args={[0.25, 0.16, 0.025]} />
        <Metal color={C.steel} metalness={0.65} />
      </mesh>

      {/* Positioner air connection */}
      <mesh position={[0.75, 2.55, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.12, 12]} />
        <Metal color={C.accent} />
      </mesh>
    </group>
  );
}

/* ============================================================
   PHASE 8 — CONTROL VALVE ASSEMBLY
============================================================ */

export default function ControlValve({
  xray = false,
  explode = 0,
  faults = {},
  onShellClick,
  onPartClick,
  detail = "high",
}: EquipmentProps) {
  const s = SLOTS;

  const partProps = (id: string) => ({
    highlight: Boolean(faults[id]),
    detail,
  });

  return (
    <group>
      {/* ======================================================
          8.1 BASE STRUCTURE — ALWAYS SOLID
      ====================================================== */}

      <BaseStructure />

      {/* ======================================================
          8.2 GLOBE VALVE BODY
      ====================================================== */}

      <XRayShell
        active={xray}
        explode={[0, 0, 0]}
        onClick={onShellClick}
      >
        <GlobeBody />
      </XRayShell>

      {/* ======================================================
          8.3 BONNET
      ====================================================== */}

      <XRayShell
        active={xray}
        explode={[0, 0.35 * explode, 0]}
        onClick={onShellClick}
      >
        <Bonnet />
      </XRayShell>

      {/* ======================================================
          8.4 ACTUATOR LOWER HOUSING
      ====================================================== */}

      <XRayShell
        active={xray}
        explode={[0, 0, 0]}
        onClick={onShellClick}
      >
        <ActuatorLowerHousing />
      </XRayShell>

      {/* ======================================================
          8.5 ACTUATOR UPPER HOUSING
          Splits vertically during X-ray
      ====================================================== */}

      <XRayShell
        active={xray}
        explode={[0, 1.2, 0]}
        onClick={onShellClick}
      >
        <ActuatorUpperHousing />
      </XRayShell>

      {/* ======================================================
          8.6 POSITIONER MOUNT AND EXTERNAL DETAILS
      ====================================================== */}

      <XRayShell
        active={xray}
        explode={[0.2 * explode, 0, 0]}
        onClick={onShellClick}
      >
        <PositionerMount />
        <ExternalDetails />
      </XRayShell>

      {/* ======================================================
          8.7 TRIM SET — CAGE AND PLUG
      ====================================================== */}

      <FaultPulse
        active={Boolean(faults[s[0].id])}
        position={s[0].position}
        radius={0.4}
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
          position={[0, -explode * 0.3, 0]}
          rotation={s[0].rotation}
          scale={s[0].scale}
        >
          <TrimSet {...partProps(s[0].id)} />
        </group>
      </FaultPulse>

      {/* ======================================================
          8.8 SEAT RING
      ====================================================== */}

      <FaultPulse
        active={Boolean(faults[s[1].id])}
        position={s[1].position}
        radius={0.3}
        label={
          faults[s[1].id] && {
            title: s[1].name,
            value: faults[s[1].id].value,
          }
        }
        showLabel={xray}
        onClick={xray ? () => onPartClick?.(s[1].id) : undefined}
      >
        <group
          position={[0, -explode * 0.18, 0]}
          rotation={s[1].rotation}
          scale={s[1].scale}
        >
          <SeatRing {...partProps(s[1].id)} />
        </group>
      </FaultPulse>

      {/* ======================================================
          8.9 STEM PACKING
      ====================================================== */}

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
          position={[0, explode * 0.2, 0]}
          rotation={s[2].rotation}
          scale={s[2].scale}
        >
          <PackingSet {...partProps(s[2].id)} />
        </group>
      </FaultPulse>

      {/* ======================================================
          8.10 ACTUATOR DIAPHRAGM
      ====================================================== */}

      <FaultPulse
        active={Boolean(faults[s[3].id])}
        position={s[3].position}
        radius={0.45}
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
          position={[0, explode * 0.25, 0]}
          rotation={s[3].rotation}
          scale={s[3].scale}
        >
          <Diaphragm {...partProps(s[3].id)} />
        </group>
      </FaultPulse>

      {/* ======================================================
          8.11 ACTUATOR SPRING
      ====================================================== */}

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
          position={[0, explode * 0.4, 0]}
          rotation={s[4].rotation}
          scale={s[4].scale}
        >
          <Spring {...partProps(s[4].id)} />
        </group>
      </FaultPulse>

      {/* ======================================================
          8.12 POSITIONER
      ====================================================== */}

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
          position={[explode * 0.3, 0, 0]}
          rotation={s[5].rotation}
          scale={s[5].scale}
        >
          <Positioner {...partProps(s[5].id)} />
        </group>
      </FaultPulse>

      {/* ======================================================
          8.13 BODY GASKET
      ====================================================== */}

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
          position={[0, explode * 0.15, 0]}
          rotation={s[6].rotation}
          scale={s[6].scale}
        >
          <Gasket {...partProps(s[6].id)} />
        </group>
      </FaultPulse>

      {/* ======================================================
          8.14 BODY STUDBOLTS — REPEATED COMPONENTS
      ====================================================== */}

      <FaultPulse
        active={Boolean(faults[s[7].id])}
        position={s[7].position}
        radius={0.45}
        label={
          faults[s[7].id] && {
            title: s[7].name,
            value: faults[s[7].id].value,
          }
        }
        showLabel={xray}
        onClick={xray ? () => onPartClick?.(s[7].id) : undefined}
      >
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;

          return (
            <group
              key={i}
              position={[
                Math.cos(a) * 0.35,
                explode * 0.15,
                Math.sin(a) * 0.35,
              ]}
              rotation={[0, 0, a]}
              scale={s[7].scale}
            >
              <Studbolt {...partProps(s[7].id)} />
            </group>
          );
        })}
      </FaultPulse>

      {/* ======================================================
          8.15 LOW DETAIL — PLANT LAYOUT VIEW
          Only key internal components are rendered
      ====================================================== */}

      {detail === "low" && (
        <>
          <FaultPulse
            active={Boolean(faults[s[0].id])}
            position={s[0].position}
            radius={0.4}
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
              <TrimSet {...partProps(s[0].id)} />
            </group>
          </FaultPulse>

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
            <group scale={s[5].scale}>
              <Positioner {...partProps(s[5].id)} />
            </group>
          </FaultPulse>
        </>
      )}
    </group>
  );
}