// Temporary stand-in used by every generated folder until its real model is pasted in.
// (No drei <Html> label here: it throws on unmount when the viewer switches items; the toolbar shows the name.)
import type { PartProps, Vec3 } from "../contract";

type Props = PartProps & { label: string; xray?: boolean; size?: Vec3; onClick?: () => void };

export function Placeholder({ color = "#64748b", highlight, xray, size = [1, 1, 1], onClick }: Props) {
  return (
    <group onClick={onClick ? (e) => { e.stopPropagation(); onClick(); } : undefined}>
      <mesh>
        <boxGeometry args={size} />
        <meshStandardMaterial color={highlight ? "#ef4444" : color} wireframe={xray} transparent opacity={xray ? 0.4 : 1} />
      </mesh>
    </group>
  );
}
