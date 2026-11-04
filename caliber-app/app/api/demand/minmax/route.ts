import { NextRequest, NextResponse } from "next/server";
import { minMaxDetail, minMaxSummary } from "@/lib/demand/minmax";

// GET /api/demand/minmax?id=4100034704 → one SKU's 12-month dynamic Min/Max plan
// GET /api/demand/minmax              → backtest (May–Sep 2026) + forward comparison + top SKUs to change
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  try {
    if (id) {
      const detail = minMaxDetail(id);
      if (!detail) return NextResponse.json({ error: "Not a Stock Item: dynamic Min/Max applies to stocked parts only." }, { status: 404 });
      return NextResponse.json(detail);
    }
    return NextResponse.json(minMaxSummary());
  } catch (e) {
    console.error("[api/demand/minmax]", e);
    return NextResponse.json({ error: "Unable to compute dynamic Min/Max." }, { status: 500 });
  }
}
