import { GENERATED_WENGINES } from "./wengines.generated";

export interface WEngine {
  id: string;
  rarity: number;
  role: string;
  baseAtk: number;
  secId: string;
  secVal: number;
  icon: string;
}

export const WENGINES: WEngine[] = GENERATED_WENGINES.map((w) => ({
  ...w,
  icon: `/wengines/${w.id}.png`,
}));

const RARITY_LABEL: Record<number, string> = { 2: "B", 3: "A", 4: "S" };
export const rarityLabel = (r: number): string => RARITY_LABEL[r] ?? "?";
