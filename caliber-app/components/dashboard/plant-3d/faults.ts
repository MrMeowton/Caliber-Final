// Maps inventory risk on BOM materials to the 3D slots of each equipment model.
// equipment tag → BOM parts → part id (SAP description family) → SlotDef.part → faults[slot.id]
import type { Faults, SlotDef } from "@/components/spare-3d/contract";

export type PlantPart = {
  functionalLoc: string;
  materialNo: string;
  description: string;
  stock: number;
  minQty: number;
  maxQty: number;
  reorderPoint: number;
  unit: string;
  criticality: string;
};

export type PlantAsset = {
  id: string;
  name: string;
  criticality: string;
  status: "critical" | "watch" | "ready";
  atRiskParts: number;
  zeroStockParts: number;
  upcomingPlans: number;
  nextDueDate: string | null;
  nextMaintenance: string | null;
  parts: PlantPart[];
};

export type Severity = "critical" | "warning";

export type SlotFault = {
  slot: SlotDef;
  severity: Severity;
  parts: Array<PlantPart & { severity: Severity }>;
};

const VARIANTS = new Set(["BEARING", "SEAL", "VALVE"]);
const kebab = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Same rule as the catalog generator: first description token, + type for BEARING/SEAL/VALVE. */
export function partIdFromDescription(description: string): string {
  const [family = "", type = ""] = description.split(",").map((token) => token.trim().toUpperCase());
  return VARIANTS.has(family) ? kebab(`${family} ${type}`) : kebab(family);
}

export function partSeverity(part: PlantPart): Severity | null {
  if (part.stock <= 0 && ["S", "A"].includes(part.criticality)) return "critical";
  if (part.stock <= part.reorderPoint) return "warning";
  return null;
}

const fmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

export function slotFaults(asset: PlantAsset | undefined, slots: SlotDef[]): SlotFault[] {
  if (!asset) return [];
  const risky = asset.parts
    .map((part) => ({ ...part, severity: partSeverity(part) }))
    .filter((part): part is PlantPart & { severity: Severity } => part.severity !== null);

  return slots
    .map((slot) => {
      const parts = risky.filter((part) => partIdFromDescription(part.description) === slot.part);
      const severity: Severity = parts.some((part) => part.severity === "critical") ? "critical" : "warning";
      return { slot, severity, parts };
    })
    .filter((fault) => fault.parts.length > 0)
    .sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "critical" ? -1 : 1));
}

/** Props for the equipment model: worst part per slot, e.g. "Stock 0 EA / ROP 4 EA". */
export function toModelFaults(faults: SlotFault[]): Faults {
  return Object.fromEntries(
    faults.map(({ slot, severity, parts }) => {
      const worst = [...parts].sort((a, b) => a.stock - a.reorderPoint - (b.stock - b.reorderPoint))[0];
      return [
        slot.id,
        { severity, value: `Stock ${fmt.format(worst.stock)} ${worst.unit} / ROP ${fmt.format(worst.reorderPoint)} ${worst.unit}` },
      ];
    })
  );
}

/** Risky parts on the asset that have no matching slot in the 3D model. */
export function unmappedRiskCount(asset: PlantAsset | undefined, faults: SlotFault[]): number {
  if (!asset) return 0;
  const mapped = new Set(faults.flatMap((fault) => fault.parts.map((part) => `${part.functionalLoc}:${part.materialNo}`)));
  return asset.parts.filter((part) => partSeverity(part) && !mapped.has(`${part.functionalLoc}:${part.materialNo}`)).length;
}
