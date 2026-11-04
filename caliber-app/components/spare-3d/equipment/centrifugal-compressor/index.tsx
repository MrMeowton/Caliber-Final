import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group } from "three";
import type { EquipmentProps, SlotDef } from "../../contract";
import { XRayShell, FaultPulse } from "../../core";

import BearingJournal from "../../parts/bearing-journal";
import BearingThrustPad from "../../parts/bearing-thrust-pad";
import Coupling from "../../parts/coupling";
import FilterElement from "../../parts/filter-element";
import Impeller from "../../parts/impeller";
import Oil from "../../parts/oil";
import SealLabyrinth from "../../parts/seal-labyrinth";
import SealMechanical from "../../parts/seal-mechanical";

/**
 * Centrifugal Compressor / Blower (KC)
 * Naphtha Cracker Process Equipment
 *
 * Approximate real dimensions: 6 x 3 x 3 m
 * Normalised dimensions: 4 x 2 x 2 units
 * Coordinate system: X = shaft axis, Y = vertical, Z = width.
 * Base elevation: Y = 0.
 */

const C = {
  casing: "#718096",
  casingDark: "#465466",
  casingInner: "#344254",
  skid: "#263746",
  steel: "#A8B6C5",
  shaft: "#C6D0DA",
  accent: "#E1A344",
  nozzle: "#8094A8",
  dark: "#182735",
  oil: "#D9A441",
  bolt: "#CBD5E1",
};

const SCALE = 4 / 6;
const S = (v: number) => v * SCALE;

const shaftY = 1.58;

export const SLOTS: SlotDef[] = [
  {
    id: "bearing-de",
    part: "bearing-journal",
    name: "Journal bearing DE",
    position: [-1.0, shaftY, 0],
    rotation: [0, 0, 0],
    scale: 0.36,
  },
  {
    id: "bearing-nde",
    part: "bearing-journal",
    name: "Journal bearing NDE",
    position: [1.0, shaftY, 0],
    rotation: [0, 0, 0],
    scale: 0.36,
  },
  {
    id: "thrust",
    part: "bearing-thrust-pad",
    name: "Thrust bearing",
    position: [1.3, shaftY, 0],
    rotation: [0, 0, 0],
    scale: 0.4,
  },
  {
    id: "impellers",
    part: "impeller",
    name: "Impeller stages",
    position: [0, shaftY, 0],
    rotation: [0, 0, 0],
    scale: 0.82,
  },
  {
    id: "lab-seal",
    part: "seal-labyrinth",
    name: "Labyrinth seals",
    position: [0, shaftY, 0],
    rotation: [0, 0, 0],
    scale: 0.3,
  },
  {
    id: "dry-seal",
    part: "seal-mechanical",
    name: "Shaft end seal",
    position: [0, shaftY, 0],
    rotation: [0, 0, 0],
    scale: 0.35,
  },
  {
    id: "coupling",
    part: "coupling",
    name: "Coupling to driver",
    position: [-1.85, shaftY, 0],
    rotation: [0, 0, 0],
    scale: 0.45,
  },
  {
    id: "lube-filter",
    part: "filter-element",
    name: "Lube oil filter",
    position: [1.45, 0.42, 0.65],
    rotation: [0, 0, 0],
    scale: 0.38,
  },
  {
    id: "lube-oil",
    part: "oil",
    name: "Lube oil sump",
    position: [0, 0.23, 0.55],
    rotation: [0, 0, 0],
    scale: 0.75,
  },
];

function BoltRing({
  x,
  y,
  z,
  count = 12,
  radius = 0.58,
}: {
  x: number;
  y: number;
  z: number;
  count?: number;
  radius?: number;
}) {
  return (
    <group position={[x, y, z]}>
      {Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[0, Math.cos(a) * radius, Math.sin(a) * radius]}
          >
            <cylinderGeometry args={[0.025, 0.025, 0.07, 8]} />
            <meshStandardMaterial color={C.bolt} metalness={0.8} roughness={0.3} />
          </mesh>
        );
      })}
    </group>
  );
}

