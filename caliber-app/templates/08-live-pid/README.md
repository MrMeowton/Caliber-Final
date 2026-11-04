# 08 · Live P&ID

Satu fitur saja: **P&ID hidup** — diagram proses dengan **pipa beranimasi** dan **tag sensor live
di sampingnya**. Aliran di pipa bergerak dengan kecepatan sebanding laju alir sebenarnya (berhenti
saat laju 0), level tangki/vessel naik-turun, impeller pompa berputar saat jalan, bukaan valve
terlihat di badan valve. Setiap gelembung instrumen (gaya ISA-5.1) punya **chip nilai live** di
sebelahnya, dan panel samping menampilkan **kartu tag** dengan status batas (L/H/LL/HH) dan
sparkline. Tag yang melewati batas → chip merah + gelembung berdenyut + kartu naik ke atas.

Hanya `react` — semua simbol digambar dengan SVG murni, animasi alir memakai **satu**
`requestAnimationFrame` untuk semua pipa. Dikemas sebagai **modul mandiri**
(`src/features/pid`) yang tinggal disalin ke project hackathon.

## Menjalankan demo

```bash
cd 08-live-pid
npm install
npm run dev      # buka http://localhost:5173
```

| Interaksi | Hasil |
| --- | --- |
| **● Live** | Simulator proses berjalan tiap 0,4 detik (dinamika orde-1 + kontroler PI) |
| **Trip pompa P-101** | Laju umpan jatuh ke 0 → pipa berhenti & meredup, FV-101 *wind-up* ke 100 %, level TK-101 naik ke alarm |
| **Simulasikan fouling E-101** | Perpindahan panas turun → TV-102 jenuh 100 %, suhu TT-102 gagal capai SP → alarm rendah |
| Slider **SP FIC-101 / SP TIC-102** | Ubah setpoint — laju animasi pipa & steam ikut berubah mulus |
| Hover / `Tab` gelembung atau kartu | Sorot tag, loop kontrolnya, dan jalur sinyal terkait |
| Klik / `Enter` | Kunci pilihan (dikirim ke host lewat `onSelect`) · `Esc` lepas |

Prosesnya ilustratif: tangki umpan → pompa → valve kontrol laju → pemanas umpan (steam LP) →
separator gas/cair, dengan tiga loop kontrol (FIC-101, TIC-102, LIC-103).

## Struktur

```
src/
├── App.jsx                     DEMO: kontrol skenario, slider setpoint
├── demo/process.js             DEMO: DIAGRAM + TAGS + simulator proses
└── features/pid/               ← MODUL MANDIRI — salin folder ini
    ├── index.js                pintu masuk (impor HANYA dari sini; juga memuat CSS)
    ├── LivePID.jsx             siap pakai: diagram + legenda + panel tag
    ├── PidDiagram.jsx          diagram saja: pipa, peralatan, instrumen
    ├── TagPanel.jsx            panel tag: TagPanel, TagCard, Sparkline
    ├── symbols.jsx             simbol SVG: Tank, Vessel, Pump, Valve, Exchanger, Box, Instrument
    ├── registry.js             EQUIPMENT_SYMBOLS — peta `type` → simbol (bisa ditambah)
    ├── hooks.js                useFlowAnimation, useTagHistory, useReducedMotion
    ├── engine.js               logika murni: status batas, format, path pipa, laju alir
    └── pid.css                 gaya ber-prefix pid-, warna lewat variabel --pid-*
```

## Integrasi ke project utama

```bash
cp -r 08-live-pid/src/features/pid  <project-utama>/src/features/
# tidak ada dependensi tambahan selain react
```

### Cara 1 — pakai komponen jadi

Tiga input dipisah: **geometri** (statis, dari file config), **definisi tag** (statis), dan
**nilai** (live, dari API/WebSocket).

