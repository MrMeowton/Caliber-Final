# 19 — Spare-Part 3D Catalog (X-Ray + exploded view)

Template for 3D models of **all spare parts and equipment in the CALIBER 2026 final case data** (Chandra Asri cracker), following the pattern from `04-xray-asset-view`: procedural three.js primitives, `XRayShell` (transparent casing + explode), `FaultPulse` (faulty part pulses red).

- **60 spare-part models** (53 SAP families; BEARING/SEAL/VALVE split by type) → `src/features/spare-3d/parts/<id>/`
- **17 equipment assemblies** (BF furnace, KC compressor, KT turbine, PP pump, control valve, PRV, HE, VD, CL, instruments, piping…) → `src/features/spare-3d/equipment/<id>/`
- Each folder: `PROMPT.md` (copy to another AI) + `index.tsx` (placeholder → paste the generated code here).
- `CATALOG.md` = full list with SKU counts; `src/data/plant-layout.json` = 18 real tags (BF-112, KT-856A, PP-1574B…).

```bash
npm install
npm run dev        # viewer: pick part/equipment, X-Ray, explode, simulate fault; ● = generated, ○ = placeholder
npm run typecheck  # checks pasted models against src/features/spare-3d/contract.ts
npm run generate -- "C:\path\to\Supporting Data"   # re-generate catalog/prompts (Python 3 + pandas + openpyxl; never overwrites real models)
```

Module docs & workflow: `src/features/spare-3d/README.md`. To use in the hackathon app: copy `src/features/spare-3d` (+ `src/data`) into the project and install `three @react-three/fiber @react-three/drei`.