function CasingLower() {
  return (
    <group>
      {/* Main lower casing body */}
      <mesh position={[0, 1.27, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.9, 0.48, 1.65, 4, 2, 2]} />
        <meshStandardMaterial
          color={C.casing}
          metalness={0.72}
          roughness={0.32}
        />
      </mesh>

      {/* Lower casing end flanges */}
      {[-1.38, 1.38].map((x) => (
        <mesh key={x} position={[x, 1.28, 0]}>
          <boxGeometry args={[0.13, 0.62, 1.83]} />
          <meshStandardMaterial color={C.casingDark} metalness={0.8} />
        </mesh>
      ))}

      {/* Internal casing cavity */}
      <mesh position={[0, 1.52, 0]}>
        <boxGeometry args={[2.65, 0.08, 1.4]} />
        <meshStandardMaterial
          color={C.casingInner}
          metalness={0.5}
          roughness={0.45}
        />
      </mesh>

      {/* Casing support feet */}
      {[-1.1, 1.1].map((x) => (
        <group key={x} position={[x, 0.95, 0]}>
          <mesh>
            <boxGeometry args={[0.35, 0.2, 1.1]} />
            <meshStandardMaterial color={C.casingDark} metalness={0.7} />
          </mesh>
          <mesh position={[0, -0.11, 0]}>
            <boxGeometry args={[0.42, 0.04, 1.2]} />
            <meshStandardMaterial color={C.steel} metalness={0.85} />
          </mesh>
        </group>
      ))}

      <BoltRing x={-1.45} y={1.28} z={0} radius={0.62} />
      <BoltRing x={1.45} y={1.28} z={0} radius={0.62} />
    </group>
  );
}

function CasingUpper() {
  return (
    <group>
      {/* Upper half of horizontally split casing */}
      <mesh position={[0, 1.83, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.9, 0.55, 1.65, 4, 2, 2]} />
        <meshStandardMaterial
          color={C.casing}
          metalness={0.72}
          roughness={0.32}
        />
      </mesh>

      {/* Upper casing reinforcing ribs */}
      {[-1.1, -0.55, 0, 0.55, 1.1].map((x) => (
        <mesh key={x} position={[x, 2.12, 0]}>
          <boxGeometry args={[0.07, 0.06, 1.45]} />
          <meshStandardMaterial color={C.casingDark} metalness={0.7} />
        </mesh>
      ))}

      {/* Upper casing inspection covers */}
      {[-0.85, 0, 0.85].map((x) => (
        <mesh key={x} position={[x, 2.12, 0]}>
          <cylinderGeometry args={[0.17, 0.17, 0.07, 24]} />
          <meshStandardMaterial color={C.steel} metalness={0.8} />
        </mesh>
      ))}

      <BoltRing x={-1.45} y={1.55} z={0} radius={0.62} />
      <BoltRing x={1.45} y={1.55} z={0} radius={0.62} />
    </group>
  );
}