```jsx
import { LivePID } from './features/pid'

const DIAGRAM = {
  width: 1040, height: 540,                         // koordinat viewBox (SVG tetap responsif)
  equipment: [
    { id: 'TK-101', type: 'tank', label: 'Tangki umpan', x: 70, y: 120, w: 110, h: 200, levelTag: 'LT-101', medium: 'hydrocarbon' },
    { id: 'P-101', type: 'pump', x: 250, y: 420, runTag: 'P-101' },
    { id: 'FV-101', type: 'valve', x: 420, y: 360, positionTag: 'FV-101' },
  ],
  lines: [
    { id: 'L1', kind: 'process', medium: 'hydrocarbon', points: [[160, 320], [160, 420], [228, 420]], flowTag: 'FT-101' },
    { id: 'S1', kind: 'signal', points: [[330, 284], [330, 262], [404, 262]], tags: ['FT-101'] },
  ],
  instruments: [
    { tag: 'FT-101', x: 330, y: 300, anchor: [330, 360], chip: 'left' },
    { tag: 'FIC-101', x: 420, y: 262, mount: 'dcs', valueTag: 'FT-101', chip: false },
  ],
}

const TAGS = [
  { tag: 'FT-101', label: 'Laju umpan', unit: 'm³/h', digits: 1, min: 0, max: 80, limits: { lolo: 10, lo: 25 }, spTag: 'FIC-101.SP' },
  { tag: 'P-101', label: 'Pompa umpan', states: ['Mati', 'Jalan'], alarmStates: [0] },
]

// dari API: { [tag]: number }
const values = { 'FT-101': 40.2, 'FIC-101.SP': 40, 'P-101': 1, 'LT-101': 52, 'FV-101': 53 }

<LivePID diagram={DIAGRAM} tags={TAGS} values={values} onSelect={(tag) => openTrend(tag)} />
```

**Peralatan** (`equipment[]`)

| Field | Keterangan |
| --- | --- |
| `id`, `type`, `label` | `type`: `tank` · `vessel` · `pump` · `valve` · `exchanger` · `box` (atau tipe sendiri, lihat bawah) |
| `x, y, w, h` | kotak (tank/vessel/exchanger/box). Pompa & valve: `x, y` = pusat, `r` / `size` opsional |
| `levelTag` | tag level → isi tangki/vessel (pakai `min`/`max` tag) |
| `runTag` | tag diskret pompa (1 = jalan → impeller berputar) |
| `positionTag` | tag bukaan valve % → kepekatan badan + bar bukaan |
| `medium` | warna isi level · `vertical` (valve) · `labelPos: 'above'` · `labelDx` geser label |

**Jalur** (`lines[]`)

| Field | Keterangan |
| --- | --- |
| `kind` | `process` (tebal) · `utility` (lebih tipis) · `signal` (putus-putus, tanpa animasi) |
| `points` | polyline `[[x,y], …]` — sudut dibulatkan otomatis (`radius`, default 10) |
| `medium` | kunci warna di `media` (default: `hydrocarbon`, `steam`, `condensate`, `gas`, `water`, `product`) |
| `flowTag`, `flowMax` | tag yang menggerakkan animasi; laju = nilai ÷ `flowMax` (default `max` tag). Negatif = arah balik |
| `tags` | tag lain yang menyorot jalur ini saat aktif (mis. jalur sinyal sebuah loop) |
| `arrow`, `fromLabel`, `toLabel` | panah di ujung, label di awal/ujung jalur |

**Instrumen** (`instruments[]`)

| Field | Keterangan |
| --- | --- |
| `tag`, `x`, `y` | teks gelembung dipecah otomatis: `FIC-101` → `FIC` / `101` |
| `anchor` | titik sambung ke pipa/peralatan (garis penunjuk) |
| `mount` | `field` (lingkaran) · `dcs` (lingkaran dalam kotak + garis tengah) |
| `chip` | posisi nilai live: `right` (default) · `left` · `top` · `bottom` · `false` |
| `valueTag` | tag yang ditampilkan/dipilih bila berbeda dari `tag` (mis. kontroler → PV-nya) |
| `loopTags` | tag lain di loop yang sama — tidak diredupkan saat salah satunya disorot |

