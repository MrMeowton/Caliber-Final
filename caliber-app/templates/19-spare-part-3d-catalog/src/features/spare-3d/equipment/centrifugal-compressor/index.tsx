// PLACEHOLDER — replace this whole file with the code generated from PROMPT.md (same name & exports).
import { Placeholder } from "../../core/Placeholder";
import type { EquipmentProps, SlotDef } from "../../contract";

export const SLOTS: SlotDef[] = [
  { id: "bearing-de", part: "bearing-journal", name: "Journal bearing DE", position: [0, 0, 0] },
  { id: "bearing-nde", part: "bearing-journal", name: "Journal bearing NDE", position: [0, 0, 0] },
  { id: "thrust", part: "bearing-thrust-pad", name: "Thrust bearing", position: [0, 0, 0] },
  { id: "impellers", part: "impeller", name: "Impeller stages", position: [0, 0, 0] },
  { id: "lab-seal", part: "seal-labyrinth", name: "Labyrinth seals", position: [0, 0, 0] },
  { id: "dry-seal", part: "seal-mechanical", name: "Shaft end seal", position: [0, 0, 0] },
  { id: "coupling", part: "coupling", name: "Coupling to driver", position: [0, 0, 0] },
  { id: "lube-filter", part: "filter-element", name: "Lube oil filter", position: [0, 0, 0] },
  { id: "lube-oil", part: "oil", name: "Lube oil sump", position: [0, 0, 0] }
];
export default function CentrifugalCompressor(props: EquipmentProps) {
  return <Placeholder label="centrifugal-compressor" xray={props.xray} onClick={props.onShellClick} size={[2, 1, 1]} />;
}
