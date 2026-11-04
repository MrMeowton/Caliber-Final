// DEMO: 3 cara integrasi modul timemachine (lihat src/demo/)
import { useState } from 'react'
import { BackendDemo } from './demo/BackendDemo'
import { ComposedDemo } from './demo/ComposedDemo'
import { PresetDemo } from './demo/PresetDemo'

const TABS = [
  { key: 'preset', label: '1 · Siap pakai', View: PresetDemo },
  { key: 'composed', label: '2 · Dashboard komposisi', View: ComposedDemo },
  { key: 'backend', label: '3 · Data & model dari API', View: BackendDemo },
]

export default function App() {
  const [key, setKey] = useState('preset')
  const { View } = TABS.find((t) => t.key === key)

  return (
    <main className="page">
      <nav className="tabs">
        {TABS.map((t) => (
          <button key={t.key} className={t.key === key ? 'is-on' : ''} onClick={() => setKey(t.key)}>
            {t.label}
          </button>
        ))}
      </nav>
      <View key={key} />
      <p className="hint">
        Geser slider ke belakang lalu tekan ▶ · klik/drag grafik untuk lompat waktu · ← → (Shift = cepat), Spasi, Home/End
      </p>
    </main>
  )
}
