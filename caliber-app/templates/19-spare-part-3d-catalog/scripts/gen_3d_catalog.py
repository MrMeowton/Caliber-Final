#!/usr/bin/env python3
"""Generate the 3D template tree for MIND Spares from the case Supporting Data.

Usage: python3 scripts/gen_3d_catalog.py "<path to Supporting Data folder>"
Writes: src/features/spare-3d/parts/<part>/{index.tsx,PROMPT.md}
        src/features/spare-3d/equipment/<equipment>/{index.tsx,PROMPT.md}
        src/features/spare-3d/registry.ts · src/data/3d-catalog.json · src/data/plant-layout.json · CATALOG.md
Re-run safely: index.tsx is only written if it is still the placeholder (never overwrites generated models).
"""
import json, re, sys
from pathlib import Path
try:
    import pandas as pd  # also needs openpyxl to read .xlsx
except ImportError:
    sys.exit("Missing Python packages. Run: pip install pandas openpyxl")

DATA = Path(sys.argv[1] if len(sys.argv) > 1 else "Supporting Data")
ROOT = Path(__file__).resolve().parent.parent
THREE = ROOT / "src" / "features" / "spare-3d"
VARIANTS = {"BEARING", "SEAL", "VALVE"}  # families split by 2nd description token (different shapes)

