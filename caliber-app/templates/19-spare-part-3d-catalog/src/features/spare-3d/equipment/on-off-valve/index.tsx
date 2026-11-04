// PLACEHOLDER — replace this whole file with the code generated from PROMPT.md (same name & exports).
import { Placeholder } from "../../core/Placeholder";
import type { EquipmentProps, SlotDef } from "../../contract";

export const SLOTS: SlotDef[] = [
  { id: "solenoid", part: "solenoid-valve", name: "Solenoid valve", position: [0, 0, 0] },
  { id: "limit-switch", part: "switch", name: "Limit switch box", position: [0, 0, 0] },
  { id: "o-rings", part: "o-ring", name: "Actuator O-rings", position: [0, 0, 0] },
  { id: "packing", part: "packing-set", name: "Stem packing", position: [0, 0, 0] },
  { id: "gasket", part: "gasket", name: "Body gasket", position: [0, 0, 0] }
];
export default function OnOffValve(props: EquipmentProps) {
  return <Placeholder label="on-off-valve" xray={props.xray} onClick={props.onShellClick} size={[2, 1, 1]} />;
}
