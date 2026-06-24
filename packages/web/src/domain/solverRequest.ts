// Shared helpers to turn UI inventory into solver-request pieces (used by the
// build page and the optimizer panel).
import type { Disc } from "./inventory";
import type { DiscDto } from "./solver";
import { SET_2PC, SETS, setIndex, toSolverValue } from "./stats";

export function discToDto(d: Disc): DiscDto {
  return {
    id: d.id,
    set: setIndex(d.set),
    slot: d.slot,
    main: { stat: d.mainStat, value: toSolverValue(d.mainStat, d.mainValue) },
    subs: d.subs.map((s) => ({ stat: s.stat, value: toSolverValue(s.stat, s.value) })),
  };
}

/** 2-piece bonus table for the solver, keyed by set id (string), in solver units. */
export function buildSetBonuses(): Record<string, { stat: string; value: number }> {
  const out: Record<string, { stat: string; value: number }> = {};
  SETS.forEach((name, idx) => {
    const b = SET_2PC[name];
    if (b) out[String(idx)] = { stat: b.stat, value: toSolverValue(b.stat, b.value) };
  });
  return out;
}

export const slotsCovered = (discs: Disc[]): boolean =>
  [1, 2, 3, 4, 5, 6].every((s) => discs.some((d) => d.slot === s));
