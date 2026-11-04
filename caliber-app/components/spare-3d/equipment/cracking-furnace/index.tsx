import type { EquipmentProps, SlotDef } from "../../contract";
import { XRayShell, FaultPulse } from "../../core";

import Anchor from "../../parts/anchor";
import BurnerTip from "../../parts/burner-tip";
import Castable from "../../parts/castable";
import CeramicFiber from "../../parts/ceramic-fiber";
import Firebrick from "../../parts/firebrick";
import Gasket from "../../parts/gasket";
import Pipe from "../../parts/pipe";
import Thermocouple from "../../parts/thermocouple";
import ValveGate from "../../parts/valve-gate";

// ============================================================
// PHASE 1 — DIMENSIONS AND CONFIGURATION
// ============================================================

// Real dimensions: L x H x W = 14 x 30 x 8 m
// Longest dimension (height) = 4 units.
// Scale factor = 4 / 30 = 0.1333 units per meter.

const DIM = {
  length: 14 * (4 / 30),
  height: 4,
  width: 8 * (4 / 30),
};

const C = {
  casing: "#687783",
  casingDark: "#46545F",
  casingLight: "#91A0AA",
  steel: "#8999A5",
  steelDark: "#52616C",
  refractory: "#C18B59",
  refractoryDark: "#946A45",
  fiber: "#D6C9A8",
  firebrick: "#A85E42",
  burner: "#D49A43",
  pipe: "#A6B5BF",
  stack: "#647681",
  base: "#35434D",
  accent: "#E1A84C",
  glass: "#283C48",
};

const FIREBOX = {
  x: 1.55,
  y: 1.42,
  z: 0.92,
  bottom: 0.18,
};

const CONVECTION = {
  x: 1.45,
  y: 0.78,
  z: 0.92,
  bottom: FIREBOX.bottom + FIREBOX.y,
};

const FIREBOX_TOP = FIREBOX.bottom + FIREBOX.y;
const CONVECTION_TOP = CONVECTION.bottom + CONVECTION.y;

const STACK = {
  x: 0.34,
  z: 0.34,
  y: DIM.height - CONVECTION_TOP - 0.08,
  bottom: CONVECTION_TOP,
};

// Clamp slider input to a predictable range.
function clampExplode(value: number) {
  return Math.max(0, Math.min(value || 0, 1));
}

// ============================================================
// PHASE 2 — PART SLOT DEFINITIONS
// ============================================================

export const SLOTS: SlotDef[] = [
  {
    id: "burner-tips",
    part: "burner-tip",
    name: "Floor burners",
    position: [0, 0.28, 0],
    rotation: [0, 0, Math.PI / 2],
    scale: 0.22,
  },
  {
    id: "radiant-coil",
    part: "pipe",
    name: "Radiant coil",
    position: [0, 0.95, 0],
    rotation: [0, 0, 0],
    scale: 0.72,
  },
  {
    id: "lining-castable",
    part: "castable",
    name: "Castable lining",
    position: [0, 0.9, 0],
    scale: 0.62,
  },
  {
    id: "lining-fiber",
    part: "ceramic-fiber",
    name: "Ceramic fiber layer",
    position: [0, 0.9, 0],
    scale: 0.62,
  },
  {
    id: "firebrick",
    part: "firebrick",
    name: "Firebrick floor",
    position: [0, 0.23, 0],
    scale: 0.22,
  },
  {
    id: "anchors",
    part: "anchor",
    name: "Refractory anchors",
    position: [0, 0.9, 0],
    scale: 0.12,
  },
  {
    id: "coil-outlet-tc",
    part: "thermocouple",
    name: "Coil outlet thermocouple",
    position: [0.78, 1.55, 0],
    rotation: [0, 0, 0],
    scale: 0.18,
  },
  {
    id: "outlet-gasket",
    part: "gasket",
    name: "Outlet flange gasket",
    position: [0.82, 1.55, 0],
    rotation: [0, 0, 0],
    scale: 0.2,
  },
  {
    id: "fuel-gas-valve",
    part: "valve-gate",
    name: "Fuel gas header gate valve",
    position: [-0.85, 0.38, 0],
    rotation: [0, 0, 0],
    scale: 0.3,
  },
];

