import { useRef, useState, type ChangeEvent } from "react";
import { useInventory } from "../../store/inventory";
import { exportInventory, parseImport } from "../../services/serialize";

export function DatabasePanel() {
  const discs = useInventory((s) => s.discs);
  const replaceAll = useInventory((s) => s.replaceAll);
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);

  function download() {
    const blob = new Blob([exportInventory(discs)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "zzz-inventory.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = parseImport(await file.text());
      replaceAll(imported);
      setMsg(`Imported ${imported.length} discs.`);
    } catch (err) {
      setMsg(`Import failed: ${String(err)}`);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <section>
      <h3>Database</h3>
      <div className="row">
        <button onClick={download} disabled={discs.length === 0}>
          Export ({discs.length})
        </button>
        <button onClick={() => fileRef.current?.click()}>Import…</button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          onChange={onFile}
          style={{ display: "none" }}
        />
      </div>
      {msg && <p>{msg}</p>}
      <p style={{ color: "#666", fontSize: 13 }}>
        Backup format: <code>zzz-optimizer</code> v1. Importing replaces the current inventory.
        ZZZOD scanner import and Enka UID import are planned next.
      </p>
    </section>
  );
}