**Tag** (`tags[]`)

| Field | Keterangan |
| --- | --- |
| `tag`, `label`, `unit`, `digits` | teks & format angka (locale `id-ID`) |
| `min`, `max` | rentang (level, sparkline, skala laju alir) |
| `limits` | `{ lolo, lo, hi, hihi }` — `lo/hi` = peringatan, `lolo/hihi` = alarm |
| `spTag` / `sp` | setpoint dari `values[spTag]` atau angka tetap → ditampilkan di kartu & sparkline |
| `states`, `alarmStates` | tag diskret: `['Mati','Jalan']`, nilai yang dianggap alarm |

**Prop `LivePID` lain:** `history` (riwayat dari historian `{ [tag]: number[] }` — tanpa ini
dikumpulkan di klien, `historySize` default 60) · `selectedTag` + `onSelect` (mode terkontrol) ·
`panelTags` (subset tag di panel) · `sort` (`'status'` alarm dulu / `'none'`) · `media` ·
`animate` · `flowSpeed` (px/detik pada laju maks, default 90) · `showChips` · `backdrop`
(elemen SVG di bawah diagram) · `symbols` · `showLegend` · `panelTitle`.

### Cara 2 — rakit sendiri

```jsx
import { PidDiagram, TagPanel, useTagHistory, statusOf, worstStatus } from './features/pid'

const history = useTagHistory(values)
<PidDiagram diagram={DIAGRAM} tags={TAGS} values={values} activeTag={hover} onTagHover={setHover} />
<TagPanel tags={TAGS} values={values} history={history} activeTag={hover} onTagHover={setHover} />
```

Simbol baru (kompresor, kolom distilasi, …) cukup komponen yang menerima `{ eq, level, color,
running, position }`:

```jsx
import { EQUIPMENT_SYMBOLS } from './features/pid'
const Compressor = ({ eq }) => <path d={`M${eq.x} ${eq.y} …`} className="pid-body pid-outline" />
<LivePID symbols={{ ...EQUIPMENT_SYMBOLS, compressor: Compressor }} … />
```

`engine.js` tidak bergantung pada React — `statusOf`, `evaluateTags`, `worstStatus`,
`limitBreached` bisa dipakai di backend (mis. notifikasi alarm) atau tes.

Menghubungkan ke data nyata: ganti simulator dengan `setValues` dari WebSocket/SSE/polling —
komponen hanya butuh objek `values` baru setiap kali ada pembacaan.

## Cara kerjanya

- **Tiga lapis per pipa.** Badan pipa gelap → isi berwarna medium (meredup saat laju 0) →
  lapisan "partikel" putih ber-`stroke-dasharray` dengan `mix-blend-mode: screen` dan pendaran
  warna medium.
- **Animasi alir tanpa lompatan.** Satu loop `requestAnimationFrame` menggeser
  `stroke-dashoffset` semua pipa sebesar `kecepatan × dt`; kecepatan dibaca dari ref tiap frame.
  Animasi CSS akan "melompat" setiap durasinya diganti — di sini laju bisa berubah tiap 0,4 detik
  dengan mulus. Periode dash (20) membagi 1000 sehingga offset di-modulo tanpa patahan.
  Tidak ada re-render React per frame.
- **Status batas** dihitung murni di `engine.js` (`statusOf`) dan dipakai bersama oleh chip,
  gelembung, kartu, dan badge — satu sumber kebenaran.
- **Riwayat sparkline** dikumpulkan dengan pola "turunkan saat render" (tanpa `useEffect`),
  tepat satu sampel per objek `values` baru.
- **Transisi** level, bukaan valve, warna chip memakai transisi CSS (`y`/`height` lewat
  `style` agar bisa dianimasikan). Menghormati `prefers-reduced-motion` (animasi alir, pompa,
  dan denyut dimatikan).
- **Aksesibel**: gelembung instrumen dan kartu bisa difokus dengan `Tab`, punya `aria-label`
  berisi nilai saat ini.