// ============================================================
// PHASE 3 — BASE SKID
// Base is deliberately NOT wrapped in XRayShell.
// ============================================================

function BaseSkid() {
  return (
    <group>
      {/* Main foundation */}
      <mesh position={[0, 0.06, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.05, 0.12, 1.22]} />
        <meshStandardMaterial
          color={C.base}
          metalness={0.72}
          roughness={0.48}
        />
      </mesh>

      {/* Longitudinal support beams */}
      {[-0.48, 0.48].map((z) => (
        <mesh key={z} position={[0, 0.15, z]} castShadow>
          <boxGeometry args={[1.98, 0.12, 0.12]} />
          <meshStandardMaterial
            color={C.steelDark}
            metalness={0.72}
            roughness={0.42}
          />
        </mesh>
      ))}

      {/* Transverse support beams */}
      {[-0.82, -0.27, 0.27, 0.82].map((x) => (
        <mesh key={x} position={[x, 0.15, 0]} castShadow>
          <boxGeometry args={[0.1, 0.12, 1.12]} />
          <meshStandardMaterial
            color={C.steelDark}
            metalness={0.72}
            roughness={0.42}
          />
        </mesh>
      ))}

      {/* Structural legs */}
      {[-0.82, 0.82].map((x) =>
        [-0.45, 0.45].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.1, z]}>
            <boxGeometry args={[0.14, 0.2, 0.14]} />
            <meshStandardMaterial
              color={C.steelDark}
              metalness={0.72}
              roughness={0.42}
            />
          </mesh>
        ))
      )}

      {/* Base plate */}
      <mesh position={[0, 0.23, 0]}>
        <boxGeometry args={[1.9, 0.06, 1.08]} />
        <meshStandardMaterial
          color={C.steel}
          metalness={0.75}
          roughness={0.4}
        />
      </mesh>
    </group>
  );
}

// ============================================================
// PHASE 4 — FIREBOX CASING
// ============================================================

type ShellProps = {
  xray: boolean;
  explode: number;
  onShellClick?: EquipmentProps["onShellClick"];
};

