# Prompt — 3D equipment `safety-valve` → `src/features/spare-3d/equipment/safety-valve/index.tsx`

Generate the parts first (their PROMPT.md files); this assembly imports them. Copy everything below the line into the AI.

---
Write ONE React Three Fiber TSX file: an X-ray-capable, explodable 3D assembly of a **Pressure safety valve (PRV)** in a naphtha cracker.
Approximate real size L×H×W = 0.5×1.2×0.5 m; model it so the longest side = 4 units, base at y = 0.

**Outer shell / casing:** Angle body + bonnet + cap; bonnet fades to show spring.

**Part slots (internal parts shown in x-ray; ids are used by fault data):**
| slot id | part component | name | placement |
|---|---|---|---|
| `spring` | `spring` → `Spring` | Set-pressure spring | bonnet |
| `disc` | `disc` → `Disc` | Disc | on nozzle |
| `nozzle` | `nozzle` → `Nozzle` | Nozzle | inlet |
| `gasket` | `gasket` → `Gasket` | Inlet gasket | inlet flange |
| `studbolts` | `studbolt` → `Studbolt` | Studbolts | flanges |

Imports to use (already exist, each accepts `PartProps` = { color?, highlight?, detail? } and is normalised to 1 unit, axis +X):
```ts
import type { EquipmentProps, SlotDef } from "../../contract";
import { XRayShell, FaultPulse } from "../../core";
import Disc from "../../parts/disc";
import Gasket from "../../parts/gasket";
import Nozzle from "../../parts/nozzle";
import Spring from "../../parts/spring";
import Studbolt from "../../parts/studbolt";
```
Rules:
1. `export const SLOTS: SlotDef[]` — one entry per slot above with real `position`/`rotation`/`scale` (also used to place labels). Repeated parts (blades, burners, trays, bolts) = one slot rendered several times.
2. `export default function SafetyValve({ xray = false, explode = 0, faults = {}, onShellClick, onPartClick, detail = "high" }: EquipmentProps)`.
3. Every casing/shell mesh group is wrapped in `<XRayShell active={xray} explode={[dx*explode, dy*explode, dz*explode]} onClick={onShellClick}>` (choose a sensible exploded offset per shell piece, max 1.5 units).
4. Every slot is wrapped in `<FaultPulse active={Boolean(faults[slot.id])} position={slot.position} radius={…} label={faults[slot.id] && { title: slot.name, value: faults[slot.id].value }} showLabel={xray} onClick={xray ? () => onPartClick?.(slot.id) : undefined}>` and renders the part with `highlight={Boolean(faults[slot.id])}` and `detail={detail}`.
5. When `explode > 0`, internal parts also move apart along their main axis (multiply offsets by `explode`) so each part is visible separately.
6. `detail === "low"` → render only shells + 1–2 key parts (plant layout view).
7. Rotating parts may spin slowly with `useFrame` only when `detail === "high"`.
8. No `<Canvas>`, no lights, no state other than refs. Output only the full file.
