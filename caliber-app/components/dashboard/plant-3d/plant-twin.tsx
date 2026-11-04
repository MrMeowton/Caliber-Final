"use client";

// Plant layout → click equipment tag → isolated equipment (camera flies in) → X-Ray / explode → faulty parts.
// Models come from Learning-By-Building/19-spare-part-3d-catalog (components/spare-3d).
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { Canvas, useFrame } from "@react-three/fiber";
import { CameraControls, Grid, Html } from "@react-three/drei";
import { Box3, Group, Mesh, MeshBasicMaterial, Vector3 } from "three";
import { ArrowLeft, ScanEye } from "lucide-react";
import layout from "@/data/plant-layout.json";
import { EQUIPMENT, type EquipmentId } from "@/components/spare-3d/registry";
import type { Faults, Vec3 } from "@/components/spare-3d/contract";
import {
  slotFaults,
  toModelFaults,
  unmappedRiskCount,
  type PlantAsset,
  type Severity,
  type SlotFault,
} from "./faults";
import PlantPipes, { type PipeConnection } from "./plant-pipes";

type LayoutItem = {
  tag: string;
  equipment: EquipmentId;
  description: string;
  criticality: string | null;
  notifications: number;
  position: Vec3;
  scale: number;
};

type Status = Severity | "ok";

type Row = {
  item: LayoutItem;
  asset: PlantAsset | undefined;
  faults: SlotFault[];
  modelFaults: Faults;
  status: Status;
};

const ITEMS = layout.equipment as unknown as LayoutItem[];
const CONNECTIONS = layout.connections as PipeConnection[];
const POSITIONS = Object.fromEntries(ITEMS.map((item) => [item.tag, item.position]));
const FOV = 40;
const OVERVIEW = { position: [0, 19, 27] as Vec3, target: [0, 0, 1] as Vec3 };
const STATUS_COLOR: Record<Status, string> = {
  critical: "#E5534B",
  warning: "#D4A72C",
  ok: "#3FB68B",
};
const STATUS_LABEL: Record<Status, string> = {
  critical: "Critical part at zero stock",
  warning: "Part below reorder point",
  ok: "No modelled part at risk",
};

const fmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

export type PlantTwinProps = {
  assets: PlantAsset[];
  selectedTag: string | null;
  onSelect: (tag: string | null) => void;
};

