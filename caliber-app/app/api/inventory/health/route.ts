import { NextResponse } from "next/server";
import { inventoryHealth } from "@/lib/inventory/health";

// GET /api/inventory/health — excess, slow-moving, non-moving, potentially obsolete, insurance spares, aging
export async function GET() {
  try {
    return NextResponse.json(inventoryHealth());
  } catch (e) {
    console.error("[api/inventory/health]", e);
    return NextResponse.json({ error: "Unable to compute inventory health." }, { status: 500 });
  }
}
