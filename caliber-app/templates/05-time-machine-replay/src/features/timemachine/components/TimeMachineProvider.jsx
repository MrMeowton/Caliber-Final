import { TimeMachineContext } from '../react/context.js'
import { useTimeMachine } from '../react/useTimeMachine.js'

/**
 * Sediakan state mesin waktu untuk komponen TM* dan komponen milik sendiri.
 *
 * Dua cara:
 *   <TimeMachineProvider series={...} threshold={7.1}>…</TimeMachineProvider>   // provider membuat state
 *   <TimeMachineProvider value={tm}>…</TimeMachineProvider>                       // tm dari useTimeMachine()
 * Cara kedua dipakai bila komponen induk juga perlu membaca/mengendalikan state.
 */
export function TimeMachineProvider({ value, children, ...config }) {
  if (value) return <TimeMachineContext.Provider value={value}>{children}</TimeMachineContext.Provider>
  return <OwnedProvider config={config}>{children}</OwnedProvider>
}

function OwnedProvider({ config, children }) {
  const tm = useTimeMachine(config)
  return <TimeMachineContext.Provider value={tm}>{children}</TimeMachineContext.Provider>
}
