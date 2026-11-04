// Inventory health: classify every part that holds stock, as of the data snapshot (30 Sep 2026).
// Movement history covers May 2025 – Sep 2026 (17 months), so the 24-month obsolete rule cannot be measured.
import { db } from "@/lib/db";

export const AS_OF = "2026-09-30";
export const HISTORY_START = "2025-05-01";
export const LAST_12M = "2025-10-01";
const RECENT_6M = "2026-04-01";
const DAY_MS = 86_400_000;
const MONTH_DAYS = 30.44;

export type HealthCategory = "insurance" | "obsolete" | "nonMoving" | "excess" | "slowMoving" | "healthy";

export const CATEGORY_META: Record<HealthCategory, { label: string; action: string }> = {
  excess: { label: "Excess", action: "Stop reordering; reduce to Max (or the insurance floor) and redeploy the surplus" },
  slowMoving: { label: "Slow-moving", action: "Lower Min/Max; stock lasts more than a year at current use" },
  nonMoving: { label: "Non-moving", action: "Redeploy, return to vendor or review the Min/Max" },
  obsolete: { label: "Potentially obsolete", action: "Engineering review for disposal or write-off" },
  insurance: { label: "Insurance spare", action: "Keep: critical S/A spare, hold a floor of 1–2 units" },
  healthy: { label: "Healthy", action: "No action" },
};

type Material = {
  material_no: string; description: string; unit: string; criticality: string; mrp_type: string;
  stock: number; min_qty: number; max_qty: number; price_idr: number; price_imputed: number;
};

const monthsBetween = (a: string, b: string) => (Date.parse(b) - Date.parse(a)) / DAY_MS / MONTH_DAYS;

let cache: ReturnType<typeof compute> | null = null;
export function inventoryHealth() {
  cache ??= compute();
  return cache;
}

