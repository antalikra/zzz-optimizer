import { GENERATED_SETS } from "./sets.generated";

export interface DiscSet {
  id: string;
  name: string;
  icon: string;
}

export const DISC_SETS: DiscSet[] = GENERATED_SETS.map((s) => ({ ...s, icon: `/sets/${s.id}.png` }));

const ICON_BY_NAME = new Map(DISC_SETS.map((s) => [s.name, s.icon]));
export const setIcon = (name: string): string | undefined => ICON_BY_NAME.get(name);