# ---------- part modelling hints: key -> (category, priority, geometry hint) ----------
# priority: P1 = in demo equipment (furnace, compressor/turbine, pump, valves) · P2 = other equipment · P3 = consumable/bulk
P = {
 "bearing-ball": ("rotating", "P1", "Deep-groove ball bearing: outer race torus, inner race torus, 8-12 balls in a cage ring. Axis along X."),
 "bearing-roller": ("rotating", "P1", "Cylindrical roller bearing: outer/inner rings (tube geometry) with 12-16 short cylinders as rollers, axial along X."),
 "bearing-journal": ("rotating", "P1", "Hydrodynamic journal (sleeve) bearing: split babbitt-lined shell, two half-cylinders (top/bottom) with oil groove and anti-rotation pin."),
 "bearing-thrust-pad": ("rotating", "P1", "Tilting-pad thrust bearing: ring of 6-8 kidney-shaped pads on a carrier ring facing a thrust collar disc."),
 "seal-labyrinth": ("sealing", "P1", "Labyrinth seal: short sleeve with 6-10 thin circumferential knife-edge teeth (stacked torus/thin cylinders)."),
 "seal-mechanical": ("sealing", "P1", "Cartridge mechanical seal: gland plate (flange with 4 bolt holes), sleeve, rotating face ring + stationary face ring, spring set."),
 "valve-gate": ("valve", "P1", "Gate valve: flanged body, bonnet, yoke, handwheel on rising stem, wedge gate inside (gate visible when body in x-ray)."),
 "valve-globe": ("valve", "P1", "Globe valve: spherical-ish body with flanges, bonnet, stem, handwheel, plug + seat inside."),
 "valve-needle": ("valve", "P2", "Needle (instrument) valve: small hex bar-stock body, T-handle, tapered needle stem."),
 "valve-governor": ("valve", "P1", "Steam turbine governor valve: valve chest with plug/cage, actuator linkage and servo cylinder on top."),
 "trim-set": ("valve-internal", "P1", "Control valve trim: cage (perforated cylinder), plug, stem, seat ring stacked on Y axis."),
 "positioner": ("instrument", "P1", "Valve positioner: rectangular housing with display window, gauge ports, feedback lever arm."),
 "seat-ring": ("valve-internal", "P1", "Seat ring: thick short ring with chamfered sealing edge and threads (torus + cylinder)."),
 "packing-set": ("sealing", "P2", "Valve stem packing set: stack of 5 square-section rings with spacer/lantern ring."),
 "diaphragm": ("valve-internal", "P2", "Actuator diaphragm: thin flexible disc with a molded convolution (lathe geometry)."),
 "coupling": ("rotating", "P1", "Flexible disc/grid coupling: two hubs with flanges and a spacer, bolt circle between flanges."),
 "spring": ("valve-internal", "P1", "Helical compression spring (TubeGeometry along a helix curve) with ground flat ends."),
 "impeller": ("rotating", "P1", "Closed centrifugal pump impeller: hub, shroud discs, 6-7 curved backward vanes."),
 "blade": ("rotating", "P1", "Turbine/compressor rotor blade: twisted aerofoil (extruded curved profile) with fir-tree root."),
 "sleeve": ("rotating", "P2", "Shaft sleeve: thin tube with keyway slot and collar."),
 "ring": ("rotating", "P2", "Pump wear ring: plain ring with small L-section (casing/impeller wear ring)."),
 "disc": ("valve-internal", "P2", "Safety valve disc: disc with sealing lip and guide stem stub."),
 "nozzle": ("valve-internal", "P2", "Safety valve nozzle: flanged short tube with contoured bore and seat face on top."),
 "gasket": ("sealing", "P1", "Spiral-wound / ring gasket: flat annulus with inner + outer guide rings."),
 "studbolt": ("fastener", "P2", "Stud bolt: threaded rod with two hex nuts."),
 "o-ring": ("sealing", "P2", "O-ring: torus."),
 "thermowell": ("instrument", "P2", "Thermowell: tapered closed-end tube with flange at the top."),
 "thermocouple": ("instrument", "P1", "Thermocouple assembly: long thin sheath, head (small cylinder) with cable gland."),
 "transmitter": ("instrument", "P2", "Pressure/DP transmitter: twin-chamber housing, round electronics head with display, process flange below."),
 "fan": ("rotating", "P2", "Motor cooling fan: hub with 8-12 straight radial blades."),
 "demister-pad": ("internal", "P2", "Wire-mesh demister pad: flat circular slab with mesh texture/grid lines and support grid."),
 "pipe": ("piping", "P2", "Pipe spool: straight cylinder (tube) with bevelled ends."),
 "filter-element": ("rotating-aux", "P2", "Lube oil filter element: pleated cylindrical cartridge (star-shaped cross-section) with end caps."),
 "connector": ("instrument", "P3", "Tube fitting connector (male): hex body + threaded end + ferrule nut."),
 "solenoid-valve": ("instrument", "P2", "Solenoid valve: small valve body with coil housing cylinder on top and cable entry."),
 "gland": ("instrument", "P3", "Cable gland: hex body + dome cap with cable hole."),
 "oil": ("consumable", "P3", "Lube oil: 20 L pail or oil sump level block (translucent amber)."),
 "switch": ("instrument", "P2", "Limit switch: rectangular body with roller-lever arm."),
 "flange": ("piping", "P2", "Weld-neck flange: disc with bolt-hole circle and hub."),
 "burner-tip": ("furnace", "P1", "Furnace burner tip: short nozzle cylinder with drilled gas ports around a dome."),
 "tray-valve": ("internal", "P2", "Column tray valve: round floating cap with 3 bent legs."),
 "tubing": ("piping", "P3", "Instrument tubing: thin tube bent with 2 elbows."),
 "firebrick": ("furnace", "P1", "Insulating firebrick: rectangular brick (230x114x76 mm) with porous look."),
 "tube-plug": ("internal", "P2", "Heat exchanger tube plug: tapered pin."),
 "castable": ("furnace", "P1", "Refractory castable lining: thick curved slab section (furnace wall layer)."),
 "ceramic-fiber": ("furnace", "P1", "Ceramic fiber blanket: soft rolled blanket layer (box with rounded edges)."),
 "elbow": ("piping", "P3", "Pipe elbow 45/90 deg (torus segment)."),
 "anchor": ("furnace", "P2", "Refractory anchor: V-shaped steel anchor (two bent rods) welded on a plate."),
 "tee": ("piping", "P3", "Pipe tee: two intersecting cylinders."),
 "gauge": ("instrument", "P2", "Pressure gauge: round dial face with needle and bottom connection."),
 "terminal": ("electrical", "P3", "Crimp terminal lug: small ring/fork tongue + barrel."),
 "screw": ("fastener", "P3", "Screw: head + threaded shank."),
 "grease": ("consumable", "P3", "Grease cartridge/keg: cylinder with lid."),
 "bolt": ("fastener", "P3", "Anchor bolt: rod with L-bend and nut."),
 "antirust": ("consumable", "P3", "Antirust spray can: cylinder with dome and nozzle cap."),
 "lamp": ("electrical", "P3", "LED lamp: bulb on E27 base."),
 "terminal-block": ("electrical", "P3", "DIN terminal block: thin stacked slices with screw tops on a rail."),
 "screen": ("internal", "P3", "Vessel/column inlet screen: perforated cylinder or flat mesh panel."),
 "tape": ("consumable", "P3", "PTFE/anti-corrosion tape roll: short wide torus/tube."),
 "cable": ("electrical", "P3", "Cable: bent tube with jacket."),
}

