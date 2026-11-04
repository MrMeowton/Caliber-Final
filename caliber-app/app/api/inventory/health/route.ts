import { NextRequest, NextResponse } from "next/server";
import { inventoryHealth, type HealthCategory } from "@/lib/inventory/health";

type Filter = HealthCategory | "all" | "slowing";

function isFilter(value: string): value is Filter {
  return [
    "all",
    "slowing",
    "insurance",
    "obsolete",
    "nonMoving",
    "excess",
    "slowMoving",
    "healthy",
  ].includes(value);
}

// GET /api/inventory/health — excess, slow-moving, non-moving, potentially obsolete, insurance spares, aging
export async function GET(request: NextRequest) {
  const filter = request.nextUrl.searchParams.get("filter") ?? "all";
  if (!isFilter(filter)) {
    return NextResponse.json({ error: "Invalid inventory health filter." }, { status: 400 });
  }

  try {
    const health = inventoryHealth();
    const rows =
      filter === "all"
        ? health.rows.slice(0, 400)
        : filter === "slowing"
          ? health.rows.filter((row) => row.slowing)
          : health.rows.filter((row) => row.category === filter);
    return NextResponse.json({ ...health, rows });
  } catch (e) {
    console.error("[api/inventory/health]", e);
    return NextResponse.json({ error: "Unable to compute inventory health." }, { status: 500 });
  }
}
