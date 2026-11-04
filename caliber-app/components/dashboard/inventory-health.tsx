"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, Search } from "lucide-react";
import { Card, CritBadge, ErrorNote, Loading, Source, getJSON } from "@/components/demand/ui";
import { StatusBadge, VERDICT_ROW, type Verdict } from "@/components/ui/status";
import { InfoTip } from "@/components/ui/info-tip";
import { fmtIDR, fmtNum } from "@/lib/demand/format";
import { cn } from "@/lib/utils";
import type { HealthCategory } from "@/lib/inventory/health";

type Row = {
  material_no: string; description: string; unit: string; criticality: string; mrpType: string; stock: number; bomMax: number;
  value: number; priceImputed: boolean; lastIssue: string | null; monthsSinceIssue: number | null; issued12m: number;
  coverMonths: number | null; slowing: boolean; pmNext12m: number; openPo: number; category: HealthCategory; atRisk: number; action: string;
};
type Health = {
  asOf: string;
  historyMonths: number;
  totals: { skus: number; value: number };
  categories: { key: HealthCategory; label: string; action: string; skus: number; value: number; atRisk: number }[];
  slowing: { skus: number; value: number };
  aging: { bucket: string; skus: number; value: number }[];
  rows: Row[];
};

type Filter = HealthCategory | "slowing" | "all";

const VERDICT: Record<HealthCategory, Verdict> = {
  excess: "watch", slowMoving: "watch", nonMoving: "watch", obsolete: "watch", insurance: "ok", healthy: "ok",
};
const TONE: Record<HealthCategory, string> = {
  excess: "#8a5300", slowMoving: "#8a5300", nonMoving: "#8a5300", obsolete: "#8a5300", insurance: "#1e7b4f", healthy: "#1e7b4f",
};