# ---------- equipment: key -> (name, tag types, size [L,H,W] m, shells, slots[(slot_id, part, name, role)]) ----------
E = {
 "cracking-furnace": ("Cracking furnace (BF)", ["BF"], [14, 30, 8],
   "Refractory-lined firebox box, convection section above, stack on top, side peep doors; walls split for exploded view",
   [("burner-tips","burner-tip","Floor burners","row of 6-8 on firebox floor"),("radiant-coil","pipe","Radiant coil","vertical U-tubes in firebox"),
    ("lining-castable","castable","Castable lining","inner wall layer"),("lining-fiber","ceramic-fiber","Ceramic fiber layer","behind castable"),
    ("firebrick","firebrick","Firebrick floor","floor tiles"),("anchors","anchor","Refractory anchors","on wall plate"),
    ("coil-outlet-tc","thermocouple","Coil outlet thermocouple","on outlet pipe"),("outlet-gasket","gasket","Outlet flange gasket","coil outlet flange"),
    ("fuel-gas-valve","valve-gate","Fuel gas header gate valve","burner header")]),
 "centrifugal-compressor": ("Centrifugal compressor / blower (KC)", ["KC"], [6, 3, 3],
   "Horizontally split casing (top half lifts in explode), suction/discharge nozzles, base skid",
   [("bearing-de","bearing-journal","Journal bearing DE","shaft x=-1"),("bearing-nde","bearing-journal","Journal bearing NDE","shaft x=+1"),
    ("thrust","bearing-thrust-pad","Thrust bearing","NDE end"),("impellers","impeller","Impeller stages","on shaft"),
    ("lab-seal","seal-labyrinth","Labyrinth seals","between stages"),("dry-seal","seal-mechanical","Shaft end seal","both ends"),
    ("coupling","coupling","Coupling to driver","drive end"),("lube-filter","filter-element","Lube oil filter","on skid console"),("lube-oil","oil","Lube oil sump","skid")]),
 "steam-turbine": ("Steam turbine driver (KT)", ["KT"], [5, 3, 3],
   "Split casing with steam chest on top; governor valve rack; exhaust hood",
   [("rotor-blades","blade","Rotor blade rows","3-5 discs on shaft"),("journal-de","bearing-journal","Journal bearing","each end"),
    ("thrust","bearing-thrust-pad","Thrust bearing","front pedestal"),("gov-valve","valve-governor","Governor valve","steam chest"),
    ("gland-seal","seal-labyrinth","Gland labyrinth seals","shaft ends"),("trip-spring","spring","Trip valve spring","trip valve"),
    ("solenoid","solenoid-valve","Trip solenoid","on trip block"),("speed-tx","transmitter","Speed/pressure transmitter","front"),
    ("casing-gasket","gasket","Casing joint gasket","split line")]),
 "centrifugal-pump": ("Centrifugal pump + motor (PP)", ["PP"], [3, 1.5, 1],
   "Volute casing (front cover explodes forward), bearing housing, motor with fan cover",
   [("impeller","impeller","Impeller","in volute"),("wear-ring","ring","Wear rings","impeller eye"),("shaft-sleeve","sleeve","Shaft sleeve","under seal"),
    ("mech-seal","seal-mechanical","Mechanical seal","stuffing box"),("bearing-de","bearing-ball","Ball bearing","bearing housing"),
    ("bearing-roller","bearing-roller","Roller bearing","bearing housing"),("coupling","coupling","Coupling","pump-motor"),
    ("motor-fan","fan","Motor cooling fan","motor NDE"),("casing-gasket","gasket","Casing gasket","volute cover")]),
 "shell-tube-exchanger": ("Shell & tube heat exchanger (HE)", ["HE"], [8, 2, 2],
   "Shell cylinder (fades in x-ray), channel head + cover explode along axis",
   [("tube-bundle","pipe","Tube bundle","inside shell"),("tube-plugs","tube-plug","Tube plugs","tubesheet"),("channel-gasket","gasket","Channel gasket","channel flange"),
    ("studbolts","studbolt","Studbolts","flange bolt circle"),("nozzle-flange","flange","Nozzle flanges","nozzles")]),
 "vessel-drum": ("Vessel / KO drum (VD)", ["VD"], [3, 6, 3],
   "Vertical vessel with 2:1 heads, top head explodes up",
   [("demister","demister-pad","Demister pad","near top"),("inlet-screen","screen","Inlet screen","inlet nozzle"),("manway-gasket","gasket","Manway gasket","manway"),
    ("studbolts","studbolt","Manway studbolts","manway"),("drain-valve","valve-gate","Drain gate valve","bottom")]),
 "column": ("Distillation column / stripper (CL)", ["CL"], [3, 25, 3],
   "Tall cylinder, shell sections explode apart vertically to show trays",
   [("trays","tray-valve","Valve trays","every 2 m"),("demister","demister-pad","Top demister","top"),("screen","screen","Distributor screen","feed"),
    ("manway-gasket","gasket","Manway gaskets","manways"),("studbolts","studbolt","Studbolts","manways")]),
 "control-valve": ("Control valve (FCV/LCV/PCV/TCV)", ["FCV","LCV","PCV","TCV"], [0.8, 1.4, 0.6],
   "Globe body + bonnet (body fades), diaphragm actuator housing splits upward",
   [("trim","trim-set","Trim set (cage/plug)","inside body"),("seat","seat-ring","Seat ring","body"),("packing","packing-set","Stem packing","bonnet"),
    ("diaphragm","diaphragm","Actuator diaphragm","actuator"),("spring","spring","Actuator spring","actuator"),("positioner","positioner","Positioner","yoke side"),
    ("gasket","gasket","Body gasket","body-bonnet"),("studbolts","studbolt","Body studbolts","flanges")]),
 "on-off-valve": ("On-off / shutdown valve (SDV)", ["SDV"], [0.8, 1.2, 0.6],
   "Ball/gate valve with pneumatic actuator box",
   [("solenoid","solenoid-valve","Solenoid valve","actuator"),("limit-switch","switch","Limit switch box","top"),("o-rings","o-ring","Actuator O-rings","actuator"),
    ("packing","packing-set","Stem packing","bonnet"),("gasket","gasket","Body gasket","flanges")]),
 "motor-operated-valve": ("Motor-operated gate valve (MOV)", ["MOV"], [0.8, 1.8, 0.6],
   "Gate valve with electric actuator gearbox on top",
   [("limit-switch","switch","Limit/torque switch","actuator"),("packing","packing-set","Stem packing","bonnet"),("grease","grease","Gearbox grease","actuator"),
    ("gasket","gasket","Bonnet gasket","bonnet")]),
 "safety-valve": ("Pressure safety valve (PRV)", ["PRV"], [0.5, 1.2, 0.5],
   "Angle body + bonnet + cap; bonnet fades to show spring",
   [("spring","spring","Set-pressure spring","bonnet"),("disc","disc","Disc","on nozzle"),("nozzle","nozzle","Nozzle","inlet"),
    ("gasket","gasket","Inlet gasket","inlet flange"),("studbolts","studbolt","Studbolts","flanges")]),
 "transmitter": ("Transmitter (PIT/FIT/LIT/TIT/DPT)", ["PIT","FIT","LIT","TIT","DPT"], [0.3, 0.4, 0.3],
   "Electronics head cover unscrews outward in explode",
   [("transmitter","transmitter","Transmitter","main"),("manifold-valve","valve-needle","Manifold needle valve","below"),
    ("tubing","tubing","Impulse tubing","to process"),("connector","connector","Tube connector","tubing ends"),("gland","gland","Cable gland","conduit entry")]),
 "temperature-element": ("Temperature element (TEL)", ["TEL"], [0.2, 0.8, 0.2],
   "Head cover lifts; thermowell fades to show sheath",
   [("thermowell","thermowell","Thermowell","in pipe"),("thermocouple","thermocouple","Thermocouple","inside well"),
    ("connector","connector","Connector","head"),("gland","gland","Cable gland","head")]),
 "pressure-gauge": ("Pressure gauge (PGI)", ["PGI"], [0.2, 0.4, 0.15],
   "Front glass + bezel explode forward",
   [("gauge","gauge","Gauge","main"),("root-valve","valve-needle","Root needle valve","below"),("connector","connector","Connector","thread")]),
 "restriction-orifice": ("Restriction orifice (ROF)", ["ROF"], [0.6, 0.6, 0.6],
   "Flange pair splits apart to show orifice plate",
   [("gasket","gasket","Orifice gaskets","both faces"),("flange","flange","Orifice flanges","both sides"),("studbolts","studbolt","Studbolts","bolt circle")]),
 "piping-line": ("Piping line (LINE)", ["LINE"], [6, 1, 1],
   "Insulation jacket fades in x-ray",
   [("pipe","pipe","Pipe spool","run"),("elbow","elbow","Elbows","bends"),("tee","tee","Tee","branch"),("flange","flange","Flanges","joints"),
    ("gasket","gasket","Gaskets","joints"),("studbolts","studbolt","Studbolts","joints"),("block-valve","valve-gate","Block gate valve","inline"),
    ("antirust","antirust","Antirust coating","external"),("tape","tape","Wrapping tape","external")]),
 "junction-box": ("Junction box (JBX)", ["JBX"], [0.6, 0.6, 0.25],
   "Door/cover swings open / fades",
   [("terminal-block","terminal-block","Terminal blocks","DIN rail"),("terminal","terminal","Cable lugs","on terminals"),("gland","gland","Cable glands","bottom"),
    ("cable","cable","Cables","entries"),("screw","screw","Screws","cover")]),
}

