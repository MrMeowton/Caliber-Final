import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/demand/sku?id=4100034704 — everything the SKU forecast panel needs
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") ?? "";
  try {
    const material = db.prepare("SELECT * FROM fc_material WHERE material_no = ?").get(id);
    if (!material) return NextResponse.json({ error: "Material not found" }, { status: 404 });
    const monthly = db
      .prepare("SELECT month, component, qty FROM fc_monthly WHERE material_no = ? ORDER BY month")
      .all(id);
    const backtest = db.prepare("SELECT * FROM fc_item_backtest WHERE material_no = ?").get(id) ?? null;
    const pmNeed = db
      .prepare(
        `SELECT n.due_date, n.installed_qty, n.expected_qty, o.functional_location, o.funcloc_descrip,
                o.item_text, o.kind, o.criticality
         FROM fc_pm_need n JOIN fc_pm_occ o USING (occ_id)
         WHERE n.material_no = ? AND n.due_date >= '2026-10-01' AND n.due_date <= '2027-09-30'
         ORDER BY n.due_date`
      )
      .all(id);
    const abnormal = db
      .prepare("SELECT date, qty, median_qty, ratio, prefix, component FROM fc_abnormal WHERE material_no = ? ORDER BY date")
      .all(id);
    const po = db
      .prepare(
        `SELECT pr_date, pr_delivery_date, po_delivery_date, qty, price_idr, supplier, lt, pr_type
         FROM fc_po WHERE material_no = ? ORDER BY pr_date`
      )
      .all(id);
    return NextResponse.json({ material, monthly, backtest, pmNeed, abnormal, po });
  } catch (e) {
    console.error("[api/demand/sku]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
