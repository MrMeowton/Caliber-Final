"use client";

// The assembled plant's civil and piping work: one concrete slab, a paved pad per process area,
// a central pipe rack and the branch lines that tie every unit into it.
import type { ThreeEvent } from "@react-three/fiber";
import type { Vec3 } from "@/components/spare-3d/contract";
import { PipeRuns } from "./plant-pipes";

export type Area = { id: string; name: string; rect: [number, number, number, number] };
export type Rack = { from: number; to: number; z: number; width: number; height: number };

const STEEL = "#3b4752";
const RACK_PIPES = ["#4a5864", "#56646f", "#4a5864"];

export default function PlantStructure({
  areas,
  rack,
  pipes,
  onClick,
}: {
  areas: Area[];
  rack: Rack;
  pipes: Vec3[][];
  onClick: () => void;
}) {
  const xs = areas.flatMap((a) => [a.rect[0], a.rect[2]]).concat(rack.from, rack.to);
  const zs = areas.flatMap((a) => [a.rect[1], a.rect[3]]);
  const slab = { x0: Math.min(...xs) - 1, x1: Math.max(...xs) + 1, z0: Math.min(...zs) - 0.8, z1: Math.max(...zs) + 0.8 };

  const bays = Math.max(1, Math.round((rack.to - rack.from) / 3));
  const postXs = Array.from({ length: bays + 1 }, (_, i) => rack.from + ((rack.to - rack.from) * i) / bays);
  const half = rack.width / 2;
  const rackLen = rack.to - rack.from;
  const rackMid = (rack.from + rack.to) / 2;

  const click = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onClick();
  };

  return (
    <group
      onClick={click}
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "")}
    >
      {/* Slab */}
      <mesh position={[(slab.x0 + slab.x1) / 2, -0.06, (slab.z0 + slab.z1) / 2]}>
        <boxGeometry args={[slab.x1 - slab.x0, 0.1, slab.z1 - slab.z0]} />
        <meshStandardMaterial color="#1c252e" roughness={0.95} />
      </mesh>

      {/* Area pads */}
      {areas.map((a) => {
        const [x0, z0, x1, z1] = a.rect;
        return (
          <mesh key={a.id} position={[(x0 + x1) / 2, 0.005, (z0 + z1) / 2]} raycast={() => null}>
            <boxGeometry args={[x1 - x0, 0.02, z1 - z0]} />
            <meshStandardMaterial color="#25313b" roughness={0.9} />
          </mesh>
        );
      })}

      {/* Pipe rack: portal frames, longitudinal beams, three header pipes */}
      {postXs.map((x) => (
        <group key={x}>
          {[-half, half].map((dz) => (
            <mesh key={dz} position={[x, rack.height / 2, rack.z + dz]} raycast={() => null}>
              <boxGeometry args={[0.12, rack.height, 0.12]} />
              <meshStandardMaterial color={STEEL} roughness={0.7} metalness={0.4} />
            </mesh>
          ))}
          <mesh position={[x, rack.height - 0.12, rack.z]} raycast={() => null}>
            <boxGeometry args={[0.12, 0.1, rack.width + 0.12]} />
            <meshStandardMaterial color={STEEL} roughness={0.7} metalness={0.4} />
          </mesh>
        </group>
      ))}
      {[-half, half].map((dz) => (
        <mesh key={dz} position={[rackMid, rack.height - 0.12, rack.z + dz]} raycast={() => null}>
          <boxGeometry args={[rackLen, 0.08, 0.08]} />
          <meshStandardMaterial color={STEEL} roughness={0.7} metalness={0.4} />
        </mesh>
      ))}
      {[-0.4, 0, 0.4].map((dz, i) => (
        <mesh key={dz} position={[rackMid, rack.height, rack.z + dz]} rotation={[0, 0, Math.PI / 2]} raycast={() => null}>
          <cylinderGeometry args={[0.09, 0.09, rackLen, 10]} />
          <meshStandardMaterial color={RACK_PIPES[i]} roughness={0.6} metalness={0.5} />
        </mesh>
      ))}

      <PipeRuns runs={pipes} radius={0.06} color="#475663" />
    </group>
  );
}
