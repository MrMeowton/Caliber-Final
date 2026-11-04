// Dynamic Min–Max: recomputed every day from what the plant is about to do.
//   Safety stock = z(criticality) × √(L·σ_D² + D²·σ_L²)          (demand AND lead-time variability)
//   Min(t) = safety stock + expected demand in [t, t + lead time)   (baseline + dated PM kits + open failure backlog)
//   Max(t) = Min(t) + typical order quantity (median PO line qty from PR/PO for this part)
// The same simulation runs forward (next 12 months, expected demand) and as a backtest (May–Sep 2026, actual issues).
import { db } from "@/lib/db";
import { familyKeyword } from "./failure";

const DAY_MS = 86_400_000;
const MONTH_DAYS = 30.44;
const AS_OF = "2026-09-30";
const FORWARD_START = "2026-10-01";
const BT_START = "2026-05-01";
const BT_DAYS = 153; // May–Sep 2026
const BACKLOG_DAYS = 30; // open failure notifications are expected to draw parts within 30 days
export const SERVICE_LEVEL: Record<string, number> = { S: 0.99, A: 0.975, B: 0.95, C: 0.9 };
const Z: Record<string, number> = { S: 2.326, A: 1.96, B: 1.645, C: 1.282 };
const ROUTINE = /paint|scaffold|insulation|cover plate|thickness|clean|housekeep|decok|tagging|label|lamp|inspection|measurement|survey|support|grating|dummy leg/i;

const dayIndex = (date: string, start: string) => Math.round((Date.parse(date) - Date.parse(start)) / DAY_MS);
const isoDay = (start: string, d: number) => new Date(Date.parse(start) + d * DAY_MS).toISOString().slice(0, 10);

type Material = {
  material_no: string; description: string; family: string; unit: string; criticality: string; mrp_type: string;
  stock: number; min_qty: number; max_qty: number; price_idr: number; lt_p50: number; lt_p90: number;
  fc_baseline_m: number; fc_baseline_sd: number;
};

export function safetyStock(m: { criticality: string; lt_p50: number; lt_p90: number }, demandPerMonth: number, sdPerMonth: number) {
  const L = Math.max(1, m.lt_p50) / MONTH_DAYS;
  const sL = Math.max(0, (m.lt_p90 - m.lt_p50) / 1.2816) / MONTH_DAYS;
  return (Z[m.criticality] ?? Z.C) * Math.sqrt(L * sdPerMonth ** 2 + demandPerMonth ** 2 * sL ** 2);
}

type SimInput = {
  days: number;
  onHand: number;
  demand: number[]; // what is actually drawn each day
  receipts: number[]; // open POs arriving each day
  lead: number; // days for a new order to arrive
  minAt: (t: number) => number;
  maxAt: (t: number) => number;
  price: number;
};

/** Daily (s, S) policy: when stock position (on hand + on order) drops below Min, order up to Max. */
export function simulate(s: SimInput) {
  let onHand = s.onHand;
  let pipeline = s.receipts.slice(0, s.days).reduce((a, b) => a + b, 0);
  const arrivals = [...s.receipts];
  const path: number[] = [];
  const orders: { day: number; qty: number; arrives: number }[] = [];
  let served = 0;
  let unmet = 0;
  let stockoutDays = 0;
  let value = 0;
  for (let t = 0; t < s.days; t++) {
    const arrive = arrivals[t] ?? 0;
    onHand += arrive;
    pipeline -= arrive;
    const want = s.demand[t] ?? 0;
    const take = Math.min(Math.max(onHand, 0), want);
    served += take;
    onHand -= take;
    if (want - take > 1e-9) { unmet += want - take; stockoutDays++; }
    const position = onHand + pipeline;
    const min = s.minAt(t);
    if (position < min) {
      const qty = Math.ceil(s.maxAt(t) - position);
      if (qty > 0) {
        const at = t + s.lead;
        arrivals[at] = (arrivals[at] ?? 0) + qty;
        if (at < s.days) pipeline += qty;
        orders.push({ day: t, qty, arrives: at });
      }
    }
    path.push(onHand);
    value += onHand * s.price;
  }
  const demandTotal = served + unmet;
  return {
    path, orders, stockoutDays, unmet,
    fillRate: demandTotal > 0 ? served / demandTotal : 1,
    avgValue: value / s.days,
  };
}

