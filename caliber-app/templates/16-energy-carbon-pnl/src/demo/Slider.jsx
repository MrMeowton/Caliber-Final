// DEMO: slider berlabel kecil (bukan bagian modul)
export default function Slider({ label, value, onChange, min, max, step = 1, format = (v) => v }) {
  return (
    <label className="ctl">
      <span>
        {label}: <b>{format(value)}</b>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  )
}