function FireboxShell({
  xray,
  explode,
  onShellClick,
}: ShellProps) {
  const wallY = FIREBOX.bottom + FIREBOX.y / 2;
  const t = 0.09;

  return (
    <group>
      {/* Front wall */}
      <XRayShell
        active={xray}
        explode={[0, 0, 0.75 * explode]}
        onClick={onShellClick}
      >
        <mesh position={[0, wallY, FIREBOX.z / 2]} castShadow>
          <boxGeometry args={[FIREBOX.x, FIREBOX.y, t]} />
          <meshStandardMaterial
            color={C.casing}
            metalness={0.55}
            roughness={0.58}
          />
        </mesh>
      </XRayShell>

      {/* Rear wall */}
      <XRayShell
        active={xray}
        explode={[0, 0, -0.75 * explode]}
        onClick={onShellClick}
      >
        <mesh position={[0, wallY, -FIREBOX.z / 2]} castShadow>
          <boxGeometry args={[FIREBOX.x, FIREBOX.y, t]} />
          <meshStandardMaterial
            color={C.casingDark}
            metalness={0.55}
            roughness={0.58}
          />
        </mesh>
      </XRayShell>

      {/* Left wall */}
      <XRayShell
        active={xray}
        explode={[-0.75 * explode, 0, 0]}
        onClick={onShellClick}
      >
        <mesh position={[-FIREBOX.x / 2, wallY, 0]} castShadow>
          <boxGeometry args={[t, FIREBOX.y, FIREBOX.z]} />
          <meshStandardMaterial
            color={C.casingLight}
            metalness={0.55}
            roughness={0.58}
          />
        </mesh>
      </XRayShell>

      {/* Right wall */}
      <XRayShell
        active={xray}
        explode={[0.75 * explode, 0, 0]}
        onClick={onShellClick}
      >
        <mesh position={[FIREBOX.x / 2, wallY, 0]} castShadow>
          <boxGeometry args={[t, FIREBOX.y, FIREBOX.z]} />
          <meshStandardMaterial
            color={C.casing}
            metalness={0.55}
            roughness={0.58}
          />
        </mesh>
      </XRayShell>

      {/* Roof */}
      <XRayShell
        active={xray}
        explode={[0, 0.65 * explode, 0]}
        onClick={onShellClick}
      >
        <mesh position={[0, FIREBOX_TOP, 0]} castShadow>
          <boxGeometry args={[FIREBOX.x + 0.12, 0.1, FIREBOX.z + 0.12]} />
          <meshStandardMaterial
            color={C.casingDark}
            metalness={0.6}
            roughness={0.5}
          />
        </mesh>
      </XRayShell>

      {/* Peep doors on front */}
      <XRayShell
        active={xray}
        explode={[0, 0, 0.8 * explode]}
        onClick={onShellClick}
      >
        <group>
          {[-0.48, 0, 0.48].map((x) => (
            <group
              key={x}
              position={[x, FIREBOX.bottom + 0.48, FIREBOX.z / 2 + 0.07]}
            >
              <mesh>
                <boxGeometry args={[0.19, 0.19, 0.045]} />
                <meshStandardMaterial
                  color={C.steelDark}
                  metalness={0.7}
                  roughness={0.45}
                />
              </mesh>

              <mesh position={[0, 0, 0.03]}>
                <boxGeometry args={[0.1, 0.1, 0.015]} />
                <meshStandardMaterial
                  color={C.glass}
                  metalness={0.15}
                  roughness={0.2}
                />
              </mesh>
            </group>
          ))}
        </group>
      </XRayShell>
    </group>
  );
}

// ============================================================
// PHASE 5 — CONVECTION SECTION
// ============================================================

function ConvectionShell({
  xray,
  explode,
  onShellClick,
}: ShellProps) {
  const wallY = CONVECTION.bottom + CONVECTION.y / 2;
  const t = 0.08;

  return (
    <group>
      {/* Front wall */}
      <XRayShell
        active={xray}
        explode={[0, 0.55 * explode, 0.65 * explode]}
        onClick={onShellClick}
      >
        <mesh position={[0, wallY, CONVECTION.z / 2]}>
          <boxGeometry args={[CONVECTION.x, CONVECTION.y, t]} />
          <meshStandardMaterial
            color={C.casingLight}
            metalness={0.58}
            roughness={0.55}
          />
        </mesh>
      </XRayShell>

      {/* Rear wall */}
      <XRayShell
        active={xray}
        explode={[0, 0.55 * explode, -0.65 * explode]}
        onClick={onShellClick}
      >
        <mesh position={[0, wallY, -CONVECTION.z / 2]}>
          <boxGeometry args={[CONVECTION.x, CONVECTION.y, t]} />
          <meshStandardMaterial
            color={C.casingDark}
            metalness={0.58}
            roughness={0.55}
          />
        </mesh>
      </XRayShell>

      {/* Left wall */}
      <XRayShell
        active={xray}
        explode={[-0.65 * explode, 0.55 * explode, 0]}
        onClick={onShellClick}
      >
        <mesh position={[-CONVECTION.x / 2, wallY, 0]}>
          <boxGeometry args={[t, CONVECTION.y, CONVECTION.z]} />
          <meshStandardMaterial
            color={C.casing}
            metalness={0.58}
            roughness={0.55}
          />
        </mesh>
      </XRayShell>

      {/* Right wall */}
      <XRayShell
        active={xray}
        explode={[0.65 * explode, 0.55 * explode, 0]}
        onClick={onShellClick}
      >
        <mesh position={[CONVECTION.x / 2, wallY, 0]}>
          <boxGeometry args={[t, CONVECTION.y, CONVECTION.z]} />
          <meshStandardMaterial
            color={C.casing}
            metalness={0.58}
            roughness={0.55}
          />
        </mesh>
      </XRayShell>

      {/* Roof */}
      <XRayShell
        active={xray}
        explode={[0, 0.8 * explode, 0]}
        onClick={onShellClick}
      >
        <mesh position={[0, CONVECTION_TOP, 0]}>
          <boxGeometry args={[CONVECTION.x + 0.1, 0.08, CONVECTION.z + 0.1]} />
          <meshStandardMaterial
            color={C.casingDark}
            metalness={0.6}
            roughness={0.5}
          />
        </mesh>
      </XRayShell>

      {/* Access panels */}
      <XRayShell
        active={xray}
        explode={[0, 0.55 * explode, 0.7 * explode]}
        onClick={onShellClick}
      >
        <group>
          {[-0.45, 0, 0.45].map((x) => (
            <mesh
              key={x}
              position={[x, wallY, CONVECTION.z / 2 + 0.06]}
            >
              <boxGeometry args={[0.25, 0.38, 0.045]} />
              <meshStandardMaterial
                color={C.steelDark}
                metalness={0.65}
                roughness={0.48}
              />
            </mesh>
          ))}
        </group>
      </XRayShell>
    </group>
  );
}

