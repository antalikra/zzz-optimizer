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
    <div className="app-shell">
      <header className="app-header">
        <h1 className="app-title">
          <span className="logo-dot" />
          ZZZ Optimizer
        </h1>
        <nav className="tabs-pill">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`tab-pill ${tab === t.id ? "is-active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {tab === "inventory" && <InventoryPanel />}
      {tab === "optimize" && <OptimizerPanel />}
      {tab === "database" && <DatabasePanel />}
    </div>
  );
}
