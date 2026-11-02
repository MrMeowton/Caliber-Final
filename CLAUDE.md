# CLAUDE.md — CALIBER 2026 Final (Tim Itu Ae)

## Hari H (isi pukul 10.00 setelah konsep terkunci)
- Kasus final: [ISI: judul kasus]
- Solusi: [ISI: nama solusi — 1 kalimat]
- Modul dipakai: [ISI: foundation + knowledge / reliability / energy]
- URL deploy: [ISI]

## Stack
- Next.js + TypeScript (ikuti basis prototype MIND), deploy Vercel
- AI: Claude API lewat wrapper bersama + fallback hardcoded (`modules/foundation/README.md`)
- Data: JSON dummy di `data/`, dibangkitkan dari `data/plant.config.json`

## Perintah
```bash
npm install && npm run dev          # app lokal
node data/generate.mjs              # buat ulang data dummy setelah ubah config
node scripts/check-templates.mjs    # daftar [ISI] yang belum diisi
vercel --prod                       # deploy
```

## Peta (baca hanya yang relevan dengan task)
- Spec terkunci → `docs/04-spec-template.md` · daftar task → `tasks.md`
- Fondasi (layout, panel "Why?", approve/reject, AI wrapper) → `modules/foundation/README.md`
- Modul → `modules/knowledge|reliability|energy/README.md`
- Data & config → `data/README.md` · prompt → `prompts/README.md`
- Konteks kasus & kriteria → `docs/00-brief.md`, `docs/03-case-template.md`
- JANGAN baca `docs/07-mock-cases.md` kecuali diminta.

## Aturan
- Semua teks UI, data demo, dan output AI dalam bahasa Inggris.
- Setiap rekomendasi AI: alasan + data sumber + confidence + Approve/Reject.
- Jangan pernah menulis ke sistem kontrol; semua aksi berupa draft yang disetujui manusia.
- Setiap fitur terhubung ke KPI di `docs/02-kpi-library.md`.
- Secret hanya di `.env.local` (contoh: `.env.example`).
- Satu task per sesi → commit → `/clear`. Bug gagal 2x → kembali ke commit terakhir, ganti pendekatan.
- Tanpa subagent, browser automation, atau screenshot; manusia yang mengecek tampilan.
