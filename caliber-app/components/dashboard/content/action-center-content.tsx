"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Check, RefreshCw, Sparkles, X } from "lucide-react";
import { InfoTip } from "@/components/ui/info-tip";
import { DynamicMinMaxSummary } from "@/components/demand/dynamic-minmax";
import { ReorderList } from "@/components/dashboard/reorder-list";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/ui/metric-card";
import type { Navigate } from "@/app/page";

type Action = "Reorder Now" | "Maintain" | "Reduce / Stop-Buy" | "Monitor";
type Candidate = {
  materialNo: string;
  description: string;
  functionalLoc: string;
  locationDescription: string;
  stock: number;
  minQty: number;
  maxQty: number;
  unit: string;
  criticality: string;
  reorderPoint: number;
  averageDailyDemand: number;
  safetyStock: number;
  daysOfCover: number | null;
  orderCap: number;
  recommendedQty: number;
  unitPriceIdr: number | null;
  nextMaintenance: string | null;
  nextMaintenanceDate: string | null;
  suggestedAction: Action;
  reason: string;
};
type DashboardData = {
  coverage: { planningLeadTimeDays: number | null };
  kpis: {
    criticalZeroPositions: number;
    excessCapitalIdr: number;
    inventoryValueIdr: number;
    maintenancePlansDue90d: number;
  };
  actionCandidates: Candidate[];
};
type QueueItem = {
  rank: number;
  materialNo: string;
  functionalLoc: string;
  action: Action;
  reason: string;
  confidence: number;
};
type AssignedTask = {
  key: string;
  materialNo: string;
  description: string;
  functionalLoc: string;
  action: Action;
  assignee: string;
  dueDate: string;
  reason: string;
  createdAt: string;
};
type ScenarioCandidate = Candidate & {
  scenarioSafetyStock: number | null;
  scenarioReorderPoint: number | null;
  scenarioOrderQty: number;
  annualCarryingCost: number | null;
  reorderGapPercent: number | null;
};

const STORAGE_KEY = "mind-action-center-assignments-v1";
const STORAGE_EVENT = "mind-action-center-assignments-updated";
const STORAGE_UNAVAILABLE = "__storage_unavailable__";
const SERVICE_Z: Record<number, number> = {
  90: 1.28,
  95: 1.65,
  97.5: 1.96,
  99: 2.33,
};
const actions: Action[] = [
  "Reorder Now",
  "Maintain",
  "Reduce / Stop-Buy",
  "Monitor",
];
const numberFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const integerFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const currencyFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCandidate(value: unknown): value is Candidate {
  return (
    isRecord(value) &&
    typeof value.materialNo === "string" &&
    typeof value.description === "string" &&
    typeof value.functionalLoc === "string" &&
    typeof value.stock === "number" &&
    typeof value.minQty === "number" &&
    typeof value.maxQty === "number" &&
    typeof value.reorderPoint === "number" &&
    typeof value.averageDailyDemand === "number" &&
    typeof value.safetyStock === "number" &&
    typeof value.orderCap === "number" &&
    typeof value.recommendedQty === "number" &&
    (value.unitPriceIdr === null || typeof value.unitPriceIdr === "number") &&
    actions.includes(value.suggestedAction as Action)
  );
}

function isDashboardData(value: unknown): value is DashboardData {
  return (
    isRecord(value) &&
    isRecord(value.coverage) &&
    isRecord(value.kpis) &&
    Array.isArray(value.actionCandidates) &&
    value.actionCandidates.every(isCandidate)
  );
}

function isQueueItem(value: unknown): value is QueueItem {
  return (
    isRecord(value) &&
    typeof value.rank === "number" &&
    typeof value.materialNo === "string" &&
    typeof value.functionalLoc === "string" &&
    actions.includes(value.action as Action) &&
    typeof value.reason === "string" &&
    typeof value.confidence === "number" &&
    value.confidence >= 0 &&
    value.confidence <= 100
  );
}

function isAssignedTask(value: unknown): value is AssignedTask {
  return (
    isRecord(value) &&
    typeof value.key === "string" &&
    typeof value.materialNo === "string" &&
    typeof value.description === "string" &&
    typeof value.functionalLoc === "string" &&
    actions.includes(value.action as Action) &&
    typeof value.assignee === "string" &&
    typeof value.dueDate === "string" &&
    typeof value.reason === "string" &&
    typeof value.createdAt === "string"
  );
}

