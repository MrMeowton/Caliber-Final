"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, ClassBadge, CritBadge, ErrorNote, Kpi, Loading, Pill, Segmented, Source, getJSON } from "./ui";
import { MONTH_LABEL, fmtIDR, fmtNum, fmtPct } from "@/lib/demand/format";
import type { Summary } from "./types";

const BASE = ["static_mean", "croston_sba", "tsb", "moving_avg_3"] as const;
const NAME: Record<string, string> = {
  static_mean: "Static 12-mo mean",
  croston_sba: "Croston-SBA",
  tsb: "TSB",
  moving_avg_3: "Adaptive 3-mo",
};

type Abn = {
  total: { n: number; v: number };
  rows: { date: string; material_no: string; description: string; unit: string; criticality: string; qty: number; median_qty: number; ratio: number; prefix: string; component: string; value_idr: number | null }[];
  byMonth: { month: string; n: number; event_n: number; value_idr: number }[];
  byComponent: { component: string; n: number }[];
};

export function BacktestTab({ data, onOpenSku }: { data: Summary; onOpenSku: (id: string) => void }) {
  const all = data.backtest.filter((b) => b.scope.startsWith("All"));
  const get = (model: string, scope = "all") =>
    (scope === "all" ? all : data.backtest.filter((b) => b.scope === scope)).find((b) => b.model === model);
  const chart = BASE.map((k) => ({
    name: NAME[k],
    raw: (get(k)?.wape ?? 0) * 100,
    clean: (get("clean_" + k)?.wape ?? 0) * 100,
  }));
  const mind = get("mind");
  const stat = get("static_mean");
  const perClass = get("mind_class");

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi info="demand.bt.static" label="Error of today's average method" value={fmtPct(stat?.wape)} sub={`bias ${fmtPct(stat?.bias)}: buys for demand that does not come`} tone="bad" />
        <Kpi info="demand.bt.mind" label="Error of the MIND forecast" value={fmtPct(mind?.wape)} sub={`bias ${fmtPct(mind?.bias, 1)} · fixed before the test`} tone="good" />
        <Kpi info="demand.bt.perClass" label="Error, best method per demand type" value={fmtPct(perClass?.wape)} sub="model chosen per demand class (optimistic: chosen on this holdout)" tone="info" />
        <Kpi info="demand.bt.n" label="Parts tested" value={fmtNum(mind?.n)} sub={`train May 25–Apr 26 · test May–Sep 26 · ${fmtNum(data.kpi.new_in_test)} new-demand SKUs excluded`} />
      </div>

      <Card
        title="Every method tested, with and without one-off events removed" info="demand.bt.table"
        subtitle="Forecast error on 5 months the models had not seen (lower is better). Removing turnaround and project orders from history helps every model"
      >
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#eef2f6" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#45576f" }} />
              <YAxis tick={{ fontSize: 11, fill: "#5f7189" }} width={40} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(v) => `${Number(v).toFixed(0)}%`} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="raw" name="Fitted on raw history" fill="#cbd5e1" radius={[6, 6, 0, 0]}
                label={{ position: "top", fontSize: 11, fill: "#5f7189", formatter: (v: unknown) => `${Number(v).toFixed(0)}%` }} />
              <Bar dataKey="clean" name="Event-cleaned history" fill="#1257c7" radius={[6, 6, 0, 0]}
                label={{ position: "top", fontSize: 11, fill: "#1257c7", formatter: (v: unknown) => `${Number(v).toFixed(0)}%` }} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-[#e3e8ef] text-left text-[11px] uppercase tracking-wide text-[#5f7896]">
                <th className="py-2 pr-3">Demand class</th>
                <th className="py-2 pr-3 text-right">SKUs</th>
                <th className="py-2 pr-3 text-right">Static mean WAPE / bias</th>
                <th className="py-2 pr-3 text-right">MIND WAPE / bias</th>
                <th className="py-2 text-right">Model used going forward</th>
              </tr>
            </thead>
            <tbody>
              {["Intermittent", "Lumpy", "Erratic", "Smooth"].map((c) => {
                const s = get("static_mean", c);
                const m = get("mind", c);
                const ch = data.chosen.find((r) => r.cls === c && r.chosen === 1);
                return (
                  <tr key={c} className="border-b border-[#f1f4f8]">
                    <td className="py-2 pr-3"><ClassBadge cls={c} /></td>
                    <td className="py-2 pr-3 text-right">{fmtNum(m?.n)}</td>
                    <td className="py-2 pr-3 text-right text-[#bf3d4b]">{fmtPct(s?.wape)} / {fmtPct(s?.bias)}</td>
                    <td className="py-2 pr-3 text-right text-[#16865d]">{fmtPct(m?.wape)} / {fmtPct(m?.bias)}</td>
                    <td className="py-2 text-right">{ch ? `${NAME[ch.model] ?? ch.model} (${fmtPct(ch.wape)})` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-4 grid gap-3 rounded-xl bg-[#f4f6fa] p-4 text-sm text-[#45576f] md:grid-cols-3">
          <p><b className="text-[#15243a]">Validated before use.</b> Every model is scored on months it never saw; the result is re-run monthly as new issues arrive (Booklet FAQ 7).</p>
          <p><b className="text-[#15243a]">Bias matters more than WAPE for stock.</b> A +{fmtPct(stat?.bias)} bias means Min–Max set from averages buys about twice what is used.</p>
          <p><b className="text-[#15243a]">History has a blind spot.</b> {fmtNum(data.kpi.new_in_test)} SKUs had demand in the test window with none before; {fmtNum(data.kpi.gone_in_test)} went quiet. The PM plan covers part of that gap.</p>
        </div>
        <Source>WAPE = Σ|forecast − actual| ÷ Σ actual over SKUs with training demand; bias = Σ(forecast − actual) ÷ Σ actual. Source: Movement Material, team backtest.</Source>
      </Card>

      <AbnormalCard onOpenSku={onOpenSku} />
    </div>
  );
}

function AbnormalCard({ onOpenSku }: { onOpenSku: (id: string) => void }) {
  const [crit, setCrit] = useState<"" | "SA">("");
  const [data, setData] = useState<Abn | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    getJSON<Abn>(`/api/demand/abnormal?limit=40&crit=${crit}`, ctrl.signal)
      .then((d) => { setData(d); setError(null); })
      .catch((e) => { if (!ctrl.signal.aborted) setError(String(e.message ?? e)); });
    return () => ctrl.abort();
  }, [crit]);

  if (error) return <ErrorNote error={error} />;
  if (!data) return <Loading text="Scanning for abnormal consumption…" />;
  const chart = data.byMonth.map((m) => ({ month: MONTH_LABEL(m.month), event: m.event_n, other: m.n - m.event_n }));
  const eventShare = (data.byComponent.find((c) => c.component === "event")?.n ?? 0) / Math.max(1, data.total.n);

  return (
    <Card
      title="Unusual withdrawals to review" info="demand.bt.abnormal"
      subtitle={`${fmtNum(data.total.n)} issue lines above 5× the item's median quantity, worth ${fmtIDR(data.total.v)}; ${fmtPct(eventShare)} sit on turnaround / project orders`}
      right={<Segmented value={crit} onChange={setCrit} options={[{ value: "", label: "All" }, { value: "SA", label: "Critical S/A" }]} />}
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#eef2f6" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#5f7189" }} interval={1} />
              <YAxis tick={{ fontSize: 11, fill: "#5f7189" }} width={32} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="other" name="Unexplained spike" stackId="a" fill="#bf3d4b" />
              <Bar dataKey="event" name="On turnaround / project order" stackId="a" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-[#e3e8ef] text-left text-[11px] uppercase tracking-wide text-[#5f7896]">
                <th className="py-2 pr-2">Date</th>
                <th className="py-2 pr-2">SKU</th>
                <th className="py-2 pr-2 text-right">Qty vs median</th>
                <th className="py-2 text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r, i) => (
                <tr key={i} className="cursor-pointer border-b border-[#f1f4f8] hover:bg-[#f8fafc]" onClick={() => onOpenSku(r.material_no)}>
                  <td className="py-1.5 pr-2 font-mono text-xs">{r.date}</td>
                  <td className="py-1.5 pr-2">
                    <div className="flex items-center gap-1.5"><CritBadge crit={r.criticality} /><span className="truncate text-xs font-medium text-[#15243a]">{r.description}</span></div>
                    <p className="text-[11px] text-[#718198]">{r.material_no} · order {r.prefix} {r.component === "event" ? <Pill tone="amber">event</Pill> : null}</p>
                  </td>
                  <td className="py-1.5 pr-2 text-right text-xs">{fmtNum(r.qty)} vs {fmtNum(r.median_qty)} {r.unit}<br /><b className="text-[#bf3d4b]">{fmtNum(r.ratio, 0)}×</b></td>
                  <td className="py-1.5 text-right text-xs">{fmtIDR(r.value_idr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Source>Rule: line quantity &gt; 5× that material&apos;s median issue quantity. Unexplained spikes go to planner review (data entry error, unit mix-up or real failure) before they shape the next forecast. Click a row to open the SKU.</Source>
    </Card>
  );
}
