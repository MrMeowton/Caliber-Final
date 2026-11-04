# 12 · Onboarding Time-to-Competence

Pilar **Knowledge** — KPI people yang mudah dipahami juri non-teknis:
**berapa hari engineer baru butuh sampai kompeten, sebelum vs sesudah** ada sistem knowledge.

- KPI: median hari (sebelum / sesudah), hari yang dihemat, % lebih cepat, **US$ per tahun**
- Kurva "% rekrutan yang sudah kompeten pada hari ke-N" untuk dua cohort
- Dumbbell per skill: skill mana yang paling dipercepat

Hanya `react` — SVG murni. Modul mandiri di `src/features/onboarding`.

## Menjalankan demo

```bash
cd 12-onboarding-competence
npm install
npm run dev
npm test
```

| Slider | Efek |
| --- | --- |
| Definisi kompeten | Porsi skill wajib (berbobot) yang harus tersertifikasi |
| Nilai produktivitas / hari | US$ selisih produktivitas engineer kompeten vs belum |
| Rekrutan per tahun | Pengali untuk nilai tahunan |

## Model

- **Time-to-competence** engineer = hari pertama porsi skill berbobot yang tercapai ≥ `threshold`.
- Rekrutan yang belum kompeten per `asOf` = **tersensor**. Kurva memakai estimator
  **Kaplan–Meier**, sehingga rekrutan baru yang "masih berjalan" tidak membuat cohort baru
  terlihat lebih buruk (atau lebih baik) dari kenyataan.
- Median = hari ketika kurva menyentuh 50 %.
- Nilai per tahun = `(median_sebelum − median_sesudah) × valuePerDay × hiresPerYear`.

## Struktur

```
src/features/onboarding/        ← MODUL MANDIRI
├── index.js
├── OnboardingCompetence.jsx     komponen jadi (+ CompetenceChart, SkillDumbbell)
├── competence.js                logika murni: timeToCompetence, competenceCurve (KM), analyze
├── competence.test.js
└── onboarding.css               prefix ob-
```

## Integrasi

```jsx
import { OnboardingCompetence } from './features/onboarding'

const skills = [{ id: 'su', name: 'Start-up / shutdown', weight: 2 }, …]
// achieved: hari ke-N sejak masuk saat skill tersertifikasi (dari LMS / matriks kompetensi)
const engineers = [{ id: 'e1', cohort: 'before', hiredAt: '2024-02-01', achieved: { su: 180, … } }, …]

<OnboardingCompetence engineers={engineers} skills={skills} asOf={new Date()}
  threshold={0.8} valuePerDay={250} hiresPerYear={15}
  labels={{ before: 'Sebelum', after: 'Dengan MIND' }} />
```

| Prop | Keterangan |
| --- | --- |
| `baseline`, `compare` | kunci cohort yang dibandingkan (default `before` / `after`) |
| `labels` | label tampilan per cohort |
| `maxDay` | batas sumbu X (default otomatis) |
| `showSkills` | tampilkan rincian per skill |

`analyze(engineers, skills, opts)` mengembalikan semua angka tanpa UI.
