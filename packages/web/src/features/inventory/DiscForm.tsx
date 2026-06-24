import { useEffect, useState } from "react";
import { SLOT_MAIN, SUBSTATS, SETS, type Stat } from "../../domain/stats";
import type { SubStat } from "../../domain/inventory";
import { useInventory } from "../../store/inventory";

export function DiscForm() {
  const add = useInventory((s) => s.add);
  const [slot, setSlot] = useState(4);
  const [set, setSet] = useState(SETS[0]);
  const [rarity, setRarity] = useState<"S" | "A" | "B">("S");
  const [level, setLevel] = useState(15);
  const [mainStat, setMainStat] = useState<Stat>(SLOT_MAIN[4][0]);
  const [mainValue, setMainValue] = useState(0);
  const [subs, setSubs] = useState<SubStat[]>([{ stat: "CritRate", value: 0 }]);

  useEffect(() => {
    if (!SLOT_MAIN[slot].includes(mainStat)) setMainStat(SLOT_MAIN[slot][0]);
  }, [slot, mainStat]);

  const setSub = (i: number, patch: Partial<SubStat>) =>
    setSubs((arr) => arr.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const addSub = () => subs.length < 4 && setSubs((a) => [...a, { stat: "Atk", value: 0 }]);
  const removeSub = (i: number) => setSubs((a) => a.filter((_, j) => j !== i));

  function submit() {
    add({ set, slot, rarity, level, mainStat, mainValue, subs: subs.filter((s) => s.value > 0) });
    setMainValue(0);
    setSubs([{ stat: "CritRate", value: 0 }]);
  }

  return (
    <div style={{ border: "1px solid #ccc", padding: 12, marginBottom: 16 }}>
      <h3>Add disc</h3>
      <div className="row">
        <label>Slot{" "}
          <select value={slot} onChange={(e) => setSlot(Number(e.target.value))}>
            {[1, 2, 3, 4, 5, 6].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label>Set{" "}
          <select value={set} onChange={(e) => setSet(e.target.value)}>
            {SETS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label>Rarity{" "}
          <select value={rarity} onChange={(e) => setRarity(e.target.value as "S" | "A" | "B")}>
            {["S", "A", "B"].map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <label>Level{" "}
          <input type="number" min={0} max={15} value={level}
            onChange={(e) => setLevel(Number(e.target.value))} style={{ width: 56 }} />
        </label>
      </div>

      <div className="row" style={{ marginTop: 8 }}>
        <label>Main{" "}
          <select value={mainStat} onChange={(e) => setMainStat(e.target.value as Stat)}>
            {SLOT_MAIN[slot].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <input type="number" value={mainValue}
          onChange={(e) => setMainValue(Number(e.target.value))} style={{ width: 80 }} />
      </div>

      <div style={{ marginTop: 8 }}>
        <b>Substats</b>
        {subs.map((s, i) => (
          <div className="row" key={i} style={{ marginTop: 4 }}>
            <select value={s.stat} onChange={(e) => setSub(i, { stat: e.target.value as Stat })}>
              {SUBSTATS.map((st) => <option key={st} value={st}>{st}</option>)}
            </select>
            <input type="number" value={s.value}
              onChange={(e) => setSub(i, { value: Number(e.target.value) })} style={{ width: 80 }} />
            <button onClick={() => removeSub(i)}>✕</button>
          </div>
        ))}
        {subs.length < 4 && <button onClick={addSub} style={{ marginTop: 4 }}>+ substat</button>}
      </div>

      <button onClick={submit} style={{ marginTop: 12 }}>Add to inventory</button>
    </div>
  );
}
