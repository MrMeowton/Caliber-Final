# CALIBER 2026 Final — Template Tim Itu Ae

Repo template untuk final CALIBER (kasus Chandra Asri). Semua kerangka sudah siap, jadi **saat hari H tim tinggal mengisi bagian `[ISI: …]`**.

## Konvensi
- `[ISI: petunjuk]` → wajib diisi hari H (petunjuk/contoh ada di dalam kurung).
- Teks di luar `[ISI]` → sudah final (jadwal, aturan, rumus, referensi), tidak perlu diubah.
- `{{variabel}}` di `prompts/` → diganti setiap kali prompt dipakai.
- Cek sisa yang belum terisi: `node scripts/check-templates.mjs` (atau `... docs` untuk satu folder).

## Urutan mengisi hari H
| Jam | File | Pemilik |
|---|---|---|
| 08.30 | `docs/00-brief.md` bagian "Kasus final" | Analyst |
| 08.45–10.00 | `docs/03-case-template.md` → `docs/04-spec-template.md` → blok "Hari H" di `CLAUDE.md` | Analyst + Builder |
| 09.45 | `tasks.md` (dibuat lewat `prompts/03-spec-to-tasks.md`) | Builder |
| 10.00–12.00 | Data dummy di `data/` + bagian "Penyesuaian hari H" di `modules/*/README.md` | Builder |
| 10.00–12.00 | Kalkulator dampak di `docs/02-kpi-library.md`, pemetaan di `docs/01-domain.md` | Analyst |
| 15.00–18.00 | `docs/05-roadmap-template.md` | Analyst |
| 10.00–23.00 | `docs/06-deck-structure.md` (slide, video, Q&A) | Storyteller |
| 23.00 | `node scripts/check-templates.mjs` + checklist submit | 1 orang |

## Hari H
`git switch -c final` supaya template kosong di `main` tetap utuh.

## Struktur
```
caliber-final/
├── CLAUDE.md                  ← maks. 50 baris: stack, perintah, peta folder
├── docs/
│   ├── 00-brief.md            ← rundown, deliverable, 5 kriteria, aturan guidebook
│   ├── 01-domain.md           ← aset Chandra Asri, istilah petrokimia
│   ├── 02-kpi-library.md      ← KPI + rumus dampak bisnis
│   ├── 03-case-template.md    ← kerangka analisis kasus (diisi hari H)
│   ├── 04-spec-template.md    ← kerangka spec (diisi hari H)
│   ├── 05-roadmap-template.md ← fase + checklist teknis/ops/legal/cyber/data governance
│   └── 06-deck-structure.md   ← 7 slide wajib + naskah video 3 menit
├── modules/
│   ├── foundation/README.md   ← panel "Why?", approve/reject, AI wrapper + fallback
│   ├── knowledge/README.md
│   ├── reliability/README.md
│   └── energy/README.md
├── data/                      ← data dummy (dibuat hari H sesuai kasus)
├── prompts/                   ← template prompt (alur kerja + runtime app)
└── scripts/check-templates.mjs
```

## Setup (Minggu/Senin)
```bash
cp .env.example .env.local    # isi ANTHROPIC_API_KEY
```
Repo tetap **private** sampai panitia mengonfirmasi aturan.
