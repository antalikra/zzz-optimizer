import { describe, it, expect } from "vitest";
import { exportInventory, parseImport } from "./serialize";
import type { Disc } from "../domain/inventory";

const sample: Disc[] = [
  {
    id: 1,
    set: "Polar Metal",
    slot: 4,
    rarity: "S",
    level: 15,
    mainStat: "CritRate",
    mainValue: 24,
    subs: [{ stat: "CritDmg", value: 4.8 }],
  },
];

describe("serialize", () => {
  it("round-trips our export format", () => {
    const back = parseImport(exportInventory(sample));
    expect(back).toEqual(sample);
  });

  it("accepts a legacy bare array", () => {
    const back = parseImport(JSON.stringify(sample));
    expect(back).toHaveLength(1);
    expect(back[0].mainStat).toBe("CritRate");
  });

  it("rejects non-JSON", () => {
    expect(() => parseImport("nope")).toThrow();
  });

  it("rejects a disc with a bad slot", () => {
    expect(() => parseImport(JSON.stringify([{ slot: 9, mainStat: "Atk" }]))).toThrow();
  });

  it("rejects a disc with an unknown main stat", () => {
    expect(() => parseImport(JSON.stringify([{ slot: 4, mainStat: "Bogus" }]))).toThrow();
  });
});
