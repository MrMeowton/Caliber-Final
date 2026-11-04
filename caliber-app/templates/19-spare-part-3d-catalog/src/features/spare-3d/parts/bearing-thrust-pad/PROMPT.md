# Prompt — 3D part `bearing-thrust-pad` → `src/features/spare-3d/parts/bearing-thrust-pad/index.tsx`

Copy everything below the line into the code-generation AI. Paste its answer over `index.tsx` (keep the file name).

---
Write ONE React Three Fiber component file in TypeScript (TSX) for a procedural 3D model of a petrochemical spare part.

**Part:** Bearing thrust pad — Tilting-pad thrust bearing: ring of 6-8 kidney-shaped pads on a carrier ring facing a thrust collar disc.
**Real examples from Chandra Asri SAP data:** BEARING,THRUST PAD,SIZE NO123,A105; BEARING,THRUST PAD,TYPE AS180,A105; BEARING,THRUST PAD,DWG.148-3158,FOR KC-1; BEARING,THRUST PAD,DWG.182-5089,FOR KC-1
**Fits inside:** steam-turbine, centrifugal-compressor

Rules (must follow exactly):
1. Build only from three.js primitives / `@react-three/drei` helpers (no GLTF, no textures, no external files). Libraries allowed: `react`, `three`, `@react-three/fiber`, `@react-three/drei`.
2. Normalised size: the largest dimension = 1 unit, centred at the origin; rotating/axial parts have their axis along +X; flat parts lie in the YZ plane facing +X.
3. File header: `import type { PartProps, PartMeta } from "../../contract";`
4. `export const META: PartMeta = { id: "bearing-thrust-pad", name: "<English name>", size: [x, y, z] }` (true normalised bounding box).
5. `export default function BearingThrustPad({ color, highlight, detail = "high" }: PartProps)` returns a `<group>`.
   - `color` overrides the main metal colour (default a realistic metal/material colour).
   - `highlight` → add red emissive (`#ef4444`, intensity 0.6) to all materials.
   - `detail === "low"` → ≤ 6 meshes and low segment counts (used in the plant layout); `"high"` → full detail, ≤ 60 meshes.
6. Use `meshStandardMaterial` with sensible `metalness`/`roughness`; no `castShadow` loops over thousands of meshes; memoise arrays with `useMemo`.
7. No state, no animation, no event handlers, no `<Canvas>` — the parent scene handles those.
8. Output only the code block of the full file.
