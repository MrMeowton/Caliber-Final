import * as THREE from "three";
import type { EquipmentProps, SlotDef } from "../../contract";
import { XRayShell, FaultPulse } from "../../core";

import DemisterPad from "../../parts/demister-pad";
import Gasket from "../../parts/gasket";
import Screen from "../../parts/screen";
import Studbolt from "../../parts/studbolt";
import ValveGate from "../../parts/valve-gate";

export const SLOTS: SlotDef[] = [
  {
    id: "demister",
    part: "demister-pad",
    name: "Demister pad",
    position: [0, 3.15, 0],
    scale: 1.35,
  },
  {
    id: "inlet-screen",
    part: "screen",
    name: "Inlet screen",
    position: [0.95, 2.15, 0],
    rotation: [0, 0, Math.PI / 2],
    scale: 0.85,
  },
  {
    id: "manway-gasket",
    part: "gasket",
    name: "Manway gasket",
    position: [1.05, 1.65, 0],
    rotation: [0, 0, Math.PI / 2],
    scale: 0.65,
  },
  {
    id: "studbolts",
    part: "studbolt",
    name: "Manway studbolts",
    position: [1.05, 1.65, 0],
    scale: 0.16,
  },
  {
    id: "drain-valve",
    part: "valve-gate",
    name: "Drain gate valve",
    position: [0, 0.38, 0],
    scale: 0.7,
  },
];

const C = {
  shell: "#87949d",
  shellLight: "#b4bec5",
  shellDark: "#46535c",
  steel: "#aab5bd",
  darkSteel: "#3c474f",
  flange: "#687780",
  interior: "#53636b",
  demister: "#a7b7bf",
  screen: "#8d9ca4",
  shadow: "#26343c",
  highlight: "#d4dce0",
};

type Vec3 = [number, number, number];

function MetalMaterial({
  color = C.shell,
  roughness = 0.34,
}: {
  color?: string;
  roughness?: number;
}) {
  return (
    <meshStandardMaterial
      color={color}
      metalness={0.78}
      roughness={roughness}
    />
  );
}

function Cylinder({
  radius = 0.1,
  radiusTop,
  radiusBottom,
  length = 0.2,
  color = C.steel,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: {
  radius?: number;
  radiusTop?: number;
  radiusBottom?: number;
  length?: number;
  color?: string;
  position?: Vec3;
  rotation?: Vec3;
}) {
  return (
    <mesh
      position={position}
      rotation={rotation}
      castShadow
      receiveShadow
    >
      <cylinderGeometry
        args={[
          radiusTop ?? radius,
          radiusBottom ?? radius,
          length,
          40,
        ]}
      />
      <MetalMaterial color={color} />
    </mesh>
  );
}

function Box({
  size,
  position,
  color = C.steel,
}: {
  size: Vec3;
  position: Vec3;
  color?: string;
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <MetalMaterial color={color} />
    </mesh>
  );
}

function Torus({
  radius,
  tube,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  color = C.steel,
}: {
  radius: number;
  tube: number;
  position?: Vec3;
  rotation?: Vec3;
  color?: string;
}) {
  return (
    <mesh
      position={position}
      rotation={rotation}
      castShadow
      receiveShadow
    >
      <torusGeometry args={[radius, tube, 12, 64]} />
      <MetalMaterial color={color} />
    </mesh>
  );
}

function BoltRing({
  radius,
  count,
  y,
  boltRadius = 0.035,
}: {
  radius: number;
  count: number;
  y: number;
  boltRadius?: number;
}) {
  return (
    <group>
      {Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2;

        return (
          <Cylinder
            key={i}
            radius={boltRadius}
            length={0.07}
            color={C.darkSteel}
            position={[
              Math.cos(a) * radius,
              y,
              Math.sin(a) * radius,
            ]}
          />
        );
      })}
    </group>
  );
}

/* ======================================================
   PHASE 1 — BASE SKID AND SUPPORT STRUCTURE
====================================================== */

