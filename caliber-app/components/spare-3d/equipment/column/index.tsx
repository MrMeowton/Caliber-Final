import type { EquipmentProps, SlotDef } from "../../contract";
import { XRayShell, FaultPulse } from "../../core";

import DemisterPad from "../../parts/demister-pad";
import Gasket from "../../parts/gasket";
import Screen from "../../parts/screen";
import Studbolt from "../../parts/studbolt";
import TrayValve from "../../parts/tray-valve";

/**
 * DISTILLATION COLUMN / STRIPPER (CL)
 * Naphtha Cracker Process Equipment
 *
 * Approximate real dimensions: 3 x 25 x 3 m
 * Normalised dimensions: 0.48 x 4 x 0.48 units
 *
 * X = column length
 * Y = vertical axis
 * Z = column width
 * Base elevation = 0
 *
 * Internal arrangement:
 * - Valve trays at approximately 2 m intervals
 * - Feed distributor screen
 * - Top demister pad
 * - Manway access covers, gaskets and studbolts
 */

const C = {
  shell: "#71869A",
  shellDark: "#465B70",
  shellInner: "#293C4E",
  steel: "#B8C5D0",
  steelDark: "#64788A",
  tray: "#A5B4C2",
  trayDark: "#64798C",
  accent: "#D6A04B",
  gasket: "#343B43",
  bolt: "#D6DEE6",
  base: "#293B4B",
  nozzle: "#8197AA",
};

const COLUMN_HEIGHT = 4;
const COLUMN_RADIUS = 0.24;
const COLUMN_DIAMETER = COLUMN_RADIUS * 2;

const SHELL_BOTTOM = 0.15;
const SHELL_TOP = 4.0;

const MANWAY_ANGLES = [0, Math.PI, Math.PI / 2, -Math.PI / 2];

export const SLOTS: SlotDef[] = [
  {
    id: "trays",
    part: "tray-valve",
    name: "Valve trays",
    position: [0, 2.0, 0],
    rotation: [0, 0, 0],
    scale: 0.43,
  },
  {
    id: "demister",
    part: "demister-pad",
    name: "Top demister",
    position: [0, 3.78, 0],
    rotation: [0, 0, 0],
    scale: 0.42,
  },
  {
    id: "screen",
    part: "screen",
    name: "Distributor screen",
    position: [0, 2.15, 0],
    rotation: [0, 0, 0],
    scale: 0.4,
  },
  {
    id: "manway-gasket",
    part: "gasket",
    name: "Manway gaskets",
    position: [0, 2.0, COLUMN_RADIUS],
    rotation: [0, 0, 0],
    scale: 0.3,
  },
  {
    id: "studbolts",
    part: "studbolt",
    name: "Studbolts",
    position: [0, 2.0, COLUMN_RADIUS],
    rotation: [0, 0, 0],
    scale: 0.12,
  },
];

/* ============================================================
   PHASE 1 — MATERIALS
============================================================ */

function Metal({
  color,
  metalness = 0.75,
  roughness = 0.32,
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
   PHASE 2 — BASE SKID AND FOUNDATION
============================================================ */

function BaseStructure() {
  return (
    <group>
      {/* Concrete foundation */}
      <mesh position={[0, 0.035, 0]}>
        <cylinderGeometry args={[0.36, 0.39, 0.07, 32]} />
        <meshStandardMaterial
          color="#59636D"
          roughness={0.9}
        />
      </mesh>

      {/* Circular base plate */}
      <mesh position={[0, 0.11, 0]}>
        <cylinderGeometry args={[0.34, 0.34, 0.08, 40]} />
        <Metal color={C.base} />
      </mesh>

      {/* Base stiffening ribs */}
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;

        return (
          <mesh
            key={i}
            position={[
              Math.cos(a) * 0.23,
              0.23,
              Math.sin(a) * 0.23,
            ]}
            rotation={[0, -a, 0]}
          >
            <boxGeometry args={[0.1, 0.24, 0.035]} />
            <Metal color={C.steelDark} />
          </mesh>
        );
      })}

      {/* Anchor bolts */}
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;

        return (
          <mesh
            key={i}
            position={[
              Math.cos(a) * 0.3,
              0.14,
              Math.sin(a) * 0.3,
            ]}
          >
            <cylinderGeometry args={[0.018, 0.018, 0.12, 8]} />
            <Metal color={C.bolt} metalness={0.9} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ============================================================
   PHASE 3 — COLUMN SHELL SECTIONS
============================================================ */

function ShellSection({
  bottom,
  top,
}: {
  bottom: number;
  top: number;
}) {
  const height = top - bottom;
  const center = (bottom + top) / 2;

  return (
    <group position={[0, center, 0]}>
      {/* Main cylindrical shell */}
      <mesh>
        <cylinderGeometry
          args={[COLUMN_RADIUS, COLUMN_RADIUS, height, 48, 1, true]}
        />
        <Metal color={C.shell} />
      </mesh>

      {/* Lower reinforcement ring */}
      <mesh position={[0, -height / 2 + 0.04, 0]}>
        <torusGeometry
          args={[COLUMN_RADIUS + 0.012, 0.018, 8, 48]}
        />
        <Metal color={C.shellDark} />
      </mesh>

      {/* Upper reinforcement ring */}
      <mesh position={[0, height / 2 - 0.04, 0]}>
        <torusGeometry
          args={[COLUMN_RADIUS + 0.012, 0.018, 8, 48]}
        />
        <Metal color={C.shellDark} />
      </mesh>

      {/* Vertical stiffening strips */}
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;

        return (
          <mesh
            key={i}
            position={[
              Math.cos(a) * (COLUMN_RADIUS + 0.005),
              0,
              Math.sin(a) * (COLUMN_RADIUS + 0.005),
            ]}
            rotation={[0, -a, 0]}
          >
            <boxGeometry args={[0.025, height - 0.12, 0.025]} />
            <Metal color={C.shellDark} />
          </mesh>
        );
      })}
    </group>
  );
}

