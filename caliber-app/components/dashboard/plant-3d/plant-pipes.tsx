"use client";

// Low-key pipes: thin, matte, close to the floor colour so equipment stays the focus.
import { useMemo } from "react";
import { Quaternion, Vector3 } from "three";
import type { Vec3 } from "@/components/spare-3d/contract";

export type PipeConnection = { from: string; to: string };

const Y = 0.12;
const UP = new Vector3(0, 1, 0);

type Segment = { key: string; mid: Vector3; quat: Quaternion; length: number };

/** Draws polylines as straight pipe segments with small elbow joints. */
export function PipeRuns({
  runs,
  radius = 0.05,
  color = "#33404b",
}: {
  runs: Vec3[][];
  radius?: number;
  color?: string;
}) {
  const { segments, joints } = useMemo(() => {
    const segments: Segment[] = [];
    const joints: Vector3[] = [];
    runs.forEach((run, r) => {
      const points = run
        .map((p) => new Vector3(...p))
        .filter((point, index, all) => index === 0 || point.distanceTo(all[index - 1]) > 0.01);
      points.slice(1).forEach((end, index) => {
        const start = points[index];
        const direction = end.clone().sub(start);
        segments.push({
          key: `${r}-${index}`,
          mid: start.clone().add(end).multiplyScalar(0.5),
          quat: new Quaternion().setFromUnitVectors(UP, direction.clone().normalize()),
          length: direction.length(),
        });
        if (index > 0) joints.push(start);
      });
    });
    return { segments, joints };
  }, [runs]);

  return (
    <group>
      {segments.map((segment) => (
        <mesh key={segment.key} position={segment.mid} quaternion={segment.quat} raycast={() => null}>
          <cylinderGeometry args={[radius, radius, segment.length, 8]} />
          <meshStandardMaterial color={color} roughness={0.85} metalness={0.2} />
        </mesh>
      ))}
      {joints.map((joint, index) => (
        <mesh key={index} position={joint} raycast={() => null}>
          <sphereGeometry args={[radius * 1.2, 10, 8]} />
          <meshStandardMaterial color={color} roughness={0.85} metalness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

/** Process links between split-apart equipment, routed orthogonally at grade. */
export default function PlantPipes({
  positions,
  connections,
}: {
  positions: Record<string, Vec3>;
  connections: PipeConnection[];
}) {
  const runs = useMemo(
    () =>
      connections.flatMap(({ from, to }) => {
        const a = positions[from];
        const b = positions[to];
        if (!a || !b) return [];
        const z = (a[2] + b[2]) / 2;
        return [[[a[0], Y, a[2]], [a[0], Y, z], [b[0], Y, z], [b[0], Y, b[2]]] as Vec3[]];
      }),
    [positions, connections]
  );
  return <PipeRuns runs={runs} />;
}
