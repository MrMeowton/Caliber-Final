import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computeRaces, summarize, type RaceItem } from "@/lib/demand/race";
import { DOWNTIME_USD_PER_DAY, USD_IDR } from "@/lib/demand/format";

// GET /api/demand/race?asof=2026-08-01&horizon=90&crit=SA&limit=60
//
// Demand race: for every material needed by part-consuming PM jobs in the horizon, project
// stock from the as-of date (reconstructed stock + open POs − forecast baseline usage − PM
// kits) and find the first job the shelf cannot cover. That job date is the "need" line;
// the supply line is the next open PO, or "order today + median lead time" if none.

const SNAPSHOT_END = "2026-09-30";
const DAY = 86_400_000;

type NeedRow = {
  material_no: string;
  due_date: string;
  installed_qty: number;
  expected_qty: number;
  functional_location: string;
  funcloc_descrip: string;
  item_text: string;
};
type MatRow = {
  material_no: string;
  description: string;
  unit: string;
  criticality: string;
  mrp_type: string;
  stock: number;
  min_qty: number;
  max_qty: number;
  lt_p50: number;
  lt_p90: number;
  price_idr: number | null;
  fc_baseline_m: number;
  demand_class: string;
};

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const asof = /^\d{4}-\d{2}-\d{2}$/.test(sp.get("asof") ?? "") ? sp.get("asof")! : "2026-10-01";
  const horizon = Math.min(Math.max(Number(sp.get("horizon") ?? 90), 14), 180);
  const crit = (sp.get("crit") ?? "SA").toUpperCase().replace(/[^SABC]/g, "") || "SABC";
  const limit = Math.min(Number(sp.get("limit") ?? 60), 200);
  const stockOnly = sp.get("stock") !== "0";
  const q = `%${(sp.get("q") ?? "").trim()}%`;
  const asofMs = Date.parse(asof + "T00:00:00");
  const end = new Date(asofMs + horizon * DAY).toISOString().slice(0, 10);

  try {
    const needs = db
      .prepare(
        `SELECT n.material_no, n.due_date, n.installed_qty, n.expected_qty, o.functional_location, o.funcloc_descrip, o.item_text
         FROM fc_pm_need n JOIN fc_pm_occ o USING (occ_id)
         JOIN fc_material m ON m.material_no = n.material_no
         WHERE n.due_date >= @asof AND n.due_date <= @end AND instr(@crit, m.criticality) > 0
           AND (@stockOnly = 0 OR m.mrp_type = 'STOCK ITEM')
           AND (m.material_no LIKE @q OR m.description LIKE @q OR o.functional_location LIKE @q)
         ORDER BY n.due_date`
      )
      .all({ asof, end, crit, stockOnly: stockOnly ? 1 : 0, q }) as NeedRow[];

    const byMat = new Map<string, NeedRow[]>();
    for (const n of needs) {
      const list = byMat.get(n.material_no) ?? [];
      list.push(n);
      byMat.set(n.material_no, list);
    }
    const ids = [...byMat.keys()];
    if (ids.length === 0) {
      return NextResponse.json({ asof, horizon, items: [], summary: summarize([]), materials: 0 });
    }

    const tmp = JSON.stringify(ids);
    const mats = db
      .prepare(
        `SELECT material_no, description, unit, criticality, mrp_type, stock, min_qty, max_qty, lt_p50, lt_p90,
                price_idr, fc_baseline_m, demand_class
         FROM fc_material WHERE material_no IN (SELECT value FROM json_each(?))`
      )
      .all(tmp) as MatRow[];
    const issuesAfter = new Map(
      (db
        .prepare(
          `SELECT material_no, SUM(qty) AS q FROM fc_mv
           WHERE date > ? AND date <= ? AND material_no IN (SELECT value FROM json_each(?)) GROUP BY 1`
        )
        .all(asof, SNAPSHOT_END, tmp) as { material_no: string; q: number }[]).map((r) => [r.material_no, r.q])
    );
    const receiptsAfter = new Map(
      (db
        .prepare(
          `SELECT material_no, SUM(qty) AS q FROM fc_po
           WHERE po_delivery_date > ? AND po_delivery_date <= ? AND material_no IN (SELECT value FROM json_each(?)) GROUP BY 1`
        )
        .all(asof, SNAPSHOT_END, tmp) as { material_no: string; q: number }[]).map((r) => [r.material_no, r.q])
    );
    const openPo = db
      .prepare(
        `SELECT material_no, pr_date, po_delivery_date AS eta, qty, supplier FROM fc_po
         WHERE pr_date <= ? AND po_delivery_date > ? AND material_no IN (SELECT value FROM json_each(?))
         ORDER BY po_delivery_date`
      )
      .all(asof, asof, tmp) as { material_no: string; pr_date: string; eta: string; qty: number; supplier: string }[];
    const poByMat = new Map<string, typeof openPo>();
    for (const p of openPo) {
      const list = poByMat.get(p.material_no) ?? [];
      list.push(p);
      poByMat.set(p.material_no, list);
    }

    const items: RaceItem[] = [];
    for (const m of mats) {
      const jobs = byMat.get(m.material_no) ?? [];
      const stockAsof = Math.max(0, m.stock + (issuesAfter.get(m.material_no) ?? 0) - (receiptsAfter.get(m.material_no) ?? 0));
      const pos = poByMat.get(m.material_no) ?? [];
      const rate = (m.fc_baseline_m || 0) / 30.44; // forecast corrective usage per day

      // walk the jobs in date order and find the first one the shelf cannot cover.
      // Each job draws its EXPECTED quantity (installed qty x replacement probability of the PM type).
      let usedByJobs = 0;
      let shortJob: NeedRow | null = null;
      let shortfall = 0;
      for (const j of jobs) {
        const t = (Date.parse(j.due_date + "T00:00:00") - asofMs) / DAY;
        const received = pos.filter((p) => p.eta <= j.due_date).reduce((s, p) => s + p.qty, 0);
        const available = stockAsof + received - rate * t - usedByJobs;
        if (available < j.expected_qty) {
          shortJob = j;
          shortfall = Math.max(1, Math.ceil(j.expected_qty - available));
          break;
        }
        usedByJobs += j.expected_qty;
      }

      const needTotal = jobs.reduce((s, j) => s + j.expected_qty, 0);
      const kitTotal = jobs.reduce((s, j) => s + j.installed_qty, 0);
      const first = shortJob ?? jobs[0];
      const dueMs = Date.parse(first.due_date + "T00:00:00");
      const lateEta = shortJob ? pos.find((p) => p.eta >= shortJob!.due_date) : undefined;
      const usdDay = DOWNTIME_USD_PER_DAY[m.criticality] ?? DOWNTIME_USD_PER_DAY.C;
      const otherJobs = new Set(jobs.map((j) => j.functional_location)).size - 1;

      items.push({
        id: m.material_no,
        asset: first.functional_location.replace(/^P[XY]_|^UT_/, "") + (otherJobs > 0 ? ` +${otherJobs}` : ""),
        failure: { p10: dueMs - 3 * DAY, p50: dueMs, p90: dueMs + 7 * DAY },
        part: shortJob
          ? lateEta
            ? { name: m.description, leadTimeDays: Math.round(m.lt_p50), eta: lateEta.eta, orderedAt: lateEta.pr_date, supplier: lateEta.supplier }
            : { name: m.description, leadTimeDays: Math.round(m.lt_p50) }
          : { name: m.description, leadTimeDays: Math.round(m.lt_p50), inStock: true },
        downtimeCostPerDay: usdDay * USD_IDR,
        // context for the panel
        description: m.description,
        unit: m.unit,
        criticality: m.criticality,
        mrpType: m.mrp_type,
        demandClass: m.demand_class,
        stockSnapshot: m.stock,
        stockAsof,
        minQty: m.min_qty,
        maxQty: m.max_qty,
        leadP90: m.lt_p90,
        priceIdr: m.price_idr,
        baselinePerMonth: m.fc_baseline_m,
        needTotal,
        kitTotal,
        shortfall,
        shortJob: shortJob ? { ...shortJob } : null,
        jobs: jobs.slice(0, 8),
        jobCount: jobs.length,
        openPos: pos.slice(0, 4),
      });
    }

    const races = computeRaces(items, { now: asofMs, bufferDays: 3 });
    const summary = summarize(races);
    const order = new Map(races.map((r, i) => [r.id, i]));
    items.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

    return NextResponse.json({ asof, horizon, crit, stockOnly, materials: items.length, summary, items: items.slice(0, limit) });
  } catch (e) {
    console.error("[api/demand/race]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
