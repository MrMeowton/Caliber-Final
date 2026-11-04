import type { EquipmentProps, SlotDef } from "../../contract";
import { XRayShell, FaultPulse } from "../../core";

import Antirust from "../../parts/antirust";
import Elbow from "../../parts/elbow";
import Flange from "../../parts/flange";
import Gasket from "../../parts/gasket";
import Pipe from "../../parts/pipe";
import Studbolt from "../../parts/studbolt";
import Tape from "../../parts/tape";
import Tee from "../../parts/tee";
import ValveGate from "../../parts/valve-gate";

export const SLOTS: SlotDef[] = [
  {
    id: "pipe",
    part: "pipe",
    name: "Pipe Spool",
    position: [0, 0.5, 0],
    scale: 3.5,
  },
  {
    id: "elbow",
    part: "elbow",
    name: "Elbows",
    position: [1.45, 0.5, 0],
    scale: 0.85,
  },
  {
    id: "tee",
    part: "tee",
    name: "Tee",
    position: [0.15, 0.5, 0],
    scale: 0.9,
  },
  {
    id: "flange",
    part: "flange",
    name: "Flanges",
    position: [-1.15, 0.5, 0],
    scale: 0.4,
  },
  {
    id: "gasket",
    part: "gasket",
    name: "Gaskets",
    position: [-1.15, 0.5, 0],
    scale: 0.34,
  },
  {
    id: "studbolts",
    part: "studbolt",
    name: "Studbolts",
    position: [-1.15, 0.5, 0],
    scale: 0.18,
  },
  {
    id: "block-valve",
    part: "valve-gate",
    name: "Block Gate Valve",
    position: [1.05, 0.5, 0],
    scale: 0.85,
  },
  {
    id: "antirust",
    part: "antirust",
    name: "Antirust Coating",
    position: [0, 0.5, 0],
    scale: 3.5,
  },
  {
    id: "tape",
    part: "tape",
    name: "Wrapping Tape",
    position: [0, 0.5, 0],
    scale: 3.5,
  },
];

