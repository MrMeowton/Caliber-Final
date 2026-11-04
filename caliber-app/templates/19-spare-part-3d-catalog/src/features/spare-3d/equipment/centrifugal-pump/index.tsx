// PLACEHOLDER — replace this whole file with the code generated from PROMPT.md (same name & exports).
import { Placeholder } from "../../core/Placeholder";
import type { EquipmentProps, SlotDef } from "../../contract";

export const SLOTS: SlotDef[] = [
  { id: "impeller", part: "impeller", name: "Impeller", position: [0, 0, 0] },
  { id: "wear-ring", part: "ring", name: "Wear rings", position: [0, 0, 0] },
  { id: "shaft-sleeve", part: "sleeve", name: "Shaft sleeve", position: [0, 0, 0] },
  { id: "mech-seal", part: "seal-mechanical", name: "Mechanical seal", position: [0, 0, 0] },
  { id: "bearing-de", part: "bearing-ball", name: "Ball bearing", position: [0, 0, 0] },
  { id: "bearing-roller", part: "bearing-roller", name: "Roller bearing", position: [0, 0, 0] },
  { id: "coupling", part: "coupling", name: "Coupling", position: [0, 0, 0] },
  { id: "motor-fan", part: "fan", name: "Motor cooling fan", position: [0, 0, 0] },
  { id: "casing-gasket", part: "gasket", name: "Casing gasket", position: [0, 0, 0] }
];
export default function CentrifugalPump(props: EquipmentProps) {
  return <Placeholder label="centrifugal-pump" xray={props.xray} onClick={props.onShellClick} size={[2, 1, 1]} />;
}
