// Failure model from Notif History (MTBF), used as a demand driver in the SKU forecast.
// Failure = notification type N1 (malfunction) or N2 (emergency) on a Functional Location.
// Rate per equipment is shrunk toward its equipment class (BF, PP, KC, FCV, ...) because most
// equipment has only 0–3 failures: λ_i = (n_i + K·m_c) / (T + K)   [failures per month]
import { db } from "@/lib/db";

const DATA_START = "2025-01-01";
export const DATA_END = "2026-09-30"; // snapshot date; later notifications are excluded
const DAY_MS = 86_400_000;
const MONTH_DAYS = 30.44;
// Prior strength in months of class-average exposure. Chosen by holdout Poisson log-loss (K = 0…24 tested; 6 is best).
const K = 6;
const HOLDOUT_START = "2026-05-01";
// N1 also carries routine work orders (painting, scaffolding, insulation...). They are not equipment failures.
const ROUTINE = /paint|scaffold|insulation|cover plate|thickness|clean|housekeep|decok|tagging|label|lamp|inspection|measurement|survey|support|grating|dummy leg/i;

const months = (a: string, b: string) => (Date.parse(b) - Date.parse(a)) / DAY_MS / MONTH_DAYS;
const T = months(DATA_START, DATA_END);

/** Equipment class from the functional location tag, same rule as the 3D catalog generator. */
export function equipmentClass(funcloc: string): string {
  const tag = funcloc.replace(/^PX_/, "");
  const m = tag.match(/^([A-Z]+)-\d/);
  if (m) return m[1];
  return /^[\d/-]+-[A-Z]+-\d/.test(tag) ? "LINE" : "OTHER";
}

/** Words in a notification text that point at a part family (SAP family = first description token). */
const FAMILY_KEYWORDS: Array<[RegExp, RegExp]> = [
  [/^PACKING|^GLAND/, /packing|gland/i],
  [/^BEARING/, /bearing|vibrat|abnormal noise/i],
  [/^SEAL/, /seal/i],
  [/^GASKET/, /gasket|flange leak|leak at flange/i],
  [/^TRIM|^SEAT RING|^DISC|^PLUG/, /passing|trim|seat/i],
  [/^VALVE/, /valve|passing/i],
  [/^POSITIONER/, /positioner|hunting|stuck/i],
  [/^TRANSMITTER/, /transmitter|tranmsitter|abnormal indication|signal/i],
  [/^THERMO/, /thermocouple|temperature|abnormal indication|\bTE[LI]?-/i],
  [/^BURNER/, /burner|flame/i],
  [/^CASTABLE|^FIREBRICK|^CERAMIC|^ANCHOR|^REFRACTORY/, /refractory|hot spot|castable|brick|lining/i],
  [/^COUPLING/, /coupling|alignment/i],
  [/^IMPELLER/, /impeller|cavitat|low performance/i],
  [/^BLADE/, /blade|vibrat/i],
  [/^FAN/, /\bfan\b/i],
  [/^LAMP/, /lamp/i],
  [/^GAUGE/, /gauge|\bPGI-/i],
  [/^O-RING/, /o-ring|oring/i],
  [/^FILTER/, /filter|strainer/i],
  [/^SPRING/, /spring/i],
  [/^DIAPHRAGM/, /diaphragm/i],
  [/^NOZZLE/, /nozzle|passing/i],
];

export function familyKeyword(family: string): RegExp | null {
  return FAMILY_KEYWORDS.find(([fam]) => fam.test(family.toUpperCase()))?.[1] ?? null;
}

type Notif = { funcloc: string; date: string; type: string; priority: string; description: string };

type Base = {
  byFuncloc: Map<string, Notif[]>;
  population: Map<string, number>; // functional locations per class
  failures: Notif[];
};

let base: Base | null = null;

function load(): Base {
  if (base) return base;
  const failures = db
    .prepare(
      `SELECT functional_location AS funcloc, notification_date AS date, notification_type AS type,
              priority, description
       FROM notif_history_clean
       WHERE notification_type IN ('N1','N2') AND notification_date BETWEEN ? AND ?
       ORDER BY notification_date`
    )
    .all(DATA_START, DATA_END)
    .filter((n) => !ROUTINE.test((n as Notif).description)) as Notif[];
  const byFuncloc = new Map<string, Notif[]>();
  for (const n of failures) byFuncloc.set(n.funcloc, [...(byFuncloc.get(n.funcloc) ?? []), n]);

  const population = new Map<string, number>();
  const all = new Set([
    ...(db.prepare("SELECT functional_location AS f FROM funcloc_list").all() as { f: string }[]).map((r) => r.f),
    ...byFuncloc.keys(),
  ]);
  for (const f of all) {
    const c = equipmentClass(f);
    population.set(c, (population.get(c) ?? 0) + 1);
  }
  base = { byFuncloc, population, failures };
  return base;
}

