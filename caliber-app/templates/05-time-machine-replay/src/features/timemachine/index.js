// PINTU MASUK MODUL timemachine — impor HANYA dari file ini.
//
// Lapisan (pilih sesuai kebutuhan):
//   1. Preset       <TimeMachineReplay/>                     → tempel & jalan
//   2. Komposabel   <TimeMachineProvider> + TM*               → susun bebas di dashboard
//   3. Headless     useTimeMachine()                          → UI sepenuhnya milik sendiri
//   4. Core         analyzeSeries, forecastAt, toSeries, ...  → logika murni (juga dari ./core/index.js)

export * from './core/index.js'

export { useReplay } from './react/useReplay.js'
export { useTimeMachine } from './react/useTimeMachine.js'
export { useReplayKeyboard } from './react/useReplayKeyboard.js'
export { useTimeMachineContext, TimeMachineContext } from './react/context.js'

export { TimeMachineProvider } from './components/TimeMachineProvider.jsx'
export { TimeMachineReplay } from './components/TimeMachineReplay.jsx'
export { ReplayChart } from './components/ReplayChart.jsx'
export { TMRoot, TMHeader, TMChart, TMControls, TMStatus, TMStory, StatusCard, Rich } from './components/parts.jsx'
