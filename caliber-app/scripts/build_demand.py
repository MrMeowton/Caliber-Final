"""
Feature 2 - Demand Intelligence (Forecast, KQ1): offline precompute.

Reads the raw tables already in data/caliber_final.db and writes the fc_* tables
that the /api/demand/* routes serve. Run from caliber-app/:

    python3 scripts/build_demand.py

Notes
- Dates in the source tables were loaded with day/month swapped whenever the day
  was <= 12 (e.g. 6 May 2025 is stored as 2025-06-05). fix_date() undoes that;
  every fc_* table uses corrected dates. The raw tables are left untouched.
- Order numbers were stored as floats ("2.01E+11"); only the 3-digit prefix
  (201/203/209/...) survives, which is all the decomposition needs.
- PR-PO is read from pr_po_clean (exact duplicates already removed, 6,189 rows).
"""
import re
import sqlite3
import sys
from pathlib import Path

import numpy as np
import pandas as pd

DB = Path(__file__).resolve().parent.parent / "data" / "caliber_final.db"
AS_OF = pd.Timestamp("2026-10-01")          # data snapshot = 30 Sep 2026
SNAPSHOT_END = pd.Timestamp("2026-09-30")
HIST = pd.period_range("2025-05", "2026-09", freq="M")   # 17 months
FC = pd.period_range("2026-10", "2027-09", freq="M")     # 12-month horizon
FX = {"IDR": 1, "USD": 16300, "EUR": 18800, "JPY": 107, "SGD": 12600}
CRIT_RANK = {"S": 4, "A": 3, "B": 2, "C": 1}
Z = {"S": 2.33, "A": 1.65, "B": 1.28, "C": 0.84}

# order prefix -> demand component
COMPONENT = {"201": "baseline", "202": "baseline", "205": "baseline", "206": "baseline",
             "204": "pm", "203": "event", "209": "event"}


def fix_date(s: pd.Series) -> pd.Series:
    d = pd.to_datetime(s, errors="coerce")
    small = d.dt.day <= 12
    swapped = pd.to_datetime(
        dict(year=d.dt.year, month=d.dt.day.where(small, 1), day=d.dt.month.where(small, 1)),
        errors="coerce",
    )
    return d.where(~small, swapped)


def order_prefix(s: pd.Series) -> pd.Series:
    # "2.01E+11" -> "201"
    def one(v):
        if v is None or (isinstance(v, float) and np.isnan(v)):
            return None
        m = re.match(r"^(\d)\.(\d{2})", str(v))
        if m:
            return m.group(1) + m.group(2)
        return str(v)[:3]
    return s.map(one)


# ---------------------------------------------------------------- forecasting
def croston_sba(y, a=0.1):
    z = p = None
    q = 1
    for v in y:
        if v > 0:
            if z is None:
                z, p = v, q
            else:
                z += a * (v - z)
                p += a * (q - p)
            q = 1
        else:
            q += 1
    return 0.0 if z is None else (z / p) * (1 - a / 2)


def tsb(y, a=0.1, b=0.1):
    nz = y[y > 0]
    if len(nz) == 0:
        return 0.0
    z = nz[0]
    p = (y > 0).mean()
    for v in y:
        if v > 0:
            z += a * (v - z)
            p += b * (1 - p)
        else:
            p += b * (0 - p)
    return z * p


MODELS = {
    "static_mean": lambda y: float(np.mean(y)),          # what Min-Max review does today
    "moving_avg_3": lambda y: float(np.mean(y[-3:])),    # adaptive / recency
    "croston_sba": croston_sba,
    "tsb": tsb,
}
MODEL_LABEL = {
    "static_mean": "Static 12-month mean",
    "moving_avg_3": "Adaptive 3-month mean",
    "croston_sba": "Croston-SBA",
    "tsb": "TSB",
}


