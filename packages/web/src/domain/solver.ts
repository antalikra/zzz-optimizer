// Wire types for the solver JSON bridge. Hand-written for now; will be generated
// from Rust via ts-rs later. Stat values are in SOLVER UNITS (fractions for %).

export interface StatValue {
  stat: string;
  value: number;
}

export interface DiscDto {
  id: number;
  set: number;
  slot: number; // 1..6
  main: StatValue;
  subs: StatValue[];
}

export type ObjectiveDto =
  | { kind: "weighted"; weights: Record<string, number> }
  | { kind: "maxStat"; stat: string }
  | {
      kind: "ellenDamage";
      baseAtk: number;
      skillMv: number;
      enemy: { def: number; levelFactor: number; resMult: number };
    };

export interface SolveRequest {
  objective: ObjectiveDto;
  base?: Record<string, number>;
  discs: DiscDto[];
  constraints?: { stat: string; min: number }[];
  topN: number;
}

export interface SolveResponse {
  status: "ok" | "error";
  message?: string;
  builds: { discIds: number[]; score: number }[];
  count: number;
}
