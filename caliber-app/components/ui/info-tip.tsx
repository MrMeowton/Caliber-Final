"use client";

// Small "i" button for the top-right corner of a card / chart / table.
// Opens a plain-language explanation: what it is, where the data comes from, why it is there, how to read it.
import { Popover } from "@base-ui/react/popover";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { INFO, type InfoCopy, type InfoId } from "@/lib/info-copy";

const SECTIONS = [
  ["what", "Overview"],
  ["source", "Data source"],
  ["why", "Purpose"],
  ["read", "How to read it"],
] as const;

export function InfoTip({ id, className }: { id: InfoId; className?: string }) {
  const copy: InfoCopy = INFO[id];

  return (
    <Popover.Root>
      <Popover.Trigger
        openOnHover
        delay={200}
        closeDelay={150}
        aria-label={`About: ${copy.title}`}
        className={cn(
          "inline-grid h-7 w-7 shrink-0 place-items-center rounded-full text-[#8a8c8e] transition-colors hover:bg-[#f4f6f8] hover:text-[#1b6c80] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#1b6c80] data-[popup-open]:bg-[#e9f4f6] data-[popup-open]:text-[#1b6c80]",
          className
        )}
      >
        <Info className="h-4 w-4" aria-hidden="true" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="end" sideOffset={6} collisionPadding={12} className="z-[70]">
          <Popover.Popup className="max-h-[min(70vh,520px)] w-[min(360px,calc(100vw-24px))] origin-[var(--transform-origin)] overflow-y-auto rounded-lg border border-[#e8eaec] bg-white p-4 text-left text-[#131416] shadow-[0_12px_32px_rgba(19,20,22,0.14)] outline-none transition-[opacity,transform] duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            <Popover.Title className="text-sm font-semibold leading-5">{copy.title}</Popover.Title>
            <dl className="mt-3 space-y-3">
              {SECTIONS.map(([key, label]) =>
                copy[key] ? (
                  <div key={key}>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-[#1b6c80]">{label}</dt>
                    <dd className="mt-0.5 text-[13px] leading-5 text-[#353736]">{copy[key]}</dd>
                  </div>
                ) : null
              )}
            </dl>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
