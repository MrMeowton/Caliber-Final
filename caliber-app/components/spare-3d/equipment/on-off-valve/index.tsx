import type { EquipmentProps, SlotDef } from "../../contract";
import { XRayShell, FaultPulse } from "../../core";

import Gasket from "../../parts/gasket";
import ORing from "../../parts/o-ring";
import PackingSet from "../../parts/packing-set";
import SolenoidValve from "../../parts/solenoid-valve";
import Switch from "../../parts/switch";

export const SLOTS: SlotDef[] = [
  {
    id: "solenoid",
    part: "solenoid-valve",
    name: "Solenoid valve",
    position: [-0.72, 2.65, 0.12],
    rotation: [0, 0, Math.PI / 2],
    scale: 0.48,
  },
  {
    id: "limit-switch",
    part: "switch",
    name: "Limit switch box",
    position: [0, 3.55, 0],
    rotation: [0, 0, 0],
    scale: 0.48,
  },
  {
    id: "o-rings",
    part: "o-ring",
    name: "Actuator O-rings",
    position: [0, 2.85, 0],
    rotation: [Math.PI / 2, 0, 0],
    scale: 0.38,
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
    id: "gasket",
    part: "gasket",
    name: "Body gasket",
    position: [0, 0.85, 0],
    rotation: [0, Math.PI / 2, 0],
    scale: 0.58,
  },
];

const C = {
  body: "#71818B",
  bodyLight: "#98A5AC",
  bodyDark: "#46545D",
  metal: "#B5BEC3",
  steel: "#7E8C94",
  flange: "#56656E",
  actuator: "#C18A36",
  actuatorLight: "#D6A64E",
  actuatorDark: "#805A29",
  pneumatic: "#347A91",
  black: "#273139",
  rubber: "#252B30",
  warning: "#E5B64C",
  red: "#B94B43",
  blue: "#3476B8",
};

type Vec3 = [number, number, number];

function Box({
  position,
  size,
  color = C.body,
}: {
  position: Vec3;
  size: Vec3;
  color?: string;
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        metalness={0.62}
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
        metalness={0.76}
        roughness={0.3}
      />
    </mesh>
  );
}

function Torus({
  position,
  radius,
  tube,
  color,
  rotation = [0, 0, 0],
}: {
  position: Vec3;
  radius: number;
  tube: number;
  color: string;
  rotation?: Vec3;
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <torusGeometry args={[radius, tube, 12, 40]} />
      <meshStandardMaterial
        color={color}
        metalness={0.65}
        roughness={0.32}
      />
    </mesh>
  );
}

function Flange({
  position,
  radius = 0.62,
  thickness = 0.2,
}: {
  position: Vec3;
  radius?: number;
  thickness?: number;
}) {
  return (
    <group position={position}>
      <Cylinder
        position={[0, 0, 0]}
        radius={radius}
        height={thickness}
        color={C.flange}
        rotation={[Math.PI / 2, 0, 0]}
      />

      <Cylinder
        position={[0, 0.02, 0]}
        radius={radius * 0.72}
        height={thickness + 0.04}
        color={C.metal}
        rotation={[Math.PI / 2, 0, 0]}
      />

      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <Cylinder
            key={i}
            position={[
              Math.cos(a) * radius * 0.8,
              0,
              Math.sin(a) * radius * 0.8,
            ]}
            radius={0.045}
            height={thickness + 0.08}
            color={C.metal}
            rotation={[Math.PI / 2, 0, 0]}
          />
        );
      })}
    </group>
  );
}

