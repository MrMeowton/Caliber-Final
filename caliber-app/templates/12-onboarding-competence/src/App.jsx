import { useState } from 'react'
import { OnboardingCompetence } from './features/onboarding'
import { asOf, engineers, skills } from './demo/engineers'
import Slider from './demo/Slider'

export default function App() {
  const [threshold, setThreshold] = useState(80)
  const [valuePerDay, setValuePerDay] = useState(250)
  const [hires, setHires] = useState(15)

  return (
    <main className="page">
      <header className="head">
        <div>
          <p className="eyebrow">Knowledge · KPI people</p>
          <h1>Onboarding Time-to-Competence</h1>
        </div>
        <div className="controls">
          <Slider label="Definisi kompeten" value={threshold} onChange={setThreshold} min={50} max={100} step={5} format={(v) => `≥ ${v}% skill`} />
          <Slider label="Nilai produktivitas / hari" value={valuePerDay} onChange={setValuePerDay} min={0} max={800} step={25} format={(v) => `$${v}`} />
          <Slider label="Rekrutan per tahun" value={hires} onChange={setHires} min={1} max={60} />
        </div>
      </header>

      <p className="hint">
        Berapa hari engineer baru butuh sampai bisa bekerja mandiri? Kurva = % rekrutan yang sudah kompeten pada hari ke-N
        (Kaplan–Meier, jadi rekrutan yang <b>masih berjalan</b> tidak merusak rata-rata). “Nilai / hari” = selisih produktivitas
        engineer kompeten vs belum (gaji + beban supervisi senior).
      </p>

      <OnboardingCompetence
        engineers={engineers}
        skills={skills}
        asOf={asOf}
        threshold={threshold / 100}
        valuePerDay={valuePerDay}
        hiresPerYear={hires}
        labels={{ before: 'Sebelum (2023–24)', after: 'Sesudah (2025–26)' }}
      />
    </main>
  )
}
