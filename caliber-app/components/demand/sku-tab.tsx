"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Card, ClassBadge, CritBadge, ErrorNote, Loading, Pill, Segmented, Source, getJSON } from "./ui";
import { StockDecision } from "./stock-decision";
import { AiNeed, FailureRisk } from "./failure-risk";
import { DynamicMinMax } from "./dynamic-minmax";
import { MODEL_LABEL, MONTH_LABEL, fmtIDR, fmtNum } from "@/lib/demand/format";
import type { SkuDetail, SkuRow } from "./types";

const HIST = monthsBetween("2025-05", "2026-09");
const FC = monthsBetween("2026-10", "2027-09");

function monthsBetween(a: string, b: string) {
  const out: string[] = [];
  let [y, m] = a.split("-").map(Number);
  const [y2, m2] = b.split("-").map(Number);
  while (y < y2 || (y === y2 && m <= m2)) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return out;
}

type Sort = "fc" | "pm" | "crit" | "abnormal";

export function SkuTab({ initialId }: { initialId?: string }) {
  const [q, setQ] = useState("");
  const [cls, setCls] = useState("");
  const [crit, setCrit] = useState("");
  const [sort, setSort] = useState<Sort>("fc");
  const [rows, setRows] = useState<SkuRow[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string>(initialId ?? "4100034704");

  useEffect(() => {
    if (initialId) setSelected(initialId);
  }, [initialId]);

  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      const p = new URLSearchParams({ q, cls, crit, sort, limit: "80" });
      getJSON<{ rows: SkuRow[] }>(`/api/demand/skus?${p}`, ctrl.signal)
        .then((d) => { setRows(d.rows); setListError(null); })
        .catch((e) => { if (!ctrl.signal.aborted) setListError(String(e.message ?? e)); });
    }, 200);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [q, cls, crit, sort]);

  return (
    <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
      <Card className="xl:sticky xl:top-0 xl:self-start" title="Parts" info="demand.sku.list" subtitle="Consumed or planned in the next 12 months">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#8090a5]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Material no. or description"
            className="w-full rounded-xl border border-[#d7dee9] bg-[#f8fafc] py-2 pl-9 pr-3 text-sm outline-none focus:border-[#1257c7]"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <select value={cls} onChange={(e) => setCls(e.target.value)} className="rounded-lg border border-[#d7dee9] bg-white px-2 py-1.5 text-xs">
            <option value="">All classes</option>
            {["Intermittent", "Lumpy", "Erratic", "Smooth", "No demand"].map((c) => <option key={c}>{c}</option>)}
          </select>
          <select value={crit} onChange={(e) => setCrit(e.target.value)} className="rounded-lg border border-[#d7dee9] bg-white px-2 py-1.5 text-xs">
            <option value="">All criticality</option>
            <option value="SA">Critical (S/A)</option>
            <option value="S">S only</option>
            <option value="BC">B/C</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="rounded-lg border border-[#d7dee9] bg-white px-2 py-1.5 text-xs">
            <option value="fc">Sort: forecast value</option>
            <option value="pm">Sort: PM need 90 days</option>
            <option value="crit">Sort: criticality</option>
            <option value="abnormal">Sort: abnormal lines</option>
          </select>
        </div>
        <div className="mt-3 max-h-[620px] space-y-1 overflow-y-auto pr-1">
          {listError && <ErrorNote error={listError} />}
          {!rows && !listError && <Loading />}
          {rows?.length === 0 && <p className="py-6 text-center text-sm text-[#718198]">No SKUs match.</p>}
          {rows?.map((r) => (
            <button
              key={r.material_no}
              type="button"
              onClick={() => setSelected(r.material_no)}
              className={`w-full rounded-xl border px-3 py-2 text-left transition-colors ${selected === r.material_no ? "border-[#1257c7] bg-[#eef4ff]" : "border-transparent hover:bg-[#f4f6fa]"}`}
            >
              <div className="flex items-center gap-2">
                <CritBadge crit={r.criticality} />
                <span className="truncate text-[13px] font-medium text-[#15243a]">{r.description}</span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-[#718198]">
                <span>{r.material_no} · {r.demand_class}</span>
                <span>{fmtNum(r.fc_12m, 0)} {r.unit}/yr</span>
              </div>
            </button>
          ))}
        </div>
      </Card>

      <SkuDetailPanel id={selected} />
    </div>
  );
}

