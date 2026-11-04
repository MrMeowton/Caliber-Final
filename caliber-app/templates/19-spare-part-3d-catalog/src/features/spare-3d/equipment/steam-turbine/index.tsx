// PLACEHOLDER — replace this whole file with the code generated from PROMPT.md (same name & exports).
import { Placeholder } from "../../core/Placeholder";
import type { EquipmentProps, SlotDef } from "../../contract";

export const SLOTS: SlotDef[] = [
  { id: "rotor-blades", part: "blade", name: "Rotor blade rows", position: [0, 0, 0] },
  { id: "journal-de", part: "bearing-journal", name: "Journal bearing", position: [0, 0, 0] },
  { id: "thrust", part: "bearing-thrust-pad", name: "Thrust bearing", position: [0, 0, 0] },
  { id: "gov-valve", part: "valve-governor", name: "Governor valve", position: [0, 0, 0] },
  { id: "gland-seal", part: "seal-labyrinth", name: "Gland labyrinth seals", position: [0, 0, 0] },
  { id: "trip-spring", part: "spring", name: "Trip valve spring", position: [0, 0, 0] },
  { id: "solenoid", part: "solenoid-valve", name: "Trip solenoid", position: [0, 0, 0] },
  { id: "speed-tx", part: "transmitter", name: "Speed/pressure transmitter", position: [0, 0, 0] },
  { id: "casing-gasket", part: "gasket", name: "Casing joint gasket", position: [0, 0, 0] }
];
export default function SteamTurbine(props: EquipmentProps) {
  return <Placeholder label="steam-turbine" xray={props.xray} onClick={props.onShellClick} size={[2, 1, 1]} />;
}
