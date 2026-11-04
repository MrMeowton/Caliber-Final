import type { EquipmentProps, SlotDef } from "../../contract";
import { XRayShell, FaultPulse } from "../../core";

import Connector from "../../parts/connector";
import Gauge from "../../parts/gauge";
import ValveNeedle from "../../parts/valve-needle";

export const SLOTS: SlotDef[] = [
  {
    id: "gauge",
    part: "gauge",
    name: "Pressure Gauge",
    position: [0, 2.65, 0],
    rotation: [0, 0, Math.PI / 2],
    scale: 2.15,
  },
  {
    id: "root-valve",
    part: "valve-needle",
    name: "Root Needle Valve",
    position: [0, 0.85, 0],
    rotation: [0, 0, Math.PI / 2],
    scale: 0.85,
  },
  {
    id: "connector",
    part: "connector",
    name: "Threaded Connector",
    position: [0, 1.65, 0],
    rotation: [0, 0, Math.PI / 2],
    scale: 0.65,
  },
];

export default function PressureGauge({
  xray = false,
  explode = 0,
  faults = {},
  onShellClick,
  onPartClick,
  detail = "high",
}: EquipmentProps) {
  const low = detail === "low";

  const gaugeSlot = SLOTS[0];
  const valveSlot = SLOTS[1];
  const connectorSlot = SLOTS[2];

  return (
    <group name="PressureGaugeAssembly">
      {/* =====================================================
          PHASE 1 — MOUNTING STRUCTURE
          Pipe connection and instrument support.
      ===================================================== */}

      <group name="MountingStructure">
        {/* Bottom mounting plate */}
        <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.85, 0.16, 0.65]} />
          <meshStandardMaterial
            color="#46515a"
            metalness={0.8}
            roughness={0.4}
          />
        </mesh>

        {/* Vertical instrument support */}
        <mesh position={[0, 0.85, 0]}>
          <cylinderGeometry args={[0.075, 0.075, 1.45, 12]} />
          <meshStandardMaterial
            color="#707b83"
            metalness={0.85}
            roughness={0.3}
          />
        </mesh>

        {/* Support clamp */}
        <mesh position={[0, 1.55, 0]}>
          <torusGeometry args={[0.12, 0.025, 8, 16]} />
          <meshStandardMaterial
            color="#89939a"
            metalness={0.85}
            roughness={0.3}
          />
        </mesh>

        {/* Mounting bolts */}
        {[-0.27, 0.27].map((x) =>
          [-0.2, 0.2].map((z, i) => (
            <mesh
              key={`${x}-${z}-${i}`}
              position={[x, 0.17, z]}
              castShadow
            >
              <cylinderGeometry args={[0.035, 0.035, 0.055, 8]} />
              <meshStandardMaterial
                color="#c0c5c8"
                metalness={0.9}
                roughness={0.25}
              />
            </mesh>
          )),
        )}
      </group>

      {/* =====================================================
          PHASE 2 — GAUGE OUTER CASING
          Circular instrument housing and protective bezel.
      ===================================================== */}

      <XRayShell
        active={xray}
        explode={[0, 0, 0.8 * explode]}
        onClick={onShellClick}
      >
        <group name="GaugeHousing">
          {/* Main cylindrical gauge housing */}
          <mesh
            position={[0, 2.65, 0]}
            rotation={[Math.PI / 2, 0, 0]}
            castShadow
          >
            <cylinderGeometry args={[0.88, 0.88, 0.32, 48]} />
            <meshStandardMaterial
              color="#333e47"
              metalness={0.85}
              roughness={0.3}
            />
          </mesh>

          {/* Rear casing */}
          <mesh
            position={[0, 2.65, -0.19]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.79, 0.79, 0.12, 40]} />
            <meshStandardMaterial
              color="#58636b"
              metalness={0.8}
              roughness={0.35}
            />
          </mesh>

          {/* Front bezel */}
          <mesh
            position={[0, 2.65, 0.19]}
            rotation={[Math.PI / 2, 0, 0]}
            castShadow
          >
            <torusGeometry args={[0.82, 0.085, 12, 48]} />
            <meshStandardMaterial
              color="#b6bec4"
              metalness={0.9}
              roughness={0.2}
            />
          </mesh>

          {/* Protective front glass */}
          <mesh
            position={[0, 2.65, 0.225]}
            rotation={[0, 0, 0]}
          >
            <circleGeometry args={[0.77, 48]} />
            <meshPhysicalMaterial
              color="#c9e1eb"
              transparent
              opacity={0.24}
              roughness={0.08}
              metalness={0.05}
              transmission={0.35}
              thickness={0.03}
              depthWrite={false}
            />
          </mesh>

          {/* Glass retaining ring */}
          <mesh
            position={[0, 2.65, 0.24]}
            rotation={[0, 0, 0]}
          >
            <torusGeometry args={[0.76, 0.018, 8, 48]} />
            <meshStandardMaterial
              color="#d3dce1"
              metalness={0.9}
              roughness={0.18}
            />
          </mesh>

          {/* Rear casing fasteners */}
          {Array.from({ length: 6 }).map((_, i) => {
            const angle = (i / 6) * Math.PI * 2;

            return (
              <mesh
                key={i}
                position={[
                  Math.cos(angle) * 0.84,
                  2.65 + Math.sin(angle) * 0.84,
                  0.12,
                ]}
              >
                <cylinderGeometry args={[0.035, 0.035, 0.035, 8]} />
                <meshStandardMaterial
                  color="#d0d5d8"
                  metalness={0.95}
                  roughness={0.2}
                />
              </mesh>
            );
          })}

          {/* Gauge mounting neck */}
          <mesh position={[0, 2.05, 0]} castShadow>
            <cylinderGeometry args={[0.15, 0.19, 0.35, 16]} />
            <meshStandardMaterial
              color="#77838b"
              metalness={0.85}
              roughness={0.3}
            />
          </mesh>
        </group>
      </XRayShell>

      {/* =====================================================
          PHASE 3 — INTERNAL GAUGE MECHANISM
          Dial, pointer and pressure measurement mechanism.
      ===================================================== */}

      <FaultPulse
        active={Boolean(faults[gaugeSlot.id])}
        position={gaugeSlot.position}
        radius={0.9}
        label={
          faults[gaugeSlot.id] && {
            title: gaugeSlot.name,
            value: faults[gaugeSlot.id].value,
          }
        }
        showLabel={xray}
        onClick={
          xray ? () => onPartClick?.(gaugeSlot.id) : undefined
        }
      >
        <group
          position={[0, 0, -explode * 0.45]}
          rotation={gaugeSlot.rotation}
          scale={gaugeSlot.scale}
        >
          <Gauge
            highlight={Boolean(faults[gaugeSlot.id])}
            detail={detail}
          />
        </group>
      </FaultPulse>

      {/* =====================================================
          PHASE 4 — THREADED CONNECTOR
          Mechanical connection between gauge and valve.
      ===================================================== */}

      <FaultPulse
        active={Boolean(faults[connectorSlot.id])}
        position={connectorSlot.position}
        radius={0.4}
        label={
          faults[connectorSlot.id] && {
            title: connectorSlot.name,
            value: faults[connectorSlot.id].value,
          }
        }
        showLabel={xray}
        onClick={
          xray ? () => onPartClick?.(connectorSlot.id) : undefined
        }
      >
        <group
          position={[0, explode * 0.45, 0]}
          rotation={connectorSlot.rotation}
          scale={connectorSlot.scale}
        >
          <Connector
            highlight={Boolean(faults[connectorSlot.id])}
            detail={detail}
          />
        </group>
      </FaultPulse>

      {/* =====================================================
          PHASE 5 — ROOT NEEDLE VALVE
          Isolation and pressure-instrument connection valve.
      ===================================================== */}

      <FaultPulse
        active={Boolean(faults[valveSlot.id])}
        position={valveSlot.position}
        radius={0.5}
        label={
          faults[valveSlot.id] && {
            title: valveSlot.name,
            value: faults[valveSlot.id].value,
          }
        }
        showLabel={xray}
        onClick={
          xray ? () => onPartClick?.(valveSlot.id) : undefined
        }
      >
        <group
          position={[0, -explode * 0.45, 0]}
          rotation={valveSlot.rotation}
          scale={valveSlot.scale}
        >
          <ValveNeedle
            highlight={Boolean(faults[valveSlot.id])}
            detail={detail}
          />
        </group>
      </FaultPulse>

      {/* =====================================================
          PHASE 6 — LOW DETAIL REPRESENTATION
          Main shells and key components remain visible.
          Detailed internals are controlled by their own parts.
      ===================================================== */}
    </group>
  );
}