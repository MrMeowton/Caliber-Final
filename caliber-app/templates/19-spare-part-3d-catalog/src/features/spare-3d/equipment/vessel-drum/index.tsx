// PLACEHOLDER — replace this whole file with the code generated from PROMPT.md (same name & exports).
import { Placeholder } from "../../core/Placeholder";
import type { EquipmentProps, SlotDef } from "../../contract";

export const SLOTS: SlotDef[] = [
  { id: "demister", part: "demister-pad", name: "Demister pad", position: [0, 0, 0] },
  { id: "inlet-screen", part: "screen", name: "Inlet screen", position: [0, 0, 0] },
  { id: "manway-gasket", part: "gasket", name: "Manway gasket", position: [0, 0, 0] },
  { id: "studbolts", part: "studbolt", name: "Manway studbolts", position: [0, 0, 0] },
  { id: "drain-valve", part: "valve-gate", name: "Drain gate valve", position: [0, 0, 0] }
];
export default function VesselDrum(props: EquipmentProps) {
  return <Placeholder label="vessel-drum" xray={props.xray} onClick={props.onShellClick} size={[2, 1, 1]} />;
}
