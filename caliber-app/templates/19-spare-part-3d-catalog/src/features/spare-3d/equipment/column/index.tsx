// PLACEHOLDER — replace this whole file with the code generated from PROMPT.md (same name & exports).
import { Placeholder } from "../../core/Placeholder";
import type { EquipmentProps, SlotDef } from "../../contract";

export const SLOTS: SlotDef[] = [
  { id: "trays", part: "tray-valve", name: "Valve trays", position: [0, 0, 0] },
  { id: "demister", part: "demister-pad", name: "Top demister", position: [0, 0, 0] },
  { id: "screen", part: "screen", name: "Distributor screen", position: [0, 0, 0] },
  { id: "manway-gasket", part: "gasket", name: "Manway gaskets", position: [0, 0, 0] },
  { id: "studbolts", part: "studbolt", name: "Studbolts", position: [0, 0, 0] }
];
export default function Column(props: EquipmentProps) {
  return <Placeholder label="column" xray={props.xray} onClick={props.onShellClick} size={[2, 1, 1]} />;
}
