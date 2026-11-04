import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { EquipmentProps, SlotDef } from "../../contract";
import { XRayShell, FaultPulse } from "../../core";

import BearingJournal from "../../parts/bearing-journal";
import BearingThrustPad from "../../parts/bearing-thrust-pad";
import Blade from "../../parts/blade";
import Gasket from "../../parts/gasket";
import SealLabyrinth from "../../parts/seal-labyrinth";
import SolenoidValve from "../../parts/solenoid-valve";
import Spring from "../../parts/spring";
import Transmitter from "../../parts/transmitter";
import ValveGovernor from "../../parts/valve-governor";

const C = {
  skid: "#343b43",
  skidEdge: "#59636e",
  casing: "#87949e",
  casingDark: "#596873",
  casingTop: "#aab5bd",
  steam: "#71899b",
  steamDark: "#405b70",
  exhaust: "#536b7a",
  metal: "#c0c9ce",
  dark: "#26333d",
  gold: "#d6a64d",
  gasket: "#343b42",
  concrete: "#737d83",
  accent: "#e2a84f",
};

const MAT = {
  metal: new THREE.MeshStandardMaterial({
    color: C.metal,
    metalness: 0.78,
    roughness: 0.3,
  }),
  dark: new THREE.MeshStandardMaterial({
    color: C.dark,
    metalness: 0.65,
    roughness: 0.4,
  }),
  casing: new THREE.MeshStandardMaterial({
    color: C.casing,
    metalness: 0.7,
    roughness: 0.38,
  }),
  gold: new THREE.MeshStandardMaterial({
    color: C.gold,
    metalness: 0.7,
    roughness: 0.25,
  }),
  skid: new THREE.MeshStandardMaterial({
    color: C.skid,
    metalness: 0.55,
    roughness: 0.6,
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
      material={material}
    >
      <boxGeometry args={[1, 1, 1]} />
      {!material && (
        <meshStandardMaterial
          color={color ?? C.casing}
          metalness={0.65}
          roughness={0.4}
        />
      )}
    </mesh>
  );
}

function Cylinder({
  position,
  rotation = [0, 0, 0],
  radius,
  length,
  color,
  radialSegments = 32,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  radius: number;
  length: number;
  color: string;
  radialSegments?: number;
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
        metalness={0.78}
        roughness={0.3}
      />
    </mesh>
  );
}

function BoltRow({
  x,
  y,
  z,
  count,
  spacing,
  axis = "x",
}: {
  x: number;
  y: number;
  z: number;
  count: number;
  spacing: number;
  axis?: "x" | "z";
}) {
  return (
    <group>
      {Array.from({ length: count }, (_, i) => (
        <mesh
          key={i}
          position={[
            x + (axis === "x" ? (i - (count - 1) / 2) * spacing : 0),
            y,
            z + (axis === "z" ? (i - (count - 1) / 2) * spacing : 0),
          ]}
          castShadow
        >
          <cylinderGeometry args={[0.035, 0.035, 0.025, 6]} />
          <meshStandardMaterial
            color="#d2d9dc"
            metalness={0.85}
            roughness={0.25}
          />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Normalised assembly dimensions:
 * Real L x H x W = 5 x 3 x 3 m
 * Model L x H x W = 4 x 2.4 x 2.4 units
 * Assembly base elevation = 0
 *
 * Main shaft axis = X
 */

export const SLOTS: SlotDef[] = [
  {
    id: "rotor-blades",
    part: "blade",
    name: "Rotor blade rows",
    position: [0, 1.12, 0],
    rotation: [0, 0, 0],
    scale: 0.62,
  },
  {
    id: "journal-de",
    part: "bearing-journal",
    name: "Journal bearing",
    position: [1.48, 1.12, 0],
    rotation: [0, 0, 0],
    scale: 0.48,
  },
  {
    id: "thrust",
    part: "bearing-thrust-pad",
    name: "Thrust bearing",
    position: [-1.48, 1.12, 0],
    rotation: [0, 0, 0],
    scale: 0.48,
  },
  {
    id: "gov-valve",
    part: "valve-governor",
    name: "Governor valve",
    position: [0, 1.95, 0],
    scale: 0.58,
  },
  {
    id: "gland-seal",
    part: "seal-labyrinth",
    name: "Gland labyrinth seals",
    position: [1.15, 1.12, 0],
    scale: 0.35,
  },
  {
    id: "trip-spring",
    part: "spring",
    name: "Trip valve spring",
    position: [-0.72, 1.9, 0.45],
    scale: 0.3,
  },
  {
    id: "solenoid",
    part: "solenoid-valve",
    name: "Trip solenoid",
    position: [-0.72, 1.68, 0.45],
    scale: 0.3,
  },
  {
    id: "speed-tx",
    part: "transmitter",
    name: "Speed/pressure transmitter",
    position: [-1.55, 1.72, 0.45],
    scale: 0.3,
  },
  {
    id: "casing-gasket",
    part: "gasket",
    name: "Casing joint gasket",
    position: [0, 1.37, 0],
    scale: 0.85,
  },
];

export default function SteamTurbine({
  xray = false,
  explode = 0,
  faults = {},
  onShellClick,
  onPartClick,
  detail = "high",
}: EquipmentProps) {
  const rotorRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (detail === "high" && rotorRef.current) {
      rotorRef.current.rotation.x += delta * 0.22;
    }
  });

  const low = detail === "low";

  const slotFault = (id: string) => Boolean(faults[id]);
  const slotLabel = (id: string, name: string) =>
    faults[id] ? { title: name, value: faults[id].value } : undefined;

  return (
    <group name="Steam-Turbine-Driver-KT">
      {/* ======================================================
          PHASE 1 — BASE FRAME / SKID
          The skid remains solid during X-ray mode.
      ====================================================== */}

      <group name="Base-Skid">
        <Box
          position={[0, 0.12, 0]}
          scale={[4, 0.24, 2.35]}
          material={MAT.skid}
        />

        <Box
          position={[0, 0.26, 0]}
          scale={[3.8, 0.08, 2.15]}
          color={C.skidEdge}
        />

        {/* Longitudinal structural beams */}
        {[-0.88, 0.88].map((z) => (
          <Box
            key={z}
            position={[0, 0.32, z]}
            scale={[3.75, 0.16, 0.18]}
            material={MAT.skid}
          />
        ))}

        {/* Cross members */}
        {[-1.6, -0.55, 0.55, 1.6].map((x) => (
          <Box
            key={x}
            position={[x, 0.34, 0]}
            scale={[0.16, 0.18, 1.95]}
            material={MAT.skid}
          />
        ))}

        {/* Anchor feet */}
        {[-1.72, 1.72].map((x) =>
          [-0.88, 0.88].map((z) => (
            <group key={`${x}-${z}`}>
              <Box
                position={[x, 0.04, z]}
                scale={[0.35, 0.08, 0.32]}
                color={C.concrete}
              />
              <Cylinder
                position={[x, 0.09, z]}
                radius={0.055}
                length={0.12}
                color="#b8c0c4"
              />
            </group>
          )),
        )}
      </group>

      {/* ======================================================
          PHASE 2 — LOWER TURBINE CASING
      ====================================================== */}

      <XRayShell
        active={xray}
        explode={[0, -0.4 * explode, 0]}
        onClick={onShellClick}
      >
        <group name="Lower-Casing">
          <Box
            position={[0, 0.85, 0]}
            scale={[2.85, 0.82, 1.55]}
            material={MAT.casing}
          />

          {/* Main lower casing side cheeks */}
          {[-0.81, 0.81].map((z) => (
            <Box
              key={z}
              position={[0, 0.88, z]}
              scale={[2.75, 0.68, 0.09]}
              color={C.casingDark}
            />
          ))}

          {/* Casing front and rear end walls */}
          {[-1.42, 1.42].map((x) => (
            <Box
              key={x}
              position={[x, 0.88, 0]}
              scale={[0.1, 0.68, 1.55]}
              color={C.casingDark}
            />
          ))}

          {/* Split line flange */}
          <Box
            position={[0, 1.29, 0]}
            scale={[2.98, 0.1, 1.75]}
            color={C.casingTop}
          />

          {/* Flange bolts */}
          {[-1.25, -0.8, -0.35, 0.1, 0.55, 1.0, 1.25].map((x) => (
            <group key={x}>
              {[-0.82, 0.82].map((z) => (
                <mesh
                  key={z}
                  position={[x, 1.36, z]}
                  castShadow
                >
                  <cylinderGeometry args={[0.035, 0.035, 0.05, 6]} />
                  <meshStandardMaterial
                    color="#d2d9dc"
                    metalness={0.9}
                  />
                </mesh>
              ))}
            </group>
          ))}

          {/* Lower casing feet */}
          {[-1.05, 1.05].map((x) => (
            <Box
              key={x}
              position={[x, 0.49, 0]}
              scale={[0.35, 0.35, 1.2]}
              color={C.casingDark}
            />
          ))}
        </group>
      </XRayShell>

      {/* ======================================================
          PHASE 3 — ROTOR / INTERNAL ROTATING ASSEMBLY
      ====================================================== */}

      {!low && (
        <FaultPulse
          active={slotFault("rotor-blades")}
          position={SLOTS[0].position}
          radius={0.4}
          label={slotLabel("rotor-blades", SLOTS[0].name)}
          showLabel={xray}
          onClick={
            xray ? () => onPartClick?.("rotor-blades") : undefined
          }
        >
          <group
            position={[-0.15 * explode, 0, 0]}
            rotation={SLOTS[0].rotation}
            scale={SLOTS[0].scale}
          >
            <group ref={rotorRef} name="Rotor-Assembly">
              {/* Rotor shaft along X */}
              <Cylinder
                position={[0, 0, 0]}
                rotation={[0, 0, Math.PI / 2]}
                radius={0.075}
                length={2.75}
                color="#9eabb4"
              />

              {/* Rotor discs */}
              {[-0.85, -0.4, 0.05, 0.5, 0.95].map((x, i) => (
                <group key={x}>
                  <Cylinder
                    position={[x, 0, 0]}
                    rotation={[0, 0, Math.PI / 2]}
                    radius={0.32 - i * 0.015}
                    length={0.11}
                    color="#778892"
                  />

                  {/* Radial blade rows */}
                  {Array.from({ length: 16 }, (_, j) => {
                    const a = (j / 16) * Math.PI * 2;
                    return (
                      <group
                        key={j}
                        rotation={[a, 0, 0]}
                        position={[x, 0, 0]}
                      >
                        <Box
                          position={[0, 0.38 - i * 0.025, 0]}
                          scale={[0.15, 0.2, 0.035]}
                          color={C.metal}
                        />
                      </group>
                    );
                  })}
                </group>
              ))}
            </group>
          </group>
        </FaultPulse>
      )}

      {/* ======================================================
          PHASE 4 — JOURNAL BEARING / DE
      ====================================================== */}

      <FaultPulse
        active={slotFault("journal-de")}
        position={SLOTS[1].position}
        radius={0.4}
        label={slotLabel("journal-de", SLOTS[1].name)}
        showLabel={xray}
        onClick={xray ? () => onPartClick?.("journal-de") : undefined}
      >
        <group
          position={[0.2 * explode, 0, 0]}
          scale={SLOTS[1].scale}
        >
          <BearingJournal
            highlight={slotFault("journal-de")}
            detail={detail}
          />
        </group>
      </FaultPulse>

      {/* ======================================================
          PHASE 5 — THRUST BEARING
      ====================================================== */}

      {!low && (
        <FaultPulse
          active={slotFault("thrust")}
          position={SLOTS[2].position}
          radius={0.4}
          label={slotLabel("thrust", SLOTS[2].name)}
          showLabel={xray}
          onClick={xray ? () => onPartClick?.("thrust") : undefined}
        >
          <group
            position={[-0.2 * explode, 0, 0]}
            scale={SLOTS[2].scale}
          >
            <BearingThrustPad
              highlight={slotFault("thrust")}
              detail={detail}
            />
          </group>
        </FaultPulse>
      )}

      {/* ======================================================
          PHASE 6 — UPPER CASING / STEAM CHEST
      ====================================================== */}

      <XRayShell
        active={xray}
        explode={[0, 0.45 * explode, 0]}
        onClick={onShellClick}
      >
        <group name="Upper-Casing">
          {/* Upper casing cover */}
          <Box
            position={[0, 1.55, 0]}
            scale={[2.85, 0.48, 1.55]}
            material={MAT.casing}
          />

          {/* Upper cover side surfaces */}
          {[-0.8, 0.8].map((z) => (
            <Box
              key={z}
              position={[0, 1.55, z]}
              scale={[2.75, 0.4, 0.08]}
              color={C.casingDark}
            />
          ))}

          {/* Steam chest base */}
          <Box
            position={[0, 1.92, 0]}
            scale={[1.65, 0.15, 1.05]}
            color={C.steamDark}
          />

          {/* Steam chest body */}
          <Box
            position={[0, 2.12, 0]}
            scale={[1.4, 0.35, 0.82]}
            color={C.steam}
          />

          {/* Steam chest top cover */}
          <Box
            position={[0, 2.32, 0]}
            scale={[1.55, 0.08, 0.95]}
            color={C.casingTop}
          />

          {/* Steam inlet nozzle */}
          <Cylinder
            position={[-0.55, 2.45, 0]}
            radius={0.22}
            length={0.3}
            rotation={[0, 0, Math.PI / 2]}
            color={C.steam}
          />

          {/* Governor valve rack supports */}
          {[-0.5, 0.5].map((x) => (
            <Box
              key={x}
              position={[x, 2.42, 0]}
              scale={[0.13, 0.16, 0.55]}
              color={C.dark}
            />
          ))}
        </group>
      </XRayShell>

      {/* ======================================================
          PHASE 7 — GOVERNOR VALVE
      ====================================================== */}

      <FaultPulse
        active={slotFault("gov-valve")}
        position={SLOTS[3].position}
        radius={0.4}
        label={slotLabel("gov-valve", SLOTS[3].name)}
        showLabel={xray}
        onClick={xray ? () => onPartClick?.("gov-valve") : undefined}
      >
        <group
          position={[0, 0.15 * explode, 0]}
          scale={SLOTS[3].scale}
        >
          <ValveGovernor
            highlight={slotFault("gov-valve")}
            detail={detail}
          />
        </group>
      </FaultPulse>

      {/* ======================================================
          PHASE 8 — EXHAUST HOOD
      ====================================================== */}

      <XRayShell
        active={xray}
        explode={[0.5 * explode, 0, 0]}
        onClick={onShellClick}
      >
        <group name="Exhaust-Hood">
          {/* Exhaust outlet chamber */}
          <Box
            position={[1.58, 1.02, 0]}
            scale={[0.45, 0.8, 1.45]}
            color={C.exhaust}
          />

          {/* Exhaust outlet flange */}
          <Box
            position={[1.86, 1.02, 0]}
            scale={[0.1, 0.95, 1.6]}
            color={C.casingDark}
          />

          {/* Exhaust duct transition */}
          <Box
            position={[1.85, 0.92, 0]}
            scale={[0.48, 0.65, 1.25]}
            color={C.exhaust}
          />

          {/* Exhaust pipe */}
          <Cylinder
            position={[1.9, 0.65, 0]}
            radius={0.25}
            length={0.8}
            rotation={[0, 0, Math.PI / 2]}
            color={C.exhaust}
          />
        </group>
      </XRayShell>

      {/* ======================================================
          PHASE 9 — GLAND LABYRINTH SEALS
      ====================================================== */}

      {!low && (
        <>
          {[-1, 1].map((side) => (
            <FaultPulse
              key={side}
              active={slotFault("gland-seal")}
              position={[
                SLOTS[4].position[0] * side,
                SLOTS[4].position[1],
                SLOTS[4].position[2],
              ]}
              radius={0.35}
              label={slotLabel("gland-seal", SLOTS[4].name)}
              showLabel={xray}
              onClick={
                xray ? () => onPartClick?.("gland-seal") : undefined
              }
            >
              <group
                position={[0.2 * side * explode, 0, 0]}
                scale={SLOTS[4].scale}
              >
                <SealLabyrinth
                  highlight={slotFault("gland-seal")}
                  detail={detail}
                />
              </group>
            </FaultPulse>
          ))}
        </>
      )}

      {/* ======================================================
          PHASE 10 — TRIP SYSTEM / SPRING
      ====================================================== */}

      {!low && (
        <>
          <FaultPulse
            active={slotFault("trip-spring")}
            position={SLOTS[5].position}
            radius={0.3}
            label={slotLabel("trip-spring", SLOTS[5].name)}
            showLabel={xray}
            onClick={
              xray ? () => onPartClick?.("trip-spring") : undefined
            }
          >
            <group
              position={[0, 0.15 * explode, 0]}
              scale={SLOTS[5].scale}
            >
              <Spring
                highlight={slotFault("trip-spring")}
                detail={detail}
              />
            </group>
          </FaultPulse>

          {/* Trip solenoid */}
          <FaultPulse
            active={slotFault("solenoid")}
            position={SLOTS[6].position}
            radius={0.3}
            label={slotLabel("solenoid", SLOTS[6].name)}
            showLabel={xray}
            onClick={xray ? () => onPartClick?.("solenoid") : undefined}
          >
            <group
              position={[0, 0.15 * explode, 0]}
              scale={SLOTS[6].scale}
            >
              <SolenoidValve
                highlight={slotFault("solenoid")}
                detail={detail}
              />
            </group>
          </FaultPulse>
        </>
      )}

      {/* ======================================================
          PHASE 11 — SPEED / PRESSURE TRANSMITTER
      ====================================================== */}

      {!low && (
        <FaultPulse
          active={slotFault("speed-tx")}
          position={SLOTS[7].position}
          radius={0.3}
          label={slotLabel("speed-tx", SLOTS[7].name)}
          showLabel={xray}
          onClick={xray ? () => onPartClick?.("speed-tx") : undefined}
        >
          <group
            position={[-0.2 * explode, 0, 0]}
            scale={SLOTS[7].scale}
          >
            <Transmitter
              highlight={slotFault("speed-tx")}
              detail={detail}
            />
          </group>
        </FaultPulse>
      )}

      {/* ======================================================
          PHASE 12 — CASING JOINT GASKET
      ====================================================== */}

      {!low && (
        <FaultPulse
          active={slotFault("casing-gasket")}
          position={SLOTS[8].position}
          radius={0.4}
          label={slotLabel("casing-gasket", SLOTS[8].name)}
          showLabel={xray}
          onClick={
            xray ? () => onPartClick?.("casing-gasket") : undefined
          }
        >
          <group
            position={[0, 0.2 * explode, 0]}
            scale={SLOTS[8].scale}
          >
            <Gasket
              highlight={slotFault("casing-gasket")}
              detail={detail}
            />
          </group>
        </FaultPulse>
      )}

      {/* ======================================================
          PHASE 13 — AUXILIARY DETAILS
      ====================================================== */}

      {!low && (
        <group name="Auxiliary-Details">
          {/* Bearing pedestal covers */}
          {[-1.48, 1.48].map((x) => (
            <group key={x}>
              <Box
                position={[x, 0.62, 0]}
                scale={[0.55, 0.3, 0.95]}
                color={C.casingDark}
              />

              <Box
                position={[x, 0.82, 0]}
                scale={[0.62, 0.08, 1.05]}
                color={C.casingTop}
              />

              {/* Inspection cover */}
              <Cylinder
                position={[x, 0.84, 0.55]}
                radius={0.14}
                length={0.08}
                rotation={[Math.PI / 2, 0, 0]}
                color={C.metal}
              />
            </group>
          ))}

          {/* Lubrication pipe */}
          <Cylinder
            position={[0, 0.55, 1.02]}
            radius={0.035}
            length={2.8}
            rotation={[0, 0, Math.PI / 2]}
            color="#b69a55"
          />

          {/* Oil connection fittings */}
          {[-1.1, 1.1].map((x) => (
            <Cylinder
              key={x}
              position={[x, 0.55, 1.02]}
              radius={0.075}
              length={0.12}
              color={C.gold}
            />
          ))}

          {/* Instrument mounting brackets */}
          <Box
            position={[-1.55, 1.48, 0.48]}
            scale={[0.14, 0.35, 0.14]}
            color={C.dark}
          />

          {/* Nameplate */}
          <Box
            position={[0, 1.52, 0.83]}
            scale={[0.62, 0.22, 0.035]}
            color="#d5c9a0"
          />

          {/* Nameplate fasteners */}
          {[-0.25, 0.25].map((x) => (
            <mesh
              key={x}
              position={[x, 1.52, 0.86]}
            >
              <sphereGeometry args={[0.025, 8, 8]} />
              <meshStandardMaterial color="#626b70" />
            </mesh>
          ))}
        </group>
      )}

      {/* ======================================================
          PHASE 14 — TOP COVER HARDWARE
      ====================================================== */}

      <XRayShell
        active={xray}
        explode={[0, 0.65 * explode, 0]}
        onClick={onShellClick}
      >
        <group name="Upper-Casing-Hardware">
          {[-1.1, -0.65, -0.2, 0.25, 0.7, 1.1].map((x) => (
            <group key={x}>
              {[-0.78, 0.78].map((z) => (
                <mesh
                  key={z}
                  position={[x, 1.82, z]}
                  castShadow
                >
                  <cylinderGeometry args={[0.04, 0.04, 0.09, 6]} />
                  <meshStandardMaterial
                    color="#d5dce0"
                    metalness={0.85}
                  />
                </mesh>
              ))}
            </group>
          ))}

          {/* Steam chest cover fasteners */}
          {[-0.55, 0, 0.55].map((x) => (
            <mesh key={x} position={[x, 2.38, 0.38]}>
              <cylinderGeometry args={[0.035, 0.035, 0.04, 6]} />
              <meshStandardMaterial color="#e0e4e5" />
            </mesh>
          ))}
        </group>
      </XRayShell>
    </group>
  );
}