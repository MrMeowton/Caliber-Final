"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, Check, RefreshCw, Sparkles, TrendingDown, TrendingUp, X } from "lucide-react";
import { Card, ErrorNote, Kpi, Loading, Pill, Source, getJSON } from "./ui";
import { MONTH_LABEL, fmtNum, fmtPct } from "@/lib/demand/format";
import { formatDate } from "@/lib/demand/race";
import { cn } from "@/lib/utils";
import type { FailureProfile } from "@/lib/demand/failure";
import type { NeedPrediction } from "@/lib/demand/need";

type FailureResponse = {
  profile: NonNullable<FailureProfile>;
  projection: { runOutBase: string | null; runOutWithFailureTrend: string | null; orderByP90: string | null };
  backtest: { trainMonths: number; testMonths: number; predicted: number; actual: number; logLossModel: number; logLossNaive: number };
};

type AiResponse = { source: "ai" | "rules"; model: string | null; prediction: NeedPrediction; anchor: NeedPrediction };

const AS_OF = "2026-09-30";
const day = (s: string | null) => (s ? formatDate(Date.parse(s), { day: "numeric", month: "short", year: "numeric" }) : "—");
const mtbf = (months: number | null) =>
  months === null ? "—" : months < 1 ? `${fmtNum(months * 30.44)} days` : `${fmtNum(months, 1)} months`;

