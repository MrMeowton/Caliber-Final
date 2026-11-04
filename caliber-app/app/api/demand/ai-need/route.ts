import { NextRequest, NextResponse } from "next/server";
import { Type, type Schema } from "@google/genai";
import { generateJson } from "@/lib/ai";
import { needFacts, rulePrediction, type NeedFacts, type NeedPrediction } from "@/lib/demand/need";

const SYSTEM = `You are a spare-parts planner for a petrochemical cracker plant.
Predict WHEN the given spare part will be needed (stock no longer covers demand) and which factors could cause a problem.
Use ONLY the facts provided; never invent numbers. Every factor's evidence must quote a number from the facts.
Dates must be between 2026-10-01 and 2027-09-30, format YYYY-MM-DD, or null if stock lasts beyond that.
The deterministic projection is a strong anchor: move away from it only when other facts justify it, and say why.
Write in plain English a non-specialist understands. Confidence is 0-100 and must be lower when data is thin.`;

const SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    needDate: { type: Type.STRING, nullable: true },
    earliest: { type: Type.STRING, nullable: true },
    latest: { type: Type.STRING, nullable: true },
    orderBy: { type: Type.STRING, nullable: true },
    confidence: { type: Type.NUMBER },
    recommendation: { type: Type.STRING, enum: ["Reorder", "Maintain", "Reduce", "Monitor"] },
    summary: { type: Type.STRING },
    factors: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          effect: { type: Type.STRING, enum: ["raises", "lowers"] },
          weight: { type: Type.STRING, enum: ["high", "medium", "low"] },
          evidence: { type: Type.STRING },
        },
        required: ["name", "effect", "weight", "evidence"],
      },
    },
  },
  required: ["needDate", "confidence", "recommendation", "summary", "factors"],
};

const cache = new Map<string, unknown>();

function prompt({ material: m, profile: p, projection, pm }: NeedFacts, anchor: NeedPrediction) {
  const pmByMonth: Record<string, number> = {};
  for (const n of pm) pmByMonth[n.due_date.slice(0, 7)] = (pmByMonth[n.due_date.slice(0, 7)] ?? 0) + n.expected_qty;
  return JSON.stringify({
    asOf: "2026-09-30",
    part: {
      materialNo: m.material_no, description: m.description, unit: m.unit, criticality: m.criticality,
      stock: m.stock, min: m.min_qty, max: m.max_qty, demandClass: m.demand_class, monthsWithDemandOf17: m.nz_months,
      baselinePerMonth: m.fc_baseline_m, forecast12m: m.fc_12m, forecast12mP90: m.fc_12m_p90,
      leadTimeDaysP50: m.lt_p50, leadTimeDaysP90: m.lt_p90, abnormalIssueLines: m.abnormal_lines,
    },
    plannedMaintenanceQtyByMonth: pmByMonth,
    failureHistory: {
      hostEquipment: p.hostCount, failuresSinceJan2025: p.totals.failures, partRelatedFailures: p.totals.partFailures,
      expectedFailures12m: p.totals.expectedFailures12m, expectedPartFailures12m: p.totals.expectedPartFailures12m,
      chanceOfFailureWithinLeadTime: p.totals.pPartFailureInLeadTime ?? p.totals.pFailureInLeadTime,
      recentTrendVsLongRun: p.totals.trend, qtyIssuedPerEvent: p.totals.qtyPerEvent,
      recentNotifications: p.recentNotifications.map((n) => `${n.date} ${n.type}/${n.priority} ${n.funcloc}: ${n.description}`),
    },
    deterministicProjection: projection,
    ruleBasedPrediction: anchor,
  });
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const date = (v: unknown) =>
  typeof v === "string" && DATE.test(v) && v >= "2026-10-01" && v <= "2027-09-30" ? v : null;

function sanitize(ai: NeedPrediction): NeedPrediction {
  return {
    needDate: date(ai.needDate),
    earliest: date(ai.earliest),
    latest: date(ai.latest),
    orderBy: typeof ai.orderBy === "string" && DATE.test(ai.orderBy) ? ai.orderBy : null,
    confidence: Math.max(0, Math.min(100, Math.round(Number(ai.confidence) || 0))),
    recommendation: ["Reorder", "Maintain", "Reduce", "Monitor"].includes(ai.recommendation) ? ai.recommendation : "Monitor",
    summary: String(ai.summary ?? "").slice(0, 600),
    factors: (Array.isArray(ai.factors) ? ai.factors : []).slice(0, 6).map((f) => ({
      name: String(f.name).slice(0, 80),
      effect: f.effect === "lowers" ? "lowers" : "raises",
      weight: ["high", "medium", "low"].includes(f.weight) ? f.weight : "low",
      evidence: String(f.evidence).slice(0, 300),
    })),
  };
}

// POST /api/demand/ai-need { id } — AI estimate of when stock will be needed, with a rule-based fallback.
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { id?: unknown };
  const id = typeof body.id === "string" ? body.id : "";
  try {
    const cached = cache.get(id);
    if (cached) return NextResponse.json(cached);
    const facts = needFacts(id);
    if (!facts) return NextResponse.json({ error: "Material not found" }, { status: 404 });

    const anchor = rulePrediction(facts);
    const ai = await generateJson<NeedPrediction>({ system: SYSTEM, prompt: prompt(facts, anchor), schema: SCHEMA });
    const result = ai
      ? { source: "ai" as const, model: ai.model, prediction: sanitize(ai.data), anchor }
      : { source: "rules" as const, model: null, prediction: anchor, anchor };
    if (ai) cache.set(id, result);
    return NextResponse.json(result);
  } catch (e) {
    console.error("[api/demand/ai-need]", e);
    return NextResponse.json({ error: "Unable to generate the prediction." }, { status: 500 });
  }
}
