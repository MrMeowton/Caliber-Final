# Fondasi Bersama (dipakai semua modul)

> Dibangun sebelum hari H. Hari H cukup isi bagian **Penyesuaian hari H**.

## Komponen
| Komponen | Fungsi | Prinsip guidebook |
|---|---|---|
| Layout dashboard | Header (nama pabrik/solusi), navigasi modul, area konten | — |
| Panel "Why this recommendation?" | Alasan · data sumber (tabel/sensor/dokumen + timestamp) · confidence High/Med/Low | Transparan & bisa ditelusuri |
| Tombol Approve / Reject + komentar | Menyimpan keputusan (user, waktu, komentar) ke log; status draft → approved | Human oversight |
| AI wrapper | Satu fungsi untuk memanggil Claude API; timeout 15 s → jawaban fallback | Keandalan sistem |
| Fallback hardcoded | Jawaban siap pakai untuk skenario demo bila API/Wi-Fi mati | Demo tetap jalan |
| Loader data dummy | Membaca `data/*.json` | Integrasi data pabrik + enterprise |

## Kontrak data rekomendasi (dipakai semua modul)
```ts
type Recommendation = {
  id: string; title: string; action: string;
  reason: string; sources: { type: "sensor" | "table" | "document"; ref: string }[];
  confidence: "High" | "Medium" | "Low";
  impact?: { kpi: string; value: string };
  status: "draft" | "approved" | "rejected"; decidedBy?: string; comment?: string;
};
```

## Penyesuaian hari H
- Nama solusi di header: [ISI]
- Nama pabrik/unit/aset: [ISI]
- Peran approver (label tombol): [ISI: mis. Reliability Engineer]
- Fallback untuk skenario demo: [ISI: tulis jawaban AI yang diharapkan]
- Model AI: [ISI: claude-sonnet-5-5 (default, hemat) / claude-opus-5-5]