/** Min(t) from a daily forecast using prefix sums. */
function minMaxFns(forecast: number[], lead: number, ss: number, orderQty: number) {
  const prefix = [0];
  for (const f of forecast) prefix.push(prefix[prefix.length - 1] + f);
  const sum = (a: number, b: number) => prefix[Math.min(b, forecast.length)] - prefix[Math.min(a, forecast.length)];
  const minAt = (t: number) => Math.ceil(ss + sum(t, t + lead));
  return { minAt, maxAt: (t: number) => minAt(t) + orderQty };
}

// ---------- bulk data (loaded once) ----------
type Bulk = {
  materials: Material[];
  orderQty: Map<string, number>; // median PO line qty, all history
  orderQtyTrain: Map<string, number>; // median PO line qty placed before the backtest
  pmForward: Map<string, Map<number, number>>;
  backlog: Map<string, number>;
  openPoForward: Map<string, Map<number, number>>;
};
let bulk: Bulk | null = null;

const median = (v: number[]) => { const s = [...v].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : 0; };
const push = <K, V>(m: Map<K, V[]>, k: K, v: V) => m.set(k, [...(m.get(k) ?? []), v]);
const addDay = (m: Map<string, Map<number, number>>, id: string, d: number, q: number) => {
  const inner = m.get(id) ?? new Map<number, number>();
  inner.set(d, (inner.get(d) ?? 0) + q);
  m.set(id, inner);
};

function load(): Bulk {
  if (bulk) return bulk;
  const materials = db
    .prepare(
      `SELECT material_no, description, family, unit, criticality, mrp_type, stock, min_qty, max_qty, price_idr,
              lt_p50, lt_p90, fc_baseline_m, fc_baseline_sd
       FROM fc_material WHERE mrp_type = 'STOCK ITEM'`
    )
    .all() as Material[];

  const poAll = new Map<string, number[]>();
  const poTrain = new Map<string, number[]>();
  for (const r of db.prepare("SELECT material_no, pr_date, qty FROM fc_po WHERE qty > 0").all() as { material_no: string; pr_date: string; qty: number }[]) {
    push(poAll, r.material_no, r.qty);
    if (r.pr_date < BT_START) push(poTrain, r.material_no, r.qty);
  }
  const toMedian = (m: Map<string, number[]>) => new Map([...m].map(([k, v]) => [k, median(v)]));

  const pmForward = new Map<string, Map<number, number>>();
  for (const r of db
    .prepare("SELECT material_no, due_date, expected_qty FROM fc_pm_need WHERE due_date BETWEEN '2026-10-01' AND '2027-09-30'")
    .all() as { material_no: string; due_date: string; expected_qty: number }[])
    addDay(pmForward, r.material_no, dayIndex(r.due_date, FORWARD_START), r.expected_qty);

  // Open POs: requested on/before the snapshot, delivery promised within the next 12 months.
  const openPoForward = new Map<string, Map<number, number>>();
  for (const r of db
    .prepare("SELECT material_no, po_delivery_date AS eta, qty FROM fc_po WHERE pr_date <= ? AND po_delivery_date > ? AND po_delivery_date <= '2027-09-30'")
    .all(AS_OF, AS_OF) as { material_no: string; eta: string; qty: number }[])
    addDay(openPoForward, r.material_no, dayIndex(r.eta, FORWARD_START), r.qty);

  // Open failure backlog: IN PROGRESS N1/N2 notifications whose text names the part family, on equipment carrying the part.
  const open = (db
    .prepare(
      `SELECT functional_location AS f, description AS d FROM notif_history_clean
       WHERE status = 'IN PROGRESS' AND notification_type IN ('N1','N2') AND notification_date <= ?`
    )
    .all(AS_OF) as { f: string; d: string }[]).filter((n) => !ROUTINE.test(n.d));
  const family = new Map(materials.map((m) => [m.material_no, m.family]));
  const issueQty = new Map(
    (db.prepare("SELECT material_no, qty FROM fc_mv").all() as { material_no: string; qty: number }[])
      .reduce((acc, r) => push(acc, r.material_no, r.qty), new Map<string, number[]>())
  );
  const bomAt = db.prepare("SELECT DISTINCT material_no FROM bom_clean WHERE functional_loc = ?");
  const backlog = new Map<string, number>();
  for (const n of open) {
    for (const { material_no } of bomAt.all(n.f) as { material_no: string }[]) {
      const re = familyKeyword(family.get(material_no) ?? "");
      if (!re || !re.test(n.d)) continue;
      const perEvent = median(issueQty.get(material_no) ?? []) || 1;
      backlog.set(material_no, (backlog.get(material_no) ?? 0) + perEvent);
    }
  }

  bulk = { materials, orderQty: toMedian(poAll), orderQtyTrain: toMedian(poTrain), pmForward, backlog, openPoForward };
  return bulk;
}

