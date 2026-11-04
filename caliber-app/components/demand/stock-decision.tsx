"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Card, Kpi, Pill, Slider, Source } from "./ui";
import { optimize } from "@/lib/demand/economics";
import { analyze } from "@/lib/demand/finance";
import { HOLDING_RATE, JOB_WAIT_IDR_PER_DAY, RUSH_PREMIUM, fmtIDR, fmtNum, fmtPct } from "@/lib/demand/format";
import type { Material } from "./types";

/**
 * Forecast → stock decision for one SKU.
 *  (1) Spare-part economics (Learning-By-Building #14): Poisson lead-time demand from the forecast
 *      → fill rate, expected downtime and holding cost for every stock level S → cost-optimal S*.
 *  (2) Stock vs buy-on-demand (Learning-By-Building #15, NPV engine): should this SKU be a
 *      Stock Item at S* or a Non Stock item bought per job (rush premium + waiting time)?
 */
export function StockDecision({ material: m }: { material: Material }) {
  const [waitM, setWaitM] = useState((JOB_WAIT_IDR_PER_DAY[m.criticality] ?? 2e6) / 1e6);
  const [share, setShare] = useState(50);
  const [emergencyDays, setEmergencyDays] = useState(Math.min(14, Math.max(3, Math.round(m.lt_p50 / 3))));
  const [holding, setHolding] = useState(HOLDING_RATE * 100);
  const [horizon, setHorizon] = useState(5);

  const price = m.price_idr ?? 0;
  const lambda = Math.max(0, m.annual_demand);
  const costPerHour = (waitM * 1e6 * (share / 100)) / 24;

  const econ = useMemo(
    () =>
      optimize({
        id: m.material_no,
        name: m.description,
        unitCost: price,
        holdingRate: holding / 100,
        annualDemand: lambda,
        leadTimeDays: m.lt_p50,
        downtimeCostPerHour: costPerHour,
        emergencyLeadDays: emergencyDays,
        currentStock: Math.round(m.stock),
      }),
    [m, price, holding, lambda, costPerHour, emergencyDays]
  );

  const fin = useMemo(() => {
    const best = econ.best;
    const marginPerHour = costPerHour; // already scaled by the share of jobs that stop
    return analyze({
      repair: {
        // Non Stock: buy per job, pay rush premium, job waits the normal lead time
        opex: lambda * price * (1 + RUSH_PREMIUM),
        failuresPerYear: lambda,
        downtimeHoursPerFailure: m.lt_p50 * 24,
      },
      replace: {
        // Stock Item at S*: capital now, holding cost, residual waits only when the shelf is empty
        upfront: best.S * price,
        opex: lambda * price + best.holdingCost,
        failuresPerYear: 1,
        downtimeHoursPerFailure: best.downtimeHours,
        residualValue: best.S * price,
      },
      discountRate: 0.1,
      horizonYears: horizon,
      lostMarginPerHour: marginPerHour,
    });
  }, [econ, lambda, price, m.lt_p50, costPerHour, horizon]);

  if (lambda <= 0) {
    return (
      <Card title="Forecast → stock decision" info="demand.stock" subtitle="Spare-part economics and stock vs buy-on-demand">
        <p className="rounded-xl bg-[#f4f6fa] px-4 py-3 text-sm text-[#45576f]">
          No consumption in 17 months and no part-consuming PM job planned, so the forecast is zero.
          {m.criticality === "S" || m.criticality === "A"
            ? ` As a critical (${m.criticality}) item it is an insurance spare: keep a floor of 1–2 units and stop buying beyond it. Current stock: ${fmtNum(m.stock)} ${m.unit}.`
            : ` Holding ${fmtNum(m.stock)} ${m.unit} (${fmtIDR(m.stock * price)}) has no forecast use; candidate for reduce / redeploy review.`}
        </p>
      </Card>
    );
  }

  const best = econ.best;
  const cur = econ.current;
  const curveTop = econ.curve.length - 1;
  const curve = econ.curve.map((p) => ({
    S: p.S,
    holding: p.holdingCost / 1e6,
    downtime: p.downtimeCost / 1e6,
    total: p.totalCost / 1e6,
  }));
  const yMax = Math.max(best.totalCost * 4, (econ.curve.at(-1)?.holdingCost ?? 0) * 1.05, 1) / 1e6;
  const stockSwap = fin.verdict === "replace";
  const cumulative = fin.years.map((y) => ({ t: `Y${y.t}`, nonStock: y.cumKeep / 1e6, stock: y.cumSwap / 1e6 }));

  return (
    <Card
      title="Forecast → stock decision" info="demand.stock"
      subtitle={`Lead-time demand ~ Poisson(${fmtNum((lambda * m.lt_p50) / 365, 2)} ${m.unit}) from ${fmtNum(lambda, 1)} ${m.unit}/yr forecast and ${fmtNum(m.lt_p50)} days lead time`}
    >
      <div className="flex flex-wrap gap-x-6 gap-y-3 rounded-xl bg-[#f4f6fa] px-4 py-3">
        <Slider label="Cost of a job waiting for the part" value={waitM} min={0} max={500} step={5} onChange={setWaitM} format={(v) => `IDR ${v} M/day`} />
        <Slider label="Demand that cannot wait (urgent)" value={share} min={0} max={100} step={5} onChange={setShare} format={(v) => `${v}%`} />
        <Slider label="Emergency buy lead time" value={emergencyDays} min={1} max={60} onChange={setEmergencyDays} format={(v) => `${v} days`} />
        <Slider label="Holding cost" value={holding} min={5} max={35} onChange={setHolding} format={(v) => `${v}%/yr`} />
      </div>

      <div className="mt-4 grid gap-5 2xl:grid-cols-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-semibold text-[#24364c]">Spare-part economics: cost-optimal stock level</h4>
            {cur && best.S !== cur.S && (
              <Pill tone={best.S > cur.S ? "red" : "amber"}>{best.S > cur.S ? `Raise to ${best.S}` : `Reduce to ${best.S}`}</Pill>
            )}
          </div>
          <p className="mt-1 text-sm text-[#45576f]">
            Keep <b>{best.S}</b> {m.unit}, reorder when stock falls to <b>{econ.reorderPoint}</b>. Current stock {fmtNum(m.stock)}, current Min {fmtNum(m.min_qty)}.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Kpi info="demand.stock.fill" label="Fill rate at S*" value={fmtPct(best.fillRate, 1)} sub={cur ? `now ${fmtPct(cur.fillRate, 1)}` : undefined} tone="good" />
            <Kpi info="demand.stock.downtime" label="Downtime waiting / yr" value={`${fmtNum(best.downtimeHours, 1)} h`} sub={cur ? `now ${fmtNum(cur.downtimeHours, 1)} h` : undefined} />
            <Kpi info="demand.stock.total" label="Total cost / yr" value={fmtIDR(best.totalCost)} sub={cur ? `now ${fmtIDR(cur.totalCost)}` : undefined} />
            <Kpi info="demand.stock.capital" label="Working capital" value={fmtIDR(best.capital)} sub={econ.capitalDelta != null ? `${fmtIDR(econ.capitalDelta, { sign: true })} vs now` : undefined}
              tone={econ.capitalDelta != null && econ.capitalDelta < 0 ? "good" : undefined} />
          </div>
          <div className="mt-3 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={curve} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                <CartesianGrid stroke="#eef2f6" />
                <XAxis dataKey="S" tick={{ fontSize: 11, fill: "#5f7189" }} label={{ value: `stock level S (${m.unit})`, position: "insideBottom", offset: -2, fontSize: 11, fill: "#5f7189" }} />
                <YAxis domain={[0, yMax]} allowDataOverflow tick={{ fontSize: 11, fill: "#5f7189" }} width={48} tickFormatter={(v) => `${Number(v).toFixed(0)}`}
                  label={{ value: "IDR M/yr", angle: -90, position: "insideLeft", fontSize: 11, fill: "#5f7189" }} />
                <Tooltip formatter={(v) => `IDR ${Number(v).toFixed(1)} M`} labelFormatter={(l) => `S = ${l}`} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <ReferenceLine x={best.S} stroke="#16a34a" strokeDasharray="4 4" label={{ value: `optimal ${best.S}`, fontSize: 11, fill: "#16865d", position: "top" }} />
                {cur && cur.S <= curveTop && cur.S !== best.S && (
                  <ReferenceLine x={cur.S} stroke="#bf3d4b" strokeDasharray="4 4" label={{ value: `now ${cur.S}`, fontSize: 11, fill: "#bf3d4b", position: "insideTop" }} />
                )}
                <Line dataKey="holding" name="Holding cost" stroke="#1257c7" dot={false} />
                <Line dataKey="downtime" name="Downtime cost" stroke="#bf3d4b" dot={false} />
                <Line dataKey="total" name="Total" stroke="#15243a" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {cur && cur.S > curveTop && (
            <p className="text-xs text-[#bf3d4b]">Current stock ({fmtNum(cur.S)}) is off the chart: {fmtIDR(cur.holdingCost)}/yr holding cost for {fmtPct(cur.fillRate, 1)} fill rate.</p>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-semibold text-[#24364c]">Stock Item or buy-on-demand?</h4>
            <Pill tone={m.mrp_type === "STOCK ITEM" ? "blue" : "neutral"}>today: {m.mrp_type === "STOCK ITEM" ? "Stock Item" : "Non Stock"}</Pill>
          </div>
          <div className={`mt-2 rounded-xl border px-4 py-3 ${stockSwap ? "border-[#bfd3f6] bg-[#eef4ff]" : "border-[#d7e9df] bg-[#effaf4]"}`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#5f7896]">Advice · {horizon}-year view at 10% discount rate</p>
            <p className="mt-1 text-base font-bold text-[#15243a]">
              {stockSwap ? `Keep as Stock Item (${best.S} ${m.unit})` : "Buy on demand (Non Stock)"}
            </p>
            <p className="mt-1 text-sm text-[#45576f]">
              {stockSwap
                ? `Stocking saves ${fmtIDR(fin.npv)} in present value versus buying per job with a ${fmtPct(RUSH_PREMIUM)} rush premium and a ${fmtNum(m.lt_p50)}-day wait.`
                : `Buying per job is ${fmtIDR(-fin.npv)} cheaper in present value: the holding cost of ${best.S} units outweighs the waiting risk at these assumptions.`}
              {m.mrp_type !== "STOCK ITEM" && stockSwap ? " This SKU is set as Non Stock today: review the MRP Type." : ""}
            </p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Kpi info="demand.stock.npv" label="NPV of stocking" value={fmtIDR(fin.npv, { sign: true })} tone={fin.npv > 0 ? "good" : "bad"} />
            <Kpi info="demand.stock.payback" label="Discounted payback" value={fin.discountedPayback == null ? "not reached" : `${fin.discountedPayback.toFixed(1)} yr`} />
            <Kpi info="demand.stock.eacKeep" label="Annual cost · buy on demand" value={fmtIDR(fin.eacKeep)} sub="equivalent annual cost" />
            <Kpi info="demand.stock.eacSwap" label="Annual cost · stock" value={fmtIDR(fin.eacSwap)} sub="equivalent annual cost" />
          </div>
          <div className="mt-3 h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cumulative} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#eef2f6" />
                <XAxis dataKey="t" tick={{ fontSize: 11, fill: "#5f7189" }} />
                <YAxis tick={{ fontSize: 11, fill: "#5f7189" }} width={48} tickFormatter={(v) => `${Number(v).toFixed(0)}`}
                  label={{ value: "IDR M (PV)", angle: -90, position: "insideLeft", fontSize: 11, fill: "#5f7189" }} />
                <Tooltip formatter={(v) => `IDR ${Number(v).toFixed(1)} M`} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line dataKey="nonStock" name="Buy on demand (cumulative)" stroke="#94a3b8" strokeWidth={2} dot={false} />
                <Line dataKey="stock" name="Stock Item (cumulative)" stroke="#1257c7" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-1 max-w-[220px]">
            <Slider label="Horizon" value={horizon} min={2} max={10} onChange={setHorizon} format={(v) => `${v} yr`} />
          </div>
        </div>
      </div>
      <Source>
        Modules: Learning-By-Building #14 (base-stock Poisson economics) and #15 (NPV / EAC engine), fed with this SKU&apos;s forecast, P50 lead time and median PO price.
        Job-waiting cost per day by criticality S/A/B/C = IDR 100/40/10/2 M (a delayed job, not a full unit trip), 50% of demand urgent, holding 20%/yr, rush premium 15% (team assumptions; validate with Finance &amp; Production Planning).
      </Source>
    </Card>
  );
}