function ValveBody() {
  return (
    <group>
      {/* Main ball valve pressure body */}
      <Cylinder
        position={[0, 0.88, 0]}
        radius={0.66}
        height={1.0}
        color={C.body}
        rotation={[Math.PI / 2, 0, 0]}
      />

      {/* Central valve chamber */}
      <Cylinder
        position={[0, 0.88, 0]}
        radius={0.58}
        height={0.78}
        color={C.bodyLight}
        rotation={[Math.PI / 2, 0, 0]}
      />

      {/* Side flow passages */}
      <Cylinder
        position={[-0.72, 0.88, 0]}
        radius={0.4}
        height={0.7}
        color={C.bodyDark}
        rotation={[0, 0, Math.PI / 2]}
      />

      <Cylinder
        position={[0.72, 0.88, 0]}
        radius={0.4}
        height={0.7}
        color={C.bodyDark}
        rotation={[0, 0, Math.PI / 2]}
      />

      {/* Inlet and outlet flanges */}
      <Flange position={[-1.18, 0.88, 0]} />
      <Flange position={[1.18, 0.88, 0]} />

      {/* Top bonnet connection */}
      <Cylinder
        position={[0, 1.42, 0]}
        radius={0.36}
        height={0.42}
        color={C.bodyDark}
      />

      <Cylinder
        position={[0, 1.58, 0]}
        radius={0.46}
        height={0.15}
        color={C.flange}
      />

      {/* Body lower reinforcement */}
      <Box
        position={[0, 0.34, 0]}
        size={[1.1, 0.16, 0.85]}
        color={C.bodyDark}
      />
    </group>
  );
}

function ValveBonnet() {
  return (
    <group>
      {/* Bonnet neck */}
      <Cylinder
        position={[0, 1.67, 0]}
        radius={0.3}
        height={0.46}
        color={C.body}
      />

      {/* Bonnet upper flange */}
      <Cylinder
        position={[0, 1.9, 0]}
        radius={0.43}
        height={0.14}
        color={C.flange}
      />

      {/* Packing chamber cover */}
      <Cylinder
        position={[0, 2.08, 0]}
        radius={0.25}
        height={0.24}
        color={C.bodyDark}
      />

      {/* Gland follower */}
      <Cylinder
        position={[0, 2.2, 0]}
        radius={0.29}
        height={0.1}
        color={C.metal}
      />

      {/* Bonnet studs */}
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <group
            key={i}
            position={[
              Math.cos(a) * 0.37,
              1.94,
              Math.sin(a) * 0.37,
            ]}
          >
            <Cylinder
              position={[0, 0.08, 0]}
              radius={0.032}
              height={0.25}
              color={C.metal}
            />
            <Cylinder
              position={[0, 0.22, 0]}
              radius={0.06}
              height={0.06}
              color={C.steel}
            />
          </group>
        );
      })}
    </group>
  );
}

function BallAndStem() {
  return (
    <group>
      {/* Valve stem */}
      <Cylinder
        position={[0, 2.25, 0]}
        radius={0.075}
        height={0.85}
        color={C.metal}
      />

      {/* Stem coupling */}
      <Cylinder
        position={[0, 2.65, 0]}
        radius={0.14}
        height={0.18}
        color={C.steel}
      />

      {/* Ball element */}
      <mesh
        position={[0, 0.88, 0]}
        castShadow
      >
        <sphereGeometry args={[0.44, 32, 24]} />
        <meshStandardMaterial
          color={C.steel}
          metalness={0.85}
          roughness={0.2}
        />
      </mesh>

      {/* Ball bore */}
      <Cylinder
        position={[0, 0.88, 0]}
        radius={0.23}
        height={1.0}
        color={C.black}
        rotation={[Math.PI / 2, 0, 0]}
      />

      {/* Ball stem connection */}
      <Cylinder
        position={[0, 1.35, 0]}
        radius={0.12}
        height={0.3}
        color={C.metal}
      />
    </group>
  );
}

