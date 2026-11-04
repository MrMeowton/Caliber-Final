// PLACEHOLDER — replace this whole file with the code generated from PROMPT.md (same name & exports).
import { Placeholder } from "../../core/Placeholder";
import type { EquipmentProps, SlotDef } from "../../contract";

export const SLOTS: SlotDef[] = [
  { id: "tube-bundle", part: "pipe", name: "Tube bundle", position: [0, 0, 0] },
  { id: "tube-plugs", part: "tube-plug", name: "Tube plugs", position: [0, 0, 0] },
  { id: "channel-gasket", part: "gasket", name: "Channel gasket", position: [0, 0, 0] },
  { id: "studbolts", part: "studbolt", name: "Studbolts", position: [0, 0, 0] },
  { id: "nozzle-flange", part: "flange", name: "Nozzle flanges", position: [0, 0, 0] }
];
export default function ShellTubeExchanger(props: EquipmentProps) {
  return <Placeholder label="shell-tube-exchanger" xray={props.xray} onClick={props.onShellClick} size={[2, 1, 1]} />;
}