function compute() {
  const materials = db
    .prepare(
      `SELECT material_no, description, unit, criticality, mrp_type, stock, min_qty, max_qty, price_idr, price_imputed
       FROM fc_material WHERE stock > 0`
    )
    .all() as Material[];

  const issues = new Map<string, { last: string; qty12: number; qtyRecent: number; qtyPrior: number }>();
  for (const r of db
    .prepare("SELECT material_no, date, qty FROM fc_mv WHERE date BETWEEN ? AND ?")
    .all(HISTORY_START, AS_OF) as { material_no: string; date: string; qty: number }[]) {
    const s = issues.get(r.material_no) ?? { last: r.date, qty12: 0, qtyRecent: 0, qtyPrior: 0 };
    if (r.date > s.last) s.last = r.date;
    if (r.date >= LAST_12M) s.qty12 += r.qty;
    if (r.date >= RECENT_6M) s.qtyRecent += r.qty;
    else s.qtyPrior += r.qty;
    issues.set(r.material_no, s);
  }
  const pmNeed = new Map(
    (db
      .prepare("SELECT material_no, SUM(expected_qty) AS q FROM fc_pm_need WHERE due_date BETWEEN '2026-10-01' AND '2027-09-30' GROUP BY 1")
      .all() as { material_no: string; q: number }[]).map((r) => [r.material_no, r.q])
  );
  const openPo = new Map(
    (db
      .prepare("SELECT material_no, SUM(qty) AS q FROM fc_po WHERE pr_date <= ? AND po_delivery_date > ? GROUP BY 1")
      .all(AS_OF, AS_OF) as { material_no: string; q: number }[]).map((r) => [r.material_no, r.q])
  );

  const recentMonths = monthsBetween(RECENT_6M, AS_OF);
  const priorMonths = monthsBetween(HISTORY_START, RECENT_6M);

  const rows = materials.map((m) => {
    const s = issues.get(m.material_no);
    const price = m.price_idr || 0;
    const value = m.stock * price;
    const pm = pmNeed.get(m.material_no) ?? 0;
    const po = openPo.get(m.material_no) ?? 0;
    const critical = m.criticality === "S" || m.criticality === "A";
    const movedIn12 = !!s && s.last >= LAST_12M;
    const coverMonths = s && s.qty12 > 0 ? m.stock / (s.qty12 / 12) : null;
    // Slow-moving alert: recent monthly use fell below 30% of the earlier rate.
    const slowing = !!s && s.qtyPrior > 0 && s.qtyRecent / recentMonths < 0.3 * (s.qtyPrior / priorMonths);
    const max = Math.max(m.min_qty, m.max_qty);

    let category: HealthCategory;
    let atRisk = 0; // value a review could release
    // A critical spare that never moves is insurance, but only up to a floor (BoM Max, at least 2 units).
    const insuranceFloor = Math.max(2, max);
    if (!movedIn12 && critical && m.stock > insuranceFloor) { category = "excess"; atRisk = (m.stock - insuranceFloor) * price; }
    else if (!movedIn12 && critical) category = "insurance";
    else if (!s && pm === 0 && po === 0) { category = "obsolete"; atRisk = value; }
    else if (!movedIn12) { category = "nonMoving"; atRisk = value; }
    else if (m.mrp_type === "STOCK ITEM" && max > 0 && m.stock > max) { category = "excess"; atRisk = (m.stock - max) * price; }
    else if (coverMonths !== null && coverMonths > 12) { category = "slowMoving"; atRisk = (m.stock - (s?.qty12 ?? 0)) * price; }
    else category = "healthy";

    return {
      material_no: m.material_no,
      description: m.description,
      unit: m.unit,
      criticality: m.criticality,
      mrpType: m.mrp_type,
      stock: m.stock,
      bomMax: max,
      unitPriceIdr: price,
      value,
      priceImputed: m.price_imputed === 1,
      lastIssue: s?.last ?? null,
      monthsSinceIssue: s ? monthsBetween(s.last, AS_OF) : null,
      issued12m: s?.qty12 ?? 0,
      coverMonths,
      slowing,
      pmNext12m: pm,
      openPo: po,
      category,
      atRisk: Math.max(0, atRisk),
      action: CATEGORY_META[category].action,
    };
  });

  const categories = (Object.keys(CATEGORY_META) as HealthCategory[]).map((key) => {
    const list = rows.filter((r) => r.category === key);
    return {
      key,
      label: CATEGORY_META[key].label,
      action: CATEGORY_META[key].action,
      skus: list.length,
      value: list.reduce((a, r) => a + r.value, 0),
      atRisk: list.reduce((a, r) => a + r.atRisk, 0),
    };
  });

  const buckets = [
    { label: "≤ 3 months", test: (m: number | null) => m !== null && m <= 3 },
    { label: "3–6 months", test: (m: number | null) => m !== null && m > 3 && m <= 6 },
    { label: "6–12 months", test: (m: number | null) => m !== null && m > 6 && m <= 12 },
    { label: "12–17 months", test: (m: number | null) => m !== null && m > 12 && m <= 17 },
  ];
  const aging = buckets.map((b) => {
    const list = rows.filter((r) => b.test(r.monthsSinceIssue));
    return { bucket: b.label, skus: list.length, value: list.reduce((a, r) => a + r.value, 0) };
  });

  const noIssue = rows.filter((r) => r.monthsSinceIssue === null).sort((a, b) => b.value - a.value);
  const imputed = rows.filter((r) => r.priceImputed);
  const flagged = rows.filter((r) => r.category !== "healthy" || r.slowing).sort((a, b) => b.atRisk - a.atRisk || b.value - a.value);

  return {
    asOf: AS_OF,
    historyStart: HISTORY_START,
    historyMonths: Math.round(monthsBetween(HISTORY_START, AS_OF)),
    totals: { skus: rows.length, value: rows.reduce((a, r) => a + r.value, 0) },
    noIssue: {
      skus: noIssue.length,
      value: noIssue.reduce((a, r) => a + r.value, 0),
      parts: noIssue.slice(0, 5).map((r) => ({
        material_no: r.material_no,
        description: r.description,
        unit: r.unit,
        stock: r.stock,
        unitPriceIdr: r.unitPriceIdr,
        value: r.value,
        priceImputed: r.priceImputed,
      })),
    },
    pricing: {
      imputedSkus: imputed.length,
      imputedValue: imputed.reduce((a, r) => a + r.value, 0),
    },
    categories,
    slowing: { skus: rows.filter((r) => r.slowing).length, value: rows.filter((r) => r.slowing).reduce((a, r) => a + r.value, 0) },
    aging,
    rows: flagged,
  };
}
