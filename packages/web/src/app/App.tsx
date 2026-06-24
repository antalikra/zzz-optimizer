import { useEffect, useState } from "react";
import { useInventory } from "../store/inventory";
import { requestPersist } from "../services/storage";
import { BuildPage } from "../features/build/BuildPage";
import { InventoryPanel } from "../features/inventory/InventoryPanel";
import { DatabasePanel } from "../features/database/DatabasePanel";

type Tab = "build" | "inventory" | "database";

const TABS: { id: Tab; label: string }[] = [
  { id: "build", label: "Build" },
  { id: "inventory", label: "Inventory" },
  { id: "database", label: "Database" },
];

export function App() {
  const [tab, setTab] = useState<Tab>("build");

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

      {tab === "build" && <BuildPage />}
      {tab === "inventory" && <InventoryPanel />}
      {tab === "database" && <DatabasePanel />}
    </div>
  );
}
