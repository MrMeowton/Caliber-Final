import type { EquipmentProps, SlotDef } from "../../contract";
import { XRayShell, FaultPulse } from "../../core";

import Gasket from "../../parts/gasket";
import Grease from "../../parts/grease";
import PackingSet from "../../parts/packing-set";
import Switch from "../../parts/switch";

export const SLOTS: SlotDef[] = [
  {
    id: "limit-switch",
    part: "switch",
    name: "Limit/torque switch",
    position: [0, 3.35, 0],
    rotation: [0, 0, 0],
    scale: 0.48,
  },
  {
    id: "packing",
    part: "packing-set",
    name: "Stem packing",
    position: [0, 1.65, 0],
    rotation: [0, 0, 0],
    scale: 0.38,
  },
  {
    id: "grease",
    part: "grease",
    name: "Gearbox grease",
    position: [0, 3.05, 0],
    rotation: [0, 0, 0],
    scale: 0.4,
  },
  {
    id: "gasket",
    part: "gasket",
    name: "Bonnet gasket",
    position: [0, 1.25, 0],
    rotation: [0, 0, 0],
    scale: 0.55,
  },
];

const C = {
  body: "#687985",
  bodyLight: "#8999A3",
  bodyDark: "#3F4D57",
  metal: "#AEB8BD",
  steel: "#77858D",
  flange: "#53616A",
  actuator: "#315B78",
  actuatorLight: "#497D9C",
  actuatorDark: "#243F55",
  warning: "#E2A83B",
  black: "#242D33",
  white: "#D9E0E3",
  red: "#B84B43",
};

type Vec3 = [number, number, number];

function Box({
  position,
  size,
  color = C.body,
  radius,
}: {
  position: Vec3;
  size: Vec3;
  color?: string;
  radius?: number;
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        metalness={0.65}
        roughness={0.38}
      />
    </mesh>
  );
}

function Cylinder({
  position,
  radius,
  height,
  color = C.metal,
  rotation = [0, 0, 0],
  segments = 32,
}: {
  position: Vec3;
  radius: number;
  height: number;
  color?: string;
  rotation?: Vec3;
  segments?: number;
}) {
  return (
    <mesh
      position={position}
      rotation={rotation}
      castShadow
      receiveShadow
    >
      <cylinderGeometry args={[radius, radius, height, segments]} />
      <meshStandardMaterial
        color={color}
        metalness={0.78}
        roughness={0.3}
      />
    </mesh>
  );
}

function Flange({
  position,
  radius = 0.68,
  thickness = 0.2,
  holeRadius = 0.07,
  color = C.flange,
}: {
  position: Vec3;
  radius?: number;
  thickness?: number;
  holeRadius?: number;
  color?: string;
}) {
  return (
    <group position={position}>
      <Cylinder
        position={[0, 0, 0]}
        radius={radius}
        height={thickness}
        color={color}
        rotation={[Math.PI / 2, 0, 0]}
      />

      <Cylinder
        position={[0, 0.015, 0]}
        radius={radius * 0.72}
        height={thickness + 0.025}
        color={C.metal}
        rotation={[Math.PI / 2, 0, 0]}
      />

      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <group
            key={i}
            position={[
              Math.cos(a) * radius * 0.79,
              0,
              Math.sin(a) * radius * 0.79,
            ]}
          >
            <Cylinder
              position={[0, 0, 0]}
              radius={holeRadius}
              height={thickness + 0.06}
              color={C.metal}
              rotation={[Math.PI / 2, 0, 0]}
            />
          </group>
        );
      })}
    </group>
  );
}

