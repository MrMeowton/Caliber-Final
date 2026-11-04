import type { EquipmentProps, SlotDef } from "../../contract";
import { XRayShell, FaultPulse } from "../../core";

import Flange from "../../parts/flange";
import Gasket from "../../parts/gasket";
import Pipe from "../../parts/pipe";
import Studbolt from "../../parts/studbolt";
import TubePlug from "../../parts/tube-plug";

export const SLOTS: SlotDef[] = [
  {
    id: "tube-bundle",
    part: "pipe",
    name: "Tube Bundle",
    position: [0, 1.35, 0],
    scale: 1.65,
  },
  {
    id: "tube-plugs",
    part: "tube-plug",
    name: "Tube Plugs",
    position: [1.35, 1.35, 0],
    scale: 0.12,
  },
  {
    id: "channel-gasket",
    part: "gasket",
    name: "Channel Gasket",
    position: [-1.85, 1.35, 0],
    scale: 0.72,
  },
  {
    id: "studbolts",
    part: "studbolt",
    name: "Flange Studbolts",
    position: [-1.85, 1.35, 0],
    scale: 0.11,
  },
  {
    id: "nozzle-flange",
    part: "flange",
    name: "Nozzle Flanges",
    position: [0, 1.9, 0],
    scale: 0.35,
  },
];

