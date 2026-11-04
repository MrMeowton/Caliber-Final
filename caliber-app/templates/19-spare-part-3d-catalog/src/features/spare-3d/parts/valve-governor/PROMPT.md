# Prompt — 3D part `valve-governor` → `src/features/spare-3d/parts/valve-governor/index.tsx`

Copy everything below the line into the code-generation AI. Paste its answer over `index.tsx` (keep the file name).

---
Write ONE React Three Fiber component file in TypeScript (TSX) for a procedural 3D model of a petrochemical spare part.

**Part:** Valve governor — Steam turbine governor valve: valve chest with plug/cage, actuator linkage and servo cylinder on top.
**Real examples from Chandra Asri SAP data:** VALVE,GOVERNOR,SIZE UI72,CS; VALVE,GOVERNOR,DWG.336-2904,FOR KT-202; VALVE,GOVERNOR,DWG.279-1636,FOR KT-202; VALVE,GOVERNOR,DWG.303-3064,FOR KT-202
**Fits inside:** steam-turbine

Rules (must follow exactly):
1. Build only from three.js primitives / `@react-three/drei` helpers (no GLTF, no textures, no external files). Libraries allowed: `react`, `three`, `@react-three/fiber`, `@react-three/drei`.
2. Normalised size: the largest dimension = 1 unit, centred at the origin; rotating/axial parts have their axis along +X; flat parts lie in the YZ plane facing +X.
3. File header: `import type { PartProps, PartMeta } from "../../contract";`
4. `export const META: PartMeta = { id: "valve-governor", name: "<English name>", size: [x, y, z] }` (true normalised bounding box).
5. `export default function ValveGovernor({ color, highlight, detail = "high" }: PartProps)` returns a `<group>`.
   - `color` overrides the main metal colour (default a realistic metal/material colour).
   - `highlight` → add red emissive (`#ef4444`, intensity 0.6) to all materials.
   - `detail === "low"` → ≤ 6 meshes and low segment counts (used in the plant layout); `"high"` → full detail, ≤ 60 meshes.
6. Use `meshStandardMaterial` with sensible `metalness`/`roughness`; no `castShadow` loops over thousands of meshes; memoise arrays with `useMemo`.
7. No state, no animation, no event handlers, no `<Canvas>` — the parent scene handles those.
8. Output only the code block of the full file.