function ValveBody() {
  return (
    <group>
      {/* Main pressure-containing valve body */}
      <Cylinder
        position={[0, 0.83, 0]}
        radius={0.82}
        height={1.05}
        color={C.body}
        rotation={[Math.PI / 2, 0, 0]}
      />

      {/* Central valve chamber */}
      <Cylinder
        position={[0, 0.83, 0]}
        radius={0.68}
        height={0.9}
        color={C.bodyLight}
        rotation={[Math.PI / 2, 0, 0]}
      />

      {/* Main vertical bonnet connection */}
      <Cylinder
        position={[0, 1.48, 0]}
        radius={0.42}
        height={0.5}
        color={C.bodyDark}
      />

      <Cylinder
        position={[0, 1.65, 0]}
        radius={0.48}
        height={0.18}
        color={C.flange}
      />

      {/* Bonnet neck */}
      <Cylinder
        position={[0, 1.86, 0]}
        radius={0.31}
        height={0.42}
        color={C.bodyLight}
      />

      {/* Flow passage representation */}
      <Cylinder
        position={[-0.55, 0.83, 0]}
        radius={0.42}
        height={0.5}
        color={C.bodyDark}
        rotation={[0, 0, Math.PI / 2]}
      />

      <Cylinder
        position={[0.55, 0.83, 0]}
        radius={0.42}
        height={0.5}
        color={C.bodyDark}
        rotation={[0, 0, Math.PI / 2]}
      />

      {/* Flanged pipe connections */}
      <Flange
        position={[-1.15, 0.83, 0]}
        radius={0.64}
        thickness={0.2}
      />

      <Flange
        position={[1.15, 0.83, 0]}
        radius={0.64}
        thickness={0.2}
      />

      {/* Bonnet mounting flange */}
      <Cylinder
        position={[0, 1.63, 0]}
        radius={0.56}
        height={0.17}
        color={C.flange}
      />
    </group>
  );
}

function ValveBodyReinforcement() {
  return (
    <group>
      {[-0.52, 0.52].map((x) => (
        <Box
          key={x}
          position={[x, 0.83, 0]}
          size={[0.12, 0.9, 0.95]}
          color={C.bodyDark}
        />
      ))}

      <Box
        position={[0, 0.83, 0]}
        size={[0.8, 0.1, 0.8]}
        color={C.bodyLight}
      />
    </group>
  );
}

function BonnetAssembly() {
  return (
    <group>
      {/* Bonnet housing */}
      <Cylinder
        position={[0, 1.95, 0]}
        radius={0.36}
        height={0.52}
        color={C.body}
      />

      {/* Packing chamber */}
      <Cylinder
        position={[0, 2.18, 0]}
        radius={0.3}
        height={0.14}
        color={C.bodyDark}
      />

      {/* Bonnet gland follower */}
      <Cylinder
        position={[0, 2.27, 0]}
        radius={0.27}
        height={0.12}
        color={C.metal}
      />

      {/* Bonnet studs */}
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <group
            key={i}
            position={[
              Math.cos(a) * 0.46,
              1.75,
              Math.sin(a) * 0.46,
            ]}
          >
            <Cylinder
              position={[0, 0.18, 0]}
              radius={0.035}
              height={0.42}
              color={C.metal}
            />
            <Cylinder
              position={[0, 0.4, 0]}
              radius={0.07}
              height={0.08}
              color={C.steel}
            />
          </group>
        );
      })}
    </group>
  );
}

function StemAssembly() {
  return (
    <group>
      {/* Rising stem */}
      <Cylinder
        position={[0, 2.75, 0]}
        radius={0.075}
        height={1.45}
        color={C.metal}
      />

      {/* Stem coupling */}
      <Cylinder
        position={[0, 3.25, 0]}
        radius={0.16}
        height={0.24}
        color={C.steel}
      />

      <Cylinder
        position={[0, 3.4, 0]}
        radius={0.12}
        height={0.1}
        color={C.metal}
      />
    </group>
  );
}

function GateAssembly() {
  return (
    <group>
      {/* Gate plate */}
      <Box
        position={[0, 0.9, 0]}
        size={[0.75, 0.92, 0.12]}
        color={C.steel}
      />

      {/* Gate plate reinforcement */}
      <Box
        position={[0, 1.32, 0]}
        size={[0.58, 0.12, 0.16]}
        color={C.metal}
      />

      {/* Gate connection */}
      <Box
        position={[0, 1.45, 0]}
        size={[0.16, 0.35, 0.16]}
        color={C.bodyDark}
      />
    </group>
  );
}