export default function PlantTwin({ assets, selectedTag, onSelect }: PlantTwinProps) {
  const [xray, setXray] = useState(false);
  const [explode, setExplode] = useState(0);
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [boxes, setBoxes] = useState<Record<string, Box3>>({});

  // Reset the inspection state whenever another equipment is opened.
  const [viewTag, setViewTag] = useState(selectedTag);
  if (viewTag !== selectedTag) {
    setViewTag(selectedTag);
    setXray(false);
    setExplode(0);
    setActiveSlot(null);
  }

  const rows = useMemo<Row[]>(() => {
    const byTag = new Map(assets.map((asset) => [asset.id, asset]));
    return ITEMS.map((item) => {
      const asset = byTag.get(item.tag);
      const faults = slotFaults(asset, EQUIPMENT[item.equipment].slots);
      const status: Status =
        faults[0]?.severity ??
        (asset?.status === "critical" ? "critical" : asset?.status === "watch" ? "warning" : "ok");
      return { item, asset, faults, modelFaults: toModelFaults(faults), status };
    });
  }, [assets]);

  const selected = rows.find((row) => row.item.tag === selectedTag) ?? null;

  const onMeasure = useCallback((tag: string, box: Box3) => {
    setBoxes((current) => (current[tag] ? current : { ...current, [tag]: box }));
  }, []);

  useEffect(() => {
    if (!selectedTag) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable)) return;
      if (event.key === "x" || event.key === "X") setXray((value) => !value);
      if (event.key === "Escape") {
        if (xray) setXray(false);
        else onSelect(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedTag, xray, onSelect]);

  const counts = useMemo(
    () => ({
      critical: rows.filter((row) => row.status === "critical").length,
      warning: rows.filter((row) => row.status === "warning").length,
    }),
    [rows]
  );

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-[#e8eaec] bg-[#0e1419] lg:flex-row">
      <div className="relative h-[420px] min-w-0 flex-1 sm:h-[560px]">
        <Canvas camera={{ position: OVERVIEW.position, fov: FOV }} dpr={[1, 2]}>
          <color attach="background" args={["#0e1419"]} />
          <ambientLight intensity={0.8} />
          <directionalLight position={[8, 14, 6]} intensity={1.6} />
          <directionalLight position={[-8, 6, -6]} intensity={0.8} color="#93c5fd" />
          <Grid
            args={[60, 60]}
            position={[0, -0.01, 0]}
            cellSize={1}
            sectionSize={5}
            cellColor="#1b2530"
            sectionColor="#2b3a48"
            fadeDistance={70}
            infiniteGrid
          />
          {!selectedTag && <PlantPipes positions={POSITIONS} connections={CONNECTIONS} />}

          {rows.map((row) => {
            const isSelected = row.item.tag === selectedTag;
            if (selectedTag && !isSelected) return null;
            const box = boxes[row.item.tag];
            return (
              <group key={row.item.tag}>
                <EquipmentInstance
                  row={row}
                  detail={isSelected ? "high" : "low"}
                  xray={isSelected && xray}
                  explode={isSelected ? explode : 0}
                  onMeasure={onMeasure}
                  onOpen={() => onSelect(row.item.tag)}
                  onShellClick={isSelected ? () => setXray(true) : () => onSelect(row.item.tag)}
                  onPartClick={isSelected ? setActiveSlot : undefined}
                />
                {!selectedTag && (
                  <>
                    {row.status !== "ok" && box && (
                      <FaultRing position={row.item.position} box={box} color={STATUS_COLOR[row.status]} />
                    )}
                    <EquipmentLabel row={row} labelY={box ? box.max.y + 0.5 : 3} onOpen={() => onSelect(row.item.tag)} />
                  </>
                )}
              </group>
            );
          })}

          <CameraRig focus={selectedTag ? boxes[selectedTag] ?? null : null} />
        </Canvas>

        {/* Overlays */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-2 p-3">
          {selected ? (
            <div className="pointer-events-auto flex min-w-0 items-center gap-2 rounded-md border border-white/10 bg-[#121a21]/90 p-1.5 pr-3 text-white backdrop-blur">
              <button
                type="button"
                onClick={() => onSelect(null)}
                className="inline-flex min-h-9 items-center gap-1.5 rounded px-2 text-sm text-white/80 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-[#4EA8DE]"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Plant
              </button>
              <span className="h-5 w-px bg-white/15" />
              <div className="min-w-0">
                <p className="truncate font-mono text-sm font-medium">{selected.item.tag}</p>
                <p className="truncate text-xs text-white/60">
                  {selected.item.description} · Criticality {selected.item.criticality ?? "—"}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-white/10 bg-[#121a21]/90 px-3 py-2 text-white backdrop-blur">
              <p className="text-sm font-medium">Plant layout · cracker demo area</p>
              <p className="text-xs text-white/60">
                {ITEMS.length} equipment · {counts.critical} critical · {counts.warning} below reorder point
              </p>
            </div>
          )}

          {selected && (
            <div className="pointer-events-auto flex items-center gap-3 rounded-md border border-white/10 bg-[#121a21]/90 p-1.5 pl-3 text-white backdrop-blur">
              <label className="flex items-center gap-2 text-xs text-white/70">
                Explode
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={explode}
                  onChange={(event) => setExplode(Number(event.target.value))}
                  aria-label="Explode parts apart"
                  className="w-24 accent-[#4EA8DE]"
                />
              </label>
              <button
                type="button"
                aria-pressed={xray}
                onClick={() => setXray((value) => !value)}
                className={`inline-flex min-h-9 items-center gap-1.5 rounded px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-[#4EA8DE] ${
                  xray ? "bg-[#4EA8DE] text-[#0e1419]" : "bg-[#4EA8DE]/15 text-[#8ccbf0] hover:bg-[#4EA8DE]/25"
                }`}
              >
                <ScanEye className="h-4 w-4" aria-hidden="true" />
                {xray ? "X-Ray on" : "X-Ray"}
              </button>
            </div>
          )}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-2 p-3 text-xs text-white/70">
          {selected ? (
            <p className="rounded bg-[#121a21]/80 px-2 py-1">
              <Kbd>X</Kbd> X-Ray · <Kbd>Esc</Kbd> {xray ? "close X-Ray" : "back to plant"} · drag to orbit
            </p>
          ) : (
            <>
              <div className="flex flex-wrap gap-3 rounded bg-[#121a21]/80 px-2 py-1">
                {(Object.keys(STATUS_COLOR) as Status[]).map((status) => (
                  <span key={status} className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLOR[status] }} />
                    {STATUS_LABEL[status]}
                  </span>
                ))}
              </div>
              <p className="rounded bg-[#121a21]/80 px-2 py-1">Click an equipment tag to inspect it</p>
            </>
          )}
        </div>
      </div>

      {selected && (
        <FaultPanel
          row={selected}
          activeSlot={activeSlot}
          onSlot={(slotId) => {
            setActiveSlot((current) => (current === slotId ? null : slotId));
            setXray(true);
          }}
        />
      )}
    </div>
  );
}

