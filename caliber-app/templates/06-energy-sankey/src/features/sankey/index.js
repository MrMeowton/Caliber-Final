// Pintu masuk modul sankey — impor HANYA dari file ini
// UI
export { EnergySankey } from './EnergySankey'
export { KIND_COLORS, KIND_LABELS } from './colors'
// Data masuk
export { graphFromRows, scaleGraph, guessKind, UNIT_TO_GJ_PER_H } from './adapters'
export { useEnergyFlows } from './useEnergyFlows'
export { validateGraph } from './validate'
// Inti (tanpa React) — untuk render sendiri / backend / tes
export { computeSankey, energyBalance, linkPath } from './layout'
export { useTweenedLinks } from './useTweenedLinks'