const staticFns = (m: Material) => {
  const min = Math.max(0, m.min_qty);
  const max = Math.max(min, m.max_qty);
  return { minAt: () => min, maxAt: () => max };
};

/** Forward 12-month plan for one SKU: dynamic Min/Max per day vs today's BoM Min/Max, on expected demand. */
export function forwardPlan(m: Material, b: Bulk = load()) {
  const days = 365;
  const lead = Math.max(1, Math.round(m.lt_p50 || 30));
  const base = (m.fc_baseline_m || 0) / MONTH_DAYS;
  const pm = b.pmForward.get(m.material_no);
  const backlog = b.backlog.get(m.material_no) ?? 0;
  const forecast = Array.from({ length: days + lead }, (_, d) =>
    base + (pm?.get(d) ?? 0) + (d < BACKLOG_DAYS ? backlog / BACKLOG_DAYS : 0)
  );
  const ss = safetyStock(m, m.fc_baseline_m || 0, m.fc_baseline_sd || 0);
  const orderQty = Math.max(1, Math.ceil(b.orderQty.get(m.material_no) ?? (m.fc_baseline_m || 1)));
  const dyn = minMaxFns(forecast, lead, ss, orderQty);
  const po = b.openPoForward.get(m.material_no);
  const receipts = Array.from({ length: days }, (_, d) => po?.get(d) ?? 0);
  const common = { days, onHand: m.stock, demand: forecast, receipts, lead, price: m.price_idr || 0 };
  const dynamic = simulate({ ...common, ...dyn });
  const current = simulate({ ...common, ...staticFns(m) });
  const demandTotal = forecast.slice(0, days).reduce((a, x) => a + x, 0);
  return { lead, ss, orderQty, backlog, dyn, dynamic, current, receipts, demandTotal };
}

export function minMaxDetail(id: string) {
  const b = load();
  const m = b.materials.find((x) => x.material_no === id);
  if (!m) return null;
  const f = forwardPlan(m, b);
  const monthStart = (i: number) => dayIndex(new Date(Date.UTC(2026, 9 + i, 1)).toISOString().slice(0, 10), FORWARD_START);
  const months = Array.from({ length: 12 }, (_, i) => {
    const start = monthStart(i);
    const end = Math.min(364, monthStart(i + 1) - 1);
    return {
      month: isoDay(FORWARD_START, start).slice(0, 7),
      min: f.dyn.minAt(start),
      max: f.dyn.maxAt(start),
      stockDynamic: f.dynamic.path[end],
      stockCurrent: f.current.path[end],
    };
  });
  return {
    material: { material_no: m.material_no, unit: m.unit, criticality: m.criticality, stock: m.stock, min: m.min_qty, max: m.max_qty, price: m.price_idr },
    serviceLevel: SERVICE_LEVEL[m.criticality] ?? SERVICE_LEVEL.C,
    leadDays: f.lead,
    safetyStock: f.ss,
    orderQty: f.orderQty,
    backlogQty: f.backlog,
    openPoQty: f.receipts.reduce((a, b) => a + b, 0),
    minNow: f.dyn.minAt(0),
    maxNow: f.dyn.maxAt(0),
    minPeak: Math.max(...months.map((x) => x.min)),
    months,
    orders: f.dynamic.orders.slice(0, 6).map((o) => ({ date: isoDay(FORWARD_START, o.day), qty: o.qty, arrives: isoDay(FORWARD_START, o.arrives) })),
    compare: {
      dynamic: { stockoutDays: f.dynamic.stockoutDays, fillRate: f.dynamic.fillRate, avgValue: f.dynamic.avgValue },
      current: { stockoutDays: f.current.stockoutDays, fillRate: f.current.fillRate, avgValue: f.current.avgValue },
    },
  };
}

