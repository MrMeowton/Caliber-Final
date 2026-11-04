// Ported from Learning-By-Building/09-spare-part-race (race.js) — pure logic, no React.
// In MIND Spares the "failure" line is the date the part is NEEDED (first PM job / demand
// that drives projected stock below zero), and the "part" line is when supply arrives.
//   arrives after need date        → LATE  (job waits; gap = days without the part)
//   arrives inside need window/buffer → TIGHT
//   otherwise                        → SAFE

export const DAY = 86_400_000;

export type RaceStatus = "late" | "tight" | "safe";
export const STATUS: Record<RaceStatus, { id: RaceStatus; label: string; rank: number }> = {
  late: { id: "late", label: "Late", rank: 0 },
  tight: { id: "tight", label: "Tight", rank: 1 },
  safe: { id: "safe", label: "Safe", rank: 2 },
};

type DateLike = number | string | Date | null | undefined;

export interface RaceItem {
  id: string;
  asset?: string;
  failure: { p50: DateLike; p10?: DateLike; p90?: DateLike };
  part: {
    name?: string;
    leadTimeDays: number;
    orderedAt?: DateLike;
    eta?: DateLike;
    inStock?: boolean;
    stockSince?: DateLike;
    supplier?: string;
  };
  downtimeCostPerDay?: number;
  [key: string]: unknown;
}

export type RaceMode = "stock" | "eta" | "ordered" | "not-ordered";

export interface RaceResult extends RaceItem {
  now: number;
  failAt: number;
  failEarly: number;
  failLate: number;
  orderAt: number;
  arriveAt: number;
  leadTimeDays: number;
  mode: RaceMode;
  slackDays: number;
  slackEarlyDays: number;
  status: RaceStatus;
  waitDays: number;
  orderBy: number;
  orderOverdueDays: number;
  expediteDays: number;
  exposure: number;
}

/** Date | ISO string | ms → ms. Small numbers (< 1e11) mean "days from now". */
export function toMs(value: DateLike, now: number): number | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return Math.abs(value) < 1e11 ? now + value * DAY : value;
  const t = Date.parse(value);
  return Number.isNaN(t) ? null : t;
}

export const daysBetween = (a: number, b: number) => (b - a) / DAY;
export const addDays = (ms: number, days: number) => ms + days * DAY;

export function startOfDay(ms: number) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function computeRace(item: RaceItem, { now = Date.now(), bufferDays = 3 } = {}): RaceResult {
  const f = item.failure ?? {};
  const p = item.part ?? { leadTimeDays: 0 };

  const failAt = toMs(f.p50, now);
  if (failAt == null) throw new Error(`[demand-race] ${item.id}: failure.p50 is required`);
  const spread = Math.max(DAY, Math.abs(failAt - now) * 0.2);
  const failEarly = Math.min(failAt, toMs(f.p10, now) ?? failAt - spread);
  const failLate = Math.max(failAt, toMs(f.p90, now) ?? failAt + spread);

  const leadTimeDays = Math.max(0, Number(p.leadTimeDays) || 0);
  let orderAt: number, arriveAt: number, mode: RaceMode;
  if (p.inStock) {
    arriveAt = Math.min(now, toMs(p.stockSince, now) ?? now);
    orderAt = arriveAt;
    mode = "stock";
  } else if (p.eta != null) {
    arriveAt = toMs(p.eta, now)!;
    orderAt = toMs(p.orderedAt, now) ?? addDays(arriveAt, -leadTimeDays);
    mode = "eta";
  } else if (p.orderedAt != null) {
    orderAt = toMs(p.orderedAt, now)!;
    arriveAt = addDays(orderAt, leadTimeDays);
    mode = "ordered";
  } else {
    orderAt = now;
    arriveAt = addDays(now, leadTimeDays);
    mode = "not-ordered";
  }

  const slackDays = daysBetween(arriveAt, failAt);
  const slackEarlyDays = daysBetween(arriveAt, failEarly);
  let status: RaceStatus;
  if (slackDays < 0) status = "late";
  else if (slackEarlyDays < bufferDays) status = "tight";
  else status = "safe";

  const waitDays = Math.max(0, -slackDays);
  const orderBy = addDays(failEarly, -(leadTimeDays + bufferDays));
  const orderOverdueDays = mode === "not-ordered" ? Math.max(0, daysBetween(orderBy, now)) : 0;
  const expediteDays = Math.max(0, bufferDays - slackEarlyDays);
  const costPerDay = Number(item.downtimeCostPerDay) || 0;

  return {
    ...item,
    now, failAt, failEarly, failLate, orderAt, arriveAt, leadTimeDays, mode,
    slackDays, slackEarlyDays, status, waitDays, orderBy, orderOverdueDays, expediteDays,
    exposure: waitDays * costPerDay,
  };
}

export function computeRaces(items: RaceItem[], opt: { now?: number; bufferDays?: number } = {}) {
  const now = opt.now ?? Date.now();
  return items
    .map((it) => computeRace(it, { ...opt, now }))
    .sort((a, b) => STATUS[a.status].rank - STATUS[b.status].rank || a.slackDays - b.slackDays);
}

export function summarize(races: RaceResult[]) {
  const out = { total: races.length, late: 0, tight: 0, safe: 0, waitDays: 0, exposure: 0, overdueOrders: 0 };
  for (const r of races) {
    out[r.status]++;
    out.waitDays += r.waitDays;
    out.exposure += r.exposure;
    if (r.orderOverdueDays > 0) out.overdueOrders++;
  }
  return out;
}

export function raceWindow(races: RaceResult[], { now = Date.now(), padDays = 5, minDays = 30 } = {}): [number, number] {
  let lo = now;
  let hi = now + minDays * DAY;
  for (const r of races) {
    lo = Math.min(lo, r.orderAt, r.failEarly);
    hi = Math.max(hi, r.arriveAt, r.failLate);
  }
  return [startOfDay(lo - padDays * DAY), startOfDay(hi + padDays * DAY) + DAY];
}

export function axisTicks([start, end]: [number, number], maxTicks = 10) {
  const spanDays = (end - start) / DAY;
  const steps = [1, 2, 7, 14, 30, 60, 90];
  const step = steps.find((s) => spanDays / s <= maxTicks) ?? 180;
  const ticks: number[] = [];
  const d = new Date(start);
  d.setHours(0, 0, 0, 0);
  if (step >= 30) d.setDate(1);
  else if (step >= 7) d.setDate(d.getDate() + ((8 - d.getDay()) % 7));
  while (d.getTime() <= end) {
    if (d.getTime() >= start) ticks.push(d.getTime());
    if (step >= 30) d.setMonth(d.getMonth() + step / 30);
    else d.setDate(d.getDate() + step);
  }
  return ticks;
}

export const pct = (ms: number, [start, end]: [number, number]) =>
  Math.min(100, Math.max(0, ((ms - start) / (end - start)) * 100));

const fmtCache = new Map<string, Intl.DateTimeFormat>();
export function formatDate(ms: number, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) {
  const key = JSON.stringify(opts);
  if (!fmtCache.has(key)) fmtCache.set(key, new Intl.DateTimeFormat("en-GB", opts));
  return fmtCache.get(key)!.format(ms);
}

export function formatDays(days: number) {
  const d = Math.round(Math.abs(days));
  return `${d} day${d === 1 ? "" : "s"}`;
}
