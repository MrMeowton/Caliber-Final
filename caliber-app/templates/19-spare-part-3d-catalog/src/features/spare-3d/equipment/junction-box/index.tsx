// PLACEHOLDER — replace this whole file with the code generated from PROMPT.md (same name & exports).
import { Placeholder } from "../../core/Placeholder";
import type { EquipmentProps, SlotDef } from "../../contract";

export const SLOTS: SlotDef[] = [
  { id: "terminal-block", part: "terminal-block", name: "Terminal blocks", position: [0, 0, 0] },
  { id: "terminal", part: "terminal", name: "Cable lugs", position: [0, 0, 0] },
  { id: "gland", part: "gland", name: "Cable glands", position: [0, 0, 0] },
  { id: "cable", part: "cable", name: "Cables", position: [0, 0, 0] },
  { id: "screw", part: "screw", name: "Screws", position: [0, 0, 0] }
];
export default function JunctionBox(props: EquipmentProps) {
  return <Placeholder label="junction-box" xray={props.xray} onClick={props.onShellClick} size={[2, 1, 1]} />;
}
