// PLACEHOLDER — replace this whole file with the code generated from PROMPT.md (same name & exports).
import { Placeholder } from "../../core/Placeholder";
import type { EquipmentProps, SlotDef } from "../../contract";

export const SLOTS: SlotDef[] = [
  { id: "spring", part: "spring", name: "Set-pressure spring", position: [0, 0, 0] },
  { id: "disc", part: "disc", name: "Disc", position: [0, 0, 0] },
  { id: "nozzle", part: "nozzle", name: "Nozzle", position: [0, 0, 0] },
  { id: "gasket", part: "gasket", name: "Inlet gasket", position: [0, 0, 0] },
  { id: "studbolts", part: "studbolt", name: "Studbolts", position: [0, 0, 0] }
];
export default function SafetyValve(props: EquipmentProps) {
  return <Placeholder label="safety-valve" xray={props.xray} onClick={props.onShellClick} size={[2, 1, 1]} />;
}
