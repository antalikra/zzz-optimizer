// Random test-disc generator (dev helper). Produces valid discs (legal main per
// slot, plausible substats) so the optimizer/build page can be tried without
// hand-entering an inventory. Values are in UI units (percent for % stats).
import { SLOT_MAIN, SUBSTATS, SETS, isPercent, type Stat } from "./stats";
import type { NewDisc, SubStat } from "./inventory";

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);
const round1 = (n: number) => Math.round(n * 10) / 10;

function rollValue(stat: Stat, isMain: boolean): number {
  if (isPercent(stat)) return round1(isMain ? rand(10, 30) : rand(2, 12));
  return Math.round(isMain ? rand(150, 330) : rand(10, 40));
}

export function generateTestDiscs(perSlot = 3): NewDisc[] {
  const out: NewDisc[] = [];
  for (let slot = 1; slot <= 6; slot++) {
    for (let k = 0; k < perSlot; k++) {
      const mainStat = pick(SLOT_MAIN[slot]);
      const pool = [...SUBSTATS].filter((s) => s !== mainStat);
      const subCount = 3 + Math.floor(Math.random() * 2); // 3–4
      const subs: SubStat[] = [];
      for (let s = 0; s < subCount && pool.length > 0; s++) {
        const stat = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
        subs.push({ stat, value: rollValue(stat, false) });
      }
      out.push({
        set: pick(SETS),
        slot,
        rarity: "S",
        level: 15,
        mainStat,
        mainValue: rollValue(mainStat, true),
        subs,
      });
    }
  }
  return out;
}