function EquipmentInstance({
  row,
  detail,
  xray,
  explode,
  onMeasure,
  onOpen,
  onShellClick,
  onPartClick,
}: {
  row: Row;
  detail: "low" | "high";
  xray: boolean;
  explode: number;
  onMeasure: (tag: string, box: Box3) => void;
  onOpen: () => void;
  onShellClick: () => void;
  onPartClick?: (slotId: string) => void;
}) {
  const ref = useRef<Group>(null);
  const { Component } = EQUIPMENT[row.item.equipment];
  const isLow = detail === "low";

  useLayoutEffect(() => {
    if (!ref.current) return;
    ref.current.updateWorldMatrix(true, true);
    onMeasure(row.item.tag, new Box3().setFromObject(ref.current));
  }, [row.item.tag, onMeasure]);

  return (
    <group
      ref={ref}
      position={row.item.position}
      scale={row.item.scale}
      onClick={
        isLow
          ? (event: ThreeEvent<MouseEvent>) => {
              event.stopPropagation();
              onOpen();
            }
          : undefined
      }
      onPointerOver={isLow ? () => (document.body.style.cursor = "pointer") : undefined}
      onPointerOut={isLow ? () => (document.body.style.cursor = "") : undefined}
    >
      <Component
        detail={detail}
        xray={xray}
        explode={explode}
        faults={row.modelFaults}
        onShellClick={onShellClick}
        onPartClick={onPartClick}
      />
    </group>
  );
}

