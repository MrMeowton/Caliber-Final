# prompts/ — Template Prompt

Cara pakai: salin blok prompt, ganti setiap `{{variabel}}`, lalu kirim. Setelah dipakai saat latihan, isi **Log uji** di file tersebut. Prompt dianggap "teruji" kalau sudah berhasil minimal 1x.

| File | Dipakai oleh | Kapan (hari H) | Teruji? |
|---|---|---|---|
| `01-case-analysis.md` | Analyst (Project chat) | 08.45 | [ISI: ya/belum] |
| `02-case-to-spec.md` | Analyst + Builder | 09.30 | [ISI] |
| `03-spec-to-tasks.md` | Builder (Claude Code, plan mode) | 09.45 | [ISI] |
| `04-add-feature.md` | Builder | 10.00–21.00, 1 task per sesi | [ISI] |
| `05-fix-bug.md` | Builder | kapan saja | [ISI] |
| `06-pitch-review.md` | Storyteller + Analyst | 21.00–23.00 | [ISI] |
| `runtime/*.md` | Di dalam app (AI wrapper) | — | [ISI] |