function Nozzles() {
  return (
    <group>
      {/* Suction nozzle: vertical inlet */}
      <group position={[-0.9, 2.05, 0]}>
        <mesh position={[0, 0.28, 0]}>
          <cylinderGeometry args={[0.28, 0.22, 0.56, 32]} />
          <meshStandardMaterial color={C.nozzle} metalness={0.8} roughness={0.28} />
        </mesh>
        <mesh position={[0, 0.57, 0]}>
          <cylinderGeometry args={[0.34, 0.34, 0.08, 32]} />
          <meshStandardMaterial color={C.steel} metalness={0.85} />
        </mesh>
        <mesh position={[0, 0.62, 0]}>
          <torusGeometry args={[0.29, 0.025, 8, 32]} />
          <meshStandardMaterial color={C.bolt} metalness={0.9} />
        </mesh>
      </group>

      {/* Discharge nozzle: upward/outlet */}
      <group position={[0.9, 2.05, 0]}>
        <mesh position={[0, 0.22, 0]}>
          <cylinderGeometry args={[0.2, 0.28, 0.45, 32]} />
          <meshStandardMaterial color={C.nozzle} metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.46, 0]}>
          <cylinderGeometry args={[0.33, 0.33, 0.08, 32]} />
          <meshStandardMaterial color={C.steel} metalness={0.85} />
        </mesh>
      </group>

      {/* Side process connections */}
      {[-1, 1].map((x) => (
        <group key={x} position={[x * 1.42, 1.5, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.19, 0.19, 0.34, 24]} />
            <meshStandardMaterial color={C.nozzle} metalness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function BaseSkid() {
  return (
    <group>
      {/* Longitudinal beams */}
      {[-0.65, 0.65].map((z) => (
        <mesh key={z} position={[0, 0.15, z]}>
          <boxGeometry args={[3.8, 0.22, 0.18]} />
          <meshStandardMaterial color={C.skid} metalness={0.8} roughness={0.35} />
        </mesh>
      ))}

      {/* Cross beams */}
      {[-1.7, -0.85, 0, 0.85, 1.7].map((x) => (
        <mesh key={x} position={[x, 0.15, 0]}>
          <boxGeometry args={[0.18, 0.22, 1.55]} />
          <meshStandardMaterial color={C.steel} metalness={0.75} />
        </mesh>
      ))}

      {/* Foundation pads */}
      {[-1.65, 1.65].map((x) =>
        [-0.65, 0.65].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.035, z]}>
            <boxGeometry args={[0.48, 0.07, 0.38]} />
            <meshStandardMaterial color={C.dark} metalness={0.6} />
          </mesh>
        )),
      )}

      {/* Lube console support */}
      <mesh position={[1.35, 0.4, 0.65]}>
        <boxGeometry args={[0.85, 0.42, 0.72]} />
        <meshStandardMaterial color={C.casingDark} metalness={0.7} />
      </mesh>

      {/* Filter housing */}
      <mesh position={[1.35, 0.72, 0.65]}>
        <cylinderGeometry args={[0.19, 0.19, 0.3, 24]} />
        <meshStandardMaterial color={C.steel} metalness={0.8} />
      </mesh>
    </group>
  );
}