def pascal(k): return "".join(w.capitalize() for w in re.split(r"[-\s]+", k) if w).replace("ORing", "ORing")
def kebab(s): return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")

def etype(f):
    t = f.split("_", 1)[1] if "_" in f else f
    m = re.match(r"^([A-Z]+)-\d", t)
    if m: return m.group(1)
    return "LINE" if re.match(r"^[\d/-]+-[A-Z]+-\d", t) else "SITE"

def base_tag(f):
    t = f.split("_", 1)[1] if "_" in f else f
    m = re.match(r"^([A-Z]+-\d+[A-Z]?)", t)
    return m.group(1) if m else t

def main():
    bom = pd.read_excel(DATA / "BoM.xlsx"); fl = pd.read_excel(DATA / "FuncLoc list.xlsx")
    mv = pd.read_excel(DATA / "Movement Material.xlsx"); nt = pd.read_excel(DATA / "Notif History.xlsx")
    desc = bom["Material Desc."].str.split(",")
    fam = desc.str[0].str.strip(); sub = desc.str[1].fillna("").str.strip()
    bom["part"] = [kebab(f + " " + s) if f in VARIANTS else kebab(f) for f, s in zip(fam, sub)]
    bom = bom.merge(fl[["Functional Location", "FuncLoc Criticallity"]], left_on="Functional Loc.", right_on="Functional Location", how="left")
    bom["etype"] = bom["Functional Loc."].map(etype); bom["tag"] = bom["Functional Loc."].map(base_tag)
    used = set(mv["Material Number"])
    t2e = {t: k for k, v in E.items() for t in v[1]}

    # ---- part catalog ----
    parts = []
    for key, g in bom.groupby("part"):
        mats = g.drop_duplicates("Material No")
        cat, pri, hint = P.get(key, ("other", "P3", "Simple representative shape."))
        eq = g["etype"].map(t2e).dropna().value_counts()
        parts.append(dict(id=key, component=pascal(key), category=cat, priority=pri, hint=hint,
            materials=int(len(mats)), stockItems=int((mats["MRP Type"] == "Stock Item").sum()),
            consumedIn17m=int(mats["Material No"].isin(used).sum()), funclocs=int(g["Functional Loc."].nunique()),
            criticalSA=int(g[g["FuncLoc Criticallity"].isin(["S", "A"])]["Material No"].nunique()),
            units=sorted(mats["Unit"].unique().tolist()), usedIn=eq.index.tolist()[:6],
            examples=mats["Material Desc."].head(4).tolist()))
    parts.sort(key=lambda p: (p["priority"], -p["materials"]))
    missing = sorted({s[1] for v in E.values() for s in v[4]} - {p["id"] for p in parts})
    assert not missing, f"slot parts not in data: {missing}"

    # ---- equipment catalog + plant layout (top equipment per type by notifications) ----
    nt["tag"] = nt["Functional Location"].map(base_tag); ncount = nt["tag"].value_counts()
    fl["tag"] = fl["Functional Location"].map(base_tag); fl["etype"] = fl["Functional Location"].map(etype)
    flb = fl[fl["Functional Location"].str.split("_", n=1).str[1] == fl["tag"]].drop_duplicates("tag").set_index("tag")
    equipment, layout = [], []
    per_type = {"cracking-furnace": 4, "centrifugal-compressor": 2, "steam-turbine": 2, "centrifugal-pump": 3, "shell-tube-exchanger": 2,
                "vessel-drum": 1, "column": 1, "control-valve": 2, "safety-valve": 1}
    force = {"BF-112", "BF-111", "BF-105", "PP-1574B", "KT-856A", "KC-210D"}
    for key, (name, types, size, shells, slots) in E.items():
        tags = bom[bom["etype"].isin(types)]["tag"].unique()
        equipment.append(dict(id=key, component=pascal(key), name=name, tagTypes=types, sizeM=size, shells=shells,
            instances=int(len(set(fl[fl["etype"].isin(types)]["tag"]))),
            slots=[dict(id=s, part=p, name=n, placement=r) for s, p, n, r in slots]))
        n = per_type.get(key, 0)
        if not n: continue
        cand = sorted(tags, key=lambda t: (t not in force, -ncount.get(t, 0)))[:n]
        for t in cand:
            g = bom[bom["tag"] == t]
            row = flb.loc[t] if t in flb.index else None
            layout.append(dict(tag=t, equipment=key, description=(row["FunctLocDescrip."] if row is not None else t),
                criticality=(None if row is None or pd.isna(row["FuncLoc Criticallity"]) else row["FuncLoc Criticallity"]),
                notifications=int(ncount.get(t, 0)), bomMaterials=int(g["Material No"].nunique()),
                partFamilies=g["part"].value_counts().head(8).to_dict()))

    # ---- write files ----
    (ROOT / "src" / "data").mkdir(parents=True, exist_ok=True)
    json.dump(dict(parts=parts, equipment=equipment), open(ROOT / "src/data/3d-catalog.json", "w"), indent=1)
    zones = {"cracking-furnace": (-14, -6), "steam-turbine": (2, -6), "centrifugal-compressor": (2, -1), "centrifugal-pump": (-6, 6),
             "shell-tube-exchanger": (8, 6), "vessel-drum": (14, -4), "column": (14, 4), "control-valve": (-2, 10), "safety-valve": (4, 10)}
    cnt = {}
    for it in layout:
        i = cnt.get(it["equipment"], 0); cnt[it["equipment"]] = i + 1; x, z = zones[it["equipment"]]
        it["position"] = [x + (i * 5 if it["equipment"] == "cracking-furnace" else i * 3), 0, z]
    json.dump(dict(plant="Chandra Asri cracker complex (demo area, Plant PX)", units="metres", equipment=layout),
              open(ROOT / "src/data/plant-layout.json", "w"), indent=1)

    for p in parts: write_part(p)
    for e in equipment: write_equipment(e, {p["id"]: p for p in parts})
    write_registry(parts, equipment); write_doc(parts, equipment, layout)
    print(f"{len(parts)} parts, {len(equipment)} equipment, {len(layout)} layout instances")

