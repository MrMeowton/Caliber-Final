# CALIBER 2026 Final — Template Tim Itu Ae

Repo template untuk final CALIBER (kasus Chandra Asri). Semua kerangka sudah siap, jadi **saat hari H tim tinggal mengisi bagian `[ISI: …]`**.

## Konvensi
- `[ISI: petunjuk]` → wajib diisi hari H (petunjuk/contoh ada di dalam kurung).
- Teks di luar `[ISI]` → sudah final (aturan, rumus, referensi), tidak perlu diubah.
- `{{variabel}}` di `prompts/` → diganti setiap kali prompt dipakai.
- Cek sisa yang belum terisi: `node scripts/check-templates.mjs` (atau `... docs` untuk satu folder).

## Yang diisi hari H
- `docs/00-brief.md` — teks kasus final
- `docs/03-case-template.md` — hasil analisis kasus
- `docs/04-spec-template.md` — spec solusi (bahasa Inggris)
- `docs/01-domain.md`, `docs/02-kpi-library.md` — bagian pemetaan kasus & kalkulator dampak
- `modules/*/README.md` — bagian "Penyesuaian hari H"
- Blok "Hari H" di `CLAUDE.md`

## Hari H
`git switch -c final` supaya template kosong di `main` tetap utuh.

## Struktur
```
caliber-final/
├── CLAUDE.md                  ← maks. 50 baris: stack, perintah, peta folder
├── docs/
│   ├── 00-brief.md            ← teks kasus final, 5 kriteria, prinsip desain
│   ├── 01-domain.md           ← aset Chandra Asri, istilah petrokimia
│   ├── 02-kpi-library.md      ← KPI + rumus dampak bisnis
│   ├── 03-case-template.md    ← kerangka analisis kasus (diisi hari H)
│   └── 04-spec-template.md    ← kerangka spec (diisi hari H)
├── modules/
│   ├── foundation/README.md   ← panel "Why?", approve/reject, AI wrapper + fallback
│   ├── knowledge/README.md
│   ├── reliability/README.md
│   └── energy/README.md
├── data/                      ← data dummy (dibuat hari H sesuai kasus)
├── prompts/runtime/           ← prompt yang dipanggil di dalam app
└── scripts/check-templates.mjs
```

## Setup
```bash
cp .env.example .env.local    # isi ANTHROPIC_API_KEY
```
Repo tetap **private** sampai panitia mengonfirmasi aturan.
