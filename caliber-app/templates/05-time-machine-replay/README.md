# 05 · Time-Machine Replay

Satu fitur saja: **time-machine replay**. Halaman dibuka di "sekarang" (aset sudah alarm).
Geser slider **ke belakang** → masa depan menjadi kosong ("belum terjadi") dan anomali
mengecil. Tekan **▶** → anomali **tumbuh pelan-pelan**, dan penonton melihat sendiri:

1. **AI mendeteksi** tren naik saat dashboard konvensional masih `NORMAL`,
2. garis putus-putus **prediksi AI** menunjuk kapan batas akan dilewati (makin tepat seiring waktu),
3. **alarm konvensional** baru berbunyi belakangan → braket _"AI 14 hari lebih awal"_.

Nilai AI dibuktikan **dengan cerita**, bukan klaim. Cocok untuk Reliability & Energy.

Modulnya **berlapis** supaya mudah ditempel ke sistem hackathon apa pun: pakai preset
satu baris, susun komponennya di layout dashboard sendiri, atau ambil otaknya saja
(hook headless / logika murni). Hanya butuh `react` — grafik SVG murni.

## Menjalankan demo

```bash
cd 05-time-machine-replay
npm install
npm run dev      # buka http://localhost:5173
npm test         # 7 test untuk lapisan core (node:test, tanpa dependensi)
```

Demo berisi **3 contoh integrasi** (`src/demo/`):

| Tab | Menunjukkan |
| --- | --- |
| 1 · Siap pakai | `<TimeMachineReplay/>` satu komponen |
| 2 · Dashboard komposisi | hook di induk, `TM*` disusun bebas, komponen sendiri via context, callback `onDetect/onAlarm`, kendali waktu dari luar, ganti bahasa ID ⇄ EN |
| 3 · Data & model dari API | JSON backend (tanggal ISO, skor & prediksi model ML) → `toSeries` + `fromPrecomputed`, sumbu waktu jadi tanggal |

Interaksi: geser slider / klik-drag grafik, **▶** atau `Spasi`, `1× 2× 4×`, `←` `→`
(`Shift` = jauh), `Home` / `End`, **Sekarang ⏭**.

## Arsitektur

```
src/features/timemachine/          ← MODUL MANDIRI — salin folder ini
├── index.js                       pintu masuk (impor HANYA dari sini)
├── core/        LAPISAN 4 · logika murni, tanpa React (jalan juga di Node/backend)
│   ├── analyze.js        analyzer bawaan: baseline, EWMA, skor, deteksi, alarm
│   ├── forecast.js       forecaster bawaan: proyeksi eksponensial tanpa mengintip masa depan
│   ├── precomputed.js    fromPrecomputed() — pakai skor & prediksi dari model backend
│   ├── stage.js          stageAt() normal/warning/alarm, summarize() angka pembuktian
│   ├── series.js         toSeries() adapter data API/CSV, makeDegradationSeries() data demo
│   ├── format.js         createTimeFormat() (Hari 12 / 8 Okt), formatValue, scoreColor
│   ├── labels.js         LABELS_ID, LABELS_EN, mergeLabels, fill
│   └── types.js          typedef JSDoc (autocomplete VS Code)
├── react/       LAPISAN 3 · hook headless
│   ├── useTimeMachine.js     seluruh otak: data + tahap + prediksi + pemutar + callback
│   ├── useReplay.js          pemutar waktu (controlled / uncontrolled)
│   ├── useReplayKeyboard.js  pintasan keyboard
│   └── context.js            useTimeMachineContext()
├── components/  LAPISAN 2 & 1 · UI
│   ├── TimeMachineProvider.jsx
│   ├── parts.jsx             TMRoot, TMHeader, TMChart, TMControls, TMStatus, TMStory
│   ├── ReplayChart.jsx       grafik presentasional (hanya props)
│   └── TimeMachineReplay.jsx PRESET = Provider + semua parts
└── styles/timemachine.css     class ber-prefix tm-, tema lewat CSS variable
```

Aturan ketergantungan satu arah: `components → react → core`. Core tidak tahu React,
hook tidak tahu tampilan → setiap lapisan bisa diganti tanpa menyentuh yang lain.

## Integrasi ke project hackathon

```bash
cp -r 05-time-machine-replay/src/features/timemachine  <project-utama>/src/features/
# tidak ada dependensi tambahan selain react (18/19)
```

Pilih lapisan sesuai kebutuhan:

### 1 · Preset — tempel & jalan

```jsx
import { TimeMachineReplay } from './features/timemachine'

<TimeMachineReplay title="Bearing P-101" series={history} threshold={7.1} unit="mm/s" />
```

### 2 · Komposabel — susun di layout dashboard sendiri

```jsx
import { TimeMachineProvider, TMRoot, TMHeader, TMChart, TMControls, TMStatus, TMStory,
         useTimeMachineContext } from './features/timemachine'

<TimeMachineProvider series={history} threshold={95} unit="°C">
  <div className="grid">
    <TMRoot><TMHeader /><TMChart height={300} /><TMControls speeds={[1, 4]} /></TMRoot>
    <aside><TMStatus /><MyWorkOrder /><TMStory /></aside>
  </div>
</TimeMachineProvider>

// Komponen milikmu sendiri ikut "berjalan" bersama waktu:
function MyWorkOrder() {
  const { stage, forecast, fmt } = useTimeMachineContext()
  return stage === 'warning' && <button>Jadwalkan sebelum {fmt.time(forecast?.t)}</button>
}
```

Semua `TM*` opsional dan bebas urutan. `TMRoot` hanya wadah berbingkai + keyboard.

### 3 · Headless — induk ikut membaca / mengendalikan state