function PneumaticActuator() {
  return (
    <group>
      {/* Actuator mounting adapter */}
      <Cylinder
        position={[0, 2.72, 0]}
        radius={0.36}
        height={0.2}
        color={C.flange}
      />

      {/* Main pneumatic actuator housing */}
      <Box
        position={[0, 3.08, 0]}
        size={[1.35, 0.65, 0.95]}
        color={C.actuator}
      />

      {/* Upper cover */}
      <Box
        position={[0, 3.43, 0]}
        size={[1.28, 0.09, 0.9]}
        color={C.actuatorLight}
      />

      {/* Lower actuator casing */}
      <Box
        position={[0, 2.72, 0]}
        size={[1.18, 0.12, 0.82]}
        color={C.actuatorDark}
      />

      {/* Side pneumatic chamber covers */}
      {[-0.73, 0.73].map((x) => (
        <group key={x} position={[x, 3.08, 0]}>
          <Cylinder
            position={[0, 0, 0]}
            radius={0.29}
            height={0.13}
            color={C.actuatorDark}
            rotation={[0, 0, Math.PI / 2]}
          />

          <Cylinder
            position={[x > 0 ? 0.08 : -0.08, 0, 0]}
            radius={0.23}
            height={0.06}
            color={C.actuatorLight}
            rotation={[0, 0, Math.PI / 2]}
          />
        </group>
      ))}

      {/* Pneumatic air connection ports */}
      {[-0.4, 0.4].map((x) => (
        <group key={x} position={[x, 3.46, 0.2]}>
          <Cylinder
            position={[0, 0.1, 0]}
            radius={0.07}
            height={0.2}
            color={C.metal}
          />
          <Cylinder
            position={[0, 0.21, 0]}
            radius={0.1}
            height={0.06}
            color={C.pneumatic}
          />
        </group>
      ))}

      {/* Pneumatic actuator position indicator */}
      <Cylinder
        position={[0, 3.54, 0]}
        radius={0.13}
        height={0.13}
        color={C.black}
      />

      <Cylinder
        position={[0, 3.63, 0]}
        radius={0.08}
        height={0.08}
        color={C.warning}
      />

      {/* Side mounting brackets */}
      {[-0.53, 0.53].map((x) => (
        <Box
          key={x}
          position={[x, 2.63, 0]}
          size={[0.12, 0.24, 0.65]}
          color={C.steel}
        />
      ))}
    </group>
  );
}

function PneumaticTubing() {
  return (
    <group>
      {/* Air tubing, simplified as rigid tube segments */}
      <Cylinder
        position={[-0.55, 2.95, 0.42]}
        radius={0.035}
        height={0.45}
        color={C.pneumatic}
        rotation={[0, 0, Math.PI / 2]}
      />

      <Cylinder
        position={[-0.78, 3.15, 0.42]}
        radius={0.035}
        height={0.4}
        color={C.pneumatic}
      />

      <Cylinder
        position={[0.52, 2.95, 0.42]}
        radius={0.035}
        height={0.45}
        color={C.pneumatic}
        rotation={[0, 0, Math.PI / 2]}
      />
    </group>
  );
}

function LimitSwitchHousing() {
  return (
    <group>
      <Box
        position={[0, 0, 0]}
        size={[0.46, 0.35, 0.35]}
        color={C.actuatorDark}
      />

      <Box
        position={[0, 0.19, 0]}
        size={[0.4, 0.06, 0.29]}
        color={C.actuatorLight}
      />

      <Cylinder
        position={[0, 0.23, 0]}
        radius={0.08}
        height={0.12}
        color={C.black}
      />
    </group>
  );
}

function BaseSkid() {
  return (
    <group position={[0, 0.1, 0]}>
      <Box
        position={[0, 0, 0]}
        size={[2.9, 0.2, 1.45]}
        color={C.black}
      />

      <Box
        position={[0, 0.14, 0]}
        size={[2.7, 0.08, 1.3]}
        color={C.flange}
      />

      {[-1, 1].map((x) => (
        <Box
          key={x}
          position={[x, -0.1, 0]}
          size={[0.2, 0.22, 1.6]}
          color={C.black}
        />
      ))}

      {/* Valve support feet */}
      {[-0.38, 0.38].map((x) => (
        <Box
          key={x}
          position={[x, 0.26, 0]}
          size={[0.18, 0.28, 0.5]}
          color={C.steel}
        />
      ))}
    </group>
  );
}

