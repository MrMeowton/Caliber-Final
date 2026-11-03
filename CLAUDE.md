# CLAUDE.md — CALIBER 2026 Final (Tim Itu Ae)

## Hari H (isi pukul 10.00 setelah konsep terkunci)
- Kasus final: [ISI: judul kasus]
- Solusi: [ISI: nama solusi — 1 kalimat]
- Modul dipakai: [ISI: foundation + knowledge / reliability / energy]
- URL deploy: [ISI]

## Stack
- Next.js + TypeScript (ikuti basis prototype MIND), deploy Vercel
- AI: Claude API lewat wrapper bersama + fallback hardcoded (`modules/foundation/README.md`)
- Data: JSON dummy di `data/` (dibuat hari H sesuai kasus)

## Perintah
```bash
npm install && npm run dev          # app lokal
node scripts/check-templates.mjs    # daftar [ISI] yang belum diisi
vercel --prod                       # deploy
```

## Peta (baca hanya yang relevan dengan task)
- Spec terkunci → `docs/04-spec-template.md` · daftar task → `tasks.md`
- Fondasi (layout, panel "Why?", approve/reject, AI wrapper) → `modules/foundation/README.md`
- Modul → `modules/knowledge|reliability|energy/README.md`
- Prompt → `prompts/README.md`
- Konteks kasus & kriteria → `docs/00-brief.md`, `docs/03-case-template.md`

## Aturan
- Semua teks UI, data demo, dan output AI dalam bahasa Inggris.
- Setiap rekomendasi AI: alasan + data sumber + confidence + Approve/Reject.
- Jangan pernah menulis ke sistem kontrol; semua aksi berupa draft yang disetujui manusia.
- Setiap fitur terhubung ke KPI di `docs/02-kpi-library.md`.
- Secret hanya di `.env.local` (contoh: `.env.example`).
- Satu task per sesi → commit → `/clear`. Bug gagal 2x → kembali ke commit terakhir, ganti pendekatan.
- Tanpa subagent, browser automation, atau screenshot; manusia yang mengecek tampilan.

## Working principles (andrej-karpathy-skills)
1. **Think before coding** — state assumptions; if unclear or several interpretations exist, ask instead of picking silently; propose a simpler approach and push back when warranted.
2. **Simplicity first** — minimum code that solves the task; no unrequested features, single-use abstractions, configurability, or handling of impossible errors. If 200 lines could be 50, rewrite.
3. **Surgical changes** — touch only what the task needs; don't "improve" adjacent code, comments, or formatting; match existing style; remove only orphans your change created, mention (don't delete) pre-existing dead code. Every changed line must trace to the request.
4. **Goal-driven execution** — turn the task into verifiable success criteria; for multi-step work state `step → verify: check`, then loop until verified.
