// A number is never shown alone: it says whether it is good or bad, what it means, and what to do next.
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { InfoTip } from "@/components/ui/info-tip";
import type { InfoId } from "@/lib/info-copy";
import { StatusBadge, VERDICT_TEXT, type Verdict } from "@/components/ui/status";

export function MetricCard({
  label,
  value,
  verdict,
  verdictLabel,
  meaning,
  action,
  info,
  className,
}: {
  label: string;
  value: ReactNode;
  verdict: Verdict;
  verdictLabel?: string;
  meaning: ReactNode;
  action?: { label: string; onClick: () => void };
  info?: InfoId;
  className?: string;
}) {
  return (
    <div className={cn("relative flex min-w-0 flex-col rounded-lg border border-[#e8eaec] bg-white p-4", className)}>
      {info && <InfoTip id={info} className="absolute right-2 top-2" />}
      <p className="pr-8 text-sm font-medium text-[#353736]">{label}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        <p className={cn("text-[28px] font-semibold leading-9 tabular-nums", VERDICT_TEXT[verdict])}>{value}</p>
        <StatusBadge verdict={verdict}>{verdictLabel}</StatusBadge>
      </div>
      <p className="mt-1.5 flex-1 text-sm leading-5 text-[#353736]">{meaning}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-3 inline-flex min-h-9 items-center gap-1.5 self-start rounded-md border border-[#cdced1] px-3 text-sm font-semibold text-[#131416] hover:bg-[#f4f6f8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b6c80]"
        >
          {action.label}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
