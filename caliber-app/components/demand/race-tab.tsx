"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { Card, CritBadge, ErrorNote, Loading, Pill, Segmented, Slider, Source, getJSON } from "./ui";
import { RaceTimeline, StatusBadge } from "./race-timeline";
import { computeRace, formatDate, formatDays, type RaceItem, type RaceResult } from "@/lib/demand/race";
import { fmtIDR, fmtNum } from "@/lib/demand/format";

const DAY = 86_400_000;
const AS_OF_MIN = Date.parse("2026-07-01T00:00:00");
const AS_OF_MAX = Date.parse("2026-10-01T00:00:00");
const toISO = (ms: number) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

type Job = { due_date: string; installed_qty: number; expected_qty: number; functional_location: string; funcloc_descrip: string; item_text: string };
type Ctx = RaceItem & {
  description: string;
  unit: string;
  criticality: string;
  mrpType: string;
  demandClass: string;
  stockSnapshot: number;
  stockAsof: number;
  minQty: number;
  maxQty: number;
  leadP90: number;
  priceIdr: number | null;
  baselinePerMonth: number;
  needTotal: number;
  kitTotal: number;
  shortfall: number;
  shortJob: Job | null;
  jobs: Job[];
  jobCount: number;
  openPos: { pr_date: string; eta: string; qty: number; supplier: string }[];
};
type RaceResp = { asof: string; horizon: number; materials: number; items: Ctx[] };
type WhatIf = { orderedAt?: number; leadTimeDays?: number };

export function RaceTab() {
  const [asofDay, setAsofDay] = useState((AS_OF_MAX - AS_OF_MIN) / DAY);
  const [horizon, setHorizon] = useState(90);
  const [buffer, setBuffer] = useState(3);
  const [crit, setCrit] = useState<"SA" | "S" | "SABC">("SA");
  const [stockOnly, setStockOnly] = useState(true);
  const [q, setQ] = useState("");
  const [data, setData] = useState<RaceResp | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [whatIf, setWhatIf] = useState<Record<string, WhatIf>>({});

  const asof = AS_OF_MIN + asofDay * DAY;
  const asofIso = toISO(asof);

  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      const p = new URLSearchParams({ asof: asofIso, horizon: String(horizon), crit, stock: stockOnly ? "1" : "0", q, limit: "60" });
      getJSON<RaceResp>(`/api/demand/race?${p}`, ctrl.signal)
        .then((d) => { setData(d); setError(null); })
        .catch((e) => { if (!ctrl.signal.aborted) setError(String(e.message ?? e)); });
    }, 250);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [asofIso, horizon, crit, stockOnly, q]);

  const items = useMemo<Ctx[]>(() => {
    if (!data) return [];
    return data.items.map((it) => {
      const w = whatIf[it.id];
      if (!w || it.part.inStock) return it;
      return {
        ...it,
        part: {
          ...it.part,
          leadTimeDays: w.leadTimeDays ?? it.part.leadTimeDays,
          orderedAt: w.orderedAt ?? it.part.orderedAt,
          eta: w.orderedAt != null || w.leadTimeDays != null ? undefined : it.part.eta,
        },
      };
    });
  }, [data, whatIf]);

  const selected = items.find((i) => i.id === selectedId) ?? null;
  const race = selected ? computeRace(selected, { now: asof, bufferDays: buffer }) : null;

  const demo = () => {
    setAsofDay((Date.parse("2026-08-01T00:00:00") - AS_OF_MIN) / DAY);
    setQ("4100034704");
    setCrit("SA");
    setStockOnly(true);
    setSelectedId("4100034704");
  };

  return (
    <div className="space-y-5">
      <Card
        title="Demand race: will the part be on the shelf before the job that needs it?"
        subtitle="Forecast usage + planned PM kits are run against reconstructed stock and open POs from the chosen date"
        right={
          <button type="button" onClick={demo} className="inline-flex items-center gap-1.5 rounded-xl border border-[#bfd3f6] bg-[#eef4ff] px-3 py-2 text-xs font-semibold text-[#1257c7] hover:bg-[#e2ecfd]">
            <Sparkles className="h-3.5 w-3.5" /> Demo: BF-112 gate valve on 1 Aug
          </button>
        }
      >
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3 rounded-xl bg-[#f4f6fa] px-4 py-3">
          <Slider label="As-of date (time machine)" value={asofDay} min={0} max={(AS_OF_MAX - AS_OF_MIN) / DAY} onChange={setAsofDay}
            format={() => formatDate(asof, { day: "numeric", month: "short", year: "numeric" })} />
          <Slider label="Look-ahead" value={horizon} min={30} max={180} step={15} onChange={setHorizon} format={(v) => `${v} days`} />
          <Slider label="Install / kitting buffer" value={buffer} min={0} max={10} onChange={setBuffer} format={(v) => `${v} days`} />
          <div className="flex flex-col gap-1">
            <span className="text-xs text-[#5f7189]">Criticality</span>
            <Segmented value={crit} onChange={setCrit} options={[{ value: "S", label: "S" }, { value: "SA", label: "S + A" }, { value: "SABC", label: "All" }]} />
          </div>
          <label className="flex items-center gap-2 pb-1.5 text-xs text-[#45576f]">
            <input type="checkbox" checked={stockOnly} onChange={(e) => setStockOnly(e.target.checked)} className="accent-[#1257c7]" />
            Stock Items only
          </label>
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#8090a5]" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Material, description or FuncLoc (e.g. BF-112)"
              className="w-full rounded-xl border border-[#d7dee9] bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#1257c7]" />
          </div>
        </div>
        <p className="mt-2 text-xs text-[#718198]">
          Stock at the as-of date = 30 Sep 2026 snapshot + issues since − PO receipts since. Data ends 30 Sep 2026, so moving the date back replays what the planner could have seen.
          {data && <> Showing {fmtNum(Math.min(60, data.materials))} of <b>{fmtNum(data.materials)}</b> materials with PM demand in the window.</>}
        </p>
      </Card>

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          {error && <ErrorNote error={error} />}
          {!data && !error && <Loading text="Running the race…" />}
          {data && (
            <RaceTimeline items={items} now={asof} bufferDays={buffer} selectedId={selectedId}
              onSelect={(r) => setSelectedId(r?.id ?? null)} />
          )}
          <Source>
            Need line = first PM job where projected stock (stock + POs due − forecast baseline usage − expected PM usage) drops below what the job needs; window −3 / +7 days.
            Part line = next open PO arriving after that job, or ordering today with the material&apos;s P50 lead time. Module: Learning-By-Building #09 (spare-part race).
          </Source>
        </Card>

        <Card className="2xl:sticky 2xl:top-0 2xl:self-start" title="Detail & what-if">
          {!race || !selected ? (
            <p className="py-6 text-sm text-[#718198]">Select a row to see why it is flagged and test ordering today or expediting.</p>
          ) : (
            <RaceDetail race={race} ctx={selected} buffer={buffer} asof={asof} horizon={horizon}
              whatIf={whatIf[selected.id]}
              patch={(w) => setWhatIf((cur) => ({ ...cur, [selected.id]: { ...cur[selected.id], ...w } }))}
              reset={() => setWhatIf(({ [selected.id]: _drop, ...rest }) => rest)} />
          )}
        </Card>
      </div>
    </div>
  );
}

