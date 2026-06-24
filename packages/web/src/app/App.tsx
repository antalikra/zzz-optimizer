import { useEffect, useState } from "react";
import { useInventory } from "../store/inventory";
import { requestPersist } from "../services/storage";
import { InventoryPanel } from "../features/inventory/InventoryPanel";
import { OptimizerPanel } from "../features/optimizer/OptimizerPanel";
import { DatabasePanel } from "../features/database/DatabasePanel";

type Tab = "inventory" | "optimize" | "database";

const TABS: { id: Tab; label: string }[] = [
  { id: "inventory", label: "Inventory" },
  { id: "optimize", label: "Optimize" },
  { id: "database", label: "Database" },
];

export function App() {
  const [tab, setTab] = useState<Tab>("inventory");

  useEffect(() => {
    void useInventory.getState().hydrate();
    void requestPersist();
  }, []);

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1>ZZZ Optimizer</h1>
      <div className="tabs" style={{ marginBottom: 16 }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            className={tab === t.id ? "tab-active" : ""}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "inventory" && <InventoryPanel />}
      {tab === "optimize" && <OptimizerPanel />}
      {tab === "database" && <DatabasePanel />}
    </main>
  );
}
