// Stat metadata for the UI. Mirrors game-data/stat-tables; will be loaded from
// game-data later. UI stores percentages in PERCENT units (user types "24" for
// 24%); conversion to solver fractions happens via `toSolverValue`.
import { DISC_SETS } from "./sets";

export const ALL_STATS = [
  "Hp", "HpPct", "Atk", "AtkPct", "Def", "DefPct", "CritRate", "CritDmg", "Pen", "PenRatio",
  "AnomalyProficiency", "AnomalyMastery", "Impact", "EnergyRegen", "SheerForce",
  "PhysicalDmg", "FireDmg", "IceDmg", "ElectricDmg", "EtherDmg",
] as const;
export type Stat = (typeof ALL_STATS)[number];

const PERCENT = new Set<Stat>([
  "HpPct", "AtkPct", "DefPct", "CritRate", "CritDmg", "PenRatio", "AnomalyMastery", "EnergyRegen",
  "PhysicalDmg", "FireDmg", "IceDmg", "ElectricDmg", "EtherDmg",
]);
export const isPercent = (s: Stat): boolean => PERCENT.has(s);

export const SLOT_MAIN: Record<number, Stat[]> = {
  1: ["Hp"],
  2: ["Atk"],
  3: ["Def"],
  4: ["CritRate", "CritDmg", "AtkPct", "HpPct", "DefPct", "AnomalyProficiency"],
  5: ["AtkPct", "HpPct", "DefPct", "PenRatio", "PhysicalDmg", "FireDmg", "IceDmg", "ElectricDmg", "EtherDmg"],
  6: ["AtkPct", "HpPct", "DefPct", "AnomalyMastery", "Impact", "EnergyRegen"],
};

export const SUBSTATS: Stat[] = [
  "Hp", "HpPct", "Atk", "AtkPct", "Def", "DefPct", "CritRate", "CritDmg", "AnomalyProficiency", "Pen",
];

/** UI value (percent for % stats) -> solver units (fraction for %). */
export const toSolverValue = (s: Stat, v: number): number => (isPercent(s) ? v / 100 : v);

/** Drive Disc set names (from the real set catalog). */
export const SETS: string[] = DISC_SETS.map((s) => s.name);

/** Approximate 2-piece set bonuses (DRAFT values; mirrors game-data, verify later). */
export const SET_2PC: Record<string, { stat: Stat; value: number }> = {
  "Polar Metal": { stat: "IceDmg", value: 10 },
  "Woodpecker Electro": { stat: "CritRate", value: 8 },
  "Hormone Punk": { stat: "AtkPct", value: 10 },
  "Fanged Metal": { stat: "PhysicalDmg", value: 10 },
  "Puffer Electro": { stat: "PenRatio", value: 8 },
  "Shockstar Disco": { stat: "Impact", value: 6 },
  "Swing Jazz": { stat: "EnergyRegen", value: 20 },
  "Chaos Jazz": { stat: "AnomalyProficiency", value: 30 },
  "Inferno Metal": { stat: "FireDmg", value: 10 },
  "Thunder Metal": { stat: "ElectricDmg", value: 10 },
  "Freedom Blues": { stat: "AnomalyProficiency", value: 30 },
};

/** Stable numeric id for a set name (index in SETS), for the solver request. */
export const setIndex = (name: string): number => {
  const i = SETS.indexOf(name);
  return i < 0 ? 0 : i;
};
