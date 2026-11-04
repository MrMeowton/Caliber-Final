// Viewer to test each generated model: pick a part/equipment, toggle X-Ray, explode, simulate a faulty slot.
import { ContactShadows, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useState } from "react";
import catalog from "./data/3d-catalog.json";
import { EQUIPMENT, PARTS, type EquipmentId } from "./features/spare-3d/registry";

// first line still says PLACEHOLDER → model not generated yet
const raw = import.meta.glob("./features/spare-3d/*/*/index.tsx", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const isPlaceholder = (kind: string, id: string) => (raw[`./features/spare-3d/${kind}/${id}/index.tsx`] ?? "").startsWith("// PLACEHOLDER");

type Sel = { kind: "parts" | "equipment"; id: string };

export default function App() {
  const [sel, setSel] = useState<Sel>({ kind: "equipment", id: "centrifugal-pump" });
  const [xray, setXray] = useState(false);
  const [explode, setExplode] = useState(0);
  const [faultSlot, setFaultSlot] = useState("");
  const done = (k: string, id: string) => !isPlaceholder(k, id);
  const count = (k: "parts" | "equipment", ids: string[]) => `${ids.filter((i) => done(k, i)).length}/${ids.length}`;

  const eq = sel.kind === "equipment" ? EQUIPMENT[sel.id as EquipmentId] : null;
  const Part = sel.kind === "parts" ? PARTS[sel.id] : null;

  const item = (kind: Sel["kind"], id: string, label: string) => (
    <button key={id} className={sel.id === id ? "on" : done(kind, id) ? "" : "ph"}
      onClick={() => { setSel({ kind, id }); setFaultSlot(""); setExplode(0); }}>
      {done(kind, id) ? "● " : "○ "}{label}
    </button>
  );

  return (
    <div className="app">
      <aside className="side">
        <h3>Equipment {count("equipment", catalog.equipment.map((e) => e.id))}</h3>
        {catalog.equipment.map((e) => item("equipment", e.id, e.name))}
        <h3>Spare parts {count("parts", catalog.parts.map((p) => p.id))}</h3>
        {catalog.parts.map((p) => item("parts", p.id, `${p.priority} · ${p.id} (${p.materials} SKU)`))}
      </aside>
      <main className="stage">
        <div className="bar">
          <strong>{sel.id}</strong>
          {eq && <>
            <button onClick={() => setXray(!xray)}>{xray ? "Close X-Ray" : "X-Ray"}</button>
            <label>Explode <input type="range" min={0} max={1} step={0.05} value={explode} onChange={(e) => setExplode(+e.target.value)} /></label>
            <select value={faultSlot} onChange={(e) => setFaultSlot(e.target.value)}>
              <option value="">No fault</option>
              {eq.slots.map((s) => <option key={s.id} value={s.id}>Fault: {s.name}</option>)}
            </select>
          </>}
        </div>
        <Canvas camera={{ position: [4, 3, 5], fov: 40 }} dpr={[1, 2]}>
          <color attach="background" args={["#0B0F14"]} />
          <ambientLight intensity={0.8} />
          <directionalLight position={[4, 6, 3]} intensity={1.6} />
          <directionalLight position={[-4, 2, -3]} intensity={0.9} color="#93c5fd" />
          {eq && <eq.Component xray={xray} explode={explode} onShellClick={() => setXray(true)}
            faults={faultSlot ? { [faultSlot]: { value: "Stock 0 / ROP 4", severity: "critical" } } : {}} />}
          {Part && <group scale={2}><Part /></group>}
          <ContactShadows position={[0, -1.05, 0]} opacity={0.5} scale={10} blur={2.5} far={3} />
          <OrbitControls makeDefault />
        </Canvas>
      </main>
    </div>
  );
}
