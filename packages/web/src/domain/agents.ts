// Agent catalog. Avatars are real (downloaded to public/agents/{id}.png).
// Base stats are DRAFT except Ellen; only agents with `damageFormula` are
// build-optimized (the team's core/DPS). Others are supports/stunners whose
// passive conditions feed the core (condition toggles — coming).

export interface Rotation {
  id: string;
  name: string;
  /** Combined motion value of the rotation (sum of per-hit MVs). */
  totalMv: number;
  /** Rotation length in seconds (DPS = damage / duration). */
  durationSec: number;
}

export type Role = "Attack" | "Stun" | "Anomaly" | "Support" | "Defense";

export interface Agent {
  id: string;
  name: string;
  element: string;
  role: Role;
  baseAtk: number; // agent base ATK at the reference level (excludes W-Engine)
  baseCritRate: number; // percent
  baseCritDmg: number; // percent
  damageFormula?: "ellen";
  rotations: Rotation[];
}

export const AGENTS: Agent[] = [
  {
    id: "ellen", name: "Ellen Joe", element: "Ice", role: "Attack",
    baseAtk: 938, baseCritRate: 5, baseCritDmg: 50, damageFormula: "ellen",
    rotations: [
      { id: "basic", name: "Basic combo", totalMv: 6.0, durationSec: 3.2 },
      { id: "ex", name: "EX special string", totalMv: 9.5, durationSec: 4.4 },
      { id: "burst", name: "Full burst (EX + Ult)", totalMv: 16.5, durationSec: 7.0 },
    ],
  },
  { id: "zhuyuan", name: "Zhu Yuan", element: "Ether", role: "Attack", baseAtk: 900, baseCritRate: 5, baseCritDmg: 50, rotations: [] },
  { id: "qingyi", name: "Qingyi", element: "Electric", role: "Stun", baseAtk: 740, baseCritRate: 5, baseCritDmg: 50, rotations: [] },
  { id: "lycaon", name: "Von Lycaon", element: "Ice", role: "Stun", baseAtk: 760, baseCritRate: 5, baseCritDmg: 50, rotations: [] },
  { id: "anby", name: "Anby Demara", element: "Electric", role: "Stun", baseAtk: 720, baseCritRate: 5, baseCritDmg: 50, rotations: [] },
  { id: "yanagi", name: "Yanagi", element: "Electric", role: "Anomaly", baseAtk: 870, baseCritRate: 5, baseCritDmg: 50, rotations: [] },
  { id: "burnice", name: "Burnice", element: "Fire", role: "Anomaly", baseAtk: 840, baseCritRate: 5, baseCritDmg: 50, rotations: [] },
  { id: "caesar", name: "Caesar", element: "Physical", role: "Defense", baseAtk: 820, baseCritRate: 5, baseCritDmg: 50, rotations: [] },
];

export const agentById = (id: string): Agent => AGENTS.find((a) => a.id === id) ?? AGENTS[0];

/** Per-element accent for badges / placeholders. */
export const ELEMENT_COLOR: Record<string, string> = {
  Ice: "#5cd9ff",
  Fire: "#ff8a3c",
  Electric: "#a574ff",
  Physical: "#ffd23c",
  Ether: "#ff5ea0",
  "—": "#8a8a8a",
};