```jsx
const tm = useTimeMachine({
  series, threshold: 7.1, unit: 'mm/s',
  onDetect: (info) => notify(`Anomali terdeteksi ${info.time}`),   // masuk tahap warning
  onAlarm:  (info) => openWorkOrder(info.point),                    // masuk tahap alarm
  onIndexChange: (i, point) => setTwinTime(point.t),                // sinkron ke modul lain
})

tm.seek(tm.analysis.detectIndex)   // lompat waktu dari tombol mana pun
tm.player.play()

<TimeMachineProvider value={tm}> …TM* atau UI sendiri… </TimeMachineProvider>
```

Isi `tm`: `series, analysis, index, point, stage, score, trend, forecast, summary,
labels, fmt { time, duration, value }, player { play, pause, toggle, step, toEnd, speed,
setSpeed, playing, isAtEnd }, seek`.

**Mode controlled** — waktu dipegang sistem luar (mis. timeline global dashboard):
`useTimeMachine({ ..., index: globalIndex, onIndexChange: setGlobalIndex })`.

### 4 · Core — logika murni (juga untuk backend Node / script)

```js
import { analyzeSeries, forecastAt, summarize } from './features/timemachine/core/index.js'

const a = analyzeSeries(series, { threshold: 7.1 })
summarize(series, a, forecastAt) // { detectAt, alarmAt, leadTime, forecastError, ... }
```

## Menyambungkan ke backend & model AI

**Data** — `toSeries` menerima format apa pun; waktu boleh angka, `Date`, atau string ISO:

```js
const { series, origin, toT } = toSeries(rows, { time: 'timestamp', value: 'vibration_rms', unit: 'day' })
<TimeMachineReplay series={series} origin={origin} timeUnit="day" … />   // sumbu tampil "8 Okt"
```

**Model** — bila backend sudah punya model ML, ganti otak bawaan dengan hasilnya:

```js
const { analyzer, forecaster } = fromPrecomputed({
  baseline: res.baseline,                       // nilai normal
  score: res.anomaly_score,                     // 0..1, sejajar dengan series (opsional)
  trend: res.trend,                             // nilai halus (opsional)
  detectAt: toT(res.detected_at),               // kapan model mendeteksi
  forecasts: res.forecasts.map((f) => ({ at: toT(f.made_at), crossAt: toT(f.failure_eta) })),
})
<TimeMachineReplay … analyzer={analyzer} forecaster={forecaster} />
```

Atau tulis analyzer sendiri: fungsi `(series, { threshold }) => Analysis` dengan bentuk
`{ mean, sd, smooth[], score[], detectIndex, crossIndex, threshold }` (lihat `core/types.js`).
Simpan adapter format API di **satu fungsi** (contoh: `adapt()` di `src/demo/BackendDemo.jsx`),
sehingga bila backend berubah cukup satu tempat yang disesuaikan.

## Kustomisasi

| Kebutuhan | Caranya |
| --- | --- |
| Bahasa / gaya pitch | `labels={LABELS_EN}` atau sebagian: `labels={{ story: { warning: '…' } }}` — template `{var}`, `**tebal**` |
| Satuan waktu | `timeUnit="hour"` → "Jam 5" / "5 jam"; atau `formatTime`, `formatDuration` sendiri |
| Tema | timpa CSS variable: `.dashboard .tm-part { --tm-bg:#fff; --tm-text:#0f172a; --tm-accent:#7c3aed }` (juga `--tm-panel --tm-line --tm-muted --tm-ok --tm-ai --tm-alarm`) |
| Kepekaan deteksi | `analysisOptions={{ warmup, alpha, detectZ, hold }}` |
| Proyeksi | `forecastOptions={{ window, steps, maxAhead }}` |
| Kecepatan / posisi awal | `pointsPerSecond`, `start="end" \| "start" \| index` |
| Penanda kejadian | `events={[{ t, title, text }]}` |

Tip: memo-kan `series`, `analysisOptions`, `forecastOptions` (atau taruh di luar komponen)
agar analisis tidak dihitung ulang tiap render. Callback tidak perlu di-memo.

**Gabung dengan project 04 (X-ray):** `onIndexChange` / `stage` → nyalakan
`<FaultPulse active={tm.stage !== 'normal'}>` sehingga bearing 3D ikut berdenyut saat
slider melewati titik deteksi AI.

## Cara kerjanya

- **Waktu = index.** Seluruh tampilan diturunkan dari satu angka `index`. Grafik hanya
  menggambar titik `0..index`, sumbu tetap untuk seluruh rentang → masa depan kosong
  dan axis tidak melompat saat slider digeser.
- **Analyzer bawaan**: baseline (mean, sd) dari 30% data awal; nilai dihaluskan EWMA;
  skor = posisi tren antara baseline (0) dan batas (1). **Deteksi** = tren >
  baseline + 1.5·sd selama 4 titik berturut-turut. **Alarm konvensional** = nilai mentah ≥ batas.
- **Prediksi jujur**: hanya memakai data **sampai index** (dibuktikan oleh test
  "prediksi tidak mengintip masa depan"). Regresi linear pada `log(tren − baseline)` =
  model eksponensial, diekstrapolasi sampai batas — tanggalnya makin tepat saat diputar.
- **Pemutar**: `requestAnimationFrame` + akumulator pecahan → kecepatan konsisten di
  60/120 Hz; berhenti otomatis di ujung; mendukung controlled index.
- **Callback** `onStageChange / onDetect / onAlarm` hanya dipicu saat tahap berubah
  (tidak saat mount), membawa `{ stage, prev, index, point, time, forecast, summary }`.

Data demo bearing: AI mendeteksi Hari 37, alarm Hari 51 (**14 hari lebih awal**);
prediksi terakhir sebelum alarm meleset ±1,4 hari.