PLACE_PART = """// PLACEHOLDER — replace this whole file with the code generated from PROMPT.md (same name & exports).
import {{ Placeholder }} from "../../core/Placeholder";
import type {{ PartProps, PartMeta }} from "../../contract";

export const META: PartMeta = {{ id: "{id}", name: "{name}", size: [1, 1, 1] }};
export default function {comp}(props: PartProps) {{
  return <Placeholder {{...props}} label="{id}" />;
}}
"""
PLACE_EQ = """// PLACEHOLDER — replace this whole file with the code generated from PROMPT.md (same name & exports).
import {{ Placeholder }} from "../../core/Placeholder";
import type {{ EquipmentProps, SlotDef }} from "../../contract";

export const SLOTS: SlotDef[] = [
{slots}
];
export default function {comp}(props: EquipmentProps) {{
  return <Placeholder label="{id}" xray={{props.xray}} onClick={{props.onShellClick}} size={{[2, 1, 1]}} />;
}}
"""

def write_if_placeholder(path, text):
    if path.exists() and "PLACEHOLDER" not in path.read_text().splitlines()[0]: return
    path.write_text(text)

def write_part(p):
    d = THREE / "parts" / p["id"]; d.mkdir(parents=True, exist_ok=True)
    name = p["id"].replace("-", " ").capitalize()
    write_if_placeholder(d / "index.tsx", PLACE_PART.format(id=p["id"], name=name, comp=p["component"]))
    (d / "PROMPT.md").write_text(f"""# Prompt — 3D part `{p['id']}` → `src/features/spare-3d/parts/{p['id']}/index.tsx`

Copy everything below the line into the code-generation AI. Paste its answer over `index.tsx` (keep the file name).

---
Write ONE React Three Fiber component file in TypeScript (TSX) for a procedural 3D model of a petrochemical spare part.

**Part:** {name} — {p['hint']}
**Real examples from Chandra Asri SAP data:** {'; '.join(p['examples'])}
**Fits inside:** {', '.join(p['usedIn']) or 'general use'}

Rules (must follow exactly):
1. Build only from three.js primitives / `@react-three/drei` helpers (no GLTF, no textures, no external files). Libraries allowed: `react`, `three`, `@react-three/fiber`, `@react-three/drei`.
2. Normalised size: the largest dimension = 1 unit, centred at the origin; rotating/axial parts have their axis along +X; flat parts lie in the YZ plane facing +X.
3. File header: `import type {{ PartProps, PartMeta }} from "../../contract";`
4. `export const META: PartMeta = {{ id: "{p['id']}", name: "<English name>", size: [x, y, z] }}` (true normalised bounding box).
5. `export default function {p['component']}({{ color, highlight, detail = "high" }}: PartProps)` returns a `<group>`.
   - `color` overrides the main metal colour (default a realistic metal/material colour).
   - `highlight` → add red emissive (`#ef4444`, intensity 0.6) to all materials.
   - `detail === "low"` → ≤ 6 meshes and low segment counts (used in the plant layout); `"high"` → full detail, ≤ 60 meshes.
6. Use `meshStandardMaterial` with sensible `metalness`/`roughness`; no `castShadow` loops over thousands of meshes; memoise arrays with `useMemo`.
7. No state, no animation, no event handlers, no `<Canvas>` — the parent scene handles those.
8. Output only the code block of the full file.
""")

