// PLACEHOLDER — replace this whole file with the code generated from PROMPT.md (same name & exports).
import { Placeholder } from "../../core/Placeholder";
import type { EquipmentProps, SlotDef } from "../../contract";

export const SLOTS: SlotDef[] = [
  { id: "thermowell", part: "thermowell", name: "Thermowell", position: [0, 0, 0] },
  { id: "thermocouple", part: "thermocouple", name: "Thermocouple", position: [0, 0, 0] },
  { id: "connector", part: "connector", name: "Connector", position: [0, 0, 0] },
  { id: "gland", part: "gland", name: "Cable gland", position: [0, 0, 0] }
];
export default function TemperatureElement(props: EquipmentProps) {
  return <Placeholder label="temperature-element" xray={props.xray} onClick={props.onShellClick} size={[2, 1, 1]} />;
}
