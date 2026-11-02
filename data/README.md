# data/ — Data Dummy (SINTETIS)

> Hari H: ubah **hanya** `plant.config.json` (nama pabrik, unit, aset, part, kejadian), lalu `node data/generate.mjs`.
> Label "dummy data" wajib ada di UI dan deck.

| Dataset (`.json` untuk app, `.csv` untuk Excel) | Isi | Modul |
|---|---|---|
| `assets` | 8 aset rotating (compressor, pump, fan, gearbox) + kekritisan | reliability |
| `sensor_readings` | Per jam 60 hari: vibrasi, suhu, tekanan, running, failure | reliability |
| `work_orders` | PM bulanan + korektif 12 bulan + trip | reliability |
| `spare_parts` | 15 part: stok, min, lead time, kekritisan, harga | reliability |
| `energy_hourly` | Per unit per jam 30 hari: produksi, fuel gas, steam, listrik, GJ/t, CO₂e, COT | energy |
| `energy_units`, `emission_factors` | Rate & intensitas desain, faktor emisi + sumber | energy |
| `feedstock_deliveries`, `maintenance_plan`, `product_demand` | Kargo nafta, shutdown terencana, demand bulanan | energy (Kasus C) |
| `docs/*.md` | SOP, laporan insiden, log shift (EN) | knowledge |

Perintah: `node data/generate.mjs` (semua) atau `node data/generate.mjs sensor energy` (sebagian).

## Pemetaan data kasus final → dummy (diisi hari H)
| Data di kasus | Dataset dummy | Perubahan di config |
|---|---|---|
| [ISI] | [ISI] | [ISI] |
| [ISI] | [ISI] | [ISI] |
