"use client";

import { useMemo, useState } from "react";
import {
  Bar, CartesianGrid, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, Scatter,
  ScatterChart, Tooltip, XAxis, YAxis, ZAxis,
} from "recharts";
import { Card, Kpi, ClassBadge, Segmented, Source } from "./ui";
import { CLASS_COLORS, MODEL_LABEL, MONTH_LABEL, fmtIDR, fmtNum, fmtPct } from "@/lib/demand/format";
import type { Summary } from "./types";

const COMP = {
  baseline: { label: "Baseline (corrective)", color: "#1257c7" },
  pm: { label: "PM-driven", color: "#16a34a" },
  event: { label: "Event (turnaround / project)", color: "#f59e0b" },
};

export function OverviewTab({ data, onOpenTab }: { data: Summary; onOpenTab: (tab: string) => void }) {
  const { kpi } = data;
  const [scenario, setScenario] = useState<"base" | "ta">("base");

  const rows = useMemo(() => {
    const hist = data.site.filter((r) => r.kind === "history");
    const histByMonth = new Map(hist.map((r) => [r.month, r]));
    const last12 = hist.slice(-12);
    const staticAvg = last12.reduce((s, r) => s + r.baseline_idr + r.pm_idr + r.event_idr, 0) / 12 / 1e9;
    return {
      staticAvg,
      rows: data.site.map((r) => {
        if (r.kind === "history") {
          return {
            month: MONTH_LABEL(r.month),
            h_baseline: r.baseline_idr / 1e9,
            h_pm: r.pm_idr / 1e9,
            h_event: r.event_idr / 1e9,
          };
        }
        const [y, m] = r.month.split("-").map(Number);
        const lastYear = `${y - 1}-${String(m).padStart(2, "0")}`;
        const ev = scenario === "ta" ? (histByMonth.get(lastYear)?.event_idr ?? 0) : 0;
        return {
          month: MONTH_LABEL(r.month),
          f_baseline: r.baseline_idr / 1e9,
          f_pm: r.pm_idr / 1e9,
          f_event: ev / 1e9,
          p90: ((r.baseline_p90_idr ?? r.baseline_idr) + r.pm_idr + ev) / 1e9,
        };
      }),
    };
  }, [data.site, scenario]);

  const fcTotal12 = data.site
    .filter((r) => r.kind === "forecast")
    .reduce((s, r) => s + r.baseline_idr + r.pm_idr, 0);
  const histLast12 = data.site
    .filter((r) => r.kind === "history")
    .slice(-12)
    .reduce((s, r) => s + r.baseline_idr + r.pm_idr + r.event_idr, 0);

  const classes = ["Intermittent", "Lumpy", "Erratic", "Smooth"].map((c) => {
    const row = data.classes.find((r) => r.cls === c);
    const chosen = data.chosen.find((r) => r.cls === c && r.chosen === 1);
    return { cls: c, n: row?.n ?? 0, critical: row?.critical ?? 0, model: chosen?.model ?? row?.model ?? "", wape: chosen?.wape };
  });
  const consumed = kpi.consumed;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Non-smooth demand" info="demand.kpi.nonSmooth"
          value={fmtPct(kpi.non_smooth_share)}
          sub={`${fmtNum(consumed)} SKUs consumed in 17 months · ${fmtNum(kpi.zero_consumption)} never moved`}
          tone="warn"
        />
        <Kpi
          label="Forecast error (WAPE)" info="demand.kpi.wape"
          value={<span>{fmtPct(kpi.wape_static)} <span className="text-base text-[#718198]">→</span> <span className="text-[#16865d]">{fmtPct(kpi.wape_mind)}</span></span>}
          sub={`Static average vs MIND · bias ${fmtPct(kpi.bias_static, 0)} → ${fmtPct(kpi.bias_mind, 0)}`}
        />
        <Kpi
          label="PM-driven demand, next 12 months" info="demand.kpi.pm"
          value={fmtNum(kpi.pm_items_12m)}
          sub={`PM items on ${fmtNum(kpi.pm_funclocs_12m)} FuncLocs · ${fmtNum(kpi.pm_part_items_12m)} draw parts (${fmtNum(kpi.pm_materials_12m)} SKUs)`}
          tone="info"
        />
        <Kpi
          label="Abnormal consumption" info="demand.kpi.abnormal"
          value={fmtNum(kpi.abnormal_lines)}
          sub={`issue lines > 5× item median · ${fmtPct(kpi.abnormal_share, 1)} of all lines`}
          tone="bad"
        />
      </div>

      <Card
        title="Demand decomposition: what drives spare-part consumption" info="demand.decomposition"
        subtitle="Issued value per month split by driver, then a 12-month forecast from the baseline model plus the maintenance plan"
        right={
          <Segmented
            value={scenario}
            onChange={setScenario}
            options={[
              { value: "base", label: "No turnaround planned" },
              { value: "ta", label: "Repeat last year's events" },
            ]}
          />
        }
      >
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={rows.rows} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#eef2f6" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#5f7189" }} interval={1} />
              <YAxis tick={{ fontSize: 11, fill: "#5f7189" }} tickFormatter={(v) => `${v}`} width={44}
                label={{ value: "IDR bn", angle: -90, position: "insideLeft", fontSize: 11, fill: "#5f7189" }} />
              <Tooltip formatter={(v) => `IDR ${Number(v).toFixed(1)} bn`} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <ReferenceLine x={MONTH_LABEL("2026-10")} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: "forecast →", position: "insideTopLeft", fontSize: 11, fill: "#5f7189" }} />
              <ReferenceLine y={rows.staticAvg} stroke="#bf3d4b" strokeDasharray="6 4" label={{ value: `static 12-mo average ${rows.staticAvg.toFixed(1)} bn`, position: "insideTopRight", fontSize: 11, fill: "#bf3d4b" }} />
              <Bar dataKey="h_baseline" name={COMP.baseline.label} stackId="h" fill={COMP.baseline.color} />
              <Bar dataKey="h_pm" name={COMP.pm.label} stackId="h" fill={COMP.pm.color} />
              <Bar dataKey="h_event" name={COMP.event.label} stackId="h" fill={COMP.event.color} />
              <Bar dataKey="f_baseline" name="Forecast · baseline" stackId="h" fill={COMP.baseline.color} fillOpacity={0.35} />
              <Bar dataKey="f_pm" name="Forecast · PM plan" stackId="h" fill={COMP.pm.color} fillOpacity={0.4} />
              <Bar dataKey="f_event" name="Scenario · events" stackId="h" fill={COMP.event.color} fillOpacity={0.45} />
              <Line dataKey="p90" name="Forecast P90" stroke="#082f80" strokeDasharray="3 3" dot={false} strokeWidth={1.5} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 grid gap-3 text-sm text-[#45576f] md:grid-cols-3">
          <p><b className="text-[#15243a]">{fmtPct(kpi.event_qty_share)}</b> of issued quantity came from turnaround (order 203) and project (209) orders. A static average treats them as normal demand, which is why it over-forecasts.</p>
          <p>Next 12 months: <b className="text-[#15243a]">{fmtIDR(fcTotal12)}</b> expected (baseline + PM plan) vs <b className="text-[#15243a]">{fmtIDR(histLast12)}</b> issued in the last 12 months including events.</p>
          <p><b className="text-[#15243a]">{fmtNum(kpi.new_in_test)}</b> SKUs had demand in the holdout with none before, so history alone cannot see them; the PM plan can.</p>
        </div>
        <Source>
          Source: Movement Material (17,518 issue lines, May 2025–Sep 2026), order prefix 201/202/205/206 = baseline, 204 = PM, 203/209 = events (team assumption);
          Mitem &amp; Mplan → FuncLoc → BoM for the PM plan; value = qty × median PO unit price (family median when a SKU has no PO). Dummy data, illustrative magnitudes.
        </Source>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Card
          title="Demand classes (Syntetos–Boylan)" info="demand.classes"
          subtitle="Average demand interval (ADI) vs variability of demand size (CV²), one dot per consumed SKU"
        >
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 16, left: 0, bottom: 10 }}>
                <CartesianGrid stroke="#eef2f6" />
                <XAxis type="number" dataKey="adi" name="ADI" domain={[1, 17]} tick={{ fontSize: 11, fill: "#5f7189" }}
                  label={{ value: "ADI (months between demands)", position: "insideBottom", offset: -4, fontSize: 11, fill: "#5f7189" }} />
                <YAxis type="number" dataKey="cv2" name="CV²" domain={[0, 3]} allowDataOverflow tick={{ fontSize: 11, fill: "#5f7189" }} width={36} />
                <ZAxis range={[14, 14]} />
                <ReferenceLine x={1.32} stroke="#64748b" strokeDasharray="4 4" />
                <ReferenceLine y={0.49} stroke="#64748b" strokeDasharray="4 4" />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ borderRadius: 12, fontSize: 12 }}
                  formatter={(v) => Number(v).toFixed(2)} />
                {["Smooth", "Erratic", "Intermittent", "Lumpy"].map((c) => (
                  <Scatter key={c} name={c} data={data.scatter.filter((p) => p.cls === c).map((p) => ({ ...p, cv2: Math.min(p.cv2, 3) }))}
                    fill={CLASS_COLORS[c]} fillOpacity={0.55} />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <Source>Cut-offs ADI 1.32 and CV² 0.49 (Syntetos, Boylan &amp; Croston, 2005). CV² above 3 is drawn at 3.</Source>
        </Card>

        <Card info="demand.models" title="One model per demand class" subtitle="The forecaster is chosen automatically for each class by its holdout error">
          <div className="space-y-2.5">
            {classes.map((c) => (
              <div key={c.cls} className="flex items-center gap-3 rounded-xl border border-[#e3e8ef] px-3 py-2.5">
                <div className="w-28 shrink-0"><ClassBadge cls={c.cls} /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#15243a]">{MODEL_LABEL[c.model] ?? c.model}</p>
                  <p className="text-xs text-[#718198]">
                    {fmtNum(c.n)} SKUs ({fmtPct(c.n / Math.max(1, consumed))}) · {fmtNum(c.critical)} critical S/A
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[#15243a]">{fmtPct(c.wape)}</p>
                  <p className="text-[11px] text-[#718198]">class WAPE</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => onOpenTab("backtest")} className="rounded-xl border border-[#d7dee9] px-3 py-2 text-xs font-medium text-[#1257c7] hover:bg-[#f4f6fa]">See the backtest →</button>
            <button type="button" onClick={() => onOpenTab("sku")} className="rounded-xl border border-[#d7dee9] px-3 py-2 text-xs font-medium text-[#1257c7] hover:bg-[#f4f6fa]">Open a SKU forecast →</button>
          </div>
          <Source>Event-cleaned history; model choice per class from the May–Sep 2026 holdout, then refit on all 17 months for the forward forecast.</Source>
        </Card>
      </div>
    </div>
  );
}
