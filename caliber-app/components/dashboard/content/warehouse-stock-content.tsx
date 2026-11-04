"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge, type Verdict } from "@/components/ui/status";

const PAGE_SIZE = 100;
const numberFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const countFormat = new Intl.NumberFormat("en-US");
const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

type WarehouseRow = {
  materialNo: string;
  description: string;
  unit: string;
  mrpType: string;
  criticality: string;
  stock: number;
  minQty: number;
  maxQty: number;
  lastIssue: string | null;
  issued12m: number;
  coverMonths: number | null;
  noIssue12m: boolean;
  slowMoving: boolean;
};

type WarehouseData = {
  asOf: string;
  page: number;
  pageSize: number;
  pages: number;
  total: number;
  summary: {
    totalMaterials: number;
    inStock: number;
    zeroStock: number;
    criticalZero: number;
  };
  rows: WarehouseRow[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isWarehouseRow(value: unknown): value is WarehouseRow {
  return (
    isRecord(value) &&
    typeof value.materialNo === "string" &&
    typeof value.description === "string" &&
    typeof value.unit === "string" &&
    typeof value.mrpType === "string" &&
    typeof value.criticality === "string" &&
    typeof value.stock === "number" &&
    typeof value.minQty === "number" &&
    typeof value.maxQty === "number" &&
    (value.lastIssue === null || typeof value.lastIssue === "string") &&
    typeof value.issued12m === "number" &&
    (value.coverMonths === null || typeof value.coverMonths === "number") &&
    typeof value.noIssue12m === "boolean" &&
    typeof value.slowMoving === "boolean"
  );
}

function isWarehouseData(value: unknown): value is WarehouseData {
  return (
    isRecord(value) &&
    typeof value.asOf === "string" &&
    typeof value.page === "number" &&
    typeof value.pageSize === "number" &&
    typeof value.pages === "number" &&
    typeof value.total === "number" &&
    isRecord(value.summary) &&
    typeof value.summary.totalMaterials === "number" &&
    typeof value.summary.inStock === "number" &&
    typeof value.summary.zeroStock === "number" &&
    typeof value.summary.criticalZero === "number" &&
    Array.isArray(value.rows) &&
    value.rows.every(isWarehouseRow)
  );
}

function formatNumber(value: number) {
  return numberFormat.format(value);
}

function formatDate(value: string | null) {
  return value ? dateFormat.format(new Date(`${value}T00:00:00Z`)) : "No recorded issue";
}

function movementLabel(row: WarehouseRow) {
  if (row.noIssue12m) return "No issue in 12 months";
  if (row.slowMoving) return "Slow-moving";
  return "Recent use";
}

function getStockStatus(row: WarehouseRow): { label: string; verdict: Verdict } {
  if (row.stock === 0) return { label: "Zero stock", verdict: "act" };
  if (row.mrpType === "NON STOCK") {
    return { label: "Non-stock on shelf", verdict: "watch" };
  }
  if (row.stock < row.minQty) return { label: "Below Min", verdict: "act" };
  if (Math.max(row.minQty, row.maxQty) > 0 && row.stock > Math.max(row.minQty, row.maxQty)) {
    return { label: "Above Max", verdict: "watch" };
  }
  if (row.maxQty === 0 && row.minQty === 0) {
    return { label: "No Min/Max", verdict: "watch" };
  }
  return { label: "In range", verdict: "ok" };
}

export function WarehouseStockContent({ initialFilter }: { initialFilter?: string }) {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [stockStatus, setStockStatus] = useState(
    initialFilter === "non-stock-onhand" ? "stocked" : ""
  );
  const [criticality, setCriticality] = useState("");
  const [movement, setMovement] = useState("");
  const [mrpType, setMrpType] = useState(
    initialFilter === "non-stock-onhand" ? "NON STOCK" : ""
  );
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<{
    key: string;
    data: WarehouseData | null;
    error: string | null;
  } | null>(null);

  const params = new URLSearchParams({ page: String(page) });
  if (search) params.set("q", search);
  if (stockStatus) params.set("stockStatus", stockStatus);
  if (criticality) params.set("criticality", criticality);
  if (movement) params.set("movement", movement);
  if (mrpType) params.set("mrpType", mrpType);
  const requestKey = params.toString();
  const data = result?.data ?? null;
  const loading = result?.key !== requestKey;
  const error = result?.key === requestKey ? result.error : null;

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(query.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/inventory/warehouse?${requestKey}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload: unknown = await response.json();
        if (!response.ok) {
          throw new Error(
            isRecord(payload) && typeof payload.error === "string"
              ? payload.error
              : `Unable to load warehouse stock (${response.status}).`
          );
        }
        if (!isWarehouseData(payload)) {
          throw new Error("The warehouse stock service returned an unexpected response.");
        }
        setResult({ key: requestKey, data: payload, error: null });
      })
      .catch((requestError) => {
        if (!controller.signal.aborted) {
          setResult((current) => ({
            key: requestKey,
            data: current?.data ?? null,
            error: requestError instanceof Error
              ? requestError.message
              : "Unable to load warehouse stock.",
          }));
        }
      });

    return () => controller.abort();
  }, [requestKey]);

  const hasFilters = Boolean(
    query.trim() || stockStatus || criticality || movement || mrpType
  );
  const metrics = [
    { label: "Materials", value: data?.summary.totalMaterials },
    { label: "With stock", value: data?.summary.inStock },
    { label: "Zero stock", value: data?.summary.zeroStock },
    { label: "Critical S/A at zero", value: data?.summary.criticalZero },
  ];

  function clearFilters() {
    setQuery("");
    setSearch("");
    setStockStatus("");
    setCriticality("");
    setMovement("");
    setMrpType("");
    setPage(1);
  }

  return (
    <div className="space-y-6 text-[#131416]">
      <PageHeader title="Warehouse Stock" />
      <p className="max-w-3xl text-sm leading-6 text-[#5d5f60]">
        Material-level quantities from the local inventory snapshot through{" "}
        {data ? formatDate(data.asOf) : "30 Sep 2026"}. The source has no warehouse-location field,
        so quantities cannot be split by warehouse.
      </p>

      <section
        className="grid grid-cols-2 gap-4 border-y border-[#e8eaec] py-4 sm:grid-cols-4"
        aria-label="Warehouse stock totals"
      >
        {metrics.map(({ label, value }) => (
          <div key={label} className="min-w-0">
            <p className="text-xs text-[#5d5f60]">{label}</p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-[#131416]">
              {typeof value === "number" ? countFormat.format(value) : "—"}
            </p>
          </div>
        ))}
      </section>

      <section className="space-y-3" aria-label="Warehouse stock filters">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1.5fr)_repeat(4,minmax(130px,1fr))]">
          <label className="relative sm:col-span-2 lg:col-span-1">
            <span className="sr-only">Search material number or description</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5d5f60]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Search material or description"
              className="h-9 w-full rounded-md border border-[#d1d5db] bg-white pl-9 pr-3 text-sm text-[#131416] placeholder:text-[#5d5f60] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b6c80]"
            />
          </label>

          <label>
            <span className="sr-only">Stock level</span>
            <select
              aria-label="Stock level"
              value={stockStatus}
              onChange={(event) => {
                setStockStatus(event.target.value);
                setPage(1);
              }}
              className="h-9 w-full rounded-md border border-[#d1d5db] bg-white px-2.5 text-sm text-[#131416] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b6c80]"
            >
              <option value="">All stock levels</option>
              <option value="stocked">With stock</option>
              <option value="zero">Zero stock</option>
              <option value="below_min">Below Min</option>
              <option value="in_range">Within Min/Max</option>
              <option value="above_max">Above Max</option>
            </select>
          </label>

          <label>
            <span className="sr-only">Criticality</span>
            <select
              aria-label="Criticality"
              value={criticality}
              onChange={(event) => {
                setCriticality(event.target.value);
                setPage(1);
              }}
              className="h-9 w-full rounded-md border border-[#d1d5db] bg-white px-2.5 text-sm text-[#131416] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b6c80]"
            >
              <option value="">All criticality</option>
              <option value="S">Criticality S</option>
              <option value="A">Criticality A</option>
              <option value="B">Criticality B</option>
              <option value="C">Criticality C</option>
            </select>
          </label>

          <label>
            <span className="sr-only">Movement</span>
            <select
              aria-label="Movement"
              value={movement}
              onChange={(event) => {
                setMovement(event.target.value);
                setPage(1);
              }}
              className="h-9 w-full rounded-md border border-[#d1d5db] bg-white px-2.5 text-sm text-[#131416] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b6c80]"
            >
              <option value="">All movement</option>
              <option value="slow">Slow-moving · over 12 months cover</option>
              <option value="no_issue">No issue in 12 months</option>
            </select>
          </label>

          <label>
            <span className="sr-only">MRP type</span>
            <select
              aria-label="MRP type"
              value={mrpType}
              onChange={(event) => {
                setMrpType(event.target.value);
                setPage(1);
              }}
              className="h-9 w-full rounded-md border border-[#d1d5db] bg-white px-2.5 text-sm text-[#131416] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b6c80]"
            >
              <option value="">All MRP types</option>
              <option value="STOCK ITEM">Stock item</option>
              <option value="NON STOCK">Non-stock item</option>
            </select>
          </label>
        </div>

        <div className="flex min-h-8 flex-wrap items-center justify-between gap-2 text-sm">
          <p aria-live="polite" className="text-[#5d5f60]">
            {loading
              ? "Updating material count…"
              : error
                ? "Material count unavailable"
                : data
              ? `${countFormat.format(data.total)} materials · ${PAGE_SIZE} per page`
              : "Loading material count"}
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded px-1 py-1 font-medium text-[#1b6c80] underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b6c80]"
            >
              Clear filters
            </button>
          )}
        </div>
      </section>

      {error && (
        <p
          role="alert"
          className="rounded-md border border-[#f1c7c4] bg-[#fff6f5] px-4 py-3 text-sm text-[#9b1c1f]"
        >
          {error}
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#e8eaec] text-left text-xs font-medium text-[#5d5f60]">
              <th scope="col" className="w-[55%] py-3 pr-2 font-medium md:w-[34%] lg:w-[26%] xl:w-[25%]">Material</th>
              <th scope="col" className="w-[45%] py-3 pl-2 text-right font-medium md:w-[14%] lg:w-[12%] xl:w-[10%]">On hand</th>
              <th scope="col" className="hidden py-3 px-2 text-right font-medium md:table-cell md:w-[22%] lg:w-[14%] xl:w-[10%]">Min / Max</th>
              <th scope="col" className="hidden py-3 px-2 text-right font-medium lg:table-cell lg:w-[12%] xl:w-[10%]">Issued · 12 mo</th>
              <th scope="col" className="hidden py-3 px-2 text-right font-medium lg:table-cell lg:w-[8%] xl:w-[8%]">Cover</th>
              <th scope="col" className="hidden py-3 px-2 font-medium xl:table-cell xl:w-[11%]">Last issue</th>
              <th scope="col" className="hidden py-3 px-2 font-medium xl:table-cell xl:w-[12%]">Movement</th>
              <th scope="col" className="hidden py-3 pl-2 font-medium md:table-cell md:w-[30%] lg:w-[16%] xl:w-[14%]">Stock status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-sm text-[#5d5f60]">
                  Loading warehouse stock…
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-sm text-[#5d5f60]">
                  Inventory rows are unavailable until the request succeeds.
                </td>
              </tr>
            ) : data?.rows.length ? (
              data.rows.map((row) => {
                const status = getStockStatus(row);
                return (
                  <tr
                    key={row.materialNo}
                    className="border-b border-[#f0f1f2] align-top last:border-b-0"
                  >
                    <th scope="row" className="py-3 pr-2 text-left font-normal">
                      <span className="block truncate font-medium text-[#131416]">
                        {row.materialNo}
                        <span className="font-normal text-[#5d5f60]"> · {row.description}</span>
                      </span>
                      <span className="mt-1 hidden text-xs text-[#5d5f60] md:block">
                        Criticality {row.criticality} · {row.mrpType}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-[#5d5f60] md:hidden">
                        Criticality {row.criticality} · {row.mrpType} · Min{" "}
                        {formatNumber(row.minQty)} / Max {formatNumber(row.maxQty)} {row.unit} ·
                        {" "}Issued {formatNumber(row.issued12m)} {row.unit} · Cover{" "}
                        {row.coverMonths === null ? "—" : `${formatNumber(row.coverMonths)} mo`} ·
                        {" "}Last issue {formatDate(row.lastIssue)} · {movementLabel(row)}
                      </span>
                    </th>
                    <td className="py-3 pl-2 text-right align-top tabular-nums">
                      <span className="whitespace-nowrap">
                        {formatNumber(row.stock)} <span className="text-[#5d5f60]">{row.unit}</span>
                      </span>
                      <span className="mt-1 block md:hidden">
                        <StatusBadge verdict={status.verdict}>{status.label}</StatusBadge>
                      </span>
                    </td>
                    <td className="hidden whitespace-nowrap py-3 px-2 text-right tabular-nums md:table-cell">
                      {formatNumber(row.minQty)} / {formatNumber(row.maxQty)}{" "}
                      <span className="text-[#5d5f60]">{row.unit}</span>
                    </td>
                    <td className="hidden whitespace-nowrap py-3 px-2 text-right tabular-nums lg:table-cell">
                      {formatNumber(row.issued12m)}{" "}
                      <span className="text-[#5d5f60]">{row.unit}</span>
                    </td>
                    <td className="hidden whitespace-nowrap py-3 px-2 text-right tabular-nums lg:table-cell">
                      {row.coverMonths === null
                        ? "—"
                        : `${formatNumber(row.coverMonths)} mo`}
                    </td>
                    <td className="hidden whitespace-nowrap py-3 px-2 text-[#5d5f60] xl:table-cell">
                      {formatDate(row.lastIssue)}
                    </td>
                    <td className="hidden whitespace-nowrap py-3 px-2 text-[#5d5f60] xl:table-cell">
                      {movementLabel(row)}
                    </td>
                    <td className="hidden whitespace-nowrap py-3 pl-2 md:table-cell">
                      <StatusBadge verdict={status.verdict}>{status.label}</StatusBadge>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="py-10 text-center">
                  <p className="font-medium text-[#131416]">No materials match these filters</p>
                  <p className="mt-1 text-sm text-[#5d5f60]">Try a different search or clear the filters.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <nav
        aria-label="Warehouse stock pages"
        className="flex items-center justify-between border-t border-[#e8eaec] pt-4"
      >
        <p className="text-sm text-[#5d5f60]">
          {loading
            ? "Loading results…"
            : error
              ? "Results unavailable"
              : data
            ? data.total === 0
              ? "No materials"
              : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(
                  page * PAGE_SIZE,
                  data.total
                )} of ${countFormat.format(data.total)}`
            : "—"}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1 || loading || !data || Boolean(error)}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="inline-flex h-9 items-center gap-1 rounded-md border border-[#d1d5db] px-3 text-sm font-medium hover:bg-[#f3f6f7] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b6c80]"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Previous
          </button>
          <span className="min-w-20 text-center text-sm tabular-nums text-[#5d5f60]">
            Page {loading || error ? "—" : data?.page ?? page} of{" "}
            {loading || error ? "—" : data?.pages ?? "—"}
          </span>
          <button
            type="button"
            disabled={!data || page >= data.pages || loading || Boolean(error)}
            onClick={() => setPage((current) => current + 1)}
            className="inline-flex h-9 items-center gap-1 rounded-md border border-[#d1d5db] px-3 text-sm font-medium hover:bg-[#f3f6f7] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b6c80]"
          >
            Next
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </nav>
    </div>
  );
}
