import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { AS_OF, HISTORY_START, LAST_12M } from "@/lib/inventory/health";

const PAGE_SIZE = 100;
const MAX_PAGE = 100_000;

type QueryRow = {
  total_materials: number;
  in_stock: number;
  zero_stock: number;
  critical_zero: number;
  filtered_total: number;
  material_no: string | null;
  description: string | null;
  unit: string | null;
  mrp_type: string | null;
  criticality: string | null;
  stock: number | null;
  min_qty: number | null;
  max_qty: number | null;
  last_issue: string | null;
  issued_12m: number | null;
  cover_months: number | null;
  no_issue_12m: number | null;
  slow_moving: number | null;
};

function invalid(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = (searchParams.get("q") ?? "").trim();
  const page = Number(searchParams.get("page") ?? "1");
  const stockStatus = searchParams.get("stockStatus") ?? "";
  const criticality = searchParams.get("criticality") ?? "";
  const movement = searchParams.get("movement") ?? "";
  const mrpType = searchParams.get("mrpType") ?? "";

  if (query.length > 100) return invalid("Search text must be 100 characters or fewer.");
  if (!Number.isSafeInteger(page) || page < 1 || page > MAX_PAGE) {
    return invalid("Page must be a positive whole number.");
  }
  if (!["", "stocked", "zero", "below_min", "in_range", "above_max"].includes(stockStatus)) {
    return invalid("Invalid stock-status filter.");
  }
  if (!["", "S", "A", "B", "C"].includes(criticality)) {
    return invalid("Invalid criticality filter.");
  }
  if (!["", "slow", "no_issue"].includes(movement)) {
    return invalid("Invalid movement filter.");
  }
  if (!["", "STOCK ITEM", "NON STOCK"].includes(mrpType)) {
    return invalid("Invalid MRP-type filter.");
  }

  const conditions: string[] = [];
  const parameters: Record<string, string | number> = {
    historyStart: HISTORY_START,
    last12m: LAST_12M,
    asOf: AS_OF,
    pageSize: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  };

  if (query) {
    conditions.push("(material_no LIKE @search OR description LIKE @search)");
    parameters.search = `%${query}%`;
  }
  if (criticality) {
    conditions.push("criticality = @criticality");
    parameters.criticality = criticality;
  }
  if (mrpType) {
    conditions.push("mrp_type = @mrpType");
    parameters.mrpType = mrpType;
  }

  switch (stockStatus) {
    case "stocked":
      conditions.push("stock > 0");
      break;
    case "zero":
      conditions.push("stock = 0");
      break;
    case "below_min":
      conditions.push("mrp_type = 'STOCK ITEM' AND stock < min_qty");
      break;
    case "in_range":
      conditions.push(
        "mrp_type = 'STOCK ITEM' AND stock > 0 AND stock >= min_qty AND stock <= MAX(min_qty, max_qty)"
      );
      break;
    case "above_max":
      conditions.push(
        "mrp_type = 'STOCK ITEM' AND MAX(min_qty, max_qty) > 0 AND stock > MAX(min_qty, max_qty)"
      );
      break;
  }

  if (movement === "slow") conditions.push("slow_moving = 1 AND stock > 0");
  if (movement === "no_issue") conditions.push("no_issue_12m = 1 AND stock > 0");

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const sql = `
    WITH movement AS (
      SELECT
        material_no,
        MAX(date) AS last_issue,
        SUM(CASE WHEN date >= @last12m THEN qty ELSE 0 END) AS issued_12m
      FROM fc_mv
      WHERE date BETWEEN @historyStart AND @asOf
      GROUP BY material_no
    ),
    inventory AS (
      SELECT
        m.material_no,
        m.description,
        m.unit,
        m.mrp_type,
        m.criticality,
        m.stock,
        m.min_qty,
        m.max_qty,
        mv.last_issue,
        COALESCE(mv.issued_12m, 0) AS issued_12m,
        CASE
          WHEN COALESCE(mv.issued_12m, 0) > 0
          THEN m.stock / (mv.issued_12m / 12.0)
          ELSE NULL
        END AS cover_months,
        CASE
          WHEN mv.last_issue IS NULL OR mv.last_issue < @last12m THEN 1
          ELSE 0
        END AS no_issue_12m,
        CASE
          WHEN COALESCE(mv.issued_12m, 0) > 0
            AND m.stock / (mv.issued_12m / 12.0) > 12
          THEN 1
          ELSE 0
        END AS slow_moving
      FROM fc_material m
      LEFT JOIN movement mv ON mv.material_no = m.material_no
    ),
    filtered AS (
      SELECT * FROM inventory ${where}
    ),
    filtered_count AS (
      SELECT COUNT(*) AS filtered_total FROM filtered
    ),
    page_rows AS (
      SELECT * FROM filtered
      ORDER BY material_no
      LIMIT @pageSize OFFSET @offset
    ),
    totals AS (
      SELECT
        COUNT(*) AS total_materials,
        SUM(CASE WHEN stock > 0 THEN 1 ELSE 0 END) AS in_stock,
        SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) AS zero_stock,
        SUM(CASE WHEN stock = 0 AND criticality IN ('S', 'A') THEN 1 ELSE 0 END) AS critical_zero
      FROM inventory
    )
    SELECT
      totals.total_materials,
      totals.in_stock,
      totals.zero_stock,
      totals.critical_zero,
      filtered_count.filtered_total,
      page_rows.material_no,
      page_rows.description,
      page_rows.unit,
      page_rows.mrp_type,
      page_rows.criticality,
      page_rows.stock,
      page_rows.min_qty,
      page_rows.max_qty,
      page_rows.last_issue,
      page_rows.issued_12m,
      page_rows.cover_months,
      page_rows.no_issue_12m,
      page_rows.slow_moving
    FROM totals
    CROSS JOIN filtered_count
    LEFT JOIN page_rows ON 1 = 1`;

  try {
    const result = db.prepare(sql).all(parameters) as QueryRow[];
    const first = result[0];
    if (!first) throw new Error("The inventory query returned no summary row.");

    const pages = Math.max(1, Math.ceil(first.filtered_total / PAGE_SIZE));
    if (page > pages) return invalid("Requested page is outside the result set.");

    const rows = result
      .filter((row): row is QueryRow & { material_no: string } => row.material_no !== null)
      .map((row) => ({
        materialNo: row.material_no,
        description: row.description,
        unit: row.unit,
        mrpType: row.mrp_type,
        criticality: row.criticality,
        stock: row.stock,
        minQty: row.min_qty,
        maxQty: row.max_qty,
        lastIssue: row.last_issue,
        issued12m: row.issued_12m,
        coverMonths: row.cover_months,
        noIssue12m: row.no_issue_12m === 1,
        slowMoving: row.slow_moving === 1,
      }));

    return NextResponse.json({
      asOf: AS_OF,
      page,
      pageSize: PAGE_SIZE,
      pages,
      total: first.filtered_total,
      summary: {
        totalMaterials: first.total_materials,
        inStock: first.in_stock,
        zeroStock: first.zero_stock,
        criticalZero: first.critical_zero,
      },
      rows,
    });
  } catch (error) {
    console.error("[api/inventory/warehouse]", error);
    return NextResponse.json(
      { error: "Unable to load warehouse stock." },
      { status: 500 }
    );
  }
}
