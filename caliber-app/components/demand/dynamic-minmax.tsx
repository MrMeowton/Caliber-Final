"use client";

import { useEffect, useState } from "react";
import { CartesianGrid, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CritBadge, ErrorNote, Kpi, Loading, Source, getJSON } from "./ui";
import { MONTH_LABEL, fmtIDR, fmtNum, fmtPct } from "@/lib/demand/format";
import { formatDate } from "@/lib/demand/race";

type Detail = {
  material: { unit: string; criticality: string; stock: number; min: number; max: number; price: number };
  serviceLevel: number;
  leadDays: number;
  safetyStock: number;
  orderQty: number;
  backlogQty: number;
  openPoQty: number;
  minNow: number;
  maxNow: number;
  minPeak: number;
  months: { month: string; min: number; max: number; stockDynamic: number; stockCurrent: number }[];
  orders: { date: string; qty: number; arrives: string }[];
  compare: Record<"dynamic" | "current", { stockoutDays: number; fillRate: number; avgValue: number }>;
};

type Totals = { fillRate: number; skusWithStockout: number; stockoutSkuDays: number; avgValue: number; orders: number };
type Summary = {
  backtest: { skus: number; static: Totals; dynamic: Totals; critical: { static: Totals; dynamic: Totals } };
  forward: { skus: number; static: Totals; dynamic: Totals; excess: { aboveDynamicMax: number; aboveBomMax: number; skusAboveDynamicMax: number } };
  rows: {
    material_no: string; description: string; unit: string; criticality: string; stock: number; bomMin: number; bomMax: number;
    minNow: number; maxNow: number; firstOrder: { date: string; qty: number } | null;
    stockoutDaysCurrent: number; stockoutDaysDynamic: number; capitalDelta: number;
  }[];
};

const day = (s: string) => formatDate(Date.parse(s), { day: "numeric", month: "short", year: "numeric" });

