// Inventory export/import. Our backup format is `zzz-optimizer` v1 (a tagged
// JSON envelope). Untrusted input is validated field-by-field, never eval'd.
// ZZZOD scanner import + Enka UID import are planned next (need the real ZZZOD
// spec / network); this module deliberately only handles our own format + the
// legacy bare-array shape.

import type { Disc, SubStat } from "../domain/inventory";
import { ALL_STATS, type Stat } from "../domain/stats";

export const EXPORT_FORMAT = "zzz-optimizer";
export const EXPORT_VERSION = 1;

export interface ExportFile {
  format: string;
  version: number;
  discs: Disc[];
}

export function exportInventory(discs: Disc[]): string {
  const file: ExportFile = { format: EXPORT_FORMAT, version: EXPORT_VERSION, discs };
  return JSON.stringify(file, null, 2);
}

const STAT_SET = new Set<string>(ALL_STATS);
const isStat = (s: unknown): s is Stat => typeof s === "string" && STAT_SET.has(s);

/* eslint-disable @typescript-eslint/no-explicit-any */
function validateDisc(d: any, idx: number): Disc {
  if (typeof d !== "object" || d === null) throw new Error(`disc ${idx}: not an object`);
  if (typeof d.slot !== "number" || d.slot < 1 || d.slot > 6) throw new Error(`disc ${idx}: bad slot`);
  if (!isStat(d.mainStat)) throw new Error(`disc ${idx}: bad mainStat "${d.mainStat}"`);

  const rawSubs: unknown = d.subs;
  const subsArr = Array.isArray(rawSubs) ? rawSubs : [];
  const subs: SubStat[] = subsArr.map((s: any, j: number) => {
    if (!isStat(s?.stat) || typeof s?.value !== "number") throw new Error(`disc ${idx} sub ${j}: bad`);
    return { stat: s.stat, value: s.value };
  });

  return {
    id: typeof d.id === "number" ? d.id : idx + 1,
    set: typeof d.set === "string" ? d.set : "Unknown",
    slot: d.slot,
    rarity: d.rarity === "A" || d.rarity === "B" ? d.rarity : "S",
    level: typeof d.level === "number" ? d.level : 15,
    mainStat: d.mainStat,
    mainValue: typeof d.mainValue === "number" ? d.mainValue : 0,
    subs,
  };
}

export function parseImport(json: string): Disc[] {
  let obj: any;
  try {
    obj = JSON.parse(json);
  } catch {
    throw new Error("not valid JSON");
  }
  if (obj && obj.format === EXPORT_FORMAT && Array.isArray(obj.discs)) {
    return obj.discs.map((d: any, i: number) => validateDisc(d, i));
  }
  if (Array.isArray(obj)) {
    // legacy bare-array export
    return obj.map((d: any, i: number) => validateDisc(d, i));
  }
  throw new Error("unrecognized import format");
}
/* eslint-enable @typescript-eslint/no-explicit-any */