def write_equipment(e, P_):
    d = THREE / "equipment" / e["id"]; d.mkdir(parents=True, exist_ok=True)
    slots = ",\n".join(f'  {{ id: "{s["id"]}", part: "{s["part"]}", name: "{s["name"]}", position: [0, 0, 0] }}' for s in e["slots"])
    write_if_placeholder(d / "index.tsx", PLACE_EQ.format(id=e["id"], comp=e["component"], slots=slots))
    rows = "\n".join(f"| `{s['id']}` | `{s['part']}` → `{P_[s['part']]['component']}` | {s['name']} | {s['placement']} |" for s in e["slots"])
    imports = "\n".join(sorted({f'import {P_[s["part"]]["component"]} from "../../parts/{s["part"]}";' for s in e["slots"]}))
    (d / "PROMPT.md").write_text(f"""# Prompt — 3D equipment `{e['id']}` → `src/features/spare-3d/equipment/{e['id']}/index.tsx`

Generate the parts first (their PROMPT.md files); this assembly imports them. Copy everything below the line into the AI.

---
Write ONE React Three Fiber TSX file: an X-ray-capable, explodable 3D assembly of a **{e['name']}** in a naphtha cracker.
Approximate real size L×H×W = {e['sizeM'][0]}×{e['sizeM'][1]}×{e['sizeM'][2]} m; model it so the longest side = 4 units, base at y = 0.

**Outer shell / casing:** {e['shells']}.

**Part slots (internal parts shown in x-ray; ids are used by fault data):**
| slot id | part component | name | placement |
|---|---|---|---|
{rows}

Imports to use (already exist, each accepts `PartProps` = {{ color?, highlight?, detail? }} and is normalised to 1 unit, axis +X):
```ts
import type {{ EquipmentProps, SlotDef }} from "../../contract";
import {{ XRayShell, FaultPulse }} from "../../core";
{imports}
```
Rules:
1. `export const SLOTS: SlotDef[]` — one entry per slot above with real `position`/`rotation`/`scale` (also used to place labels). Repeated parts (blades, burners, trays, bolts) = one slot rendered several times.
2. `export default function {e['component']}({{ xray = false, explode = 0, faults = {{}}, onShellClick, onPartClick, detail = "high" }}: EquipmentProps)`.
3. Every casing/shell mesh group is wrapped in `<XRayShell active={{xray}} explode={{[dx*explode, dy*explode, dz*explode]}} onClick={{onShellClick}}>` (choose a sensible exploded offset per shell piece, max 1.5 units).
4. Every slot is wrapped in `<FaultPulse active={{Boolean(faults[slot.id])}} position={{slot.position}} radius={{…}} label={{faults[slot.id] && {{ title: slot.name, value: faults[slot.id].value }}}} showLabel={{xray}} onClick={{xray ? () => onPartClick?.(slot.id) : undefined}}>` and renders the part with `highlight={{Boolean(faults[slot.id])}}` and `detail={{detail}}`.
5. When `explode > 0`, internal parts also move apart along their main axis (multiply offsets by `explode`) so each part is visible separately.
6. `detail === "low"` → render only shells + 1–2 key parts (plant layout view).
7. Rotating parts may spin slowly with `useFrame` only when `detail === "high"`.
8. No `<Canvas>`, no lights, no state other than refs. Output only the full file.
""")

