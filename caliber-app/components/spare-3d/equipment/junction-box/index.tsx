import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import type { EquipmentProps, SlotDef } from "../../contract";
import { XRayShell, FaultPulse } from "../../core";
import Cable from "../../parts/cable";
import Gland from "../../parts/gland";
import Screw from "../../parts/screw";
import Terminal from "../../parts/terminal";
import TerminalBlock from "../../parts/terminal-block";

export const SLOTS: SlotDef[] = [
  {
    id: "terminal-block",
    part: "terminal-block",
    name: "Terminal blocks",
    position: [0, 2.35, 0],
    rotation: [0, 0, 0],
    scale: 0.95,
  },
  {
    id: "terminal",
    part: "terminal",
    name: "Cable lugs",
    position: [0, 2.35, 0.12],
    rotation: [0, 0, Math.PI / 2],
    scale: 0.3,
  },
  {
    id: "gland",
    part: "gland",
    name: "Cable glands",
    position: [0, 0.35, 0],
    rotation: [0, 0, Math.PI / 2],
    scale: 0.38,
  },
  {
    id: "cable",
    part: "cable",
    name: "Cables",
    position: [0, 0.05, 0],
    rotation: [0, 0, 0],
    scale: 0.65,
  },
  {
    id: "screw",
    part: "screw",
    name: "Screws",
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: 0.12,
  },
];

const MAT = {
  enclosure: "#AEB9C2",
  enclosureDark: "#687782",
  interior: "#8999A4",
  door: "#C3CDD3",
  rail: "#65737D",
  metal: "#9CA8AE",
  dark: "#303B43",
  gasket: "#252E34",
  warning: "#E2A83B",
  cable: "#252B32",
  green: "#268B57",
  blue: "#3476B8",
  red: "#B8443C",
};

function MetalBox({
  position,
  size,
  color = MAT.enclosure,
  radius = 0.025,
}: {
  position: [number, number, number];
  size: [number, number, number];
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
  depth,
  color = MAT.metal,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number];
  radius: number;
  depth: number;
  color?: string;
  rotation?: [number, number, number];
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow>
      <cylinderGeometry args={[radius, radius, depth, 16]} />
      <meshStandardMaterial color={color} metalness={0.75} roughness={0.3} />
    </mesh>
  );
}

function DoorHardware() {
  return (
    <group>
      {[-1.65, 1.65].map((y) => (
        <group key={y} position={[0, y, 0]}>
          <MetalBox
            position={[0, 0, 0]}
            size={[0.1, 0.42, 0.08]}
            color={MAT.enclosureDark}
          />
          <Cylinder
            position={[0.08, 0, 0]}
            radius={0.055}
            depth={0.16}
            rotation={[Math.PI / 2, 0, 0]}
          />
        </group>
      ))}
    </group>
  );
}

function DoorHandle() {
  return (
    <group position={[0, 0, 0]}>
      <MetalBox
        position={[0, 0, 0]}
        size={[0.1, 0.55, 0.08]}
        color={MAT.enclosureDark}
      />
      <MetalBox
        position={[0.13, 0.18, 0]}
        size={[0.3, 0.07, 0.07]}
        color={MAT.metal}
      />
      <MetalBox
        position={[0.13, -0.18, 0]}
        size={[0.3, 0.07, 0.07]}
        color={MAT.metal}
      />
      <MetalBox
        position={[0.25, 0, 0]}
        size={[0.08, 0.42, 0.07]}
        color={MAT.metal}
      />
    </group>
  );
}

function CableEntryPlate() {
  return (
    <group>
      <MetalBox
        position={[0, 0.03, 0]}
        size={[3.35, 0.12, 1.1]}
        color={MAT.enclosureDark}
      />
      {[-1.2, -0.4, 0.4, 1.2].map((x) => (
        <Cylinder
          key={x}
          position={[x, 0.1, 0]}
          radius={0.19}
          depth={0.08}
          color={MAT.dark}
        />
      ))}
    </group>
  );
}

function DinRail() {
  return (
    <group>
      <MetalBox
        position={[0, 0, 0]}
        size={[3.15, 0.11, 0.13]}
        color={MAT.rail}
      />
      <MetalBox
        position={[0, 0.07, -0.09]}
        size={[3.15, 0.08, 0.07]}
        color={MAT.metal}
      />
      {[-1.4, 1.4].map((x) => (
        <Cylinder
          key={x}
          position={[x, 0.09, 0]}
          radius={0.055}
          depth={0.15}
          color={MAT.dark}
          rotation={[Math.PI / 2, 0, 0]}
        />
      ))}
    </group>
  );
}

function InternalSupports() {
  return (
    <group>
      {[-1.3, 1.3].map((x) => (
        <MetalBox
          key={x}
          position={[x, 0, 0]}
          size={[0.09, 2.7, 0.1]}
          color={MAT.enclosureDark}
        />
      ))}
      <MetalBox
        position={[0, 1.1, 0]}
        size={[2.8, 0.09, 0.08]}
        color={MAT.metal}
      />
    </group>
  );
}

