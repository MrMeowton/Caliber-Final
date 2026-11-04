
import * as THREE from "three";
import type { EquipmentProps, SlotDef } from "../../contract";
import { XRayShell, FaultPulse } from "../../core";

import Connector from "../../parts/connector";
import Gland from "../../parts/gland";
import TransmitterPart from "../../parts/transmitter";
import Tubing from "../../parts/tubing";
import ValveNeedle from "../../parts/valve-needle";

export const SLOTS: SlotDef[] = [
  {
    id: "transmitter",
    part: "transmitter",
    name: "Transmitter",
    position: [0, 2.65, 0],
    scale: 1.2,
  },
  {
    id: "manifold-valve",
    part: "valve-needle",
    name: "Manifold needle valve",
    position: [0, 1.15, 0],
    scale: 0.75,
  },
  {
    id: "tubing",
    part: "tubing",
    name: "Impulse tubing",
    position: [0, 1.65, 0.25],
    scale: 1.0,
  },
  {
    id: "connector",
    part: "connector",
    name: "Tube connector",
    position: [0.7, 1.65, 0.25],
    scale: 0.5,
  },
  {
    id: "gland",
    part: "gland",
    name: "Cable gland",
    position: [1.0, 2.65, 0],
    scale: 0.55,
  },
];

const C = {
  steel: "#aab4bb",
  brightSteel: "#cbd1d5",
  darkSteel: "#3d4850",
  housing: "#527f99",
  housingDark: "#365a70",
  black: "#202a31",
  glass: "#9bcbd8",
  yellow: "#c5a34d",
};

type Vec3 = [number, number, number];

