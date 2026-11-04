// DEMO: pura-pura API meter energi. Di hackathon ganti dengan:
//   fetch('/api/energy/flows').then((r) => r.json())
import { NODES, PRESETS, plantLinks } from './plantModel'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** Bentuk tabel "mentah" seperti keluaran historian: satu baris per meter aliran. */
export async function fetchEnergyRows() {
  await sleep(250)
  return plantLinks(PRESETS.actual).map((l) => ({
    from: l.source,
    to: l.target,
    value_gj_h: l.value * (1 + (Math.random() - 0.5) * 0.05), // derau meter ±2,5%
  }))
}

// peta id → kind/label (biasanya dari tabel master aset)
export const KINDS = Object.fromEntries(NODES.map((n) => [n.id, n.kind]))
export const LABELS = Object.fromEntries(NODES.map((n) => [n.id, n.label]))