function GroundingAssembly() {
  return (
    <group>
      <MetalBox
        position={[0, 0.48, -0.09]}
        size={[2.8, 0.1, 0.12]}
        color={MAT.green}
      />
      {[-1, -0.5, 0, 0.5, 1].map((x) => (
        <Cylinder
          key={x}
          position={[x, 0.56, -0.09]}
          radius={0.055}
          depth={0.1}
          color={MAT.metal}
        />
      ))}
    </group>
  );
}

function JunctionBoxInternals({ detail }: { detail: string }) {
  return (
    <group>
      <InternalSupports />
      <DinRail />
      <GroundingAssembly />

      {detail === "high" && (
        <>
          <MetalBox
            position={[0, 1.45, -0.09]}
            size={[2.8, 0.07, 0.12]}
            color={MAT.warning}
          />
          <MetalBox
            position={[0, 0.85, -0.1]}
            size={[2.8, 0.06, 0.12]}
            color={MAT.enclosureDark}
          />
          <MetalBox
            position={[-1.55, 1.8, -0.05]}
            size={[0.12, 0.35, 0.12]}
            color={MAT.dark}
          />
          <MetalBox
            position={[1.55, 1.8, -0.05]}
            size={[0.12, 0.35, 0.12]}
            color={MAT.dark}
          />
        </>
      )}
    </group>
  );
}

