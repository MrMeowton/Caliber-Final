"use client";

import { Fragment, useEffect, useState, type FormEvent } from "react";
import { ChevronDown, ChevronRight, FileText } from "lucide-react";
import type { Navigate } from "@/app/page";
import { PageHeader } from "@/components/ui/page-header";

type EstimateItem = {
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
};

type Estimate = {
  id: string;
  createdAt: string;
  currency: string;
  totalEstimatedIdr: number;
  unpricedItemCount: number;
  items: EstimateItem[];
};

type DemoSubmission = {
  supplier: string;
  expectedDeliveryDate: string;
  requester: string;
  totalEstimatedIdr: number;
  unpricedItemCount: number;
};

type EditableItem = { quantity: string; unitPriceIdr: string };

const idr = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});
const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const date = (value: string) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "—"
    : new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(parsed);
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isEstimate(value: unknown): value is Estimate {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.currency === "string" &&
    typeof value.totalEstimatedIdr === "number" &&
    typeof value.unpricedItemCount === "number" &&
    Array.isArray(value.items) &&
    value.items.every(
      (item) =>
        isRecord(item) &&
        typeof item.id === "number" &&
        typeof item.functionalLoc === "string" &&
        typeof item.materialNo === "string" &&
        typeof item.description === "string" &&
        typeof item.quantity === "number" &&
        typeof item.unit === "string" &&
        typeof item.stockAtEstimate === "number" &&
        typeof item.maxQty === "number" &&
        (item.estimatedUnitPriceIdr === null ||
          typeof item.estimatedUnitPriceIdr === "number") &&
        (item.priceDate === null || typeof item.priceDate === "string") &&
        (item.estimatedTotalIdr === null ||
          typeof item.estimatedTotalIdr === "number")
    )
  );
}

