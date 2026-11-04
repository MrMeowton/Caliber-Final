"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  STATUS, axisTicks, computeRaces, formatDate, formatDays, pct, raceWindow, summarize,
  type RaceItem, type RaceResult, type RaceStatus,
} from "@/lib/demand/race";

/*
 * <RaceTimeline> — ported from Learning-By-Building/09-spare-part-race (RaceTimeline.jsx).
 * Each row has TWO lanes on one time axis:
 *   ⚙ need  : as-of ───► need window (job −3 / +7 days), ✕ = first job the shelf cannot cover
 *   📦 part : ordered ──► ● part arrives (open PO ETA, or "order today" + P50 lead time)
 * A red gap = the job is due before the part arrives (days the job waits).
 */

const tone: Record<RaceStatus, { badge: string; text: string; row: string }> = {
  late: { badge: "bg-[#fff0f0] text-[#bf3d4b] border-[#f5c2c7]", text: "text-[#bf3d4b]", row: "border-l-[#bf3d4b]" },
  tight: { badge: "bg-[#fff4d9] text-[#805300] border-[#f3d9a0]", text: "text-[#805300]", row: "border-l-[#f59e0b]" },
  safe: { badge: "bg-[#e4f7ef] text-[#16865d] border-[#b9e6d1]", text: "text-[#16865d]", row: "border-l-[#16a34a]" },
};

export function StatusBadge({ status }: { status: RaceStatus }) {
  return (
    <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold", tone[status].badge)}>
      {STATUS[status].label}
    </span>
  );
}

