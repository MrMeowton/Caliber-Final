# DESIGN — tampilan, komponen, fitur gong, modul (tetap; baca bagian yang relevan saja)

## 1. Visual: "control room", bukan template dashboard
- Gelap & tenang seperti ruang kontrol DCS. Hindari: grid 6 kartu KPI, donut chart, gradien ungu, emoji.
- Warna: bg `#0B0F14` · panel `#121821` · garis `#1E2733` · teks `#E6EDF3` · redup `#8B98A5`.
- Status (hanya untuk makna): normal `#3FB68B` · warning `#E8B04A` · critical `#E5534B` · AI/aksen `#4EA8DE`.
- Font: Inter (UI) + JetBrains Mono (angka sensor & tag aset ISA: `K-101`, `P-201A`). Angka selalu + satuan.
- Satu layar = satu cerita. Animasi hanya untuk perubahan status (denyut merah, aliran pipa, counter naik).

Layout (1440×900, proyektor):
```
┌ Top bar: solusi · plant · jam · mode LIVE / REPLAY · counter "Value protected" ┐
│ rail │ CENTER 60%: twin 3D / diagram proses  │ RIGHT: Asset panel             │
│ ikon │                                       │  sensor sparkline · health     │
│      │ bottom: TimeSlider (-30 hari → kini)  │  RecommendationCard + Approve  │
└──────┴───────────────────────────────────────┴────────────────────────────────┘
```

## 2. Fondasi (dipakai semua fitur)
| Komponen | Fungsi |
|---|---|
| `PlantTwin` | Scene 3D dari `data/config.json`; aset = primitif (silinder kolom, bola sphere, kotak kompresor); klik → pilih; warna = health; aset critical berdenyut |
| `AssetPanel` | Tag, nama, deskripsi, sensor sparkline, health, riwayat WO |
| `RecommendationCard` | Title · action · panel "Why?" (reason, sources, confidence) · Approve/Reject + komentar → log |
| `TimeSlider` | Mengubah "waktu sekarang" global; semua komponen membaca state waktu ini |
| `ImpactCounter` | Angka USD/IDR yang beranimasi naik saat Approve |
| `lib/ai.ts` | Satu fungsi panggil Claude API; timeout 15 s atau `AI_FALLBACK_ONLY=true` → jawaban dari fallback |

Kontrak rekomendasi (semua modul):
```ts
type Recommendation = {
  id: string; assetTag?: string; title: string; action: string; reason: string;
  sources: { type: "sensor" | "table" | "document"; ref: string }[];
  confidence: "High" | "Medium" | "Low"; impact?: { kpi: string; value: string };
  status: "draft" | "approved" | "rejected"; decidedBy?: string; comment?: string;
};
```

## 3. Fitur gong (pilih 1 utama + 1–2 pendukung)
| Fitur | Kenapa juri ingat | Pilar | Library |
|---|---|---|---|
| **3D digital twin interaktif**: klik alat → deskripsi, sensor live, health; aset bermasalah berdenyut; pipa beranimasi | Juri "melihat pabriknya", bukan tabel | semua | @react-three/fiber, @react-three/drei |
| **Time-machine replay**: geser ke 14 hari lalu, anomali tumbuh perlahan, muncul "AI flagged this 9 days before failure" | Bukti nilai prediksi lewat cerita | reliability, energy | state + slider |
| **Explainable AI trace**: rantai bukti sensor → pola → SOP → aksi, tiap node bisa diklik | Menjawab prinsip "traceable AI" | semua | @xyflow/react |
| **Closed loop human-in-the-loop**: Approve → draft WO terbit → stok part berkurang / PR dibuat → counter naik | Integrasi plant + enterprise terlihat | reliability | state |
| **Root-cause propagation**: gangguan menjalar di diagram proses dari aset sumber ke hilir | Sebab-akibat sekali lihat | reliability, produksi | @xyflow/react |
| **What-if simulator**: slider COT / steam-HC / rate → GJ/t, tCO₂e, USD berubah real-time | Juri bisnis melihat uang | energy | recharts |
| **Shift handover briefing**: AI merangkum event shift, operator konfirmasi | Pilar Knowledge + People | knowledge | LLM + fallback |

Kombinasi default: **twin 3D + time-machine + closed loop** = cerita 4 menit (normal → anomali → AI jelaskan → approve → nilai terselamatkan).
Chatbot, grid KPI, tabel alarm = pendukung saja, bukan fitur utama.

## 4. Modul (ambil yang sesuai kasus)
| Modul | Fitur | Data dummy | Prompt runtime |
|---|---|---|---|
| Reliability | z-score/tren 72 jam → skor risiko 0–100 · cek stok part vs lead time · draft WO/PR | `sensor_readings`, `work_orders`, `spare_parts` | `reliability-recommendation.md` |
| Energy | intensitas GJ/t · alert deviasi > X% · CO₂e · what-if · forecast sederhana | `energy_hourly`, `emission_factors` | `energy-recommendation.md` |
| Knowledge | Q&A SOP dengan kutipan (tanpa sumber = tidak menjawab) · ringkasan shift | `data/docs/*.md` | `knowledge-qa.md`, `shift-handover.md` |

## 5. Aturan data dummy
- Nama plant/unit/aset & posisi 3D hanya di `data/config.json` → hari H cukup ganti file ini.
- Time series 30 hari per jam, dengan 1–2 anomali yang sengaja ditanam dan terlihat saat replay.
- Angka dampak di layar = angka di CASE.md §1.4 (simpan di `data/impact.json`).