function Cylinder({
  radius = 0.1,
  length = 0.2,
  color = C.steel,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: {
  radius?: number;
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
      <cylinderGeometry args={[radius, radius, length, 32]} />
      <meshStandardMaterial
        color={color}
        metalness={0.78}
        roughness={0.3}
      />
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
      <meshStandardMaterial
        color={color}
        metalness={0.72}
        roughness={0.32}
      />
    </mesh>
  );
}

function BoltRing({
  radius,
  count,
  y,
}: {
  radius: number;
  count: number;
  y: number;
}) {
  return (
    <group>
      {Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2;

        return (
          <Cylinder
            key={i}
            radius={0.035}
            length={0.045}
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
   PHASE 1 — FIXED MOUNTING BASE
====================================================== */

function MountingBase() {
  return (
    <group>
      <Box
        size={[1.8, 0.14, 1.35]}
        position={[0, 0.07, 0]}
        color={C.darkSteel}
      />

      <Box
        size={[1.1, 0.15, 0.9]}
        position={[0, 0.2, 0]}
        color={C.brightSteel}
      />

      <Box
        size={[0.95, 0.15, 0.65]}
        position={[0, 0.37, 0]}
        color={C.darkSteel}
      />

      {[-0.72, 0.72].map((x) =>
        [-0.48, 0.48].map((z) => (
          <Cylinder
            key={`${x}-${z}`}
            radius={0.07}
            length={0.07}
            color={C.brightSteel}
            position={[x, 0.17, z]}
          />
        )),
      )}
    </group>
  );
}

/* ======================================================
   PHASE 2 — TRANSMITTER ELECTRONICS HOUSING
====================================================== */

function ElectronicsHousing() {
  return (
    <group>
      {/* Main cylindrical enclosure */}
      <Cylinder
        radius={0.64}
        length={0.95}
        color={C.housing}
      />

      {/* Lower neck */}
      <Cylinder
        radius={0.34}
        length={0.24}
        color={C.brightSteel}
        position={[0, -0.59, 0]}
      />

      {/* Neck flange */}
      <Cylinder
        radius={0.43}
        length={0.09}
        color={C.darkSteel}
        position={[0, -0.46, 0]}
      />

      {/* Cover thread collar */}
      <Cylinder
        radius={0.67}
        length={0.13}
        color={C.darkSteel}
        position={[0, 0.52, 0]}
      />

      {/* Cooling ribs */}
      {Array.from({ length: 5 }, (_, i) => (
        <Cylinder
          key={i}
          radius={0.65}
          length={0.035}
          color={C.housingDark}
          position={[0, -0.32 + i * 0.14, 0]}
        />
      ))}

      {/* Front display bezel */}
      <Cylinder
        radius={0.25}
        length={0.09}
        color={C.darkSteel}
        position={[0, 0.02, 0.64]}
        rotation={[Math.PI / 2, 0, 0]}
      />

      {/* LCD screen */}
      <mesh position={[0, 0.02, 0.695]}>
        <circleGeometry args={[0.19, 32]} />
        <meshStandardMaterial
          color={C.glass}
          emissive="#24596c"
          emissiveIntensity={0.35}
          roughness={0.2}
        />
      </mesh>

      {/* LCD markings */}
      <Box
        size={[0.14, 0.012, 0.008]}
        position={[0, 0.07, 0.702]}
        color={C.black}
      />

      <Box
        size={[0.09, 0.012, 0.008]}
        position={[0, 0.025, 0.702]}
        color={C.black}
      />

      {/* Cable entry boss */}
      <Cylinder
        radius={0.19}
        length={0.27}
        color={C.brightSteel}
        position={[0.76, -0.23, 0]}
        rotation={[0, 0, Math.PI / 2]}
      />

      <Cylinder
        radius={0.15}
        length={0.07}
        color={C.darkSteel}
        position={[0.91, -0.23, 0]}
        rotation={[0, 0, Math.PI / 2]}
      />

      <BoltRing radius={0.66} count={8} y={0.48} />
    </group>
  );
}

/* ======================================================
   PHASE 3 — REMOVABLE HEAD COVER
====================================================== */

function ElectronicsCover() {
  return (
    <group>
      {/* Main cover */}
      <Cylinder
        radius={0.65}
        length={0.17}
        color={C.brightSteel}
      />

      {/* Outer rim */}
      <Cylinder
        radius={0.69}
        length={0.055}
        color={C.darkSteel}
        position={[0, -0.095, 0]}
      />

      {/* Cover grip */}
      <Cylinder
        radius={0.23}
        length={0.07}
        color={C.darkSteel}
        position={[0, 0.12, 0]}
      />

      {/* Grip slots */}
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2;

        return (
          <Box
            key={i}
            size={[0.035, 0.025, 0.13]}
            position={[
              Math.cos(a) * 0.47,
              0.015,
              Math.sin(a) * 0.47,
            ]}
            color={C.darkSteel}
          />
        );
      })}

      <BoltRing radius={0.66} count={8} y={-0.1} />
    </group>
  );
}

/* ======================================================
   PHASE 4 — MANIFOLD ASSEMBLY
====================================================== */

function ManifoldAssembly() {
  return (
    <group>
      {/* Manifold block */}
      <Box
        size={[0.9, 0.25, 0.43]}
        position={[0, 0, 0]}
        color={C.darkSteel}
      />

      {/* Valve ports */}
      {[-0.31, 0, 0.31].map((x) => (
        <group key={x} position={[x, 0.15, 0]}>
          <Cylinder
            radius={0.105}
            length={0.22}
            color={C.brightSteel}
          />

          <Cylinder
            radius={0.07}
            length={0.12}
            color={C.darkSteel}
            position={[0, 0.15, 0]}
          />
        </group>
      ))}

      {/* Side flanges */}
      {[-0.49, 0.49].map((x) => (
        <Cylinder
          key={x}
          radius={0.16}
          length={0.08}
          color={C.brightSteel}
          position={[x, 0, 0]}
          rotation={[0, 0, Math.PI / 2]}
        />
      ))}

      {/* Process port */}
      <Cylinder
        radius={0.12}
        length={0.18}
        color={C.brightSteel}
        position={[0, -0.19, 0.24]}
      />
    </group>
  );
}

/* ======================================================
   PHASE 5 — MAIN TRANSMITTER ASSEMBLY
====================================================== */

export default function Transmitter({
  xray = false,
  explode = 0,
  faults = {},
  onShellClick,
  onPartClick,
  detail = "high",
}: EquipmentProps) {
  const sTransmitter = SLOTS[0];
  const sValve = SLOTS[1];
  const sTubing = SLOTS[2];
  const sConnector = SLOTS[3];
  const sGland = SLOTS[4];

  const low = detail === "low";

  return (
    <group>
      {/* Fixed base */}
      <MountingBase />

      {/* Electronics housing shell */}
      <XRayShell
        active={xray}
        explode={[0, 0, 0]}
        onClick={onShellClick}
      >
        <group position={[0, 2.65, 0]}>
          <ElectronicsHousing />
        </group>
      </XRayShell>

      {/* Removable electronics cover */}
      <XRayShell
        active={xray}
        explode={[0.65 * explode, 0.55 * explode, 0]}
        onClick={onShellClick}
      >
        <group position={[0, 3.29, 0]}>
          <ElectronicsCover />
        </group>
      </XRayShell>

      {/* Transmitter internal component */}
      <FaultPulse
        active={Boolean(faults[sTransmitter.id])}
        position={sTransmitter.position}
        radius={0.65}
        label={
          faults[sTransmitter.id]
            ? {
                title: sTransmitter.name,
                value: faults[sTransmitter.id].value,
              }
            : undefined
        }
        showLabel={xray}
        onClick={
          xray
            ? () => onPartClick?.(sTransmitter.id)
            : undefined
        }
      >
        {!low && (
          <group
            position={[-explode * 0.3, 0, 0]}
            scale={sTransmitter.scale}
          >
            <TransmitterPart
              highlight={Boolean(faults[sTransmitter.id])}
              detail={detail}
            />
          </group>
        )}
      </FaultPulse>

      {/* Manifold needle valve */}
      <FaultPulse
        active={Boolean(faults[sValve.id])}
        position={sValve.position}
        radius={0.45}
        label={
          faults[sValve.id]
            ? {
                title: sValve.name,
                value: faults[sValve.id].value,
              }
            : undefined
        }
        showLabel={xray}
        onClick={
          xray
            ? () => onPartClick?.(sValve.id)
            : undefined
        }
      >
        <group
          position={[-explode * 0.35, 0, 0]}
          scale={sValve.scale}
        >
          <ValveNeedle
            highlight={Boolean(faults[sValve.id])}
            detail={detail}
          />
        </group>
      </FaultPulse>

      {/* Impulse tubing */}
      <FaultPulse
        active={Boolean(faults[sTubing.id])}
        position={sTubing.position}
        radius={0.5}
        label={
          faults[sTubing.id]
            ? {
                title: sTubing.name,
                value: faults[sTubing.id].value,
              }
            : undefined
        }
        showLabel={xray}
        onClick={
          xray
            ? () => onPartClick?.(sTubing.id)
            : undefined
        }
      >
        {!low && (
          <group
            position={[0, 0, explode * 0.5]}
            scale={sTubing.scale}
          >
            <Tubing
              highlight={Boolean(faults[sTubing.id])}
              detail={detail}
            />
          </group>
        )}
      </FaultPulse>

      {/* Tube connector */}
      <FaultPulse
        active={Boolean(faults[sConnector.id])}
        position={sConnector.position}
        radius={0.3}
        label={
          faults[sConnector.id]
            ? {
                title: sConnector.name,
                value: faults[sConnector.id].value,
              }
            : undefined
        }
        showLabel={xray}
        onClick={
          xray
            ? () => onPartClick?.(sConnector.id)
            : undefined
        }
      >
        <group
          position={[explode * 0.45, 0, 0]}
          scale={sConnector.scale}
        >
          <Connector
            highlight={Boolean(faults[sConnector.id])}
            detail={detail}
          />
        </group>
      </FaultPulse>

      {/* Cable gland */}
      <FaultPulse
        active={Boolean(faults[sGland.id])}
        position={sGland.position}
        radius={0.32}
        label={
          faults[sGland.id]
            ? {
                title: sGland.name,
                value: faults[sGland.id].value,
              }
            : undefined
        }
        showLabel={xray}
        onClick={
          xray
            ? () => onPartClick?.(sGland.id)
            : undefined
        }
      >
        <group
          position={[explode * 0.4, 0, 0]}
          scale={sGland.scale}
        >
          <Gland
            highlight={Boolean(faults[sGland.id])}
            detail={detail}
          />
        </group>
      </FaultPulse>

      {/* Low-detail manifold representation */}
      {low && (
        <XRayShell
          active={xray}
          explode={[0, -0.15, 0]}
          onClick={onShellClick}
        >
          <group position={[0, 1.15, 0]}>
            <ManifoldAssembly />
          </group>
        </XRayShell>
      )}
    </group>
  );
}
