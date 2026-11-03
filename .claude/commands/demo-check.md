Tanpa mengubah kode, cek kesiapan demo terhadap "Demo script" di `docs/SPEC.md`:
- Tiap langkah: komponen/halaman yang menangani, data di `data/` tersedia atau tidak.
- Setiap pemanggilan AI punya fallback (`AI_FALLBACK_ONLY=true`).
- Teks UI berbahasa Inggris; angka dampak sama dengan `data/impact.json`.
Output: tabel langkah | OK / RISIKO | perbaikan singkat.
