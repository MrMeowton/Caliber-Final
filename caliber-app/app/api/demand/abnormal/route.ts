import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/demand/abnormal?limit=100&crit=SA — issue lines > 5x the item's median quantity
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const limit = Math.min(Number(sp.get("limit") ?? 100), 500);
  const crit = (sp.get("crit") ?? "").toUpperCase().replace(/[^SABC]/g, "");
  try {
    const rows = db
      .prepare(
        `SELECT * FROM fc_abnormal
         WHERE (@crit = '' OR instr(@crit, criticality) > 0)
         ORDER BY COALESCE(value_idr, 0) DESC LIMIT @limit`
      )
      .all({ crit, limit });
    const byMonth = db
      .prepare(
        `SELECT substr(date,1,7) AS month, COUNT(*) AS n, SUM(component = 'event') AS event_n,
                SUM(COALESCE(value_idr,0)) AS value_idr
         FROM fc_abnormal GROUP BY 1 ORDER BY 1`
      )
      .all();
    const byComponent = db
      .prepare("SELECT component, COUNT(*) AS n FROM fc_abnormal GROUP BY 1")
      .all();
    const total = db.prepare("SELECT COUNT(*) AS n, SUM(COALESCE(value_idr,0)) AS v FROM fc_abnormal").get();
    return NextResponse.json({ total, rows, byMonth, byComponent });
  } catch (e) {
    console.error("[api/demand/abnormal]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
