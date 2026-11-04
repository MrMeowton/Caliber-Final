# Prompt — 3D equipment `steam-turbine` → `src/features/spare-3d/equipment/steam-turbine/index.tsx`

Generate the parts first (their PROMPT.md files); this assembly imports them. Copy everything below the line into the AI.

---
Write ONE React Three Fiber TSX file: an X-ray-capable, explodable 3D assembly of a **Steam turbine driver (KT)** in a naphtha cracker.
Approximate real size L×H×W = 5×3×3 m; model it so the longest side = 4 units, base at y = 0.

**Outer shell / casing:** Split casing with steam chest on top; governor valve rack; exhaust hood.

**Part slots (internal parts shown in x-ray; ids are used by fault data):**
| slot id | part component | name | placement |
|---|---|---|---|
| `rotor-blades` | `blade` → `Blade` | Rotor blade rows | 3-5 discs on shaft |
| `journal-de` | `bearing-journal` → `BearingJournal` | Journal bearing | each end |
| `thrust` | `bearing-thrust-pad` → `BearingThrustPad` | Thrust bearing | front pedestal |
| `gov-valve` | `valve-governor` → `ValveGovernor` | Governor valve | steam chest |
| `gland-seal` | `seal-labyrinth` → `SealLabyrinth` | Gland labyrinth seals | shaft ends |
| `trip-spring` | `spring` → `Spring` | Trip valve spring | trip valve |
| `solenoid` | `solenoid-valve` → `SolenoidValve` | Trip solenoid | on trip block |
| `speed-tx` | `transmitter` → `Transmitter` | Speed/pressure transmitter | front |
| `casing-gasket` | `gasket` → `Gasket` | Casing joint gasket | split line |

Imports to use (already exist, each accepts `PartProps` = { color?, highlight?, detail? } and is normalised to 1 unit, axis +X):
```ts
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
```
Rules:
1. `export const SLOTS: SlotDef[]` — one entry per slot above with real `position`/`rotation`/`scale` (also used to place labels). Repeated parts (blades, burners, trays, bolts) = one slot rendered several times.
2. `export default function SteamTurbine({ xray = false, explode = 0, faults = {}, onShellClick, onPartClick, detail = "high" }: EquipmentProps)`.
3. Every casing/shell mesh group is wrapped in `<XRayShell active={xray} explode={[dx*explode, dy*explode, dz*explode]} onClick={onShellClick}>` (choose a sensible exploded offset per shell piece, max 1.5 units).
4. Every slot is wrapped in `<FaultPulse active={Boolean(faults[slot.id])} position={slot.position} radius={…} label={faults[slot.id] && { title: slot.name, value: faults[slot.id].value }} showLabel={xray} onClick={xray ? () => onPartClick?.(slot.id) : undefined}>` and renders the part with `highlight={Boolean(faults[slot.id])}` and `detail={detail}`.
5. When `explode > 0`, internal parts also move apart along their main axis (multiply offsets by `explode`) so each part is visible separately.
6. `detail === "low"` → render only shells + 1–2 key parts (plant layout view).
7. Rotating parts may spin slowly with `useFrame` only when `detail === "high"`.
8. No `<Canvas>`, no lights, no state other than refs. Output only the full file.