type PolicyTotals = { served: number; demand: number; stockoutSkuDays: number; skusWithStockout: number; avgValue: number; orders: number };
const emptyTotals = (): PolicyTotals => ({ served: 0, demand: 0, stockoutSkuDays: 0, skusWithStockout: 0, avgValue: 0, orders: 0 });
const addTotals = (t: PolicyTotals, r: ReturnType<typeof simulate>, demand: number) => {
  t.demand += demand;
  t.served += demand - r.unmet;
  t.stockoutSkuDays += r.stockoutDays;
  t.skusWithStockout += r.stockoutDays > 0 ? 1 : 0;
  t.avgValue += r.avgValue;
  t.orders += r.orders.length;
};
const finish = (t: PolicyTotals) => ({ ...t, fillRate: t.demand > 0 ? t.served / t.demand : 1 });

let summaryCache: ReturnType<typeof computeSummary> | null = null;
export function minMaxSummary() {
  summaryCache ??= computeSummary();
  return summaryCache;
}

function computeSummary() {
  const b = load();
  const byId = new Map(b.materials.map((m) => [m.material_no, m]));

  // ---- Backtest: replay May–Sep 2026 with actual daily issues, both policies start from the same reconstructed stock.
  const forecastTotal = new Map(
    (db.prepare("SELECT material_no, mind FROM fc_item_backtest").all() as { material_no: string; mind: number }[]).map((r) => [r.material_no, r.mind])
  );
  const actual = new Map<string, Map<number, number>>();
  const pmActual = new Map<string, Map<number, number>>();
  const issuedAfter = new Map<string, number>();
  for (const r of db
    .prepare("SELECT material_no, date, qty, component FROM fc_mv WHERE date >= ?")
    .all(BT_START) as { material_no: string; date: string; qty: number; component: string }[]) {
    if (!byId.has(r.material_no)) continue;
    issuedAfter.set(r.material_no, (issuedAfter.get(r.material_no) ?? 0) + r.qty);
    const d = dayIndex(r.date, BT_START);
    if (d < 0 || d >= BT_DAYS) continue;
    addDay(actual, r.material_no, d, r.qty);
    if (r.component === "pm") addDay(pmActual, r.material_no, d, r.qty); // PM work is planned, so known in advance
  }
  const receivedAfter = new Map<string, number>();
  const openAtStart = new Map<string, Map<number, number>>();
  for (const r of db
    .prepare("SELECT material_no, pr_date, po_delivery_date AS eta, qty FROM fc_po WHERE po_delivery_date >= ? AND po_delivery_date <= ?")
    .all(BT_START, AS_OF) as { material_no: string; pr_date: string; eta: string; qty: number }[]) {
    receivedAfter.set(r.material_no, (receivedAfter.get(r.material_no) ?? 0) + r.qty);
    if (r.pr_date < BT_START) addDay(openAtStart, r.material_no, dayIndex(r.eta, BT_START), r.qty);
  }
  // Training-only demand variability: monthly baseline May 2025–Apr 2026.
  const trainMonthly = new Map<string, number[]>();
  for (const r of db
    .prepare("SELECT material_no, month, qty FROM fc_monthly WHERE component = 'baseline' AND month < '2026-05'")
    .all() as { material_no: string; month: string; qty: number }[]) push(trainMonthly, r.material_no, r.qty);
  const sd = (v: number[]) => {
    const all = [...v, ...Array(Math.max(0, 12 - v.length)).fill(0)];
    const mean = all.reduce((a, x) => a + x, 0) / all.length;
    return Math.sqrt(all.reduce((a, x) => a + (x - mean) ** 2, 0) / Math.max(1, all.length - 1));
  };

  const bt = { static: emptyTotals(), dynamic: emptyTotals() };
  const btCritical = { static: emptyTotals(), dynamic: emptyTotals() };
  let btSkus = 0;
  for (const [id, days] of actual) {
    const m = byId.get(id)!;
    const demand = Array.from({ length: BT_DAYS }, (_, d) => days.get(d) ?? 0);
    const demandSum = demand.reduce((a, x) => a + x, 0);
    if (demandSum <= 0) continue;
    btSkus++;
    const lead = Math.max(1, Math.round(m.lt_p50 || 30));
    const perMonth = (forecastTotal.get(id) ?? 0) / 5;
    const pm = pmActual.get(id);
    const forecast = Array.from({ length: BT_DAYS + lead }, (_, d) => perMonth / MONTH_DAYS + (pm?.get(d) ?? 0));
    const ss = safetyStock(m, perMonth, sd(trainMonthly.get(id) ?? []));
    const orderQty = Math.max(1, Math.ceil(b.orderQtyTrain.get(id) ?? Math.max(1, perMonth)));
    const start = Math.max(0, m.stock + (issuedAfter.get(id) ?? 0) - (receivedAfter.get(id) ?? 0));
    const open = openAtStart.get(id);
    const receipts = Array.from({ length: BT_DAYS }, (_, d) => open?.get(d) ?? 0);
    const common = { days: BT_DAYS, onHand: start, demand, receipts, lead, price: m.price_idr || 0 };
    const rs = simulate({ ...common, ...staticFns(m) });
    const rd = simulate({ ...common, ...minMaxFns(forecast, lead, ss, orderQty) });
    addTotals(bt.static, rs, demandSum);
    addTotals(bt.dynamic, rd, demandSum);
    if (m.criticality === "S" || m.criticality === "A") {
      addTotals(btCritical.static, rs, demandSum);
      addTotals(btCritical.dynamic, rd, demandSum);
    }
  }

  // ---- Forward: every Stock Item, today's BoM Min/Max vs dynamic Min/Max on expected demand.
  const fwd = { static: emptyTotals(), dynamic: emptyTotals() };
  // Stock already above Max cannot be "un-bought" by a reorder policy; it is the capital a Reduce/redeploy review can release.
  const excess = { aboveDynamicMax: 0, aboveBomMax: 0, skusAboveDynamicMax: 0 };
  const rows = b.materials.map((m) => {
    const f = forwardPlan(m, b);
    addTotals(fwd.static, f.current, f.demandTotal);
    addTotals(fwd.dynamic, f.dynamic, f.demandTotal);
    const price = m.price_idr || 0;
    const overDyn = Math.max(0, m.stock - f.dyn.maxAt(0));
    excess.aboveDynamicMax += overDyn * price;
    excess.aboveBomMax += Math.max(0, m.stock - Math.max(m.min_qty, m.max_qty)) * price;
    if (overDyn > 0) excess.skusAboveDynamicMax++;
    return {
      material_no: m.material_no,
      description: m.description,
      unit: m.unit,
      criticality: m.criticality,
      stock: m.stock,
      bomMin: m.min_qty,
      bomMax: m.max_qty,
      minNow: f.dyn.minAt(0),
      maxNow: f.dyn.maxAt(0),
      firstOrder: f.dynamic.orders[0] ? { date: isoDay(FORWARD_START, f.dynamic.orders[0].day), qty: f.dynamic.orders[0].qty } : null,
      stockoutDaysCurrent: f.current.stockoutDays,
      stockoutDaysDynamic: f.dynamic.stockoutDays,
      capitalDelta: f.dynamic.avgValue - f.current.avgValue,
    };
  });

  const action = rows
    .filter((r) => r.stockoutDaysCurrent > r.stockoutDaysDynamic || r.capitalDelta < -1e6)
    .sort((a, b) => b.stockoutDaysCurrent - b.stockoutDaysDynamic - (a.stockoutDaysCurrent - a.stockoutDaysDynamic) || a.capitalDelta - b.capitalDelta)
    .slice(0, 40);

  return {
    backtest: {
      window: { start: BT_START, end: AS_OF },
      skus: btSkus,
      static: finish(bt.static),
      dynamic: finish(bt.dynamic),
      critical: { static: finish(btCritical.static), dynamic: finish(btCritical.dynamic) },
    },
    forward: { skus: rows.length, static: finish(fwd.static), dynamic: finish(fwd.dynamic), excess },
    rows: action,
  };
}