function ColumnHead() {
  return (
    <group>
      {/* Top elliptical head approximation */}
      <mesh position={[0, 4.0, 0]}>
        <sphereGeometry args={[COLUMN_RADIUS, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <Metal color={C.shell} />
      </mesh>

      {/* Top head flange */}
      <mesh position={[0, 3.99, 0]}>
        <torusGeometry args={[COLUMN_RADIUS, 0.025, 8, 48]} />
        <Metal color={C.steel} />
      </mesh>

      {/* Top vent nozzle */}
      <mesh position={[0, 4.18, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.28, 24]} />
        <Metal color={C.nozzle} />
      </mesh>

      {/* Vent flange */}
      <mesh position={[0, 4.33, 0]}>
        <cylinderGeometry args={[0.105, 0.105, 0.045, 24]} />
        <Metal color={C.steel} />
      </mesh>
    </group>
  );
}

function ColumnBottomHead() {
  return (
    <group>
      {/* Bottom dished head */}
      <mesh position={[0, 0.2, 0]}>
        <sphereGeometry
          args={[COLUMN_RADIUS, 40, 20, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]}
        />
        <Metal color={C.shell} />
      </mesh>

      {/* Bottom outlet nozzle */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.075, 0.075, 0.35, 24]} />
        <Metal color={C.nozzle} />
      </mesh>

      {/* Bottom outlet flange */}
      <mesh position={[0, 0.015, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.05, 24]} />
        <Metal color={C.steel} />
      </mesh>
    </group>
  );
}

/* ============================================================
   PHASE 4 — PROCESS NOZZLES AND CONNECTIONS
============================================================ */

function ProcessNozzles() {
  return (
    <group>
      {/* Feed nozzle */}
      <group position={[0, 2.15, COLUMN_RADIUS]}>
        <mesh position={[0, 0, 0.13]}>
          <cylinderGeometry args={[0.065, 0.065, 0.26, 24]} />
          <Metal color={C.nozzle} />
        </mesh>

        <mesh position={[0, 0, 0.27]}>
          <cylinderGeometry args={[0.095, 0.095, 0.045, 24]} />
          <Metal color={C.steel} />
        </mesh>
      </group>

      {/* Side draw nozzles */}
      {[1.1, 2.7, 3.35].map((y, i) => (
        <group key={i} position={[0, y, 0]}>
          <mesh position={[COLUMN_RADIUS + 0.1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.045, 0.045, 0.24, 20]} />
            <Metal color={C.nozzle} />
          </mesh>

          <mesh position={[COLUMN_RADIUS + 0.23, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.075, 0.075, 0.045, 20]} />
            <Metal color={C.steel} />
          </mesh>
        </group>
      ))}

      {/* Bottom liquid outlet connection */}
      <mesh position={[0, 0.35, COLUMN_RADIUS + 0.1]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.22, 20]} />
        <Metal color={C.nozzle} />
      </mesh>

      {/* Pressure instrument nozzle */}
      <mesh position={[COLUMN_RADIUS, 3.6, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.035, 0.16, 16]} />
        <Metal color={C.steel} />
      </mesh>
    </group>
  );
}

/* ============================================================
   PHASE 5 — MANWAYS
============================================================ */

