"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { RefreshCw, Search } from "lucide-react";
import { pumpSkid as pumpSkidTemplate } from "@/templates/02-3d-asset-viewer/src/data/pumpSkid";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type DashboardTab = "monitor" | "pareto" | "actions";
type ModelType = "pump" | "compressor";
type Status = "critical" | "watch" | "ready";

type InventoryPart = {
  functionalLoc: string;
  materialNo: string;
  description: string;
  stock: number;
  minQty: number;
  maxQty: number;
  installedQty: number;
  unit: string;
  mrpType: string;
  criticality: string;
  reorderPoint: number;
  averageDailyDemand: number;
  safetyStock: number;
  daysOfCover: number | null;
  orderCap: number;
  recommendedQty: number;
};

type EquipmentRisk = {
  id: string;
  name: string;
  criticality: string;
  status: Status;
  atRiskParts: number;
  zeroStockParts: number;
  upcomingPlans: number;
  nextDueDate: string | null;
  nextMaintenance: string | null;
  parts: InventoryPart[];
};

type Recommendation = InventoryPart & {
  locationDescription: string;
  assetId: string;
  nextMaintenance: string | null;
  nextMaintenanceDate: string | null;
  reason: string;
};

type DashboardData = {
  generatedAt: string;
  coverage: {
    movementStart: string | null;
    movementThrough: string | null;
    demandWindowDays: number;
    planningLeadTimeDays: number | null;
    leadTimeBasis: string;
  };
  methodology: {
    reorderPoint: string;
    serviceLevel: string;
    orderQuantity: string;
    nonMoving: string;
    obsolete: string;
    supplierMetric: string;
    maintenance: string;
  };
  kpis: {
    skuCount: number;
    inventoryPositions: number;
    healthIndex: number | null;
    healthAtOrAboveMinimum: number;
    healthEligiblePositions: number;
    criticalZeroPositions: number;
    criticalZeroSkus: number;
    belowMinimumPositions: number;
    excessSkus: number;
    excessCapitalIdr: number;
    pricedExcessSkus: number;
    totalExcessSkus: number;
    nonMovingSkus: number;
    nonMovingPositions: number;
    obsoleteSkus: number | null;
    hasObsolescenceWindow: boolean;
    nonStockWithPhysicalSkus: number;
    nonStockWithPhysicalPositions: number;
    inventoryValueIdr: number;
    pricedInventorySkus: number;
    totalValuedSkus: number;
    pareto80SkuCount: number;
    paretoEligibleSkus: number;
    maintenancePlansDue90d: number;
    supplierPromiseRate: number | null;
    supplierEligibleLines: number;
  };
  issueTrend: Array<{
    month: string;
    postings: number;
    distinctMaterials: number;
  }>;
  maintenanceTrend: Array<{ month: string; plans: number }>;
  pareto: Array<{
    rank: number;
    materialNo: string;
    description: string;
    inventoryValueIdr: number;
    cumulativePercent: number;
    segment: "A" | "B" | "C";
  }>;
  paretoChart: Array<{
    rank: number;
    materialNo: string;
    description: string;
    inventoryValueIdr: number;
    cumulativePercent: number;
    segment: "A" | "B" | "C";
  }>;
  segmentation: { A: number; B: number; C: number };
  assets: EquipmentRisk[];
  recommendations: Recommendation[];
};

type Asset3DViewProps = {
  asset: typeof pumpSkid;
  readings: Record<string, Record<string, number>>;
  running: boolean;
  height: string;
  defaultShowLabels?: boolean;
  legend?: boolean;
};

type XRayViewerProps = {
  faults: Record<string, { value: string }>;
  rpm: number;
  height: string;
  showHint: boolean;
};

const pumpSkid = {
  ...pumpSkidTemplate,
  name: "Pump skid reference",
  subtitle: "Representative geometry · no live sensor feed",
  parts: pumpSkidTemplate.parts.map((part) => ({ ...part, sensors: [] })),
};

const Asset3DView = dynamic<Asset3DViewProps>(
  () =>
    import("@/templates/02-3d-asset-viewer/src/features/asset-3d/Asset3DView").then(
      (module) => ({
        default: module.default as ComponentType<Asset3DViewProps>,
      })
    ),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full place-items-center text-sm text-[#5d5f60]">
        Loading reference model…
      </div>
    ),
  }
);

const XRayViewer = dynamic<XRayViewerProps>(
  () =>
    import("@/templates/04-xray-asset-view/src/features/xray/XRayViewer").then(
      (module) => ({
        default: module.default as ComponentType<XRayViewerProps>,
      })
    ),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full place-items-center text-sm text-[#5d5f60]">
        Loading reference model…
      </div>
    ),
  }
);

type DraftLine = {
  key: string;
  materialNo: string;
  description: string;
  functionalLoc: string;
  quantity: number;
  unit: string;
  maxStock: number;
  currentStock: number;
};