function RaceDetail({ race: r, ctx: c, buffer, asof, horizon, whatIf, patch, reset }: {
  horizon: number;
  race: RaceResult;
  ctx: Ctx;
  buffer: number;
  asof: number;
  whatIf?: WhatIf;
  patch: (w: WhatIf) => void;
  reset: () => void;
}) {
  const leadBefore = r.orderBy - asof;
  const advice =
    r.mode === "stock"
      ? `Projected stock covers all ${c.jobCount} jobs in the window. Keep monitoring the forecast.`
      : r.status === "late"
        ? `The ${c.shortJob?.item_text ?? "job"} on ${c.shortJob?.functional_location ?? r.asset} is due ${formatDate(r.failAt)} but the part only arrives ${formatDate(r.arriveAt)}. ${r.mode === "not-ordered" ? `Order now and cut ≥ ${Math.ceil(r.expediteDays)} days of lead time (local supplier, air freight, interchangeable part) or move the job.` : `Expedite the open PO by ≥ ${Math.ceil(r.expediteDays)} days or raise a faster PR.`}`
        : r.status === "tight"
          ? `Arrives inside the need window or with less than ${buffer} days of buffer. Expedite ${Math.ceil(r.expediteDays)} days to be safe.`
          : r.mode === "not-ordered"
            ? `Still safe if ordered by ${formatDate(r.orderBy)} (${formatDays(leadBefore / 86_400_000)} from the as-of date).`
            : `Part arrives ${formatDays(r.slackEarlyDays)} before the earliest need date.`;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={r.status} />
          <CritBadge crit={c.criticality} />
          <Pill>{c.demandClass}</Pill>
        </div>
        <h4 className="mt-2 font-semibold text-[#15243a]">{c.description}</h4>
        <p className="text-xs text-[#718198]">{c.id} · {c.mrpType === "STOCK ITEM" ? "Stock Item" : "Non Stock"} · Min {fmtNum(c.minQty)} / Max {fmtNum(c.maxQty)}</p>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <Dt label="Stock at as-of" value={`${fmtNum(c.stockAsof)} ${c.unit}`} />
        <Dt label="Snapshot 30 Sep" value={`${fmtNum(c.stockSnapshot)} ${c.unit}`} />
        <Dt label="Expected use in window" value={`${fmtNum(c.needTotal + (c.baselinePerMonth * horizon) / 30.44, 1)} ${c.unit}`} sub={`PM ${fmtNum(c.needTotal, 1)} + baseline ${fmtNum(c.baselinePerMonth, 2)}/mo`} />
        <Dt label="Lead time" value={`${fmtNum(r.leadTimeDays)} d`} sub={`P90 ${fmtNum(c.leadP90)} d`} />
        <Dt label="Need date" value={formatDate(r.failAt, { day: "numeric", month: "short", year: "numeric" })} tone={r.status === "late" ? "red" : undefined} />
        <Dt label="Part arrives" value={formatDate(r.arriveAt, { day: "numeric", month: "short", year: "numeric" })} tone={r.status === "late" ? "red" : undefined} />
        {r.mode === "not-ordered" && (
          <Dt label="Order by" value={formatDate(r.orderBy, { day: "numeric", month: "short", year: "numeric" })}
            sub={r.orderOverdueDays > 0 ? `${formatDays(r.orderOverdueDays)} overdue` : `${formatDays(leadBefore / 86_400_000)} left`} tone={r.orderOverdueDays > 0 ? "red" : undefined} />
        )}
        <Dt label="Exposure if the job stops" value={r.exposure > 0 ? fmtIDR(r.exposure) : "—"} sub={`${fmtIDR(Number(c.downtimeCostPerDay))}/day (${c.criticality})`} tone={r.exposure > 0 ? "red" : undefined} />
      </dl>

      <p className={`rounded-xl px-3 py-2.5 text-sm ${r.status === "late" ? "bg-[#fff0f0] text-[#8f2833]" : r.status === "tight" ? "bg-[#fff4d9] text-[#6b4500]" : "bg-[#e4f7ef] text-[#11684a]"}`}>{advice}</p>

      {r.mode !== "stock" && (
        <div className="space-y-3 rounded-xl border border-[#e3e8ef] p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#5f7896]">What-if (not written anywhere)</p>
          <Slider label="Lead time" value={r.leadTimeDays} min={0} max={Math.max(120, r.leadTimeDays)} onChange={(v) => patch({ leadTimeDays: v })}
            format={(v) => `${v} days`} />
          <div className="flex flex-wrap gap-2">
            {r.mode === "not-ordered" && (
              <button type="button" onClick={() => patch({ orderedAt: asof })} className="rounded-lg bg-[#1257c7] px-3 py-1.5 text-xs font-semibold text-white">Order today</button>
            )}
            {r.status !== "safe" && r.expediteDays > 0 && (
              <button type="button" onClick={() => patch({ leadTimeDays: Math.max(0, r.leadTimeDays - Math.ceil(r.expediteDays)) })}
                className="rounded-lg border border-[#d7dee9] px-3 py-1.5 text-xs font-semibold text-[#15243a]">
                Expedite −{Math.ceil(r.expediteDays)} days
              </button>
            )}
            {whatIf && <button type="button" onClick={reset} className="rounded-lg px-3 py-1.5 text-xs text-[#5f7189] hover:bg-[#f4f6fa]">Reset</button>}
          </div>
        </div>
      )}

      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#5f7896]">Jobs in window ({c.jobCount})</p>
        <div className="divide-y divide-[#eef2f6] text-xs">
          {c.jobs.map((j, i) => (
            <div key={i} className={`flex gap-2 py-1.5 ${c.shortJob && j.due_date === c.shortJob.due_date && j.functional_location === c.shortJob.functional_location ? "font-semibold text-[#bf3d4b]" : "text-[#45576f]"}`}>
              <span className="w-[72px] shrink-0 font-mono">{j.due_date}</span>
              <span className="min-w-0 flex-1 truncate">{j.item_text} · {j.functional_location}</span>
              <span>{fmtNum(j.expected_qty, 1)}</span>
            </div>
          ))}
        </div>
      </div>

      {c.openPos.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#5f7896]">Open POs at as-of</p>
          {c.openPos.map((p, i) => (
            <p key={i} className="text-xs text-[#45576f]">PR {p.pr_date} → ETA <b>{p.eta}</b> · {fmtNum(p.qty)} {c.unit} · {p.supplier}</p>
          ))}
        </div>
      )}
    </div>
  );
}

function Dt({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "red" }) {
  return (
    <div>
      <dt className="text-[11px] text-[#8090a5]">{label}</dt>
      <dd className={`font-semibold ${tone === "red" ? "text-[#bf3d4b]" : "text-[#15243a]"}`}>{value}</dd>
      {sub && <dd className="text-[11px] text-[#718198]">{sub}</dd>}
    </div>
  );
}
