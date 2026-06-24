// Stat metadata for the UI. Mirrors game-data/stat-tables; will be loaded from
// game-data later. UI stores percentages in PERCENT units (user types "24" for
// 24%); conversion to solver fractions happens via `toSolverValue`.

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

/** Common Drive Disc sets (display only; set bonuses not yet scored). */
export const SETS = [
  "Polar Metal", "Woodpecker Electro", "Hormone Punk", "Fanged Metal", "Puffer Electro",
  "Shockstar Disco", "Swing Jazz", "Chaos Jazz", "Inferno Metal", "Thunder Metal", "Freedom Blues",
];
