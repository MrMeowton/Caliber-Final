import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/demand/pm-calendar?month=2026-10 — 12-month PM-driven part demand + jobs for one month
export async function GET(req: NextRequest) {
  const month = req.nextUrl.searchParams.get("month") ?? "";
  try {
    const months = db
      .prepare(
        `SELECT substr(o.due_date,1,7) AS month,
                COUNT(DISTINCT o.occ_id) AS jobs,
                COUNT(DISTINCT CASE WHEN o.p_replace > 0 THEN o.occ_id END) AS part_jobs
         FROM fc_pm_occ o
         WHERE o.due_date BETWEEN '2026-10-01' AND '2027-09-30'
         GROUP BY 1 ORDER BY 1`
      )
      .all() as { month: string; jobs: number; part_jobs: number }[];
    const parts = db
      .prepare(
        `SELECT substr(n.due_date,1,7) AS month,
                COUNT(DISTINCT n.material_no) AS materials,
                SUM(n.expected_qty * COALESCE(m.price_idr,0)) AS expected_idr,
                SUM(n.installed_qty * COALESCE(m.price_idr,0)) AS kit_idr,
                COUNT(DISTINCT CASE WHEN m.mrp_type = 'STOCK ITEM' AND m.stock < n.installed_qty
                                     AND m.criticality IN ('S','A') THEN n.material_no END) AS critical_short
         FROM fc_pm_need n JOIN fc_material m USING (material_no)
         WHERE n.due_date BETWEEN '2026-10-01' AND '2027-09-30'
         GROUP BY 1 ORDER BY 1`
      )
      .all() as Record<string, number | string>[];
    const pm = new Map(parts.map((p) => [p.month as string, p]));
    const calendar = months.map((m) => ({ ...m, ...(pm.get(m.month) ?? {}) }));
    const kinds = db
      .prepare(
        `SELECT kind, p_replace, COUNT(*) AS n FROM fc_pm_occ
         WHERE due_date BETWEEN '2026-10-01' AND '2027-09-30' GROUP BY 1,2 ORDER BY n DESC`
      )
      .all();
    const sel = month || calendar[0]?.month || "2026-10";
    const jobs = db
      .prepare(
        `SELECT o.due_date, o.functional_location, o.funcloc_descrip, o.item_text, o.kind, o.criticality,
                COUNT(n.material_no) AS materials,
                SUM(n.installed_qty * COALESCE(m.price_idr,0)) AS kit_idr,
                SUM(CASE WHEN m.mrp_type = 'STOCK ITEM' AND m.stock < n.installed_qty THEN 1 ELSE 0 END) AS short_items
         FROM fc_pm_occ o
         JOIN fc_pm_need n USING (occ_id)
         JOIN fc_material m ON m.material_no = n.material_no
         WHERE substr(o.due_date,1,7) = ?
         GROUP BY o.occ_id
         ORDER BY short_items DESC,
                  CASE o.criticality WHEN 'S' THEN 0 WHEN 'A' THEN 1 WHEN 'B' THEN 2 ELSE 3 END, o.due_date
         LIMIT 60`
      )
      .all(sel);
    return NextResponse.json({ calendar, kinds, month: sel, jobs });
  } catch (e) {
    console.error("[api/demand/pm-calendar]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
