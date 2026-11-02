#!/usr/bin/env node
// Generator data dummy (SINTETIS) untuk latihan CALIBER Final. Tanpa dependensi.
//   node data/generate.mjs                 -> semua dataset
//   node data/generate.mjs sensor energy   -> sebagian (sensor | workorders | parts | energy | planning)
// Semua nama pabrik/unit/aset/kejadian dibaca dari data/plant.config.json.
// Output: <dataset>.csv (untuk dibaca manusia/Excel) + <dataset>.json (untuk di-import app).
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = dirname(fileURLToPath(import.meta.url));
const cfg = JSON.parse(readFileSync(join(DIR, "plant.config.json"), "utf8"));
const only = process.argv.slice(2);
const want = (name) => only.length === 0 || only.includes(name);

// Seeded RNG (mulberry32) supaya data selalu sama setiap generate.
let state = 0;
const reseed = (n) => { state = (cfg.seed + n * 7919) >>> 0; };
const rand = () => {
  state = (state + 0x6d2b79f5) >>> 0;
  let t = state;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const normal = (mu, sd) => mu + sd * Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());
const round = (x, d = 2) => Number(x.toFixed(d));

const HOUR = 3600e3;
const DAY = 24 * HOUR;
const START = Date.parse(`${cfg.startDate}T00:00:00Z`);
const END = START + cfg.sensorDays * DAY; // "sekarang" di dunia dummy
const fmtTime = (ms) => new Date(ms).toISOString().slice(0, 16).replace("T", " ");
const fmtDate = (ms) => new Date(ms).toISOString().slice(0, 10);
const shiftOf = (hour) => (hour >= 7 && hour < 15 ? "Day" : hour >= 15 && hour < 23 ? "Evening" : "Night");

