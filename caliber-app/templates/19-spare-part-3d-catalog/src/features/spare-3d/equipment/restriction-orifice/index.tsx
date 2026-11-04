// PLACEHOLDER — replace this whole file with the code generated from PROMPT.md (same name & exports).
import { Placeholder } from "../../core/Placeholder";
import type { EquipmentProps, SlotDef } from "../../contract";

export const SLOTS: SlotDef[] = [
  { id: "gasket", part: "gasket", name: "Orifice gaskets", position: [0, 0, 0] },
  { id: "flange", part: "flange", name: "Orifice flanges", position: [0, 0, 0] },
  { id: "studbolts", part: "studbolt", name: "Studbolts", position: [0, 0, 0] }
];
export default function RestrictionOrifice(props: EquipmentProps) {
  return <Placeholder label="restriction-orifice" xray={props.xray} onClick={props.onShellClick} size={[2, 1, 1]} />;
}
