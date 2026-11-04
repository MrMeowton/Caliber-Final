export type Summary = {
  kpi: Record<string, number> & { as_of?: string };
  classes: { cls: string; n: number; consumed: number; critical: number; model: string }[];
  chosen: { cls: string; model: string; wape: number; chosen: number }[];
  backtest: { scope: string; model: string; label: string; wape: number; bias: number; n: number }[];
  site: {
    month: string;
    kind: "history" | "forecast";
    baseline_idr: number;
    pm_idr: number;
    event_idr: number;
    baseline_p90_idr?: number;
    lines?: number;
  }[];
  scatter: { id: string; adi: number; cv2: number; cls: string; crit: string }[];
};

export type SkuRow = {
  material_no: string;
  description: string;
  unit: string;
  criticality: string;
  mrp_type: string;
  stock: number;
  min_qty: number;
  max_qty: number;
  demand_class: string;
  model: string;
  fc_12m: number;
  pm_planned_12m: number;
  pm_need_90d: number;
  price_idr: number | null;
  abnormal_lines: number;
  lt_p50: number;
};

export type Material = SkuRow & {
  family: string;
  n_funcloc: number;
  installed_qty: number;
  price_imputed: number;
  lt_p90: number;
  lt_source: string;
  n_po: number;
  otd: number | null;
  adi: number | null;
  cv2: number | null;
  tot_cons: number;
  nz_months: number;
  fc_baseline_m: number;
  fc_baseline_sd: number;
  hist_pm_m: number;
  hist_event_qty: number;
  hist_event_203: number;
  pm_jobs_12m: number;
  fc_12m_p90: number;
  annual_demand: number;
  ss_new: number;
  rop_new: number;
  cover_months: number | null;
};

export type SkuDetail = {
  material: Material;
  monthly: { month: string; component: "baseline" | "pm" | "event"; qty: number }[];
  backtest: Record<string, number | string> | null;
  pmNeed: {
    due_date: string;
    installed_qty: number;
    expected_qty: number;
    functional_location: string;
    funcloc_descrip: string;
    item_text: string;
    kind: string;
    criticality: string;
  }[];
  abnormal: { date: string; qty: number; median_qty: number; ratio: number; prefix: string; component: string }[];
  po: { pr_date: string; pr_delivery_date: string; po_delivery_date: string; qty: number; price_idr: number; supplier: string; lt: number; pr_type: string }[];
};
