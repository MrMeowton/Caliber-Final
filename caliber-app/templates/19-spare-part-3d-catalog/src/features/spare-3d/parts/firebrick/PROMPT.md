# Prompt — 3D part `firebrick` → `src/features/spare-3d/parts/firebrick/index.tsx`

Copy everything below the line into the code-generation AI. Paste its answer over `index.tsx` (keep the file name).

---
Write ONE React Three Fiber component file in TypeScript (TSX) for a procedural 3D model of a petrochemical spare part.

**Part:** Firebrick — Insulating firebrick: rectangular brick (230x114x76 mm) with porous look.
**Real examples from Chandra Asri SAP data:** FIREBRICK,INSUL,23,65T,114W,230L; FIREBRICK,INSUL,28,65T,114W,230L; FIREBRICK,INSUL,28,65T,114W,230L; FIREBRICK,INSUL,26,76T,114W,230L
**Fits inside:** cracking-furnace

Rules (must follow exactly):
1. Build only from three.js primitives / `@react-three/drei` helpers (no GLTF, no textures, no external files). Libraries allowed: `react`, `three`, `@react-three/fiber`, `@react-three/drei`.
2. Normalised size: the largest dimension = 1 unit, centred at the origin; rotating/axial parts have their axis along +X; flat parts lie in the YZ plane facing +X.
3. File header: `import type { PartProps, PartMeta } from "../../contract";`
4. `export const META: PartMeta = { id: "firebrick", name: "<English name>", size: [x, y, z] }` (true normalised bounding box).
5. `export default function Firebrick({ color, highlight, detail = "high" }: PartProps)` returns a `<group>`.
   - `color` overrides the main metal colour (default a realistic metal/material colour).
   - `highlight` → add red emissive (`#ef4444`, intensity 0.6) to all materials.
   - `detail === "low"` → ≤ 6 meshes and low segment counts (used in the plant layout); `"high"` → full detail, ≤ 60 meshes.
6. Use `meshStandardMaterial` with sensible `metalness`/`roughness`; no `castShadow` loops over thousands of meshes; memoise arrays with `useMemo`.
7. No state, no animation, no event handlers, no `<Canvas>` — the parent scene handles those.
8. Output only the code block of the full file.
