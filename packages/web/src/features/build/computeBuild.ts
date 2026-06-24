// Compute a build's displayed stats in the UI (mirrors the Rust assembly for
// display only). Percentages are accumulated as fractions, flats raw.
import type { Disc } from "../../domain/inventory";
import { SET_2PC, isPercent, type Stat } from "../../domain/stats";
import { agentById } from "../../domain/agents";

export interface BuildStats {
  atk: number;
  critRate: number;
  critDmg: number;
  atkPct: number;
  iceDmg: number;
  pen: number;
}

export function computeBuildStats(agentId: string, wEngineAtk: number, discs: Disc[]): BuildStats {
  const agent = agentById(agentId);
  const acc: Partial<Record<Stat, number>> = {};
  const add = (s: Stat, v: number) => {
    acc[s] = (acc[s] ?? 0) + (isPercent(s) ? v / 100 : v);
  };

  add("CritRate", agent.baseCritRate);
  add("CritDmg", agent.baseCritDmg);
  for (const d of discs) {
    add(d.mainStat, d.mainValue);
    for (const s of d.subs) add(s.stat, s.value);
  }

  // 2-piece set bonuses (sets with >= 2 discs).
  const counts: Record<string, number> = {};
  for (const d of discs) counts[d.set] = (counts[d.set] ?? 0) + 1;
  for (const [name, c] of Object.entries(counts)) {
    if (c >= 2) {
      const b = SET_2PC[name];
      if (b) add(b.stat, b.value);
    }
  }

  const atkPct = acc.AtkPct ?? 0;
  const flatAtk = acc.Atk ?? 0;
  return {
    atk: (agent.baseAtk + wEngineAtk) * (1 + atkPct) + flatAtk,
    critRate: acc.CritRate ?? 0,
    critDmg: acc.CritDmg ?? 0,
    atkPct,
    iceDmg: acc.IceDmg ?? 0,
    pen: acc.Pen ?? 0,
  };
}
