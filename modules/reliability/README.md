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

## Penyesuaian hari H
- Aset & sensor dari kasus: [ISI → `data/`]
- Ambang alert/trip: [ISI: dari kasus]
- Aset untuk skenario demo: [ISI]
- Fitur yang dipakai: [ISI: anomali / skor risiko / suku cadang / draft WO]
