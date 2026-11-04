# 3D module — Plant layout → isolate equipment → X-ray → exploded parts

Same pattern as `Learning-By-Building/04-xray-asset-view` (procedural three.js primitives, `XRayShell` + `FaultPulse`), extended to 3 levels:

```
PlantView   (src/data/plant-layout.json: 18 real tags, e.g. BF-112, KT-856A, PP-1574B)
  └─ click equipment → isolate (camera flies in, others hidden, detail="high")
       └─ X-Ray button / click casing → shells transparent (XRayShell)
            └─ Explode slider → shells + parts move apart; faulty slots pulse red (FaultPulse)
                 └─ click part → side panel: SKU, stock vs Min/ROP, recommendation (from SQLite)
```

## Folder layout
| Path | What | Who writes it |
|---|---|---|
| `contract.ts` | Props/types every model must follow | fixed |
| `core/` | `XRayShell`, `FaultPulse` (from Learning-By-Building), `Placeholder` | fixed |
| `parts/<part-id>/` | 60 spare-part models (53 SAP families; BEARING, SEAL, VALVE split by type) | **other AI**, from `PROMPT.md` |
| `equipment/<equipment-id>/` | 17 equipment assemblies with `SLOTS` | **other AI**, from `PROMPT.md` |
| `registry.ts` | id → component map | generated |
| `src/data/3d-catalog.json`, `src/data/plant-layout.json` | catalog + layout from the case data | generated |
| `CATALOG.md` (project root) | readable list of all parts / equipment / layout | generated |

Every folder already contains a working **placeholder** `index.tsx`, so the app runs before any model exists.

## Workflow to fill a model (token-saving)
1. Open `parts/<id>/PROMPT.md` (or `equipment/<id>/PROMPT.md`), copy everything below the line into the other AI.
2. Paste the answer over `index.tsx` in the same folder. Keep the file name and the exports (`default`, `META` / `SLOTS`).
3. `npm run typecheck` (or open `npm run dev` and pick it in the viewer) — a type error means the model broke the contract; send the error back to that AI.
4. Order: P1 parts first (see `CATALOG.md`), then the equipment that uses them: `cracking-furnace`, `centrifugal-compressor`, `steam-turbine`, `centrifugal-pump`, `control-valve`. The rest can stay placeholders for the demo.
5. Re-running `scripts/gen_3d_catalog.py` refreshes PROMPT.md, registry and JSON but never overwrites an `index.tsx` whose first line no longer says `PLACEHOLDER`.

## Faults = spare-part risk (not vibration)
For this case, a slot "has a problem" when its parts have stock risk. Map in the app (from SQLite `recommendation`):
`equipment tag → BoM materials (bom.funcloc LIKE 'PX_<tag>%') → part id (family, + type for BEARING/SEAL/VALVE) → slot.part`.
Worst status per slot → `faults[slot.id] = { value: "Stock 0 / ROP 4", severity: "critical" }` (critical = S/A item below ROP; warning = below Min or overstock).

## Remaining viewer files (prompts for the other AI; write them once the parts are in)
- `PlantView.tsx` — `<Canvas>` + lights + ground grid; renders each `PlantItem` with `EQUIPMENT[item.equipment].Component` at `position`, `detail="low"`, a floating tag label (JetBrains Mono, e.g. `BF-112`) coloured by worst fault; click → `onSelect(tag)`.
- `EquipmentView.tsx` — isolated equipment: camera tween to it (drei `CameraControls`), others hidden, toolbar X-Ray toggle (key X / Esc as in Learning-By-Building), Explode slider 0–1, fault badge "N parts at risk", `onPartClick` → side panel.
- Style (control-room) (bg `#0B0F14`, critical `#E5534B`, AI `#4EA8DE`), English UI text, numbers with units.
