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
    <div className="card">
      <h3 className="card__title">Add disc</h3>

      <div className="row">
        <label className="field">
          <span className="field__label">Slot</span>
          <select className="select w-xs" value={slot} onChange={(e) => setSlot(Number(e.target.value))}>
            {[1, 2, 3, 4, 5, 6].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="field">
          <span className="field__label">Set</span>
          <select className="select w-md" value={set} onChange={(e) => setSet(e.target.value)}>
            {SETS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="field">
          <span className="field__label">Rarity</span>
          <select className="select w-xs" value={rarity} onChange={(e) => setRarity(e.target.value as "S" | "A" | "B")}>
            {["S", "A", "B"].map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <label className="field">
          <span className="field__label">Level</span>
          <input className="input w-xs" type="number" min={0} max={15} value={level}
            onChange={(e) => setLevel(Number(e.target.value))} />
        </label>
      </div>

      <div className="row" style={{ marginTop: 14 }}>
        <label className="field">
          <span className="field__label">Main stat</span>
          <select className="select w-md" value={mainStat} onChange={(e) => setMainStat(e.target.value as Stat)}>
            {SLOT_MAIN[slot].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="field">
          <span className="field__label">Value</span>
          <input className="input w-sm" type="number" value={mainValue}
            onChange={(e) => setMainValue(Number(e.target.value))} />
        </label>
      </div>

      <div style={{ marginTop: 16 }}>
        <span className="field__label">Substats</span>
        <div className="stack" style={{ gap: 8, marginTop: 6 }}>
          {subs.map((s, i) => (
            <div className="row" key={i} style={{ gap: 8 }}>
              <select className="select w-md" value={s.stat} onChange={(e) => setSub(i, { stat: e.target.value as Stat })}>
                {SUBSTATS.map((st) => <option key={st} value={st}>{st}</option>)}
              </select>
              <input className="input w-sm" type="number" value={s.value}
                onChange={(e) => setSub(i, { value: Number(e.target.value) })} />
              <button className="btn btn--icon btn--ghost" title="Remove" onClick={() => removeSub(i)}>✕</button>
            </div>
          ))}
          {subs.length < 4 && (
            <div>
              <button className="btn btn--ghost btn--sm" onClick={addSub}>+ substat</button>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <button className="btn btn--primary" onClick={submit}>Add to inventory</button>
      </div>
    </div>
  );
}
