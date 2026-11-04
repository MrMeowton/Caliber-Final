import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getWritableDb } from "@/lib/db-write";
import {
  idrUnitPrices,
  type PurchasePriceRow,
} from "@/lib/inventory/pricing";

type DraftInput = {
  functionalLoc: string;
  materialNo: string;
  quantity: number;
};

type BomRow = {
  functionalLoc: string;
  materialNo: string;
  description: string | null;
  stock: number | null;
  maxQty: number | null;
  unit: string | null;
  mrpType: string | null;
};

type PricedDraftItem = DraftInput & {
  description: string;
  stock: number;
  maxQty: number;
  unit: string;
  unitPriceIdr: number | null;
  priceDate: string | null;
  estimatedTotalIdr: number | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function ensureDraftTables() {
  const writableDb = getWritableDb();
  writableDb.exec(`
    CREATE TABLE IF NOT EXISTS reorder_estimates (
      id TEXT PRIMARY KEY NOT NULL,
      created_at TEXT NOT NULL,
      currency TEXT NOT NULL CHECK (currency = 'IDR'),
      total_estimated_idr INTEGER NOT NULL,
      unpriced_item_count INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reorder_estimate_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      estimate_id TEXT NOT NULL REFERENCES reorder_estimates(id) ON DELETE CASCADE,
      functional_loc TEXT NOT NULL,
      material_no TEXT NOT NULL,
      description TEXT NOT NULL,
      quantity REAL NOT NULL CHECK (quantity > 0),
      unit TEXT NOT NULL,
      stock_at_estimate REAL NOT NULL,
      max_qty REAL NOT NULL,
      estimated_unit_price_idr REAL,
      price_date TEXT,
      estimated_total_idr INTEGER,
      UNIQUE (estimate_id, functional_loc, material_no)
    );

    CREATE INDEX IF NOT EXISTS reorder_estimate_items_estimate_id_idx
      ON reorder_estimate_items (estimate_id);
  `);
  return writableDb;
}

export async function GET() {
  try {
    const tables = db
      .prepare(
        `SELECT name FROM sqlite_master
         WHERE type = 'table'
           AND name IN ('reorder_estimates', 'reorder_estimate_items')`
      )
      .all() as Array<{ name: string }>;
    if (tables.length !== 2) {
      return NextResponse.json({ estimates: [] });
    }

    type EstimateRow = {
      id: string;
      createdAt: string;
      currency: string;
      totalEstimatedIdr: number;
      unpricedItemCount: number;
      itemId: number | null;
      functionalLoc: string | null;
      materialNo: string | null;
      description: string | null;
      quantity: number | null;
      unit: string | null;
      stockAtEstimate: number | null;
      maxQty: number | null;
      estimatedUnitPriceIdr: number | null;
      priceDate: string | null;
      estimatedTotalIdr: number | null;
    };
    type Estimate = Omit<EstimateRow, "itemId" | "functionalLoc" | "materialNo" | "description" | "quantity" | "unit" | "stockAtEstimate" | "maxQty" | "estimatedUnitPriceIdr" | "priceDate" | "estimatedTotalIdr"> & {
      items: Array<{
        id: number;
        functionalLoc: string;
        materialNo: string;
        description: string;
        quantity: number;
        unit: string;
        stockAtEstimate: number;
        maxQty: number;
        estimatedUnitPriceIdr: number | null;
        priceDate: string | null;
        estimatedTotalIdr: number | null;
      }>;
    };
    const rows = db
      .prepare(
        `SELECT
           e.id,
           e.created_at AS createdAt,
           e.currency,
           e.total_estimated_idr AS totalEstimatedIdr,
           e.unpriced_item_count AS unpricedItemCount,
           i.id AS itemId,
           i.functional_loc AS functionalLoc,
           i.material_no AS materialNo,
           i.description,
           i.quantity,
           i.unit,
           i.stock_at_estimate AS stockAtEstimate,
           i.max_qty AS maxQty,
           i.estimated_unit_price_idr AS estimatedUnitPriceIdr,
           i.price_date AS priceDate,
           i.estimated_total_idr AS estimatedTotalIdr
         FROM reorder_estimates e
         LEFT JOIN reorder_estimate_items i ON i.estimate_id = e.id
         ORDER BY e.created_at DESC, i.id ASC`
      )
      .all() as EstimateRow[];

    const estimates = new Map<string, Estimate>();
    for (const row of rows) {
      let estimate = estimates.get(row.id);
      if (!estimate) {
        estimate = {
          id: row.id,
          createdAt: row.createdAt,
          currency: row.currency,
          totalEstimatedIdr: row.totalEstimatedIdr,
          unpricedItemCount: row.unpricedItemCount,
          items: [],
        };
        estimates.set(row.id, estimate);
      }
      if (row.itemId !== null) {
        estimate.items.push({
          id: row.itemId,
          functionalLoc: row.functionalLoc ?? "",
          materialNo: row.materialNo ?? "",
          description: row.description ?? "",
          quantity: row.quantity ?? 0,
          unit: row.unit ?? "",
          stockAtEstimate: row.stockAtEstimate ?? 0,
          maxQty: row.maxQty ?? 0,
          estimatedUnitPriceIdr: row.estimatedUnitPriceIdr,
          priceDate: row.priceDate,
          estimatedTotalIdr: row.estimatedTotalIdr,
        });
      }
    }

    return NextResponse.json({ estimates: [...estimates.values()] });
  } catch (error) {
    console.error("[api/inventory/reorder-drafts GET]", error);
    return NextResponse.json(
      { error: "Unable to load saved reorder estimates from the local database." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (process.env.VERCEL) {
    return NextResponse.json(
      { error: "Local SQLite estimate drafts are not persistent on Vercel." },
      { status: 503 }
    );
  }

  if (!request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json(
      { error: "Send reorder items as application/json." },
      { status: 415 }
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (
    !isRecord(payload) ||
    !Array.isArray(payload.items) ||
    payload.items.length === 0 ||
    payload.items.length > 1000
  ) {
    return NextResponse.json(
      { error: "Choose between 1 and 1,000 reorder items." },
      { status: 400 }
    );
  }

  const inputs: DraftInput[] = [];
  const keys = new Set<string>();
  for (const item of payload.items) {
    if (
      !isRecord(item) ||
      typeof item.functionalLoc !== "string" ||
      !item.functionalLoc.trim() ||
      item.functionalLoc.length > 200 ||
      typeof item.materialNo !== "string" ||
      !item.materialNo.trim() ||
      item.materialNo.length > 100 ||
      typeof item.quantity !== "number" ||
      !Number.isSafeInteger(item.quantity) ||
      item.quantity <= 0
    ) {
      return NextResponse.json(
        { error: "Each item needs a location, material number, and positive whole-number quantity." },
        { status: 400 }
      );
    }

    const input = {
      functionalLoc: item.functionalLoc.trim(),
      materialNo: item.materialNo.trim(),
      quantity: item.quantity,
    };
    const key = `${input.functionalLoc}\u0000${input.materialNo}`;
    if (keys.has(key)) {
      return NextResponse.json(
        { error: "A reorder draft cannot contain the same part and location twice." },
        { status: 400 }
      );
    }
    keys.add(key);
    inputs.push(input);
  }

  try {
    const findBom = db.prepare(
      `SELECT
         b.functional_loc AS functionalLoc,
         b.material_no AS materialNo,
         b.material_desc AS description,
         b.stock AS stock,
         b.max_qty AS maxQty,
         b.unit AS unit,
         b.mrp_type AS mrpType
       FROM bom_clean b
       WHERE b.functional_loc = ? AND b.material_no = ?`
    );

    const verified: Array<
      Omit<DraftInput & BomRow, "stock" | "maxQty"> & {
        stock: number;
        maxQty: number;
      }
    > = [];
    for (const input of inputs) {
      const row = findBom.get(input.functionalLoc, input.materialNo) as BomRow | undefined;
      const stock = row?.stock;
      const maxQty = row?.maxQty;
      if (
        !row ||
        row.mrpType?.trim().toUpperCase() !== "STOCK ITEM" ||
        typeof stock !== "number" ||
        !Number.isFinite(stock) ||
        typeof maxQty !== "number" ||
        !Number.isFinite(maxQty) ||
        maxQty <= stock ||
        input.quantity > Math.floor(maxQty - stock)
      ) {
        return NextResponse.json(
          { error: `${input.materialNo} at ${input.functionalLoc} is no longer eligible for that reorder quantity.` },
          { status: 409 }
        );
      }
      verified.push({ ...input, ...row, stock, maxQty });
    }

    const materials = [...new Set(verified.map((item) => item.materialNo))];
    const placeholders = materials.map(() => "?").join(", ");
    const priceRows = db
      .prepare(
        `SELECT
           pr_material AS materialNo,
           pr_quantity AS quantity,
           po_item_amount AS amount,
           po_currency AS currency,
           date(pr_date) AS prDate
         FROM pr_po_clean
         WHERE pr_material IN (${placeholders})
           AND pr_quantity > 0
           AND po_item_amount IS NOT NULL
           AND date(pr_date) <= date('now')
         ORDER BY date(pr_date) DESC`
      )
      .all(...materials) as PurchasePriceRow[];
    const prices = idrUnitPrices(priceRows);
    const items: PricedDraftItem[] = verified.map((item) => {
      const price = prices.get(item.materialNo);
      return {
        ...item,
        description: item.description ?? "",
        unit: item.unit ?? "",
        unitPriceIdr: price?.unitPriceIdr ?? null,
        priceDate: price?.priceDate ?? null,
        estimatedTotalIdr:
          price === undefined
            ? null
            : Math.round(price.unitPriceIdr * item.quantity),
      };
    });

    const id = randomUUID();
    const createdAt = new Date().toISOString();
    const totalEstimatedIdr = items.reduce(
      (total, item) => total + (item.estimatedTotalIdr ?? 0),
      0
    );
    const unpricedItemCount = items.filter(
      (item) => item.unitPriceIdr === null
    ).length;

    const writableDb = ensureDraftTables();
    const saveDraft = writableDb.transaction(() => {
      writableDb
        .prepare(
          `INSERT INTO reorder_estimates
             (id, created_at, currency, total_estimated_idr, unpriced_item_count)
           VALUES (?, ?, 'IDR', ?, ?)`
        )
        .run(id, createdAt, totalEstimatedIdr, unpricedItemCount);

      const insertItem = writableDb.prepare(
        `INSERT INTO reorder_estimate_items
           (estimate_id, functional_loc, material_no, description, quantity, unit,
            stock_at_estimate, max_qty, estimated_unit_price_idr, price_date, estimated_total_idr)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      for (const item of items) {
        insertItem.run(
          id,
          item.functionalLoc,
          item.materialNo,
          item.description,
          item.quantity,
          item.unit,
          item.stock,
          item.maxQty,
          item.unitPriceIdr,
          item.priceDate,
          item.estimatedTotalIdr
        );
      }
    });
    saveDraft();

    return NextResponse.json(
      {
        id,
        createdAt,
        itemCount: items.length,
        totalEstimatedIdr,
        unpricedItemCount,
        currency: "IDR",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[api/inventory/reorder-drafts]", error);
    return NextResponse.json(
      { error: "Unable to save the reorder estimate to the local database." },
      { status: 500 }
    );
  }
}
