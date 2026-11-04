// PLACEHOLDER — replace this whole file with the code generated from PROMPT.md (same name & exports).
import { Placeholder } from "../../core/Placeholder";
import type { EquipmentProps, SlotDef } from "../../contract";

export const SLOTS: SlotDef[] = [
  { id: "trim", part: "trim-set", name: "Trim set (cage/plug)", position: [0, 0, 0] },
  { id: "seat", part: "seat-ring", name: "Seat ring", position: [0, 0, 0] },
  { id: "packing", part: "packing-set", name: "Stem packing", position: [0, 0, 0] },
  { id: "diaphragm", part: "diaphragm", name: "Actuator diaphragm", position: [0, 0, 0] },
  { id: "spring", part: "spring", name: "Actuator spring", position: [0, 0, 0] },
  { id: "positioner", part: "positioner", name: "Positioner", position: [0, 0, 0] },
  { id: "gasket", part: "gasket", name: "Body gasket", position: [0, 0, 0] },
  { id: "studbolts", part: "studbolt", name: "Body studbolts", position: [0, 0, 0] }
];
export default function ControlValve(props: EquipmentProps) {
  return <Placeholder label="control-valve" xray={props.xray} onClick={props.onShellClick} size={[2, 1, 1]} />;
}
