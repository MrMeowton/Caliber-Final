import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import plantLayout from "@/data/plant-layout.json";

const PLANT_TAGS = new Set(plantLayout.equipment.map((item) => item.tag));



type BomRow = {
  functionalLoc: string;
  materialNo: string;
  description: string;
  installedQty: number | null;
  unit: string | null;
  minQty: number | null;
  maxQty: number | null;
  stock: number | null;
  mrpType: string | null;
  locationDescription: string | null;
  criticality: string | null;
};

type DailyIssue = {
  materialNo: string;
  postingDate: string;
  quantity: number;
};

type MaintenanceRow = {
  functionalLoc: string;
  maintenancePlan: string | null;
  maintenanceItem: string | null;
  description: string | null;
  priority: string | null;
  cycle: string | null;
  startDate: string | null;
};

type PriceRow = {
  materialNo: string;
  quantity: number | null;
  amount: number | null;
  currency: string | null;
  prDate: string | null;
};

type DemandStats = {
  dailyMean: number;
  dailyDeviation: number;
};

type CalculatedPart = {
  functionalLoc: string;
  materialNo: string;
  description: string;
  stock: number;
  minQty: number;
  maxQty: number;
  installedQty: number;
  unit: string;
  mrpType: string;
  criticality: string;
  stockKnown: boolean;
  minEligible: boolean;
  maxEligible: boolean;
  healthEligible: boolean;
  reorderPoint: number;
  averageDailyDemand: number;
  safetyStock: number;
  daysOfCover: number | null;
  orderCap: number;
  recommendedQty: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const DEMAND_WINDOW_DAYS = 365;
const SERVICE_LEVEL_Z = 1.65;

function finite(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function roundedUp(value: number): number {
  return Math.ceil(Math.max(0, value));
}

function equipmentKey(functionalLoc: string, description: string | null): string {
  const fromLocation = functionalLoc.match(/^PX_([A-Z]{1,4}-\d+[A-Z]?)/i)?.[1];
  if (fromLocation) return fromLocation.toUpperCase();

  if (description && /PIPE/i.test(description)) return functionalLoc;
  const fromDescription = description?.match(/\b([A-Z]{1,4}-\d+[A-Z]?)\b/i)?.[1];
  return fromDescription?.toUpperCase() ?? functionalLoc;
}

function cycleIntervalDays(cycle: string | null): number | null {
  const normalized = cycle?.trim().toUpperCase() ?? "";
  const match = normalized.match(/(\d+(?:\.\d+)?)\s*(WEEK|MONTH|YEAR)/);
  const amount = match ? Number(match[1]) : 1;
  const unit = match?.[2] ?? (
    normalized.includes("YEAR")
      ? "YEAR"
      : normalized.includes("MONTH")
        ? "MONTH"
        : normalized.includes("WEEK")
          ? "WEEK"
          : null
  );

  if (!unit || !Number.isFinite(amount) || amount <= 0) return null;
  const daysPerUnit = unit === "YEAR" ? 365.25 : unit === "MONTH" ? 30.4375 : 7;
  return Math.max(1, Math.round(amount * daysPerUnit));
}

function upcomingDates(
  row: MaintenanceRow,
  today: string,
  horizonDays: number
): string[] {
  if (!row.startDate) return [];
  const start = Date.parse(`${row.startDate}T00:00:00Z`);
  const todayTime = Date.parse(`${today}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(todayTime)) return [];

  const endTime = todayTime + horizonDays * DAY_MS;
  const interval = cycleIntervalDays(row.cycle);
  if (!interval) {
    return start >= todayTime && start <= endTime ? [row.startDate] : [];
  }

  const step = interval * DAY_MS;
  const firstIndex = Math.max(0, Math.ceil((todayTime - start) / step));
  const dates: string[] = [];

  for (let index = firstIndex; index < firstIndex + 25; index += 1) {
    const occurrence = start + index * step;
    if (occurrence > endTime) break;
    dates.push(new Date(occurrence).toISOString().slice(0, 10));
  }

  return dates;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const middle = Math.floor(values.length / 2);
  return values.length % 2 === 0
    ? (values[middle - 1] + values[middle]) / 2
    : values[middle];
}

function getDemandStats(issues: DailyIssue[]): Map<string, DemandStats> {
  const totals = new Map<string, { sum: number; sumSquares: number }>();

  for (const issue of issues) {
    const quantity = Math.abs(finite(issue.quantity));
    const current = totals.get(issue.materialNo) ?? { sum: 0, sumSquares: 0 };
    current.sum += quantity;
    current.sumSquares += quantity * quantity;
    totals.set(issue.materialNo, current);
  }

  return new Map(
    [...totals].map(([materialNo, values]) => {
      const dailyMean = values.sum / DEMAND_WINDOW_DAYS;
      const variance =
        (values.sumSquares - values.sum * values.sum / DEMAND_WINDOW_DAYS) /
        Math.max(1, DEMAND_WINDOW_DAYS - 1);
      return [
        materialNo,
        {
          dailyMean,
          dailyDeviation: Math.sqrt(Math.max(0, variance)),
        },
      ];
    })
  );
}

function idrUnitPrices(rows: PriceRow[]): Map<string, number> {
  const prices = new Map<string, number>();
  const sorted = [...rows].sort((a, b) =>
    String(b.prDate ?? "").localeCompare(String(a.prDate ?? ""))
  );

  for (const row of sorted) {
    if (
      row.currency?.trim().toUpperCase() !== "IDR" ||
      !row.materialNo ||
      prices.has(row.materialNo) ||
      finite(row.quantity) <= 0 ||
      finite(row.amount) < 0
    ) {
      continue;
    }

    prices.set(row.materialNo, finite(row.amount) / finite(row.quantity));
  }

  return prices;
}

function countDistinct<T>(items: T[], key: (item: T) => string): number {
  return new Set(items.map(key)).size;
}

export async function GET() {
  try {
    const dateRow = db
      .prepare("SELECT date('now') AS today")
      .get() as { today: string };
    const today = dateRow.today;

    const positions = db
      .prepare(
        `SELECT
           b.functional_loc AS functionalLoc,
           b.material_no AS materialNo,
           b.material_desc AS description,
           b.installed_qty AS installedQty,
           b.unit AS unit,
           b.min_qty AS minQty,
           b.max_qty AS maxQty,
           b.stock AS stock,
           b.mrp_type AS mrpType,
           f.funcloc_descrip AS locationDescription,
           f.funcloc_criticality AS criticality
         FROM bom_clean b
         LEFT JOIN funcloc_list f
           ON f.functional_location = b.functional_loc
         WHERE b.material_no IS NOT NULL AND trim(b.material_no) <> ''`
      )
      .all() as BomRow[];

    const issues = db
      .prepare(
        `SELECT
           material_number AS materialNo,
           date(posting_date) AS postingDate,
           SUM(quantity) AS quantity
         FROM movement_material_clean
         WHERE upper(movement_type) = 'ISSUE'
           AND date(posting_date) >= date('now', '-365 days')
           AND date(posting_date) <= date('now')
         GROUP BY material_number, date(posting_date)`
      )
      .all() as DailyIssue[];

    const movementCoverage = db
      .prepare(
        `SELECT
           MIN(date(posting_date)) AS firstDate,
           MAX(date(posting_date)) AS lastDate
         FROM movement_material_clean
         WHERE date(posting_date) <= date('now')`
      )
      .get() as { firstDate: string | null; lastDate: string | null };

    const latestIssues = db
      .prepare(
        `SELECT
           material_number AS materialNo,
           MAX(date(posting_date)) AS postingDate
         FROM movement_material_clean
         WHERE upper(movement_type) = 'ISSUE'
           AND date(posting_date) >= date('now', '-24 months')
           AND date(posting_date) <= date('now')
         GROUP BY material_number`
      )
      .all() as Array<{ materialNo: string; postingDate: string }>;

    const movementCutoffs = db
      .prepare(
        `SELECT
           date('now', '-12 months') AS twelveMonths,
           date('now', '-24 months') AS twentyFourMonths`
      )
      .get() as { twelveMonths: string; twentyFourMonths: string };

    const promiseRows = db
      .prepare(
        `SELECT
           pr_material AS materialNo,
           pr_quantity AS quantity,
           po_item_amount AS amount,
           po_currency AS currency,
           date(pr_date) AS prDate
         FROM pr_po_clean
         WHERE pr_material IS NOT NULL
           AND pr_quantity > 0
           AND po_item_amount IS NOT NULL
           AND date(pr_date) <= date('now')
         ORDER BY date(pr_date) DESC`
      )
      .all() as PriceRow[];

    const leadTimeRows = db
      .prepare(
        `SELECT
           julianday(date(po_delivery_date)) - julianday(date(pr_date)) AS days
         FROM pr_po_clean
         WHERE date(po_delivery_date) IS NOT NULL
           AND date(pr_date) IS NOT NULL
           AND date(pr_date) <= date('now')
           AND julianday(date(po_delivery_date)) - julianday(date(pr_date))
             BETWEEN 1 AND 365`
      )
      .all() as Array<{ days: number }>;

    const planRows = db
      .prepare(
        `SELECT
           functional_location AS functionalLoc,
           maintenance_plan AS maintenancePlan,
           maintenance_item AS maintenanceItem,
           maint_item_text AS description,
           priority AS priority,
           cycle_descriptions AS cycle,
           date(start_of_cycle) AS startDate
         FROM mitem_mplan_clean
         WHERE functional_location IS NOT NULL`
      )
      .all() as MaintenanceRow[];

    const monthlyIssues = db
      .prepare(
        `SELECT
           strftime('%Y-%m', date(posting_date)) AS month,
           COUNT(*) AS postings,
           COUNT(DISTINCT material_number) AS distinctMaterials
         FROM movement_material_clean
         WHERE upper(movement_type) = 'ISSUE'
           AND date(posting_date) >= date('now', 'start of month', '-12 months')
           AND date(posting_date) < date('now', 'start of month')
         GROUP BY strftime('%Y-%m', date(posting_date))
         ORDER BY month`
      )
      .all() as Array<{ month: string; postings: number; distinctMaterials: number }>;

    const positionByKey = new Map(
      positions.map((row) => [
        `${row.functionalLoc}\u0000${row.materialNo}`,
        row,
      ])
    );
    const demandStats = getDemandStats(issues);
    const validLeadTimes = leadTimeRows
      .map((row) => finite(row.days))
      .filter((days) => days > 0)
      .sort((a, b) => a - b);
    const leadTimeDays = median(validLeadTimes);
    const leadTimeForPlanning = leadTimeDays ?? 0;

    const calculated = positions.map((row): CalculatedPart => {
      const stats = demandStats.get(row.materialNo) ?? {
        dailyMean: 0,
        dailyDeviation: 0,
      };
      const stock = finite(row.stock);
      const minQty = finite(row.minQty);
      const maxQty = finite(row.maxQty);
      const safetyStock = roundedUp(
        SERVICE_LEVEL_Z * stats.dailyDeviation * Math.sqrt(leadTimeForPlanning)
      );
      const statisticalReorderPoint = roundedUp(
        stats.dailyMean * leadTimeForPlanning + safetyStock
      );
      const reorderPoint = Math.max(roundedUp(minQty), statisticalReorderPoint);
      const orderCap = Math.max(0, Math.floor(maxQty - stock));

      return {
        functionalLoc: row.functionalLoc,
        materialNo: row.materialNo,
        description: row.description ?? "",
        stock,
        minQty: Math.max(0, minQty),
        maxQty: Math.max(0, maxQty),
        installedQty: finite(row.installedQty),
        unit: row.unit ?? "",
        mrpType: row.mrpType ?? "",
        criticality: row.criticality ?? "",
        stockKnown: row.stock !== null,
        minEligible: row.minQty !== null && row.minQty >= 0,
        maxEligible: row.maxQty !== null && row.maxQty >= 0,
        healthEligible:
          row.stock !== null && row.minQty !== null && row.minQty >= 0,
        reorderPoint,
        averageDailyDemand: stats.dailyMean,
        safetyStock,
        daysOfCover:
          stats.dailyMean > 0 ? Math.max(0, stock / stats.dailyMean) : null,
        orderCap,
        recommendedQty: stock <= reorderPoint ? orderCap : 0,
      };
    });

    const stockItemPositions = calculated.filter(
      (row) => row.mrpType.toUpperCase() === "STOCK ITEM"
    );
    const criticalZeroPositions = stockItemPositions.filter(
      (row) =>
        row.stockKnown &&
        ["S", "A"].includes(row.criticality.toUpperCase()) &&
        row.stock <= 0
    );
    const belowMinimumPositions = stockItemPositions.filter(
      (row) => row.stockKnown && row.minEligible && row.stock < row.minQty
    );
    const eligibleHealthPositions = stockItemPositions.filter(
      (row) => row.healthEligible
    );
    const withinMinimumPositions = eligibleHealthPositions.filter(
      (row) => row.stock >= row.minQty
    );
    const nonStockWithPhysical = calculated.filter(
      (row) => row.mrpType.toUpperCase() === "NON STOCK" && row.stock > 0
    );

    const movementsByMaterial = new Map(
      latestIssues.map((issue) => [issue.materialNo, issue.postingDate])
    );

    const stockItemBySku = new Map<string, CalculatedPart[]>();
    for (const row of stockItemPositions) {
      const rows = stockItemBySku.get(row.materialNo) ?? [];
      rows.push(row);
      stockItemBySku.set(row.materialNo, rows);
    }

    const noIssueSince = (row: CalculatedPart, months: 12 | 24) => {
      const lastIssue = movementsByMaterial.get(row.materialNo);
      if (!lastIssue) return true;
      const threshold =
        months === 12
          ? movementCutoffs.twelveMonths
          : movementCutoffs.twentyFourMonths;
      return lastIssue < threshold;
    };

    const nonMovingSkus = new Set(
      stockItemPositions
        .filter((row) => row.stock > 0 && noIssueSince(row, 12))
        .map((row) => row.materialNo)
    );

    const priceBySku = idrUnitPrices(promiseRows);
    const skuRows = [...stockItemBySku].map(([materialNo, rows]) => {
      const representative = rows[0];
      const currentStock = Math.max(...rows.map((row) => row.stock));
      const excessQty = Math.max(
        0,
        ...rows
          .filter((row) => row.maxEligible)
          .map((row) => row.stock - row.maxQty)
      );
      const unitPriceIdr = priceBySku.get(materialNo) ?? null;
      return {
        materialNo,
        description: representative.description,
        unit: representative.unit,
        currentStock,
        excessQty,
        unitPriceIdr,
        inventoryValueIdr:
          unitPriceIdr === null ? null : currentStock * unitPriceIdr,
        excessValueIdr:
          unitPriceIdr === null ? null : excessQty * unitPriceIdr,
        aboveMax: rows.some(
          (row) => row.maxEligible && row.stock > row.maxQty
        ),
      };
    });

    const excessSkus = skuRows.filter((row) => row.aboveMax);
    const pricedExcessSkus = excessSkus.filter(
      (row) => row.excessValueIdr !== null
    );
    const excessCapitalIdr = pricedExcessSkus.reduce(
      (total, row) => total + (row.excessValueIdr ?? 0),
      0
    );
    const pricedInventory = skuRows
      .filter(
        (row): row is typeof row & { inventoryValueIdr: number } =>
          row.inventoryValueIdr !== null && row.inventoryValueIdr > 0
      )
      .sort((a, b) => b.inventoryValueIdr - a.inventoryValueIdr);
    const totalPricedInventoryIdr = pricedInventory.reduce(
      (total, row) => total + row.inventoryValueIdr,
      0
    );
    let cumulativeValue = 0;
    let skuCountFor80 = 0;
    const paretoItems = pricedInventory.map((row, index) => {
      const previousCumulativePercent =
        totalPricedInventoryIdr > 0
          ? (cumulativeValue / totalPricedInventoryIdr) * 100
          : 0;
      cumulativeValue += row.inventoryValueIdr;
      const cumulativePercent =
        totalPricedInventoryIdr > 0
          ? (cumulativeValue / totalPricedInventoryIdr) * 100
          : 0;
      if (skuCountFor80 === 0 && cumulativePercent >= 80) {
        skuCountFor80 = index + 1;
      }
      const segment =
        previousCumulativePercent < 80
          ? "A"
          : previousCumulativePercent < 95
            ? "B"
            : "C";
      return {
        rank: index + 1,
        materialNo: row.materialNo,
        description: row.description,
        inventoryValueIdr: row.inventoryValueIdr,
        cumulativePercent,
        segment,
      };
    });
    const segmentation = {
      A: paretoItems.filter((row) => row.segment === "A").length,
      B: paretoItems.filter((row) => row.segment === "B").length,
      C: paretoItems.filter((row) => row.segment === "C").length,
    };
    if (pricedInventory.length > 0 && skuCountFor80 === 0) {
      skuCountFor80 = pricedInventory.length;
    }
    const paretoThrough80 = paretoItems.slice(
      0,
      Math.max(30, skuCountFor80)
    );
    const sampleEvery = Math.max(1, Math.ceil(paretoThrough80.length / 250));
    const paretoChart = paretoThrough80.filter(
      (_, index) =>
        index % sampleEvery === 0 || index === paretoThrough80.length - 1
    );

    const monthStart = new Date(`${today.slice(0, 7)}-01T00:00:00Z`);
    const maintenanceTrend = Array.from({ length: 6 }, (_, index) => {
      const month = new Date(
        Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + index, 1)
      );
      return {
        month: month.toISOString().slice(0, 7),
        plans: 0,
      };
    });
    const planEventsByAsset = new Map<
      string,
      Array<{ id: string; description: string; priority: string; dueDate: string }>
    >();
    const planEventsByMonth = new Map<string, number>();

    for (const plan of planRows) {
      const dates = upcomingDates(plan, today, 183);
      const key = equipmentKey(plan.functionalLoc, null);
      const events = planEventsByAsset.get(key) ?? [];
      for (const dueDate of dates) {
        events.push({
          id: `${plan.maintenancePlan ?? ""}-${plan.maintenanceItem ?? ""}`,
          description: plan.description ?? "Scheduled maintenance",
          priority: plan.priority ?? "",
          dueDate,
        });
        const month = dueDate.slice(0, 7);
        planEventsByMonth.set(month, (planEventsByMonth.get(month) ?? 0) + 1);
      }
      if (dates.length > 0) planEventsByAsset.set(key, events);
    }

    for (const month of maintenanceTrend) {
      month.plans = planEventsByMonth.get(month.month) ?? 0;
    }

    const todayTime = Date.parse(`${today}T00:00:00Z`);
    const eventsDue90 = planRows.flatMap((plan) =>
      upcomingDates(plan, today, 90).map((dueDate) => ({
        ...plan,
        dueDate,
        key: equipmentKey(plan.functionalLoc, null),
      }))
    );
    const uniqueDuePlans90 = new Set(
      eventsDue90.map(
        (event) => `${event.maintenancePlan ?? ""}-${event.maintenanceItem ?? ""}`
      )
    ).size;

    const assetGroups = new Map<
      string,
      { positions: CalculatedPart[]; name: string; criticality: string }
    >();
    for (const row of calculated) {
      const source = positionByKey.get(
        `${row.functionalLoc}\u0000${row.materialNo}`
      );
      const key = equipmentKey(row.functionalLoc, source?.locationDescription ?? null);
      const existing = assetGroups.get(key) ?? {
        positions: [],
        name: source?.locationDescription ?? row.functionalLoc,
        criticality: row.criticality,
      };
      existing.positions.push(row);
      if (
        source?.locationDescription &&
        /FURNACE|PUMP|COMPRESSOR|BOILER|TURBINE|TANK|SYSTEM/i.test(
          source.locationDescription
        )
      ) {
        existing.name = source.locationDescription;
      }
      if (row.criticality === "S" || (row.criticality === "A" && existing.criticality !== "S")) {
        existing.criticality = row.criticality;
      }
      assetGroups.set(key, existing);
    }

    const assets = [...assetGroups].map(([id, group]) => {
      const parts = group.positions
        .filter((row) => row.mrpType.toUpperCase() === "STOCK ITEM")
        .sort((a, b) => {
          const urgency = (part: CalculatedPart) =>
                part.stockKnown &&
                part.stock <= 0 &&
                ["S", "A"].includes(part.criticality)
                  ? 2
                  : part.stockKnown && part.stock <= part.reorderPoint
                    ? 1
                    : 0;
          return urgency(b) - urgency(a) || a.stock - b.stock;
        });
      const events = (planEventsByAsset.get(id) ?? [])
        .filter((event) => {
          const due = Date.parse(`${event.dueDate}T00:00:00Z`);
          return due >= todayTime && due <= todayTime + 90 * DAY_MS;
        })
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
      const zeroStockParts = parts.filter(
        (part) =>
          part.stockKnown &&
          part.stock <= 0 &&
          ["S", "A"].includes(part.criticality)
      ).length;
      const atRiskParts = parts.filter(
        (part) => part.stockKnown && part.stock <= part.reorderPoint
      ).length;

      return {
        id,
        name: group.name,
        criticality: group.criticality,
        status:
          zeroStockParts > 0 && events.length > 0
            ? "critical"
            : atRiskParts > 0
              ? "watch"
              : "ready",
        atRiskParts,
        zeroStockParts,
        upcomingPlans: countDistinct(events, (event) => event.id),
        nextDueDate: events[0]?.dueDate ?? null,
        nextMaintenance: events[0]?.description ?? null,
        parts: parts.slice(0, 80),
      };
    });

    const assetRank = (asset: (typeof assets)[number]) =>
      asset.zeroStockParts * 1000 +
      asset.atRiskParts * 10 +
      asset.upcomingPlans;
    assets.sort((a, b) => assetRank(b) - assetRank(a));
    const bf112Index = assets.findIndex((asset) => asset.id === "BF-112");
    if (bf112Index > 0) {
      assets.unshift(assets.splice(bf112Index, 1)[0]);
    }

    const recommendations = stockItemPositions
      .filter(
        (row) =>
          row.stockKnown &&
          ((row.stock <= 0 && ["S", "A"].includes(row.criticality.toUpperCase())) ||
            (row.maxEligible &&
              row.recommendedQty > 0 &&
              row.stock < row.maxQty))
      )
      .map((row) => {
        const source = positionByKey.get(
          `${row.functionalLoc}\u0000${row.materialNo}`
        );
        const key = equipmentKey(row.functionalLoc, source?.locationDescription ?? null);
        const upcoming = (planEventsByAsset.get(key) ?? [])
          .filter((event) => {
            const due = Date.parse(`${event.dueDate}T00:00:00Z`);
            return due >= todayTime && due <= todayTime + 90 * DAY_MS;
          })
          .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
        return {
          ...row,
          unitPriceIdr: priceBySku.get(row.materialNo) ?? null,
          locationDescription: source?.locationDescription ?? row.functionalLoc,
          assetId: key,
          nextMaintenance: upcoming?.description ?? null,
          nextMaintenanceDate: upcoming?.dueDate ?? null,
          suggestedAction: "Reorder Now",
          reason:
            row.stock <= 0
              ? "Zero on-hand"
              : row.stock < row.minQty
                ? "Below BOM minimum"
                : "Below forecast reorder point",
        };
      })
      .sort(
        (a, b) =>
          Number(["S", "A"].includes(b.criticality)) -
            Number(["S", "A"].includes(a.criticality)) ||
          a.stock - b.stock ||
          a.functionalLoc.localeCompare(b.functionalLoc)
      );
    const overMaxCandidates = stockItemPositions
      .filter(
        (row) =>
          row.stockKnown &&
          row.maxEligible &&
          row.stock > row.maxQty
      )
      .sort((a, b) => b.stock - b.maxQty - (a.stock - a.maxQty))
      .slice(0, 100)
      .map((row) => {
        const source = positionByKey.get(
          `${row.functionalLoc}\u0000${row.materialNo}`
        );
        return {
          ...row,
          unitPriceIdr: priceBySku.get(row.materialNo) ?? null,
          locationDescription: source?.locationDescription ?? row.functionalLoc,
          assetId: equipmentKey(row.functionalLoc, source?.locationDescription ?? null),
          nextMaintenance: null,
          nextMaintenanceDate: null,
          suggestedAction: "Reduce / Stop-Buy",
          reason: "On-hand exceeds the BOM maximum",
        };
      });
    const actionCandidates = [
      ...recommendations.filter((row) => row.orderCap > 0).slice(0, 100),
      ...overMaxCandidates,
    ];

    const promiseAttainment = db
      .prepare(
        `SELECT
           COUNT(*) AS eligibleLines,
           SUM(CASE
             WHEN date(po_delivery_date) <= date(pr_delivery_date) THEN 1
             ELSE 0
           END) AS onTimePromises
         FROM pr_po_clean
         WHERE date(po_delivery_date) IS NOT NULL
           AND date(pr_delivery_date) IS NOT NULL
           AND date(pr_date) <= date('now')`
      )
      .get() as { eligibleLines: number; onTimePromises: number | null };

    const historyCoverage = movementCoverage.firstDate
      ? db
          .prepare("SELECT date('now', '-24 months') AS startDate")
          .get() as { startDate: string }
      : null;
    const hasObsolescenceWindow =
      movementCoverage.firstDate !== null &&
      historyCoverage !== null &&
      movementCoverage.firstDate <= historyCoverage.startDate;

    const monthlyIssueMap = new Map(
      monthlyIssues.map((row) => [row.month, row])
    );
    const issueTrend = Array.from({ length: 12 }, (_, index) => {
      const month = new Date(
        Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() - 12 + index, 1)
      )
        .toISOString()
        .slice(0, 7);
      const values = monthlyIssueMap.get(month);
      return {
        month,
        postings: values?.postings ?? 0,
        distinctMaterials: values?.distinctMaterials ?? 0,
      };
    });

    const nonMovingValueRows = stockItemPositions.filter(
      (row) => row.stock > 0 && noIssueSince(row, 12)
    );
    const obsoleteSkus = hasObsolescenceWindow
      ? new Set(
          stockItemPositions
            .filter((row) => row.stock > 0 && noIssueSince(row, 24))
            .map((row) => row.materialNo)
        ).size
      : null;

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      coverage: {
        movementStart: movementCoverage.firstDate,
        movementThrough: movementCoverage.lastDate,
        demandWindowDays: DEMAND_WINDOW_DAYS,
        planningLeadTimeDays: leadTimeDays,
        leadTimeBasis: "Median PR date to PO promised date, 1–365 day records",
      },
      methodology: {
        reorderPoint:
          "max(BOM minimum, average daily issue × planning lead time + 1.65 × daily issue deviation × √lead time)",
        serviceLevel: "95% cycle-service target (z = 1.65)",
        orderQuantity:
          "max(0, max stock − on-hand); draft target is max stock",
        nonMoving:
          "Stock Item SKUs with positive on-hand and no ISSUE posting in the trailing 12 months",
        obsolete:
          "Potentially obsolete only when positive on-hand has no ISSUE posting in a complete 24-month history window",
        supplierMetric:
          "PO promised delivery on or before PR requested delivery; actual goods-receipt dates are not available",
        maintenance:
          "Estimated future occurrences from maintenance-plan start date and cycle; installed BOM quantity is not treated as replacement demand",
      },
      kpis: {
        skuCount: stockItemBySku.size,
        inventoryPositions: positions.length,
        healthIndex:
          eligibleHealthPositions.length > 0
            ? withinMinimumPositions.length / eligibleHealthPositions.length
            : null,
        healthAtOrAboveMinimum: withinMinimumPositions.length,
        healthEligiblePositions: eligibleHealthPositions.length,
        criticalZeroPositions: criticalZeroPositions.length,
        criticalZeroSkus: new Set(
          criticalZeroPositions.map((row) => row.materialNo)
        ).size,
        belowMinimumPositions: belowMinimumPositions.length,
        excessSkus: excessSkus.length,
        excessCapitalIdr,
        pricedExcessSkus: pricedExcessSkus.length,
        totalExcessSkus: excessSkus.length,
        nonMovingSkus: nonMovingSkus.size,
        nonMovingPositions: nonMovingValueRows.length,
        obsoleteSkus,
        hasObsolescenceWindow,
        nonStockWithPhysicalSkus: new Set(
          nonStockWithPhysical.map((row) => row.materialNo)
        ).size,
        nonStockWithPhysicalPositions: nonStockWithPhysical.length,
        inventoryValueIdr: totalPricedInventoryIdr,
        pricedInventorySkus: skuRows.filter(
          (row) => row.unitPriceIdr !== null
        ).length,
        totalValuedSkus: stockItemBySku.size,
        pareto80SkuCount: skuCountFor80,
        paretoEligibleSkus: pricedInventory.length,
        maintenancePlansDue90d: uniqueDuePlans90,
        supplierPromiseRate:
          promiseAttainment.eligibleLines > 0
            ? (finite(promiseAttainment.onTimePromises) /
                promiseAttainment.eligibleLines)
            : null,
        supplierEligibleLines: promiseAttainment.eligibleLines,
      },
      issueTrend,
      maintenanceTrend,
      pareto: paretoItems.slice(0, 30),
      paretoChart,
      segmentation,
      assets: assets
        .filter((asset) => asset.atRiskParts > 0 || asset.upcomingPlans > 0)
        .slice(0, 24),
      // Unfiltered records for the equipment drawn in the 3D plant layout.
      plantAssets: assets.filter((asset) => PLANT_TAGS.has(asset.id)),
      recommendations,
      actionCandidates,
    });
  } catch (error) {
    console.error("[api/inventory/dashboard]", error);
    return NextResponse.json(
      { error: "Unable to generate inventory dashboard data." },
      { status: 500 }
    );
  }
}
