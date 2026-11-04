"use client";

// Every caveat about the data in one place, instead of small print under each chart.
import { Popover } from "@base-ui/react/popover";
import { Info } from "lucide-react";

const NOTES: Array<[string, string]> = [
  ["Dummy data", "All numbers come from the anonymised CALIBER 2026 case files (SAP extract). Money values are illustrative; a few very large stock positions dominate the totals."],
  ["Snapshot date", "Stock is as of 30 Sep 2026. Forecasts and plans start on 1 Oct 2026 and cover 12 months. The Monitor KPIs count 'last 12 months' from today."],
  ["History length", "Warehouse issues cover May 2025 – Sep 2026 (17 months). The 24-month obsolete rule cannot be measured yet, so 'potentially obsolete' is a proxy: never used in 17 months, nothing planned, nothing on order."],
  ["Prices", "Unit price = PO line amount ÷ PR quantity, median per part, other currencies converted to IDR. Parts without purchase history borrow the median price of their family (marked 'imputed')."],
  ["Lead time", "Lead time = days from purchase request to the supplier's promised delivery date. Actual goods-receipt dates are not in the data, so supplier performance is a promise-date proxy."],
  ["Failures", "Failures = N1 malfunction and N2 emergency notifications, with routine work (painting, scaffolding, insulation, cleaning) removed. A failure is linked to a part through the equipment's BoM and the words in the notification."],
  ["Maintenance demand", "Parts for planned jobs = installed quantity × replacement chance by job type (overhaul and consumables 100%, cleaning 30%, internal inspection 20%). Team assumption."],
  ["Order types", "Order prefix 201/202/205/206 = everyday use, 204 = planned maintenance, 203/209 = turnaround and projects. Team assumption."],
  ["Cost assumptions", "A job waiting for a part costs IDR 100 / 40 / 10 / 2 M per day for criticality S / A / B / C, holding cost 20% per year, rush premium 15%. To be validated with Finance and Production Planning."],
  ["Service levels", "Recommended stock targets 99% (S), 97.5% (A), 95% (B) and 90% (C) availability."],
  ["AI", "AI answers come from Google Gemini and can be wrong. Every AI result shows its evidence and needs a person to approve it. When AI is unavailable, a rule-based result is shown and labelled."],
  ["Read-only", "Nothing is written to SAP or any control system. Drafts, approvals and assignments stay in this browser."],
  ["3D models", "Equipment and part shapes are representative models, not as-built drawings."],
];

export function DataNotes() {
  return (
    <Popover.Root>
      <Popover.Trigger className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-md border border-[#cdced1] bg-white px-3 text-sm font-medium text-[#131416] hover:bg-[#f4f6f8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b6c80] data-[popup-open]:bg-[#e9f4f6]">
        <Info className="h-4 w-4 text-[#1b6c80]" aria-hidden="true" />
        Data notes
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="end" sideOffset={6} collisionPadding={12} className="z-[70]">
          <Popover.Popup className="max-h-[min(75vh,640px)] w-[min(460px,calc(100vw-24px))] overflow-y-auto rounded-lg border border-[#e8eaec] bg-white p-5 text-[#131416] shadow-[0_12px_32px_rgba(19,20,22,0.14)] outline-none transition-[opacity,transform] duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0">
            <Popover.Title className="text-base font-semibold">Data notes</Popover.Title>
            <Popover.Description className="mt-1 text-sm text-[#45484a]">What the numbers in this prototype rest on, and their limits.</Popover.Description>
            <dl className="mt-4 space-y-3.5">
              {NOTES.map(([title, text]) => (
                <div key={title}>
                  <dt className="text-sm font-semibold">{title}</dt>
                  <dd className="mt-0.5 text-sm leading-5 text-[#353736]">{text}</dd>
                </div>
              ))}
            </dl>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
