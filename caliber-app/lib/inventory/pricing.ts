export type PurchasePriceRow = {
  materialNo: string;
  quantity: number | null;
  amount: number | null;
  currency: string | null;
  prDate: string | null;
};

export type HistoricalUnitPrice = {
  unitPriceIdr: number;
  priceDate: string | null;
};

export function idrUnitPrices(
  rows: PurchasePriceRow[]
): Map<string, HistoricalUnitPrice> {
  const prices = new Map<string, HistoricalUnitPrice>();
  const sorted = [...rows].sort((a, b) =>
    String(b.prDate ?? "").localeCompare(String(a.prDate ?? ""))
  );

  for (const row of sorted) {
    if (
      row.currency?.trim().toUpperCase() !== "IDR" ||
      !row.materialNo ||
      prices.has(row.materialNo) ||
      typeof row.quantity !== "number" ||
      !Number.isFinite(row.quantity) ||
      row.quantity <= 0 ||
      typeof row.amount !== "number" ||
      !Number.isFinite(row.amount) ||
      row.amount < 0
    ) {
      continue;
    }

    prices.set(row.materialNo, {
      unitPriceIdr: row.amount / row.quantity,
      priceDate: row.prDate,
    });
  }

  return prices;
}
