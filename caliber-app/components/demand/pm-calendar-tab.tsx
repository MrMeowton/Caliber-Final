"use client";

import { useEffect, useState } from "react";
import { Bar, CartesianGrid, Cell, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CritBadge, ErrorNote, Kpi, Loading, Pill, Source, getJSON } from "./ui";
import { MONTH_LABEL, fmtIDR, fmtNum } from "@/lib/demand/format";

type CalRow = { month: string; jobs: number; part_jobs: number; materials?: number; expected_idr?: number; kit_idr?: number; critical_short?: number };
type JobRow = { due_date: string; functional_location: string; funcloc_descrip: string; item_text: string; kind: string; criticality: string | null; materials: number; kit_idr: number; short_items: number };
type Resp = { calendar: CalRow[]; kinds: { kind: string; p_replace: number; n: number }[]; month: string; jobs: JobRow[] };

export function PmCalendarTab({ onOpenRace }: { onOpenRace: () => void }) {
  const [month, setMonth] = useState("2026-10");
  const [data, setData] = useState<Resp | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    getJSON<Resp>(`/api/demand/pm-calendar?month=${month}`, ctrl.signal)
      .then((d) => { setData(d); setError(null); })
      .catch((e) => { if (!ctrl.signal.aborted) setError(String(e.message ?? e)); });
    return () => ctrl.abort();
  }, [month]);

  if (error) return <ErrorNote error={error} />;
  if (!data) return <Loading text="Building the PM demand calendar…" />;

  const chart = data.calendar.map((r) => ({
    key: r.month,
    month: MONTH_LABEL(r.month),
    expected: (r.expected_idr ?? 0) / 1e9,
    kit: (r.kit_idr ?? 0) / 1e9,
    short: r.critical_short ?? 0,
  }));
  const totalExpected = data.calendar.reduce((s, r) => s + (r.expected_idr ?? 0), 0);
  const totalJobs = data.calendar.reduce((s, r) => s + r.jobs, 0);
  const partJobs = data.calendar.reduce((s, r) => s + r.part_jobs, 0);
  const sel = data.calendar.find((r) => r.month === data.month);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi info="demand.pm.jobs" label="Planned maintenance jobs, Oct 26 – Sep 27" value={fmtNum(totalJobs)} sub="from 10,153 maintenance items, cycles normalised to months" />
        <Kpi info="demand.pm.partJobs" label="Jobs that consume parts" value={fmtNum(partJobs)} sub="overhaul, consumable change, cleaning, internal inspection" tone="info" />
        <Kpi info="demand.pm.expected" label="Expected PM part demand" value={fmtIDR(totalExpected)} sub="known in advance: no statistics needed" tone="good" />
        <Kpi info="demand.pm.gaps" label={`Critical parts short in ${MONTH_LABEL(data.month)}`} value={fmtNum(sel?.critical_short ?? 0)} sub="S/A Stock Items with stock below the job kit" tone="bad" />
      </div>

      <Card
        title="Which parts will planned maintenance need, month by month?" info="demand.pm.calendar"
        subtitle="Click a month to see its jobs. Bars = value of parts needed; line = critical parts with too little stock for that month's jobs"
      >
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              onClick={(e) => {
                const label = (e as { activeLabel?: string | number } | null)?.activeLabel;
                const hit = chart.find((c) => c.month === label);
                if (hit) setMonth(hit.key);
              }}>
              <CartesianGrid stroke="#eef2f6" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#5f7189" }} />
              <YAxis yAxisId="v" tick={{ fontSize: 11, fill: "#5f7189" }} width={44} label={{ value: "IDR bn", angle: -90, position: "insideLeft", fontSize: 11, fill: "#5f7189" }} />
              <YAxis yAxisId="n" orientation="right" tick={{ fontSize: 11, fill: "#bf3d4b" }} width={36} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }}
                formatter={(v, name) => (name === "Critical kit gaps" ? `${v} SKUs` : `IDR ${Number(v).toFixed(1)} bn`)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar yAxisId="v" dataKey="expected" name="Expected part demand" radius={[6, 6, 0, 0]} cursor="pointer">
                {chart.map((c) => <Cell key={c.key} fill={c.key === data.month ? "#082f80" : "#16a34a"} />)}
              </Bar>
              <Bar yAxisId="v" dataKey="kit" name="Full kit value (upper bound)" fill="#bbf7d0" radius={[6, 6, 0, 0]} />
              <Line yAxisId="n" dataKey="short" name="Critical kit gaps" stroke="#bf3d4b" strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {data.kinds.map((k) => (
            <Pill key={k.kind} tone={k.p_replace > 0 ? "green" : "neutral"}>
              {k.kind}: {fmtNum(k.n)} jobs{k.p_replace > 0 ? ` · ${Math.round(k.p_replace * 100)}% replace` : ""}
            </Pill>
          ))}
        </div>
        <Source>
          Next due date = start of cycle + k × cycle (YEARLY / MONTH / WEEK text normalised). Mplan has no part list, so parts come from the BoM of the same FuncLoc:
          expected = installed qty × replacement probability; consumable jobs only draw their own family (filter, oil, grease).
        </Source>
      </Card>

      <Card
        title={`Jobs due in ${MONTH_LABEL(data.month)}`} info="demand.pm.month"
        subtitle="Part-consuming jobs, kit gaps first"
        right={<button type="button" onClick={onOpenRace} className="rounded-xl border border-[#d7dee9] px-3 py-2 text-xs font-medium text-[#1257c7] hover:bg-[#f4f6fa]">Run the demand race →</button>}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-[#e3e8ef] text-left text-[11px] uppercase tracking-wide text-[#5f7896]">
                <th className="py-2 pr-3">Due</th>
                <th className="py-2 pr-3">Crit.</th>
                <th className="py-2 pr-3">FuncLoc</th>
                <th className="py-2 pr-3">Job</th>
                <th className="py-2 pr-3 text-right">Parts</th>
                <th className="py-2 pr-3 text-right">Kit value</th>
                <th className="py-2 text-right">Short</th>
              </tr>
            </thead>
            <tbody>
              {data.jobs.map((j, i) => (
                <tr key={i} className="border-b border-[#f1f4f8]">
                  <td className="py-2 pr-3 font-mono text-xs">{j.due_date}</td>
                  <td className="py-2 pr-3"><CritBadge crit={j.criticality ?? "C"} /></td>
                  <td className="py-2 pr-3"><p className="font-medium text-[#15243a]">{j.functional_location}</p><p className="text-xs text-[#718198]">{j.funcloc_descrip}</p></td>
                  <td className="py-2 pr-3"><p className="text-[#15243a]">{j.item_text}</p><p className="text-xs text-[#718198]">{j.kind}</p></td>
                  <td className="py-2 pr-3 text-right">{fmtNum(j.materials)}</td>
                  <td className="py-2 pr-3 text-right">{fmtIDR(j.kit_idr)}</td>
                  <td className="py-2 text-right">{j.short_items > 0 ? <Pill tone="red">{j.short_items} short</Pill> : <Pill tone="green">ok</Pill>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Source>Short = Stock Items whose 30 Sep 2026 stock is below the installed quantity on that FuncLoc. Top 60 jobs shown.</Source>
      </Card>
    </div>
  );
}
