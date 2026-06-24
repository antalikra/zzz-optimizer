// Agent catalog. Base stats, accent colors and icons all come from Enka data
// (agents.generated.ts, avatars in public/agents/{id}.png) — nothing colour-wise
// is hardcoded. Display names + the damage formula are overlaid here. Only agents
// with `damageFormula` are build-optimized (the team's Attack core).
import { GENERATED_AGENTS } from "./agents.generated";

export interface Rotation {
  id: string;
  name: string;
  totalMv: number;
  durationSec: number;
}

export interface Agent {
  id: string;
  name: string;
  element: string;
  role: string;
  accent: string; // per-agent accent from Enka data
  baseHp: number;
  baseAtk: number;
  baseDef: number;
  baseCritRate: number;
  baseCritDmg: number;
  impact: number;
  anomalyMastery: number;
  anomalyProficiency: number;
  damageFormula?: "ellen";
  rotations: Rotation[];
}

const ELLEN_ROTATIONS: Rotation[] = [
  { id: "basic", name: "Basic combo", totalMv: 6.0, durationSec: 3.2 },
  { id: "ex", name: "EX special string", totalMv: 9.5, durationSec: 4.4 },
  { id: "burst", name: "Full burst (EX + Ult)", totalMv: 16.5, durationSec: 7.0 },
];

// Correct display names for released agents (Enka stores internal codenames).
// Agents not listed here are filtered out of the catalog (betas / codenames).
const NAME_BY_ID: Record<string, string> = {
  "1011": "Anby Demara", "1061": "Corin Wickes", "1071": "Caesar King", "1081": "Billy Kid",
  "1111": "Anton Ivanov", "1121": "Ben Bigger", "1131": "Soukaku", "1141": "Von Lycaon",
  "1151": "Lucy", "1161": "Lighter", "1171": "Burnice", "1191": "Ellen Joe",
  "1201": "Harumasa", "1211": "Rina", "1221": "Yanagi", "1241": "Zhu Yuan",
  "1251": "Qingyi", "1261": "Jane Doe", "1271": "Seth", "1291": "Hugo",
  "1311": "Astra Yao", "1321": "Evelyn", "1331": "Vivian", "1351": "Pulchra",
  "1361": "Trigger", "1371": "Yixuan", "1391": "Ju Fufu", "1401": "Alice",
  "1411": "Yuzuha", "1421": "Pan Yinhu",
};

const ELEMENT_NORMALIZE: Record<string, string> = {
  Elec: "Electric",
  Physics: "Physical",
  AuricEther: "Auric Ink",
  FireFrost: "Frost",
};
export const normElement = (e: string): string => ELEMENT_NORMALIZE[e] ?? e;

export const AGENTS: Agent[] = GENERATED_AGENTS.filter((g) => NAME_BY_ID[g.id]).map((g) => ({
  ...g,
  name: NAME_BY_ID[g.id],
  element: normElement(g.element),
  damageFormula: g.id === "1191" ? "ellen" : undefined,
  rotations: g.id === "1191" ? ELLEN_ROTATIONS : [],
}));

export const agentById = (id: string): Agent => AGENTS.find((a) => a.id === id) ?? AGENTS[0];

/** Scale a level-60 base stat to the given level (DRAFT linear model). */
export const scaleByLevel = (value: number, level: number): number =>
  Math.round(value * (0.3 + (0.7 * level) / 60));

export const effectiveBaseAtk = (agent: Agent, level: number): number =>
  scaleByLevel(agent.baseAtk, level);
