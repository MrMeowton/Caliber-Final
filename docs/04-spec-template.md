# 04 — Spec (bahasa Inggris)

> Isi dengan spec solusi yang sudah dikunci; ini acuan utama AI saat membangun prototype.

# Spec: [ISI: Solution Name]

## Goal
Help [ISI: user] to [ISI: action] so that [ISI: KPI] improves from [ISI: X] to [ISI: Y].

## Users
| Persona | Scenario | Decision they make |
|---|---|---|
| [ISI] | [ISI] | [ISI] |

## Modules & config
- Modules: [ISI: foundation + knowledge / reliability / energy]
- Dummy data in `data/`: [ISI: plant/units/assets, events]

## Core features (max 3)
| ID | Feature | Acceptance criteria (Given / When / Then) | KPI |
|---|---|---|---|
| F1 | [ISI] | [ISI] | [ISI] |
| F2 | [ISI] | [ISI] | [ISI] |
| F3 | [ISI: or delete] | [ISI] | [ISI] |

## Traceability & human oversight
- "Why this recommendation?" shows: reason · source data ([ISI: which tables/sensors/docs]) · confidence
- Approver role: [ISI: e.g. reliability engineer] · after approval: [ISI: draft WO / purchase request / operator advice]
- Never writes to control systems.

## Data
| Plant data | Enterprise data | Dummy file |
|---|---|---|
| [ISI] | [ISI] | [ISI] |

## AI
- Runtime prompt: [ISI: `prompts/runtime/…`]
- Fallback answer for demo scenario: [ISI]

## Demo script (live ≤ 4 min)
1. Problem moment: [ISI]
2. AI detects / answers: [ISI]
3. "Why this recommendation?": [ISI]
4. Human approves → result + KPI on screen: [ISI]

## Out of scope (→ roadmap)
- [ISI]

## Done when
- [ ] Demo flow runs end-to-end on [ISI: Vercel URL] from another device
- [ ] Fallback works with API key removed
- [ ] KPI numbers on screen match `docs/02-kpi-library.md`
