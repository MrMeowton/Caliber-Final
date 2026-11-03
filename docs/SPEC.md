# SPEC — sumber kebenaran build (EN, maks. 80 baris)

> Diisi lewat `/spec` dari `docs/CASE.md` §5. Claude Code membaca file ini di setiap task.

# [ISI: Solution Name] — [ISI: tagline]

## Goal
Help [ISI: user] to [ISI: action] so that [ISI: KPI] improves from [ISI: X] to [ISI: Y].
Plant context: [ISI: unit/assets] → configured in `data/config.json`.

## Users
| Persona | Scenario | Decision they make |
|---|---|---|
| [ISI] | [ISI] | [ISI] |

## Features (F0 = gong, max 3 core)
| ID | Feature | Acceptance (Given / When / Then) | KPI |
|---|---|---|---|
| F0 | [ISI: gong from DESIGN.md §3] | [ISI] | [ISI] |
| F1 | [ISI] | [ISI] | [ISI] |
| F2 | [ISI] | [ISI] | [ISI] |
| F3 | [ISI: or delete] | [ISI] | [ISI] |

## Traceability & human oversight
- "Why this recommendation?" shows reason · sources ([ISI: sensors/tables/docs]) · confidence.
- Approver role: [ISI] · after approval: [ISI: draft WO / purchase request / operator advice].
- Never writes to control systems.

## Data (`data/*.json`)
| File | Fields | Used by |
|---|---|---|
| config.json | plant, unit, assets (tag, name, type, pos, health, desc) | all |
| [ISI] | [ISI] | [ISI] |

## AI
- Runtime prompt: [ISI: `prompts/runtime/…`] · fallback for demo: [ISI]

## Demo script (live ≤ 4 min, every click must work)
1. Normal state: [ISI]
2. Problem appears: [ISI]
3. AI detects + "Why?": [ISI]
4. Human approves → action: [ISI]
5. Impact on screen (USD/IDR, hours, tCO₂e): [ISI]

## Out of scope (→ roadmap slide)
- Login, database, multi-user, mobile layout, tests. [ISI: tambahan]

## Tasks (diisi `/tasks`)
- T1 [ISI]

## Done when
- [ ] Demo runs end-to-end on [ISI: Vercel URL] from another device
- [ ] Works with `AI_FALLBACK_ONLY=true`
- [ ] Impact numbers on screen match CASE.md §1.4