export function OrderDraftsContent({ onNavigate }: { onNavigate: Navigate }) {
  const [estimates, setEstimates] = useState<Estimate[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Record<string, DemoSubmission>>(
    {}
  );
  const [itemEdits, setItemEdits] = useState<
    Record<string, Record<number, EditableItem>>
  >({});

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/inventory/reorder-drafts", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload: unknown = await response.json();
        if (!response.ok) {
          throw new Error(
            isRecord(payload) && typeof payload.error === "string"
              ? payload.error
              : `Unable to load order drafts (${response.status}).`
          );
        }
        if (
          !isRecord(payload) ||
          !Array.isArray(payload.estimates) ||
          !payload.estimates.every(isEstimate)
        ) {
          throw new Error("The order drafts service returned an unexpected response.");
        }
        setEstimates(payload.estimates);
      })
      .catch((requestError) => {
        if (!controller.signal.aborted) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load saved order drafts."
          );
        }
      });
    return () => controller.abort();
  }, []);

  function editFor(estimate: Estimate, item: EstimateItem): EditableItem {
    return (
      itemEdits[estimate.id]?.[item.id] ?? {
        quantity: String(item.quantity),
        unitPriceIdr: item.estimatedUnitPriceIdr?.toString() ?? "",
      }
    );
  }

  function clearSubmission(estimateId: string) {
    setSubmissions((current) => {
      if (!current[estimateId]) return current;
      const next = { ...current };
      delete next[estimateId];
      return next;
    });
  }

  function updateItem(
    estimate: Estimate,
    item: EstimateItem,
    field: keyof EditableItem,
    value: string
  ) {
    clearSubmission(estimate.id);
    setItemEdits((current) => {
      const currentItems = current[estimate.id] ?? {};
      const currentItem = currentItems[item.id] ?? {
        quantity: String(item.quantity),
        unitPriceIdr: item.estimatedUnitPriceIdr?.toString() ?? "",
      };
      return {
        ...current,
        [estimate.id]: {
          ...currentItems,
          [item.id]: { ...currentItem, [field]: value },
        },
      };
    });
  }

  function lineTotal(estimate: Estimate, item: EstimateItem) {
    const edit = editFor(estimate, item);
    if (!edit.quantity || !edit.unitPriceIdr) return null;
    const quantity = Number(edit.quantity);
    const unitPriceIdr = Number(edit.unitPriceIdr);
    if (
      !Number.isSafeInteger(quantity) ||
      quantity <= 0 ||
      !Number.isFinite(unitPriceIdr) ||
      unitPriceIdr < 0
    ) {
      return null;
    }
    const total = quantity * unitPriceIdr;
    return Number.isFinite(total) ? Math.round(total) : null;
  }

  function submitDemo(event: FormEvent<HTMLFormElement>, estimate: Estimate) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const totals = estimate.items.map((item) => lineTotal(estimate, item));
    setSubmissions((current) => ({
      ...current,
      [estimate.id]: {
        supplier: String(form.get("supplier") ?? ""),
        expectedDeliveryDate: String(form.get("expectedDeliveryDate") ?? ""),
        requester: String(form.get("requester") ?? ""),
        totalEstimatedIdr: totals.reduce((sum, total) => sum + (total ?? 0), 0),
        unpricedItemCount: totals.filter((total) => total === null).length,
      },
    }));
  }

  return (
    <div className="space-y-5 text-[#131416]">
      <PageHeader
        title="Order Drafts"
        right={
          <button
            type="button"
            onClick={() => onNavigate({ section: "act", tab: "reorder" })}
            className="min-h-10 rounded-md border border-[#cdced1] px-4 text-sm font-semibold text-[#131416] hover:bg-[#f4f6f8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b6c80]"
          >
            Review reorder list
          </button>
        }
      />
      <p className="max-w-[72ch] text-sm leading-6 text-[#45484a]">
        Saved reorder estimates and their item details. The PR/PO form is a
        frontend demo only; submitting it does not create or save a transaction.
      </p>

      {error && (
        <p className="rounded-md bg-[#ffedea] p-3 text-sm text-[#9b1c1f]" role="alert">
          {error}
        </p>
      )}

      {estimates === null && !error && (
        <div className="space-y-2" aria-label="Loading saved order drafts">
          {[0, 1, 2].map((row) => (
            <div
              key={row}
              className="h-12 animate-pulse rounded-md bg-[#f4f6f8]"
            />
          ))}
        </div>
      )}

      {estimates?.length === 0 && (
        <div className="rounded-lg border border-dashed border-[#cdced1] px-5 py-10 text-center">
          <FileText className="mx-auto h-6 w-6 text-[#5d5f60]" aria-hidden="true" />
          <h2 className="mt-3 text-base font-semibold">No saved order drafts</h2>
          <p className="mx-auto mt-1 max-w-[48ch] text-sm leading-6 text-[#45484a]">
            Stage parts on the reorder list and save an estimate to see it here.
          </p>
          <button
            type="button"
            onClick={() => onNavigate({ section: "act", tab: "reorder" })}
            className="mt-4 min-h-10 rounded-md bg-[#1b6c80] px-4 text-sm font-semibold text-white hover:bg-[#155768] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b6c80]"
          >
            Open reorder list
          </button>
        </div>
      )}

      {estimates && estimates.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-[#e8eaec]">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-[#f4f6f8] text-[#353736]">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Estimate</th>
                <th scope="col" className="px-3 py-3 font-semibold">Created</th>
                <th scope="col" className="px-3 py-3 font-semibold">Items</th>
                <th scope="col" className="px-3 py-3 font-semibold">Known subtotal</th>
                <th scope="col" className="px-3 py-3 font-semibold">Unpriced</th>
                <th scope="col" className="px-3 py-3 font-semibold">
                  <span className="sr-only">Details</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8eaec] tabular-nums">
              {estimates.map((estimate) => {
                const isExpanded = expandedId === estimate.id;
                const submitted = submissions[estimate.id];
                return (
                  <Fragment key={estimate.id}>
                    <tr key={estimate.id} className="hover:bg-[#f8fafb]">
                      <td className="px-4 py-3 font-mono text-xs">
                        {estimate.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-3 py-3">{date(estimate.createdAt)}</td>
                      <td className="px-3 py-3">{estimate.items.length}</td>
                      <td className="px-3 py-3 whitespace-nowrap font-medium">
                        {idr.format(estimate.totalEstimatedIdr)}
                      </td>
                      <td className="px-3 py-3">{estimate.unpricedItemCount}</td>
                      <td className="px-3 py-3 text-right">
                        <button
                          type="button"
                          aria-expanded={isExpanded}
                          aria-controls={`estimate-details-${estimate.id}`}
                          onClick={() =>
                            setExpandedId(isExpanded ? null : estimate.id)
                          }
                          className="inline-flex min-h-9 items-center gap-1 rounded-md px-2 font-medium text-[#1b6c80] hover:bg-[#eaf2f4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b6c80]"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" aria-hidden="true" />
                          ) : (
                            <ChevronRight className="h-4 w-4" aria-hidden="true" />
                          )}
                          {isExpanded ? "Hide" : "View"}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${estimate.id}-details`}>
                        <td
                          id={`estimate-details-${estimate.id}`}
                          colSpan={6}
                          className="bg-[#f8fafb] px-4 py-5 sm:px-6"
                        >
                          <h2 className="text-sm font-semibold">Items in this estimate</h2>
                          <p className="mt-1 text-sm leading-5 text-[#45484a]">
                            Adjust quantities or enter a unit price. These edits are for this demo form only and are not saved.
                          </p>
                          <form
                            onSubmit={(event) => submitDemo(event, estimate)}
                            className="mt-3"
                          >
                          <div className="mt-3 overflow-x-auto rounded-md border border-[#e8eaec] bg-white">
                            <table className="w-full min-w-[840px] text-left text-sm">
                              <thead className="bg-[#f4f6f8] text-[#45484a]">
                                <tr>
                                  <th scope="col" className="px-3 py-2.5 font-semibold">Material</th>
                                  <th scope="col" className="px-3 py-2.5 font-semibold">Location</th>
                                  <th scope="col" className="px-3 py-2.5 font-semibold">Order qty</th>
                                  <th scope="col" className="px-3 py-2.5 font-semibold">Stock → Max</th>
                                  <th scope="col" className="px-3 py-2.5 font-semibold">Unit price (IDR)</th>
                                  <th scope="col" className="px-3 py-2.5 font-semibold">Line total</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#e8eaec]">
                                {estimate.items.map((item) => (
                                  <tr key={item.id} className="align-top">
                                    <td className="px-3 py-3">
                                      <p className="font-medium">{item.description || "—"}</p>
                                      <p className="mt-0.5 font-mono text-xs text-[#5d5f60]">
                                        {item.materialNo}
                                      </p>
                                    </td>
                                    <td className="px-3 py-3">{item.functionalLoc}</td>
                                    <td className="px-3 py-3">
                                      <label className="sr-only" htmlFor={`quantity-${item.id}`}>
                                        Order quantity for {item.materialNo}
                                      </label>
                                      <div className="flex items-center gap-2">
                                        <input
                                          id={`quantity-${item.id}`}
                                          name={`quantity-${item.id}`}
                                          type="number"
                                          min={1}
                                          max={Math.floor(item.maxQty - item.stockAtEstimate)}
                                          step={1}
                                          required
                                          value={editFor(estimate, item).quantity}
                                          onChange={(event) =>
                                            updateItem(estimate, item, "quantity", event.target.value)
                                          }
                                          className="min-h-10 w-24 rounded-md border border-[#cdced1] px-2 text-right tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b6c80]"
                                        />
                                        <span>{item.unit}</span>
                                      </div>
                                    </td>
                                    <td className="px-3 py-3 whitespace-nowrap">
                                      {number.format(item.stockAtEstimate)} → {number.format(item.maxQty)} {item.unit}
                                    </td>
                                    <td className="px-3 py-3">
                                      <label className="sr-only" htmlFor={`price-${item.id}`}>
                                        Unit price in IDR for {item.materialNo}
                                      </label>
                                      <input
                                        id={`price-${item.id}`}
                                        name={`price-${item.id}`}
                                        type="number"
                                        min={0}
                                        step="any"
                                        value={editFor(estimate, item).unitPriceIdr}
                                        onChange={(event) =>
                                          updateItem(estimate, item, "unitPriceIdr", event.target.value)
                                        }
                                        placeholder="Enter price"
                                        className="min-h-10 w-36 rounded-md border border-[#cdced1] px-2 text-right tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b6c80]"
                                      />
                                      {item.priceDate && (
                                        <span className="mt-1 block text-xs text-[#5d5f60]">
                                          Historical price · PR {date(item.priceDate)}
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-3 py-3 whitespace-nowrap">
                                      {lineTotal(estimate, item) === null
                                        ? "Unpriced"
                                        : idr.format(lineTotal(estimate, item)!)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot className="border-t border-[#e8eaec] bg-[#f8fafb] font-semibold">
                                <tr>
                                  <td colSpan={5} className="px-3 py-3 text-right">Known subtotal</td>
                                  <td className="px-3 py-3 whitespace-nowrap">
                                    {idr.format(
                                      estimate.items.reduce(
                                        (sum, item) => sum + (lineTotal(estimate, item) ?? 0),
                                        0
                                      )
                                    )}
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>

                          <div className="mt-6 border-t border-[#e8eaec] pt-5">
                            <h2 className="text-sm font-semibold">PR/PO form</h2>
                            <p className="mt-1 text-sm leading-5 text-[#45484a]">
                              Demo only. This form is not connected to the PR/PO database.
                            </p>
                            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                              <label className="grid gap-1.5 text-sm font-medium">
                                Supplier
                                <input
                                  name="supplier"
                                  required
                                  defaultValue={submitted?.supplier}
                                  onChange={() => clearSubmission(estimate.id)}
                                  className="min-h-10 rounded-md border border-[#cdced1] px-3 font-normal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b6c80]"
                                />
                              </label>
                              <label className="grid gap-1.5 text-sm font-medium">
                                Expected delivery date
                                <input
                                  name="expectedDeliveryDate"
                                  type="date"
                                  required
                                  defaultValue={submitted?.expectedDeliveryDate}
                                  onChange={() => clearSubmission(estimate.id)}
                                  className="min-h-10 rounded-md border border-[#cdced1] px-3 font-normal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b6c80]"
                                />
                              </label>
                              <label className="grid gap-1.5 text-sm font-medium">
                                Requester
                                <input
                                  name="requester"
                                  required
                                  defaultValue={submitted?.requester}
                                  onChange={() => clearSubmission(estimate.id)}
                                  className="min-h-10 rounded-md border border-[#cdced1] px-3 font-normal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b6c80]"
                                />
                              </label>
                              <div className="flex items-end">
                                <button
                                  type="submit"
                                  className="min-h-10 w-full rounded-md bg-[#1b6c80] px-4 text-sm font-semibold text-white hover:bg-[#155768] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b6c80]"
                                >
                                  Submit demo form
                                </button>
                              </div>
                            </div>
                            {submitted && (
                              <p className="mt-4 rounded-md bg-[#eaf2f4] p-3 text-sm text-[#155768]" role="status">
                                Demo form submitted for {submitted.supplier}. Known subtotal: {idr.format(submitted.totalEstimatedIdr)}
                                {submitted.unpricedItemCount > 0 &&
                                  ` · ${submitted.unpricedItemCount} item(s) still need a price`}. No PR/PO was created or saved.
                              </p>
                            )}
                          </div>
                          </form>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
