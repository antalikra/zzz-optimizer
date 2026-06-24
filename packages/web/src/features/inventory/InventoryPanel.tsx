import { useInventory } from "../../store/inventory";
import { DiscForm } from "./DiscForm";

export function InventoryPanel() {
  const discs = useInventory((s) => s.discs);
  const remove = useInventory((s) => s.remove);
  const clear = useInventory((s) => s.clear);

  return (
    <div className="stack">
      <DiscForm />

      <div className="card">
        <div className="row row--between" style={{ marginBottom: 16 }}>
          <h3 className="card__title" style={{ margin: 0 }}>Inventory · {discs.length}</h3>
          {discs.length > 0 && (
            <button className="btn btn--ghost btn--sm" onClick={() => clear()}>Clear all</button>
          )}
        </div>

        {discs.length === 0 ? (
          <p className="empty">No discs yet — add some above.</p>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Slot</th>
                  <th>Set</th>
                  <th>Lv</th>
                  <th>Main</th>
                  <th>Substats</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {discs.map((d) => (
                  <tr key={d.id}>
                    <td className="muted">{d.id}</td>
                    <td>{d.slot}</td>
                    <td>{d.set}</td>
                    <td>{d.level}</td>
                    <td>{d.mainStat} <span className="muted">{d.mainValue}</span></td>
                    <td className="muted">{d.subs.map((s) => `${s.stat} ${s.value}`).join(", ") || "—"}</td>
                    <td>
                      <button className="btn btn--icon btn--ghost" title="Remove" onClick={() => remove(d.id)}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