function ActuatorHousing() {
  return (
    <group>
      {/* Actuator gearbox base */}
      <Cylinder
        position={[0, 3.03, 0]}
        radius={0.48}
        height={0.35}
        color={C.actuatorDark}
      />

      {/* Main electric actuator gearbox */}
      <Box
        position={[0, 3.45, 0]}
        size={[1.05, 0.76, 0.82]}
        color={C.actuator}
      />

      {/* Upper gearbox cap */}
      <Box
        position={[0, 3.85, 0]}
        size={[0.95, 0.1, 0.74]}
        color={C.actuatorLight}
      />

      {/* Motor housing */}
      <Cylinder
        position={[0, 3.95, 0]}
        radius={0.3}
        height={0.42}
        color={C.actuatorDark}
      />

      {/* Motor top cap */}
      <Cylinder
        position={[0, 4.17, 0]}
        radius={0.32}
        height={0.08}
        color={C.actuatorLight}
      />

      {/* Motor cooling fins */}
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <Box
            key={i}
            position={[
              Math.cos(a) * 0.29,
              3.96,
              Math.sin(a) * 0.29,
            ]}
            size={[0.07, 0.35, 0.07]}
            color={C.steel}
          />
        );
      })}

      {/* Manual handwheel gearbox side housing */}
      <Box
        position={[0.65, 3.45, 0]}
        size={[0.3, 0.48, 0.42]}
        color={C.actuatorDark}
      />

      {/* Handwheel axle */}
      <Cylinder
        position={[0.85, 3.45, 0]}
        radius={0.09}
        height={0.3}
        color={C.metal}
        rotation={[0, 0, Math.PI / 2]}
      />

      {/* Handwheel */}
      <group position={[1.02, 3.45, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.32, 0.035, 10, 32]} />
          <meshStandardMaterial
            color={C.metal}
            metalness={0.8}
            roughness={0.25}
          />
        </mesh>

        <Cylinder
          position={[0, 0, 0]}
          radius={0.075}
          height={0.12}
          color={C.steel}
          rotation={[0, 0, Math.PI / 2]}
        />

        {Array.from({ length: 4 }, (_, i) => {
          const a = (i / 4) * Math.PI * 2;
          return (
            <Box
              key={i}
              position={[
                Math.cos(a) * 0.16,
                0,
                Math.sin(a) * 0.16,
              ]}
              size={[0.32, 0.05, 0.05]}
              color={C.metal}
            />
          );
        })}
      </group>

      {/* Actuator terminal cover */}
      <Box
        position={[-0.58, 3.48, 0]}
        size={[0.12, 0.4, 0.52]}
        color={C.actuatorLight}
      />

      {/* Electrical cable entry */}
      <Cylinder
        position={[-0.63, 3.18, 0.18]}
        radius={0.09}
        height={0.2}
        color={C.metal}
      />
    </group>
  );
}

function MountingBracket() {
  return (
    <group>
      <Box
        position={[0, 2.78, 0]}
        size={[0.72, 0.14, 0.65]}
        color={C.flange}
      />

      {[-0.23, 0.23].map((x) => (
        <Box
          key={x}
          position={[x, 2.9, 0]}
          size={[0.1, 0.25, 0.5]}
          color={C.steel}
        />
      ))}
    </group>
  );
}

function BaseSkid() {
  return (
    <group position={[0, 0.1, 0]}>
      <Box
        position={[0, 0, 0]}
        size={[2.9, 0.2, 1.5]}
        color={C.black}
      />

      <Box
        position={[0, 0.14, 0]}
        size={[2.7, 0.09, 1.35]}
        color={C.flange}
      />

      {[-1, 1].map((x) => (
        <Box
          key={x}
          position={[x, -0.11, 0]}
          size={[0.2, 0.22, 1.65]}
          color={C.black}
        />
      ))}

      {/* Valve body support legs */}
      {[-0.42, 0.42].map((x) => (
        <Box
          key={x}
          position={[x, 0.28, 0]}
          size={[0.2, 0.35, 0.55]}
          color={C.steel}
        />
      ))}
    </group>
  );
}

