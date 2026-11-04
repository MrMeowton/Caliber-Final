import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/demand/summary — KPIs, demand classes, backtest, site decomposition (history + forecast)
export async function GET(req: NextRequest) {
  const includeScatter = req.nextUrl.searchParams.get("scatter") !== "0";
  try {
    const kpiRows = db.prepare("SELECT key, value FROM fc_kpi").all() as { key: string; value: string }[];
    const kpi = Object.fromEntries(kpiRows.map((r) => [r.key, Number.isNaN(Number(r.value)) ? r.value : Number(r.value)]));
    const classes = db
      .prepare(
        `SELECT demand_class AS cls, COUNT(*) AS n, SUM(tot_cons > 0) AS consumed,
                SUM(criticality IN ('S','A')) AS critical, model
         FROM fc_material GROUP BY demand_class`
      )
      .all();
    const chosen = db.prepare("SELECT cls, model, wape, chosen FROM fc_model_select").all();
    const backtest = db.prepare("SELECT scope, model, label, wape, bias, n FROM fc_backtest").all();
    const site = db.prepare("SELECT * FROM fc_site_monthly ORDER BY month").all();
    const scatter = includeScatter
      ? db
          .prepare(
            `SELECT material_no AS id, adi, cv2, demand_class AS cls, criticality AS crit
             FROM fc_material WHERE tot_cons > 0`
          )
          .all()
      : [];
    return NextResponse.json({ kpi, classes, chosen, backtest, site, scatter });
  } catch (e) {
    console.error("[api/demand/summary]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
