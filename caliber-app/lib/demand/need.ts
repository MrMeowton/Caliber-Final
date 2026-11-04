// Facts for "when will this part be needed", shared by the failure API and the AI prediction.
import { db } from "@/lib/db";
import { failureProfile, projectNeed } from "./failure";

type Material = {
  material_no: string; description: string; family: string; unit: string; criticality: string; mrp_type: string;
  stock: number; min_qty: number; max_qty: number; lt_p50: number; lt_p90: number; lt_source: string;
  demand_class: string; nz_months: number; fc_baseline_m: number; fc_12m: number; fc_12m_p90: number;
  pm_need_90d: number; pm_jobs_12m: number; pm_planned_12m: number; rop_new: number; ss_new: number;
  cover_months: number; abnormal_lines: number;
};

export function needFacts(id: string) {
  const material = db.prepare("SELECT * FROM fc_material WHERE material_no = ?").get(id) as Material | undefined;
  const profile = material ? failureProfile(id) : null;
  if (!material || !profile) return null;
  const pm = db
    .prepare(
      `SELECT due_date, expected_qty FROM fc_pm_need
       WHERE material_no = ? AND due_date BETWEEN '2026-10-01' AND '2027-09-30' ORDER BY due_date`
    )
    .all(id) as { due_date: string; expected_qty: number }[];
  const projection = projectNeed({
    stock: material.stock,
    baselinePerMonth: material.fc_baseline_m,
    pm,
    failureUnits12m: profile.totals.failureUnits12m,
    trend: profile.totals.trend,
    leadP50: material.lt_p50,
    leadP90: material.lt_p90,
  });
  return { material, profile, pm, projection };
}

export type NeedFacts = NonNullable<ReturnType<typeof needFacts>>;

export type Factor = { name: string; effect: "raises" | "lowers"; weight: "high" | "medium" | "low"; evidence: string };
export type NeedPrediction = {
  needDate: string | null;
  earliest: string | null;
  latest: string | null;
  orderBy: string | null;
  confidence: number;
  recommendation: "Reorder" | "Maintain" | "Reduce" | "Monitor";
  summary: string;
  factors: Factor[];
};

const r1 = (v: number) => Math.round(v * 10) / 10;
const pct = (v: number) => `${Math.round(v * 100)}%`;

/** Deterministic prediction used when AI is unavailable, and given to the AI as its anchor. */
export function rulePrediction({ material: m, profile: p, projection: j }: NeedFacts): NeedPrediction {
  const t = p.totals;
  const factors: Factor[] = [];
  const monthly = m.fc_baseline_m + m.pm_planned_12m / 12;
  const coverMonths = monthly > 0 ? m.stock / monthly : null;
  const leadMonths = (m.lt_p90 || m.lt_p50) / 30.44;
  if (coverMonths !== null)
    factors.push({
      name: "Stock cover vs lead time",
      effect: coverMonths < leadMonths ? "raises" : "lowers",
      weight: coverMonths < leadMonths ? "high" : "low",
      evidence: `${m.stock} ${m.unit} covers ~${r1(coverMonths)} months of expected use; P90 lead time is ${r1(leadMonths)} months.`,
    });
  if (m.pm_need_90d > 0)
    factors.push({
      name: "Planned maintenance in 90 days",
      effect: "raises",
      weight: m.pm_need_90d >= m.stock ? "high" : "medium",
      evidence: `PM jobs expect ${r1(m.pm_need_90d)} ${m.unit} in the next 90 days (${m.pm_jobs_12m} jobs in 12 months).`,
    });
  const pFail = t.pPartFailureInLeadTime ?? t.pFailureInLeadTime;
  factors.push({
    name: "Host equipment failure rate (MTBF)",
    effect: pFail >= 0.2 ? "raises" : "lowers",
    weight: pFail >= 0.5 ? "high" : pFail >= 0.2 ? "medium" : "low",
    evidence: `${pct(pFail)} chance of a ${t.pPartFailureInLeadTime !== null ? "part-related " : ""}failure on the ${p.hostCount} host equipment within the ${Math.round(p.leadDays)}-day P90 lead time; ${t.failures} failures recorded since Jan 2025.`,
  });
  if (Math.abs(t.trend - 1) >= 0.2)
    factors.push({
      name: "Failure trend (last 6 months)",
      effect: t.trend > 1 ? "raises" : "lowers",
      weight: Math.abs(t.trend - 1) >= 0.5 ? "high" : "medium",
      evidence: `Recent failure rate is ${r1(t.trend)}× the long-run rate on the host equipment.`,
    });
  if (m.lt_p50 > 0 && m.lt_p90 / m.lt_p50 >= 1.5)
    factors.push({
      name: "Supplier lead-time variability",
      effect: "raises",
      weight: "medium",
      evidence: `Lead time P50 ${Math.round(m.lt_p50)} days vs P90 ${Math.round(m.lt_p90)} days.`,
    });
  if (m.abnormal_lines > 0)
    factors.push({
      name: "Abnormal consumption history",
      effect: "raises",
      weight: "low",
      evidence: `${m.abnormal_lines} past issue lines above 5× the usual quantity make demand less predictable.`,
    });

  const soon = j.orderByP90 !== null && j.orderByP90 <= "2026-11-01";
  const recommendation: NeedPrediction["recommendation"] = soon
    ? "Reorder"
    : m.max_qty > 0 && m.stock > m.max_qty && !j.runOutWithFailureTrend
      ? "Reduce"
      : j.runOutWithFailureTrend
        ? "Monitor"
        : "Maintain";
  const confidence = Math.min(
    85,
    35 + (m.nz_months >= 6 ? 15 : 0) + (m.lt_source === "material" ? 10 : 0) + ((t.partFailures ?? 0) >= 3 ? 10 : 0) + (m.pm_jobs_12m > 0 ? 10 : 0)
  );
  const rank = { high: 0, medium: 1, low: 2 };
  return {
    needDate: j.runOutWithFailureTrend,
    earliest: j.runOutWithFailureTrend,
    latest: j.runOutBase,
    orderBy: j.orderByP90,
    confidence,
    recommendation,
    summary: j.runOutWithFailureTrend
      ? `Stock is projected to run out around ${j.runOutWithFailureTrend}; order by ${j.orderByP90} to cover the P90 lead time.`
      : "Current stock covers the forecast baseline, planned PM kits and the failure trend for the next 12 months.",
    factors: factors.sort((a, b) => rank[a.weight] - rank[b.weight]).slice(0, 6),
  };
}
