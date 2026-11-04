# Prompt — 3D part `bearing-ball` → `src/features/spare-3d/parts/bearing-ball/index.tsx`

Copy everything below the line into the code-generation AI. Paste its answer over `index.tsx` (keep the file name).

---
Write ONE React Three Fiber component file in TypeScript (TSX) for a procedural 3D model of a petrochemical spare part.

**Part:** Bearing ball — Deep-groove ball bearing: outer race torus, inner race torus, 8-12 balls in a cage ring. Axis along X.
**Real examples from Chandra Asri SAP data:** BEARING,BALL,1ROW,DEEP GROOVE,6210BDB; BEARING,BALL,ANGULAR,NU319BDB; BEARING,BALL,ANGULAR,7212; BEARING,BALL,1ROW,DEEP GROOVE,6305
**Fits inside:** centrifugal-pump, centrifugal-compressor, steam-turbine

Rules (must follow exactly):
1. Build only from three.js primitives / `@react-three/drei` helpers (no GLTF, no textures, no external files). Libraries allowed: `react`, `three`, `@react-three/fiber`, `@react-three/drei`.
2. Normalised size: the largest dimension = 1 unit, centred at the origin; rotating/axial parts have their axis along +X; flat parts lie in the YZ plane facing +X.
3. File header: `import type { PartProps, PartMeta } from "../../contract";`
4. `export const META: PartMeta = { id: "bearing-ball", name: "<English name>", size: [x, y, z] }` (true normalised bounding box).
5. `export default function BearingBall({ color, highlight, detail = "high" }: PartProps)` returns a `<group>`.
   - `color` overrides the main metal colour (default a realistic metal/material colour).
   - `highlight` → add red emissive (`#ef4444`, intensity 0.6) to all materials.
   - `detail === "low"` → ≤ 6 meshes and low segment counts (used in the plant layout); `"high"` → full detail, ≤ 60 meshes.
6. Use `meshStandardMaterial` with sensible `metalness`/`roughness`; no `castShadow` loops over thousands of meshes; memoise arrays with `useMemo`.
7. No state, no animation, no event handlers, no `<Canvas>` — the parent scene handles those.
8. Output only the code block of the full file.
