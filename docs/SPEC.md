# SPEC — sumber kebenaran build (EN, maks. 80 baris)

# MIND Spares — Right part, right place, right time, at the right cost.

## Goal
Help materials planners (with reliability-engineer approval) to reorder, keep, reduce or watch each spare part before the job needs it, so that critical SKUs at zero stock fall from 116 to ≤ 30 and excess value drops 10% (IDR 440 bn baseline).
Plant context: Chandra Asri cracker site — Plant PX (cracking furnaces BF-101…112, turbines KT-, compressors KC-, pumps PP-), PY, UT → `data/config.json` (replace demo assets with BF-111, BF-112, BF-105, KT-4, KC-210D, PP-1574B).

## Users
| Persona | Scenario | Decision they make |
|---|---|---|
| Rina, Materials Planner (primary) | Morning review of 3,656 stock items | Approve / edit / reject reorder, stop-buy, new Min–Max |
| Bima, Reliability Engineer | Burner cleaning on BF-112 / BF-111 due in Oct 2026 | Sign off criticality S/A items, PM part needs |
| Plant manager | Monthly inventory review | Service-level target vs inventory value, disposal |

## Features (F0 = gong, max 3 core)
| ID | Feature | Acceptance (Given / When / Then) | KPI |
|---|---|---|---|
| F0 | Time-machine + closed loop: TimeSlider (1 Jul → 30 Sep 2026) sets "today"; upcoming PM jobs whose parts are short turn red; Approve → PR draft → ImpactCounter | Given today = 2026-08-01, then BF-112 burner cleaning (due 2026-10-07) shows gate valve 4100034704 short: projected stock at job date = stock (≈4) − forecast issues + open POs arriving before the job (open PO lands 2026-10-31, too late) < need; label "flagged 67 days before the job". Approve creates a PR draft row and the counter rises | Critical SKUs at zero stock 116 → ≤ 30 |
| F1 | Action Queue + SKU detail: top-20 by risk × cost; detail shows 17-mo consumption + forecast + P90 band, demand class, PM due, notifications, LT P50/P90, old vs new Min/Max/SS/ROP, "Why?" | Given SKU 4100034704, when opened, then new ROP/Max, reasons, sources (tables) and confidence are shown and Approve/Reject/Edit writes to decision_log | Forecast WAPE 126% → ≤ 80% |
| F2 | Inventory Health + Cost–Risk simulator: buckets stockout risk / below Min / overstock / slow / non-moving / insurance / data-quality; sliders for service level S/A/B/C | Given defaults (S 99, A 95, B 90, C 80%), when I move a slider, then inventory value, expected stockout cost and total cost update in < 1 s; KT-4 thrust pad 4300039461 (862 vs Max 30, zero use) shows REDUCE (keep 2) | Excess value −10%; avoided buys IDR 20.9 bn/yr |

## Traceability & human oversight
- "Why this recommendation?" shows reason · sources (tables: movement, pm_item, notification, po_line, bom) · confidence (High/Medium/Low from demand class + data points).
- Approver role: planner; criticality S/A or value change > IDR 100 M also needs reliability engineer · after approval: PR draft / parameter change exported as CSV (SAP upload format).
- Never writes to SAP or control systems. Critical items keep an insurance floor the model cannot reduce.

## Data (SQLite `data/mindspares.db`, required by brief; built offline from the 6 case Excel files with Python)
| Table | Fields | Used by |
|---|---|---|
| config.json | plant, unit, assets (tag, name, type, pos, health, desc) | all |
| funcloc / bom / material | funcloc_id, criticality, plant · material_no, desc, unit, mrp_type, stock, min, max, crit_max | F0–F2 |
| movement_monthly | material_no, month, qty, qty_event (orders 203/209) | F1 |
| pm_item | funcloc_id, text, cycle_months, next_due | F0, F1 |
| notification / po_line | funcloc_id, priority, dates · material_no, pr_date, req_date, delivery_date, unit_price_idr, supplier, lt_days | F0, F1 |
| stock_daily (demo SKUs only) | material_no, date, stock = snapshot + issues since date − PO receipts since date (clip ≥ 0) | F0 |
| material_metrics / recommendation | demand_class, adi, cv2, forecast_m, p90, planned_90d, lt_p50, lt_p90, price · action, new_min, new_max, new_ss, reorder_qty, risk_score, cost_impact_idr, reasons_json, confidence, status | F1, F2 |
| decision_log | rec_id, role, decision, edited_values, comment, ts | F0, F1 |
Read with `better-sqlite3` (bundled, read-only); decision_log writes to Turso/libSQL or a `/tmp` copy (decide at 11.00). Analysis scripts: Project doc `reference/05_analysis_scripts.md`.

## AI
- Runtime prompt: `prompts/runtime/spares-explanation.md` (input = structured SKU facts, no prices/supplier names; output = 2–3 sentence reason) · fallback for demo: rule-based template from the same fields (`AI_FALLBACK_ONLY=true`).
- Models (offline, Python): Syntetos–Boylan classification; Croston-SBA / TSB / adaptive MA tournament on 5-month holdout; ROP = μ·LT + z·σ·√LT (z: S 2.33, A 1.65, B 1.28, C 0.84); Max = ROP + 3 months cover.

## Demo script (live ≤ 4 min, every click must work)
1. Normal state: Control Tower at 2026-07-01; static Min–Max view looks routine.
2. Problem appears: slide to 2026-08-01 → BF-112 (due 2026-10-07) and BF-111 (due 2026-10-14) burner cleaning turn red: gate valve 4" 800# (crit S) projected short, open PO arrives 2026-10-31, LT median 62 d. (Actual history: PR raised only on 2026-08-11, delivered 2026-10-04, 3 days before the job.)
3. AI detects + "Why?": PM due dates, LT P90, intermittent class, 99% service level for S items; sources listed.
4. Human approves → action: Rina approves qty, Bima signs off (S item) → PR draft + decision_log entry.
5. Impact on screen: counter + simulator; KT-4 thrust pad REDUCE (keep 2 of 862, stop-buy); site total conservative IDR 38.6 bn/yr (≈ US$2.4 M), payback within year 1.

## Out of scope (→ roadmap slide)
- Real login/SSO, write-back to SAP, multi-plant pooling, mobile layout, tests, 3D twin (Could, only if time remains).

## Tasks (diisi `/tasks`)
- T1 Build `mindspares.db` from Excel (Python; drop 5,420 exact-duplicate PR PO rows first) + seed recommendations · T2 App shell + Control Tower + TimeSlider · T3 SKU detail + forecast chart + Why? + Approve → decision_log · T4 Health + Cost–Risk simulator · T5 PR draft + ImpactCounter + CSV export · T6 Deploy Vercel, fallback check, timestamped screenshot, zip source + DB

## Done when
- [ ] Demo runs end-to-end on the Vercel URL from another device
- [ ] Works with `AI_FALLBACK_ONLY=true`
- [ ] Impact numbers on screen match CASE.md §1.4 (IDR 38.6 bn/yr conservative)