"use client";

// Step 3 · Act — parts below their reorder level, with a draft order a planner can stage (never sent anywhere).
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { InfoTip } from "@/components/ui/info-tip";
import { StatusBadge, VERDICT_ROW, type Verdict } from "@/components/ui/status";

type Recommendation = {
  functionalLoc: string;
  materialNo: string;
  description: string;
  stock: number;
  maxQty: number;
  unit: string;
  criticality: string;
  reorderPoint: number;
  orderCap: number;
  recommendedQty: number;
  locationDescription: string;
  nextMaintenance: string | null;
  nextMaintenanceDate: string | null;
  reason: string;
};

const num = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const PAGE_SIZE = 100;
const day = (v: string | null) =>
  v ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${v.slice(0, 10)}T00:00:00`)) : "";

const verdictOf = (r: Recommendation): Verdict => (r.stock <= 0 && ["S", "A"].includes(r.criticality) ? "act" : "watch");

export function ReorderList() {
  const [rows, setRows] = useState<Recommendation[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [draft, setDraft] = useState<Array<Recommendation & { qty: number }>>([]);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/api/inventory/dashboard", { cache: "no-store", signal: ctrl.signal })
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body?.error ?? `Request failed (${r.status})`);
        setRows(body.recommendations as Recommendation[]);
      })
      .catch((e) => { if (!ctrl.signal.aborted) setError(e instanceof Error ? e.message : "Unable to load the reorder list."); });
    return () => ctrl.abort();
  }, []);

  const key = (r: Recommendation) => `${r.functionalLoc}:${r.materialNo}`;
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = [...(rows ?? [])].sort((a, b) => Number(verdictOf(b) === "act") - Number(verdictOf(a) === "act"));
    return q ? list.filter((r) => `${r.materialNo} ${r.description} ${r.functionalLoc} ${r.locationDescription}`.toLowerCase().includes(q)) : list;
  }, [rows, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const qtyOf = (r: Recommendation) => quantities[key(r)] ?? r.recommendedQty;
  const stageable = (rows ?? []).filter((r) => selected.has(key(r)) && qtyOf(r) > 0);
  const urgent = (rows ?? []).filter((r) => verdictOf(r) === "act").length;

  return (
    <section id="reorder" className="relative rounded-lg border border-[#e8eaec] bg-white" aria-label="Reorder list">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e8eaec] px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <h2 className="flex items-center gap-1 text-lg font-semibold">
            Which parts should we reorder now? <InfoTip id="overview.replenishment" />
          </h2>
          <p className="mt-1 text-sm text-[#45484a]">
            {rows ? (
              <>
                <b className="text-[#b42318]">{urgent}</b> critical at zero · {rows.length - urgent} below reorder level
              </>
            ) : (
              "Loading…"
            )}
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <label className="relative block min-w-0 flex-1 sm:w-64 sm:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5d5f60]" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search part or equipment"
              aria-label="Search reorder list"
              className="min-h-10 w-full rounded-md border border-[#cdced1] bg-white pl-9 pr-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b6c80]"
            />
          </label>
          <button
            type="button"
            onClick={() => setDraft(stageable.map((r) => ({ ...r, qty: Math.min(r.orderCap, Math.max(0, Math.floor(qtyOf(r)))) })))}
            disabled={stageable.length === 0}
            className="min-h-10 shrink-0 rounded-md bg-[#1b6c80] px-4 text-sm font-semibold text-white hover:bg-[#155768] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b6c80]"
          >
            Stage {stageable.length} selected
          </button>
        </div>
      </div>

      {error && <p className="m-4 rounded-md bg-[#ffedea] p-3 text-sm text-[#9b1c1f]" role="alert">{error}</p>}

      <div className="max-h-[560px] overflow-auto">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="sticky top-0 bg-[#f4f6f8] text-xs text-[#45484a]">
            <tr>
              <th className="w-10 px-4 py-2.5"><span className="sr-only">Select</span></th>
              <th className="px-3 py-2.5 font-semibold">Part</th>
              <th className="px-3 py-2.5 font-semibold">Status</th>
              <th className="px-3 py-2.5 font-semibold">On hand</th>
              <th className="px-3 py-2.5 font-semibold">Reorder level</th>
              <th className="px-3 py-2.5 font-semibold">Max</th>
              <th className="px-3 py-2.5 font-semibold">Why</th>
              <th className="px-3 py-2.5 font-semibold">Order qty</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e8eaec] tabular-nums">
            {pageRows.map((r) => {
              const k = key(r);
              const v = verdictOf(r);
              return (
                <tr key={k} className={`align-top ${VERDICT_ROW[v]}`}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(k)}
                      onChange={(e) =>
                        setSelected((cur) => {
                          const next = new Set(cur);
                          if (e.target.checked) next.add(k);
                          else next.delete(k);
                          return next;
                        })
                      }
                      aria-label={`Select ${r.materialNo}`}
                      className="h-4 w-4 accent-[#1b6c80]"
                    />
                  </td>
                  <td className="max-w-[260px] px-3 py-3">
                    <p className="truncate font-medium">{r.description}</p>
                    <p className="truncate font-mono text-xs text-[#5d5f60]">{r.materialNo} · {r.functionalLoc.replace(/^PX_/, "")} · crit. {r.criticality || "—"}</p>
                  </td>
                  <td className="px-3 py-3"><StatusBadge verdict={v}>{v === "act" ? "Out of stock" : "Below reorder level"}</StatusBadge></td>
                  <td className="px-3 py-3 font-semibold">{num.format(r.stock)} {r.unit}</td>
                  <td className="px-3 py-3">{num.format(r.reorderPoint)}</td>
                  <td className="px-3 py-3">{num.format(r.maxQty)}</td>
                  <td className="max-w-[240px] px-3 py-3 text-xs leading-5 text-[#353736]">
                    {r.reason}
                    {r.orderCap === 0 ? " · Max is 0; review the target stock level" : ""}
                    {r.nextMaintenance ? ` · ${r.nextMaintenance} ${day(r.nextMaintenanceDate)}` : ""}
                  </td>
                  <td className="px-3 py-3">
                    <input
                      type="number"
                      min={0}
                      max={r.orderCap}
                      value={qtyOf(r)}
                      disabled={r.orderCap === 0}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        setQuantities((cur) => ({ ...cur, [k]: Number.isFinite(n) ? Math.min(r.orderCap, Math.max(0, Math.floor(n))) : 0 }));
                      }}
                      aria-label={`Order quantity for ${r.materialNo}, at most ${r.orderCap} ${r.unit}`}
                      className="h-9 w-20 rounded-md border border-[#cdced1] px-2 text-right text-sm"
                    />
                  </td>
                </tr>
              );
            })}
            {rows && filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-[#5d5f60]">{search ? "No parts match this search." : "No part is below its reorder level."}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <nav
          className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e8eaec] px-4 py-3 text-sm text-[#45484a] sm:px-5"
          aria-label="Reorder list pagination"
        >
          <p aria-live="polite">
            Showing {(page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <span className="tabular-nums">Page {page} of {pageCount}</span>
            <button
              type="button"
              onClick={() => setPage((current) => current - 1)}
              disabled={page === 1}
              className="min-h-9 rounded-md border border-[#cdced1] px-3 font-medium text-[#131416] hover:bg-[#f4f6f8] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b6c80]"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => current + 1)}
              disabled={page === pageCount}
              className="min-h-9 rounded-md border border-[#cdced1] px-3 font-medium text-[#131416] hover:bg-[#f4f6f8] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b6c80]"
            >
              Next
            </button>
          </div>
        </nav>
      )}

      {draft.length > 0 && (
        <div className="border-t border-[#e8eaec] bg-[#f4f6f8] p-4 sm:p-5" aria-live="polite">
          <p className="font-semibold">Draft ready for review <span className="text-sm font-normal text-[#45484a]">· local preview, not submitted</span></p>
          <ul className="mt-2 divide-y divide-[#e8eaec]">
            {draft.map((d) => (
              <li key={key(d)} className="flex flex-wrap justify-between gap-2 py-2 text-sm">
                <span><span className="font-mono">{d.materialNo}</span> · {d.description}</span>
                <span className="tabular-nums">
                  {num.format(d.stock)} + {num.format(d.qty)} = <b>{num.format(d.stock + d.qty)}</b> {d.unit} (Max {num.format(d.maxQty)})
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