def classify(row: np.ndarray):
    nz = row[row > 0]
    if len(nz) == 0:
        return np.nan, np.nan, "No demand"
    adi = len(row) / len(nz)
    cv2 = (nz.std(ddof=0) / nz.mean()) ** 2 if len(nz) > 1 else 0.0
    if adi < 1.32:
        cls = "Smooth" if cv2 < 0.49 else "Erratic"
    else:
        cls = "Intermittent" if cv2 < 0.49 else "Lumpy"
    return adi, cv2, cls


def wape(f, a):
    s = a.sum()
    return float(np.abs(f - a).sum() / s) if s > 0 else np.nan


def bias(f, a):
    s = a.sum()
    return float((f - a).sum() / s) if s > 0 else np.nan


# ---------------------------------------------------------------- PM calendar
def cycle_to_offset(text: str):
    t = str(text).upper().strip()
    m = re.match(r"(\d+)", t)
    n = int(m.group(1)) if m else 1
    if "YEAR" in t:
        return pd.DateOffset(months=12 * n), 12 * n
    if "MONTH" in t:
        return pd.DateOffset(months=n), n
    if "WEEK" in t:
        return pd.DateOffset(weeks=n), n * 12 / 52
    return None, None


def pm_kind(text: str):
    """Part-consumption class of a maintenance item + replacement probability (assumption)."""
    t = str(text).lower()
    if "overhaul" in t:
        return "Overhaul", 1.0
    if "replacement" in t or "lube oil change" in t or "re-greasing" in t:
        return "Consumable replacement", 1.0
    if "cleaning" in t and ("burner" in t or "tube" in t or "inside" in t):
        return "Cleaning", 0.3
    if "int. insp" in t or "internal" in t or "recert" in t:
        return "Internal inspection / recert", 0.2
    return "Inspection / test (no parts)", 0.0


