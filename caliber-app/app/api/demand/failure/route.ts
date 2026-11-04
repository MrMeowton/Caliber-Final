import { NextRequest, NextResponse } from "next/server";
import { failureBacktest } from "@/lib/demand/failure";
import { needFacts } from "@/lib/demand/need";

// GET /api/demand/failure?id=4100034704 — MTBF failure profile + stock projection for one SKU
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") ?? "";
  try {
    const facts = needFacts(id);
    if (!facts) return NextResponse.json({ error: "Material not found" }, { status: 404 });
    return NextResponse.json({ profile: facts.profile, projection: facts.projection, backtest: failureBacktest() });
  } catch (e) {
    console.error("[api/demand/failure]", e);
    return NextResponse.json({ error: "Unable to compute the failure profile." }, { status: 500 });
  }
}