export default function ShellTubeExchanger({
  xray = false,
  explode = 0,
  faults = {},
  onShellClick,
  onPartClick,
  detail = "high",
}: EquipmentProps) {
  const low = detail === "low";

  const shellColor = "#84929C";
  const headColor = "#A5B0B8";
  const steelColor = "#BEC8CE";
  const darkMetal = "#46535C";
  const tubeColor = "#B7A47C";

  const tubeSlot = SLOTS[0];
  const plugSlot = SLOTS[1];
  const gasketSlot = SLOTS[2];
  const boltSlot = SLOTS[3];
  const nozzleFlangeSlot = SLOTS[4];

  const shellRadius = 0.62;
  const shellLength = 3.45;
  const tubeRadius = 0.035;

  const tubeRows = 5;
  const tubeColumns = 7;
  const tubeSpacing = 0.16;

  const tubePositions: [number, number, number][] = [];

  for (let row = 0; row < tubeRows; row++) {
    for (let col = 0; col < tubeColumns; col++) {
      const y = (row - (tubeRows - 1) / 2) * tubeSpacing;
      const z = (col - (tubeColumns - 1) / 2) * tubeSpacing;

      if (y * y + z * z < 0.49 * 0.49) {
        tubePositions.push([0, y, z]);
      }
    }
  }

  const boltCount = 12;
  const boltCircleRadius = 0.73;

  const boltPositions = Array.from({ length: boltCount }, (_, i) => {
    const angle = (i / boltCount) * Math.PI * 2;

    return [
      0,
      Math.cos(angle) * boltCircleRadius,
      Math.sin(angle) * boltCircleRadius,
    ] as [number, number, number];
  });

  const nozzlePositions: [number, number, number][] = [
    [-0.9, 0.72, 0],
    [0.95, 0.72, 0],
    [0, 0.78, 0.48],
    [0, 0.78, -0.48],
  ];

  return (
    <group>
      {/* =====================================================
          PHASE 1 — BASE FRAME AND SUPPORT SKID
          Overall dimensions:
          Length: 4.0 units
          Height: 1.0 units
          Width: 1.0 units
          Ground reference: y = 0
      ====================================================== */}

      <group position={[0, 0.13, 0]}>
        {/* Main longitudinal skid */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[3.75, 0.22, 1.25]} />
          <meshStandardMaterial
            color={darkMetal}
            metalness={0.8}
            roughness={0.42}
          />
        </mesh>

        {/* Cross supports */}
        {[-1.4, -0.45, 0.45, 1.4].map((x) => (
          <mesh key={x} position={[x, 0.0, 0]} castShadow>
            <boxGeometry args={[0.18, 0.3, 1.4]} />
            <meshStandardMaterial
              color={shellColor}
              metalness={0.75}
              roughness={0.4}
            />
          </mesh>
        ))}

        {/* Saddle supports */}
        {[-1.25, 1.25].map((x) => (
          <group key={x} position={[x, 0.28, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.4, 0.38, 1.05]} />
              <meshStandardMaterial
                color={shellColor}
                metalness={0.75}
                roughness={0.35}
              />
            </mesh>

            <mesh position={[0, 0.23, 0]}>
              <boxGeometry args={[0.55, 0.08, 1.2]} />
              <meshStandardMaterial
                color={steelColor}
                metalness={0.8}
                roughness={0.3}
              />
            </mesh>
          </group>
        ))}

        {/* Foundation feet */}
        {[-1.65, 1.65].map((x) => (
          <mesh key={x} position={[x, -0.16, 0]}>
            <boxGeometry args={[0.32, 0.12, 1.45]} />
            <meshStandardMaterial
              color={steelColor}
              metalness={0.85}
              roughness={0.3}
            />
          </mesh>
        ))}
      </group>

      {/* =====================================================
          PHASE 2 — MAIN SHELL CYLINDER
          Horizontal shell axis: X
          Shell fades during X-ray inspection.
      ====================================================== */}

      <XRayShell
        active={xray}
        explode={[0, 0, 0.85]}
        onClick={onShellClick}
      >
        <group position={[0, 1.35, 0]}>
          {/* Main cylindrical pressure vessel shell */}
          <mesh castShadow receiveShadow rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry
              args={[shellRadius, shellRadius, shellLength, 48, 1, true]}
            />
            <meshStandardMaterial
              color={shellColor}
              metalness={0.8}
              roughness={0.32}
              side={2}
              transparent={xray}
              opacity={xray ? 0.12 : 1}
              depthWrite={!xray}
            />
          </mesh>

          {/* Outer shell reinforcement bands */}
          {[-1.3, -0.7, 0.7, 1.3].map((x) => (
            <mesh
              key={x}
              position={[x, 0, 0]}
              rotation={[0, 0, Math.PI / 2]}
            >
              <cylinderGeometry
                args={[0.65, 0.65, 0.09, 40, 1, true]}
              />
              <meshStandardMaterial
                color={steelColor}
                metalness={0.85}
                roughness={0.3}
                transparent={xray}
                opacity={xray ? 0.16 : 1}
                depthWrite={!xray}
                side={2}
              />
            </mesh>
          ))}

          {/* Rear shell end ring */}
          <mesh
            position={[1.72, 0, 0]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.65, 0.65, 0.12, 48]} />
            <meshStandardMaterial
              color={steelColor}
              metalness={0.85}
              roughness={0.3}
              transparent={xray}
              opacity={xray ? 0.2 : 1}
            />
          </mesh>

          {/* Rear end closure */}
          <mesh
            position={[1.82, 0, 0]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.59, 0.59, 0.1, 48]} />
            <meshStandardMaterial
              color={headColor}
              metalness={0.78}
              roughness={0.34}
              transparent={xray}
              opacity={xray ? 0.16 : 1}
            />
          </mesh>
        </group>
      </XRayShell>

      {/* =====================================================
          PHASE 3 — CHANNEL HEAD AND FRONT COVER
          Front channel head separates along X axis.
      ====================================================== */}

      <XRayShell
        active={xray}
        explode={[-0.8, 0, 0]}
        onClick={onShellClick}
      >
        <group position={[-1.88, 1.35, 0]}>
          {/* Channel flange */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.78, 0.78, 0.18, 48]} />
            <meshStandardMaterial
              color={steelColor}
              metalness={0.85}
              roughness={0.27}
            />
          </mesh>

          {/* Channel head barrel */}
          <mesh
            position={[-0.2, 0, 0]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.61, 0.61, 0.4, 48]} />
            <meshStandardMaterial
              color={headColor}
              metalness={0.8}
              roughness={0.32}
            />
          </mesh>

          {/* Channel head dome */}
          <mesh
            position={[-0.4, 0, 0]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <sphereGeometry args={[0.61, 40, 24]} />
            <meshStandardMaterial
              color={headColor}
              metalness={0.78}
              roughness={0.32}
            />
          </mesh>

          {/* Front cover outer disc */}
          <mesh
            position={[-0.46, 0, 0]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.76, 0.76, 0.14, 48]} />
            <meshStandardMaterial
              color={shellColor}
              metalness={0.85}
              roughness={0.28}
            />
          </mesh>

          {/* Cover reinforcement rim */}
          <mesh
            position={[-0.55, 0, 0]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <torusGeometry args={[0.69, 0.055, 10, 48]} />
            <meshStandardMaterial
              color={steelColor}
              metalness={0.9}
              roughness={0.25}
            />
          </mesh>
        </group>
      </XRayShell>

      {/* =====================================================
          PHASE 4 — REAR HEAD AND TUBESHEET
      ====================================================== */}

      <XRayShell
        active={xray}
        explode={[0.65, 0, 0]}
        onClick={onShellClick}
      >
        <group position={[1.82, 1.35, 0]}>
          {/* Rear tubesheet */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.59, 0.59, 0.16, 48]} />
            <meshStandardMaterial
              color={steelColor}
              metalness={0.85}
              roughness={0.28}
            />
          </mesh>

          {/* Rear channel cover */}
          <mesh
            position={[0.18, 0, 0]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.62, 0.62, 0.3, 48]} />
            <meshStandardMaterial
              color={headColor}
              metalness={0.8}
              roughness={0.32}
            />
          </mesh>
        </group>
      </XRayShell>

      {/* =====================================================
          PHASE 5 — TUBE BUNDLE
          Repeated parallel tubes along the shell axis.
      ====================================================== */}

      <FaultPulse
        active={Boolean(faults[tubeSlot.id])}
        position={tubeSlot.position}
        radius={0.55}
        label={
          faults[tubeSlot.id] && {
            title: tubeSlot.name,
            value: faults[tubeSlot.id].value,
          }
        }
        showLabel={xray}
        onClick={
          xray ? () => onPartClick?.(tubeSlot.id) : undefined
        }
      >
        <group position={[explode * 0.15, 0, 0]}>
          {tubePositions.map((p, i) => (
            <group key={i} position={p}>
              <group scale={0.14} rotation={tubeSlot.rotation}>
                <Pipe
                  highlight={Boolean(faults[tubeSlot.id])}
                  detail={detail}
                  color={tubeColor}
                />
              </group>
            </group>
          ))}
        </group>
      </FaultPulse>

      {/* =====================================================
          PHASE 6 — TUBE PLUGS
          Repeated plugs at the front tubesheet.
      ====================================================== */}

      {!low && (
        <FaultPulse
          active={Boolean(faults[plugSlot.id])}
          position={plugSlot.position}
          radius={0.5}
          label={
            faults[plugSlot.id] && {
              title: plugSlot.name,
              value: faults[plugSlot.id].value,
            }
          }
          showLabel={xray}
          onClick={
            xray ? () => onPartClick?.(plugSlot.id) : undefined
          }
        >
          <group position={[-explode * 0.35, 0, 0]}>
            {tubePositions.map((p, i) => (
              <group key={i} position={p}>
                <group
                  scale={plugSlot.scale}
                  rotation={plugSlot.rotation}
                >
                  <TubePlug
                    highlight={Boolean(faults[plugSlot.id])}
                    detail={detail}
                  />
                </group>
              </group>
            ))}
          </group>
        </FaultPulse>
      )}

      {/* =====================================================
          PHASE 7 — CHANNEL GASKET
          Gasket located at the front channel flange.
      ====================================================== */}

      {!low && (
        <FaultPulse
          active={Boolean(faults[gasketSlot.id])}
          position={gasketSlot.position}
          radius={0.45}
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
            position={[-explode * 0.35, 0, 0]}
            rotation={gasketSlot.rotation}
            scale={gasketSlot.scale}
          >
            <Gasket
              highlight={Boolean(faults[gasketSlot.id])}
              detail={detail}
            />
          </group>
        </FaultPulse>
      )}

      {/* =====================================================
          PHASE 8 — FLANGE STUD BOLTS
          Repeated fasteners around the channel flange.
      ====================================================== */}

      {!low && (
        <FaultPulse
          active={Boolean(faults[boltSlot.id])}
          position={boltSlot.position}
          radius={0.6}
          label={
            faults[boltSlot.id] && {
              title: boltSlot.name,
              value: faults[boltSlot.id].value,
            }
          }
          showLabel={xray}
          onClick={
            xray ? () => onPartClick?.(boltSlot.id) : undefined
          }
        >
          <group>
            {boltPositions.map((p, i) => (
              <group
                key={i}
                position={[
                  explode * -0.2,
                  p[1],
                  p[2],
                ]}
              >
                <group scale={boltSlot.scale}>
                  <Studbolt
                    highlight={Boolean(faults[boltSlot.id])}
                    detail={detail}
                  />
                </group>
              </group>
            ))}
          </group>
        </FaultPulse>
      )}

      {/* =====================================================
          PHASE 9 — NOZZLE FLANGES
          Repeated nozzle connection flanges.
      ====================================================== */}

      {!low && (
        <FaultPulse
          active={Boolean(faults[nozzleFlangeSlot.id])}
          position={nozzleFlangeSlot.position}
          radius={0.45}
          label={
            faults[nozzleFlangeSlot.id] && {
              title: nozzleFlangeSlot.name,
              value: faults[nozzleFlangeSlot.id].value,
            }
          }
          showLabel={xray}
          onClick={
            xray
              ? () => onPartClick?.(nozzleFlangeSlot.id)
              : undefined
          }
        >
          <group>
            {nozzlePositions.map((p, i) => (
              <group key={i} position={p}>
                <group
                  scale={nozzleFlangeSlot.scale}
                  rotation={
                    i === 0 || i === 1
                      ? [0, 0, Math.PI / 2]
                      : undefined
                  }
                >
                  <Flange
                    highlight={Boolean(faults[nozzleFlangeSlot.id])}
                    detail={detail}
                  />
                </group>
              </group>
            ))}
          </group>
        </FaultPulse>
      )}

      {/* =====================================================
          PHASE 10 — NOZZLE CONNECTIONS
          Shell-side inlet and outlet nozzle necks.
      ====================================================== */}

      <XRayShell
        active={xray}
        explode={[0, 0, 0.3]}
        onClick={onShellClick}
      >
        <group position={[0, 1.35, 0]}>
          {/* Top shell-side inlet nozzle */}
          <mesh castShadow position={[-0.9, 0.78, 0]}>
            <cylinderGeometry args={[0.2, 0.24, 0.42, 32]} />
            <meshStandardMaterial
              color={shellColor}
              metalness={0.8}
              roughness={0.3}
            />
          </mesh>

          {/* Top shell-side outlet nozzle */}
          <mesh castShadow position={[0.95, 0.78, 0]}>
            <cylinderGeometry args={[0.2, 0.24, 0.42, 32]} />
            <meshStandardMaterial
              color={shellColor}
              metalness={0.8}
              roughness={0.3}
            />
          </mesh>

          {/* Additional vent / drain connections */}
          {[-1, 1].map((x) => (
            <mesh
              key={x}
              position={[x * 0.65, -0.58, 0]}
            >
              <cylinderGeometry args={[0.09, 0.11, 0.3, 24]} />
              <meshStandardMaterial
                color={steelColor}
                metalness={0.85}
                roughness={0.3}
              />
            </mesh>
          ))}
        </group>
      </XRayShell>

      {/* =====================================================
          PHASE 11 — LOW DETAIL CONFIGURATION
          Shell and primary tube bundle remain visible.
      ====================================================== */}

      {!low && (
        <group position={[0, 1.35, 0]}>
          {/* Shell identification plate */}
          <mesh position={[0, 0.66, 0.66]}>
            <boxGeometry args={[0.58, 0.28, 0.035]} />
            <meshStandardMaterial
              color="#C5CED3"
              metalness={0.7}
              roughness={0.4}
            />
          </mesh>

          {/* Identification plate mounting screws */}
          {[-0.22, 0.22].map((x) => (
            <mesh
              key={x}
              position={[x, 0.66, 0.69]}
            >
              <cylinderGeometry args={[0.018, 0.018, 0.015, 8]} />
              <meshStandardMaterial color={darkMetal} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}