/** Class-average failure rate per equipment per month over [from, to). */
function classRates(events: Notif[], span: number, population: Map<string, number>) {
  const counts = new Map<string, number>();
  for (const e of events) {
    const c = equipmentClass(e.funcloc);
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  return (cls: string) => (counts.get(cls) ?? 0) / Math.max(1, population.get(cls) ?? 1) / span;
}

const shrink = (n: number, span: number, classRate: number) => (n + K * classRate) / (span + K);

export type FailureProfile = Awaited<ReturnType<typeof failureProfile>>;

/** Failure profile for one SKU: the equipment it is installed on and how often that equipment fails. */
export function failureProfile(materialNo: string) {
  const { byFuncloc, population, failures } = load();
  const material = db
    .prepare("SELECT family, unit, lt_p50, lt_p90, fc_baseline_m FROM fc_material WHERE material_no = ?")
    .get(materialNo) as { family: string; unit: string; lt_p50: number; lt_p90: number; fc_baseline_m: number } | undefined;
  if (!material) return null;

  const hosts = db
    .prepare(
      `SELECT b.functional_loc AS funcloc, MAX(b.installed_qty) AS installed, f.funcloc_descrip AS name,
              f.funcloc_criticality AS criticality
       FROM bom_clean b LEFT JOIN funcloc_list f ON f.functional_location = b.functional_loc
       WHERE b.material_no = ? GROUP BY b.functional_loc`
    )
    .all(materialNo) as { funcloc: string; installed: number | null; name: string | null; criticality: string | null }[];

  const keyword = familyKeyword(material.family ?? "");
  const anyRate = classRates(failures, T, population);
  const partRate = keyword ? classRates(failures.filter((f) => keyword.test(f.description)), T, population) : null;
  const recentFrom = "2026-04-01";
  const leadDays = material.lt_p90 || material.lt_p50 || 30;

  const equipment = hosts.map((h) => {
    const events = byFuncloc.get(h.funcloc) ?? [];
    const partEvents = keyword ? events.filter((e) => keyword.test(e.description)) : [];
    const cls = equipmentClass(h.funcloc);
    const lambda = shrink(events.length, T, anyRate(cls));
    const lambdaPart = partRate ? shrink(partEvents.length, T, partRate(cls)) : null;
    return {
      funcloc: h.funcloc,
      name: h.name,
      criticality: h.criticality,
      cls,
      installed: h.installed,
      failures: events.length,
      partFailures: keyword ? partEvents.length : null,
      recentFailures: events.filter((e) => e.date >= recentFrom).length,
      lambda, // failures / month
      lambdaPart,
      mtbfMonths: 1 / lambda,
      lastFailure: events.at(-1)?.date ?? null,
    };
  });

  const sumLambda = equipment.reduce((s, e) => s + e.lambda, 0);
  const sumPart = keyword ? equipment.reduce((s, e) => s + (e.lambdaPart ?? 0), 0) : null;
  const totalFailures = equipment.reduce((s, e) => s + e.failures, 0);
  const recent = equipment.reduce((s, e) => s + e.recentFailures, 0);
  const recentSpan = months(recentFrom, DATA_END);
  // Trend: recent 6-month rate vs whole-window rate, smoothed with 2 pseudo-events so small counts stay near 1.
  const trend = (recent / recentSpan + 2 / T) / (totalFailures / T + 2 / T);

  const median = db
    .prepare(
      `SELECT quantity AS q FROM movement_material_clean WHERE material_number = ? ORDER BY quantity`
    )
    .all(materialNo) as { q: number }[];
  const qtyPerEvent = median.length ? median[Math.floor(median.length / 2)].q : null;

  const notes = equipment.flatMap((e) =>
    (byFuncloc.get(e.funcloc) ?? []).map((n) => ({ ...n, partMatch: keyword ? keyword.test(n.description) : false }))
  );
  const monthly = new Map<string, number>();
  for (const n of notes) monthly.set(n.date.slice(0, 7), (monthly.get(n.date.slice(0, 7)) ?? 0) + 1);

  return {
    window: { start: DATA_START, end: DATA_END, months: T },
    unit: material.unit,
    leadDays,
    keyword: keyword?.source ?? null,
    hostCount: equipment.length,
    totals: {
      failures: totalFailures,
      partFailures: keyword ? equipment.reduce((s, e) => s + (e.partFailures ?? 0), 0) : null,
      expectedFailures12m: sumLambda * 12,
      expectedPartFailures12m: sumPart === null ? null : sumPart * 12,
      // Poisson: chance of at least one failure on any host equipment within the P90 lead time
      pFailureInLeadTime: 1 - Math.exp(-sumLambda * (leadDays / MONTH_DAYS)),
      pPartFailureInLeadTime: sumPart === null ? null : 1 - Math.exp(-sumPart * (leadDays / MONTH_DAYS)),
      mtbfMonths: sumLambda > 0 ? 1 / sumLambda : null,
      trend,
      qtyPerEvent,
      failureUnits12m: sumPart !== null && qtyPerEvent !== null ? sumPart * 12 * qtyPerEvent : null,
    },
    equipment: [...equipment].sort((a, b) => b.lambda - a.lambda).slice(0, 8),
    recentNotifications: notes
      .sort((a, b) => b.date.localeCompare(a.date))
      .sort((a, b) => Number(b.partMatch) - Number(a.partMatch))
      .slice(0, 6),
    monthly: [...monthly].sort(([a], [b]) => a.localeCompare(b)).map(([month, count]) => ({ month, count })),
  };
}

let backtestCache: ReturnType<typeof computeBacktest> | null = null;

/** Fit on Jan 2025–Apr 2026, predict failures in May–Sep 2026, compare with what happened. */
export function failureBacktest() {
  backtestCache ??= computeBacktest();
  return backtestCache;
}

function computeBacktest() {
  const { failures, population } = load();
  const train = failures.filter((f) => f.date < HOLDOUT_START);
  const test = failures.filter((f) => f.date >= HOLDOUT_START);
  const span = months(DATA_START, HOLDOUT_START);
  const horizon = months(HOLDOUT_START, DATA_END);
  const rate = classRates(train, span, population);

  const trainBy = new Map<string, number>();
  for (const f of train) trainBy.set(f.funcloc, (trainBy.get(f.funcloc) ?? 0) + 1);
  const testBy = new Map<string, number>();
  for (const f of test) testBy.set(f.funcloc, (testBy.get(f.funcloc) ?? 0) + 1);

  // Poisson log-loss per equipment (lower is better): MIND-PARTS (shrunk) vs each equipment's own history only.
  // The naive model predicts 0 for equipment that never failed before, which is punished when it then fails.
  const logFact = (k: number) => { let s = 0; for (let i = 2; i <= k; i++) s += Math.log(i); return s; };
  const loss = (mu: number, y: number) => { const m = Math.max(mu, 1e-9); return m - y * Math.log(m) + logFact(y); };
  let lossShrunk = 0;
  let lossNaive = 0;
  let predicted = 0;
  const seen = new Set([...trainBy.keys(), ...testBy.keys()]);
  const seenPerClass = new Map<string, number>();
  for (const f of seen) {
    const c = equipmentClass(f);
    seenPerClass.set(c, (seenPerClass.get(c) ?? 0) + 1);
    const n = trainBy.get(f) ?? 0;
    const actual = testBy.get(f) ?? 0;
    const p = shrink(n, span, rate(c)) * horizon;
    predicted += p;
    lossShrunk += loss(p, actual);
    lossNaive += loss((n / span) * horizon, actual);
  }
  for (const [c, pop] of population) {
    const unseen = pop - (seenPerClass.get(c) ?? 0);
    const p = shrink(0, span, rate(c)) * horizon;
    predicted += unseen * p;
    lossShrunk += unseen * loss(p, 0);
  }
  const equipmentCount = [...population.values()].reduce((s, n) => s + n, 0);
  return {
    trainMonths: span,
    testMonths: horizon,
    predicted,
    actual: test.length,
    logLossModel: lossShrunk / equipmentCount,
    logLossNaive: lossNaive / equipmentCount,
  };
}

/** Day-by-day stock projection from the snapshot: baseline usage + PM kits (+ failure trend scenario). */
export function projectNeed(args: {
  stock: number;
  baselinePerMonth: number;
  pm: Array<{ due_date: string; expected_qty: number }>;
  failureUnits12m: number | null;
  trend: number;
  leadP50: number;
  leadP90: number;
}) {
  const start = Date.parse("2026-10-01");
  const iso = (t: number) => new Date(t).toISOString().slice(0, 10);
  const pmByDay = new Map<string, number>();
  for (const p of args.pm) pmByDay.set(p.due_date, (pmByDay.get(p.due_date) ?? 0) + p.expected_qty);

  // Failure scenario: if host equipment fails faster than its own average, the failure-driven part of usage scales up.
  const uplift = args.failureUnits12m !== null ? Math.max(0, Math.min(args.trend, 2) - 1) * (args.failureUnits12m / 365) : 0;
  const run = (extraPerDay: number) => {
    let stock = args.stock;
    for (let d = 0; d < 365; d++) {
      const day = iso(start + d * DAY_MS);
      stock -= args.baselinePerMonth / MONTH_DAYS + extraPerDay + (pmByDay.get(day) ?? 0);
      if (stock < 0) return day;
    }
    return null;
  };
  const base = run(0);
  const withTrend = uplift > 0 ? run(uplift) : base;
  const orderBy = (day: string | null, lead: number) => (day ? iso(Date.parse(day) - lead * DAY_MS) : null);
  return {
    runOutBase: base,
    runOutWithFailureTrend: withTrend,
    orderByP50: orderBy(withTrend, args.leadP50),
    orderByP90: orderBy(withTrend, args.leadP90),
    failureUpliftPerDay: uplift,
  };
}
