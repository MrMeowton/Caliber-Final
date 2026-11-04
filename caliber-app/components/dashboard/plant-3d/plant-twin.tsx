"use client";

// One assembled plant → split into equipment by area → click a tag → isolated equipment → X-Ray / explode → faulty parts.
// Models come from Learning-By-Building/19-spare-part-3d-catalog (components/spare-3d).
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { Canvas, useFrame } from "@react-three/fiber";
import { CameraControls, Grid, Html } from "@react-three/drei";
import { Box3, Group, Mesh, MeshBasicMaterial, Vector3 } from "three";
import { ArrowLeft, Boxes, Factory, ScanEye } from "lucide-react";
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
import PlantStructure, { type Area, type Rack } from "./plant-structure";

type LayoutItem = {
  tag: string;
  equipment: EquipmentId;
  description: string;
  criticality: string | null;
  notifications: number;
  area: string;
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
const AREAS = layout.areas as unknown as Area[];
const RACK = layout.rack as Rack;
const ASSEMBLED_PIPES = layout.assembledPipes as unknown as Vec3[][];
const CONNECTIONS = layout.connections as PipeConnection[];

// Split layout: every area moves out from the plant centre and its units spread apart.
const PLANT_CENTER = { x: 0, z: 1 };
const AREA_PUSH = 1.55;
const UNIT_SPREAD = 1.45;
const AREA_CENTER: Record<string, { x: number; z: number }> = Object.fromEntries(
  AREAS.map((area) => {
    const members = ITEMS.filter((item) => item.area === area.id);
    const x = members.reduce((s, m) => s + m.position[0], 0) / Math.max(1, members.length);
    const z = members.reduce((s, m) => s + m.position[2], 0) / Math.max(1, members.length);
    return [area.id, { x, z }];
  })
);
const SPLIT: Record<string, Vec3> = Object.fromEntries(
  ITEMS.map((item) => {
    const c = AREA_CENTER[item.area] ?? { x: item.position[0], z: item.position[2] };
    const cx = PLANT_CENTER.x + (c.x - PLANT_CENTER.x) * AREA_PUSH;
    const cz = PLANT_CENTER.z + (c.z - PLANT_CENTER.z) * AREA_PUSH;
    return [item.tag, [cx + (item.position[0] - c.x) * UNIT_SPREAD, 0, cz + (item.position[2] - c.z) * UNIT_SPREAD] as Vec3];
  })
);

const FOV = 40;
const VIEWS = {
  plant: { position: [0, 15, 21] as Vec3, target: [-0.5, 1, 1.2] as Vec3 },
  split: { position: [0, 24, 33] as Vec3, target: [0, 0, 2] as Vec3 },
};
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
const RANK: Record<Status, number> = { critical: 2, warning: 1, ok: 0 };

const fmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const ease = (t: number) => t * t * (3 - 2 * t);

export type PlantTwinProps = {
  assets: PlantAsset[];
  selectedTag: string | null;
  onSelect: (tag: string | null) => void;
};

export default function PlantTwin({ assets, selectedTag, onSelect }: PlantTwinProps) {
  const [splitWanted, setSplitWanted] = useState(!!selectedTag);
  const [xray, setXray] = useState(false);
  const [explode, setExplode] = useState(0);
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [boxes, setBoxes] = useState<Record<string, Box3>>({});

  // Opening an equipment always happens from the split view.
  const split = splitWanted || !!selectedTag;
  const target = split ? 1 : 0;
  const progress = useRef({ t: target });
  const [settledAt, setSettledAt] = useState<number>(target);
  const settled = settledAt === target;

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

  const areaRows = useMemo(
    () =>
      AREAS.map((area) => {
        const members = rows.filter((row) => row.item.area === area.id);
        const status = members.reduce<Status>((worst, row) => (RANK[row.status] > RANK[worst] ? row.status : worst), "ok");
        return {
          area,
          status,
          critical: members.filter((row) => row.status === "critical").length,
          warning: members.filter((row) => row.status === "warning").length,
          tags: members.map((row) => row.item.tag),
        };
      }),
    [rows]
  );

  const selected = rows.find((row) => row.item.tag === selectedTag) ?? null;

  const onMeasure = useCallback((tag: string, box: Box3) => {
    setBoxes((current) => (current[tag] ? current : { ...current, [tag]: box }));
  }, []);

  const focus = useMemo(() => {
    if (!selectedTag || !boxes[selectedTag]) return null;
    return boxes[selectedTag].clone().translate(new Vector3(...SPLIT[selectedTag]));
  }, [selectedTag, boxes]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const el = event.target as HTMLElement | null;
      if (el && (["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName) || el.isContentEditable)) return;
      if (selectedTag && (event.key === "x" || event.key === "X")) setXray((value) => !value);
      if (event.key === "Escape") {
        if (selectedTag && xray) setXray(false);
        else if (selectedTag) onSelect(null);
        else if (splitWanted) setSplitWanted(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedTag, xray, splitWanted, onSelect]);

  const counts = useMemo(
    () => ({
      critical: rows.filter((row) => row.status === "critical").length,
      warning: rows.filter((row) => row.status === "warning").length,
    }),
    [rows]
  );

  const showSplit = () => setSplitWanted(true);
  const assemble = () => {
    onSelect(null);
    setSplitWanted(false);
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-[#e8eaec] bg-[#0e1419] lg:flex-row">
      <div className="relative h-[420px] min-w-0 flex-1 sm:h-[560px]">
        <Canvas camera={{ position: (split ? VIEWS.split : VIEWS.plant).position, fov: FOV }} dpr={[1, 2]}>
          <color attach="background" args={["#0e1419"]} />
          <ambientLight intensity={0.8} />
          <directionalLight position={[8, 14, 6]} intensity={1.6} />
          <directionalLight position={[-8, 6, -6]} intensity={0.8} color="#93c5fd" />
          <Grid
            args={[60, 60]}
            position={[0, -0.12, 0]}
            cellSize={1}
            sectionSize={5}
            cellColor="#1b2530"
            sectionColor="#2b3a48"
            fadeDistance={70}
            infiniteGrid
          />
          <Animator progressRef={progress} target={target} onSettled={setSettledAt} />

          {!split && settled && (
            <PlantStructure areas={AREAS} rack={RACK} pipes={ASSEMBLED_PIPES} onClick={showSplit} />
          )}
          {split && settled && !selectedTag && <PlantPipes positions={SPLIT} connections={CONNECTIONS} />}

          {rows.map((row) => {
            const isSelected = row.item.tag === selectedTag;
            const visible = !selectedTag || isSelected;
            const box = boxes[row.item.tag];
            return (
              <MovingGroup key={row.item.tag} from={row.item.position} to={SPLIT[row.item.tag]} progressRef={progress}>
                {visible && (
                  <EquipmentInstance
                    row={row}
                    detail={isSelected ? "high" : "low"}
                    xray={isSelected && xray}
                    explode={isSelected ? explode : 0}
                    onMeasure={onMeasure}
                    onOpen={split ? () => onSelect(row.item.tag) : showSplit}
                    onShellClick={isSelected ? () => setXray(true) : split ? () => onSelect(row.item.tag) : showSplit}
                    onPartClick={isSelected ? setActiveSlot : undefined}
                  />
                )}
                {!selectedTag && row.status !== "ok" && box && <FaultRing box={box} color={STATUS_COLOR[row.status]} />}
                {/* Labels stay mounted and are only hidden: unmounting drei <Html> mid-render logs a React root error. */}
                <EquipmentLabel
                  row={row}
                  labelY={box ? box.max.y + 0.5 : 3}
                  hidden={!split || !settled || !!selectedTag}
                  onOpen={() => onSelect(row.item.tag)}
                />
              </MovingGroup>
            );
          })}

          {areaRows.map((a) => {
            const [x0, z0, x1, z1] = a.area.rect;
            const top = Math.max(2, ...a.tags.map((tag) => boxes[tag]?.max.y ?? 0));
            return (
              <AreaLabel
                key={a.area.id}
                position={[(x0 + x1) / 2, top + 0.6, (z0 + z1) / 2]}
                hidden={split}
                color={STATUS_COLOR[a.status]}
                pulse={a.status === "critical"}
                onOpen={showSplit}
              >
                <span className="font-medium">{a.area.name}</span>
                <span style={{ color: STATUS_COLOR[a.status] }}>
                  {a.critical > 0 ? `${a.critical} critical` : a.warning > 0 ? `${a.warning} watch` : "OK"}
                </span>
              </AreaLabel>
            );
          })}

          <CameraRig focus={focus} view={split ? "split" : "plant"} />
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
                All equipment
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
              <p className="text-sm font-medium">Plant PX · cracker area</p>
              <p className="text-xs text-white/60">
                {ITEMS.length} equipment · {counts.critical} critical · {counts.warning} watch
              </p>
            </div>
          )}

          {selected ? (
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
          ) : (
            <button
              type="button"
              onClick={split ? assemble : showSplit}
              className="pointer-events-auto inline-flex min-h-9 items-center gap-1.5 rounded-md border border-white/10 bg-[#4EA8DE]/15 px-3 text-sm font-medium text-[#8ccbf0] backdrop-blur hover:bg-[#4EA8DE]/25 focus-visible:outline-2 focus-visible:outline-[#4EA8DE]"
            >
              {split ? <Factory className="h-4 w-4" aria-hidden="true" /> : <Boxes className="h-4 w-4" aria-hidden="true" />}
              {split ? "Show whole plant" : "Break into equipment"}
            </button>
          )}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-2 p-3 text-xs text-white/70">
          {selected ? (
            <p className="rounded bg-[#121a21]/80 px-2 py-1">
              <Kbd>X</Kbd> X-Ray · <Kbd>Esc</Kbd> {xray ? "close X-Ray" : "back"} · drag to orbit
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
              <p className="rounded bg-[#121a21]/80 px-2 py-1">
                {split ? "Click an equipment tag to inspect it" : "Click the plant to break it into equipment"}
              </p>
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

/** Eases a shared 0 → 1 progress value towards the target and reports when it arrives. */
function Animator({
  progressRef,
  target,
  onSettled,
}: {
  progressRef: RefObject<{ t: number }>;
  target: number;
  onSettled: (target: number) => void;
}) {
  const reported = useRef<number | null>(target);
  useFrame((_, delta) => {
    const p = progressRef.current;
    const gap = target - p.t;
    if (Math.abs(gap) < 0.002) {
      progressRef.current.t = target;
      if (reported.current !== target) {
        reported.current = target;
        onSettled(target);
      }
      return;
    }
    reported.current = null;
    progressRef.current.t += gap * Math.min(1, delta * 3.5);
  });
  return null;
}

/** Places its children between the assembled and the split position. */
function MovingGroup({
  from,
  to,
  progressRef,
  children,
}: {
  from: Vec3;
  to: Vec3;
  progressRef: RefObject<{ t: number }>;
  children: ReactNode;
}) {
  const ref = useRef<Group>(null);
  const at = (t: number): Vec3 => {
    const k = ease(t);
    return [from[0] + (to[0] - from[0]) * k, 0, from[2] + (to[2] - from[2]) * k];
  };
  const place = () => {
    if (ref.current) ref.current.position.set(...at(progressRef.current.t));
  };
  useLayoutEffect(place);
  useFrame(place);
  return (
    <group ref={ref}>
      {children}
    </group>
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

  // Measured relative to the moving parent, so the box stays valid in both the plant and the split view.
  useLayoutEffect(() => {
    const group = ref.current;
    if (!group?.parent) return;
    group.updateWorldMatrix(true, true);
    const box = new Box3().setFromObject(group);
    box.translate(group.parent.getWorldPosition(new Vector3()).negate());
    onMeasure(row.item.tag, box);
  }, [row.item.tag, onMeasure]);

  return (
    <group
      ref={ref}
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

function EquipmentLabel({ row, labelY, hidden, onOpen }: { row: Row; labelY: number; hidden: boolean; onOpen: () => void }) {
  const color = STATUS_COLOR[row.status];
  const faultCount = row.faults.length;
  const riskText =
    faultCount > 0
      ? `${faultCount} faulty part${faultCount === 1 ? "" : "s"}`
      : row.asset && row.asset.atRiskParts > 0
        ? `${row.asset.atRiskParts} below ROP`
        : null;

  return (
    <Html position={[0, labelY, 0]} center zIndexRange={[20, 0]} style={{ display: hidden ? "none" : undefined }}>
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
      </button>
    </Html>
  );
}

function AreaLabel({
  position,
  hidden,
  color,
  pulse,
  onOpen,
  children,
}: {
  position: Vec3;
  hidden: boolean;
  color: string;
  pulse: boolean;
  onOpen: () => void;
  children: ReactNode;
}) {
  return (
    <Html position={position} center zIndexRange={[20, 0]} style={{ display: hidden ? "none" : undefined }}>
      <button
        type="button"
        onClick={onOpen}
        className="flex items-center gap-1.5 whitespace-nowrap rounded-md border border-white/15 bg-[#0e1419]/85 px-2.5 py-1 text-xs leading-4 text-white shadow-lg backdrop-blur transition-colors hover:border-white/50 focus-visible:outline-2 focus-visible:outline-[#4EA8DE]"
      >
        <span className={`h-2 w-2 shrink-0 rounded-full ${pulse ? "animate-pulse" : ""}`} style={{ background: color }} />
        {children}
      </button>
    </Html>
  );
}

/** Pulsing ring on the ground under equipment that has a part at risk. */
function FaultRing({ box, color }: { box: Box3; color: string }) {
  const mesh = useRef<Mesh>(null);
  const size = box.getSize(new Vector3());
  const center = box.getCenter(new Vector3());
  const radius = Math.max(size.x, size.z) / 2 + 0.35;

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const wave = (Math.sin(clock.elapsedTime * 3) + 1) / 2;
    (mesh.current.material as MeshBasicMaterial).opacity = 0.25 + wave * 0.45;
    mesh.current.scale.setScalar(1 + wave * 0.06);
  });

  return (
    <mesh ref={mesh} position={[center.x, 0.03, center.z]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
      <ringGeometry args={[radius, radius + 0.12, 64]} />
      <meshBasicMaterial color={color} transparent depthWrite={false} />
    </mesh>
  );
}

function CameraRig({ focus, view }: { focus: Box3 | null; view: keyof typeof VIEWS }) {
  const ref = useRef<CameraControls>(null);

  useEffect(() => {
    const controls = ref.current;
    if (!controls) return;
    if (!focus) {
      const v = VIEWS[view];
      void controls.setLookAt(...v.position, ...v.target, true);
      return;
    }
    const center = focus.getCenter(new Vector3());
    const radius = focus.getSize(new Vector3()).length() / 2;
    const distance = Math.max((radius / Math.sin((FOV * Math.PI) / 360)) * 1.05, 2.5);
    const eye = center.clone().addScaledVector(new Vector3(1, 0.6, 1.3).normalize(), distance);
    void controls.setLookAt(eye.x, eye.y, eye.z, center.x, center.y, center.z, true);
  }, [focus, view]);

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