def write_registry(parts, equipment):
    lines = ["// GENERATED by scripts/gen_3d_catalog.py — do not edit by hand.",
             'import type { ComponentType } from "react";', 'import type { PartProps, EquipmentProps } from "./contract";']
    lines += [f'import {p["component"]} from "./parts/{p["id"]}";' for p in parts]
    lines += [f'import {e["component"]}Eq, {{ SLOTS as {e["component"]}Slots }} from "./equipment/{e["id"]}";' for e in equipment]
    lines.append("\nexport const PARTS: Record<string, ComponentType<PartProps>> = {")
    lines += [f'  "{p["id"]}": {p["component"]},' for p in parts] + ["};"]
    lines.append("\nexport const EQUIPMENT = {")
    lines += [f'  "{e["id"]}": {{ Component: {e["component"]}Eq as ComponentType<EquipmentProps>, slots: {e["component"]}Slots }},' for e in equipment] + ["};"]
    lines.append("export type EquipmentId = keyof typeof EQUIPMENT;")
    (THREE / "registry.ts").write_text("\n".join(lines) + "\n")

def write_doc(parts, equipment, layout):
    pr = "\n".join(f"| {i} | `{p['id']}` | {p['category']} | {p['priority']} | {p['materials']} | {p['criticalSA']} | {p['consumedIn17m']} | {', '.join(p['usedIn'][:3])} |" for i, p in enumerate(parts, 1))
    er = "\n".join(f"| `{e['id']}` | {e['name']} | {e['instances']} | {', '.join(s['part'] for s in e['slots'])} |" for e in equipment)
    lr = "\n".join(f"| {l['tag']} | {l['equipment']} | {l['description']} | {l['criticality']} | {l['notifications']} | {l['bomMaterials']} |" for l in layout)
    (ROOT / "CATALOG.md").write_text(f"""# 3D catalog — spare parts & equipment (generated from case data)

Generated by `python3 scripts/gen_3d_catalog.py "<Supporting Data>"`. Machine-readable: `src/data/3d-catalog.json`, layout: `src/data/plant-layout.json`. How to use: `src/features/spare-3d/README.md`.

## Spare-part models ({len(parts)}; 53 SAP families, BEARING/SEAL/VALVE split by type)
P1 = needed for the demo equipment · P2 = other equipment · P3 = consumable / bulk (simple shape is fine).
| # | part id | category | priority | SKUs | SKUs on S/A FuncLoc | SKUs consumed 17 mo | main equipment |
|---|---|---|---|---|---|---|---|
{pr}

## Equipment models ({len(equipment)}) — tag types from FuncLoc list
| equipment id | name | instances in plant | part slots |
|---|---|---|---|
{er}

## Plant layout demo instances ({len(layout)})
| tag | equipment | description | crit | notifications | BoM SKUs |
|---|---|---|---|---|---|
{lr}
""")

if __name__ == "__main__":
    main()
