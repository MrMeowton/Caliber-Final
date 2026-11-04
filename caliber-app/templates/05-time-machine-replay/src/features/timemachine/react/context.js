import { createContext, useContext } from 'react'

export const TimeMachineContext = createContext(null)

/** Baca state mesin waktu dari komponen mana pun di bawah <TimeMachineProvider>. */
export function useTimeMachineContext() {
  const tm = useContext(TimeMachineContext)
  if (!tm) throw new Error('useTimeMachineContext harus dipakai di dalam <TimeMachineProvider>')
  return tm
}
