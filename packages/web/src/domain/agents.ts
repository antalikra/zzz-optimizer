// Agent catalog. DRAFT base stats (from game-data v0-draft; verify later).
// `damageFormula` selects a formula-library entry in the Rust core; agents
// without one only support stat-based objectives.

export interface Agent {
  id: string;
  name: string;
  element: string;
  baseAtk: number; // agent base ATK (excludes W-Engine)
  baseCritRate: number; // percent
  baseCritDmg: number; // percent
  damageFormula?: "ellen";
}

export const AGENTS: Agent[] = [
  {
    id: "ellen",
    name: "Ellen Joe",
    element: "Ice",
    baseAtk: 938,
    baseCritRate: 5,
    baseCritDmg: 50,
    damageFormula: "ellen",
  },
  {
    id: "stats",
    name: "Generic (stats only)",
    element: "—",
    baseAtk: 0,
    baseCritRate: 5,
    baseCritDmg: 50,
  },
];

export const agentById = (id: string): Agent => AGENTS.find((a) => a.id === id) ?? AGENTS[0];
