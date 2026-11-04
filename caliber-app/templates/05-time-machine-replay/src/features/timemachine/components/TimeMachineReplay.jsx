import { TimeMachineProvider } from './TimeMachineProvider.jsx'
import { TMChart, TMControls, TMHeader, TMRoot, TMStatus, TMStory } from './parts.jsx'

/**
 * PRESET siap pakai = Provider + semua komponen dalam satu kartu.
 * Menerima semua opsi useTimeMachine, ditambah: title, height, speeds, className.
 * Butuh layout lain? Rakit sendiri dari TM* (lihat README).
 */
export function TimeMachineReplay({ title, height, speeds, className, ...config }) {
  return (
    <TimeMachineProvider {...config}>
      <TMRoot className={className}>
        <TMHeader title={title} />
        <TMChart height={height} />
        <TMControls speeds={speeds} />
        <div className="tm-footer">
          <TMStatus />
          <TMStory />
        </div>
      </TMRoot>
    </TimeMachineProvider>
  )
}