function Shaft({ explode }: { explode: number }) {
  const shaftRef = useRef<Group>(null);

  useFrame((_, delta) => {
    if (shaftRef.current) {
      shaftRef.current.rotation.x += delta * 0.12;
    }
  });

  return (
    <group
      ref={shaftRef}
      position={[0, shaftY, 0]}
      scale={1}
    >
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.105, 0.105, 3.2, 24]} />
        <meshStandardMaterial color={C.shaft} metalness={0.92} roughness={0.2} />
      </mesh>

      {/* Shaft collars */}
      {[-1.2, -0.6, 0.6, 1.2].map((x) => (
        <mesh key={x} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.15, 0.15, 0.08, 24]} />
          <meshStandardMaterial color={C.steel} metalness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function InternalStages({
  explode,
  detail,
}: {
  explode: number;
  detail: "low" | "medium" | "high";
}) {
  if (detail === "low") return null;

  return (
    <group>
      {/* Multiple impeller stages, represented by one logical slot */}
      {[-0.65, 0, 0.65].map((x, i) => (
        <group
          key={i}
          position={[x, shaftY, 0]}
          scale={0.7}
        >
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.4, 0.4, 0.09, 32]} />
            <meshStandardMaterial color={C.steel} metalness={0.85} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.12, 0.12, 0.18, 24]} />
            <meshStandardMaterial color={C.accent} metalness={0.8} />
          </mesh>
        </group>
      ))}

      {/* Labyrinth seal stage positions */}
      {[-1.25, -0.35, 0.45, 1.25].map((x, i) => (
        <group key={i} position={[x, shaftY, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.21, 0.21, 0.07, 24]} />
            <meshStandardMaterial color={C.accent} metalness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function CentrifugalCompressor({
  xray = false,
  explode = 0,
  faults = {},
  onShellClick,
  onPartClick,
  detail = "high",
}: EquipmentProps) {
  const partProps = (id: string) => ({
    highlight: Boolean(faults[id]),
    detail,
  });

  return (
    <group scale={SCALE}>
      {/* BASE SKID */}
      <XRayShell
        active={xray}
        explode={[0, 0, 0]}
        onClick={onShellClick}
      >
        <BaseSkid />
      </XRayShell>

      {/* LOWER CASING */}
      <XRayShell
        active={xray}
        explode={[0, 0, 0]}
        onClick={onShellClick}
      >
        <CasingLower />
      </XRayShell>

      {/* UPPER CASING - lifts vertically */}
      <XRayShell
        active={xray}
        explode={[0, 1.15, 0]}
        onClick={onShellClick}
      >
        <group position={[0, 0, 0]}>
          <CasingUpper />
        </group>
      </XRayShell>

      {/* PROCESS NOZZLES */}
      <XRayShell
        active={xray}
        explode={[0, 0.85, 0]}
        onClick={onShellClick}
      >
        <Nozzles />
      </XRayShell>

      {/* MAIN ROTATING SHAFT */}
      {detail !== "low" && (
        <group>
          <Shaft explode={explode} />
        </group>
      )}

      {/* BEARING - DE */}
      <FaultPulse
        active={Boolean(faults["bearing-de"])}
        position={SLOTS[0].position}
        radius={0.32}
        label={
          faults["bearing-de"] && {
            title: SLOTS[0].name,
            value: faults["bearing-de"].value,
          }
        }
        showLabel={xray}
        onClick={xray ? () => onPartClick?.("bearing-de") : undefined}
      >
        <group
          position={[-explode * 0.15, 0, 0]}
          scale={SLOTS[0].scale}
        >
          <BearingJournal {...partProps("bearing-de")} />
        </group>
      </FaultPulse>

      {/* BEARING - NDE */}
      <FaultPulse
        active={Boolean(faults["bearing-nde"])}
        position={SLOTS[1].position}
        radius={0.32}
        label={
          faults["bearing-nde"] && {
            title: SLOTS[1].name,
            value: faults["bearing-nde"].value,
          }
        }
        showLabel={xray}
        onClick={xray ? () => onPartClick?.("bearing-nde") : undefined}
      >
        <group
          position={[explode * 0.15, 0, 0]}
          scale={SLOTS[1].scale}
        >
          <BearingJournal {...partProps("bearing-nde")} />
        </group>
      </FaultPulse>

      {/* THRUST BEARING */}
      <FaultPulse
        active={Boolean(faults.thrust)}
        position={SLOTS[2].position}
        radius={0.4}
        label={
          faults.thrust && {
            title: SLOTS[2].name,
            value: faults.thrust.value,
          }
        }
        showLabel={xray}
        onClick={xray ? () => onPartClick?.("thrust") : undefined}
      >
        <group
          position={[explode * 0.25, 0, 0]}
          scale={SLOTS[2].scale}
        >
          <BearingThrustPad {...partProps("thrust")} />
        </group>
      </FaultPulse>

      {/* IMPELLERS - repeated stages, one logical slot */}
      <FaultPulse
        active={Boolean(faults.impellers)}
        position={SLOTS[3].position}
        radius={0.75}
        label={
          faults.impellers && {
            title: SLOTS[3].name,
            value: faults.impellers.value,
          }
        }
        showLabel={xray}
        onClick={xray ? () => onPartClick?.("impellers") : undefined}
      >
        <group>
          {[-0.65, 0, 0.65].map((x, i) => (
            <group
              key={i}
              position={[x + (x < 0 ? -explode * 0.12 : explode * 0.12), 0, 0]}
              scale={SLOTS[3].scale}
            >
              <Impeller {...partProps("impellers")} />
            </group>
          ))}
        </group>
      </FaultPulse>

      {/* LABYRINTH SEALS */}
      <FaultPulse
        active={Boolean(faults["lab-seal"])}
        position={SLOTS[4].position}
        radius={0.4}
        label={
          faults["lab-seal"] && {
            title: SLOTS[4].name,
            value: faults["lab-seal"].value,
          }
        }
        showLabel={xray}
        onClick={xray ? () => onPartClick?.("lab-seal") : undefined}
      >
        <group>
          {[-1.25, -0.35, 0.45, 1.25].map((x, i) => (
            <group
              key={i}
              position={[
                x + (x < 0 ? -explode * 0.08 : explode * 0.08),
                0,
                0,
              ]}
              scale={SLOTS[4].scale}
            >
              <SealLabyrinth {...partProps("lab-seal")} />
            </group>
          ))}
        </group>
      </FaultPulse>

      {/* MECHANICAL / DRY GAS SHAFT SEALS */}
      <FaultPulse
        active={Boolean(faults["dry-seal"])}
        position={SLOTS[5].position}
        radius={0.38}
        label={
          faults["dry-seal"] && {
            title: SLOTS[5].name,
            value: faults["dry-seal"].value,
          }
        }
        showLabel={xray}
        onClick={xray ? () => onPartClick?.("dry-seal") : undefined}
      >
        <group>
          {[-1.55, 1.55].map((x) => (
            <group
              key={x}
              position={[x + Math.sign(x) * explode * 0.15, 0, 0]}
              scale={SLOTS[5].scale}
            >
              <SealMechanical {...partProps("dry-seal")} />
            </group>
          ))}
        </group>
      </FaultPulse>

      {/* DRIVER COUPLING */}
      <FaultPulse
        active={Boolean(faults.coupling)}
        position={SLOTS[6].position}
        radius={0.4}
        label={
          faults.coupling && {
            title: SLOTS[6].name,
            value: faults.coupling.value,
          }
        }
        showLabel={xray}
        onClick={xray ? () => onPartClick?.("coupling") : undefined}
      >
        <group
          position={[-explode * 0.3, 0, 0]}
          scale={SLOTS[6].scale}
        >
          <Coupling {...partProps("coupling")} />
        </group>
      </FaultPulse>

      {/* LUBE OIL FILTER */}
      <FaultPulse
        active={Boolean(faults["lube-filter"])}
        position={SLOTS[7].position}
        radius={0.4}
        label={
          faults["lube-filter"] && {
            title: SLOTS[7].name,
            value: faults["lube-filter"].value,
          }
        }
        showLabel={xray}
        onClick={xray ? () => onPartClick?.("lube-filter") : undefined}
      >
        <group
          position={[0, explode * 0.2, 0]}
          scale={SLOTS[7].scale}
        >
          <FilterElement {...partProps("lube-filter")} />
        </group>
      </FaultPulse>

      {/* LUBE OIL SUMP */}
      <FaultPulse
        active={Boolean(faults["lube-oil"])}
        position={SLOTS[8].position}
        radius={0.6}
        label={
          faults["lube-oil"] && {
            title: SLOTS[8].name,
            value: faults["lube-oil"].value,
          }
        }
        showLabel={xray}
        onClick={xray ? () => onPartClick?.("lube-oil") : undefined}
      >
        <group
          position={[0, -explode * 0.15, 0]}
          scale={SLOTS[8].scale}
        >
          <Oil {...partProps("lube-oil")} />
        </group>
      </FaultPulse>

      {/* Auxiliary skid details */}
      {detail !== "low" && (
        <group>
          {/* Oil piping */}
          <mesh
            position={[0.55, 0.48, 0.65]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.035, 0.035, 0.75, 12]} />
            <meshStandardMaterial color={C.oil} metalness={0.6} />
          </mesh>

          {/* Instrumentation */}
          <mesh position={[-1.1, 0.48, 0.72]}>
            <cylinderGeometry args={[0.08, 0.08, 0.13, 16]} />
            <meshStandardMaterial color={C.accent} metalness={0.6} />
          </mesh>
        </group>
      )}
    </group>
  );
}