export default function JunctionBox({
  xray = false,
  explode = 0,
  faults = {},
  onShellClick,
  onPartClick,
  detail = "high",
}: EquipmentProps) {
  const doorRef = useRef<THREE.Group>(null);

  const shellOffset = explode * 0.8;
  const partOffset = explode * 0.3;

  useFrame(() => {
    if (!doorRef.current) return;

    const targetRotation = xray ? -Math.PI * 0.55 : 0;
    doorRef.current.rotation.y = THREE.MathUtils.damp(
      doorRef.current.rotation.y,
      targetRotation,
      3,
      0.016
    );
  });

  const partClick = (id: string) =>
    xray ? () => onPartClick?.(id) : undefined;

  const renderSlot = (
    index: number,
    children: React.ReactNode,
    radius = 0.4,
    offset: [number, number, number] = [0, 0, 0]
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
            ? { title: s.name, value: fault.value }
            : undefined
        }
        showLabel={xray}
        onClick={partClick(s.id)}
      >
        <group
          position={offset.map((v) => v * explode) as [
            number,
            number,
            number
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
      {/* BASE SKID — remains solid in X-ray */}
      <group position={[0, 0.12, 0]}>
        <MetalBox
          position={[0, 0, 0]}
          size={[4, 0.22, 1.55]}
          color={MAT.dark}
        />
        <MetalBox
          position={[0, 0.15, 0]}
          size={[3.8, 0.08, 1.42]}
          color={MAT.enclosureDark}
        />
        {[-1.55, 1.55].map((x) => (
          <MetalBox
            key={x}
            position={[x, -0.12, 0]}
            size={[0.25, 0.25, 1.7]}
            color={MAT.dark}
          />
        ))}
      </group>

      {/* BACK PLATE */}
      <XRayShell
        active={xray}
        explode={[-shellOffset * 0.2, 0, -shellOffset]}
        onClick={onShellClick}
      >
        <group position={[0, 2.05, -0.56]}>
          <MetalBox
            position={[0, 0, 0]}
            size={[3.85, 3.85, 0.12]}
            color={MAT.enclosure}
          />
          <MetalBox
            position={[0, 0, 0.075]}
            size={[3.55, 3.55, 0.04]}
            color={MAT.interior}
          />
        </group>
      </XRayShell>

      {/* TOP COVER */}
      <XRayShell
        active={xray}
        explode={[0, shellOffset, 0]}
        onClick={onShellClick}
      >
        <group position={[0, 4.02, 0]}>
          <MetalBox
            position={[0, 0, 0]}
            size={[4, 0.13, 1.65]}
            color={MAT.enclosure}
          />
          <MetalBox
            position={[0, -0.08, 0]}
            size={[3.65, 0.05, 1.35]}
            color={MAT.enclosureDark}
          />
        </group>
      </XRayShell>

      {/* LEFT SIDE WALL */}
      <XRayShell
        active={xray}
        explode={[-shellOffset, 0, 0]}
        onClick={onShellClick}
      >
        <group position={[-1.94, 2.05, 0]}>
          <MetalBox
            position={[0, 0, 0]}
            size={[0.12, 3.85, 1.65]}
            color={MAT.enclosure}
          />
        </group>
      </XRayShell>

      {/* RIGHT SIDE WALL */}
      <XRayShell
        active={xray}
        explode={[shellOffset, 0, 0]}
        onClick={onShellClick}
      >
        <group position={[1.94, 2.05, 0]}>
          <MetalBox
            position={[0, 0, 0]}
            size={[0.12, 3.85, 1.65]}
            color={MAT.enclosure}
          />
        </group>
      </XRayShell>

      {/* BOTTOM ENCLOSURE */}
      <XRayShell
        active={xray}
        explode={[0, -shellOffset * 0.4, 0]}
        onClick={onShellClick}
      >
        <group position={[0, 0.23, 0]}>
          <MetalBox
            position={[0, 0, 0]}
            size={[3.85, 0.14, 1.65]}
            color={MAT.enclosure}
          />
        </group>
      </XRayShell>

      {/* FRONT DOOR / COVER */}
      <XRayShell
        active={xray}
        explode={[0, 0, shellOffset]}
        onClick={onShellClick}
      >
        <group
          ref={doorRef}
          position={[0, 2.05, 0.85]}
        >
          <group position={[0, 0, 0]}>
            <MetalBox
              position={[0, 0, 0]}
              size={[3.95, 3.85, 0.13]}
              color={MAT.door}
            />
            <MetalBox
              position={[0, 0, -0.09]}
              size={[3.68, 3.58, 0.06]}
              color={MAT.enclosureDark}
            />
            <MetalBox
              position={[0, 0, -0.13]}
              size={[3.48, 3.38, 0.04]}
              color={MAT.door}
            />
            <DoorHardware />
            <group position={[1.48, 0, 0.11]}>
              <DoorHandle />
            </group>
          </group>
        </group>
      </XRayShell>

      {/* HINGE ASSEMBLY */}
      <XRayShell
        active={xray}
        explode={[-shellOffset * 0.4, 0, 0]}
        onClick={onShellClick}
      >
        <group position={[-2.02, 2.05, 0.78]}>
          {[-1.4, 0, 1.4].map((y) => (
            <group key={y} position={[0, y, 0]}>
              <Cylinder
                position={[0, 0, 0]}
                radius={0.065}
                depth={0.3}
                color={MAT.metal}
                rotation={[0, 0, Math.PI / 2]}
              />
            </group>
          ))}
        </group>
      </XRayShell>

      {/* INTERNAL SUPPORTS */}
      <XRayShell
        active={xray}
        explode={[0, 0, -shellOffset * 0.2]}
        onClick={onShellClick}
      >
        <group position={[0, 0.3, -0.35]}>
          <JunctionBoxInternals detail={detail} />
        </group>
      </XRayShell>

      {/* BOTTOM CABLE ENTRY PLATE */}
      <XRayShell
        active={xray}
        explode={[0, -shellOffset, 0]}
        onClick={onShellClick}
      >
        <group position={[0, 0.24, 0]}>
          <CableEntryPlate />
        </group>
      </XRayShell>

      {/* INTERNAL PART SLOTS */}

      {detail === "high" && (
        <>
          {/* TERMINAL BLOCKS */}
          {renderSlot(
            0,
            <TerminalBlock
              highlight={Boolean(faults["terminal-block"])}
              detail={detail}
            />,
            0.5,
            [-partOffset, 0, 0]
          )}

          {/* CABLE LUGS */}
          {renderSlot(
            1,
            <Terminal
              highlight={Boolean(faults.terminal)}
              detail={detail}
            />,
            0.35,
            [partOffset, 0, 0]
          )}

          {/* CABLE GLANDS — repeated entries */}
          {renderSlot(
            2,
            <>
              {[-1.2, -0.4, 0.4, 1.2].map((x) => (
                <group
                  key={x}
                  position={[x, 0, 0]}
                >
                  <Gland
                    highlight={Boolean(faults.gland)}
                    detail={detail}
                  />
                </group>
              ))}
            </>,
            0.4,
            [0, -partOffset, 0]
          )}

          {/* CABLES — repeated cable entries */}
          {renderSlot(
            3,
            <>
              {[-1.2, -0.4, 0.4, 1.2].map((x, i) => (
                <group
                  key={x}
                  position={[x, 0, 0]}
                  rotation={[0, 0, i % 2 ? Math.PI : 0]}
                >
                  <Cable
                    highlight={Boolean(faults.cable)}
                    detail={detail}
                  />
                </group>
              ))}
            </>,
            0.5,
            [0, -partOffset, 0]
          )}

          {/* COVER SCREWS — repeated fasteners */}
          {renderSlot(
            4,
            <>
              {[
                [-1.75, 1.7, 0],
                [1.75, 1.7, 0],
                [-1.75, -1.7, 0],
                [1.75, -1.7, 0],
              ].map((p, i) => (
                <group
                  key={i}
                  position={p as [number, number, number]}
                >
                  <Screw
                    highlight={Boolean(faults.screw)}
                    detail={detail}
                  />
                </group>
              ))}
            </>,
            0.25,
            [0, 0, partOffset]
          )}
        </>
      )}

      {/* LOW DETAIL: retain only the main terminal block */}
      {detail === "low" &&
        renderSlot(
          0,
          <TerminalBlock
            highlight={Boolean(faults["terminal-block"])}
            detail="low"
          />,
          0.5
        )}
    </group>
  );
}