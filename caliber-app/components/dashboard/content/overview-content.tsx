"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
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
import { RefreshCw } from "lucide-react";
import type { Navigate } from "@/app/page";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusBadge } from "@/components/ui/status";
import type { PlantAsset } from "@/components/dashboard/plant-3d/faults";
import { InfoTip } from "@/components/ui/info-tip";
import { InventoryHealth } from "@/components/dashboard/inventory-health";
import type { InfoId } from "@/lib/info-copy";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type DashboardTab = "monitor" | "health" | "pareto";
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
  plantAssets?: PlantAsset[];
  recommendations: Recommendation[];
};

const PlantTwin = dynamic(() => import("@/components/dashboard/plant-3d/plant-twin"), {
  ssr: false,
  loading: () => (
    <div className="grid h-[420px] place-items-center rounded-lg bg-[#0e1419] text-sm text-white/60 sm:h-[560px]">
      Loading plant model…
    </div>
  ),
});

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
  if (status === "critical") return <StatusBadge verdict="act">Part missing before planned work</StatusBadge>;
  if (status === "watch") return <StatusBadge verdict="watch">Below reorder level</StatusBadge>;
  return <StatusBadge verdict="ok">Enough stock</StatusBadge>;
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

export function OverviewContent({ initialTab, onNavigate }: { initialTab?: string; onNavigate?: Navigate } = {}) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<DashboardTab>(
    initialTab === "health" || initialTab === "pareto" ? initialTab : "monitor"
  );
  const [selectedAssetId, setSelectedAssetId] = useState("BF-112");
  const [plantTag, setPlantTag] = useState<string | null>(null);

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

  // Opening equipment in 3D also selects it in the equipment risk list below.
  const openPlantTag = useCallback(
    (tag: string | null) => {
      setPlantTag(tag);
      if (tag && data?.assets.some((asset) => asset.id === tag)) {
        setSelectedAssetId(tag);
      }
    },
    [data]
  );

  const refresh = () => {
    setError(null);
    setLoading(true);
    setRefreshKey((value) => value + 1);
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
      <PageHeader
        step={1}
        title="What is happening to our spare parts right now?"
        subtitle="Five health checks, a 3D map of where the risk sits in the plant, and the stock that is overstocked, slow or dead."
        right={
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
        }
      />

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

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5" aria-label="Spare-part health checks">
        <MetricCard
          label="Parts with enough stock"
          info="overview.kpi.health"
          value={healthPercent === null ? "—" : `${healthPercent}%`}
          verdict={healthPercent === null || healthPercent >= 90 ? "ok" : healthPercent >= 70 ? "watch" : "act"}
          verdictLabel={healthPercent !== null && healthPercent < 70 ? "Too low" : undefined}
          meaning={<>{formatCount(kpis.healthAtOrAboveMinimum)} of {formatCount(kpis.healthEligiblePositions)} stocked part positions are at or above their minimum. The rest may run out before a new order arrives. Target: 90% or more.</>}
          action={onNavigate && { label: "See reorder list", onClick: () => onNavigate({ section: "act", tab: "reorder" }) }}
        />
        <MetricCard
          label="Critical parts out of stock"
          info="overview.kpi.criticalZero"
          value={formatCount(kpis.criticalZeroPositions)}
          verdict={kpis.criticalZeroPositions > 0 ? "act" : "ok"}
          meaning="Parts on critical (S/A) equipment with zero units. If that equipment fails, the job waits for the supplier. Target: 0."
          action={onNavigate && { label: "Review & reorder", onClick: () => onNavigate({ section: "act", tab: "reorder" }) }}
        />
        <MetricCard
          label="Overstocked parts"
          info="overview.kpi.aboveMax"
          value={formatCount(kpis.excessSkus)}
          verdict={kpis.excessSkus > 0 ? "watch" : "ok"}
          meaning={<>{formatCurrency(kpis.excessCapitalIdr)} of cash sits above the agreed Max. Stop buying these and move the surplus where it is needed.</>}
          action={{ label: "See stop-buy list", onClick: () => setActiveTab("health") }}
        />
        <MetricCard
          label="Parts unused for 12 months"
          info="overview.kpi.nonMoving"
          value={formatCount(kpis.nonMovingSkus)}
          verdict={kpis.nonMovingSkus > 0 ? "watch" : "ok"}
          meaning="Nobody took these out of the warehouse for a year. Candidates to redeploy, return or write off, unless they are critical insurance spares."
          action={{ label: "See dead stock", onClick: () => setActiveTab("health") }}
        />
        <MetricCard
          label="Unplanned stock on the shelf"
          info="overview.kpi.nonStock"
          value={formatCount(kpis.nonStockWithPhysicalSkus)}
          verdict={kpis.nonStockWithPhysicalSkus > 0 ? "watch" : "ok"}
          meaning="Parts set to 'buy when needed' that still sit in the warehouse. The system does not plan them, so they get forgotten or bought twice."
          action={{ label: "Review list", onClick: () => setActiveTab("health") }}
        />
      </section>

      <section className="space-y-3" aria-label="3D plant view">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-1">
            <h2 className="text-lg font-semibold">Where in the plant is the risk?</h2>
            <p className="text-sm text-[#5d5f60]">
              Click a tag to zoom · X-Ray shows the missing part
            </p>
          </div>
          <InfoTip id="overview.plant" className="-mt-1" />
        </div>
        <PlantTwin
          assets={data.plantAssets ?? []}
          selectedTag={plantTag}
          onSelect={openPlantTag}
        />
      </section>

      <nav
        role="tablist"
        className="flex gap-6 overflow-x-auto border-b border-[#e8eaec]"
        aria-label="Inventory dashboard sections"
      >
        {(
          [
            ["monitor", "Which equipment is at risk?"],
            ["health", "Overstocked, slow & dead stock"],
            ["pareto", "Where is the money?"],
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
          <section>
            <Card className="relative gap-0 rounded-lg border-[#e8eaec] py-0 shadow-none">
              <InfoTip id="overview.equipmentRisk" className="absolute right-3 top-3" />
              <CardHeader className="gap-1 px-5 py-4 pr-12">
                <CardTitle className="text-base font-semibold">
                  Equipment risk & linked BOM
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                {selectedAsset ? (
                  <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                    <div className="max-h-[440px] self-start divide-y divide-[#f0f1f2] overflow-y-auto border-y border-[#f0f1f2]">
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

                    <div className="min-w-0 space-y-4">
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
                            <div className="flex flex-col items-end gap-1 text-right text-xs tabular-nums">
                              <StatusBadge
                                verdict={
                                  part.stock <= 0 && ["S", "A"].includes(part.criticality)
                                    ? "act"
                                    : part.stock <= part.reorderPoint
                                      ? "watch"
                                      : "ok"
                                }
                              >
                                {formatNumber(part.stock)} {part.unit} on hand
                              </StatusBadge>
                              <p className="text-[#45484a]">
                                Min {formatNumber(part.minQty)} · Max {formatNumber(part.maxQty)}
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
                    </div>
                    </div>
                  </div>
                ) : (
                  <p className="py-6 text-sm text-[#5d5f60]">
                    No equipment risk records match the current inventory data.
                  </p>
                )}
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
            <Card className="relative gap-0 rounded-lg border-[#e8eaec] py-0 shadow-none">
              <InfoTip id="overview.issueActivity" className="absolute right-3 top-3" />
              <CardHeader className="gap-1 px-5 py-4 pr-12">
                <CardTitle className="text-base font-semibold">
                  Issue activity
                </CardTitle>
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
              </CardContent>
            </Card>

            <Card className="relative gap-0 rounded-lg border-[#e8eaec] py-0 shadow-none">
              <InfoTip id="overview.maintenanceOutlook" className="absolute right-3 top-3" />
              <CardHeader className="gap-1 px-5 py-4 pr-12">
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
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
            <Card className="relative gap-0 rounded-lg border-[#e8eaec] py-0 shadow-none">
              <InfoTip id="overview.supplierPromise" className="absolute right-3 top-3" />
              <CardHeader className="gap-1 px-5 py-4 pr-12">
                <CardTitle className="text-base font-semibold">
                  Supplier promise performance
                </CardTitle>
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
              </CardContent>
            </Card>

            <Card className="relative gap-0 rounded-lg border-[#e8eaec] py-0 shadow-none">
              <InfoTip id="overview.forecastInputs" className="absolute right-3 top-3" />
              <CardHeader className="gap-1 px-5 py-4 pr-12">
                <CardTitle className="text-base font-semibold">
                  Forecast inputs
                </CardTitle>
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

      {activeTab === "health" && (
        <div id="inventory-panel-health" role="tabpanel" aria-labelledby="inventory-tab-health">
          <InventoryHealth />
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
              info="overview.pareto.top80"
              value={formatCount(kpis.pareto80SkuCount)}
              detail={`of ${formatCount(kpis.paretoEligibleSkus)} priced Stock Item SKUs`}
            />
            <SummaryMetric
              label="Estimated valued stock"
              info="overview.pareto.value"
              value={formatCurrency(kpis.inventoryValueIdr)}
              detail="On-hand × latest linked IDR PO unit price"
            />
            <SummaryMetric
              label="Over-max capital estimate"
              info="overview.pareto.overMax"
              value={formatCurrency(kpis.excessCapitalIdr)}
              detail={`${formatCount(kpis.pricedExcessSkus)} of ${formatCount(kpis.totalExcessSkus)} excess SKUs priced`}
            />
            <SummaryMetric
              label="Price coverage"
              info="overview.pareto.coverage"
              value={`${formatCount(kpis.pricedInventorySkus)} / ${formatCount(kpis.totalValuedSkus)}`}
              detail="Distinct Stock Item SKUs with IDR price / all"
            />
          </section>

          <Card className="relative gap-0 rounded-lg border-[#e8eaec] py-0 shadow-none">
            <InfoTip id="overview.pareto.chart" className="absolute right-3 top-3" />
            <CardHeader className="gap-1 px-5 py-4 pr-12">
              <CardTitle className="text-base font-semibold">
                Pareto · estimated inventory value
              </CardTitle>
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

          <Card className="relative gap-0 rounded-lg border-[#e8eaec] py-0 shadow-none">
            <InfoTip id="overview.pareto.top" className="absolute right-3 top-3" />
            <CardHeader className="gap-1 px-5 py-4 pr-12">
              <CardTitle className="text-base font-semibold">
                Highest-value stock items
              </CardTitle>
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
  info,
}: {
  label: string;
  value: string;
  detail: string;
  tone: "negative" | "warning" | "neutral";
  info: InfoId;
}) {
  const valueColor = {
    negative: "text-[#c4242a]",
    warning: "text-[#92400e]",
    neutral: "text-[#131416]",
  }[tone];

  return (
    <div className="relative min-w-0 p-4">
      <InfoTip id={info} className="absolute right-2 top-2" />
      <p className="pr-7 text-sm text-[#5d5f60]">{label}</p>
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
  info,
}: {
  label: string;
  value: string;
  detail: string;
  info: InfoId;
}) {
  return (
    <div className="relative rounded-lg border border-[#e8eaec] bg-white p-4">
      <InfoTip id={info} className="absolute right-2 top-2" />
      <p className="pr-7 text-sm text-[#5d5f60]">{label}</p>
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
