# Modul Energy Intelligence

**Area guidebook:** energy & emissions monitoring, production forecasting
**Fitur:** intensitas energi per ton produk · alert penyimpangan · estimasi emisi CO₂e · forecast produksi · simulator what-if dengan slider
**Data:** `energy_hourly`, `energy_units`, `emission_factors`; Kasus C: `feedstock_deliveries`, `maintenance_plan`, `product_demand`
**Prompt runtime:** `prompts/runtime/energy-recommendation.md`
**KPI:** intensitas energi (GJ/t), CO₂e, hemat energi USD/th, akurasi forecast

## Alur
```
Meter per unit per jam → intensitas & CO₂e → baseline 7 hari → alert bila deviasi > X%
→ AI mencari penyebab (parameter operasi, log shift) → rekomendasi aman + panel "Why?" → Approve
What-if: slider COT / steam-HC ratio / rate → perubahan GJ/t, USD, tCO₂e
```

## Pola yang tertanam di data dummy
- NC: fuel gas +12% selama 54 jam mulai 23 Okt (burner F-103 kotor, cocok dengan log shift 24 Okt)
- PE: listrik +15% 30 jam mulai 13 Okt · PP: rate turun 60% 15 Okt (P-620 trip; intensitas naik)
- Intensitas NC naik seiring hari sejak decoking; shift malam paling boros (~+1,5%)

## Penyesuaian hari H
- Unit & meter dari kasus: [ISI → `data/plant.config.json`]
- Ambang deviasi alert: [ISI: mis. 5%]
- Batas operasi aman untuk rekomendasi: [ISI: mis. COT 820–850 °C]
- Fitur yang dipakai: [ISI: monitoring / alert / CO₂e / forecast / what-if]
