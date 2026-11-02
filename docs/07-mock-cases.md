# 07 — Kasus Tiruan untuk Latihan

> **Jangan dibaca sebelum simulasi.** Satu orang (bukan Builder) memilih & membacakan kasus, persis seperti case reveal.
> Latihan di branch terpisah (`git switch -c latihan-a`) supaya template di `main` tetap kosong.
> Senin: Kasus A · Selasa siang: simulasi penuh Kasus B (4 jam) · Kasus C bila ada waktu. Semua angka fiktif.

## Mock Case A: Asset Reliability & Spare-Part Readiness
**Background:** A naphtha cracker and its downstream polymer units run hundreds of rotating equipment items (pumps, compressors, fans). Maintenance is mostly time-based or reactive.
**Pain points:**
- Unplanned trips of critical compressors cause flaring, safety risk, and lost production.
- Vibration and temperature data sit in the plant historian; work orders sit in the CMMS; spare-part stock sits in the ERP. Nobody sees them together.
- Warehouses overstock non-critical parts, while critical parts with 3–6 month lead times are sometimes unavailable when a failure happens.

**Available data:** sensor history for critical assets, work-order history, spare-part list (stock, lead time, criticality, unit cost).
**Task:** Design an AI-enabled solution that predicts equipment failure risk, recommends maintenance actions, and ensures the right spare parts are ready, with human approval and measurable business impact.

## Mock Case B: Energy & Emissions Intelligence
**Background:** Energy (fuel gas, steam, electricity) is one of the largest operating costs of the petrochemical complex, and the company must report and reduce its emissions.
**Pain points:**
- Energy meters exist per unit, but readings are reviewed monthly in spreadsheets, so abnormal consumption is detected weeks late.
- Emissions are calculated manually for reports, not used for daily decisions.
- Operators lack clear guidance on which operating changes reduce energy use safely.

**Available data:** hourly energy meter readings per unit, production volume per unit, emission factors, operating parameters (furnace temperature, steam-to-feed ratio).
**Task:** Design an AI-enabled solution that monitors energy and emissions in near real time, detects deviations, and recommends traceable optimization actions for operators and management.

## Mock Case C: Production Forecasting & Cross-functional Planning
**Background:** Production, maintenance, and supply-chain teams plan separately. Feedstock arrival varies and planned shutdowns are coordinated through meetings and email.
**Pain points:**
- Production forecasts are built manually and often miss the impact of maintenance and feedstock delays.
- Decisions across functions are slow because each team uses different data.

**Available data:** historical production per unit, feedstock delivery schedule, maintenance plan, product demand.
**Task:** Design an AI-enabled solution that forecasts production, simulates scenarios, and supports faster cross-functional decisions.

## Evaluasi simulasi (isi setelah latihan)
| Kasus | Konsep terkunci jam | Deploy v1 jam | % limit Builder / Analyst / Storyteller | Yang macet | Perbaikan |
|---|---|---|---|---|---|
| A | [ISI] | [ISI] | [ISI] | [ISI] | [ISI] |
| B | [ISI] | [ISI] | [ISI] | [ISI] | [ISI] |
| C | [ISI] | [ISI] | [ISI] | [ISI] | [ISI] |
