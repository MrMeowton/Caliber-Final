// PLACEHOLDER — replace this whole file with the code generated from PROMPT.md (same name & exports).
import { Placeholder } from "../../core/Placeholder";
import type { EquipmentProps, SlotDef } from "../../contract";

export const SLOTS: SlotDef[] = [
  { id: "transmitter", part: "transmitter", name: "Transmitter", position: [0, 0, 0] },
  { id: "manifold-valve", part: "valve-needle", name: "Manifold needle valve", position: [0, 0, 0] },
  { id: "tubing", part: "tubing", name: "Impulse tubing", position: [0, 0, 0] },
  { id: "connector", part: "connector", name: "Tube connector", position: [0, 0, 0] },
  { id: "gland", part: "gland", name: "Cable gland", position: [0, 0, 0] }
];
export default function Transmitter(props: EquipmentProps) {
  return <Placeholder label="transmitter" xray={props.xray} onClick={props.onShellClick} size={[2, 1, 1]} />;
}
