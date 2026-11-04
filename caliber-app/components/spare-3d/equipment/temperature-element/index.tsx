import * as THREE from "three";
import type { EquipmentProps, SlotDef } from "../../contract";
import { XRayShell, FaultPulse } from "../../core";

import Connector from "../../parts/connector";
import Gland from "../../parts/gland";
import Thermocouple from "../../parts/thermocouple";
import Thermowell from "../../parts/thermowell";

/**
 * Temperature Element (TEL)
 *
 * Equipment: Naphtha Cracker
 * Real dimensions L x H x W: 0.2 x 0.8 x 0.2 m
 * Normalised dimensions: 1 x 4 x 1 units
 *
 * Main assembly axis: Y (vertical insertion)
 * Base elevation: y = 0
 *
 * Coordinate convention:
 * - X: horizontal mounting direction
 * - Y: vertical probe direction
 * - Z: depth
 */

const C = {
  steel: "#89969e",
  steelLight: "#b8c3c9",
  steelDark: "#53616a",
  stainless: "#d2d9dd",
  head: "#657783",
  headLight: "#9aaab3",
  headDark: "#394b56",
  brass: "#c49a50",
  gold: "#d9b46b",
  cable: "#292e32",
  gasket: "#30383d",
  pipe: "#596a73",
  shadow: "#27343c",
  ceramic: "#e0dfd5",
  insulation: "#d0b991",
};

const MATERIALS = {
  steel: new THREE.MeshStandardMaterial({
    color: C.steel,
    metalness: 0.78,
    roughness: 0.32,
  }),
  stainless: new THREE.MeshStandardMaterial({
    color: C.stainless,
    metalness: 0.88,
    roughness: 0.22,
  }),
  head: new THREE.MeshStandardMaterial({
    color: C.head,
    metalness: 0.72,
    roughness: 0.34,
  }),
  dark: new THREE.MeshStandardMaterial({
    color: C.headDark,
    metalness: 0.55,
    roughness: 0.42,
  }),
  brass: new THREE.MeshStandardMaterial({
    color: C.brass,
    metalness: 0.78,
    roughness: 0.25,
  }),
  gasket: new THREE.MeshStandardMaterial({
    color: C.gasket,
    metalness: 0.2,
    roughness: 0.8,
  }),
};

function Box({
  position,
  scale,
  color,
  material,
  rotation,
}: {
  position: [number, number, number];
  scale: [number, number, number];
  color?: string;
  material?: THREE.Material;
  rotation?: [number, number, number];
}) {
  return (
    <mesh
      position={position}
      scale={scale}
      rotation={rotation}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[1, 1, 1]} />
      {material ? (
        <primitive object={material} attach="material" />
      ) : (
        <meshStandardMaterial
          color={color ?? C.steel}
          metalness={0.65}
          roughness={0.38}
        />
      )}
    </mesh>
  );
}

function Cylinder({
  position,
  radius,
  length,
  color,
  radialSegments = 32,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number];
  radius: number;
  length: number;
  color: string;
  radialSegments?: number;
  rotation?: [number, number, number];
}) {
  return (
    <mesh
      position={position}
      rotation={rotation}
      castShadow
      receiveShadow
    >
      <cylinderGeometry
        args={[radius, radius, length, radialSegments]}
      />
      <meshStandardMaterial
        color={color}
        metalness={0.8}
        roughness={0.28}
      />
    </mesh>
  );
}

function Ring({
  position,
  radius,
  tube,
  color,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number];
  radius: number;
  tube: number;
  color: string;
  rotation?: [number, number, number];
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow>
      <torusGeometry args={[radius, tube, 12, 48]} />
      <meshStandardMaterial
        color={color}
        metalness={0.82}
        roughness={0.25}
      />
    </mesh>
  );
}

function Bolt({
  position,
  radius = 0.035,
  length = 0.045,
}: {
  position: [number, number, number];
  radius?: number;
  length?: number;
}) {
  return (
    <mesh position={position} castShadow>
      <cylinderGeometry args={[radius, radius, length, 6]} />
      <meshStandardMaterial
        color={C.stainless}
        metalness={0.9}
        roughness={0.2}
      />
    </mesh>
  );
}

