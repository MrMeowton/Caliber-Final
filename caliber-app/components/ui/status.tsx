// One colour rule for the whole app: red = act now, amber = watch, green = OK.
// Used for badges and table rows only, never for neutral labels such as "Max".
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type Verdict = "act" | "watch" | "ok";

export const VERDICT_LABEL: Record<Verdict, string> = { act: "Act now", watch: "Watch", ok: "OK" };

const BADGE: Record<Verdict, string> = {
  act: "bg-[#ffedea] text-[#9b1c1f]",
  watch: "bg-[#fff4d6] text-[#7a4a00]",
  ok: "bg-[#dcfae5] text-[#14532d]",
};
const DOT: Record<Verdict, string> = { act: "bg-[#d92d20]", watch: "bg-[#e0a100]", ok: "bg-[#1e9e5a]" };

export const VERDICT_TEXT: Record<Verdict, string> = { act: "text-[#b42318]", watch: "text-[#8a5300]", ok: "text-[#1e7b4f]" };
export const VERDICT_ROW: Record<Verdict, string> = { act: "bg-[#fff6f5]", watch: "bg-[#fffbf0]", ok: "" };

export function StatusBadge({ verdict, children, className }: { verdict: Verdict; children?: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold", BADGE[verdict], className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", DOT[verdict])} aria-hidden="true" />
      {children ?? VERDICT_LABEL[verdict]}
    </span>
  );
}
