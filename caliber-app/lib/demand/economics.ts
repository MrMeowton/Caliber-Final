// Ported from Learning-By-Building/14-spare-part-economics (economics.js) — pure logic.
//
// Base-stock policy (S−1, S): every unit consumed is reordered one-for-one.
// Lead-time demand D ~ Poisson(m), m = λ · L / 365
//   λ = FORECAST annual demand (from the Demand Intelligence model), L = lead time (days)
//   on-hand  E[(S − D)+]  → holding cost = × unit price × holding rate
//   fill rate P(D ≤ S − 1) → chance the part is on the shelf when a job needs it
//   backorders E[(D − S)+] → jobs waiting for the part (Little's law → downtime hours)
// S* = minimum total cost; reorder point = S* − 1.

export const HOURS_PER_YEAR = 8760;

export interface EconPart {
  id: string;
  name: string;
  unitCost: number;          // IDR
  holdingRate?: number;      // per year
  annualDemand: number;      // units / year (forecast)
  leadTimeDays: number;
  downtimeCostPerHour: number; // IDR
  emergencyLeadDays?: number;
  currentStock?: number;
}

export interface EconPoint {
  S: number;
  meanLeadDemand: number;
  onHand: number;
  fillRate: number;
  stockoutsPerYear: number;
  backorders: number;
  downtimeHours: number;
  holdingCost: number;
  downtimeCost: number;
  totalCost: number;
  capital: number;
}

export function poissonPmf(m: number, n: number) {
  const p = new Array<number>(n + 1);
  p[0] = Math.exp(-m);
  for (let k = 1; k <= n; k++) p[k] = (p[k - 1] * m) / k;
  return p;
}

export function evaluate(part: EconPart, S: number): EconPoint {
  const { unitCost = 0, holdingRate = 0.2, annualDemand: lambda = 0, leadTimeDays = 0, downtimeCostPerHour = 0 } = part;
  const m = (lambda * leadTimeDays) / 365;
  const n = Math.max(S + 1, Math.ceil(m + 10 * Math.sqrt(m + 1) + 10));
  const p = poissonPmf(m, n);
  let onHand = 0;
  let cdfBelowS = 0;
  for (let d = 0; d < S; d++) {
    onHand += (S - d) * p[d];
    cdfBelowS += p[d];
  }
  const backorders = Math.max(0, m - S + onHand);
  const fillRate = S === 0 ? 0 : cdfBelowS;
  let downtimeHours = backorders * HOURS_PER_YEAR;
  if (part.emergencyLeadDays != null) downtimeHours = lambda * (1 - fillRate) * part.emergencyLeadDays * 24;
  const holdingCost = onHand * unitCost * holdingRate;
  const downtimeCost = downtimeHours * downtimeCostPerHour;
  return {
    S, meanLeadDemand: m, onHand, fillRate, stockoutsPerYear: lambda * (1 - fillRate), backorders,
    downtimeHours, holdingCost, downtimeCost, totalCost: holdingCost + downtimeCost, capital: S * unitCost,
  };
}

export function optimize(part: EconPart, { maxS }: { maxS?: number } = {}) {
  const m = ((part.annualDemand ?? 0) * (part.leadTimeDays ?? 0)) / 365;
  let top = maxS ?? Math.max(4, Math.ceil(m + 4 * Math.sqrt(m) + 3));
  if (part.currentStock != null) top = Math.max(top, Math.min(part.currentStock, 400));
  top = Math.min(top, 400);
  const curve: EconPoint[] = [];
  for (let S = 0; S <= top; S++) curve.push(evaluate(part, S));
  const best = curve.reduce((a, b) => (b.totalCost < a.totalCost - 1e-9 ? b : a));
  const current = part.currentStock != null ? evaluate(part, part.currentStock) : null;
  return {
    part, curve, best,
    reorderPoint: Math.max(0, best.S - 1),
    current,
    savingsPerYear: current ? current.totalCost - best.totalCost : null,
    capitalDelta: current ? best.capital - current.capital : null,
  };
}

export type EconResult = ReturnType<typeof optimize>;
