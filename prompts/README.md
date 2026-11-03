# prompts/ — Prompt runtime

Prompt yang dipanggil di dalam app lewat `lib/ai.ts` (lihat `docs/DESIGN.md` §2). Setiap `{{variabel}}` diisi oleh kode dari data.

| File | Dipakai oleh |
|---|---|
| `runtime/knowledge-qa.md` | Modul knowledge — tanya-jawab SOP |
| `runtime/shift-handover.md` | Modul knowledge — ringkasan shift |
| `runtime/reliability-recommendation.md` | Modul reliability |
| `runtime/energy-recommendation.md` | Modul energy |
