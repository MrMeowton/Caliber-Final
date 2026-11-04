# Prompt — 3D part `seal-labyrinth` → `src/features/spare-3d/parts/seal-labyrinth/index.tsx`

Copy everything below the line into the code-generation AI. Paste its answer over `index.tsx` (keep the file name).

---
Write ONE React Three Fiber component file in TypeScript (TSX) for a procedural 3D model of a petrochemical spare part.

**Part:** Seal labyrinth — Labyrinth seal: short sleeve with 6-10 thin circumferential knife-edge teeth (stacked torus/thin cylinders).
**Real examples from Chandra Asri SAP data:** SEAL,LABYRINTH,DWG.702-2423,FOR KC-106B; SEAL,LABYRINTH,TYPE KI535,A182F11; SEAL,LABYRINTH,DWG.698-7509,FOR KC-145; SEAL,LABYRINTH,DWG.694-8721,FOR KC-150A
**Fits inside:** centrifugal-compressor, steam-turbine

Rules (must follow exactly):
1. Build only from three.js primitives / `@react-three/drei` helpers (no GLTF, no textures, no external files). Libraries allowed: `react`, `three`, `@react-three/fiber`, `@react-three/drei`.
2. Normalised size: the largest dimension = 1 unit, centred at the origin; rotating/axial parts have their axis along +X; flat parts lie in the YZ plane facing +X.
3. File header: `import type { PartProps, PartMeta } from "../../contract";`
4. `export const META: PartMeta = { id: "seal-labyrinth", name: "<English name>", size: [x, y, z] }` (true normalised bounding box).
5. `export default function SealLabyrinth({ color, highlight, detail = "high" }: PartProps)` returns a `<group>`.
   - `color` overrides the main metal colour (default a realistic metal/material colour).
   - `highlight` → add red emissive (`#ef4444`, intensity 0.6) to all materials.
   - `detail === "low"` → ≤ 6 meshes and low segment counts (used in the plant layout); `"high"` → full detail, ≤ 60 meshes.
6. Use `meshStandardMaterial` with sensible `metalness`/`roughness`; no `castShadow` loops over thousands of meshes; memoise arrays with `useMemo`.
7. No state, no animation, no event handlers, no `<Canvas>` — the parent scene handles those.
8. Output only the code block of the full file.
