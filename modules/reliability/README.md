# Modul Reliability

**Area guidebook:** predictive maintenance, anomaly detection, spare-part inventory optimization
**Fitur:** deteksi anomali sensor · skor risiko aset · rekomendasi tindakan · cek ketersediaan suku cadang · draft work order yang disetujui manusia
**Data:** `sensor_readings`, `assets`, `work_orders`, `spare_parts` (+ `data/docs/` untuk SOP)
**Prompt runtime:** `prompts/runtime/reliability-recommendation.md`
**KPI:** availability, MTBF/MTTR, biaya unplanned downtime, fill rate part kritis, nilai overstock

## Alur
```
Sensor per jam → z-score/tren 72 jam vs baseline → skor risiko 0–100 per aset
→ gabung riwayat WO + stok part (lead time vs perkiraan waktu sampai gagal)
→ rekomendasi + panel "Why?" → Approve → draft WO (+ purchase request bila stok kurang)
```

## Pola yang tertanam di data dummy
- K-201 trip 22 Sep (degradasi 72 jam sebelumnya terlihat di data) → bukti "seharusnya bisa terdeteksi"
- P-620 trip 15 Okt (seal leak)
- E-510 spike tunggal 4 Okt = sensor rusak, bukan kegagalan (uji false alarm)
- **K-301 sedang menurun di akhir data** (vibrasi 5,5 mm/s), part `BRG-K301-TH` stok 0, lead time 150 hari → skenario demo utama
- Part non-kritis overstock: `FLT-GEN`, `GSK-SPW4`, `PKG-P220`

## Penyesuaian hari H
- Aset & sensor dari kasus: [ISI → `data/plant.config.json`]
- Ambang alert/trip: [ISI: dari kasus, atau pakai SOP-002]
- Aset untuk skenario demo: [ISI]
- Fitur yang dipakai: [ISI: anomali / skor risiko / suku cadang / draft WO]
