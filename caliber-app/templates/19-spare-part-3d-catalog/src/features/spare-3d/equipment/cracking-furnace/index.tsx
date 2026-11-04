// PLACEHOLDER — replace this whole file with the code generated from PROMPT.md (same name & exports).
import { Placeholder } from "../../core/Placeholder";
import type { EquipmentProps, SlotDef } from "../../contract";

export const SLOTS: SlotDef[] = [
  { id: "burner-tips", part: "burner-tip", name: "Floor burners", position: [0, 0, 0] },
  { id: "radiant-coil", part: "pipe", name: "Radiant coil", position: [0, 0, 0] },
  { id: "lining-castable", part: "castable", name: "Castable lining", position: [0, 0, 0] },
  { id: "lining-fiber", part: "ceramic-fiber", name: "Ceramic fiber layer", position: [0, 0, 0] },
  { id: "firebrick", part: "firebrick", name: "Firebrick floor", position: [0, 0, 0] },
  { id: "anchors", part: "anchor", name: "Refractory anchors", position: [0, 0, 0] },
  { id: "coil-outlet-tc", part: "thermocouple", name: "Coil outlet thermocouple", position: [0, 0, 0] },
  { id: "outlet-gasket", part: "gasket", name: "Outlet flange gasket", position: [0, 0, 0] },
  { id: "fuel-gas-valve", part: "valve-gate", name: "Fuel gas header gate valve", position: [0, 0, 0] }
];
export default function CrackingFurnace(props: EquipmentProps) {
  return <Placeholder label="cracking-furnace" xray={props.xray} onClick={props.onShellClick} size={[2, 1, 1]} />;
}
