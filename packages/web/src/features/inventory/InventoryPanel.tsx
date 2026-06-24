import { useInventory } from "../../store/inventory";
import { DiscForm } from "./DiscForm";

export function InventoryPanel() {
  const discs = useInventory((s) => s.discs);
  const remove = useInventory((s) => s.remove);
  const clear = useInventory((s) => s.clear);

  return (
    <section>
      <DiscForm />
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h3>Inventory ({discs.length})</h3>
        {discs.length > 0 && <button onClick={() => clear()}>Clear all</button>}
      </div>
      {discs.length === 0 ? (
        <p>No discs yet. Add some above.</p>
      ) : (
        <table>
          <thead>
            <tr><th>#</th><th>Slot</th><th>Set</th><th>Lv</th><th>Main</th><th>Substats</th><th /></tr>
          </thead>
          <tbody>
            {discs.map((d) => (
              <tr key={d.id}>
                <td>{d.id}</td>
                <td>{d.slot}</td>
                <td>{d.set}</td>
                <td>{d.level}</td>
                <td>{d.mainStat} {d.mainValue}</td>
                <td>{d.subs.map((s) => `${s.stat} ${s.value}`).join(", ")}</td>
                <td><button onClick={() => remove(d.id)}>✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
