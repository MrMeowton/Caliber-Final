import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/bom?q=valve&functional_loc=PX_1&below_min=1&limit=50&offset=0
export async function GET(req: NextRequest) {
    const sp = req.nextUrl.searchParams;
    const q = `%${sp.get("q") ?? ""}%`;
    const fl = `%${sp.get("functional_loc") ?? ""}%`;
    const limit = Math.min(Number(sp.get("limit") ?? 50), 500);
    const offset = Number(sp.get("offset") ?? 0);
    const belowMin = sp.get("below_min") === "1" ? 1 : 0;

    try {
        const rows = db
            .prepare(
                `SELECT functional_loc, material_no, material_desc, installed_qty,
                unit, min_qty, max_qty, stock, mrp_type
         FROM bom_clean
         WHERE (material_no LIKE @q OR material_desc LIKE @q)
           AND functional_loc LIKE @fl
           AND (@belowMin = 0 OR stock < min_qty)
         ORDER BY functional_loc, material_no
         LIMIT @limit OFFSET @offset`
            )
            .all({ q, fl, belowMin, limit, offset });

        return NextResponse.json({ count: rows.length, rows });
    } catch (e) {
        console.error("[api/bom]", e);
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}