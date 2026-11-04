"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { CLASS_COLORS, CRIT_STYLE } from "@/lib/demand/format";
import { InfoTip } from "@/components/ui/info-tip";
import { StatusBadge } from "@/components/ui/status";
import type { InfoId } from "@/lib/info-copy";

// subtitle is accepted but not rendered: explanations live in the card's ⓘ.
export function Card({ title, right, info, children, className }: {
  title?: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  info?: InfoId;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("relative min-w-0 rounded-lg border border-[#e8eaec] bg-white p-5", info && !(title || right) && "pr-10", className)}>
      {(title || right) && (
        <div className={cn("mb-4 flex flex-wrap items-start justify-between gap-3", info && "pr-7")}>
          <div className="min-w-0">
            {title && <h3 className="text-base font-semibold text-[#131416]">{title}</h3>}
          </div>
          {right}
        </div>
      )}
      {info && <InfoTip id={info} className="absolute right-2.5 top-2.5" />}
      {children}
    </section>
  );
}

export function Kpi({ label, value, sub, tone, info }: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "good" | "bad" | "warn" | "info";
  info?: InfoId;
}) {
  const toneCls = {
    good: "text-[#1e7b4f]",
    bad: "text-[#b42318]",
    warn: "text-[#8a5300]",
    info: "text-[#1b6c80]",
  };
  // Same colour rule as the rest of the app: every judged number says whether it is good or bad.
  const verdict = tone === "bad" ? { v: "act" as const, l: "Poor" } : tone === "warn" ? { v: "watch" as const, l: "Watch" } : tone === "good" ? { v: "ok" as const, l: "Good" } : null;
  return (
    <div className="relative min-w-0 rounded-lg border border-[#e8eaec] bg-white px-4 py-3.5">
      {info && <InfoTip id={info} className="absolute right-1.5 top-1.5" />}
      <p className={cn("text-sm font-medium text-[#353736]", info && "pr-6")}>{label}</p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <p className={cn("text-2xl font-semibold tabular-nums text-[#131416]", tone && toneCls[tone])}>{value}</p>
        {verdict && <StatusBadge verdict={verdict.v}>{verdict.l}</StatusBadge>}
      </div>
      {sub && <p className="mt-0.5 text-[13px] leading-5 text-[#45484a]">{sub}</p>}
    </div>
  );
}

/** Everyday names for the Syntetos–Boylan demand classes; the technical name stays in the tooltip. */
export const CLASS_LABEL: Record<string, string> = {
  Smooth: "Regular demand",
  Erratic: "Frequent, uneven amounts",
  Intermittent: "Rare, steady amounts",
  Lumpy: "Rare & irregular",
  "No demand": "No demand",
};

export function ClassBadge({ cls }: { cls: string }) {
  const c = CLASS_COLORS[cls] ?? "#94a3b8";
  return (
    <span
      title={`Demand class: ${cls} (Syntetos–Boylan)`}
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold"
      style={{ color: c, borderColor: `${c}55`, background: `${c}12` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />
      {CLASS_LABEL[cls] ?? cls}
    </span>
  );
}

export function CritBadge({ crit }: { crit: string }) {
  return (
    <span className={cn("inline-flex h-5 min-w-5 items-center justify-center rounded-md border px-1 text-[11px] font-bold", CRIT_STYLE[crit] ?? CRIT_STYLE.C)}>
      {crit}
    </span>
  );
}

export function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "red" | "amber" | "green" | "blue" }) {
  const cls = {
    neutral: "bg-[#f4f6f8] text-[#353736]",
    red: "bg-[#ffedea] text-[#831c1e]",
    amber: "bg-[#fffbeb] text-[#92400e]",
    green: "bg-[#dcfae5] text-[#14532d]",
    blue: "bg-[#e9f4f6] text-[#155768]",
  }[tone];
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold", cls)}>{children}</span>;
}

export function Slider({ label, value, min, max, step = 1, onChange, format }: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <label className="block min-w-[160px] flex-1">
      <span className="flex items-baseline justify-between gap-2 text-xs text-[#5f7189]">
        {label}
        <b className="font-semibold text-[#15243a]">{format ? format(value) : value}</b>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-[#1b6c80]"
      />
    </label>
  );
}

export function Segmented<T extends string>({ value, options, onChange }: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-md border border-[#cdced1] bg-[#f4f6f8] p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "min-h-8 rounded px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[#1b6c80]",
            value === o.value ? "bg-white text-[#131416]" : "text-[#5d5f60] hover:text-[#131416]"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Loading({ text = "Loading…" }: { text?: string }) {
  return <p className="py-10 text-center text-sm text-[#5d5f60]" role="status">{text}</p>;
}

export function ErrorNote({ error }: { error: string }) {
  return <p className="rounded-md bg-[#ffedea] px-4 py-3 text-sm text-[#831c1e]" role="alert">{error}</p>;
}

/** Sources and caveats now live in the header "Data notes" and in each card's ⓘ, so inline footnotes render nothing. */
export function Source(_: { children: ReactNode }) {
  return null;
}

export async function getJSON<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal, cache: "no-store" });
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error ?? `Request failed (${res.status})`);
  return body as T;
}