// ============================================================
// PHASE 6 — STACK
// ============================================================

function Stack({
  xray,
  explode,
  onShellClick,
}: ShellProps) {
  return (
    <group position={[0.42, STACK.bottom, 0]}>
      <XRayShell
        active={xray}
        explode={[0, 1.0 * explode, 0]}
        onClick={onShellClick}
      >
        <group position={[0, STACK.y / 2, 0]}>
          {/* Stack body */}
          <mesh castShadow>
            <cylinderGeometry
              args={[STACK.x * 0.82, STACK.x, STACK.y, 12, 1, true]}
            />
            <meshStandardMaterial
              color={C.stack}
              metalness={0.62}
              roughness={0.5}
              side={2}
            />
          </mesh>

          {/* Stack top rim */}
          <mesh position={[0, STACK.y / 2, 0]}>
            <cylinderGeometry args={[STACK.x * 0.9, STACK.x * 0.9, 0.07, 12]} />
            <meshStandardMaterial
              color={C.casingDark}
              metalness={0.7}
              roughness={0.42}
            />
          </mesh>

          {/* Stack bottom collar */}
          <mesh position={[0, -STACK.y / 2 + 0.08, 0]}>
            <cylinderGeometry args={[STACK.x * 1.08, STACK.x * 1.08, 0.12, 12]} />
            <meshStandardMaterial
              color={C.casingDark}
              metalness={0.68}
              roughness={0.45}
            />
          </mesh>
        </group>
      </XRayShell>

      {/* Stack support frame */}
      <XRayShell
        active={xray}
        explode={[0, 0.5 * explode, 0]}
        onClick={onShellClick}
      >
        <group position={[0, 0.22, 0]}>
          {[-0.24, 0.24].map((x) =>
            [-0.24, 0.24].map((z) => (
              <mesh key={`${x}-${z}`}>
                <boxGeometry args={[0.055, 0.44, 0.055]} />
                <meshStandardMaterial
                  color={C.steelDark}
                  metalness={0.75}
                  roughness={0.42}
                />
              </mesh>
            ))
          )}
        </group>
      </XRayShell>
    </group>
  );
}

// ============================================================
// PHASE 7 — EXTERNAL STRUCTURAL DETAILS
// ============================================================