export function RaceTimeline({ items, now, bufferDays = 3, selectedId, onSelect }: {
  items: RaceItem[];
  now: number;
  bufferDays?: number;
  selectedId: string | null;
  onSelect: (r: RaceResult | null) => void;
}) {
  const races = useMemo(() => computeRaces(items, { now, bufferDays }), [items, now, bufferDays]);
  const range = useMemo(() => raceWindow(races, { now }), [races, now]);
  const ticks = useMemo(() => axisTicks(range, 8), [range]);
  const s = useMemo(() => summarize(races), [races]);

  return (
    <div className="min-w-0">
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <SumCell n={s.late} text="part arrives after the job" status="late" />
        <SumCell n={s.tight} text="tight / inside need window" status="tight" />
        <SumCell n={s.safe} text="covered by stock or PO" status="safe" />
        <SumCell n={s.overdueOrders} text="orders already past order-by date" status={s.overdueOrders ? "late" : "safe"} />
      </div>
      <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#5f7189]">
        <span className="flex items-center gap-1.5"><i className="inline-block h-1.5 w-5 rounded bg-[#cbd5e1]" />Lead-up to job</span>
        <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-5 rounded bg-[#fde68a]" />Need window</span>
        <span className="flex items-center gap-1.5"><b className="text-[#bf3d4b]">✕</b>First uncovered job</span>
        <span className="flex items-center gap-1.5"><i className="inline-block h-1.5 w-5 rounded bg-[#1257c7]" />Part in transit</span>
        <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-full bg-[#1257c7]" />Part arrives</span>
        <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-5 rounded bg-[#bf3d4b]/25" />Job waits for part</span>
        <span className="flex items-center gap-1.5"><i className="inline-block h-3 w-0.5 bg-[#082f80]" />Order-by date</span>
      </div>

      <div className="rounded-xl border border-[#e3e8ef]">
        <div className="flex border-b border-[#e3e8ef] bg-[#f8fafc]">
          <div className="w-[260px] shrink-0 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-[#5f7896]">Part · first uncovered job</div>
          <div className="relative h-8 flex-1">
            {ticks.map((t) => (
              <span key={t} className="absolute top-2 -translate-x-1/2 whitespace-nowrap text-[10px] text-[#8090a5]" style={{ left: `${pct(t, range)}%` }}>
                {formatDate(t)}
              </span>
            ))}
          </div>
        </div>
        {races.length === 0 && <p className="py-8 text-center text-sm text-[#718198]">No part-consuming PM jobs in this window.</p>}
        <div className="max-h-[560px] overflow-y-auto">
          {races.map((r) => (
            <RaceRow key={r.id} race={r} range={range} selected={r.id === selectedId}
              onSelect={() => onSelect(r.id === selectedId ? null : r)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SumCell({ n, text, status }: { n: number; text: string; status: RaceStatus }) {
  return (
    <div className={cn("rounded-xl border px-3 py-2", tone[status].badge)}>
      <b className="text-xl">{n}</b>
      <p className="text-[11px] leading-tight">{text}</p>
    </div>
  );
}

function RaceRow({ race: r, range, selected, onSelect }: {
  race: RaceResult;
  range: [number, number];
  selected: boolean;
  onSelect: () => void;
}) {
  const x = (ms: number) => pct(ms, range);
  const span = (a: number, b: number) => ({ left: `${x(a)}%`, width: `${Math.max(0, x(b) - x(a))}%` });
  const verdict =
    r.status === "late"
      ? `Job waits ${formatDays(r.waitDays)}`
      : r.status === "tight"
        ? r.slackEarlyDays < 0 ? "Arrives inside need window" : `Only ${formatDays(r.slackEarlyDays)} buffer`
        : r.mode === "stock" ? "Shelf covers all jobs" : `Ahead by ${formatDays(r.slackDays)}`;
  const partState = {
    stock: "covered by stock",
    eta: `open PO, ETA ${formatDate(r.arriveAt)}`,
    ordered: `ordered ${formatDate(r.orderAt)}`,
    "not-ordered": `not ordered · lead ${r.leadTimeDays} d`,
  }[r.mode];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(); } }}
      className={cn(
        "flex cursor-pointer border-b border-l-4 border-b-[#eef2f6] transition-colors last:border-b-0",
        tone[r.status].row,
        selected ? "bg-[#eef4ff]" : "hover:bg-[#f8fafc]"
      )}
    >
      <div className="w-[256px] shrink-0 px-3 py-2">
        <div className="flex items-center gap-2">
          <StatusBadge status={r.status} />
          <b className="truncate text-xs text-[#15243a]">{r.asset}</b>
        </div>
        <p className="mt-0.5 truncate text-[11px] text-[#45576f]" title={String(r.part?.name ?? "")}>{r.part?.name}</p>
        <p className="truncate text-[11px] text-[#8090a5]">{partState}</p>
        <p className={cn("text-[11px] font-semibold", tone[r.status].text)}>{verdict}</p>
      </div>
      <div className="relative min-h-[76px] flex-1">
        <span className="absolute inset-y-0 w-px bg-[#082f80]/40" style={{ left: `${x(r.now)}%` }} />
        {r.status === "late" && (
          <span className="absolute inset-y-1 rounded bg-[#bf3d4b]/15" style={span(r.failAt, r.arriveAt)}>
            <em className="absolute right-1 top-0.5 text-[10px] font-semibold not-italic text-[#bf3d4b]">+{Math.round(r.waitDays)} d</em>
          </span>
        )}
        {/* lane 1 — need */}
        <div className="absolute inset-x-0 top-3 h-5">
          <span className="absolute top-2 h-1.5 rounded bg-[#cbd5e1]" style={span(r.now, r.failEarly)} />
          <span className="absolute top-1 h-3.5 rounded bg-[#fde68a]" style={span(r.failEarly, r.failLate)} />
          <span className="absolute -translate-x-1/2 text-sm font-bold leading-5 text-[#bf3d4b]" style={{ left: `${x(r.failAt)}%` }}>✕</span>
        </div>
        {/* lane 2 — part */}
        <div className="absolute inset-x-0 top-10 h-5">
          <span
            className={cn("absolute top-2 h-1.5 rounded", r.mode === "not-ordered" ? "bg-[repeating-linear-gradient(90deg,#1257c7_0_6px,transparent_6px_10px)]" : "bg-[#1257c7]")}
            style={span(r.orderAt, r.arriveAt)}
          />
          {r.mode === "not-ordered" && r.orderBy >= range[0] && (
            <span className={cn("absolute top-0 h-5 w-0.5", r.orderOverdueDays > 0 ? "bg-[#bf3d4b]" : "bg-[#082f80]")} style={{ left: `${x(r.orderBy)}%` }} title={`Order by ${formatDate(r.orderBy)}`} />
          )}
          <span className="absolute top-1 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 border-white bg-[#1257c7] shadow" style={{ left: `${x(r.arriveAt)}%` }} />
          <span className="absolute top-4 -translate-x-1/2 whitespace-nowrap text-[10px] text-[#5f7189]" style={{ left: `${x(r.arriveAt)}%` }}>{formatDate(r.arriveAt)}</span>
        </div>
      </div>
    </div>
  );
}