export const SLOTS: SlotDef[] = [
  {
    id: "thermowell",
    part: "thermowell",
    name: "Thermowell",
    position: [0, 1.55, 0],
    rotation: [0, 0, Math.PI / 2],
    scale: 2.5,
  },
  {
    id: "thermocouple",
    part: "thermocouple",
    name: "Thermocouple",
    position: [0, 1.55, 0],
    rotation: [0, 0, Math.PI / 2],
    scale: 2.35,
  },
  {
    id: "connector",
    part: "connector",
    name: "Connector",
    position: [0, 3.42, 0],
    rotation: [0, 0, Math.PI / 2],
    scale: 0.62,
  },
  {
    id: "gland",
    part: "gland",
    name: "Cable gland",
    position: [0.42, 3.42, 0],
    rotation: [0, 0, 0],
    scale: 0.42,
  },
];

export default function TemperatureElement({
  xray = false,
  explode = 0,
  faults = {},
  onShellClick,
  onPartClick,
  detail = "high",
}: EquipmentProps) {
  const low = detail === "low";

  const isFaulty = (id: string) => Boolean(faults[id]);

  const faultLabel = (id: string, name: string) =>
    faults[id]
      ? {
          title: name,
          value: faults[id].value,
        }
      : undefined;

  return (
    <group name="Temperature-Element-TEL">
      {/* =====================================================
          PHASE 1 — PROCESS PIPE / MOUNTING BASE
          Base components remain visible during X-ray.
      ===================================================== */}

      <group name="Mounting-Assembly">
        {/* Process pipe representation */}
        <Cylinder
          position={[0, 0.18, 0]}
          radius={0.5}
          length={1.15}
          color={C.pipe}
          rotation={[0, 0, Math.PI / 2]}
        />

        {/* Pipe outer collar */}
        <Ring
          position={[0, 0.18, 0]}
          radius={0.43}
          tube={0.055}
          color={C.steelDark}
          rotation={[0, Math.PI / 2, 0]}
        />

        {/* Thermowell mounting flange */}
        <Cylinder
          position={[0, 0.55, 0]}
          radius={0.49}
          length={0.16}
          color={C.steelDark}
        />

        <Cylinder
          position={[0, 0.65, 0]}
          radius={0.38}
          length={0.1}
          color={C.steelLight}
        />

        {/* Flange bolts */}
        {Array.from({ length: 8 }, (_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          return (
            <Bolt
              key={i}
              position={[
                Math.cos(angle) * 0.41,
                0.65,
                Math.sin(angle) * 0.41,
              ]}
              radius={0.035}
              length={0.055}
            />
          );
        })}

        {/* Mounting neck */}
        <Cylinder
          position={[0, 0.85, 0]}
          radius={0.2}
          length={0.34}
          color={C.steel}
        />

        {/* Neck reinforcement ring */}
        <Ring
          position={[0, 0.97, 0]}
          radius={0.2}
          tube={0.035}
          color={C.stainless}
        />

        {/* Hexagonal mounting nut */}
        <mesh position={[0, 1.05, 0]} castShadow>
          <cylinderGeometry args={[0.29, 0.29, 0.14, 6]} />
          <meshStandardMaterial
            color={C.steelDark}
            metalness={0.8}
            roughness={0.3}
          />
        </mesh>
      </group>

      {/* =====================================================
          PHASE 2 — THERMOWELL
          Outer protective sheath inserted into process pipe.
          Fades away in X-ray mode.
      ===================================================== */}

      <XRayShell
        active={xray}
        explode={[0, -0.65 * explode, 0]}
        onClick={onShellClick}
      >
        <group name="Thermowell-Outer-Shell">
          {/* Main thermowell sheath */}
          <Cylinder
            position={[0, 1.72, 0]}
            radius={0.105}
            length={1.85}
            color={C.stainless}
            radialSegments={32}
          />

          {/* Reinforced upper shoulder */}
          <Cylinder
            position={[0, 2.68, 0]}
            radius={0.15}
            length={0.18}
            color={C.steel}
          />

          {/* Thermowell neck */}
          <Cylinder
            position={[0, 2.82, 0]}
            radius={0.13}
            length={0.16}
            color={C.stainless}
          />

          {/* Tip profile */}
          <mesh position={[0, 0.77, 0]} castShadow>
            <sphereGeometry args={[0.105, 24, 16]} />
            <meshStandardMaterial
              color={C.stainless}
              metalness={0.88}
              roughness={0.22}
            />
          </mesh>

          {/* Upper thermowell locking shoulder */}
          <Ring
            position={[0, 2.72, 0]}
            radius={0.15}
            tube={0.025}
            color={C.steelDark}
          />

          {/* Sheath inspection marking */}
          <Box
            position={[0, 2.4, 0.105]}
            scale={[0.09, 0.12, 0.012]}
            color={C.gold}
          />
        </group>
      </XRayShell>

      {/* =====================================================
          PHASE 3 — THERMOCOUPLE SENSOR
          Internal sensing element inside the thermowell.
      ===================================================== */}

      <FaultPulse
        active={isFaulty("thermocouple")}
        position={SLOTS[1].position}
        radius={0.35}
        label={faultLabel("thermocouple", SLOTS[1].name)}
        showLabel={xray}
        onClick={
          xray ? () => onPartClick?.("thermocouple") : undefined
        }
      >
        <group
          position={[0, -0.35 * explode, 0]}
          rotation={SLOTS[1].rotation}
          scale={SLOTS[1].scale}
        >
          <Thermocouple
            highlight={isFaulty("thermocouple")}
            detail={detail}
          />
        </group>
      </FaultPulse>

      {/* =====================================================
          PHASE 4 — THERMOWELL SLOT / FAULT IDENTIFICATION
      ===================================================== */}

      <FaultPulse
        active={isFaulty("thermowell")}
        position={SLOTS[0].position}
        radius={0.4}
        label={faultLabel("thermowell", SLOTS[0].name)}
        showLabel={xray}
        onClick={xray ? () => onPartClick?.("thermowell") : undefined}
      >
        <group
          position={[0, 0.55 * explode, 0]}
          rotation={SLOTS[0].rotation}
          scale={SLOTS[0].scale}
        >
          <Thermowell
            highlight={isFaulty("thermowell")}
            detail={detail}
          />
        </group>
      </FaultPulse>

      {/* =====================================================
          PHASE 5 — TERMINAL HEAD / HEAD COVER
          Cover lifts vertically during X-ray.
      ===================================================== */}

      <XRayShell
        active={xray}
        explode={[0, 0.75 * explode, 0]}
        onClick={onShellClick}
      >
        <group name="Terminal-Head-Housing">
          {/* Head lower body */}
          <Cylinder
            position={[0, 3.27, 0]}
            radius={0.31}
            length={0.48}
            color={C.head}
          />

          {/* Head shoulder */}
          <Cylinder
            position={[0, 3.52, 0]}
            radius={0.34}
            length={0.1}
            color={C.headDark}
          />

          {/* Head cover */}
          <Cylinder
            position={[0, 3.68, 0]}
            radius={0.34}
            length={0.22}
            color={C.headLight}
          />

          {/* Cover top plate */}
          <Cylinder
            position={[0, 3.81, 0]}
            radius={0.32}
            length={0.06}
            color={C.head}
          />

          {/* Cover joint gasket */}
          <Ring
            position={[0, 3.57, 0]}
            radius={0.31}
            tube={0.025}
            color={C.gasket}
          />

          {/* Cover fasteners */}
          {Array.from({ length: 6 }, (_, i) => {
            const angle = (i / 6) * Math.PI * 2;
            return (
              <Bolt
                key={i}
                position={[
                  Math.cos(angle) * 0.28,
                  3.74,
                  Math.sin(angle) * 0.28,
                ]}
                radius={0.025}
                length={0.045}
              />
            );
          })}

          {/* Head side inspection plug */}
          <Cylinder
            position={[0.32, 3.36, 0]}
            radius={0.09}
            length={0.09}
            color={C.steelDark}
            rotation={[0, 0, Math.PI / 2]}
          />

          {/* Cable entry boss */}
          <Cylinder
            position={[0.2, 3.26, 0]}
            radius={0.14}
            length={0.22}
            color={C.headDark}
            rotation={[0, 0, Math.PI / 2]}
          />

          {/* Head mounting flange */}
          <Cylinder
            position={[0, 3.04, 0]}
            radius={0.29}
            length={0.12}
            color={C.steel}
          />

          {/* Head identification plate */}
          <Box
            position={[0, 3.31, 0.305]}
            scale={[0.3, 0.13, 0.018]}
            color="#c7b98c"
          />
        </group>
      </XRayShell>

      {/* =====================================================
          PHASE 6 — CONNECTOR / TERMINAL BLOCK
      ===================================================== */}

      {!low && (
        <FaultPulse
          active={isFaulty("connector")}
          position={SLOTS[2].position}
          radius={0.35}
          label={faultLabel("connector", SLOTS[2].name)}
          showLabel={xray}
          onClick={xray ? () => onPartClick?.("connector") : undefined}
        >
          <group
            position={[0, 0.35 * explode, 0]}
            rotation={SLOTS[2].rotation}
            scale={SLOTS[2].scale}
          >
            <Connector
              highlight={isFaulty("connector")}
              detail={detail}
            />
          </group>
        </FaultPulse>
      )}

      {/* =====================================================
          PHASE 7 — CABLE GLAND
      ===================================================== */}

      {!low && (
        <FaultPulse
          active={isFaulty("gland")}
          position={SLOTS[3].position}
          radius={0.3}
          label={faultLabel("gland", SLOTS[3].name)}
          showLabel={xray}
          onClick={xray ? () => onPartClick?.("gland") : undefined}
        >
          <group
            position={[0.3 * explode, 0, 0]}
            rotation={SLOTS[3].rotation}
            scale={SLOTS[3].scale}
          >
            <Gland
              highlight={isFaulty("gland")}
              detail={detail}
            />
          </group>
        </FaultPulse>
      )}

      {/* =====================================================
          PHASE 8 — CABLE ROUTING / INSTRUMENT DETAILS
      ===================================================== */}

      {!low && (
        <group name="Auxiliary-Instrument-Details">
          {/* External cable */}
          <Cylinder
            position={[0.55, 3.27, 0]}
            radius={0.055}
            length={0.48}
            color={C.cable}
            rotation={[0, 0, Math.PI / 2]}
          />

          {/* Cable strain relief */}
          <Cylinder
            position={[0.78, 3.27, 0]}
            radius={0.075}
            length={0.14}
            color={C.steelDark}
            rotation={[0, 0, Math.PI / 2]}
          />

          {/* Cable end cap */}
          <Cylinder
            position={[0.89, 3.27, 0]}
            radius={0.055}
            length={0.08}
            color={C.cable}
            rotation={[0, 0, Math.PI / 2]}
          />

          {/* Grounding terminal */}
          <Cylinder
            position={[-0.27, 3.35, 0]}
            radius={0.045}
            length={0.12}
            color={C.gold}
            rotation={[0, 0, Math.PI / 2]}
          />

          {/* Head cover hinge / retaining feature */}
          <Cylinder
            position={[-0.31, 3.62, 0]}
            radius={0.065}
            length={0.13}
            color={C.steelDark}
            rotation={[Math.PI / 2, 0, 0]}
          />

          {/* Protective terminal insulation */}
          <Cylinder
            position={[0, 3.43, 0]}
            radius={0.19}
            length={0.05}
            color={C.ceramic}
          />
        </group>
      )}

      {/* =====================================================
          PHASE 9 — LOW DETAIL MODE
          The casing and mounting assembly remain the main
          representation; detailed internals are suppressed.
      ===================================================== */}

      {low && (
        <group name="Low-Detail-Identification">
          <Box
            position={[0, 3.3, 0.34]}
            scale={[0.24, 0.1, 0.025]}
            color="#c9b982"
          />
        </group>
      )}
    </group>
  );
}