function ExternalDetails({
  xray,
  explode,
  onShellClick,
}: ShellProps) {
  return (
    <group>
      {/* Firebox corner stiffeners */}
      <XRayShell
        active={xray}
        explode={[0, 0.25 * explode, 0]}
        onClick={onShellClick}
      >
        {[-1, 1].map((sx) =>
          [-1, 1].map((sz) => (
            <mesh
              key={`${sx}-${sz}`}
              position={[
                sx * (FIREBOX.x / 2 + 0.06),
                FIREBOX.bottom + FIREBOX.y / 2,
                sz * (FIREBOX.z / 2 + 0.06),
              ]}
            >
              <boxGeometry args={[0.055, FIREBOX.y, 0.055]} />
              <meshStandardMaterial
                color={C.steelDark}
                metalness={0.72}
                roughness={0.42}
              />
            </mesh>
          ))
        )}
      </XRayShell>

      {/* Convection support columns */}
      <XRayShell
        active={xray}
        explode={[0, 0.4 * explode, 0]}
        onClick={onShellClick}
      >
        {[-1, 1].map((sx) =>
          [-1, 1].map((sz) => (
            <mesh
              key={`${sx}-${sz}`}
              position={[
                sx * (CONVECTION.x / 2 + 0.04),
                CONVECTION.bottom + CONVECTION.y / 2,
                sz * (CONVECTION.z / 2 + 0.04),
              ]}
            >
              <boxGeometry args={[0.055, CONVECTION.y + 0.12, 0.055]} />
              <meshStandardMaterial
                color={C.steelDark}
                metalness={0.75}
                roughness={0.42}
              />
            </mesh>
          ))
        )}
      </XRayShell>

      {/* Convection tube-bank silhouettes */}
      <XRayShell
        active={xray}
        explode={[0, 0.6 * explode, 0]}
        onClick={onShellClick}
      >
        <group position={[0, CONVECTION.bottom + 0.36, 0]}>
          {Array.from({ length: 5 }, (_, i) => (
            <group key={i} position={[-0.5 + i * 0.25, 0, 0]}>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.035, 0.035, 0.68, 10]} />
                <meshStandardMaterial
                  color={C.pipe}
                  metalness={0.78}
                  roughness={0.3}
                />
              </mesh>
            </group>
          ))}
        </group>
      </XRayShell>

      {/* Front access platform */}
      <XRayShell
        active={xray}
        explode={[0, 0.45 * explode, 0.5 * explode]}
        onClick={onShellClick}
      >
        <group>
          <mesh
            position={[
              0,
              CONVECTION.bottom + 0.08,
              CONVECTION.z / 2 + 0.3,
            ]}
          >
            <boxGeometry args={[1.7, 0.055, 0.45]} />
            <meshStandardMaterial
              color={C.steelDark}
              metalness={0.7}
              roughness={0.5}
            />
          </mesh>

          {/* Handrail uprights */}
          {[-0.8, 0.8].map((x) => (
            <mesh
              key={x}
              position={[
                x,
                CONVECTION.bottom + 0.32,
                CONVECTION.z / 2 + 0.48,
              ]}
            >
              <boxGeometry args={[0.035, 0.5, 0.035]} />
              <meshStandardMaterial
                color={C.accent}
                metalness={0.5}
                roughness={0.45}
              />
            </mesh>
          ))}

          {/* Handrail */}
          <mesh
            position={[
              0,
              CONVECTION.bottom + 0.57,
              CONVECTION.z / 2 + 0.48,
            ]}
          >
            <boxGeometry args={[1.65, 0.035, 0.035]} />
            <meshStandardMaterial
              color={C.accent}
              metalness={0.5}
              roughness={0.45}
            />
          </mesh>
        </group>
      </XRayShell>
    </group>
  );
}

// ============================================================
// PHASE 8 — MAIN EQUIPMENT COMPONENT
// ============================================================

