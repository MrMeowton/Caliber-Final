// PLACEHOLDER — replace this whole file with the code generated from PROMPT.md (same name & exports).
import { Placeholder } from "../../core/Placeholder";
import type { EquipmentProps, SlotDef } from "../../contract";

export const SLOTS: SlotDef[] = [
  { id: "pipe", part: "pipe", name: "Pipe spool", position: [0, 0, 0] },
  { id: "elbow", part: "elbow", name: "Elbows", position: [0, 0, 0] },
  { id: "tee", part: "tee", name: "Tee", position: [0, 0, 0] },
  { id: "flange", part: "flange", name: "Flanges", position: [0, 0, 0] },
  { id: "gasket", part: "gasket", name: "Gaskets", position: [0, 0, 0] },
  { id: "studbolts", part: "studbolt", name: "Studbolts", position: [0, 0, 0] },
  { id: "block-valve", part: "valve-gate", name: "Block gate valve", position: [0, 0, 0] },
  { id: "antirust", part: "antirust", name: "Antirust coating", position: [0, 0, 0] },
  { id: "tape", part: "tape", name: "Wrapping tape", position: [0, 0, 0] }
];
export default function PipingLine(props: EquipmentProps) {
  return <Placeholder label="piping-line" xray={props.xray} onClick={props.onShellClick} size={[2, 1, 1]} />;
}
