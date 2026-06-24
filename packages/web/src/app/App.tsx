import { useEffect, useState } from "react";
import { useInventory } from "../store/inventory";
import { requestPersist } from "../services/storage";
import { InventoryPanel } from "../features/inventory/InventoryPanel";
import { OptimizerPanel } from "../features/optimizer/OptimizerPanel";

export function App() {
  const [tab, setTab] = useState<"inventory" | "optimize">("inventory");

  useEffect(() => {
    void useInventory.getState().hydrate();
    void requestPersist();
  }, []);

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1>ZZZ Optimizer</h1>
      <div className="tabs" style={{ marginBottom: 16 }}>
        <button className={tab === "inventory" ? "tab-active" : ""} onClick={() => setTab("inventory")}>
          Inventory
        </button>
        <button className={tab === "optimize" ? "tab-active" : ""} onClick={() => setTab("optimize")}>
          Optimize
        </button>
      </div>
      {tab === "inventory" ? <InventoryPanel /> : <OptimizerPanel />}
    </main>
  );
}