export default function CrackingFurnace({
  xray = false,
  explode = 0,
  faults = {},
  onShellClick,
  onPartClick,
  detail = "high",
}: EquipmentProps) {
  const e = clampExplode(explode);
  const lowDetail = detail === "low";

  const burnerSlot = SLOTS[0];
  const coilSlot = SLOTS[1];
  const castableSlot = SLOTS[2];
  const fiberSlot = SLOTS[3];
  const firebrickSlot = SLOTS[4];
  const anchorSlot = SLOTS[5];
  const tcSlot = SLOTS[6];
  const gasketSlot = SLOTS[7];
  const valveSlot = SLOTS[8];

  return (
    <group>
      {/* ------------------------------------------------------
          PHASE 8.1 — BASE
      ------------------------------------------------------ */}
      <BaseSkid />

      {/* ------------------------------------------------------
          PHASE 8.2 — OUTER CASING
      ------------------------------------------------------ */}
      <FireboxShell
        xray={xray}
        explode={e}
        onShellClick={onShellClick}
      />

      <ConvectionShell
        xray={xray}
        explode={e}
        onShellClick={onShellClick}
      />

      <Stack
        xray={xray}
        explode={e}
        onShellClick={onShellClick}
      />

      <ExternalDetails
        xray={xray}
        explode={e}
        onShellClick={onShellClick}
      />

      {/* ------------------------------------------------------
          PHASE 8.3 — FLOOR BURNERS
          One slot represents eight repeated burners.
      ------------------------------------------------------ */}
      <FaultPulse
        active={Boolean(faults[burnerSlot.id])}
        position={burnerSlot.position}
        radius={0.4}
        label={
          faults[burnerSlot.id] && {
            title: burnerSlot.name,
            value: faults[burnerSlot.id].value,
          }
        }
        showLabel={xray}
        onClick={xray ? () => onPartClick?.(burnerSlot.id) : undefined}
      >
        <group position={[0, 0.3 * e, 0]}>
          {Array.from({ length: 8 }, (_, i) => (
            <group
              key={i}
              position={[(i - 3.5) * 0.18, 0, 0]}
              rotation={burnerSlot.rotation}
              scale={burnerSlot.scale}
            >
              <BurnerTip
                highlight={Boolean(faults[burnerSlot.id])}
                detail={detail}
              />
            </group>
          ))}
        </group>
      </FaultPulse>

      {/* ------------------------------------------------------
          PHASE 8.4 — RADIANT COIL
          Repeated pipe components represent vertical U-tubes.
      ------------------------------------------------------ */}
      <FaultPulse
        active={Boolean(faults[coilSlot.id])}
        position={coilSlot.position}
        radius={0.6}
        label={
          faults[coilSlot.id] && {
            title: coilSlot.name,
            value: faults[coilSlot.id].value,
          }
        }
        showLabel={xray}
        onClick={xray ? () => onPartClick?.(coilSlot.id) : undefined}
      >
        <group position={[0, 0, 0.5 * e]}>
          {Array.from({ length: 5 }, (_, i) => {
            const x = (i - 2) * 0.24;

            return (
              <group key={i} position={[x, 0, 0]}>
                {/* Left vertical leg */}
                <group
                  position={[-0.055, 0, 0]}
                  rotation={[0, 0, Math.PI / 2]}
                  scale={coilSlot.scale}
                >
                  <Pipe
                    highlight={Boolean(faults[coilSlot.id])}
                    detail={detail}
                  />
                </group>

                {/* Right vertical leg */}
                <group
                  position={[0.055, 0, 0]}
                  rotation={[0, 0, Math.PI / 2]}
                  scale={coilSlot.scale}
                >
                  <Pipe
                    highlight={Boolean(faults[coilSlot.id])}
                    detail={detail}
                  />
                </group>

                {/* Upper return bend */}
                <group position={[0, 0.3, 0]} scale={0.18}>
                  <Pipe
                    highlight={Boolean(faults[coilSlot.id])}
                    detail={detail}
                  />
                </group>

                {/* Lower connection */}
                <group position={[0, -0.3, 0]} scale={0.18}>
                  <Pipe
                    highlight={Boolean(faults[coilSlot.id])}
                    detail={detail}
                  />
                </group>
              </group>
            );
          })}
        </group>
      </FaultPulse>

      {/* ------------------------------------------------------
          PHASE 8.5 — LOW DETAIL VIEW
          Only burners and coil are rendered as internal parts.
      ------------------------------------------------------ */}

      {/* ------------------------------------------------------
          PHASE 8.6 — REFRACTORY LINING
      ------------------------------------------------------ */}
      {!lowDetail && (
        <>
          {/* Castable lining */}
          <FaultPulse
            active={Boolean(faults[castableSlot.id])}
            position={castableSlot.position}
            radius={0.5}
            label={
              faults[castableSlot.id] && {
                title: castableSlot.name,
                value: faults[castableSlot.id].value,
              }
            }
            showLabel={xray}
            onClick={
              xray ? () => onPartClick?.(castableSlot.id) : undefined
            }
          >
            <group position={[0, 0, 0.45 * e]}>
              {[-1, 0, 1].map((x) => (
                <group
                  key={x}
                  position={[x * 0.38, 0, 0]}
                  scale={castableSlot.scale}
                >
                  <Castable
                    highlight={Boolean(faults[castableSlot.id])}
                    detail={detail}
                  />
                </group>
              ))}
            </group>
          </FaultPulse>

          {/* Ceramic fiber */}
          <FaultPulse
            active={Boolean(faults[fiberSlot.id])}
            position={fiberSlot.position}
            radius={0.5}
            label={
              faults[fiberSlot.id] && {
                title: fiberSlot.name,
                value: faults[fiberSlot.id].value,
              }
            }
            showLabel={xray}
            onClick={
              xray ? () => onPartClick?.(fiberSlot.id) : undefined
            }
          >
            <group position={[0, 0, -0.45 * e]}>
              {[-1, 0, 1].map((x) => (
                <group
                  key={x}
                  position={[x * 0.38, 0, 0]}
                  scale={fiberSlot.scale}
                >
                  <CeramicFiber
                    highlight={Boolean(faults[fiberSlot.id])}
                    detail={detail}
                  />
                </group>
              ))}
            </group>
          </FaultPulse>

          {/* Firebrick floor tiles */}
          <FaultPulse
            active={Boolean(faults[firebrickSlot.id])}
            position={firebrickSlot.position}
            radius={0.4}
            label={
              faults[firebrickSlot.id] && {
                title: firebrickSlot.name,
                value: faults[firebrickSlot.id].value,
              }
            }
            showLabel={xray}
            onClick={
              xray ? () => onPartClick?.(firebrickSlot.id) : undefined
            }
          >
            <group position={[0, -0.25 * e, 0]}>
              {Array.from({ length: 8 }, (_, i) => (
                <group
                  key={i}
                  position={[(i - 3.5) * 0.2, 0, 0]}
                  scale={firebrickSlot.scale}
                >
                  <Firebrick
                    highlight={Boolean(faults[firebrickSlot.id])}
                    detail={detail}
                  />
                </group>
              ))}
            </group>
          </FaultPulse>

          {/* Refractory anchors */}
          <FaultPulse
            active={Boolean(faults[anchorSlot.id])}
            position={anchorSlot.position}
            radius={0.4}
            label={
              faults[anchorSlot.id] && {
                title: anchorSlot.name,
                value: faults[anchorSlot.id].value,
              }
            }
            showLabel={xray}
            onClick={
              xray ? () => onPartClick?.(anchorSlot.id) : undefined
            }
          >
            <group position={[0, 0.4 * e, 0]}>
              {[-1, 1].map((side) =>
                Array.from({ length: 4 }, (_, i) => (
                  <group
                    key={`${side}-${i}`}
                    position={[
                      side * 0.7,
                      (i - 1.5) * 0.28,
                      0,
                    ]}
                    rotation={[0, 0, side * Math.PI / 2]}
                    scale={anchorSlot.scale}
                  >
                    <Anchor
                      highlight={Boolean(faults[anchorSlot.id])}
                      detail={detail}
                    />
                  </group>
                ))
              )}
            </group>
          </FaultPulse>
        </>
      )}

      {/* ------------------------------------------------------
          PHASE 8.7 — COIL OUTLET INSTRUMENTATION
      ------------------------------------------------------ */}
      {!lowDetail && (
        <>
          <FaultPulse
            active={Boolean(faults[tcSlot.id])}
            position={tcSlot.position}
            radius={0.35}
            label={
              faults[tcSlot.id] && {
                title: tcSlot.name,
                value: faults[tcSlot.id].value,
              }
            }
            showLabel={xray}
            onClick={xray ? () => onPartClick?.(tcSlot.id) : undefined}
          >
            <group
              position={[0.35 * e, 0, 0]}
              rotation={tcSlot.rotation}
              scale={tcSlot.scale}
            >
              <Thermocouple
                highlight={Boolean(faults[tcSlot.id])}
                detail={detail}
              />
            </group>
          </FaultPulse>

          <FaultPulse
            active={Boolean(faults[gasketSlot.id])}
            position={gasketSlot.position}
            radius={0.35}
            label={
              faults[gasketSlot.id] && {
                title: gasketSlot.name,
                value: faults[gasketSlot.id].value,
              }
            }
            showLabel={xray}
            onClick={xray ? () => onPartClick?.(gasketSlot.id) : undefined}
          >
            <group
              position={[0.4 * e, 0, 0]}
              rotation={gasketSlot.rotation}
              scale={gasketSlot.scale}
            >
              <Gasket
                highlight={Boolean(faults[gasketSlot.id])}
                detail={detail}
              />
            </group>
          </FaultPulse>
        </>
      )}

      {/* ------------------------------------------------------
          PHASE 8.8 — FUEL GAS HEADER VALVE
      ------------------------------------------------------ */}
      {!lowDetail && (
        <>
          <FaultPulse
            active={Boolean(faults[valveSlot.id])}
            position={valveSlot.position}
            radius={0.45}
            label={
              faults[valveSlot.id] && {
                title: valveSlot.name,
                value: faults[valveSlot.id].value,
              }
            }
            showLabel={xray}
            onClick={xray ? () => onPartClick?.(valveSlot.id) : undefined}
          >
            <group
              position={[-0.45 * e, 0, 0]}
              rotation={valveSlot.rotation}
              scale={valveSlot.scale}
            >
              <ValveGate
                highlight={Boolean(faults[valveSlot.id])}
                detail={detail}
              />
            </group>
          </FaultPulse>

          {/* Fuel gas distribution header */}
          <group>
            <mesh
              position={[-0.85, 0.38, 0.36]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <cylinderGeometry args={[0.045, 0.045, 0.8, 10]} />
              <meshStandardMaterial
                color={C.pipe}
                metalness={0.75}
                roughness={0.32}
              />
            </mesh>

            <mesh
              position={[-0.85, 0.38, -0.36]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <cylinderGeometry args={[0.045, 0.045, 0.8, 10]} />
              <meshStandardMaterial
                color={C.pipe}
                metalness={0.75}
                roughness={0.32}
              />
            </mesh>

            <mesh position={[-0.85, 0.38, 0]}>
              <cylinderGeometry args={[0.045, 0.045, 0.72, 10]} />
              <meshStandardMaterial
                color={C.pipe}
                metalness={0.75}
                roughness={0.32}
              />
            </mesh>
          </group>
        </>
      )}
    </group>
  );
}