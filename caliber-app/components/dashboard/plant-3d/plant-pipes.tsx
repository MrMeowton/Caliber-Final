"use client";

// Low-key interconnecting pipes at grade: thin, matte, close to the floor colour so equipment stays the focus.
import { useMemo } from "react";
import { Quaternion, Vector3 } from "three";
import type { Vec3 } from "@/components/spare-3d/contract";

export type PipeConnection = { from: string; to: string; viaZ?: number };

const Y = 0.12;
const RADIUS = 0.05;
const COLOR = "#33404b";
const UP = new Vector3(0, 1, 0);

type Segment = { key: string; mid: Vector3; quat: Quaternion; length: number };

export default function PlantPipes({
  positions,
  connections,
}: {
  positions: Record<string, Vec3>;
  connections: PipeConnection[];
}) {
  const { segments, joints } = useMemo(() => {
    const segments: Segment[] = [];
    const joints: Vector3[] = [];
    for (const { from, to, viaZ } of connections) {
      const a = positions[from];
      const b = positions[to];
      if (!a || !b) continue;
      const z = viaZ ?? (a[2] + b[2]) / 2;
      // Orthogonal route: along z, then x, then z.
      const points = [
        new Vector3(a[0], Y, a[2]),
        new Vector3(a[0], Y, z),
        new Vector3(b[0], Y, z),
        new Vector3(b[0], Y, b[2]),
      ].filter((point, index, all) => index === 0 || point.distanceTo(all[index - 1]) > 0.01);

      points.slice(1).forEach((end, index) => {
        const start = points[index];
        const direction = end.clone().sub(start);
        segments.push({
          key: `${from}-${to}-${index}`,
          mid: start.clone().add(end).multiplyScalar(0.5),
          quat: new Quaternion().setFromUnitVectors(UP, direction.clone().normalize()),
          length: direction.length(),
        });
        if (index > 0) joints.push(start);
      });
    }
    return { segments, joints };
  }, [positions, connections]);

  return (
    <group>
      {segments.map((segment) => (
        <mesh key={segment.key} position={segment.mid} quaternion={segment.quat} raycast={() => null}>
          <cylinderGeometry args={[RADIUS, RADIUS, segment.length, 8]} />
          <meshStandardMaterial color={COLOR} roughness={0.85} metalness={0.2} />
        </mesh>
      ))}
      {joints.map((joint, index) => (
        <mesh key={index} position={joint} raycast={() => null}>
          <sphereGeometry args={[RADIUS * 1.2, 10, 8]} />
          <meshStandardMaterial color={COLOR} roughness={0.85} metalness={0.2} />
        </mesh>
      ))}
    </group>
  );
}
