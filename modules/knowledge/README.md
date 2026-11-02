# Modul Knowledge

**Area guidebook:** knowledge retention, cross-functional decision-making
**Fitur:** (1) asisten tanya-jawab SOP dengan kutipan sumber · (2) ringkasan shift handover
**Data:** `data/docs/` (7 SOP, 3 laporan insiden, 4 log shift, semua fiktif)
**Prompt runtime:** `prompts/runtime/knowledge-qa.md`, `prompts/runtime/shift-handover.md`
**KPI:** waktu cari informasi, waktu onboarding (`docs/02-kpi-library.md`)

## Alur
```
Pertanyaan → cari potongan dokumen relevan → Claude menjawab + [kutipan dokumen]
→ panel "Why?" menampilkan potongan sumber → bila jawaban = tindakan, Approve/Reject
```
Aturan: tanpa sumber = tidak menjawab; topik keselamatan selalu diberi peringatan verifikasi.

## Skenario demo bawaan (data dummy)
"Why was the K-301 vibration trend not escalated?" → menemukan log shift 27 & 29 Okt + SOP-002 (alert band 4,5–7 mm/s).

## Penyesuaian hari H
- Dokumen dari kasus: [ISI: ganti/tambah file di `data/docs/`]
- 3 pertanyaan demo + jawaban benar:
  1. [ISI]
  2. [ISI]
  3. [ISI]
- Fitur yang dipakai: [ISI: Q&A / handover / keduanya]