function SkuDetailPanel({ id }: { id: string }) {
  const [data, setData] = useState<SkuDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"qty" | "cum">("qty");

  useEffect(() => {
    const ctrl = new AbortController();
    setData(null);
    setError(null);
    getJSON<SkuDetail>(`/api/demand/sku?id=${encodeURIComponent(id)}`, ctrl.signal)
      .then(setData)
      .catch((e) => { if (!ctrl.signal.aborted) setError(String(e.message ?? e)); });
    return () => ctrl.abort();
  }, [id]);

  const chart = useMemo(() => {
    if (!data) return [];
    const m = data.material;
    const by = new Map<string, { baseline: number; pm: number; event: number }>();
    for (const r of data.monthly) {
      const cur = by.get(r.month) ?? { baseline: 0, pm: 0, event: 0 };
      cur[r.component] += r.qty;
      by.set(r.month, cur);
    }
    const pmByMonth = new Map<string, number>();
    for (const n of data.pmNeed) {
      const k = n.due_date.slice(0, 7);
      pmByMonth.set(k, (pmByMonth.get(k) ?? 0) + n.expected_qty);
    }
    const p90 = m.fc_baseline_m + 1.2816 * m.fc_baseline_sd;
    let cumA = 0;
    let cumF = 0;
    const hist = HIST.map((k) => {
      const v = by.get(k) ?? { baseline: 0, pm: 0, event: 0 };
      cumA += v.baseline + v.pm + v.event;
      return { month: MONTH_LABEL(k), h_baseline: v.baseline, h_pm: v.pm, h_event: v.event, cumActual: cumA };
    });
    const fut = FC.map((k) => {
      const pm = pmByMonth.get(k) ?? 0;
      cumF += m.fc_baseline_m + pm;
      return { month: MONTH_LABEL(k), f_baseline: m.fc_baseline_m, f_pm: pm, p90: p90 + pm, cumForecast: cumF };
    });
    return [...hist, ...fut];
  }, [data]);

  if (error) return <Card><ErrorNote error={error} /></Card>;
  if (!data) return <Card><Loading text="Loading SKU forecast…" /></Card>;
  const m = data.material;
  const bt = data.backtest;
  const tournament = bt
    ? [
        { name: "Actual", v: Number(bt.actual), fill: "#15243a" },
        { name: "Static mean", v: Number(bt.static_mean), fill: "#bf3d4b" },
        { name: "Croston-SBA", v: Number(bt.clean_croston_sba), fill: "#94a3b8" },
        { name: "TSB", v: Number(bt.clean_tsb), fill: "#94a3b8" },
        { name: "Adaptive 3-mo", v: Number(bt.clean_moving_avg_3), fill: "#94a3b8" },
        { name: "MIND-PARTS", v: Number(bt.mind), fill: "#1257c7" },
      ]
    : [];
  const upcoming = data.pmNeed.slice(0, 8);
  const lowConfidence = m.nz_months < 3 || m.price_imputed === 1 || m.lt_source !== "material";

  return (
    <div className="min-w-0 space-y-5">
      <Card info="demand.sku.header">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <CritBadge crit={m.criticality} />
              <ClassBadge cls={m.demand_class} />
              <Pill tone={m.mrp_type === "STOCK ITEM" ? "blue" : "neutral"}>{m.mrp_type === "STOCK ITEM" ? "Stock Item" : "Non Stock"}</Pill>
              {m.mrp_type !== "STOCK ITEM" && m.stock > 0 && <Pill tone="amber">Non Stock holding stock</Pill>}
              <Pill tone={lowConfidence ? "amber" : "green"}>{lowConfidence ? "Low confidence" : "Good data coverage"}</Pill>
            </div>
            <h2 className="mt-2 text-lg font-bold text-[#15243a]">{m.description}</h2>
            <p className="text-sm text-[#5f7189]">
              {m.material_no} · installed on {fmtNum(m.n_funcloc)} FuncLocs ({fmtNum(m.installed_qty)} {m.unit}) · model: <b>{MODEL_LABEL[m.model] ?? m.model}</b>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
            <Fact label="Stock" value={`${fmtNum(m.stock)} ${m.unit}`} sub={`Min ${fmtNum(m.min_qty)} · Max ${fmtNum(m.max_qty)}`} />
            <Fact label="Forecast 12 mo" value={`${fmtNum(m.fc_12m, 1)} ${m.unit}`} sub={`P90 ${fmtNum(m.fc_12m_p90, 1)}`} />
            <Fact label="Lead time" value={`${fmtNum(m.lt_p50)} d`} sub={`P90 ${fmtNum(m.lt_p90)} d · ${m.lt_source}`} />
            <Fact label="Unit price" value={fmtIDR(m.price_idr)} sub={m.price_imputed ? "family median (imputed)" : `${fmtNum(m.n_po)} PO lines`} />
          </div>
        </div>
      </Card>

      <Card
        title="Past use and the next 12 months" info="demand.sku.history"
        subtitle={`Baseline at ${fmtNum(m.fc_baseline_m, 2)} ${m.unit}/month from the ${MODEL_LABEL[m.model] ?? m.model} model, plus ${fmtNum(m.pm_planned_12m, 1)} ${m.unit} expected from ${fmtNum(m.pm_jobs_12m)} planned PM jobs`}
        right={<Segmented value={view} onChange={setView} options={[{ value: "qty", label: "Monthly" }, { value: "cum", label: "Cumulative" }]} />}
      >
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chart} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#eef2f6" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#5f7189" }} interval={2} />
              <YAxis tick={{ fontSize: 11, fill: "#5f7189" }} width={40} allowDecimals />
              <Tooltip formatter={(v) => `${Number(v).toFixed(1)} ${m.unit}`} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <ReferenceLine x={MONTH_LABEL("2026-10")} stroke="#94a3b8" strokeDasharray="4 4" />
              {view === "qty" ? (
                <>
                  <Bar dataKey="h_baseline" name="Everyday use" stackId="a" fill="#1257c7" />
                  <Bar dataKey="h_pm" name="Planned maintenance" stackId="a" fill="#16a34a" />
                  <Bar dataKey="h_event" name="Turnaround / project" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="f_baseline" name="Forecast · everyday use" stackId="a" fill="#1257c7" fillOpacity={0.35} />
                  <Bar dataKey="f_pm" name="Forecast · planned maintenance" stackId="a" fill="#16a34a" fillOpacity={0.4} />
                  <Line dataKey="p90" name="Cautious high estimate (P90)" stroke="#082f80" strokeDasharray="3 3" dot={false} />
                </>
              ) : (
                <>
                  <Line dataKey="cumActual" name="Cumulative issued" stroke="#15243a" dot={false} strokeWidth={2} />
                  <Line dataKey="cumForecast" name="Cumulative forecast" stroke="#1257c7" dot={false} strokeWidth={2} strokeDasharray="5 4" />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 grid gap-3 text-sm text-[#45576f] md:grid-cols-3">
          <p>Demand pattern: ADI <b>{fmtNum(m.adi, 2)}</b> months, CV² <b>{fmtNum(m.cv2, 2)}</b>, demand in <b>{m.nz_months}</b> of 17 months.</p>
          <p>Event orders took <b>{fmtNum(m.hist_event_qty)} {m.unit}</b> of {fmtNum(m.tot_cons)} issued; they are excluded from the baseline and planned separately.</p>
          <p>Reorder point with criticality service level: <b>{fmtNum(m.rop_new)} {m.unit}</b> (safety stock {fmtNum(m.ss_new)}) vs current Min <b>{fmtNum(m.min_qty)}</b>.</p>
        </div>
      </Card>

      <FailureRisk id={m.material_no} unit={m.unit} />
      <AiNeed key={m.material_no} id={m.material_no} unit={m.unit} />
      <DynamicMinMax id={m.material_no} />

      <div className="grid gap-5 2xl:grid-cols-2">
        <Card info="demand.sku.tournament" title="Forecast methods compared for this part" subtitle="Each method's forecast for May–Sep 2026 compared with what was really used">
          {bt ? (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tournament} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <CartesianGrid stroke="#eef2f6" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#5f7189" }} />
                  <YAxis type="category" dataKey="name" width={96} tick={{ fontSize: 11, fill: "#45576f" }} />
                  <Tooltip formatter={(v) => `${Number(v).toFixed(1)} ${m.unit}`} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="v" radius={[0, 6, 6, 0]} label={{ position: "right", fontSize: 11, formatter: (v: unknown) => Number(v).toFixed(1) }}>
                    {tournament.map((t) => <Cell key={t.name} fill={t.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-[#718198]">No consumption history: this SKU is forecast from the maintenance plan only.</p>
          )}
          <Source>Models fitted on May 2025–Apr 2026; challengers use event-cleaned history. MIND-PARTS = event-cleaned adaptive mean.</Source>
        </Card>

        <Card info="demand.sku.pm" title="Planned maintenance jobs that need this part" subtitle="From Mitem & Mplan → FuncLoc → BoM, next 12 months">
          {upcoming.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#718198]">No part-consuming PM job planned for this SKU.</p>
          ) : (
            <div className="divide-y divide-[#eef2f6]">
              {upcoming.map((n, i) => (
                <div key={i} className="flex items-center gap-3 py-2 text-sm">
                  <span className="w-20 shrink-0 font-mono text-xs text-[#45576f]">{n.due_date}</span>
                  <CritBadge crit={n.criticality ?? "C"} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-[#15243a]">{n.item_text}</p>
                    <p className="truncate text-xs text-[#718198]">{n.functional_location} · {n.funcloc_descrip}</p>
                  </div>
                  <span className="text-right text-xs text-[#45576f]">kit {fmtNum(n.installed_qty)}<br />exp. {fmtNum(n.expected_qty, 1)}</span>
                </div>
              ))}
              {data.pmNeed.length > upcoming.length && (
                <p className="pt-2 text-xs text-[#718198]">+{data.pmNeed.length - upcoming.length} more jobs in the next 12 months</p>
              )}
            </div>
          )}
          <Source>Expected qty = installed qty × replacement probability by PM type (overhaul 100%, consumables 100%, cleaning 30%, internal inspection 20%; team assumption).</Source>
        </Card>
      </div>

      <StockDecision material={m} />

      {data.abnormal.length > 0 && (
        <Card info="demand.sku.abnormal" title="Unusual withdrawals of this part" subtitle={`${data.abnormal.length} issue lines above 5× the item median, flagged for planner review before they feed the next forecast`}>
          <div className="flex flex-wrap gap-2">
            {data.abnormal.map((a, i) => (
              <span key={i} className="rounded-lg bg-[#fff0f0] px-2.5 py-1 text-xs text-[#bf3d4b]">
                {a.date} · {fmtNum(a.qty)} {m.unit} ({fmtNum(a.ratio, 0)}× median) · order {a.prefix}
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function Fact({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-[#8090a5]">{label}</p>
      <p className="font-semibold text-[#15243a]">{value}</p>
      {sub && <p className="text-[11px] text-[#718198]">{sub}</p>}
    </div>
  );
}
