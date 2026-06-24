// Agent catalog. Base stats + icons come from Enka data (agents.generated.ts,
// avatars in public/agents/{id}.png). Display names + the damage formula are
// overlaid here. Only agents with `damageFormula` are build-optimized (the
// team's Attack core); others are supports whose passive conditions feed the core.
import { GENERATED_AGENTS } from "./agents.generated";

export interface Rotation {
  id: string;
  name: string;
  totalMv: number; // combined motion value of the rotation
  durationSec: number; // for DPS = damage / duration
}

export interface Agent {
  id: string;
  name: string;
  element: string;
  role: string; // Attack / Stun / Anomaly / Support / Defense / Rupture
  baseAtk: number;
  baseCritRate: number;
  baseCritDmg: number;
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
const normElement = (e: string): string => ELEMENT_NORMALIZE[e] ?? e;

export const AGENTS: Agent[] = GENERATED_AGENTS.filter((g) => NAME_BY_ID[g.id]).map((g) => ({
  id: g.id,
  name: NAME_BY_ID[g.id],
  element: normElement(g.element),
  role: g.role,
  baseAtk: g.baseAtk,
  baseCritRate: g.baseCritRate,
  baseCritDmg: g.baseCritDmg,
  damageFormula: g.id === "1191" ? "ellen" : undefined,
  rotations: g.id === "1191" ? ELLEN_ROTATIONS : [],
}));

export const agentById = (id: string): Agent => AGENTS.find((a) => a.id === id) ?? AGENTS[0];

/** Base ATK scaled by level (DRAFT linear model; `baseAtk` is the level-60 value). */
export const effectiveBaseAtk = (agent: Agent, level: number): number =>
  Math.round(agent.baseAtk * (0.3 + (0.7 * level) / 60));

/** Per-element accent for badges / placeholders. */
export const ELEMENT_COLOR: Record<string, string> = {
  Ice: "#5cd9ff",
  Fire: "#ff8a3c",
  Electric: "#a574ff",
  Physical: "#ffd23c",
  Ether: "#ff5ea0",
  Frost: "#9fe8ff",
  "Auric Ink": "#c9a0ff",
  Wind: "#7cffb0",
};