export default function OnOffValve({
  xray = false,
  explode = 0,
  faults = {},
  onShellClick,
  onPartClick,
  detail = "high",
}: EquipmentProps) {
  const shellOffset = explode * 0.7;
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
      {/* BASE SKID — REMAINS SOLID IN X-RAY */}
      <BaseSkid />

      {/* MAIN PRESSURE VALVE BODY */}
      <XRayShell
        active={xray}
        explode={[0, -shellOffset * 0.3, 0]}
        onClick={onShellClick}
      >
        <group>
          <ValveBody />
        </group>
      </XRayShell>

      {/* BONNET AND GLAND HOUSING */}
      <XRayShell
        active={xray}
        explode={[0, shellOffset * 0.45, 0]}
        onClick={onShellClick}
      >
        <group>
          <ValveBonnet />
        </group>
      </XRayShell>

      {/* PNEUMATIC ACTUATOR CASING */}
      <XRayShell
        active={xray}
        explode={[0, shellOffset * 0.75, 0]}
        onClick={onShellClick}
      >
        <group>
          <PneumaticActuator />
        </group>
      </XRayShell>

      {/* ACTUATOR PNEUMATIC TUBING */}
      {detail === "high" && (
        <XRayShell
          active={xray}
          explode={[shellOffset * 0.4, 0, shellOffset * 0.4]}
          onClick={onShellClick}
        >
          <PneumaticTubing />
        </XRayShell>
      )}

      {/* INTERNAL BALL AND STEM */}
      {detail === "high" && (
        <XRayShell
          active={xray}
          explode={[0, -shellOffset * 0.2, 0]}
          onClick={onShellClick}
        >
          <BallAndStem />
        </XRayShell>
      )}

      {/* SOLENOID VALVE */}
      {detail === "high" &&
        renderSlot(
          0,
          <SolenoidValve
            highlight={Boolean(faults.solenoid)}
            detail={detail}
          />,
          0.4,
          [-partOffset, 0, 0]
        )}

      {/* LIMIT SWITCH BOX */}
      {detail === "high" &&
        renderSlot(
          1,
          <Switch
            highlight={Boolean(faults["limit-switch"])}
            detail={detail}
          />,
          0.35,
          [0, partOffset, 0]
        )}

      {/* ACTUATOR O-RINGS — REPEATED SEALS */}
      {detail === "high" &&
        renderSlot(
          2,
          <>
            {[-0.18, 0, 0.18].map((x) => (
              <group key={x} position={[x, 0, 0]}>
                <ORing
                  highlight={Boolean(faults["o-rings"])}
                  detail={detail}
                />
              </group>
            ))}
          </>,
          0.35,
          [partOffset, 0, 0]
        )}

      {/* STEM PACKING SET */}
      {detail === "high" &&
        renderSlot(
          3,
          <PackingSet
            highlight={Boolean(faults.packing)}
            detail={detail}
          />,
          0.4,
          [0, -partOffset, 0]
        )}

      {/* BODY GASKETS — INLET AND OUTLET */}
      {detail === "high" &&
        renderSlot(
          4,
          <>
            {[-0.48, 0.48].map((x) => (
              <group key={x} position={[x, 0, 0]}>
                <Gasket
                  highlight={Boolean(faults.gasket)}
                  detail={detail}
                />
              </group>
            ))}
          </>,
          0.5,
          [0, 0, partOffset]
        )}

      {/* LOW DETAIL: ONLY KEY SHUTDOWN COMPONENTS */}
      {detail === "low" && (
        <>
          {renderSlot(
            0,
            <SolenoidValve
              highlight={Boolean(faults.solenoid)}
              detail="low"
            />,
            0.4,
            [0, 0, 0]
          )}

          {renderSlot(
            1,
            <Switch
              highlight={Boolean(faults["limit-switch"])}
              detail="low"
            />,
            0.35,
            [0, 0, 0]
          )}
        </>
      )}
    </group>
  );
}