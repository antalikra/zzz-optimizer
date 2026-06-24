import type { Stat } from "./stats";

/** A substat value in UI units (percent for % stats). */
export interface SubStat {
  stat: Stat;
  value: number;
}

/** A Drive Disc as entered/stored in the UI (values in UI units). */
export interface Disc {
  id: number;
  set: string;
  slot: number; // 1..6
  rarity: "S" | "A" | "B";
  level: number;
  mainStat: Stat;
  mainValue: number;
  subs: SubStat[];
}

export type NewDisc = Omit<Disc, "id">;
