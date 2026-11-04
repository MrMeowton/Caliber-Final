import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/demand/skus?q=valve&cls=Lumpy&crit=SA&sort=fc&limit=50
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = `%${sp.get("q") ?? ""}%`;
  const cls = sp.get("cls") ?? "";
  const crit = (sp.get("crit") ?? "").toUpperCase().replace(/[^SABC]/g, "");
  const demandOnly = sp.get("demand") !== "0";
  const limit = Math.min(Number(sp.get("limit") ?? 60), 200);
  const sortMap: Record<string, string> = {
    fc: "fc_12m * COALESCE(price_idr,0) DESC",
    pm: "pm_need_90d DESC, pm_planned_12m DESC",
    abnormal: "abnormal_lines DESC",
    crit: "CASE criticality WHEN 'S' THEN 0 WHEN 'A' THEN 1 WHEN 'B' THEN 2 ELSE 3 END, fc_12m DESC",
  };
  const order = sortMap[sp.get("sort") ?? "fc"] ?? sortMap.fc;
  try {
    const rows = db
      .prepare(
        `SELECT material_no, description, unit, criticality, mrp_type, stock, min_qty, max_qty,
                demand_class, model, fc_12m, pm_planned_12m, pm_need_90d, price_idr, abnormal_lines, lt_p50
         FROM fc_material
         WHERE (material_no LIKE @q OR description LIKE @q)
           AND (@cls = '' OR demand_class = @cls)
           AND (@crit = '' OR instr(@crit, criticality) > 0)
           AND (@demandOnly = 0 OR tot_cons > 0 OR pm_planned_12m > 0)
         ORDER BY ${order}
         LIMIT @limit`
      )
      .all({ q, cls, crit, demandOnly: demandOnly ? 1 : 0, limit });
    return NextResponse.json({ count: rows.length, rows });
  } catch (e) {
    console.error("[api/demand/skus]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
