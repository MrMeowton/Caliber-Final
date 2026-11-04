// PLACEHOLDER — replace this whole file with the code generated from PROMPT.md (same name & exports).
import { Placeholder } from "../../core/Placeholder";
import type { EquipmentProps, SlotDef } from "../../contract";

export const SLOTS: SlotDef[] = [
  { id: "limit-switch", part: "switch", name: "Limit/torque switch", position: [0, 0, 0] },
  { id: "packing", part: "packing-set", name: "Stem packing", position: [0, 0, 0] },
  { id: "grease", part: "grease", name: "Gearbox grease", position: [0, 0, 0] },
  { id: "gasket", part: "gasket", name: "Bonnet gasket", position: [0, 0, 0] }
];
export default function MotorOperatedValve(props: EquipmentProps) {
  return <Placeholder label="motor-operated-valve" xray={props.xray} onClick={props.onShellClick} size={[2, 1, 1]} />;
}
