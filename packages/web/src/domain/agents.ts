// Agent catalog. DRAFT base stats (from game-data v0-draft; verify later).
// `damageFormula` selects a formula-library entry in the Rust core; agents
// without one only support stat-based objectives.

export interface Rotation {
  id: string;
  name: string;
  /** Combined motion value of the rotation (sum of per-hit MVs). */
  totalMv: number;
  /** Rotation length in seconds (for DPS = damage / duration). */
  durationSec: number;
}

export interface Agent {
  id: string;
  name: string;
  element: string;
  baseAtk: number; // agent base ATK (excludes W-Engine)
  baseCritRate: number; // percent
  baseCritDmg: number; // percent
  damageFormula?: "ellen";
  rotations: Rotation[];
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
    rotations: [
      { id: "basic", name: "Basic combo", totalMv: 6.0, durationSec: 3.2 },
      { id: "ex", name: "EX special string", totalMv: 9.5, durationSec: 4.4 },
      { id: "burst", name: "Full burst (EX + Ult)", totalMv: 16.5, durationSec: 7.0 },
    ],
  },
  {
    id: "stats",
    name: "Generic (stats only)",
    element: "—",
    baseAtk: 0,
    baseCritRate: 5,
    baseCritDmg: 50,
    rotations: [],
  },
];

export const agentById = (id: string): Agent => AGENTS.find((a) => a.id === id) ?? AGENTS[0];

/** Per-element accent for avatar placeholders / badges. */
export const ELEMENT_COLOR: Record<string, string> = {
  Ice: "#5cd9ff",
  Fire: "#ff8a3c",
  Electric: "#a574ff",
  Physical: "#ffd23c",
  Ether: "#ff5ea0",
  "—": "#8a8a8a",
};