function BaseSkid() {
  return (
    <group>
      {/* Main base frame */}
      <Box
        size={[2.35, 0.16, 1.95]}
        position={[0, 0.08, 0]}
        color={C.darkSteel}
      />

      {/* Structural longitudinal beams */}
      {[-0.78, 0.78].map((x) => (
        <Box
          key={x}
          size={[0.16, 0.48, 1.85]}
          position={[x, 0.32, 0]}
          color={C.shellDark}
        />
      ))}

      {/* Transverse support beams */}
      {[-0.72, 0.72].map((z) => (
        <Box
          key={z}
          size={[2.15, 0.3, 0.14]}
          position={[0, 0.32, z]}
          color={C.shellDark}
        />
      ))}

      {/* Vessel support saddles / base brackets */}
      {[-0.5, 0.5].map((x) => (
        <Box
          key={x}
          size={[0.28, 0.42, 1.35]}
          position={[x, 0.59, 0]}
          color={C.flange}
        />
      ))}

      {/* Anchor bolts */}
      {[-0.95, 0.95].map((x) =>
        [-0.76, 0.76].map((z) => (
          <Cylinder
            key={`${x}-${z}`}
            radius={0.055}
            length={0.12}
            color={C.highlight}
            position={[x, 0.19, z]}
          />
        )),
      )}
    </group>
  );
}

/* ======================================================
   PHASE 2 — VESSEL CYLINDRICAL SHELL
====================================================== */

function VesselShell() {
  return (
    <group>
      {/* Main pressure vessel cylindrical body */}
      <Cylinder
        radius={1}
        length={2.35}
        color={C.shell}
        position={[0, 0, 0]}
      />

      {/* Upper circumferential weld seams */}
      <Torus
        radius={1.005}
        tube={0.025}
        position={[0, 0.83, 0]}
        color={C.shellDark}
      />

      <Torus
        radius={1.005}
        tube={0.025}
        position={[0, -0.83, 0]}
        color={C.shellDark}
      />

      {/* Intermediate shell reinforcement bands */}
      {[-0.45, 0.45].map((y) => (
        <Torus
          key={y}
          radius={1.012}
          tube={0.018}
          position={[0, y, 0]}
          color={C.shellLight}
        />
      ))}
    </group>
  );
}

/* ======================================================
   PHASE 3 — ELLIPSOIDAL PRESSURE HEADS
====================================================== */

function VesselHead({
  top = false,
}: {
  top?: boolean;
}) {
  return (
    <group>
      {/* 2:1 ellipsoidal head approximation */}
      <mesh
        position={[0, 0, 0]}
        castShadow
        receiveShadow
      >
        <sphereGeometry args={[1, 48, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color={C.shell}
          metalness={0.78}
          roughness={0.34}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Head circumferential flange / weld rim */}
      <Torus
        radius={1}
        tube={0.035}
        color={C.shellDark}
      />

      {/* Reinforced central nozzle neck */}
      {top && (
        <group position={[0, 0.48, 0]}>
          <Cylinder
            radius={0.23}
            length={0.32}
            color={C.shellLight}
          />

          <Torus
            radius={0.23}
            tube={0.035}
            position={[0, 0.16, 0]}
          />
        </group>
      )}
    </group>
  );
}

/* ======================================================
   PHASE 4 — NOZZLES AND EXTERNAL CONNECTIONS
====================================================== */

function SideNozzle({
  position,
  rotation = [0, 0, Math.PI / 2],
  radius = 0.19,
  length = 0.35,
}: {
  position: Vec3;
  rotation?: Vec3;
  radius?: number;
  length?: number;
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Nozzle neck */}
      <Cylinder
        radius={radius}
        length={length}
        color={C.shellLight}
      />

      {/* Reinforcement pad */}
      <Cylinder
        radius={radius * 1.55}
        length={0.09}
        color={C.shellDark}
        position={[0, -length * 0.32, 0]}
      />

      {/* Flange */}
      <Cylinder
        radius={radius * 1.4}
        length={0.09}
        color={C.flange}
        position={[0, length * 0.55, 0]}
      />

      {/* Flange bolt holes / studs */}
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;

        return (
          <Cylinder
            key={i}
            radius={0.025}
            length={0.1}
            color={C.darkSteel}
            position={[
              Math.cos(a) * radius * 1.15,
              length * 0.55,
              Math.sin(a) * radius * 1.15,
            ]}
          />
        );
      })}
    </group>
  );
}

function ExternalNozzles() {
  return (
    <group>
      {/* Inlet nozzle */}
      <SideNozzle
        position={[0.95, 2.15, 0]}
        radius={0.19}
        length={0.38}
      />

      {/* Outlet nozzle */}
      <SideNozzle
        position={[0, 3.15, 0.95]}
        rotation={[Math.PI / 2, 0, 0]}
        radius={0.16}
        length={0.32}
      />

      {/* Side process nozzle */}
      <SideNozzle
        position={[-0.95, 2.0, 0]}
        radius={0.15}
        length={0.3}
      />

      {/* Manway neck */}
      <SideNozzle
        position={[1.0, 1.65, 0]}
        radius={0.29}
        length={0.22}
      />

      {/* Bottom drain nozzle */}
      <Cylinder
        radius={0.17}
        length={0.3}
        color={C.shellLight}
        position={[0, 0.48, 0]}
      />

      <Cylinder
        radius={0.23}
        length={0.08}
        color={C.flange}
        position={[0, 0.33, 0]}
      />
    </group>
  );
}

