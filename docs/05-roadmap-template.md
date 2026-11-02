# 05 — Feasibility & Roadmap (diisi hari H 15.00–18.00 · Analyst)

> Isi `[ISI: …]`. Centang item checklist yang relevan dan tambahkan detail spesifik solusi. Hasilnya = slide 5.

## Timeline
| Fase | Durasi | Lingkup | Gate untuk lanjut |
|---|---|---|---|
| 0. Discovery | [ISI: mis. 1 bulan] | Audit data, baseline KPI, sponsor | [ISI] |
| 1. Pilot (shadow mode) | [ISI: mis. 3 bulan] | [ISI: unit/aset pilot] | [ISI: mis. false alarm ≤ 10%] |
| 2. Rollout | [ISI] | [ISI: seluruh unit Cilegon] | [ISI] |
| 3. Scale | [ISI] | [ISI: Bukom, Jurong, CA-EDC] | [ISI] |

## Checklist (pilih yang relevan, beri detail)
**Teknis**
- [ ] Konektor read-only ke [ISI: historian/CMMS/ERP]
- [ ] Monitoring akurasi & drift model, fallback bila AI tidak tersedia
- [ ] [ISI]

**Operasional**
- [ ] Process owner: [ISI] · SOP baru untuk menindaklanjuti alert
- [ ] Approver & SLA respons: [ISI]

**Legal & kepatuhan**
- [ ] UU PDP No. 27/2022 · kontrak & lisensi LLM
- [ ] Regulasi terkait: [ISI: K3 / pelaporan emisi / lainnya]

**Cybersecurity**
- [ ] Segregasi IT/OT (Purdue, IEC 62443), data satu arah dari OT
- [ ] RBAC, SSO, audit log approve/reject · tidak ada tulis ke DCS
- [ ] Data ke LLM: [ISI: masking / on-prem / data residency]

**Data governance**
- [ ] Data owner per sumber: [ISI]
- [ ] Kualitas data (completeness, latensi), lineage, retensi
- [ ] Kebijakan AI bertanggung jawab: traceability, review berkala

**Kesiapan organisasi (People & Culture)**
- [ ] Champion per shift · pelatihan: [ISI: siapa, berapa jam]
- [ ] Perubahan budaya kerja: [ISI]

## Biaya & ROI
| Item | Pilot | Rollout |
|---|---|---|
| Tim (FTE × bulan) | [ISI] | [ISI] |
| Cloud / infra | [ISI] | [ISI] |
| Lisensi LLM & software | [ISI] | [ISI] |
| **Total** | [ISI] | [ISI] |
| **Manfaat/th** (dari `02-kpi-library.md`) | [ISI] | [ISI] |
| **Payback** | [ISI] | [ISI] |

## Risiko teratas
| Risiko | Mitigasi |
|---|---|
| [ISI: mis. false alarm → operator tidak percaya] | [ISI: shadow mode, ambang disetel bersama engineer] |
| [ISI] | [ISI] |
| [ISI] | [ISI] |