export default function PipingLine({
  xray = false,
  explode = 0,
  faults = {},
  onShellClick,
  onPartClick,
  detail = "high",
}: EquipmentProps) {
  const low = detail === "low";

  const pipeSlot = SLOTS[0];
  const elbowSlot = SLOTS[1];
  const teeSlot = SLOTS[2];
  const flangeSlot = SLOTS[3];
  const gasketSlot = SLOTS[4];
  const studSlot = SLOTS[5];
  const valveSlot = SLOTS[6];
  const antirustSlot = SLOTS[7];
  const tapeSlot = SLOTS[8];

  return (
    <group name="PipingLineAssembly">
      {/* =====================================================
          PHASE 1 — BASE SUPPORT STRUCTURE
          Fixed structural supports; not affected by X-ray.
      ===================================================== */}

      <group name="PipeSupports">
        {/* Main support beams */}
        <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
          <boxGeometry args={[4, 0.12, 0.65]} />
          <meshStandardMaterial color="#414950" metalness={0.8} roughness={0.4} />
        </mesh>

        {/* Support legs */}
        {[-1.65, -0.55, 0.55, 1.65].map((x, i) => (
          <group key={i} position={[x, 0, 0]}>
            <mesh position={[0, 0.18, 0]} castShadow>
              <boxGeometry args={[0.12, 0.36, 0.5]} />
              <meshStandardMaterial
                color="#58636b"
                metalness={0.75}
                roughness={0.4}
              />
            </mesh>

            {/* Base plates */}
            <mesh position={[0, 0.025, 0]}>
              <boxGeometry args={[0.32, 0.05, 0.65]} />
              <meshStandardMaterial
                color="#303a42"
                metalness={0.8}
                roughness={0.35}
              />
            </mesh>

            {/* Support saddle */}
            <mesh position={[0, 0.39, 0]}>
              <boxGeometry args={[0.3, 0.07, 0.58]} />
              <meshStandardMaterial
                color="#727d84"
                metalness={0.8}
                roughness={0.3}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* =====================================================
          PHASE 2 — INSULATION JACKET / OUTER CASING
          Long horizontal insulated piping system.
      ===================================================== */}

      {!low && (
        <XRayShell
          active={xray}
          explode={[0, 0.65 * explode, 0]}
          onClick={onShellClick}
        >
          <group name="InsulationJacket">
            {/* Main insulation body */}
            <mesh position={[0, 0.5, 0]} castShadow>
              <cylinderGeometry args={[0.205, 0.205, 3.75, 20, 1, false]} />
              <meshStandardMaterial
                color="#a6a19a"
                metalness={0.25}
                roughness={0.78}
              />
            </mesh>

            {/* Outer metallic cladding */}
            <mesh
              position={[0, 0.5, 0]}
              rotation={[0, 0, Math.PI / 2]}
            >
              <cylinderGeometry args={[0.215, 0.215, 3.8, 20, 1, true]} />
              <meshStandardMaterial
                color="#aeb8bf"
                metalness={0.75}
                roughness={0.35}
                side={2}
              />
            </mesh>

            {/* Cladding circumferential bands */}
            {[-1.7, -1.3, -0.9, -0.5, -0.1, 0.3, 0.7, 1.1, 1.5, 1.85].map(
              (x, i) => (
                <mesh
                  key={i}
                  position={[x, 0.5, 0]}
                  rotation={[0, 0, Math.PI / 2]}
                >
                  <torusGeometry args={[0.218, 0.012, 6, 20]} />
                  <meshStandardMaterial
                    color="#737e87"
                    metalness={0.85}
                    roughness={0.3}
                  />
                </mesh>
              ),
            )}

            {/* Insulation end caps */}
            {[-1.9, 1.9].map((x, i) => (
              <mesh key={i} position={[x, 0.5, 0]}>
                <cylinderGeometry args={[0.22, 0.22, 0.045, 20]} />
                <meshStandardMaterial
                  color="#69747c"
                  metalness={0.8}
                  roughness={0.35}
                />
              </mesh>
            ))}
          </group>
        </XRayShell>
      )}

      {/* =====================================================
          PHASE 3 — INTERNAL PIPEWORK
          Main process fluid transportation line.
      ===================================================== */}

      <FaultPulse
        active={Boolean(faults[pipeSlot.id])}
        position={pipeSlot.position}
        radius={0.4}
        label={
          faults[pipeSlot.id] && {
            title: pipeSlot.name,
            value: faults[pipeSlot.id].value,
          }
        }
        showLabel={xray}
        onClick={xray ? () => onPartClick?.(pipeSlot.id) : undefined}
      >
        <group
          position={[-explode * 0.35, 0, 0]}
          scale={pipeSlot.scale}
        >
          <Pipe
            highlight={Boolean(faults[pipeSlot.id])}
            detail={detail}
          />
        </group>
      </FaultPulse>

      {/* =====================================================
          PHASE 4 — PIPE FITTINGS
          Elbows, tees and directional transitions.
      ===================================================== */}

      {!low && (
        <>
          {/* Elbow — left transition */}
          <FaultPulse
            active={Boolean(faults[elbowSlot.id])}
            position={elbowSlot.position}
            radius={0.4}
            label={
              faults[elbowSlot.id] && {
                title: elbowSlot.name,
                value: faults[elbowSlot.id].value,
              }
            }
            showLabel={xray}
            onClick={
              xray ? () => onPartClick?.(elbowSlot.id) : undefined
            }
          >
            <group
              position={[0, 0, explode * 0.8]}
              scale={elbowSlot.scale}
            >
              <Elbow
                highlight={Boolean(faults[elbowSlot.id])}
                detail={detail}
              />
            </group>
          </FaultPulse>

          {/* Tee — branch connection */}
          <FaultPulse
            active={Boolean(faults[teeSlot.id])}
            position={teeSlot.position}
            radius={0.4}
            label={
              faults[teeSlot.id] && {
                title: teeSlot.name,
                value: faults[teeSlot.id].value,
              }
            }
            showLabel={xray}
            onClick={xray ? () => onPartClick?.(teeSlot.id) : undefined}
          >
            <group
              position={[0, 0, -explode * 0.8]}
              scale={teeSlot.scale}
            >
              <Tee
                highlight={Boolean(faults[teeSlot.id])}
                detail={detail}
              />
            </group>
          </FaultPulse>
        </>
      )}

      {/* =====================================================
          PHASE 5 — FLANGED JOINT ASSEMBLIES
          Mechanical connections and sealing elements.
      ===================================================== */}

      {!low && (
        <>
          {/* Flanges */}
          <FaultPulse
            active={Boolean(faults[flangeSlot.id])}
            position={flangeSlot.position}
            radius={0.35}
            label={
              faults[flangeSlot.id] && {
                title: flangeSlot.name,
                value: faults[flangeSlot.id].value,
              }
            }
            showLabel={xray}
            onClick={
              xray ? () => onPartClick?.(flangeSlot.id) : undefined
            }
          >
            <group
              position={[-explode * 0.65, 0, 0]}
              scale={flangeSlot.scale}
            >
              <Flange
                highlight={Boolean(faults[flangeSlot.id])}
                detail={detail}
              />
            </group>

            <group
              position={[explode * 0.65, 0, 0]}
              scale={flangeSlot.scale}
            >
              <Flange
                highlight={Boolean(faults[flangeSlot.id])}
                detail={detail}
              />
            </group>
          </FaultPulse>

          {/* Gaskets */}
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
            onClick={
              xray ? () => onPartClick?.(gasketSlot.id) : undefined
            }
          >
            <group
              position={[0, 0, explode * 0.5]}
              scale={gasketSlot.scale}
            >
              <Gasket
                highlight={Boolean(faults[gasketSlot.id])}
                detail={detail}
              />
            </group>
          </FaultPulse>

          {/* Studbolts — repeated around joint */}
          <FaultPulse
            active={Boolean(faults[studSlot.id])}
            position={studSlot.position}
            radius={0.4}
            label={
              faults[studSlot.id] && {
                title: studSlot.name,
                value: faults[studSlot.id].value,
              }
            }
            showLabel={xray}
            onClick={xray ? () => onPartClick?.(studSlot.id) : undefined}
          >
            <group
              position={[0, 0, -explode * 0.45]}
              scale={studSlot.scale}
            >
              {Array.from({ length: 8 }).map((_, i) => {
                const angle = (i / 8) * Math.PI * 2;

                return (
                  <group
                    key={i}
                    position={[
                      0,
                      Math.cos(angle) * 0.8,
                      Math.sin(angle) * 0.8,
                    ]}
                  >
                    <Studbolt
                      highlight={Boolean(faults[studSlot.id])}
                      detail={detail}
                    />
                  </group>
                );
              })}
            </group>
          </FaultPulse>
        </>
      )}

      {/* =====================================================
          PHASE 6 — INLINE BLOCK VALVE
          Isolation valve for process shutdown.
      ===================================================== */}

      <FaultPulse
        active={Boolean(faults[valveSlot.id])}
        position={valveSlot.position}
        radius={0.55}
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
          position={[explode * 0.4, 0, 0]}
          scale={valveSlot.scale}
        >
          <ValveGate
            highlight={Boolean(faults[valveSlot.id])}
            detail={detail}
          />
        </group>
      </FaultPulse>

      {/* =====================================================
          PHASE 7 — ANTIRUST COATING
          Protective external corrosion-control layer.
      ===================================================== */}

      {!low && (
        <FaultPulse
          active={Boolean(faults[antirustSlot.id])}
          position={antirustSlot.position}
          radius={0.4}
          label={
            faults[antirustSlot.id] && {
              title: antirustSlot.name,
              value: faults[antirustSlot.id].value,
            }
          }
          showLabel={xray}
          onClick={
            xray
              ? () => onPartClick?.(antirustSlot.id)
              : undefined
          }
        >
          <group
            position={[0, explode * 0.9, 0]}
            scale={antirustSlot.scale}
          >
            <Antirust
              highlight={Boolean(faults[antirustSlot.id])}
              detail={detail}
            />
          </group>
        </FaultPulse>
      )}

      {/* =====================================================
          PHASE 8 — WRAPPING TAPE
          External insulation and protective wrapping.
      ===================================================== */}

      {!low && (
        <FaultPulse
          active={Boolean(faults[tapeSlot.id])}
          position={tapeSlot.position}
          radius={0.4}
          label={
            faults[tapeSlot.id] && {
              title: tapeSlot.name,
              value: faults[tapeSlot.id].value,
            }
          }
          showLabel={xray}
          onClick={
            xray ? () => onPartClick?.(tapeSlot.id) : undefined
          }
        >
          <group
            position={[0, -explode * 0.8, 0]}
            scale={tapeSlot.scale}
          >
            <Tape
              highlight={Boolean(faults[tapeSlot.id])}
              detail={detail}
            />
          </group>
        </FaultPulse>
      )}
    </group>
  );
}