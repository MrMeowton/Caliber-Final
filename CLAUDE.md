# CLAUDE.md — CALIBER 2026 Final (Tim Itu Ae)

## Hari H (diisi `/spec`)
- Kasus final: [ISI: judul kasus]
- Solusi: [ISI: nama — 1 kalimat]
- URL deploy: [ISI]

## Baca (hanya ini)
- `docs/SPEC.md` → APA yang dibangun. Sumber kebenaran.
- `docs/DESIGN.md` → BAGAIMANA: visual §1, fondasi §2, fitur gong §3, modul §4. Baca bagian yang relevan saja.
- JANGAN baca `docs/CASE.md` / `docs/REFERENCE.md` kecuali lewat `/spec` atau diminta.
- JANGAN baca `node_modules/`, `.next/`, lockfile.

## Stack
- Next.js + TypeScript + Tailwind (ikuti basis prototype MIND-PARTS), deploy Vercel
- 3D: three + @react-three/fiber + @react-three/drei · diagram: @xyflow/react · chart: recharts
- AI: `lib/ai.ts` (Claude API, fallback bila timeout / `AI_FALLBACK_ONLY=true`), prompt di `prompts/runtime/`
- Data: JSON dummy di `data/` (aset & posisi 3D di `data/config.json`)
- Baca semua skills yang ada di .agent sebelum kamu mau mulai bekerja dan baru jalankan task yang diberikan setelah memahami semua skills yang tersedia.

## Perintah
```bash
npm install && npm run dev          # app lokal
npm run build                       # cek sebelum commit
node scripts/check-templates.mjs    # daftar [ISI] yang belum diisi
```
Slash command: `/spec` · `/tasks` · `/build T1` · `/fix <error>` · `/demo-check`

## Aturan
- Semua teks UI, data demo, dan output AI dalam bahasa Inggris. Angka selalu dengan satuan.
- Setiap rekomendasi AI: alasan + data sumber + confidence + Approve/Reject. Tidak pernah menulis ke sistem kontrol.
- Pakai komponen fondasi (DESIGN §2) sebelum membuat baru. Jangan tambah library di luar stack tanpa izin.
- Secret hanya di `.env.local`.
- Satu task per sesi → commit → `/clear`. Bug gagal 2x → berhenti, jelaskan, kembali ke commit terakhir.
- Tanpa subagent, browser automation, atau screenshot; manusia yang mengecek tampilan.
- Jawaban ringkas: tampilkan bagian yang berubah, bukan seluruh file.

## Working principles (andrej-karpathy-skills)
1. **Think before coding** — state assumptions; if unclear, ask instead of picking silently; push back when warranted.
2. **Simplicity first** — minimum code that solves the task; no unrequested features or abstractions.
3. **Surgical changes** — touch only what the task needs; match existing style; every changed line traces to the request.
4. **Goal-driven execution** — turn the task into verifiable success criteria; `step → verify: check` until verified.