def main():
    con = sqlite3.connect(DB)
    rd = lambda q: pd.read_sql(q, con)

    # --- material master -------------------------------------------------
    bom = rd("select * from bom_clean")
    fl = rd("select functional_location, funcloc_descrip, funcloc_criticality from funcloc_clean")
    b = bom.merge(fl, left_on="functional_loc", right_on="functional_location", how="left")
    b["cr"] = b.funcloc_criticality.map(CRIT_RANK)
    mat = b.groupby("material_no").agg(
        description=("material_desc", "first"), unit=("unit", "first"),
        min_qty=("min_qty", "first"), max_qty=("max_qty", "first"),
        stock=("stock", "first"), mrp_type=("mrp_type", "first"),
        n_funcloc=("functional_loc", "nunique"), installed_qty=("installed_qty", "sum"),
        crit_rank=("cr", "max"),
    )
    mat["criticality"] = mat.crit_rank.map({v: k for k, v in CRIT_RANK.items()}).fillna("C")
    mat["family"] = mat.description.str.split(",").str[0].str.strip()
    print("materials", len(mat))

    # --- procurement: price + lead time ---------------------------------
    pr = rd("select * from pr_po_clean")
    for c in ["pr_date", "pr_delivery_date", "po_delivery_date"]:
        pr[c] = fix_date(pr[c])
    # po_item_amount is the LINE value (unit price × PR quantity), so divide by quantity to get a unit price.
    pr["price_idr"] = pr.po_item_amount * pr.po_currency.map(FX) / pr.pr_quantity.where(pr.pr_quantity > 0)
    pr["lt"] = (pr.po_delivery_date - pr.pr_date).dt.days.clip(lower=0)
    pr["on_time"] = pr.po_delivery_date <= pr.pr_delivery_date
    g = pr.groupby("pr_material")
    proc = pd.DataFrame({
        "price_idr": g.price_idr.median(),
        "lt_p50": g.lt.median(),
        "lt_p90": g.lt.quantile(0.9),
        "n_po": g.lt.size(),
        "otd": g.on_time.mean(),
    })
    mat = mat.join(proc)
    famprice = mat.groupby("family").price_idr.median()
    mat["price_imputed"] = mat.price_idr.isna() & mat.family.map(famprice).notna()
    mat["price_idr"] = mat.price_idr.fillna(mat.family.map(famprice))
    famlt = mat.groupby("family").lt_p50.median()
    famlt90 = mat.groupby("family").lt_p90.median()
    mat["lt_source"] = np.where(mat.lt_p50.notna(), "material", np.where(mat.family.map(famlt).notna(), "family", "global"))
    mat["lt_p50"] = mat.lt_p50.fillna(mat.family.map(famlt)).fillna(42.0)
    mat["lt_p90"] = mat.lt_p90.fillna(mat.family.map(famlt90)).fillna(80.0)

    # --- movements ------------------------------------------------------
    mv = rd("select material_number material_no, posting_date, quantity qty, base_unit, order_no from movement_material")
    mv["date"] = fix_date(mv.posting_date)
    mv["prefix"] = order_prefix(mv.order_no)
    mv["component"] = mv.prefix.map(COMPONENT).fillna("baseline")
    mv["m"] = mv.date.dt.to_period("M")
    print("movement", len(mv), mv.date.min().date(), mv.date.max().date())

    def monthly(df):
        return (df.groupby(["material_no", "m"]).qty.sum().unstack(fill_value=0)
                .reindex(columns=HIST, fill_value=0))

    cm = monthly(mv)
    idx = cm.index
    comp = {k: monthly(mv[mv.component == k]).reindex(idx, fill_value=0) for k in ["baseline", "pm", "event"]}
    stat = comp["baseline"] + comp["pm"]          # event-cleaned (turnaround / project removed)
    M = len(HIST)

    # classification on all demand (consistent with fact base F3)
    cl = pd.DataFrame([classify(r) for r in cm.values], index=idx, columns=["adi", "cv2", "demand_class"])
    mat = mat.join(cl)
    mat["demand_class"] = mat.demand_class.fillna("No demand")
    mat["tot_cons"] = cm.sum(axis=1).reindex(mat.index).fillna(0)
    mat["nz_months"] = (cm > 0).sum(axis=1).reindex(mat.index).fillna(0).astype(int)
    print(mat.demand_class.value_counts().to_dict())

    # --- backtest: train May25-Apr26, test May-Sep26 --------------------
    TR, H = 12, M - 12
    A_all = cm.values
    trainmask = A_all[:, :TR].sum(axis=1) > 0
    act_test = A_all[:, TR:].sum(axis=1)

    # Candidates are scored on the 5-month holdout. Two families:
    #   raw    = model fitted on full history (what a planner averaging past issues gets)
    #   clean  = same model on event-cleaned history (turnaround 203 / project 209 removed)
    # "MIND" headline = event-cleaned adaptive 3-month mean, fixed BEFORE looking at the test.
    # The per-class winner among clean models on this most recent holdout is the method used
    # for the forward forecast (standard "select on latest holdout, then refit" practice).
    S = stat.values
    cls_arr = mat.demand_class.reindex(idx).values
    fc_test = {}
    for k, f in MODELS.items():
        fc_test[k] = np.array([f(r) for r in A_all[:, :TR]]) * H
        fc_test["clean_" + k] = np.array([f(r) for r in S[:, :TR]]) * H
    fc_test["mind"] = fc_test["clean_moving_avg_3"]
    val_rows = []
    for cls in ["Smooth", "Erratic", "Intermittent", "Lumpy"]:
        sel = trainmask & (cls_arr == cls)
        for k in MODELS:
            val_rows.append((cls, k, wape(fc_test["clean_" + k][sel], act_test[sel])))
    val = pd.DataFrame(val_rows, columns=["cls", "model", "wape"])
    chosen = val.loc[val.groupby("cls").wape.idxmin()].set_index("cls").model.to_dict()
    print("chosen per class", chosen)
    fc_test["mind_class"] = np.array([fc_test["clean_" + chosen.get(c, "moving_avg_3")][i] if c in chosen else
                                      fc_test["clean_moving_avg_3"][i] for i, c in enumerate(cls_arr)])

    bt_rows = []
    for k, f in fc_test.items():
        bt_rows.append(dict(scope="All SKUs with training demand", model=k,
                            wape=wape(f[trainmask], act_test[trainmask]),
                            bias=bias(f[trainmask], act_test[trainmask]), n=int(trainmask.sum())))
        for cls in ["Smooth", "Erratic", "Intermittent", "Lumpy"]:
            sel = trainmask & (cls_arr == cls)
            bt_rows.append(dict(scope=cls, model=k, wape=wape(f[sel], act_test[sel]),
                                bias=bias(f[sel], act_test[sel]), n=int(sel.sum())))
    bt = pd.DataFrame(bt_rows)
    bt["label"] = bt.model.map({**MODEL_LABEL, **{"clean_" + k: v + " (event-cleaned)" for k, v in MODEL_LABEL.items()},
                            "mind": "MIND Spares (event-cleaned adaptive)",
                            "mind_class": "Per-class best (selected on this holdout)"})
    print(bt[bt.scope.str.startswith("All")].to_string())
    new_in_test = int(((~trainmask) & (act_test > 0)).sum())
    gone_in_test = int((trainmask & (act_test == 0)).sum())
    print("new demand in test", new_in_test, "zero in test", gone_in_test)

    # per-item backtest (for the SKU page)
    item_bt = pd.DataFrame({k: v for k, v in fc_test.items()}, index=idx)
    item_bt["actual"] = act_test

    # --- final forecast (12 months ahead), fit on full event-cleaned history ----
    base_hist = comp["baseline"].values
    mu_b, sd_b, model_used = [], [], []
    for i, cls in enumerate(cls_arr):
        k = chosen.get(cls, "moving_avg_3")
        model_used.append(k)
        mu_b.append(MODELS[k](base_hist[i]))
        sd_b.append(float(np.std(base_hist[i], ddof=0)))
    hist_pm_rate = comp["pm"].values.mean(1)
    fdf = pd.DataFrame({"fc_baseline_m": mu_b, "fc_baseline_sd": sd_b, "model": model_used,
                        "hist_pm_m": hist_pm_rate,
                        "hist_event_qty": comp["event"].values.sum(axis=1),
                        "hist_event_203": monthly(mv[mv.prefix == "203"]).reindex(idx, fill_value=0).values.sum(axis=1)},
                       index=idx)
    mat = mat.join(fdf)
    for c in ["fc_baseline_m", "fc_baseline_sd", "hist_pm_m", "hist_event_qty", "hist_event_203"]:
        mat[c] = mat[c].fillna(0.0)
    mat["model"] = mat.model.fillna("none")

    # --- PM calendar: occurrences Jul 2026 - Dec 2027 ------------------
    mp = rd("select * from mitem_mplan_clean")
    mp["start"] = fix_date(mp.start_of_cycle)
    win_lo, win_hi = pd.Timestamp("2026-07-01"), pd.Timestamp("2027-12-31")
    occ = []
    for r in mp.itertuples():
        off, cyc_m = cycle_to_offset(r.cycle_descriptions)
        if off is None or pd.isna(r.start):
            continue
        kind, p = pm_kind(r.maint_item_text)
        d, k = r.start, 0
        if d < win_lo:
            # jump close to the window first, then step
            steps = int(((win_lo - d).days / 30.44) // max(cyc_m, 0.25)) - 1
            if steps > 0:
                d = d + off * steps
        while d < win_lo and k < 5000:
            d, k = d + off, k + 1
        while d <= win_hi:
            occ.append((str(r.maintenance_item), r.functional_location, r.funcloc_descrip,
                        r.maint_item_text, kind, p, round(cyc_m, 2), d.strftime("%Y-%m-%d")))
            d = d + off
    occ = pd.DataFrame(occ, columns=["maintenance_item", "functional_location", "funcloc_descrip",
                                     "item_text", "kind", "p_replace", "cycle_months", "due_date"])
    occ = occ.merge(fl[["functional_location", "funcloc_criticality"]], on="functional_location", how="left")
    occ = occ.rename(columns={"funcloc_criticality": "criticality"})
    occ["occ_id"] = np.arange(len(occ))
    print("pm occurrences", len(occ),
          "due Oct26-Sep27", ((occ.due_date >= "2026-10-01") & (occ.due_date <= "2027-09-30")).sum())

    parts_occ = occ[occ.p_replace > 0]
    need = parts_occ[["occ_id", "functional_location", "p_replace", "due_date"]].merge(
        bom[["functional_loc", "material_no", "installed_qty"]],
        left_on="functional_location", right_on="functional_loc")
    # consumable jobs only draw their own consumable family (a filter change does not use the bearing)
    need = need.merge(parts_occ[["occ_id", "item_text"]], on="occ_id").merge(
        mat[["family"]], left_on="material_no", right_index=True, how="left")
    txt = need.item_text.str.lower()
    fam = need.family.fillna("")
    keep = ~(txt.str.contains("filter") & ~fam.isin(["FILTER ELEMENT", "SCREEN"]))
    keep &= ~(txt.str.contains("lube oil") & (fam != "OIL"))
    keep &= ~(txt.str.contains("greas") & (fam != "GREASE"))
    need = need[keep]
    need["expected_qty"] = need.installed_qty * need.p_replace
    need = need[["occ_id", "material_no", "installed_qty", "expected_qty", "due_date"]]
    print("pm need rows", len(need))

    # PM-planned demand per material per forecast month (expected qty)
    need["m"] = pd.to_datetime(need.due_date).dt.to_period("M")
    pm_fc = (need[need.m.isin(FC)].groupby(["material_no", "m"]).expected_qty.sum()
             .unstack(fill_value=0).reindex(columns=FC, fill_value=0))
    mat["pm_planned_12m"] = pm_fc.sum(axis=1).reindex(mat.index).fillna(0)
    nxt90 = need[(need.due_date >= "2026-10-01") & (need.due_date < "2026-12-30")]
    mat["pm_need_90d"] = nxt90.groupby("material_no").installed_qty.sum().reindex(mat.index).fillna(0)
    mat["pm_jobs_12m"] = (need[need.m.isin(FC)].groupby("material_no").occ_id.nunique()
                          .reindex(mat.index).fillna(0).astype(int))

    # Forecast summary per SKU
    mat["fc_12m"] = mat.fc_baseline_m * 12 + mat.pm_planned_12m
    mat["fc_12m_p90"] = mat.fc_baseline_m * 12 + 1.2816 * mat.fc_baseline_sd * np.sqrt(12) + mat.pm_planned_12m
    mat["annual_demand"] = mat.fc_12m
    mu_d = mat.fc_12m / 365
    sd_d = mat.fc_baseline_sd * np.sqrt(12) / np.sqrt(365)
    z = mat.criticality.map(Z).fillna(0.84)
    mat["ss_new"] = np.ceil(z * sd_d * np.sqrt(mat.lt_p50))
    mat["rop_new"] = np.ceil(mu_d * mat.lt_p50 + mat.ss_new)
    mat["cover_months"] = np.where(mat.fc_12m > 0, mat.stock / (mat.fc_12m / 12), np.nan)

    # --- abnormal consumption: line qty > 5x item median ---------------
    med = mv.groupby("material_no").qty.transform("median")
    ab = mv[mv.qty > 5 * med].copy()
    ab["median_qty"] = med[ab.index]
    ab["ratio"] = ab.qty / ab.median_qty
    ab = ab.join(mat[["description", "unit", "criticality", "price_idr"]], on="material_no")
    ab["value_idr"] = ab.qty * ab.price_idr
    ab["date"] = ab.date.dt.strftime("%Y-%m-%d")
    ab = ab[["date", "material_no", "description", "unit", "criticality", "qty", "median_qty", "ratio",
             "prefix", "component", "value_idr"]].sort_values("ratio", ascending=False)
    mat["abnormal_lines"] = ab.groupby("material_no").size().reindex(mat.index).fillna(0).astype(int)
    print("abnormal lines", len(ab))

    # --- site-level monthly series (value IDR) ---------------------------
    pv = mat.price_idr.reindex(idx).fillna(0).values
    site = pd.DataFrame({"month": [str(p) for p in HIST]})
    for k in ["baseline", "pm", "event"]:
        site[k + "_idr"] = (comp[k].values * pv[:, None]).sum(0)
    site["lines"] = mv.groupby("m").size().reindex(HIST).fillna(0).values
    for k in ["baseline", "pm", "event"]:
        site[k + "_lines"] = mv[mv.component == k].groupby("m").size().reindex(HIST).fillna(0).values
    site["kind"] = "history"

    pm_val = (pm_fc.reindex(mat.index, fill_value=0).values * mat.price_idr.fillna(0).values[:, None]).sum(0)
    pr_all = mat.price_idr.fillna(0).values
    base_val = float((mat.fc_baseline_m.values * pr_all).sum())
    base_sd_val = float(np.sqrt(((mat.fc_baseline_sd.values * pr_all) ** 2).sum()))
    fut = pd.DataFrame({"month": [str(p) for p in FC], "baseline_idr": base_val,
                        "baseline_p90_idr": base_val + 1.2816 * base_sd_val,
                        "pm_idr": pm_val, "event_idr": 0.0, "kind": "forecast"})
    site = pd.concat([site, fut], ignore_index=True)

    # monthly turnaround (order 203) value profile, for the "repeat turnaround" scenario
    ta_val = (monthly(mv[mv.prefix == "203"]).reindex(idx, fill_value=0).values * pv[:, None]).sum(0)
    ta_total_idr = float(ta_val.sum())

    # --- event-cleaned history per material (monthly, long format) ----------
    long = []
    for k in ["baseline", "pm", "event"]:
        t = comp[k].stack().rename("qty").reset_index()
        t.columns = ["material_no", "month", "qty"]
        t["component"] = k
        long.append(t[t.qty > 0])
    mm = pd.concat(long)
    mm["month"] = mm.month.astype(str)

    # --- KPIs ------------------------------------------------------------
    allrow = bt[bt.scope.str.startswith("All")].set_index("model")
    nxt12 = occ[(occ.due_date >= "2026-10-01") & (occ.due_date <= "2027-09-30")]
    kpi = {
        "materials": int(len(mat)),
        "consumed": int((mat.tot_cons > 0).sum()),
        "zero_consumption": int((mat.tot_cons == 0).sum()),
        "non_smooth_share": float(mat.demand_class.isin(["Intermittent", "Lumpy", "Erratic"]).sum() / max(1, (mat.tot_cons > 0).sum())),
        "wape_static": float(allrow.loc["static_mean", "wape"]),
        "bias_static": float(allrow.loc["static_mean", "bias"]),
        "wape_mind": float(allrow.loc["mind", "wape"]),
        "bias_mind": float(allrow.loc["mind", "bias"]),
        "wape_mind_class": float(allrow.loc["mind_class", "wape"]),
        "bias_mind_class": float(allrow.loc["mind_class", "bias"]),
        "backtest_items": int(trainmask.sum()),
        "new_in_test": new_in_test,
        "gone_in_test": gone_in_test,
        "pm_items_12m": int(nxt12.maintenance_item.nunique()),
        "pm_occurrences_12m": int(len(nxt12)),
        "pm_funclocs_12m": int(nxt12.functional_location.nunique()),
        "pm_part_jobs_12m": int((nxt12.p_replace > 0).sum()),
        "pm_part_items_12m": int(nxt12[nxt12.p_replace > 0].maintenance_item.nunique()),
        "pm_materials_12m": int(need[need.m.isin(FC)].material_no.nunique()),
        "abnormal_lines": int(len(ab)),
        "abnormal_share": float(len(ab) / len(mv)),
        "event_qty_share": float(mv[mv.component == "event"].qty.sum() / mv.qty.sum()),
        "ta_total_idr": ta_total_idr,
        "as_of": AS_OF.strftime("%Y-%m-%d"),
    }
    kpi_df = pd.DataFrame([(k, str(v)) for k, v in kpi.items()], columns=["key", "value"])
    print(kpi)

    # --- inventory events for the as-of race (stock reconstruction) -------
    mv_out = mv[["material_no", "date", "qty", "prefix", "component"]].copy()
    mv_out["date"] = mv_out.date.dt.strftime("%Y-%m-%d")
    po_out = pr[["pr_material", "pr_date", "pr_delivery_date", "po_delivery_date", "pr_quantity",
                 "price_idr", "po_supplier_name", "lt", "pr_type", "purchase_requisition"]].rename(
        columns={"pr_material": "material_no", "pr_quantity": "qty", "po_supplier_name": "supplier"})
    for c in ["pr_date", "pr_delivery_date", "po_delivery_date"]:
        po_out[c] = po_out[c].dt.strftime("%Y-%m-%d")

    # --- write -----------------------------------------------------------
    keep = ["description", "family", "unit", "mrp_type", "criticality", "stock", "min_qty", "max_qty",
            "n_funcloc", "installed_qty", "price_idr", "price_imputed", "lt_p50", "lt_p90", "lt_source", "n_po",
            "otd", "demand_class", "adi", "cv2", "tot_cons", "nz_months", "model", "fc_baseline_m",
            "fc_baseline_sd", "hist_pm_m", "hist_event_qty", "hist_event_203", "pm_planned_12m", "pm_need_90d",
            "pm_jobs_12m", "fc_12m", "fc_12m_p90", "annual_demand", "ss_new", "rop_new", "cover_months",
            "abnormal_lines"]
    out = mat[keep].reset_index()
    out["price_imputed"] = out.price_imputed.astype(int)

    cur = con.cursor()
    for t in ["fc_material", "fc_monthly", "fc_site_monthly", "fc_backtest", "fc_item_backtest",
              "fc_pm_occ", "fc_pm_need", "fc_abnormal", "fc_kpi", "fc_mv", "fc_po", "fc_model_select"]:
        cur.execute(f"drop table if exists {t}")
    con.commit()
    out.to_sql("fc_material", con, index=False)
    mm.to_sql("fc_monthly", con, index=False)
    site.to_sql("fc_site_monthly", con, index=False)
    bt.to_sql("fc_backtest", con, index=False)
    val.assign(chosen=lambda d: d.apply(lambda r: chosen.get(r.cls) == r.model, axis=1).astype(int)).to_sql(
        "fc_model_select", con, index=False)
    ib = item_bt.reset_index()
    ib.to_sql("fc_item_backtest", con, index=False)
    occ.to_sql("fc_pm_occ", con, index=False)
    need.drop(columns=["m"]).to_sql("fc_pm_need", con, index=False)
    ab.to_sql("fc_abnormal", con, index=False)
    kpi_df.to_sql("fc_kpi", con, index=False)
    mv_out.to_sql("fc_mv", con, index=False)
    po_out.to_sql("fc_po", con, index=False)
    for stmt in [
        "create unique index ix_fc_material on fc_material(material_no)",
        "create index ix_fc_monthly on fc_monthly(material_no)",
        "create index ix_fc_item_bt on fc_item_backtest(material_no)",
        "create index ix_fc_pm_occ_due on fc_pm_occ(due_date)",
        "create index ix_fc_pm_need_occ on fc_pm_need(occ_id)",
        "create index ix_fc_pm_need_mat on fc_pm_need(material_no, due_date)",
        "create index ix_fc_mv on fc_mv(material_no, date)",
        "create index ix_fc_po on fc_po(material_no, pr_date)",
        "create index ix_fc_abn on fc_abnormal(material_no)",
    ]:
        cur.execute(stmt)
    con.commit()
    cur.execute("vacuum")
    con.close()
    print("done ->", DB, f"{DB.stat().st_size/1e6:.1f} MB")


if __name__ == "__main__":
    sys.exit(main())
