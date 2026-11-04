# CALIBER 2026 Final — Template Tim Itu Ae

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
2. Analyst + tim isi `docs/CASE.md` di Claude chat
3. Builder: `/spec` → cek SPEC.md → `/tasks`
4. Tiap task: `/build T1` → cek di browser → `git commit` → `/clear`
5. Error: `/fix <tempel baris error saja>`
6. 20.30 `/demo-check` → 21.00 feature freeze

## Konvensi
- `[ISI: petunjuk]` wajib diisi hari H. Cek sisa: `node scripts/check-templates.mjs docs`.
- `{{variabel}}` di `prompts/` diisi kode saat runtime.

## Setup
```bash
cp .env.example .env.local    # isi ANTHROPIC_API_KEY
```