/* ======================================================
   PHASE 5 — MANWAY ASSEMBLY
====================================================== */

function ManwayFlange() {
  return (
    <group>
      {/* Manway outer flange */}
      <Cylinder
        radius={0.36}
        length={0.1}
        color={C.shellDark}
        position={[0, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
      />

      {/* Manway cover */}
      <Cylinder
        radius={0.31}
        length={0.1}
        color={C.shellLight}
        position={[0.12, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
      />

      {/* Cover centre reinforcement */}
      <Cylinder
        radius={0.12}
        length={0.04}
        color={C.darkSteel}
        position={[0.2, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
      />
    </group>
  );
}

/* ======================================================
   PHASE 6 — INTERNAL VESSEL SUPPORTS
====================================================== */

function InternalSupports() {
  return (
    <group>
      {/* Demister support ring */}
      <Torus
        radius={0.88}
        tube={0.045}
        position={[0, 3.0, 0]}
        color={C.shellDark}
      />

      {/* Demister support beams */}
      {[-0.5, 0, 0.5].map((x) => (
        <Box
          key={x}
          size={[0.055, 0.06, 1.7]}
          position={[x, 3.0, 0]}
          color={C.shellDark}
        />
      ))}

      {/* Internal support legs */}
      {[-0.7, 0.7].map((x) =>
        [-0.7, 0.7].map((z) => (
          <Box
            key={`${x}-${z}`}
            size={[0.07, 1.1, 0.07]}
            position={[x, 2.35, z]}
            color={C.shellDark}
          />
        )),
      )}

      {/* Internal inlet deflector plate */}
      <Box
        size={[0.85, 0.07, 0.55]}
        position={[0, 2.0, 0]}
        color={C.interior}
      />
    </group>
  );
}

/* ======================================================
   PHASE 7 — REPEATED MANWAY STUD BOLTS
====================================================== */

function ManwayStudboltRing({
  explode,
}: {
  explode: number;
}) {
  const count = 12;
  const radius = 0.34;

  return (
    <group
      rotation={[0, 0, 0]}
      position={[explode * 0.35, 0, 0]}
    >
      {Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2;

        return (
          <group
            key={i}
            position={[
              0,
              Math.cos(a) * radius,
              Math.sin(a) * radius,
            ]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <Studbolt
              detail="high"
            />
          </group>
        );
      })}
    </group>
  );
}

/* ======================================================
   PHASE 8 — ASSEMBLY AND FAULT INTEGRATION
====================================================== */

export default function VesselDrum({
  xray = false,
  explode = 0,
  faults = {},
  onShellClick,
  onPartClick,
  detail = "high",
}: EquipmentProps) {
  const sDemister = SLOTS[0];
  const sScreen = SLOTS[1];
  const sGasket = SLOTS[2];
  const sStudbolts = SLOTS[3];
  const sDrain = SLOTS[4];

  const low = detail === "low";

  return (
    <group>
      {/* -----------------------------------------------
          FIXED BASE SKID
      ------------------------------------------------ */}
      <BaseSkid />

      {/* -----------------------------------------------
          MAIN CYLINDRICAL PRESSURE SHELL
      ------------------------------------------------ */}
      <XRayShell
        active={xray}
        explode={[0, 0, 0]}
        onClick={onShellClick}
      >
        <group position={[0, 2.05, 0]}>
          <VesselShell />
        </group>
      </XRayShell>

      {/* -----------------------------------------------
          BOTTOM ELLIPSOIDAL HEAD
      ------------------------------------------------ */}
      <XRayShell
        active={xray}
        explode={[0, -0.25, 0]}
        onClick={onShellClick}
      >
        <group
          position={[0, 0.875, 0]}
          rotation={[Math.PI, 0, 0]}
        >
          <VesselHead />
        </group>
      </XRayShell>

      {/* -----------------------------------------------
          TOP ELLIPSOIDAL HEAD — EXPLODES UPWARD
      ------------------------------------------------ */}
      <XRayShell
        active={xray}
        explode={[0, 1.2, 0]}
        onClick={onShellClick}
      >
        <group position={[0, 3.225, 0]}>
          <VesselHead top />
        </group>
      </XRayShell>

      {/* -----------------------------------------------
          EXTERNAL NOZZLES AND MANWAY
      ------------------------------------------------ */}
      <XRayShell
        active={xray}
        explode={[0.2, 0, 0]}
        onClick={onShellClick}
      >
        <ExternalNozzles />
      </XRayShell>

      {/* -----------------------------------------------
          INTERNAL SUPPORT STRUCTURE
      ------------------------------------------------ */}
      {detail === "high" && (
        <XRayShell
          active={xray}
          explode={[0, 0.15, 0]}
          onClick={onShellClick}
        >
          <InternalSupports />
        </XRayShell>
      )}

      {/* -----------------------------------------------
          DEMISTER PAD
      ------------------------------------------------ */}
      <FaultPulse
        active={Boolean(faults[sDemister.id])}
        position={sDemister.position}
        radius={0.65}
        label={
          faults[sDemister.id]
            ? {
                title: sDemister.name,
                value: faults[sDemister.id].value,
              }
            : undefined
        }
        showLabel={xray}
        onClick={
          xray
            ? () => onPartClick?.(sDemister.id)
            : undefined
        }
      >
        <group
          position={[0, explode * 0.3, 0]}
          scale={sDemister.scale}
        >
          <DemisterPad
            highlight={Boolean(faults[sDemister.id])}
            detail={detail}
          />
        </group>
      </FaultPulse>

      {/* -----------------------------------------------
          INLET SCREEN
      ------------------------------------------------ */}
      <FaultPulse
        active={Boolean(faults[sScreen.id])}
        position={sScreen.position}
        radius={0.4}
        label={
          faults[sScreen.id]
            ? {
                title: sScreen.name,
                value: faults[sScreen.id].value,
              }
            : undefined
        }
        showLabel={xray}
        onClick={
          xray
            ? () => onPartClick?.(sScreen.id)
            : undefined
        }
      >
        <group
          position={[explode * 0.45, 0, 0]}
          rotation={sScreen.rotation}
          scale={sScreen.scale}
        >
          <Screen
            highlight={Boolean(faults[sScreen.id])}
            detail={detail}
          />
        </group>
      </FaultPulse>

      {/* -----------------------------------------------
          MANWAY GASKET
      ------------------------------------------------ */}
      <FaultPulse
        active={Boolean(faults[sGasket.id])}
        position={sGasket.position}
        radius={0.4}
        label={
          faults[sGasket.id]
            ? {
                title: sGasket.name,
                value: faults[sGasket.id].value,
              }
            : undefined
        }
        showLabel={xray}
        onClick={
          xray
            ? () => onPartClick?.(sGasket.id)
            : undefined
        }
      >
        <group
          position={[explode * 0.3, 0, 0]}
          rotation={sGasket.rotation}
          scale={sGasket.scale}
        >
          <Gasket
            highlight={Boolean(faults[sGasket.id])}
            detail={detail}
          />
        </group>
      </FaultPulse>

      {/* -----------------------------------------------
          MANWAY STUD BOLTS — ONE SLOT, 12 INSTANCES
      ------------------------------------------------ */}
      <FaultPulse
        active={Boolean(faults[sStudbolts.id])}
        position={sStudbolts.position}
        radius={0.5}
        label={
          faults[sStudbolts.id]
            ? {
                title: sStudbolts.name,
                value: faults[sStudbolts.id].value,
              }
            : undefined
        }
        showLabel={xray}
        onClick={
          xray
            ? () => onPartClick?.(sStudbolts.id)
            : undefined
        }
      >
        <group scale={sStudbolts.scale}>
          <ManwayStudboltRing explode={explode} />
        </group>
      </FaultPulse>

      {/* -----------------------------------------------
          BOTTOM DRAIN GATE VALVE
      ------------------------------------------------ */}
      <FaultPulse
        active={Boolean(faults[sDrain.id])}
        position={sDrain.position}
        radius={0.45}
        label={
          faults[sDrain.id]
            ? {
                title: sDrain.name,
                value: faults[sDrain.id].value,
              }
            : undefined
        }
        showLabel={xray}
        onClick={
          xray
            ? () => onPartClick?.(sDrain.id)
            : undefined
        }
      >
        <group
          position={[0, -explode * 0.35, 0]}
          scale={sDrain.scale}
        >
          <ValveGate
            highlight={Boolean(faults[sDrain.id])}
            detail={detail}
          />
        </group>
      </FaultPulse>

      {/* -----------------------------------------------
          MANWAY FLANGE DETAIL
      ------------------------------------------------ */}
      {detail === "high" && (
        <XRayShell
          active={xray}
          explode={[0.3, 0, 0]}
          onClick={onShellClick}
        >
          <group position={[1.0, 1.65, 0]}>
            <ManwayFlange />
          </group>
        </XRayShell>
      )}
    </group>
  );
}