function write(name, rows) {
  const cols = Object.keys(rows[0]);
  const cell = (v) => (v == null ? "" : typeof v === "string" && /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const csv = [cols.join(","), ...rows.map((r) => cols.map((c) => cell(r[c])).join(","))].join("\n");
  writeFileSync(join(DIR, `${name}.csv`), csv + "\n");
  writeFileSync(join(DIR, `${name}.json`), JSON.stringify(rows));
  console.log(`[ok] ${name} (${rows.length} rows)`);
}

// Sensor per jam untuk setiap aset. Kejadian: trip (degradasi lalu berhenti), glitch (spike sensor palsu),
// ongoing (degradasi yang sedang berjalan di akhir data = bahan demo "alert hari ini").
function sensor() {
  reseed(1);
  const hours = cfg.sensorDays * 24;
  const rows = [];
  for (const a of cfg.assets) {
    const events = cfg.sensorEvents.filter((e) => e.asset === a.id);
    for (let h = 0; h < hours; h++) {
      let vib = normal(a.vibration_mm_s, a.vibration_mm_s * 0.06);
      let temp = normal(a.temperature_c, 1.2);
      let press = normal(a.pressure_barg, a.pressure_barg * 0.015);
      let running = 1;
      let failure = 0;
      for (const e of events) {
        const peak = e.type === "ongoing" ? hours - 1 : e.day * 24;
        if (e.type === "glitch") {
          if (h === peak) vib *= 4;
          continue;
        }
        if (h > peak - e.rampHours && h <= peak) {
          const f = (h - (peak - e.rampHours)) / e.rampHours;
          vib += e.vibrationRise * f * f;
          temp += e.tempRise * f;
        }
        if (e.type === "trip" && h === peak) failure = 1;
        if (e.type === "trip" && h > peak && h <= peak + e.downtimeHours) {
          running = 0;
          vib = normal(0.1, 0.02);
          temp = normal(35, 1);
          press = 0;
        }
      }
      rows.push({
        timestamp: fmtTime(START + h * HOUR),
        asset_id: a.id,
        vibration_mm_s: round(Math.max(0, vib), 3),
        temperature_c: round(temp, 1),
        pressure_barg: round(Math.max(0, press), 2),
        running,
        failure,
      });
    }
  }
  write("sensor_readings", rows);
  write("assets", cfg.assets.map(({ typicalFailure, ...a }) => ({ ...a, typical_failure: typicalFailure })));
}

function workOrders() {
  reseed(2);
  const rows = [];
  const partFor = (assetId) => cfg.spareParts.find((p) => p.asset_ids.split(";").includes(assetId))?.part_no ?? null;
  for (const a of cfg.assets) {
    // PM berbasis waktu setiap 30 hari, 12 bulan ke belakang.
    for (let t = START - 365 * DAY + Math.floor(rand() * 28) * DAY; t < END; t += 30 * DAY) {
      rows.push({
        asset_id: a.id, type: "preventive", status: "closed", created_at: fmtDate(t), downtime_hours: 0,
        cost_usd: Math.round(normal(3500, 800)), part_no: "FLT-GEN",
        description: "Time-based PM: oil change, alignment and vibration check",
      });
    }
    // Riwayat korektif sebelum jendela data (untuk MTBF/MTTR).
    for (let i = 0; i < (a.criticality === "A" ? 2 : 1); i++) {
      rows.push({
        asset_id: a.id, type: "corrective", status: "closed",
        created_at: fmtDate(START - Math.floor(30 + rand() * 330) * DAY),
        downtime_hours: Math.round(8 + rand() * 30), cost_usd: Math.round(Math.max(5000, normal(40000, 15000))),
        part_no: partFor(a.id), description: `Corrective repair: ${a.typicalFailure}`,
      });
    }
  }
  for (const e of cfg.sensorEvents) {
    if (e.type === "trip") {
      rows.push({
        asset_id: e.asset, type: "corrective", status: "closed", created_at: fmtDate(START + e.day * DAY),
        downtime_hours: e.downtimeHours, cost_usd: e.costUsd, part_no: e.partNo, description: `Unplanned trip: ${e.mode}`,
      });
    } else if (e.type === "glitch") {
      rows.push({
        asset_id: e.asset, type: "inspection", status: "closed", created_at: fmtDate(START + e.day * DAY),
        downtime_hours: 0, cost_usd: 1500, part_no: "INS-VIB", description: `High vibration alarm investigated: ${e.mode}`,
      });
    }
  }
  rows.sort((x, y) => x.created_at.localeCompare(y.created_at));
  write("work_orders", rows.map((r, i) => ({ wo_id: `WO-${String(i + 1).padStart(5, "0")}`, ...r })));
}

function parts() {
  write("spare_parts", cfg.spareParts);
}

// Energi per unit per jam untuk energyDays terakhir (berakhir bersamaan dengan data sensor).
function energy() {
  reseed(3);
  const hours = cfg.energyDays * 24;
  const t0 = END - hours * HOUR;
  const conv = cfg.energyConversion;
  const ef = Object.fromEntries(cfg.emissionFactors.map((f) => [f.source, f.factor]));
  const rows = [];
  for (const u of cfg.energyUnits) {
    let rate = u.production_t_h;
    for (let h = 0; h < hours; h++) {
      const ts = t0 + h * HOUR;
      const day = Math.floor(h / 24);
      const shift = shiftOf(new Date(ts).getUTCHours());
      if (h % 24 === 0) rate = u.production_t_h * normal(1, 0.03);
      let prodMul = 1;
      let fuelI = u.fuel_gas_gj_per_t;
      let steamI = u.steam_t_per_t;
      let elecI = u.electricity_mwh_per_t;
      let cot = null;
      let steamHc = null;
      let sinceDecoking = null;
      if (u.id === cfg.crackerUnit) {
        cot = normal(835, 3);
        steamHc = normal(0.5, 0.02);
        const last = cfg.decokingDays.filter((d) => d <= day).pop();
        sinceDecoking = last === undefined ? day + 30 : day - last;
        fuelI *= 1 + 0.004 * (cot - 835) + 0.3 * (steamHc - 0.5) + 0.0015 * sinceDecoking;
        steamI *= 1 + 1.5 * (steamHc - 0.5);
      }
      if (shift === "Night") fuelI *= 1.015;
      for (const e of cfg.energyEvents) {
        if (e.unit !== u.id || h < e.day * 24 || h >= e.day * 24 + e.hours) continue;
        fuelI *= 1 + (e.fuelGasPct ?? 0) / 100;
        steamI *= 1 + (e.steamPct ?? 0) / 100;
        elecI *= 1 + (e.electricityPct ?? 0) / 100;
        prodMul *= 1 + (e.productionPct ?? 0) / 100;
      }
      const prod = Math.max(0, normal(rate, rate * 0.01)) * prodMul;
      // Sebagian energi bersifat tetap: saat rate turun, intensitas per ton naik.
      const use = (intensity) => intensity * (u.production_t_h * u.fixedShare + prod * (1 - u.fixedShare)) * normal(1, 0.01);
      const fuel = use(fuelI);
      const steam = use(steamI);
      const elec = use(elecI);
      const energyGj = fuel + steam * conv.steam_gj_per_t + elec * conv.electricity_gj_per_mwh;
      rows.push({
        timestamp: fmtTime(ts),
        unit_id: u.id,
        shift,
        production_t: round(prod, 2),
        fuel_gas_gj: round(fuel, 1),
        steam_t: round(steam, 2),
        electricity_mwh: round(elec, 3),
        energy_gj: round(energyGj, 1),
        energy_intensity_gj_per_t: prod > 0 ? round(energyGj / prod, 3) : null,
        co2e_t: round(fuel * ef.fuel_gas + steam * ef.steam + elec * ef.electricity, 2),
        cot_c: cot == null ? null : round(cot, 1),
        steam_hc_ratio: steamHc == null ? null : round(steamHc, 3),
        days_since_decoking: sinceDecoking,
      });
    }
  }
  write("energy_hourly", rows);
  write("energy_units", cfg.energyUnits);
  write("emission_factors", cfg.emissionFactors);
}

// Data Kasus C: jadwal kargo feedstock, rencana maintenance, dan permintaan produk.
function planning() {
  reseed(4);
  const p = cfg.planning;
  const cargo = [];
  let n = 1;
  for (let t = START; t < END + 90 * DAY; t += p.cargoEveryDays * DAY) {
    const delay = rand() < 0.3 ? Math.ceil(rand() * 4) : 0;
    const arrived = t + delay * DAY <= END;
    cargo.push({
      cargo_id: `NAP-${String(n++).padStart(3, "0")}`,
      feedstock: "Naphtha",
      planned_date: fmtDate(t),
      actual_date: arrived ? fmtDate(t + delay * DAY) : null,
      delay_days: arrived ? delay : null,
      status: arrived ? "arrived" : "scheduled",
      volume_kt: round(normal(p.cargoVolumeKt, 5), 1),
    });
  }
  write("feedstock_deliveries", cargo);
  write("maintenance_plan", p.maintenance);

  const demand = [];
  const base = new Date(END);
  for (let m = -6; m <= 6; m++) {
    const month = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + m, 1));
    for (const prod of p.products) {
      const season = 1 + 0.06 * Math.sin(((month.getUTCMonth() + 1) / 12) * 2 * Math.PI);
      demand.push({
        month: month.toISOString().slice(0, 7),
        product: prod.product,
        demand_kt: round(prod.base_kt * season * normal(1, 0.04), 1),
        type: m < 0 ? "actual" : "forecast",
      });
    }
  }
  write("product_demand", demand);
}

if (want("sensor")) sensor();
if (want("workorders")) workOrders();
if (want("parts")) parts();
if (want("energy")) energy();
if (want("planning")) planning();
