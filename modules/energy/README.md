# Modul Energy Intelligence

**Area guidebook:** energy & emissions monitoring, production forecasting
**Fitur:** intensitas energi per ton produk · alert penyimpangan · estimasi emisi CO₂e · forecast produksi · simulator what-if dengan slider
**Data:** `energy_hourly`, `energy_units`, `emission_factors`
**Prompt runtime:** `prompts/runtime/energy-recommendation.md`
**KPI:** intensitas energi (GJ/t), CO₂e, hemat energi USD/th, akurasi forecast

## Alur
```
Meter per unit per jam → intensitas & CO₂e → baseline 7 hari → alert bila deviasi > X%
→ AI mencari penyebab (parameter operasi, log shift) → rekomendasi aman + panel "Why?" → Approve
What-if: slider COT / steam-HC ratio / rate → perubahan GJ/t, USD, tCO₂e
```

## Penyesuaian hari H
- Unit & meter dari kasus: [ISI → `data/`]
- Ambang deviasi alert: [ISI: mis. 5%]
- Batas operasi aman untuk rekomendasi: [ISI: mis. COT 820–850 °C]
- Fitur yang dipakai: [ISI: monitoring / alert / CO₂e / forecast / what-if]
