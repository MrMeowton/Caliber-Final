// Shared formatting + assumptions for the Demand Intelligence page.

export function fmtIDR(v: number | null | undefined, { sign = false } = {}) {
  if (v == null || !Number.isFinite(v)) return "—";
  const s = sign && v > 0 ? "+" : v < 0 ? "−" : "";
  const a = Math.abs(v);
  if (a >= 1e12) return `${s}IDR ${(a / 1e12).toFixed(2)} trillion`;
  if (a >= 1e9) return `${s}IDR ${(a / 1e9).toFixed(a >= 1e11 ? 0 : 1)} billion`;
  if (a >= 1e6) return `${s}IDR ${(a / 1e6).toFixed(a >= 1e8 ? 0 : 1)} M`;
  if (a >= 1e3) return `${s}IDR ${(a / 1e3).toFixed(0)} k`;
  return `${s}IDR ${a.toFixed(0)}`;
}

export const fmtPct = (v: number | null | undefined, digits = 0) =>
  v == null || !Number.isFinite(v) ? "—" : `${(v * 100).toFixed(digits)}%`;

export const fmtNum = (v: number | null | undefined, digits = 0) =>
  v == null || !Number.isFinite(v)
    ? "—"
    : v.toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: 0 });

export const MONTH_LABEL = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-GB", { month: "short", year: "2-digit" });
};

/** Assumptions (team, to be validated). USD 1 = IDR 16,300. */
export const USD_IDR = 16300;
export const DOWNTIME_USD_PER_DAY: Record<string, number> = { S: 75_000, A: 37_500, B: 10_000, C: 2_000 };
/** Cost of a maintenance job waiting for a missing part (not a full unit trip), per day. */
export const JOB_WAIT_IDR_PER_DAY: Record<string, number> = { S: 100e6, A: 40e6, B: 10e6, C: 2e6 };
export const HOLDING_RATE = 0.2;
export const RUSH_PREMIUM = 0.15;

export const CLASS_COLORS: Record<string, string> = {
  Smooth: "#16a34a",
  Erratic: "#d97706",
  Intermittent: "#1257c7",
  Lumpy: "#c2410c",
  "No demand": "#94a3b8",
};

export const CRIT_STYLE: Record<string, string> = {
  S: "bg-red-100 text-red-700 border-red-200",
  A: "bg-orange-100 text-orange-700 border-orange-200",
  B: "bg-blue-100 text-blue-700 border-blue-200",
  C: "bg-slate-100 text-slate-600 border-slate-200",
};

export const MODEL_LABEL: Record<string, string> = {
  static_mean: "Static mean",
  moving_avg_3: "Adaptive 3-month mean",
  croston_sba: "Croston-SBA",
  tsb: "TSB",
  none: "No model (no demand)",
};