function EquipmentLabel({ row, labelY, onOpen }: { row: Row; labelY: number; onOpen: () => void }) {
  const [x, , z] = row.item.position;
  const color = STATUS_COLOR[row.status];
  const faultCount = row.faults.length;
  const riskText =
    faultCount > 0
      ? `${faultCount} faulty part${faultCount === 1 ? "" : "s"}`
      : row.asset && row.asset.atRiskParts > 0
        ? `${row.asset.atRiskParts} below ROP`
        : null;

  return (
    <Html position={[x, labelY, z]} center zIndexRange={[20, 0]}>
      <button
        type="button"
        onClick={onOpen}
        title={`${row.item.description} · ${STATUS_LABEL[row.status]}`}
        className="flex items-center gap-1.5 whitespace-nowrap rounded-md border border-white/15 bg-[#0e1419]/85 px-2 py-1 font-mono text-[11px] leading-4 text-white shadow-lg backdrop-blur transition-colors hover:border-white/50 focus-visible:outline-2 focus-visible:outline-[#4EA8DE]"
      >
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${row.status === "critical" ? "animate-pulse" : ""}`}
          style={{ background: color }}
        />
        <span className="font-medium">{row.item.tag}</span>
        {riskText && <span style={{ color }}>{riskText}</span>}
        {row.item.notifications > 0 && (
          <span className="text-white/50">{row.item.notifications} notifs</span>
        )}
      </button>
    </Html>
  );
}

/** Pulsing ring on the ground under equipment that has a part at risk. */
function FaultRing({ position, box, color }: { position: Vec3; box: Box3; color: string }) {
  const mesh = useRef<Mesh>(null);
  const size = box.getSize(new Vector3());
  const radius = Math.max(size.x, size.z) / 2 + 0.35;

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const wave = (Math.sin(clock.elapsedTime * 3) + 1) / 2;
    (mesh.current.material as MeshBasicMaterial).opacity = 0.25 + wave * 0.45;
    mesh.current.scale.setScalar(1 + wave * 0.06);
  });

  return (
    <mesh ref={mesh} position={[position[0], 0.02, position[2]]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
      <ringGeometry args={[radius, radius + 0.12, 64]} />
      <meshBasicMaterial color={color} transparent depthWrite={false} />
    </mesh>
  );
}

function CameraRig({ focus }: { focus: Box3 | null }) {
  const ref = useRef<CameraControls>(null);

  useEffect(() => {
    const controls = ref.current;
    if (!controls) return;
    if (!focus) {
      void controls.setLookAt(...OVERVIEW.position, ...OVERVIEW.target, true);
      return;
    }
    const center = focus.getCenter(new Vector3());
    const radius = focus.getSize(new Vector3()).length() / 2;
    const distance = Math.max((radius / Math.sin((FOV * Math.PI) / 360)) * 1.05, 2.5);
    const eye = center.clone().addScaledVector(new Vector3(1, 0.6, 1.3).normalize(), distance);
    void controls.setLookAt(eye.x, eye.y, eye.z, center.x, center.y, center.z, true);
  }, [focus]);

  return (
    <CameraControls
      ref={ref}
      makeDefault
      minDistance={1}
      maxDistance={60}
      maxPolarAngle={Math.PI / 2 - 0.05}
    />
  );
}

function FaultPanel({
  row,
  activeSlot,
  onSlot,
}: {
  row: Row;
  activeSlot: string | null;
  onSlot: (slotId: string) => void;
}) {
  const unmapped = unmappedRiskCount(row.asset, row.faults);
  const slots = EQUIPMENT[row.item.equipment].slots;

  return (
    <aside className="flex max-h-[560px] w-full shrink-0 flex-col border-t border-[#e8eaec] bg-white text-[#131416] lg:w-[340px] lg:border-l lg:border-t-0">
      <div className="border-b border-[#f0f1f2] px-4 py-3">
        <p className="text-sm font-semibold">Parts at risk</p>
        <p className="mt-0.5 text-xs leading-5 text-[#5d5f60]">
          {row.faults.length} of {slots.length} modelled parts flagged from stock vs reorder point ·{" "}
          {row.item.notifications} maintenance notifications on record
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {!row.asset && (
          <p className="px-4 py-4 text-sm text-[#5d5f60]">
            No stock-item BOM records are linked to {row.item.tag}.
          </p>
        )}
        {row.asset && row.faults.length === 0 && (
          <p className="px-4 py-4 text-sm text-[#5d5f60]">
            No modelled part on {row.item.tag} is below its reorder point.
          </p>
        )}
        <ul className="divide-y divide-[#f0f1f2]">
          {row.faults.map((fault) => {
            const open = activeSlot === fault.slot.id;
            const value = row.modelFaults[fault.slot.id]?.value;
            return (
              <li key={fault.slot.id}>
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => onSlot(fault.slot.id)}
                  className={`grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 px-4 py-2.5 text-left focus-visible:outline-2 focus-visible:outline-[#1b6c80] ${
                    open ? "bg-[#f4f6f8]" : "hover:bg-[#f9fbfc]"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLOR[fault.severity] }} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{fault.slot.name}</span>
                    <span className="block truncate font-mono text-xs text-[#5d5f60]">{value}</span>
                  </span>
                  <span className="text-xs tabular-nums text-[#5d5f60]">
                    {fault.parts.length} SKU{fault.parts.length === 1 ? "" : "s"}
                  </span>
                </button>
                {open && (
                  <ul className="space-y-2 bg-[#f4f6f8] px-4 pb-3">
                    {fault.parts.map((part) => (
                      <li key={`${part.functionalLoc}:${part.materialNo}`} className="rounded-md bg-white p-2.5">
                        <p className="truncate text-xs font-medium" title={part.description}>
                          {part.description}
                        </p>
                        <p className="mt-0.5 font-mono text-[11px] text-[#5d5f60]">
                          {part.materialNo} · Crit. {part.criticality || "—"}
                        </p>
                        <p className="mt-1 text-xs tabular-nums">
                          <span className={part.severity === "critical" ? "text-[#c4242a]" : "text-[#92400e]"}>
                            {fmt.format(part.stock)} {part.unit} on hand
                          </span>
                          <span className="text-[#5d5f60]">
                            {" "}· ROP {fmt.format(part.reorderPoint)} · Min {fmt.format(part.minQty)} · Max{" "}
                            {fmt.format(part.maxQty)} {part.unit}
                          </span>
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <p className="border-t border-[#f0f1f2] px-4 py-2.5 text-xs leading-5 text-[#5d5f60]">
        {unmapped > 0 && `${unmapped} other at-risk SKU${unmapped === 1 ? " has" : "s have"} no modelled slot. `}
        Turn on X-Ray to see flagged parts pulse red inside the casing. Geometry is representative, not as-built.
      </p>
    </aside>
  );
}

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="rounded border border-white/20 px-1 font-mono text-[10px] text-white/80">{children}</kbd>
  );
}