/** SKU view: 12-month dynamic Min/Max band vs today's fixed BoM Min/Max. */
export function DynamicMinMax({ id }: { id: string }) {
  const [result, setResult] = useState<
    { id: string; data: Detail; error?: never } | { id: string; error: string; data?: never } | null
  >(null);

  useEffect(() => {
    const ctrl = new AbortController();
    getJSON<Detail>(`/api/demand/minmax?id=${encodeURIComponent(id)}`, ctrl.signal)
      .then((data) => { if (!ctrl.signal.aborted) setResult({ id, data }); })
      .catch((e) => { if (!ctrl.signal.aborted) setResult({ id, error: String(e.message ?? e) }); });
    return () => ctrl.abort();
  }, [id]);

  const currentResult = result?.id === id ? result : null;
  const data = currentResult && "data" in currentResult ? currentResult.data : null;
  const error = currentResult && "error" in currentResult ? currentResult.error : null;
  const title = "Recommended Min–Max (moves with demand)";
  if (error) return <Card info="demand.sku.minmax" title={title}><p className="text-sm text-[#5d5f60]">{error}</p></Card>;
  if (!data) return <Card info="demand.sku.minmax" title={title}><Loading text="Computing dynamic Min–Max…" /></Card>;

  const m = data.material;
  const u = m.unit;
  const chart = data.months.map((r) => ({ ...r, label: MONTH_LABEL(r.month) }));
  const next = data.orders[0];

  return (
    <Card
      info="demand.sku.minmax"
      title={title}
      subtitle={`Min and Max recalculated every day from the next ${data.leadDays} days of demand (baseline, planned PM kits, open failure notifications), at a ${fmtPct(data.serviceLevel, 1)} service level for criticality ${m.criticality}`}
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Reorder when stock falls to" value={`${fmtNum(data.minNow)} ${u}`} sub={`BoM Min ${fmtNum(m.min)} · peak ${fmtNum(data.minPeak)} in 12 months`} tone={data.minNow > m.min ? "warn" : "info"} />
        <Kpi label="Order up to" value={`${fmtNum(data.maxNow)} ${u}`} sub={`BoM Max ${fmtNum(m.max)} · order qty ${fmtNum(data.orderQty)} ${u}`} tone="info" />
        <Kpi label="Safety stock" value={`${fmtNum(data.safetyStock)} ${u}`} sub={`covers demand and supplier variability over ${data.leadDays} days`} />
        <Kpi
          label="Next order"
          value={next ? day(next.date) : "None in 12 months"}
          sub={next ? `${fmtNum(next.qty)} ${u}, arrives ${day(next.arrives)}` : `stock ${fmtNum(m.stock)} ${u} + open POs ${fmtNum(data.openPoQty)} ${u} cover it`}
          tone={next ? "bad" : "good"}
        />
      </div>

      <div className="mt-4 h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chart} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#eef2f6" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#5f7189" }} />
            <YAxis tick={{ fontSize: 12, fill: "#5f7189" }} width={56} tickFormatter={(v) => fmtNum(Number(v))} />
            <Tooltip formatter={(v, n) => [`${fmtNum(Number(v))} ${u}`, String(n)]} contentStyle={{ borderRadius: 8, fontSize: 13 }} />
            <Legend wrapperStyle={{ fontSize: 13 }} />
            <ReferenceLine y={m.min} stroke="#94a3b8" strokeDasharray="5 4" label={{ value: "BoM Min", position: "insideBottomLeft", fontSize: 12, fill: "#5f7189" }} />
            <ReferenceLine y={Math.max(m.min, m.max)} stroke="#94a3b8" strokeDasharray="5 4" label={{ value: "BoM Max", position: "insideTopLeft", fontSize: 12, fill: "#5f7189" }} />
            <Line dataKey="min" name="Dynamic Min" stroke="#c4242a" strokeWidth={2} dot={false} type="stepAfter" />
            <Line dataKey="max" name="Dynamic Max" stroke="#1b6c80" strokeWidth={2} dot={false} type="stepAfter" />
            <Line dataKey="stockDynamic" name="Projected stock (dynamic policy)" stroke="#131416" strokeWidth={2} dot={false} />
            <Line dataKey="stockCurrent" name="Projected stock (BoM Min/Max)" stroke="#94a3b8" strokeDasharray="4 3" dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 grid gap-3 text-sm text-[#353736] md:grid-cols-3">
        <p>
          Next 12 months with today&apos;s BoM Min/Max: <b>{data.compare.current.stockoutDays}</b> stockout days, fill rate{" "}
          <b>{fmtPct(data.compare.current.fillRate, 1)}</b>.
        </p>
        <p>
          With dynamic Min/Max: <b>{data.compare.dynamic.stockoutDays}</b> stockout days, fill rate <b>{fmtPct(data.compare.dynamic.fillRate, 1)}</b>.
        </p>
        <p>
          Average stock value: <b>{fmtIDR(data.compare.dynamic.avgValue)}</b> vs {fmtIDR(data.compare.current.avgValue)} today
          {data.backlogQty > 0 ? `; includes ${fmtNum(data.backlogQty)} ${u} for open failure notifications` : ""}.
        </p>
      </div>
      <Source>
        Safety stock = z × √(lead time × demand variance + demand² × lead-time variance), z from the criticality service level; lead-time variance from P50/P90.
        Order quantity = median PR/PO line quantity for this part. Open POs requested before 30 Sep 2026 arrive on their promised date.
        Projection uses expected demand, so real stock will move around these lines.
      </Source>
    </Card>
  );
}

/** Action Center: backtest of dynamic vs BoM Min/Max, plus the parts where the change matters most. */
export function DynamicMinMaxSummary() {
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    getJSON<Summary>("/api/demand/minmax", ctrl.signal)
      .then(setData)
      .catch((e) => { if (!ctrl.signal.aborted) setError(String(e.message ?? e)); });
    return () => ctrl.abort();
  }, []);

  if (error) return <Card info="action.minmax" title="Dynamic Min–Max"><ErrorNote error={error} /></Card>;
  if (!data) return <Card info="action.minmax" title="Dynamic Min–Max"><Loading text="Replaying May–Sep 2026 with both policies…" /></Card>;

  const bt = data.backtest;
  const delta = (a: number, b: number) => `${b >= a ? "+" : "−"}${fmtNum(Math.abs(b - a))}`;

  return (
    <div className="space-y-5">
      <Card
        info="action.minmax"
        title="Min–Max replay results, May–Sep 2026"
        subtitle={`Both policies replayed day by day on the ${fmtNum(bt.skus)} Stock Items that were actually issued, from the same reconstructed starting stock`}
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi
            label="Fill rate (demand served from shelf)"
            value={`${fmtPct(bt.static.fillRate, 1)} → ${fmtPct(bt.dynamic.fillRate, 1)}`}
            sub={`critical S/A: ${fmtPct(bt.critical.static.fillRate, 1)} → ${fmtPct(bt.critical.dynamic.fillRate, 1)}`}
            tone={bt.dynamic.fillRate >= bt.static.fillRate ? "good" : "bad"}
          />
          <Kpi
            label="Parts that ran out at least once"
            value={`${fmtNum(bt.static.skusWithStockout)} → ${fmtNum(bt.dynamic.skusWithStockout)}`}
            sub={`stockout part-days ${fmtNum(bt.static.stockoutSkuDays)} → ${fmtNum(bt.dynamic.stockoutSkuDays)}`}
            tone={bt.dynamic.skusWithStockout <= bt.static.skusWithStockout ? "good" : "bad"}
          />
          <Kpi
            label="Average stock value"
            value={`${fmtIDR(bt.dynamic.avgValue)}`}
            sub={`BoM Min/Max: ${fmtIDR(bt.static.avgValue)} (${delta(bt.static.avgValue / 1e9, bt.dynamic.avgValue / 1e9)} billion)`}
            tone={bt.dynamic.avgValue <= bt.static.avgValue ? "good" : "warn"}
          />
          <Kpi label="Orders placed" value={`${fmtNum(bt.static.orders)} → ${fmtNum(bt.dynamic.orders)}`} sub="more, smaller orders timed to demand" />
        </div>
        <p className="mt-4 text-sm leading-6 text-[#353736]">
          <b>{fmtNum(data.forward.excess.skusAboveDynamicMax)}</b> parts sit above their recommended Max, worth{" "}
          <b>{fmtIDR(data.forward.excess.aboveDynamicMax)}</b> that can be released.
        </p>
        <Source>
          Replay: demand = actual daily issues; dynamic policy knows only what was known on 1 May 2026 (training forecast, training
          variability, planned PM work, open POs). New orders arrive after the P50 lead time. Dummy data: values are illustrative.
        </Source>
      </Card>

      <Card
        info="action.minmaxTable"
        title="Parts where the recommended Min–Max matters most"
        subtitle="Next 12 months on expected demand: fewer stockout days first, then the largest stock reduction"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-[#f4f6f8] text-xs text-[#5d5f60]">
              <tr>
                <th className="px-3 py-2.5 font-medium">Material</th>
                <th className="px-3 py-2.5 font-medium">On hand</th>
                <th className="px-3 py-2.5 font-medium">BoM Min / Max</th>
                <th className="px-3 py-2.5 font-medium">Dynamic Min / Max</th>
                <th className="px-3 py-2.5 font-medium">Next order</th>
                <th className="px-3 py-2.5 font-medium">Stockout days</th>
                <th className="px-3 py-2.5 font-medium">Avg stock value change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8eaec] tabular-nums">
              {data.rows.slice(0, 15).map((r) => (
                <tr key={r.material_no}>
                  <td className="max-w-[260px] px-3 py-2.5">
                    <p className="flex items-center gap-2 truncate font-medium"><CritBadge crit={r.criticality} /> <span className="truncate">{r.description}</span></p>
                    <p className="font-mono text-xs text-[#5d5f60]">{r.material_no}</p>
                  </td>
                  <td className="px-3 py-2.5">{fmtNum(r.stock)} {r.unit}</td>
                  <td className="px-3 py-2.5">{fmtNum(r.bomMin)} / {fmtNum(r.bomMax)}</td>
                  <td className="px-3 py-2.5 font-semibold">{fmtNum(r.minNow)} / {fmtNum(r.maxNow)}</td>
                  <td className="px-3 py-2.5">{r.firstOrder ? `${day(r.firstOrder.date)} · ${fmtNum(r.firstOrder.qty)}` : "—"}</td>
                  <td className="px-3 py-2.5">{r.stockoutDaysCurrent} → <b>{r.stockoutDaysDynamic}</b></td>
                  <td className={`px-3 py-2.5 ${r.capitalDelta < 0 ? "text-[#1e7b4f]" : "text-[#92400e]"}`}>{fmtIDR(r.capitalDelta, { sign: true })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Source>Recommendations only: nothing is written to SAP. Open a part in Forecasting → SKU forecast to see its 12-month Min/Max band.</Source>
      </Card>
    </div>
  );
}
