# CALIBER 2026 Final — Template Tim Itu Ae

Template untuk final CALIBER (kasus Chandra Asri, 4–5 November). Hari H tim tinggal mengisi `[ISI: …]`.

## File konteks (hanya 4, dipisah menurut pembacanya)
| File | Isi | Diisi oleh | Dibaca oleh |
|---|---|---|---|
| `docs/CASE.md` | Analisis kasus: business, technical, pelajaran pemenang, keputusan | Tim, di Claude chat (08.45–10.00) | Tim |
| `docs/REFERENCE.md` | Domain Chandra Asri, istilah, standar, rumus KPI | Tetap | Tim (unggah ke Project chat) |
| `docs/SPEC.md` | Spec terkunci (EN, ≤80 baris) | `/spec` dari CASE.md | Claude Code, tiap task |
| `docs/DESIGN.md` | Visual, fondasi, fitur gong, modul | Tetap | Claude Code |

Claude Code hanya membawa `CLAUDE.md` + `SPEC.md` + bagian `DESIGN.md` yang relevan, sehingga konteksnya kecil dan hemat token.

## Alur hari H
1. `git switch -c final` (template kosong di `main` tetap utuh)
2. Analyst + tim isi `docs/CASE.md` di Claude chat → kunci §5 sebelum 10.00
3. Builder: `/spec` → cek SPEC.md → `/tasks`
4. Tiap task: `/build T1` → cek di browser → `git commit` → `/clear`
5. Error: `/fix <tempel baris error saja>`
6. 20.30 `/demo-check` → 21.00 feature freeze

## Struktur
```
caliber-final/
├── CLAUDE.md                ← dibaca otomatis Claude Code
├── .claude/commands/        ← /spec /tasks /build /fix /demo-check
├── docs/                    ← CASE · REFERENCE · SPEC · DESIGN
├── data/config.json         ← plant, unit, aset + posisi 3D (ganti hari H)
├── prompts/runtime/         ← prompt yang dipanggil di dalam app
└── scripts/check-templates.mjs
```

## Konvensi
- `[ISI: petunjuk]` wajib diisi hari H. Cek sisa: `node scripts/check-templates.mjs docs`.
- `{{variabel}}` di `prompts/` diisi kode saat runtime.

## Setup
```bash
cp .env.example .env.local    # isi ANTHROPIC_API_KEY
```
Hanya Builder yang mengubah kode; Analyst & Storyteller mengedit `docs/` lewat GitHub web.