/** Failure-driven demand: how often the equipment this part sits in fails (Notif History, MTBF). */
export function FailureRisk({ id, unit }: { id: string; unit: string }) {
  const [data, setData] = useState<FailureResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    setData(null);
    setError(null);
    getJSON<FailureResponse>(`/api/demand/failure?id=${encodeURIComponent(id)}`, ctrl.signal)
      .then(setData)
      .catch((e) => { if (!ctrl.signal.aborted) setError(String(e.message ?? e)); });
    return () => ctrl.abort();
  }, [id]);

  if (error) return <Card info="demand.sku.failure" title="How often does the equipment break?"><ErrorNote error={error} /></Card>;
  if (!data) return <Card info="demand.sku.failure" title="How often does the equipment break?"><Loading text="Reading failure history…" /></Card>;

  const { profile: p, backtest: bt } = data;
  const t = p.totals;
  const partLevel = t.pPartFailureInLeadTime !== null;
  const pFail = t.pPartFailureInLeadTime ?? t.pFailureInLeadTime;
  const expected = t.expectedPartFailures12m ?? t.expectedFailures12m;
  const chart = p.monthly.map((m) => ({ month: MONTH_LABEL(m.month), failures: m.count }));

  return (
    <Card
      info="demand.sku.failure"
      title="How often does the equipment break?"
      subtitle={`Breakdowns recorded in Notif History on the ${p.hostCount} equipment this part is installed on${partLevel ? ", and how many of them mention this part" : ""}`}
    >
      {p.hostCount === 0 ? (
        <p className="py-6 text-sm text-[#5d5f60]">This part is not linked to any equipment in the BoM, so failure history cannot be attached.</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi
              label={partLevel ? "Chance of a part-related failure within lead time" : "Chance of an equipment failure within lead time"}
              value={fmtPct(pFail)}
              sub={`within the ${fmtNum(p.leadDays)}-day P90 lead time`}
              tone={pFail >= 0.5 ? "bad" : pFail >= 0.2 ? "warn" : "good"}
            />
            <Kpi
              label={partLevel ? "Part-related failures expected, 12 months" : "Equipment failures expected, 12 months"}
              value={fmtNum(expected, 1)}
              sub={`${fmtNum(t.failures)} failures on record${t.partFailures !== null ? ` · ${fmtNum(t.partFailures)} mention this part` : ""}`}
            />
            <Kpi label="Mean time between failures" value={mtbf(t.mtbfMonths)} sub="across all host equipment combined" />
            <Kpi
              label="Failure trend"
              value={`${fmtNum(t.trend, 2)}×`}
              sub="last 6 months vs the whole period"
              tone={t.trend >= 1.2 ? "warn" : t.trend <= 0.8 ? "good" : undefined}
            />
          </div>

          <div className="mt-4 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#131416]">Failures per month on the host equipment</p>
              <div className="mt-2 h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="#eef2f6" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#5f7189" }} interval={2} />
                    <YAxis tick={{ fontSize: 12, fill: "#5f7189" }} width={32} allowDecimals={false} />
                    <Tooltip formatter={(v) => [`${v} failures`, "Recorded"]} contentStyle={{ borderRadius: 8, fontSize: 13 }} />
                    <Bar dataKey="failures" fill="#bf3d4b" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="min-w-0 overflow-x-auto">
              <p className="text-sm font-semibold text-[#131416]">Host equipment with the highest failure rate</p>
              <table className="mt-2 w-full min-w-[420px] text-left text-sm">
                <thead className="text-xs text-[#5d5f60]">
                  <tr className="border-b border-[#e8eaec]">
                    <th className="py-2 pr-2 font-medium">Equipment</th>
                    <th className="px-2 py-2 text-right font-medium">Failures</th>
                    {partLevel && <th className="px-2 py-2 text-right font-medium">This part</th>}
                    <th className="px-2 py-2 text-right font-medium">MTBF</th>
                    <th className="py-2 pl-2 text-right font-medium">Last failure</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f1f2] tabular-nums">
                  {p.equipment.slice(0, 6).map((e) => (
                    <tr key={e.funcloc}>
                      <td className="max-w-[180px] py-2 pr-2">
                        <p className="truncate font-mono text-xs font-semibold">{e.funcloc.replace(/^PX_/, "")}</p>
                        <p className="truncate text-xs text-[#5d5f60]">{e.name ?? e.cls}</p>
                      </td>
                      <td className="px-2 py-2 text-right">{e.failures}</td>
                      {partLevel && <td className="px-2 py-2 text-right">{e.partFailures}</td>}
                      <td className="px-2 py-2 text-right">{mtbf(e.mtbfMonths)}</td>
                      <td className="py-2 pl-2 text-right text-xs">{day(e.lastFailure)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {p.recentNotifications.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-[#131416]">Latest failure notifications</p>
              <ul className="mt-2 divide-y divide-[#f0f1f2]">
                {p.recentNotifications.map((n, i) => (
                  <li key={i} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-sm">
                    <span className="w-24 shrink-0 tabular-nums text-[#5d5f60]">{day(n.date)}</span>
                    <Pill tone={n.type === "N2" || n.priority === "High" || n.priority === "Emergency" ? "red" : "neutral"}>
                      {n.type === "N2" ? "Emergency" : n.priority}
                    </Pill>
                    <span className="min-w-0 flex-1 font-medium">{n.description}</span>
                    <span className="font-mono text-xs text-[#5d5f60]">{n.funcloc.replace(/^PX_/, "")}</span>
                    {n.partMatch && <Pill tone="amber">mentions this part</Pill>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      <Source>
        Failures = N1 malfunction and N2 emergency notifications, Jan 2025 – Sep 2026, excluding routine work (painting, scaffolding,
        insulation, cleaning). Each equipment&apos;s rate is blended with its class average (6 months of prior exposure) because most
        equipment has only a few failures. {partLevel ? `"Mentions this part" = the text matches ${p.keyword}. ` : "No text keyword exists for this part family, so equipment-level failures are shown. "}
        Backtest: fitted on {fmtNum(bt.trainMonths)} months, it predicted {fmtNum(bt.predicted)} failures for the next {fmtNum(bt.testMonths)} months
        vs {fmtNum(bt.actual)} actual; Poisson log-loss {fmtNum(bt.logLossModel, 3)} vs {fmtNum(bt.logLossNaive, 3)} using each equipment&apos;s own history only (lower is better).
        Usage per failure ({fmtNum(t.qtyPerEvent)} {unit}) = median issue quantity.
      </Source>
    </Card>
  );
}

/** AI estimate of when stock will be needed, anchored on the deterministic projection, with Approve/Reject. */
export function AiNeed({ id, unit }: { id: string; unit: string }) {
  const [result, setResult] = useState<AiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    setDecision(null);
    try {
      const res = await fetch("/api/demand/ai-need", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? `Request failed (${res.status})`);
      setResult(body as AiResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to generate the prediction.");
    } finally {
      setLoading(false);
    }
  };

  const p = result?.prediction;
  const overdue = p?.orderBy ? p.orderBy <= AS_OF : false;

  return (
    <Card
      info="demand.sku.aiNeed"
      title="When will this part be needed?"
      subtitle="AI reads the forecast, planned maintenance, failure history and lead time, then estimates when stock runs short and what could cause it"
      right={
        <button
          type="button"
          onClick={run}
          disabled={loading}
          className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[#1b6c80] px-4 text-sm font-semibold text-white hover:bg-[#155768] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b6c80]"
        >
          {loading ? <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Sparkles className="h-4 w-4" aria-hidden="true" />}
          {loading ? "Predicting…" : result ? "Regenerate" : "Predict with AI"}
        </button>
      }
    >
      {error && <ErrorNote error={error} />}
      {!result && !error && !loading && (
        <p className="rounded-md bg-[#f4f6f8] px-4 py-3 text-sm text-[#353736]">
          Press <b>Predict with AI</b> to estimate the date this part runs short, the last safe order date and the factors behind it.
        </p>
      )}
      {loading && !result && <Loading text="Asking the AI…" />}

      {result && p && (
        <div className="space-y-4" aria-live="polite">
          <div
            className={cn(
              "flex items-start gap-2 rounded-md px-3 py-2.5 text-sm",
              result.source === "ai" ? "bg-[#fffbeb] text-[#7a3b0c]" : "bg-[#f4f6f8] text-[#353736]"
            )}
            role="note"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>
              {result.source === "ai" ? (
                <>
                  <b>AI-generated · may be wrong.</b> Rule-based check: runs out <b>{day(result.anchor.needDate)}</b>.
                </>
              ) : (
                <>
                  <b>Rule-based estimate</b> (AI unavailable).
                </>
              )}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi
              label="Stock needed by"
              value={p.needDate ? day(p.needDate) : "Not within 12 months"}
              sub={p.earliest && p.latest && p.earliest !== p.latest ? `window ${day(p.earliest)} – ${day(p.latest)}` : undefined}
              tone={p.needDate ? "bad" : "good"}
            />
            <Kpi
              label="Order by"
              value={p.orderBy ? day(p.orderBy) : "—"}
              sub={overdue ? "already past: order now or expedite" : "to cover the P90 lead time"}
              tone={overdue ? "bad" : undefined}
            />
            <Kpi label="Confidence" value={`${p.confidence}%`} sub={result.source === "ai" ? "as stated by the AI" : "from data coverage"} />
            <Kpi label="Recommendation" value={p.recommendation} tone={p.recommendation === "Reorder" ? "bad" : p.recommendation === "Reduce" ? "warn" : "info"} />
          </div>

          <p className="text-[15px] leading-6 text-[#131416]">{p.summary}</p>

          <div>
            <p className="text-sm font-semibold text-[#131416]">Factors that could cause a problem</p>
            <ul className="mt-2 divide-y divide-[#f0f1f2]">
              {p.factors.map((f, i) => (
                <li key={i} className="flex gap-3 py-2.5">
                  {f.effect === "raises" ? (
                    <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-[#c4242a]" aria-label="raises risk" />
                  ) : (
                    <TrendingDown className="mt-0.5 h-4 w-4 shrink-0 text-[#1e7b4f]" aria-label="lowers risk" />
                  )}
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                      {f.name}
                      <Pill tone={f.weight === "high" ? "red" : f.weight === "medium" ? "amber" : "neutral"}>{f.weight} impact</Pill>
                    </p>
                    <p className="mt-0.5 text-sm text-[#353736]">{f.evidence}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-[#f0f1f2] pt-3">
            <button
              type="button"
              aria-pressed={decision === "approved"}
              onClick={() => setDecision("approved")}
              className={cn(
                "inline-flex min-h-9 items-center gap-1.5 rounded-md border px-3 text-sm font-semibold",
                decision === "approved" ? "border-[#1e7b4f] bg-[#dcfae5] text-[#14532d]" : "border-[#cdced1] hover:bg-[#f4f6f8]"
              )}
            >
              <Check className="h-4 w-4" aria-hidden="true" /> Approve
            </button>
            <button
              type="button"
              aria-pressed={decision === "rejected"}
              onClick={() => setDecision("rejected")}
              className={cn(
                "inline-flex min-h-9 items-center gap-1.5 rounded-md border px-3 text-sm font-semibold",
                decision === "rejected" ? "border-[#c4242a] bg-[#ffedea] text-[#831c1e]" : "border-[#cdced1] hover:bg-[#f4f6f8]"
              )}
            >
              <X className="h-4 w-4" aria-hidden="true" /> Reject
            </button>
            <span className="text-xs text-[#5d5f60]">
              {decision ? `Marked ${decision} in this session.` : "Your decision stays in this browser;"} Nothing is sent to SAP or any control system. Quantities in {unit}.
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