function ManwayShellDetails() {
  return (
    <group>
      {MANWAY_ANGLES.map((angle, i) => {
        const y = [0.9, 1.85, 2.8, 3.55][i];
        const x = Math.cos(angle);
        const z = Math.sin(angle);

        return (
          <group
            key={i}
            position={[
              x * (COLUMN_RADIUS + 0.012),
              y,
              z * (COLUMN_RADIUS + 0.012),
            ]}
            rotation={[0, -angle, 0]}
          >
            {/* Manway neck */}
            <mesh position={[0, 0, 0.045]}>
              <cylinderGeometry args={[0.095, 0.095, 0.09, 24]} />
              <Metal color={C.shellDark} />
            </mesh>

            {/* Manway flange */}
            <mesh position={[0, 0, 0.1]}>
              <cylinderGeometry args={[0.13, 0.13, 0.045, 24]} />
              <Metal color={C.steel} />
            </mesh>

            {/* Manway cover */}
            <mesh position={[0, 0, 0.14]}>
              <cylinderGeometry args={[0.105, 0.105, 0.035, 24]} />
              <Metal color={C.shell} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/* ============================================================
   PHASE 6 — SUPPORTS AND EXTERNAL DETAILS
============================================================ */

function ExternalDetails() {
  return (
    <group>
      {/* Column support skirt */}
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry
          args={[0.29, 0.32, 0.36, 40, 1, true]}
        />
        <Metal color={C.shellDark} />
      </mesh>

      {/* Skirt lower flange */}
      <mesh position={[0, 0.1, 0]}>
        <torusGeometry args={[0.32, 0.025, 8, 48]} />
        <Metal color={C.steel} />
      </mesh>

      {/* External ladder rails */}
      {[-0.3, 0.3].map((x) => (
        <mesh
          key={x}
          position={[x, 2.0, COLUMN_RADIUS + 0.16]}
        >
          <cylinderGeometry args={[0.018, 0.018, 3.2, 10]} />
          <Metal color={C.steelDark} />
        </mesh>
      ))}

      {/* Ladder rungs */}
      {Array.from({ length: 17 }, (_, i) => (
        <mesh
          key={i}
          position={[0, 0.5 + i * 0.19, COLUMN_RADIUS + 0.16]}
        >
          <cylinderGeometry args={[0.012, 0.012, 0.6, 8]} />
          <meshStandardMaterial color={C.steel} metalness={0.8} />
        </mesh>
      ))}

      {/* Platform brackets */}
      {[1.8, 3.45].map((y) => (
        <mesh key={y} position={[0, y, COLUMN_RADIUS + 0.2]}>
          <boxGeometry args={[0.8, 0.06, 0.35]} />
          <Metal color={C.steelDark} />
        </mesh>
      ))}
    </group>
  );
}

/* ============================================================
   PHASE 7 — INTERNAL SLOT COMPONENTS
============================================================ */

export default function Column({
  xray = false,
  explode = 0,
  faults = {},
  onShellClick,
  onPartClick,
  detail = "high",
}: EquipmentProps) {
  const s = SLOTS;

  const faultProps = (id: string) => ({
    highlight: Boolean(faults[id]),
    detail,
  });

  return (
    <group>
      {/* ======================================================
          7.1 BASE STRUCTURE — NOT EXPLODED
      ====================================================== */}

      <BaseStructure />

      {/* ======================================================
          7.2 LOWER SHELL SECTION
      ====================================================== */}

      <XRayShell
        active={xray}
        explode={[0, -0.15 * explode, 0]}
        onClick={onShellClick}
      >
        <ShellSection bottom={0.15} top={1.15} />
      </XRayShell>

      {/* ======================================================
          7.3 LOWER-MIDDLE SHELL SECTION
      ====================================================== */}

      <XRayShell
        active={xray}
        explode={[0, -0.4 * explode, 0]}
        onClick={onShellClick}
      >
        <ShellSection bottom={1.15} top={2.15} />
      </XRayShell>

      {/* ======================================================
          7.4 UPPER-MIDDLE SHELL SECTION
      ====================================================== */}

      <XRayShell
        active={xray}
        explode={[0, 0.4 * explode, 0]}
        onClick={onShellClick}
      >
        <ShellSection bottom={2.15} top={3.15} />
      </XRayShell>

      {/* ======================================================
          7.5 TOP SHELL SECTION
      ====================================================== */}

      <XRayShell
        active={xray}
        explode={[0, 0.15 * explode, 0]}
        onClick={onShellClick}
      >
        <ShellSection bottom={3.15} top={3.95} />
        <group position={[0, 0.15 * explode, 0]}>
          <ColumnHead />
        </group>
      </XRayShell>

      {/* ======================================================
          7.6 BOTTOM HEAD AND PROCESS NOZZLES
      ====================================================== */}

      <XRayShell
        active={xray}
        explode={[0, -0.1 * explode, 0]}
        onClick={onShellClick}
      >
        <ColumnBottomHead />
      </XRayShell>

      <XRayShell
        active={xray}
        explode={[0, 0, 0]}
        onClick={onShellClick}
      >
        <ProcessNozzles />
      </XRayShell>

      {/* ======================================================
          7.7 EXTERNAL MANWAYS AND STRUCTURES
      ====================================================== */}

      <XRayShell
        active={xray}
        explode={[0, 0, 0]}
        onClick={onShellClick}
      >
        <ManwayShellDetails />
        <ExternalDetails />
      </XRayShell>

      {/* ======================================================
          7.8 VALVE TRAYS — REPEATED EVERY APPROX. 2 M
      ====================================================== */}

      {detail !== "low" && (
        <FaultPulse
          active={Boolean(faults[s[0].id])}
          position={s[0].position}
          radius={0.32}
          label={
            faults[s[0].id] && {
              title: s[0].name,
              value: faults[s[0].id].value,
            }
          }
          showLabel={xray}
          onClick={xray ? () => onPartClick?.(s[0].id) : undefined}
        >
          {Array.from({ length: 11 }, (_, i) => {
            const y = (i - 5) * 0.32;

            return (
              <group
                key={i}
                position={[0, y + (i % 2 === 0 ? -explode * 0.08 : explode * 0.08), 0]}
                rotation={s[0].rotation}
                scale={s[0].scale}
              >
                <TrayValve {...faultProps(s[0].id)} />
              </group>
            );
          })}
        </FaultPulse>
      )}

      {/* ======================================================
          7.9 TOP DEMISTER PAD
      ====================================================== */}

      {detail !== "low" && (
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
            position={[0, explode * 0.25, 0]}
            rotation={s[1].rotation}
            scale={s[1].scale}
          >
            <DemisterPad {...faultProps(s[1].id)} />
          </group>
        </FaultPulse>
      )}

      {/* ======================================================
          7.10 FEED DISTRIBUTOR SCREEN
      ====================================================== */}

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
            position={[0, -explode * 0.15, 0]}
            rotation={s[2].rotation}
            scale={s[2].scale}
          >
            <Screen {...faultProps(s[2].id)} />
          </group>
        </FaultPulse>
      )}

      {/* ======================================================
          7.11 MANWAY GASKETS — REPEATED COMPONENTS
      ====================================================== */}

      {detail !== "low" && (
        <FaultPulse
          active={Boolean(faults[s[3].id])}
          position={s[3].position}
          radius={0.3}
          label={
            faults[s[3].id] && {
              title: s[3].name,
              value: faults[s[3].id].value,
            }
          }
          showLabel={xray}
          onClick={xray ? () => onPartClick?.(s[3].id) : undefined}
        >
          {MANWAY_ANGLES.map((angle, i) => (
            <group
              key={i}
              position={[
                Math.cos(angle) * 0.06,
                (i - 1.5) * 0.95,
                Math.sin(angle) * 0.06,
              ]}
              rotation={[0, -angle, 0]}
              scale={s[3].scale}
            >
              <Gasket {...faultProps(s[3].id)} />
            </group>
          ))}
        </FaultPulse>
      )}

      {/* ======================================================
          7.12 MANWAY STUDBOLTS — REPEATED COMPONENTS
      ====================================================== */}

      {detail !== "low" && (
        <FaultPulse
          active={Boolean(faults[s[4].id])}
          position={s[4].position}
          radius={0.3}
          label={
            faults[s[4].id] && {
              title: s[4].name,
              value: faults[s[4].id].value,
            }
          }
          showLabel={xray}
          onClick={xray ? () => onPartClick?.(s[4].id) : undefined}
        >
          {MANWAY_ANGLES.flatMap((angle, i) =>
            Array.from({ length: 8 }, (_, j) => {
              const a = (j / 8) * Math.PI * 2;

              return (
                <group
                  key={`${i}-${j}`}
                  position={[
                    Math.cos(angle) * 0.06 + Math.cos(a) * 0.13,
                    (i - 1.5) * 0.95,
                    Math.sin(angle) * 0.06 + Math.sin(a) * 0.13,
                  ]}
                  rotation={[0, 0, a]}
                  scale={s[4].scale}
                >
                  <Studbolt {...faultProps(s[4].id)} />
                </group>
              );
            }),
          )}
        </FaultPulse>
      )}

      {/* ======================================================
          7.13 LOW DETAIL MODE
      ====================================================== */}

      {detail === "low" && (
        <FaultPulse
          active={Boolean(faults[s[0].id])}
          position={s[0].position}
          radius={0.32}
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
            <TrayValve {...faultProps(s[0].id)} />
          </group>
        </FaultPulse>
      )}
    </group>
  );
}