export default function MotorOperatedValve({
  xray = false,
  explode = 0,
  faults = {},
  onShellClick,
  onPartClick,
  detail = "high",
}: EquipmentProps) {
  const shellOffset = explode * 0.65;
  const partOffset = explode * 0.3;

  const renderSlot = (
    index: number,
    children: React.ReactNode,
    radius: number,
    offset: Vec3
  ) => {
    const s = SLOTS[index];
    const fault = faults[s.id];

    return (
      <FaultPulse
        key={s.id}
        active={Boolean(fault)}
        position={s.position}
        radius={radius}
        label={
          fault
            ? {
                title: s.name,
                value: fault.value,
              }
            : undefined
        }
        showLabel={xray}
        onClick={
          xray
            ? () => onPartClick?.(s.id)
            : undefined
        }
      >
        <group
          position={[
            offset[0] * explode,
            offset[1] * explode,
            offset[2] * explode,
          ]}
          rotation={s.rotation}
          scale={s.scale}
        >
          {children}
        </group>
      </FaultPulse>
    );
  };

  return (
    <group>
      {/* BASE SKID — SOLID DURING X-RAY */}
      <BaseSkid />

      {/* MAIN VALVE BODY */}
      <XRayShell
        active={xray}
        explode={[0, -shellOffset * 0.3, 0]}
        onClick={onShellClick}
      >
        <group position={[0, 0.45, 0]}>
          <ValveBody />
          {detail === "high" && <ValveBodyReinforcement />}
        </group>
      </XRayShell>

      {/* BONNET AND STEM SUPPORT HOUSING */}
      <XRayShell
        active={xray}
        explode={[0, shellOffset * 0.35, 0]}
        onClick={onShellClick}
      >
        <group>
          <BonnetAssembly />
          <MountingBracket />
        </group>
      </XRayShell>

      {/* INTERNAL RISING STEM */}
      <XRayShell
        active={xray}
        explode={[0, shellOffset * 0.6, 0]}
        onClick={onShellClick}
      >
        <group>
          {detail === "high" && <StemAssembly />}
          {detail === "high" && <GateAssembly />}
        </group>
      </XRayShell>

      {/* ELECTRIC ACTUATOR / GEARBOX CASING */}
      <XRayShell
        active={xray}
        explode={[shellOffset * 0.45, shellOffset * 0.7, 0]}
        onClick={onShellClick}
      >
        <group>
          <ActuatorHousing />
        </group>
      </XRayShell>

      {/* SLOT 1 — LIMIT / TORQUE SWITCH */}
      {detail === "high" &&
        renderSlot(
          0,
          <Switch
            highlight={Boolean(faults["limit-switch"])}
            detail={detail}
          />,
          0.4,
          [0, partOffset, 0]
        )}

      {/* SLOT 2 — STEM PACKING */}
      {detail === "high" &&
        renderSlot(
          1,
          <PackingSet
            highlight={Boolean(faults.packing)}
            detail={detail}
          />,
          0.4,
          [0, -partOffset, 0]
        )}

      {/* SLOT 3 — GEARBOX GREASE */}
      {detail === "high" &&
        renderSlot(
          2,
          <Grease
            highlight={Boolean(faults.grease)}
            detail={detail}
          />,
          0.35,
          [partOffset, 0, 0]
        )}

      {/* SLOT 4 — BONNET GASKET */}
      {detail === "high" &&
        renderSlot(
          3,
          <Gasket
            highlight={Boolean(faults.gasket)}
            detail={detail}
          />,
          0.35,
          [0, -partOffset, 0]
        )}

      {/* LOW DETAIL: KEEP ONLY THE MOST IMPORTANT INTERNAL COMPONENT */}
      {detail === "low" &&
        renderSlot(
          1,
          <PackingSet
            highlight={Boolean(faults.packing)}
            detail="low"
          />,
          0.4,
          [0, 0, 0]
        )}
    </group>
  );
}