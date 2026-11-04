import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computeRaces, type RaceItem } from "@/lib/demand/race";
import { GET as raceGET } from "@/app/api/demand/race/route";
import { inventoryHealth } from "@/lib/inventory/health";
import { minMaxSummary } from "@/lib/demand/minmax";

// GET /api/today — the three decisions for the home page, plus the supporting signals.
const AS_OF = "2026-09-30";
const LAST_12M = "2025-10-01";

type Row = Record<string, unknown>;

export async function GET(req: NextRequest) {
  try {
    // 1. Critical parts (S/A Stock Items) at zero stock although the plant has used them before.
    const stockout = db
      .prepare(
        `SELECT m.material_no, m.description, m.unit, m.criticality, m.lt_p50, m.price_idr,
                (SELECT MAX(date) FROM fc_mv v WHERE v.material_no = m.material_no) AS last_issue,
                (SELECT SUM(qty) FROM fc_mv v WHERE v.material_no = m.material_no) AS issued_17m,
                (SELECT SUM(expected_qty) FROM fc_pm_need n WHERE n.material_no = m.material_no AND n.due_date BETWEEN '2026-10-01' AND '2026-12-29') AS pm_90d,
                (SELECT MIN(po_delivery_date) FROM fc_po p WHERE p.material_no = m.material_no AND p.pr_date <= @asof AND p.po_delivery_date > @asof) AS open_po_eta
         FROM fc_material m
         WHERE m.criticality IN ('S','A') AND m.mrp_type = 'STOCK ITEM' AND m.stock <= 0
           AND EXISTS (SELECT 1 FROM fc_mv v WHERE v.material_no = m.material_no)
         ORDER BY (pm_90d IS NULL), m.criticality DESC, last_issue DESC`
      )
      .all({ asof: AS_OF }) as Row[];
    const leadTimes = stockout.map((r) => Number(r.lt_p50)).sort((a, b) => a - b);

    // 2. Money still being spent on parts that are already above their Max.
    const overstock = db
      .prepare(
        `SELECT m.material_no, m.description, m.unit, m.criticality, m.stock, m.max_qty, m.price_idr,
                (m.stock - m.max_qty) * m.price_idr AS excess_value,
                (SELECT SUM(p.qty * p.price_idr) FROM fc_po p WHERE p.material_no = m.material_no AND p.pr_date >= @from) AS spend_12m,
                (SELECT SUM(p.qty * p.price_idr) FROM fc_po p WHERE p.material_no = m.material_no AND p.pr_date <= @asof AND p.po_delivery_date > @asof) AS open_po_value,
                (SELECT COUNT(*) FROM fc_po p WHERE p.material_no = m.material_no AND p.pr_date <= @asof AND p.po_delivery_date > @asof) AS open_po_lines
         FROM fc_material m
         WHERE m.mrp_type = 'STOCK ITEM' AND m.max_qty > 0 AND m.stock > m.max_qty`
      )
      .all({ from: LAST_12M, asof: AS_OF }) as Row[];
    const bought = overstock.filter((r) => Number(r.spend_12m) > 0).sort((a, b) => Number(b.spend_12m) - Number(a.spend_12m));
    const openPo = overstock.filter((r) => Number(r.open_po_lines) > 0);
    const sum = (rows: Row[], k: string) => rows.reduce((a, r) => a + (Number(r[k]) || 0), 0);

    // 3. October maintenance jobs that will wait: same race logic as Forecast → "Will the part arrive before the job?".
    const raceRes = await raceGET(
      new NextRequest(new URL("/api/demand/race?asof=2026-10-01&horizon=31&crit=SA&limit=200", req.url))
    );
    const race = (await raceRes.json()) as { items: (RaceItem & { shortJob: Row | null; description: string; criticality: string })[] };
    const results = computeRaces(race.items, { now: Date.parse("2026-10-01T00:00:00"), bufferDays: 3 });
    const byId = new Map(race.items.map((i) => [i.id, i]));
    const jobs = new Map<string, Row>();
    for (const r of results) {
      const item = byId.get(r.id);
      const job = item?.shortJob;
      if (r.status !== "late" || !job || !String(job.due_date).startsWith("2026-10")) continue;
      const key = `${job.functional_location}|${job.due_date}|${job.item_text}`;
      const existing = jobs.get(key);
      const part = { material_no: r.id, description: item.description, criticality: item.criticality, waitDays: r.waitDays };
      if (existing) (existing.parts as unknown[]).push(part);
      else jobs.set(key, { due_date: job.due_date, functional_location: job.functional_location, item_text: job.item_text, waitDays: r.waitDays, exposure: r.exposure, parts: [part] });
    }
    const lateJobs = [...jobs.values()].sort((a, b) => String(a.due_date).localeCompare(String(b.due_date)));

    const health = inventoryHealth();
    const minmax = minMaxSummary();
    const kpi = Object.fromEntries((db.prepare("SELECT key, value FROM fc_kpi").all() as { key: string; value: string }[]).map((r) => [r.key, Number(r.value)]));

    return NextResponse.json({
      asOf: AS_OF,
      stockout: {
        count: stockout.length,
        neededByPm90d: stockout.filter((r) => Number(r.pm_90d) > 0).length,
        withOpenPo: stockout.filter((r) => r.open_po_eta).length,
        medianLeadDays: leadTimes.length ? leadTimes[Math.floor(leadTimes.length / 2)] : null,
        items: stockout.slice(0, 6),
      },
      overstock: {
        parts: overstock.length,
        boughtParts: bought.length,
        spend12m: sum(bought, "spend_12m"),
        excessValue: sum(overstock, "excess_value"),
        openPoParts: openPo.length,
        openPoValue: sum(openPo, "open_po_value"),
        items: bought.slice(0, 6),
      },
      lateJobs: {
        count: lateJobs.length,
        exposure: lateJobs.reduce((a, j) => a + (Number(j.exposure) || 0), 0),
        items: lateJobs.slice(0, 6),
      },
      signals: {
        slowing: health.slowing.skus,
        releasable: health.categories.reduce((a, c) => a + c.atRisk, 0),
        wapeStatic: kpi.wape_static,
        wapeMind: kpi.wape_mind,
        fillStatic: minmax.backtest.static.fillRate,
        fillDynamic: minmax.backtest.dynamic.fillRate,
      },
    });
  } catch (e) {
    console.error("[api/today]", e);
    return NextResponse.json({ error: "Unable to compute today's decisions." }, { status: 500 });
  }
}