function parseQueue(reply: string, candidates: Candidate[]): QueueItem[] | null {
  const json = reply
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed) || !parsed.every(isQueueItem)) return null;

  const byKey = new Map(
    candidates.map((candidate) => [
      `${candidate.materialNo}:${candidate.functionalLoc}`,
      candidate,
    ])
  );
  return parsed
    .filter((item) => {
      const candidate = byKey.get(`${item.materialNo}:${item.functionalLoc}`);
      return (
        candidate !== undefined &&
        (item.action === candidate.suggestedAction || item.action === "Monitor")
      );
    })
    .filter(
      (item, index, list) =>
        list.findIndex(
          (other) =>
            other.materialNo === item.materialNo &&
            other.functionalLoc === item.functionalLoc
        ) === index
    )
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 10);
}

function formatCurrency(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value)
    ? currencyFormat.format(value)
    : "Not available";
}

function formatNumber(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value)
    ? numberFormat.format(value)
    : "—";
}

function keyFor(candidate: Pick<Candidate, "materialNo" | "functionalLoc">) {
  return `${candidate.materialNo}:${candidate.functionalLoc}`;
}

function subscribeToAssignments(onChange: () => void) {
  window.addEventListener(STORAGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(STORAGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getAssignmentsSnapshot() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "[]";
  } catch {
    return STORAGE_UNAVAILABLE;
  }
}

function getServerAssignmentsSnapshot() {
  return "[]";
}

export function ActionCenterContent({ onNavigate, initialFocus }: { onNavigate?: Navigate; initialFocus?: string } = {}) {
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [serviceLevel, setServiceLevel] = useState(95);
  const [carryingCostPercent, setCarryingCostPercent] = useState(20);
  const [bufferDays, setBufferDays] = useState(0);
  const [queue, setQueue] = useState<QueueItem[] | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const storedAssignments = useSyncExternalStore(
    subscribeToAssignments,
    getAssignmentsSnapshot,
    getServerAssignmentsSnapshot
  );
  const [assignmentDrafts, setAssignmentDrafts] = useState<
    Record<string, { assignee: string; dueDate: string }>
  >({});
  const [decisions, setDecisions] = useState<Record<string, "approved" | "rejected">>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/inventory/dashboard", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload: unknown = await response.json();
        if (!response.ok) {
          throw new Error(
            isRecord(payload) && typeof payload.error === "string"
              ? payload.error
              : `Inventory request failed (${response.status}).`
          );
        }
        if (!isDashboardData(payload)) {
          throw new Error("Action Center data has an unexpected shape.");
        }
        setData(payload);
        setError(null);
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load Action Center data."
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [refreshKey]);

  const assignmentState = useMemo(() => {
    if (storedAssignments === STORAGE_UNAVAILABLE) {
      return {
        tasks: [] as AssignedTask[],
        error: "Browser storage is unavailable; assignments cannot be loaded.",
      };
    }
    try {
      const parsed: unknown = JSON.parse(storedAssignments);
      if (!Array.isArray(parsed) || !parsed.every(isAssignedTask)) {
        throw new Error("Saved assignments have an unexpected format.");
      }
      return { tasks: parsed, error: null };
    } catch (loadError) {
      return {
        tasks: [] as AssignedTask[],
        error:
          loadError instanceof Error
            ? loadError.message
            : "Could not read saved assignments from this browser.",
      };
    }
  }, [storedAssignments]);
  const assignments = assignmentState.tasks;
  const storageError = saveError ?? assignmentState.error;

  const scenarioCandidates = useMemo<ScenarioCandidate[]>(() => {
    if (!data) return [];
    const leadTime = data.coverage.planningLeadTimeDays;
    return data.actionCandidates.map((candidate) => {
      const scenarioSafetyStock =
        leadTime === null
          ? null
          : Math.max(
              0,
              candidate.safetyStock * (SERVICE_Z[serviceLevel] / 1.65) +
                candidate.averageDailyDemand * bufferDays
            );
      const scenarioReorderPoint =
        leadTime === null || scenarioSafetyStock === null
          ? null
          : Math.max(
              candidate.minQty,
              candidate.averageDailyDemand * leadTime +
                scenarioSafetyStock
            );
      const scenarioOrderQty =
        candidate.suggestedAction === "Reorder Now" &&
        scenarioReorderPoint !== null
          ? Math.min(
              candidate.orderCap,
              Math.max(0, Math.ceil(scenarioReorderPoint - candidate.stock))
            )
          : 0;
      const reorderGapPercent =
        scenarioReorderPoint !== null && scenarioReorderPoint > 0
          ? Math.min(
              100,
              Math.max(
                0,
                ((scenarioReorderPoint - candidate.stock) / scenarioReorderPoint) *
                  100
              )
            )
          : null;
      return {
        ...candidate,
        scenarioSafetyStock,
        scenarioReorderPoint,
        scenarioOrderQty,
        annualCarryingCost:
          candidate.unitPriceIdr === null
            ? null
            : candidate.stock *
              candidate.unitPriceIdr *
              (carryingCostPercent / 100),
        reorderGapPercent,
      };
    });
  }, [bufferDays, carryingCostPercent, data, serviceLevel]);

  const chartData = scenarioCandidates
    .filter(
      (candidate) =>
        candidate.annualCarryingCost !== null &&
        candidate.reorderGapPercent !== null
    )
    .map((candidate) => ({
      x: candidate.annualCarryingCost!,
      y: candidate.reorderGapPercent!,
      materialNo: candidate.materialNo,
      description: candidate.description,
      action: candidate.suggestedAction,
    }));

  const belowScenarioRop = scenarioCandidates.filter(
    (candidate) =>
      candidate.suggestedAction === "Reorder Now" &&
      candidate.scenarioReorderPoint !== null &&
      candidate.stock < candidate.scenarioReorderPoint
  ).length;
  const scenarioCarryingCost =
    data && (data.kpis.inventoryValueIdr * carryingCostPercent) / 100;

  async function generateQueue() {
    if (!data || aiLoading) return;
    setAiLoading(true);
    setAiError(null);
    setQueue(null);
    const queueCandidates = [
      ...scenarioCandidates
        .filter((candidate) => candidate.suggestedAction === "Reorder Now")
        .slice(0, 20),
      ...scenarioCandidates
        .filter((candidate) => candidate.suggestedAction === "Reduce / Stop-Buy")
        .slice(0, 20),
    ];
    const prompt = `Create a ranked action queue from only the candidate rows below. Return ONLY a valid JSON array with objects shaped exactly as {"rank":1,"materialNo":"...","functionalLoc":"...","action":"Reorder Now|Maintain|Reduce / Stop-Buy|Monitor","reason":"...","confidence":0}. Use only exact materialNo and functionalLoc pairs from the input. Reorder candidates may only be Reorder Now or Monitor; above-maximum candidates may only be Reduce / Stop-Buy or Monitor. Never invent quantities, open-PO status, downtime costs, or maintenance demand. Give a brief evidence-based reason and confidence from 0 to 100. Candidates: ${JSON.stringify(
      queueCandidates.map((candidate) => ({
        materialNo: candidate.materialNo,
        functionalLoc: candidate.functionalLoc,
        suggestedAction: candidate.suggestedAction,
        criticality: candidate.criticality,
        stock: candidate.stock,
        minQty: candidate.minQty,
        maxQty: candidate.maxQty,
        reorderPoint: candidate.reorderPoint,
        scenarioReorderPoint: candidate.scenarioReorderPoint,
        daysOfCover: candidate.daysOfCover,
        recommendedQty: candidate.recommendedQty,
        scenarioOrderQty: candidate.scenarioOrderQty,
        nextMaintenance: candidate.nextMaintenance,
        nextMaintenanceDate: candidate.nextMaintenanceDate,
        reason: candidate.reason,
      }))
    )}`;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          pageContext: "action-center",
        }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        throw new Error(
          isRecord(payload) && typeof payload.error === "string"
            ? payload.error
            : `AI queue request failed (${response.status}).`
        );
      }
      if (!isRecord(payload) || typeof payload.reply !== "string") {
        throw new Error("The AI returned an unexpected response.");
      }
      const parsedQueue = parseQueue(payload.reply, data.actionCandidates);
      if (!parsedQueue) {
        throw new Error("The AI response could not be matched to the supplied inventory candidates. Retry.");
      }
      setQueue(parsedQueue);
      if (parsedQueue.length === 0) {
        setAiError("The AI returned no valid actions for the current candidate set.");
      }
    } catch (requestError) {
      setAiError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to generate an AI action queue."
      );
    } finally {
      setAiLoading(false);
    }
  }

  function saveAssignment(item: QueueItem, candidate: Candidate) {
    const key = keyFor(candidate);
    const draft = assignmentDrafts[key];
    if (!draft?.assignee.trim()) return;
    const nextTask: AssignedTask = {
      key,
      materialNo: item.materialNo,
      description: candidate.description,
      functionalLoc: item.functionalLoc,
      action: item.action,
      assignee: draft.assignee.trim(),
      dueDate: draft.dueDate,
      reason: item.reason,
      createdAt: new Date().toISOString(),
    };
    const next = [
      nextTask,
      ...assignments.filter((task) => task.key !== key),
    ];
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event(STORAGE_EVENT));
      setSaveError(null);
    } catch (saveError) {
      setSaveError(
        saveError instanceof Error
          ? `Could not save this assignment: ${saveError.message}`
          : "Could not save this assignment in this browser."
      );
    }
  }

  // Jump to the section a button elsewhere asked for (reorder list, AI to-do, Min–Max) once the page has data.
  useEffect(() => {
    if (!initialFocus || loading) return;
    const timer = window.setTimeout(
      () => document.getElementById(initialFocus)?.scrollIntoView({ behavior: "smooth", block: "start" }),
      300
    );
    return () => window.clearTimeout(timer);
  }, [initialFocus, loading]);

  if (loading) {
    return <p className="text-sm text-[#5d5f60]" role="status">Loading optimization inputs…</p>;
  }
  if (!data) {
    return (
      <section className="rounded-lg border border-[#e8eaec] p-5" role="alert">
        <h1 className="text-xl font-semibold">Action Center</h1>
        <p className="mt-2 text-sm text-[#831c1e]">{error ?? "Inventory data is unavailable."}</p>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            setRefreshKey((value) => value + 1);
          }}
          className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-md border border-[#cdced1] px-3 text-sm"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Retry
        </button>
      </section>
    );
  }

  const candidateByKey = new Map(
    scenarioCandidates.map((candidate) => [keyFor(candidate), candidate])
  );
  const plottedCount = chartData.length;

  return (
    <div className="space-y-6 text-[#131416]">
      <PageHeader
        step={3}
        title="What should we order, reduce or keep?"
        subtitle="Start with the reorder list, let AI rank the work, then check that the recommended Min–Max and the cost vs risk balance hold up."
      />

      <section className="grid gap-3 md:grid-cols-3" aria-label="What needs action">
        <MetricCard
          label="Critical parts out of stock"
          info="action.kpi.criticalZero"
          value={integerFormat.format(data.kpis.criticalZeroPositions)}
          verdict={data.kpis.criticalZeroPositions > 0 ? "act" : "ok"}
          meaning="These stop a job if the equipment fails. Order or expedite them first."
          action={{ label: "Go to reorder list", onClick: () => scrollTo("reorder") }}
        />
        <MetricCard
          label="Cash tied up above Max"
          info="action.kpi.aboveMax"
          value={formatCurrency(data.kpis.excessCapitalIdr)}
          verdict={data.kpis.excessCapitalIdr > 0 ? "watch" : "ok"}
          meaning="Released by stopping purchases of overstocked parts and moving the surplus where it is needed."
          action={onNavigate && { label: "See stop-buy list", onClick: () => onNavigate({ section: "monitor", tab: "health" }) }}
        />
        <MetricCard
          label="Planned jobs in the next 90 days"
          info="action.kpi.plans"
          value={integerFormat.format(data.kpis.maintenancePlansDue90d)}
          verdict="watch"
          verdictLabel="Plan ahead"
          meaning="Each one needs its parts on the shelf before the job date. Check which months are short."
          action={onNavigate && { label: "See parts per month", onClick: () => onNavigate({ section: "forecast", tab: "pm" }) }}
        />
      </section>

      <ReorderList />

      <section id="ai-todo" className="rounded-lg border border-[#e8eaec] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e8eaec] px-4 py-4 sm:px-5">
          <div>
            <h2 className="text-lg font-semibold">AI to-do list: what to reorder, reduce or keep</h2>
          </div>
          <div className="flex items-center gap-2">
          {!queue && (
            <button
              type="button"
              onClick={generateQueue}
              disabled={aiLoading || scenarioCandidates.length === 0}
              className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[#1b6c80] px-4 text-sm font-semibold text-white hover:bg-[#155768] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {aiLoading ? <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Sparkles className="h-4 w-4" aria-hidden="true" />}
              {aiLoading ? "Ranking…" : "Build my AI to-do list"}
            </button>
          )}
          {queue && (
            <button
              type="button"
              onClick={generateQueue}
              disabled={aiLoading}
              className="inline-flex min-h-9 items-center gap-2 rounded-md border border-[#cdced1] px-3 text-sm hover:bg-[#f4f6f8] disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Regenerate
            </button>
          )}
          <InfoTip id="action.queue" />
          </div>
        </div>
        {aiError && (
          <p className="m-4 rounded-md bg-[#ffedea] p-3 text-sm text-[#831c1e]" role="alert">
            {aiError}
          </p>
        )}
        {queue === null ? (
          <p className="px-4 py-6 text-sm text-[#5d5f60] sm:px-5">
            Generate a queue to ask the existing database-connected AI to prioritize the
            current inventory candidates.
          </p>
        ) : queue.length === 0 ? (
          <p className="px-4 py-6 text-sm text-[#5d5f60] sm:px-5">
            No valid actions were returned for this snapshot.
          </p>
        ) : (
          <div className="divide-y divide-[#e8eaec]">
            {queue.map((item) => {
              const candidate = candidateByKey.get(
                `${item.materialNo}:${item.functionalLoc}`
              );
              if (!candidate) return null;
              const key = keyFor(candidate);
              const draft = assignmentDrafts[key] ?? { assignee: "", dueDate: "" };
              return (
                <article key={key} className="grid gap-4 p-4 sm:p-5 xl:grid-cols-[minmax(0,1fr)_minmax(260px,0.7fr)]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-[#5d5f60]">P{item.rank}</span>
                      <span className="rounded-full bg-[#f4f6f8] px-2 py-0.5 text-xs font-medium">
                        {item.action}
                      </span>
                      <span className="text-xs text-[#5d5f60]">
                        Confidence {item.confidence}%
                      </span>
                    </div>
                    <h3 className="mt-2 text-sm font-semibold">{candidate.description}</h3>
                    <p className="font-mono text-xs text-[#5d5f60]">
                      {item.materialNo} · {item.functionalLoc}
                    </p>
                    <p className="mt-2 text-sm leading-5">{item.reason}</p>
                    <p className="mt-2 text-xs text-[#5d5f60]">
                      Source: inventory database · on-hand {formatNumber(candidate.stock)}{" "}
                      {candidate.unit} · ROP {formatNumber(candidate.scenarioReorderPoint)}{" "}
                      · max {formatNumber(candidate.maxQty)} {candidate.unit}
                      {candidate.nextMaintenanceDate
                        ? ` · ${candidate.nextMaintenance ?? "Maintenance"} ${candidate.nextMaintenanceDate}`
                        : ""}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        aria-pressed={decisions[key] === "approved"}
                        onClick={() =>
                          setDecisions((current) => ({ ...current, [key]: "approved" }))
                        }
                        className={`inline-flex min-h-9 items-center gap-1 rounded-md border px-3 text-xs font-medium ${
                          decisions[key] === "approved"
                            ? "border-[#1e7b4f] bg-[#dcfae5] text-[#14532d]"
                            : "border-[#cdced1] hover:bg-[#f4f6f8]"
                        }`}
                      >
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        Approve draft
                      </button>
                      <button
                        type="button"
                        aria-pressed={decisions[key] === "rejected"}
                        onClick={() =>
                          setDecisions((current) => ({ ...current, [key]: "rejected" }))
                        }
                        className={`inline-flex min-h-9 items-center gap-1 rounded-md border px-3 text-xs font-medium ${
                          decisions[key] === "rejected"
                            ? "border-[#c4242a] bg-[#ffedea] text-[#831c1e]"
                            : "border-[#cdced1] hover:bg-[#f4f6f8]"
                        }`}
                      >
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                        Reject
                      </button>
                    </div>
                  </div>

                  <div className="grid content-start gap-2 rounded-md bg-[#f4f6f8] p-3 sm:grid-cols-[minmax(0,1fr)_150px_auto] xl:grid-cols-1">
                    <label className="text-xs text-[#5d5f60]">
                      Assign to
                      <input
                        value={draft.assignee}
                        onChange={(event) =>
                          setAssignmentDrafts((current) => ({
                            ...current,
                            [key]: { ...draft, assignee: event.target.value },
                          }))
                        }
                        placeholder="Planner or buyer"
                        className="mt-1 min-h-9 w-full rounded-md border border-[#cdced1] bg-white px-2 text-sm text-[#131416]"
                      />
                    </label>
                    <label className="text-xs text-[#5d5f60]">
                      Target date
                      <input
                        type="date"
                        value={draft.dueDate}
                        onChange={(event) =>
                          setAssignmentDrafts((current) => ({
                            ...current,
                            [key]: { ...draft, dueDate: event.target.value },
                          }))
                        }
                        className="mt-1 min-h-9 w-full rounded-md border border-[#cdced1] bg-white px-2 text-sm text-[#131416]"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => saveAssignment(item, candidate)}
                      disabled={!draft.assignee.trim()}
                      className="min-h-9 self-end rounded-md bg-[#131416] px-3 text-xs font-medium text-white hover:bg-[#353736] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Assign task
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>


      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
        <div className="rounded-lg border border-[#e8eaec] bg-white p-4 sm:p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold">Cost vs risk for each part</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#5d5f60]">
                {plottedCount} priced candidates plotted
              </span>
              <InfoTip id="action.matrix" className="-my-1" />
            </div>
          </div>
          {plottedCount > 0 ? (
            <div className="mt-3 h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 12, right: 12, bottom: 8, left: 8 }}>
                  <CartesianGrid stroke="#e8eaec" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    name="Annual holding cost"
                    tick={{ fill: "#5d5f60", fontSize: 11 }}
                    tickFormatter={(value: number) => `${Math.round(value / 1_000_000)}M`}
                    axisLine={{ stroke: "#cdced1" }}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    name="ROP deficit"
                    domain={[0, 100]}
                    unit="%"
                    tick={{ fill: "#5d5f60", fontSize: 11 }}
                    axisLine={false}
                  />
                  <ReferenceLine y={50} stroke="#cdced1" strokeDasharray="4 4" />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    formatter={(value, name) => [
                      name === "Annual holding cost"
                        ? formatCurrency(Number(value))
                        : `${formatNumber(Number(value))}%`,
                      String(name),
                    ]}
                    labelFormatter={(_, payload) =>
                      payload?.[0]?.payload
                        ? `${payload[0].payload.materialNo} · ${payload[0].payload.description}`
                        : ""
                    }
                  />
                  <Scatter
                    data={chartData}
                    name="Inventory candidates"
                    fill="#1b6c80"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="mt-4 rounded-md border border-dashed border-[#cdced1] p-4 text-sm text-[#5d5f60]">
              No candidates have both a usable IDR price and a calculable scenario ROP.
            </p>
          )}
        </div>

        <section className="relative rounded-lg border border-[#e8eaec] bg-white p-4 sm:p-5">
          <InfoTip id="action.controls" className="absolute right-3 top-3" />
          <h2 className="pr-8 text-lg font-semibold">Try a different stock policy</h2>
          <label className="mt-5 block text-sm">
            <span className="flex justify-between gap-3">
              <span>Chance a part is there when needed</span>
              <strong className="tabular-nums">{serviceLevel}%</strong>
            </span>
            <select
              value={serviceLevel}
              onChange={(event) => setServiceLevel(Number(event.target.value))}
              className="mt-2 min-h-10 w-full rounded-md border border-[#cdced1] bg-white px-3"
            >
              {[90, 95, 97.5, 99].map((level) => (
                <option key={level} value={level}>{level}%</option>
              ))}
            </select>
          </label>
          <label className="mt-4 block text-sm">
            <span className="flex justify-between gap-3">
              <span>Yearly cost of holding stock</span>
              <strong className="tabular-nums">{carryingCostPercent}%</strong>
            </span>
            <input
              type="range"
              min={5}
              max={40}
              step={1}
              value={carryingCostPercent}
              onChange={(event) => setCarryingCostPercent(Number(event.target.value))}
              className="mt-3 w-full accent-[#1b6c80]"
            />
            <span className="text-xs text-[#5d5f60]">5%–40% scenario range</span>
          </label>
          <label className="mt-4 block text-sm">
            <span className="flex justify-between gap-3">
              <span>Extra safety days on supplier lead time</span>
              <strong className="tabular-nums">{bufferDays} days</strong>
            </span>
            <input
              type="range"
              min={0}
              max={30}
              step={1}
              value={bufferDays}
              onChange={(event) => setBufferDays(Number(event.target.value))}
              className="mt-3 w-full accent-[#1b6c80]"
            />
          </label>
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[#e8eaec] pt-4">
            <div>
              <p className="text-xs text-[#5d5f60]">Parts below the new reorder level</p>
              <p className="mt-1 text-xl font-medium tabular-nums">
                {integerFormat.format(belowScenarioRop)}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#5d5f60]">Yearly holding cost</p>
              <p className="mt-1 text-sm font-medium tabular-nums">
                {formatCurrency(scenarioCarryingCost)}
              </p>
            </div>
          </div>
        </section>
      </section>

      <section className="rounded-lg border border-[#e8eaec] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e8eaec] px-4 py-4 sm:px-5">
          <div>
            <h2 className="text-lg font-semibold">Recommended reorder level, part by part</h2>
          </div>
          <div className="flex items-center gap-2">
          <span className="text-xs text-[#5d5f60]">
            Planning lead time: {data.coverage.planningLeadTimeDays === null
              ? "unavailable"
              : `${numberFormat.format(data.coverage.planningLeadTimeDays)} days`}
          </span>
          <InfoTip id="action.policy" className="-my-1" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-[#f4f6f8] text-xs text-[#5d5f60]">
              <tr>
                <th className="px-4 py-3 font-medium">Material / location</th>
                <th className="px-3 py-3 font-medium">On hand</th>
                <th className="px-3 py-3 font-medium">Min / Max</th>
                <th className="px-3 py-3 font-medium">Today: safety / reorder level</th>
                <th className="px-3 py-3 font-medium">Recommended: safety / reorder level</th>
                <th className="px-3 py-3 font-medium">Order qty / max allowed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8eaec]">
              {scenarioCandidates.slice(0, 12).map((candidate) => (
                <tr key={keyFor(candidate)}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{candidate.description || "Unnamed material"}</p>
                    <p className="font-mono text-xs text-[#5d5f60]">
                      {candidate.materialNo} · {candidate.functionalLoc}
                    </p>
                  </td>
                  <td className="px-3 py-3 tabular-nums">
                    {formatNumber(candidate.stock)} {candidate.unit}
                  </td>
                  <td className="px-3 py-3 tabular-nums">
                    {formatNumber(candidate.minQty)} / {formatNumber(candidate.maxQty)}
                  </td>
                  <td className="px-3 py-3 tabular-nums">
                    {formatNumber(candidate.safetyStock)} / {formatNumber(candidate.reorderPoint)}
                  </td>
                  <td className="px-3 py-3 tabular-nums">
                    {formatNumber(candidate.scenarioSafetyStock)} / {formatNumber(candidate.scenarioReorderPoint)}
                    <span className="block text-xs text-[#5d5f60]">Max stays at BOM cap</span>
                  </td>
                  <td className="px-3 py-3 tabular-nums">
                    {integerFormat.format(candidate.scenarioOrderQty)} / {integerFormat.format(candidate.orderCap)}
                  </td>
                </tr>
              ))}
              {scenarioCandidates.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-[#5d5f60]">
                    No reorder or over-maximum candidates are available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div id="minmax">
        <DynamicMinMaxSummary />
      </div>

      {(storageError || assignments.length > 0) && (
        <section className="relative rounded-lg border border-[#e8eaec] bg-white p-4 sm:p-5">
          <InfoTip id="action.assignments" className="absolute right-3 top-3" />
          <h2 className="pr-8 text-base font-semibold">Assigned review tasks</h2>
          {storageError && (
            <p className="mt-2 text-sm text-[#831c1e]" role="alert">{storageError}</p>
          )}
          {assignments.length > 0 && (
            <div className="mt-3 divide-y divide-[#e8eaec]">
              {assignments.slice(0, 8).map((task) => (
                <div key={task.key} className="flex flex-wrap justify-between gap-2 py-3 text-sm">
                  <div>
                    <p className="font-medium">{task.action} · {task.description}</p>
                    <p className="text-xs text-[#5d5f60]">
                      {task.materialNo} · {task.functionalLoc} · Assigned to {task.assignee}
                    </p>
                  </div>
                  <span className="text-xs tabular-nums text-[#5d5f60]">
                    {task.dueDate || "No target date"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

    </div>
  );
}
