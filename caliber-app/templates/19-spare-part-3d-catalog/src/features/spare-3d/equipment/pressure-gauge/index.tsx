// PLACEHOLDER — replace this whole file with the code generated from PROMPT.md (same name & exports).
import { Placeholder } from "../../core/Placeholder";
import type { EquipmentProps, SlotDef } from "../../contract";

export const SLOTS: SlotDef[] = [
  { id: "gauge", part: "gauge", name: "Gauge", position: [0, 0, 0] },
  { id: "root-valve", part: "valve-needle", name: "Root needle valve", position: [0, 0, 0] },
  { id: "connector", part: "connector", name: "Connector", position: [0, 0, 0] }
];
export default function PressureGauge(props: EquipmentProps) {
  return <Placeholder label="pressure-gauge" xray={props.xray} onClick={props.onShellClick} size={[2, 1, 1]} />;
}