export function InventoryHealth() {
  const [data, setData] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    const ctrl = new AbortController();
    getJSON<Health>("/api/inventory/health", ctrl.signal)
      .then(setData)
      .catch((e) => { if (!ctrl.signal.aborted) setError(String(e.message ?? e)); });
    return () => ctrl.abort();
  }, []);

  const rows = useMemo(() => {
    if (!data) return [];
    const query = q.trim().toLowerCase();
    return data.rows
      .filter((r) => filter === "all" || (filter === "slowing" ? r.slowing : r.category === filter))
      .filter((r) => !query || `${r.material_no} ${r.description}`.toLowerCase().includes(query))
      .slice(0, 60);
  }, [data, filter, q]);

  if (error) return <ErrorNote error={error} />;
  if (!data) return <Loading text="Classifying every part in stock…" />;

  const releasable = data.categories.reduce((a, c) => a + c.atRisk, 0);
  const tiles = data.categories.filter((c) => c.key !== "healthy");

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Which stock is overstocked, slow or dead?</h2>
          <p className="mt-1 text-sm text-[#5d5f60]">
            <b className="text-[#131416]">{fmtIDR(releasable)}</b> could be released
          </p>
        </div>
        <InfoTip id="overview.health.categories" />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6" aria-label="Health categories">
        {tiles.map((c) => (
          <CategoryTile
            key={c.key}
            active={filter === c.key}
            onClick={() => setFilter(filter === c.key ? "all" : c.key)}
            color={TONE[c.key]}
            label={c.label}
            skus={c.skus}
            value={c.value}
            sub={c.key === "insurance" ? "kept on purpose" : `${fmtIDR(c.atRisk)} releasable`}
          />
        ))}
        <CategoryTile
          active={filter === "slowing"}
          onClick={() => setFilter(filter === "slowing" ? "all" : "slowing")}
          color="#a86f0c"
          label="Becoming slow-moving"
          skus={data.slowing.skus}
          value={data.slowing.value}
          sub="use fell > 70% in 6 months"
          alert
        />
      </section>

      <Card
        info="overview.health.aging"
        title="Inventory aging"
        subtitle="Stock value by time since the part was last issued from the warehouse"
      >
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.aging.map((a) => ({ ...a, bn: a.value / 1e9 }))} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#eef2f6" vertical={false} />
              <XAxis dataKey="bucket" tick={{ fontSize: 12, fill: "#5f7189" }} />
              <YAxis tick={{ fontSize: 12, fill: "#5f7189" }} width={56} tickFormatter={(v) => `${fmtNum(Number(v))} bn`} />
              <Tooltip
                formatter={(_, __, item) => [`${fmtIDR(item.payload.value)} · ${fmtNum(item.payload.skus)} parts`, "Stock value"]}
                contentStyle={{ borderRadius: 8, fontSize: 13 }}
              />
              <Bar dataKey="bn" fill="#1b6c80" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <Source>
          Movement history covers {data.historyMonths} months (May 2025 – Sep 2026), so the 24-month obsolete rule cannot be measured yet.
          &quot;Potentially obsolete&quot; is a proxy: no issue in all {data.historyMonths} months, no planned maintenance need in the next 12 months
          and no open purchase order. Values use the median PO price; dummy data, illustrative magnitudes.
        </Source>
      </Card>

      <Card
        info="overview.health.table"
        title="Parts to review"
        subtitle={filter === "all" ? "All flagged parts, largest releasable value first" : `Filtered: ${filter === "slowing" ? "Becoming slow-moving" : data.categories.find((c) => c.key === filter)?.label}`}
        right={
          <label className="relative block w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5d5f60]" aria-hidden="true" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search material"
              aria-label="Search parts to review"
              className="min-h-10 w-full rounded-md border border-[#cdced1] bg-white pl-9 pr-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b6c80]"
            />
          </label>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="bg-[#f4f6f8] text-xs text-[#5d5f60]">
              <tr>
                <th className="px-3 py-2.5 font-medium">Material</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-3 py-2.5 font-medium">On hand</th>
                <th className="px-3 py-2.5 font-medium">Last issued</th>
                <th className="px-3 py-2.5 font-medium">Issued, 12 months</th>
                <th className="px-3 py-2.5 font-medium">Stock lasts</th>
                <th className="px-3 py-2.5 font-medium">Releasable value</th>
                <th className="px-3 py-2.5 font-medium">Recommended action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8eaec] tabular-nums">
              {rows.map((r) => (
                <tr key={r.material_no} className={`align-top ${VERDICT_ROW[VERDICT[r.category]]}`}>
                  <td className="max-w-[260px] px-3 py-2.5">
                    <p className="flex items-center gap-2 font-medium"><CritBadge crit={r.criticality} /><span className="truncate">{r.description}</span></p>
                    <p className="font-mono text-xs text-[#5d5f60]">{r.material_no} · {r.mrpType === "STOCK ITEM" ? "Stock Item" : "Non Stock"}</p>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-col items-start gap-1">
                      <StatusBadge verdict={VERDICT[r.category]}>{CATEGORY_LABEL[r.category]}</StatusBadge>
                      {r.slowing && <StatusBadge verdict="watch">Slowing down</StatusBadge>}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">{fmtNum(r.stock)} {r.unit}<span className="block text-xs text-[#5d5f60]">Max {fmtNum(r.bomMax)}</span></td>
                  <td className="px-3 py-2.5">{r.lastIssue ?? "None in 17 months"}</td>
                  <td className="px-3 py-2.5">{fmtNum(r.issued12m)} {r.unit}</td>
                  <td className="px-3 py-2.5">{r.coverMonths === null ? "No recent use" : `${fmtNum(r.coverMonths, 1)} months`}</td>
                  <td className="px-3 py-2.5 font-semibold">
                    {fmtIDR(r.atRisk)}
                    {r.priceImputed && <span className="block text-xs font-normal text-[#5d5f60]">imputed price</span>}
                  </td>
                  <td className="max-w-[240px] px-3 py-2.5 text-[#353736]">{r.action}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={8} className="px-3 py-8 text-center text-[#5d5f60]">No parts match this filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Source>Showing up to 60 parts. Recommendations only; nothing is changed in SAP. A critical S/A spare that never moves is kept as insurance up to its BoM Max (at least 2 units); stock above that floor is counted as excess.</Source>
      </Card>
    </div>
  );
}

const CATEGORY_LABEL: Record<HealthCategory, string> = {
  excess: "Excess", slowMoving: "Slow-moving", nonMoving: "Non-moving", obsolete: "Potentially obsolete", insurance: "Insurance spare", healthy: "Healthy",
};

function CategoryTile({ active, onClick, color, label, skus, value, sub, alert }: {
  active: boolean; onClick: () => void; color: string; label: string; skus: number; value: number; sub: string; alert?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-lg border bg-white px-4 py-3.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b6c80]",
        active ? "border-[#1b6c80] bg-[#f4fafb]" : "border-[#e8eaec] hover:bg-[#f9fbfc]"
      )}
    >
      <p className="flex items-center gap-1.5 text-sm font-medium text-[#353736]">
        {alert ? <AlertTriangle className="h-4 w-4" style={{ color }} aria-hidden="true" /> : <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />}
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums" style={{ color }}>{fmtNum(skus)}</p>
      <p className="text-xs text-[#5d5f60]">parts · {fmtIDR(value)} in stock</p>
      <p className="mt-0.5 text-xs font-medium text-[#353736]">{sub}</p>
    </button>
  );
}