const numberFormat = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
});
const integerFormat = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});
const currencyFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDashboardData(value: unknown): value is DashboardData {
  return (
    isRecord(value) &&
    isRecord(value.kpis) &&
    isRecord(value.coverage) &&
    Array.isArray(value.issueTrend) &&
    Array.isArray(value.maintenanceTrend) &&
    Array.isArray(value.pareto) &&
    Array.isArray(value.paretoChart) &&
    isRecord(value.segmentation) &&
    Array.isArray(value.assets) &&
    Array.isArray(value.recommendations)
  );
}

function formatNumber(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value)
    ? numberFormat.format(value)
    : "—";
}

function formatCount(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value)
    ? integerFormat.format(value)
    : "—";
}

function formatCurrency(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value)
    ? currencyFormat.format(value)
    : "Not available";
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "No scheduled date";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatMonth(value: string): string {
  const [year, month] = value.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return new Intl.DateTimeFormat("en-US", { month: "short" }).format(date);
}

function StatusTag({ status }: { status: Status }) {
  const classes: Record<Status, string> = {
    critical: "bg-[#ffedea] text-[#831c1e]",
    watch: "bg-[#fffbeb] text-[#92400e]",
    ready: "bg-[#dcfae5] text-[#14532d]",
  };

  const labels: Record<Status, string> = {
    critical: "Zero part before work",
    watch: "Below reorder point",
    ready: "At policy",
  };

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${classes[status]}`}>
      {labels[status]}
    </span>
  );
}

function LoadingPanel() {
  return (
    <div className="space-y-6" aria-label="Loading inventory data">
      <div className="h-7 w-56 rounded bg-[#ebedee]" />
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className="h-28 rounded-lg border border-[#e8eaec] bg-white p-4"
          >
            <div className="h-4 w-28 rounded bg-[#ebedee]" />
            <div className="mt-5 h-7 w-20 rounded bg-[#ebedee]" />
          </div>
        ))}
      </div>
      <div className="h-64 rounded-lg border border-[#e8eaec] bg-white" />
    </div>
  );
}

export function OverviewContent() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<DashboardTab>("monitor");
  const [selectedAssetId, setSelectedAssetId] = useState("BF-112");
  const [selectedModel, setSelectedModel] = useState<ModelType>("pump");
  const [search, setSearch] = useState("");
  const [selectedRecommendations, setSelectedRecommendations] = useState<
    Set<string>
  >(() => new Set());
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [draftLines, setDraftLines] = useState<DraftLine[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    void fetch("/api/inventory/dashboard", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload: unknown = await response.json();
        if (!response.ok) {
          const message =
            isRecord(payload) && typeof payload.error === "string"
              ? payload.error
              : `Inventory request failed (${response.status}).`;
          throw new Error(message);
        }
        if (!isDashboardData(payload)) {
          throw new Error("The inventory API returned an unexpected response.");
        }
        setData(payload);
        setError(null);
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load inventory data."
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [refreshKey]);

  const selectedAsset =
    data?.assets.find((asset) => asset.id === selectedAssetId) ??
    data?.assets[0] ??
    null;

  const filteredRecommendations = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!data || !query) return data?.recommendations ?? [];
    return data.recommendations.filter((item) =>
      [
        item.materialNo,
        item.description,
        item.functionalLoc,
        item.locationDescription,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [data, search]);

  const refresh = () => {
    setError(null);
    setLoading(true);
    setRefreshKey((value) => value + 1);
  };

  const recommendationKey = (item: Recommendation) =>
    `${item.functionalLoc}:${item.materialNo}`;
  const stageableCount =
    data?.recommendations.filter((item) => {
      const key = recommendationKey(item);
      return (
        selectedRecommendations.has(key) &&
        (quantities[key] ?? item.recommendedQty) > 0
      );
    }).length ?? 0;

  const setRecommendationSelected = (key: string, checked: boolean) => {
    setSelectedRecommendations((current) => {
      const next = new Set(current);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const stageDraft = () => {
    const nextLines = (data?.recommendations ?? [])
      .filter((item) => selectedRecommendations.has(recommendationKey(item)))
      .map((item) => {
        const quantity = Math.min(
          item.orderCap,
          Math.max(0, Math.floor(quantities[recommendationKey(item)] ?? item.recommendedQty))
        );
        return {
          key: recommendationKey(item),
          materialNo: item.materialNo,
          description: item.description,
          functionalLoc: item.functionalLoc,
          quantity,
          unit: item.unit,
          maxStock: item.maxQty,
          currentStock: item.stock,
        };
      })
      .filter((item) => item.quantity > 0);

    setDraftLines(nextLines);
  };

  if (loading && !data) return <LoadingPanel />;

  if (!data) {
    return (
      <section className="rounded-lg border border-[#e8eaec] p-5" role="alert">
        <p className="font-medium text-[#131416]">
          Inventory data could not be loaded.
        </p>
        <p className="mt-1 text-sm text-[#5d5f60]">
          {error ?? "The database request failed."}
        </p>
        <button
          type="button"
          onClick={refresh}
          className="mt-3 min-h-11 rounded-md border border-[#cdced1] px-3 text-sm font-medium text-[#131416] hover:bg-[#f4f6f8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b6c80]"
        >
          Retry
        </button>
      </section>
    );
  }

  const { kpis } = data;
  const issueThrough = data.coverage.movementThrough
    ? formatDate(data.coverage.movementThrough)
    : "No dated issues";
  const healthPercent =
    kpis.healthIndex === null ? null : Math.round(kpis.healthIndex * 100);

  return (
    <div className="space-y-6 text-[#131416]">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold leading-7">
            Inventory command dashboard
          </h1>
          <p className="mt-1 text-sm text-[#5d5f60]">
            Forecast · Optimize · Monitor · Recommend
            <span className="mx-2 text-[#cdced1]">/</span>
            Read-only database snapshot
          </p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs tabular-nums text-[#5d5f60]">
            Updated {new Intl.DateTimeFormat("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date(data.generatedAt))}
          </p>
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="inline-flex min-h-9 items-center gap-2 rounded-md border border-[#cdced1] px-3 text-sm font-medium hover:bg-[#f4f6f8] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b6c80]"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </section>

      {error && (
        <div
          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[#e8eaec] bg-[#fffbeb] px-3 py-2 text-sm text-[#92400e]"
          role="status"
        >
          <span>{error} Showing the last successfully loaded snapshot.</span>
          <button
            type="button"
            onClick={refresh}
            className="min-h-9 font-medium underline underline-offset-2"
          >
            Retry
          </button>
        </div>
      )}

      <nav
        role="tablist"
        className="flex gap-6 overflow-x-auto border-b border-[#e8eaec]"
        aria-label="Inventory dashboard sections"
      >
        {(
          [
            ["monitor", "Monitor"],
            ["pareto", "Pareto & segmentation"],
            ["actions", "Replenishment"],
          ] as const
        ).map(([tab, label]) => (
          <button
            key={tab}
            type="button"
            role="tab"
            id={`inventory-tab-${tab}`}
            aria-controls={`inventory-panel-${tab}`}
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`min-h-11 shrink-0 border-b-2 px-1 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b6c80] ${
              activeTab === tab
                ? "border-[#1b6c80] text-[#131416]"
                : "border-transparent text-[#5d5f60] hover:text-[#131416]"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {activeTab === "monitor" && (
        <div
          id="inventory-panel-monitor"
          className="space-y-6"
          role="tabpanel"
          aria-labelledby="inventory-tab-monitor"
        >
          <section
            className="grid grid-cols-2 divide-x divide-y divide-[#e8eaec] rounded-lg border border-[#e8eaec] bg-white lg:grid-cols-5 lg:divide-y-0"
            aria-label="Inventory health indicators"
          >
            <div className="col-span-2 p-4 lg:col-span-1">
              <p className="text-sm text-[#5d5f60]">Stock policy health</p>
              <p className="mt-1 text-[28px] font-medium leading-9 tabular-nums">
                {healthPercent === null ? "—" : `${healthPercent}%`}
              </p>
              <p className="mt-1 text-xs leading-5 text-[#5d5f60]">
                {formatCount(kpis.healthAtOrAboveMinimum)} of{" "}
                {formatCount(kpis.healthEligiblePositions)} stock-item BOM positions at or above minimum
              </p>
              {healthPercent !== null && (
                <div
                  className="mt-2 h-1.5 overflow-hidden rounded bg-[#ebedee]"
                  role="img"
                  aria-label={`Stock policy health ${healthPercent} percent`}
                >
                  <div
                    className="h-full bg-[#1e7b4f]"
                    style={{ width: `${healthPercent}%` }}
                  />
                </div>
              )}
            </div>
            <KpiCell
              label="Critical zero-stock"
              value={formatCount(kpis.criticalZeroPositions)}
              detail="S/A stock-item BOM positions"
              tone="negative"
            />
            <KpiCell
              label="Above maximum"
              value={formatCount(kpis.excessSkus)}
              detail={`${formatCurrency(kpis.excessCapitalIdr)} estimated · ${formatCount(kpis.pricedExcessSkus)} of ${formatCount(kpis.totalExcessSkus)} excess SKUs priced`}
              tone="warning"
            />
            <KpiCell
              label="Non-moving · 12 months"
              value={formatCount(kpis.nonMovingSkus)}
              detail={
                kpis.hasObsolescenceWindow
                  ? `${formatCount(kpis.obsoleteSkus)} potentially obsolete · 24-month rule`
                  : "24-month obsolete test unavailable; history is shorter"
              }
              tone="neutral"
            />
            <KpiCell
              label="Non-stock with on-hand"
              value={formatCount(kpis.nonStockWithPhysicalSkus)}
              detail="Distinct non-stock SKUs with positive quantity"
              tone="neutral"
            />
          </section>

          <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.2fr)_minmax(390px,0.8fr)]">
            <Card className="gap-0 rounded-lg border-[#e8eaec] py-0 shadow-none">
              <CardHeader className="gap-1 px-5 py-4">
                <CardTitle className="text-base font-semibold">
                  Equipment risk & linked BOM
                </CardTitle>
                <p className="text-sm text-[#5d5f60]">
                  Select a real functional-location group to inspect stock status and upcoming work.
                </p>
              </CardHeader>
              <CardContent className="space-y-4 px-5 pb-5">
                {selectedAsset ? (
                  <>
                    <div className="max-h-48 divide-y divide-[#f0f1f2] overflow-y-auto border-y border-[#f0f1f2]">
                      {data.assets.map((asset) => (
                        <button
                          key={asset.id}
                          type="button"
                          aria-pressed={selectedAsset.id === asset.id}
                          onClick={() => setSelectedAssetId(asset.id)}
                          className={`grid min-h-12 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-2 text-left focus-visible:outline-2 focus-visible:outline-[#1b6c80] ${
                            selectedAsset.id === asset.id
                              ? "bg-[#f4f6f8]"
                              : "hover:bg-[#f9fbfc]"
                          }`}
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium">
                              {asset.name}
                            </span>
                            <span className="font-mono text-xs text-[#5d5f60]">
                              {asset.id} · Criticality {asset.criticality || "—"}
                            </span>
                          </span>
                          <span className="flex flex-col items-end gap-1">
                            <StatusTag status={asset.status} />
                            <span className="text-xs tabular-nums text-[#5d5f60]">
                              {asset.upcomingPlans} plan{asset.upcomingPlans === 1 ? "" : "s"} due
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold">{selectedAsset.name}</h3>
                        <p className="mt-1 font-mono text-xs text-[#5d5f60]">
                          {selectedAsset.id}
                        </p>
                      </div>
                      <StatusTag status={selectedAsset.status} />
                    </div>
                    <div className="grid grid-cols-3 gap-3 rounded-md bg-[#f4f6f8] p-3 text-sm">
                      <div>
                        <p className="text-xs text-[#5d5f60]">At-risk parts</p>
                        <p className="mt-1 font-medium tabular-nums">
                          {formatCount(selectedAsset.atRiskParts)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#5d5f60]">Critical at zero</p>
                        <p className="mt-1 font-medium tabular-nums">
                          {formatCount(selectedAsset.zeroStockParts)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#5d5f60]">Next plan</p>
                        <p className="mt-1 truncate font-medium">
                          {selectedAsset.nextDueDate
                            ? formatDate(selectedAsset.nextDueDate)
                            : "None in 90d"}
                        </p>
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                        <h3 className="text-sm font-semibold">Parts at this equipment</h3>
                        <span className="text-xs text-[#5d5f60]">
                          {selectedAsset.nextMaintenance
                            ? `${selectedAsset.nextMaintenance} · ${formatDate(selectedAsset.nextDueDate)}`
                            : "No scheduled work within 90 days"}
                        </span>
                      </div>
                      <div className="divide-y divide-[#f0f1f2] border-y border-[#f0f1f2]">
                        {selectedAsset.parts.slice(0, 6).map((part) => (
                          <div
                            key={`${part.functionalLoc}-${part.materialNo}`}
                            className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 py-2"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {part.description || "Unnamed material"}
                              </p>
                              <p className="font-mono text-xs text-[#5d5f60]">
                                {part.materialNo} · {part.functionalLoc}
                              </p>
                            </div>
                            <div className="text-right text-xs tabular-nums">
                              <p>
                                {formatNumber(part.stock)} / {formatNumber(part.minQty)} min
                              </p>
                              <p
                                className={
                                  part.stock <= 0
                                      && ["S", "A"].includes(part.criticality)
                                      && selectedAsset.upcomingPlans > 0
                                      ? "text-[#c4242a]"
                                      : part.stock <= part.reorderPoint
                                      ? "text-[#92400e]"
                                      : "text-[#1e7b4f]"
                                }
                              >
                                Max {formatNumber(part.maxQty)} {part.unit}
                              </p>
                            </div>
                          </div>
                        ))}
                        {selectedAsset.parts.length === 0 && (
                          <p className="py-3 text-sm text-[#5d5f60]">
                            No stock-item BOM parts are linked to this location.
                          </p>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-[#5d5f60]">
                        Downtime duration is not recorded in the source data; scheduled-work exposure is shown instead.
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="py-6 text-sm text-[#5d5f60]">
                    No equipment risk records match the current inventory data.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="gap-0 rounded-lg border-[#e8eaec] py-0 shadow-none">
              <CardHeader className="gap-1 px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base font-semibold">
                    3D asset references
                  </CardTitle>
                  <div className="flex gap-1" aria-label="Reference model">
                    {(
                      [
                        ["pump", "Pump skid"],
                        ["compressor", "Compressor X-Ray"],
                      ] as const
                    ).map(([model, label]) => (
                      <button
                        key={model}
                        type="button"
                        aria-pressed={selectedModel === model}
                        onClick={() => setSelectedModel(model)}
                        className={`min-h-8 rounded px-2 text-xs font-medium focus-visible:outline-2 focus-visible:outline-[#1b6c80] ${
                          selectedModel === model
                            ? "bg-[#ebedee] text-[#131416]"
                            : "text-[#5d5f60] hover:bg-[#f4f6f8]"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-[#5d5f60]">
                  Interactive reference geometry, not an as-built model or live sensor feed.
                </p>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <div className="h-[240px] overflow-hidden rounded-md bg-[#f4f6f8] sm:h-[310px]">
                  {selectedModel === "pump" ? (
                    <Asset3DView
                      asset={pumpSkid}
                      readings={{}}
                      running={false}
                      height="100%"
                      defaultShowLabels={false}
                      legend={false}
                    />
                  ) : (
                    <XRayViewer
                      faults={{}}
                      rpm={0}
                      height="100%"
                      showHint={false}
                    />
                  )}
                </div>
                <p className="px-2 pt-2 text-xs leading-5 text-[#5d5f60]">
                  Risk colors apply to the linked BOM list; the reference model is not colored from plant data.
                </p>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
            <Card className="gap-0 rounded-lg border-[#e8eaec] py-0 shadow-none">
              <CardHeader className="gap-1 px-5 py-4">
                <CardTitle className="text-base font-semibold">
                  Issue activity
                </CardTitle>
                <p className="text-sm text-[#5d5f60]">
                  Monthly ISSUE postings · complete months · data through {issueThrough}
                </p>
              </CardHeader>
              <CardContent className="px-3 pb-4">
                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.issueTrend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="issueFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#1b6c80" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="#1b6c80" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="#e8eaec" />
                      <XAxis
                        dataKey="month"
                        tickFormatter={formatMonth}
                        tick={{ fill: "#5d5f60", fontSize: 12 }}
                        axisLine={{ stroke: "#e8eaec" }}
                        tickLine={false}
                      />
                      <YAxis
                        width={44}
                        tick={{ fill: "#5d5f60", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          border: "1px solid #e8eaec",
                          borderRadius: 6,
                          fontSize: 12,
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="postings"
                        name="Issue postings"
                        stroke="#1b6c80"
                        strokeWidth={2}
                        fill="url(#issueFill)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <p className="px-2 text-xs text-[#5d5f60]">
                  Counts postings rather than summing unlike units (EA, kg, and others).
                </p>
              </CardContent>
            </Card>

            <Card className="gap-0 rounded-lg border-[#e8eaec] py-0 shadow-none">
              <CardHeader className="gap-1 px-5 py-4">
                <CardTitle className="text-base font-semibold">
                  Maintenance plan outlook
                </CardTitle>
                <p className="text-sm text-[#5d5f60]">
                  {formatCount(kpis.maintenancePlansDue90d)} distinct plan items estimated within 90 days
                </p>
              </CardHeader>
              <CardContent className="px-3 pb-4">
                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.maintenanceTrend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="#e8eaec" />
                      <XAxis
                        dataKey="month"
                        tickFormatter={formatMonth}
                        tick={{ fill: "#5d5f60", fontSize: 12 }}
                        axisLine={{ stroke: "#e8eaec" }}
                        tickLine={false}
                      />
                      <YAxis
                        width={44}
                        tick={{ fill: "#5d5f60", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          border: "1px solid #e8eaec",
                          borderRadius: 6,
                          fontSize: 12,
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="plans"
                        name="Estimated plan occurrences"
                        stroke="#2f70bb"
                        strokeWidth={2}
                        fill="#2f70bb"
                        fillOpacity={0.12}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <p className="px-2 text-xs leading-5 text-[#5d5f60]">
                  Recurring dates are estimated from plan start and cycle. BOM installed quantities are not assumed to be replacement demand.
                </p>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
            <Card className="gap-0 rounded-lg border-[#e8eaec] py-0 shadow-none">
              <CardHeader className="gap-1 px-5 py-4">
                <CardTitle className="text-base font-semibold">
                  Supplier promise performance
                </CardTitle>
                <p className="text-sm text-[#5d5f60]">
                  PO promised date on or before the PR requested date
                </p>
              </CardHeader>
              <CardContent className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-5 pb-5">
                <p className="text-[28px] font-medium leading-9 tabular-nums">
                  {kpis.supplierPromiseRate === null
                    ? "—"
                    : `${Math.round(kpis.supplierPromiseRate * 100)}%`}
                </p>
                <p className="text-sm text-[#5d5f60]">
                  {formatCount(kpis.supplierEligibleLines)} dated PR/PO lines
                </p>
                <p className="basis-full text-xs leading-5 text-[#5d5f60]">
                  Promise-date attainment proxy, not actual supplier OTD: goods-receipt dates are not available in this database.
                </p>
              </CardContent>
            </Card>

            <Card className="gap-0 rounded-lg border-[#e8eaec] py-0 shadow-none">
              <CardHeader className="gap-1 px-5 py-4">
                <CardTitle className="text-base font-semibold">
                  Forecast inputs
                </CardTitle>
                <p className="text-sm text-[#5d5f60]">
                  Data quality and coverage used by this snapshot
                </p>
              </CardHeader>
              <CardContent className="space-y-2 px-5 pb-5 text-sm">
                <FactRow
                  label="Issue history"
                  value={`${formatDate(data.coverage.movementStart)} – ${issueThrough}`}
                />
                <FactRow
                  label="Planning lead time"
                  value={
                    data.coverage.planningLeadTimeDays === null
                      ? "Unavailable"
                      : `${formatNumber(data.coverage.planningLeadTimeDays)} days (median proxy)`
                  }
                />
                <FactRow
                  label="Obsolete rule"
                  value={
                    kpis.hasObsolescenceWindow
                      ? "24 months measurable"
                      : "24 months not covered"
                  }
                />
              </CardContent>
            </Card>
          </section>
        </div>
      )}

      {activeTab === "pareto" && (
        <div
          id="inventory-panel-pareto"
          className="space-y-6"
          role="tabpanel"
          aria-labelledby="inventory-tab-pareto"
        >
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryMetric
              label="SKUs to reach 80% of valued stock"
              value={formatCount(kpis.pareto80SkuCount)}
              detail={`of ${formatCount(kpis.paretoEligibleSkus)} priced Stock Item SKUs`}
            />
            <SummaryMetric
              label="Estimated valued stock"
              value={formatCurrency(kpis.inventoryValueIdr)}
              detail="On-hand × latest linked IDR PO unit price"
            />
            <SummaryMetric
              label="Over-max capital estimate"
              value={formatCurrency(kpis.excessCapitalIdr)}
              detail={`${formatCount(kpis.pricedExcessSkus)} of ${formatCount(kpis.totalExcessSkus)} excess SKUs priced`}
            />
            <SummaryMetric
              label="Price coverage"
              value={`${formatCount(kpis.pricedInventorySkus)} / ${formatCount(kpis.totalValuedSkus)}`}
              detail="Distinct Stock Item SKUs with IDR price / all"
            />
          </section>

          <Card className="gap-0 rounded-lg border-[#e8eaec] py-0 shadow-none">
            <CardHeader className="gap-1 px-5 py-4">
              <CardTitle className="text-base font-semibold">
                Pareto · estimated inventory value
              </CardTitle>
              <p className="text-sm text-[#5d5f60]">
                Ranked by on-hand quantity × latest linked IDR purchase price; cumulative line marks the 80% threshold.
              </p>
            </CardHeader>
            <CardContent className="px-3 pb-5">
              {data.pareto.length > 0 ? (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={data.paretoChart}
                      margin={{ top: 8, right: 18, left: 4, bottom: 0 }}
                    >
                      <CartesianGrid vertical={false} stroke="#e8eaec" />
                      <XAxis
                        dataKey="rank"
                        tick={{ fill: "#5d5f60", fontSize: 11 }}
                        axisLine={{ stroke: "#e8eaec" }}
                        tickLine={false}
                      />
                      <YAxis
                        yAxisId="value"
                        width={56}
                        tick={{ fill: "#5d5f60", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value: number) =>
                          `${Math.round(value / 1_000_000)}M`
                        }
                      />
                      <YAxis
                        yAxisId="percent"
                        orientation="right"
                        width={42}
                        domain={[0, 100]}
                        tick={{ fill: "#5d5f60", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value: number) => `${value}%`}
                      />
                      <ReferenceLine
                        yAxisId="percent"
                        y={80}
                        stroke="#a86f0c"
                        strokeDasharray="4 4"
                      />
                      <Tooltip
                        contentStyle={{
                          border: "1px solid #e8eaec",
                          borderRadius: 6,
                          fontSize: 12,
                        }}
                        formatter={(value, name) => [
                          String(name).includes("Cumulative")
                            ? `${formatNumber(Number(value))}%`
                            : formatCurrency(Number(value)),
                          String(name),
                        ]}
                        labelFormatter={(_, payload) =>
                          payload?.[0]?.payload
                            ? `${payload[0].payload.materialNo} · ${payload[0].payload.description}`
                            : ""
                        }
                      />
                      <Bar
                        yAxisId="value"
                        dataKey="inventoryValueIdr"
                        name="Estimated value"
                        fill="#1b6c80"
                        maxBarSize={24}
                      />
                      <Line
                        yAxisId="percent"
                        dataKey="cumulativePercent"
                        name="Cumulative value"
                        type="monotone"
                        stroke="#a86f0c"
                        strokeWidth={2}
                        dot={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="rounded-md border border-dashed border-[#cdced1] p-4 text-sm text-[#5d5f60]">
                  No Stock Item SKUs have a usable IDR purchase price for Pareto analysis.
                </p>
              )}
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {(["A", "B", "C"] as const).map((segment) => {
                  const descriptions = {
                    A: "First 80% of cumulative value",
                    B: "Next 15% of cumulative value",
                    C: "Remaining 5% of cumulative value",
                  };
                  return (
                    <div
                      key={segment}
                      className="flex items-baseline justify-between gap-2 border-t border-[#e8eaec] pt-3"
                    >
                      <div>
                        <p className="font-medium">Class {segment}</p>
                        <p className="text-xs text-[#5d5f60]">
                          {descriptions[segment]}
                        </p>
                      </div>
                      <span className="tabular-nums">
                        {formatCount(data.segmentation[segment])} SKUs
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="gap-0 rounded-lg border-[#e8eaec] py-0 shadow-none">
            <CardHeader className="gap-1 px-5 py-4">
              <CardTitle className="text-base font-semibold">
                Highest-value stock items
              </CardTitle>
              <p className="text-sm text-[#5d5f60]">
                Estimated IDR value; unpriced SKUs are excluded from this ranking.
              </p>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <div className="divide-y divide-[#f0f1f2] border-y border-[#f0f1f2]">
                {data.pareto.slice(0, 10).map((item) => (
                  <div
                    key={item.materialNo}
                    className="grid grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-3 py-3"
                  >
                    <span className="text-sm tabular-nums text-[#5d5f60]">
                      {item.rank}.
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {item.description}
                      </p>
                      <p className="font-mono text-xs text-[#5d5f60]">
                        {item.materialNo} · Class {item.segment}
                      </p>
                    </div>
                    <p className="text-right text-sm tabular-nums">
                      {formatCurrency(item.inventoryValueIdr)}
                    </p>
                  </div>
                ))}
                {data.pareto.length === 0 && (
                  <p className="py-4 text-sm text-[#5d5f60]">
                    No priced Stock Item SKUs are available.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <p className="text-xs leading-5 text-[#5d5f60]">
            Each material is valued once using the maximum repeated BOM on-hand quantity to avoid double-counting stock across locations. Values use the latest linked IDR PO amount divided by PR quantity; other currencies and missing prices are excluded. The database does not provide a current valuation ledger.
          </p>
        </div>
      )}

      {activeTab === "actions" && (
        <div
          id="inventory-panel-actions"
          className="space-y-6"
          role="tabpanel"
          aria-labelledby="inventory-tab-actions"
        >
          <section className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Replenishment review</h2>
              <p className="mt-1 text-sm text-[#5d5f60]">
                Explainable reorder proposals capped at each BOM maximum. Nothing is submitted to a control system.
              </p>
            </div>
            <label className="relative block w-full sm:max-w-xs">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5d5f60]"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search material or location"
                aria-label="Search recommendations"
                className="min-h-10 w-full rounded-md border border-[#cdced1] bg-white pl-9 pr-3 text-sm placeholder:text-[#5d5f60] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b6c80]"
              />
            </label>
          </section>

          <Card className="gap-0 rounded-lg border-[#e8eaec] py-0 shadow-none">
            <CardHeader className="gap-2 border-b border-[#f0f1f2] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base font-semibold">
                  Below reorder point
                </CardTitle>
                <p className="mt-1 text-sm text-[#5d5f60]">
                  {formatCount(filteredRecommendations.length)} candidate BOM positions · Stock Item only
                </p>
              </div>
              <button
                type="button"
                onClick={stageDraft}
                disabled={stageableCount === 0}
                className="min-h-10 shrink-0 rounded-md bg-[#1b6c80] px-4 text-sm font-medium text-white hover:bg-[#155768] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b6c80]"
              >
                Stage {formatCount(stageableCount)} selected
              </button>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="divide-y divide-[#f0f1f2]">
                {filteredRecommendations.map((item) => {
                  const key = recommendationKey(item);
                  const quantity = quantities[key] ?? item.recommendedQty;
                  return (
                    <div
                      key={key}
                      className="grid gap-3 py-4 md:grid-cols-[auto_minmax(0,1fr)_minmax(200px,0.8fr)_minmax(112px,0.35fr)] md:items-center"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRecommendations.has(key)}
                        onChange={(event) =>
                          setRecommendationSelected(key, event.target.checked)
                        }
                        aria-label={`Select ${item.materialNo} for draft`}
                        className="h-4 w-4 accent-[#1b6c80] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b6c80]"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {item.description}
                        </p>
                        <p className="font-mono text-xs text-[#5d5f60]">
                          {item.materialNo} · {item.functionalLoc} · {item.criticality || "Unrated"}
                        </p>
                        <p className="mt-1 text-xs text-[#5d5f60]">
                          {item.reason}
                          {item.nextMaintenance
                            ? ` · ${item.nextMaintenance} ${formatDate(item.nextMaintenanceDate)}`
                            : ""}
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs tabular-nums md:text-sm">
                        <span>
                          On hand
                          <strong className="mt-1 block font-medium">
                            {formatNumber(item.stock)} {item.unit}
                          </strong>
                        </span>
                        <span>
                          ROP
                          <strong className="mt-1 block font-medium">
                            {formatNumber(item.reorderPoint)} {item.unit}
                          </strong>
                        </span>
                        <span>
                          Max
                          <strong className="mt-1 block font-medium">
                            {formatNumber(item.maxQty)} {item.unit}
                          </strong>
                        </span>
                      </div>
                      <label className="flex items-center justify-between gap-2 text-xs text-[#5d5f60]">
                        Draft qty
                        <input
                          type="number"
                          min={0}
                          max={item.orderCap}
                          step={1}
                          value={quantity}
                          onChange={(event) => {
                            const parsed = Number(event.target.value);
                            setQuantities((current) => ({
                              ...current,
                              [key]: Number.isFinite(parsed)
                                ? Math.min(
                                    item.orderCap,
                                    Math.max(0, Math.floor(parsed))
                                  )
                                : 0,
                            }));
                          }}
                          aria-label={`Draft quantity for ${item.materialNo}; maximum ${item.orderCap} ${item.unit}`}
                          className="h-10 w-24 rounded-md border border-[#cdced1] px-2 text-right text-sm tabular-nums text-[#131416] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b6c80]"
                        />
                      </label>
                    </div>
                  );
                })}
                {filteredRecommendations.length === 0 && (
                  <p className="py-6 text-sm text-[#5d5f60]">
                    {search
                      ? "No recommendations match this search."
                      : "No stock-item BOM positions currently fall below their reorder point and maximum-stock cap."}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {draftLines.length > 0 && (
            <section
              className="rounded-lg border border-[#e8eaec] bg-[#f4f6f8] p-4"
              aria-live="polite"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-semibold">Draft prepared for review</h3>
                <span className="text-xs text-[#5d5f60]">
                  Local preview only · not submitted
                </span>
              </div>
              <div className="mt-3 divide-y divide-[#e8eaec]">
                {draftLines.map((line) => (
                  <p
                    key={line.key}
                    className="flex flex-wrap justify-between gap-2 py-2 text-sm"
                  >
                    <span>
                      <span className="font-mono">{line.materialNo}</span>
                      {" · "}
                      {line.functionalLoc}
                    </span>
                    <span className="tabular-nums">
                      {formatNumber(line.currentStock)} + {formatNumber(line.quantity)}{" "}
                      {line.unit} ={" "}
                      {formatNumber(line.currentStock + line.quantity)} /{" "}
                      {formatNumber(line.maxStock)} max
                    </span>
                  </p>
                ))}
              </div>
            </section>
          )}

          <details className="rounded-lg border border-[#e8eaec] px-4 py-3">
            <summary className="cursor-pointer text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b6c80]">
              Reorder formula and limits
            </summary>
            <div className="mt-3 space-y-2 text-sm leading-6 text-[#5d5f60]">
              <p>
                {data.methodology.reorderPoint}.
              </p>
              <p>
                {data.methodology.serviceLevel}. The 1.65 × daily issue deviation × √lead-time term is safety stock. Lead time is the median PR-to-PO promised-date interval from valid 1–365 day records, not actual receipt lead time.
              </p>
              <p>
                {data.methodology.orderQuantity}. The input is capped at this value, so a staged order cannot take stock above the BOM maximum. {data.methodology.maintenance}.
              </p>
              <p>
                Source: {formatCount(kpis.inventoryPositions)} BOM positions,{" "}
                {formatCount(kpis.skuCount)} Stock Item SKUs, and issue history from{" "}
                {formatDate(data.coverage.movementStart)} through {issueThrough}.
              </p>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

function KpiCell({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: "negative" | "warning" | "neutral";
}) {
  const valueColor = {
    negative: "text-[#c4242a]",
    warning: "text-[#92400e]",
    neutral: "text-[#131416]",
  }[tone];

  return (
    <div className="min-w-0 p-4">
      <p className="text-sm text-[#5d5f60]">{label}</p>
      <p className={`mt-1 text-[28px] font-medium leading-9 tabular-nums ${valueColor}`}>
        {value}
      </p>
      <p className="mt-1 text-xs leading-5 text-[#5d5f60]">{detail}</p>
    </div>
  );
}

function SummaryMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-[#e8eaec] bg-white p-4">
      <p className="text-sm text-[#5d5f60]">{label}</p>
      <p className="mt-2 break-words text-xl font-medium leading-7 tabular-nums">
        {value}
      </p>
      <p className="mt-1 text-xs leading-5 text-[#5d5f60]">{detail}</p>
    </div>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 border-b border-[#f0f1f2] pb-2 last:border-0 last:pb-0">
      <span className="text-[#5d5f60]">{label}</span>
      <span className="text-right tabular-nums">{value}</span>
    </div>
  );
}
