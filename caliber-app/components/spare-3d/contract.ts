// Shared contract for every 3D part / equipment / plant component (MIND Spares).
// Generated models must import their types from here and must not change this file.
export type Vec3 = [number, number, number];
export type Detail = "low" | "high";

/** Spare-part model: normalised (largest side = 1 unit), centred at origin, main axis +X. */
export type PartProps = { color?: string; highlight?: boolean; detail?: Detail };
export type PartMeta = { id: string; name: string; size: Vec3 };

/** One place inside an equipment where a spare part sits. `part` = folder name in parts/. */
export type SlotDef = { id: string; part: string; name: string; position: Vec3; rotation?: Vec3; scale?: number };

/** fault value shown in the label, e.g. "Stock 0 / need 2" or "Vibration 7.8 mm/s". */
export type Faults = Record<string, { value: string; severity?: "warning" | "critical" }>;

export type EquipmentProps = {
  xray?: boolean;            // casing turns transparent
  explode?: number;          // 0 = assembled … 1 = fully exploded
  faults?: Faults;           // keyed by SlotDef.id
  onShellClick?: () => void; // click casing → open x-ray
  onPartClick?: (slotId: string) => void;
  detail?: Detail;           // "low" in plant layout, "high" when isolated
};

/** One equipment instance in data/plant-layout.json */
export type PlantItem = {
  tag: string; equipment: string; description: string; criticality: string | null;
  notifications: number; bomMaterials: number; position: Vec3; partFamilies: Record<string, number>;
};
