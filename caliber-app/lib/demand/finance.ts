// Ported from Learning-By-Building/15-repair-vs-replace (finance.js) — pure logic.
// Re-used in MIND-PARTS as the "Stock vs Buy-on-demand" (MRP Type) advisor:
//   option A ("keep")  = Non Stock: buy when a job needs it → rush premium + downtime while waiting
//   option B ("swap")  = Stock Item: invest in S* units now → holding cost, residual downtime only
// Both are annual COST streams (positive = cost); savings = A − B → NPV, IRR, payback, EAC.

export interface CostOption {
  upfront?: number;
  salvageNow?: number;
  installDowntimeHours?: number;
  life?: number;
  opex?: number;
  opexGrowth?: number;
  failuresPerYear?: number;
  failureGrowth?: number;
  downtimeHoursPerFailure?: number;
  energyCost?: number;
  energyGrowth?: number;
  /** value recovered at end of horizon (e.g. stock still on the shelf) */
  residualValue?: number;
}

export interface AnalyzeInput {
  repair: CostOption;
  replace: CostOption;
  discountRate: number;
  horizonYears: number;
  lostMarginPerHour: number;
}

type YearCost = { t: number; total: number; opex: number; downtime: number; energy: number; upfront?: number; residual?: number };

export function annualCost(o: CostOption, t: number, margin: number) {
  const g = (rate?: number) => (1 + (rate ?? 0)) ** (t - 1);
  const opex = (o.opex ?? 0) * g(o.opexGrowth);
  const failures = (o.failuresPerYear ?? 0) * g(o.failureGrowth);
  const downtime = failures * (o.downtimeHoursPerFailure ?? 0) * margin;
  const energy = (o.energyCost ?? 0) * g(o.energyGrowth);
  return { opex, failures, downtime, energy, total: opex + downtime + energy };
}

export function costStream(o: CostOption, { horizonYears, lostMarginPerHour }: { horizonYears: number; lostMarginPerHour: number }) {
  const out: YearCost[] = [];
  const t0 = (o.upfront ?? 0) - (o.salvageNow ?? 0) + (o.installDowntimeHours ?? 0) * lostMarginPerHour;
  out.push({ t: 0, total: t0, upfront: t0, opex: 0, downtime: 0, energy: 0 });
  for (let t = 1; t <= horizonYears; t++) out.push({ t, ...annualCost(o, t, lostMarginPerHour) });
  let residual = 0;
  if (o.residualValue != null) residual = o.residualValue;
  else if (o.life && o.upfront) residual = Math.max(0, o.upfront * (1 - horizonYears / o.life));
  if (residual) {
    out[horizonYears].residual = residual;
    out[horizonYears].total -= residual;
  }
  return out;
}

export const discount = (r: number, t: number) => 1 / (1 + r) ** t;
export const npv = (r: number, flows: number[]) => flows.reduce((s, f, t) => s + f * discount(r, t), 0);

export function irr(flows: number[], lo = -0.99, hi = 10): number | null {
  let flo = npv(lo, flows);
  const fhi = npv(hi, flows);
  if (flo * fhi > 0) return null;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const f = npv(mid, flows);
    if (Math.abs(f) < 1e-7) return mid;
    if (f * flo < 0) hi = mid;
    else { lo = mid; flo = f; }
  }
  return (lo + hi) / 2;
}

export function payback(flows: number[], r = 0): number | null {
  let cum = 0;
  for (let t = 0; t < flows.length; t++) {
    const v = flows[t] * (r ? discount(r, t) : 1);
    if (cum < 0 && cum + v >= 0) return t - 1 + -cum / v;
    cum += v;
    if (t === 0 && cum >= 0) return 0;
  }
  return null;
}

export const crf = (r: number, n: number) => (r === 0 ? 1 / n : (r * (1 + r) ** n) / ((1 + r) ** n - 1));

export function analyze({ repair, replace, discountRate: r = 0.1, horizonYears: H = 5, lostMarginPerHour = 0 }: AnalyzeInput) {
  const ctx = { horizonYears: H, lostMarginPerHour };
  const keep = costStream(repair, ctx);
  const swap = costStream(replace, ctx);
  const savings = keep.map((k, t) => k.total - swap[t].total);
  const pvKeep = npv(r, keep.map((x) => x.total));
  const pvSwap = npv(r, swap.map((x) => x.total));
  const incNpv = pvKeep - pvSwap;
  let cumKeep = 0;
  let cumSwap = 0;
  const years = keep.map((k, t) => {
    cumKeep += k.total * discount(r, t);
    cumSwap += swap[t].total * discount(r, t);
    return { t, keep: k, swap: swap[t], saving: savings[t], cumKeep, cumSwap };
  });
  return {
    years, savings, pvKeep, pvSwap, npv: incNpv,
    irr: irr(savings), payback: payback(savings), discountedPayback: payback(savings, r),
    eacKeep: pvKeep * crf(r, H), eacSwap: pvSwap * crf(r, H),
    verdict: incNpv > 0 ? ("replace" as const) : ("repair" as const),
  };
}
